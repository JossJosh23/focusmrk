import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { PGlite } from "@electric-sql/pglite";
const { inspect, migrate } = createRequire(import.meta.url)("../scripts/lib/manabiche-migration.cjs");
const options = { login: "existing-manager", backupSha256: "a".repeat(64) };
async function fixture() {
  const pg = new PGlite();
  await pg.exec(`CREATE TABLE focus_panel (id INTEGER PRIMARY KEY, version INTEGER NOT NULL, posts JSONB, templates JSONB, updated_at TIMESTAMPTZ DEFAULT now());
    CREATE TABLE focus_media (id TEXT PRIMARY KEY, name TEXT, brand TEXT, type TEXT, size INTEGER, created_at TIMESTAMPTZ, data BYTEA);
    CREATE TABLE focus_tasks (id TEXT PRIMARY KEY, task JSONB, version INTEGER);
    INSERT INTO focus_tasks VALUES ('task1', '{"title":"Preparar contenido"}', 3);`);
  const posts = [{ id: "post1", title: "Oferta", date: "2026-09-01", time: "12:00", copy: "Texto\ncon acentos: Manabí", mediaId: "image1", brand: "Mi marca", paid: true, status: "Aprobado", footer: "Contacto", networks: ["Instagram"] }, { id: "post2", mediaId: "video1", brand: "Nombre anterior", title: "Video" }];
  await pg.query("INSERT INTO focus_panel (id, version, posts, templates) VALUES (1, 7, $1::jsonb, $2::jsonb)", [JSON.stringify(posts), JSON.stringify([{ id: "template1", copy: "Conservar" }])]);
  await pg.query("INSERT INTO focus_media VALUES ('image1', 'photo.png', 'Mi marca', 'image/png', 4, now(), $1), ('video1', 'clip.mp4', 'Nombre anterior', 'video/mp4', 4, now(), $2)", [new Uint8Array([0, 1, 254, 255]), new Uint8Array([4, 3, 2, 0])]);
  const db = { query: (sql, params) => sql.includes("pg_advisory_xact_lock") ? Promise.resolve({ rows: [] }) : pg.query(sql, params) };
  return { pg, db, posts };
}
test("Manabiche migration preserves content and binary files, links the existing user, and is idempotent", async () => {
  const { pg, db, posts } = await fixture();
  try {
    const before = await inspect(db);
    assert.equal(before.applied, false); assert.equal(before.posts, 2); assert.equal(before.files, 2);
    assert.equal((await pg.query("SELECT to_regclass('focus_users') AS name")).rows[0].name, null);
    const result = await migrate(db, options);
    assert.equal(result.fingerprint, before.fingerprint);
    const panel = (await pg.query("SELECT * FROM focus_panel")).rows[0];
    assert.deepEqual(panel.posts, posts.map(post => ({ ...post, brand: "Manabiche" })));
    assert.equal(panel.version, 8); assert.equal(panel.company_id, "manabiche");
    const media = (await pg.query("SELECT * FROM focus_media ORDER BY id")).rows;
    assert.deepEqual(Array.from(media[0].data), [0, 1, 254, 255]); assert.deepEqual(Array.from(media[1].data), [4, 3, 2, 0]);
    assert.ok(media.every(asset => asset.company_id === "manabiche" && asset.brand === "Manabiche"));
    const user = (await pg.query("SELECT * FROM focus_users")).rows[0];
    assert.equal(user.login, options.login); assert.equal(user.auth_provider, "panel_env"); assert.equal(user.password, undefined);
    assert.equal((await pg.query("SELECT role FROM focus_memberships")).rows[0].role, "marketing_manager");
    assert.equal((await pg.query("SELECT task FROM focus_tasks")).rows[0].task.title, "Preparar contenido");
    assert.equal((await migrate(db, options)).alreadyApplied, true);
    assert.equal((await pg.query("SELECT version FROM focus_panel")).rows[0].version, 8);
    await assert.rejects(migrate(db, { ...options, login: "someone-else" }), /otro PANEL_USER/);
    assert.equal((await inspect(db)).applied, true);
  } finally { await pg.close(); }
});
test("migration rejects missing backup evidence or broken media references without writes", async () => {
  const { pg, db } = await fixture();
  try {
    await assert.rejects(migrate(db, { login: options.login }), /respaldo/);
    await pg.query("DELETE FROM focus_media WHERE id = 'video1'");
    await assert.rejects(migrate(db, options), /archivos ausentes/);
    assert.equal((await pg.query("SELECT version FROM focus_panel")).rows[0].version, 7);
    assert.equal((await pg.query("SELECT to_regclass('focus_users') AS name")).rows[0].name, null);
  } finally { await pg.close(); }
});
test("failed post-migration verification rolls back binary changes, tables, and assignments", async () => {
  const { pg, db } = await fixture();
  try {
    await pg.exec(`CREATE FUNCTION damage_media() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN NEW.data := decode('09090909','hex'); RETURN NEW; END; $$;
      CREATE TRIGGER unexpected_write BEFORE UPDATE ON focus_media FOR EACH ROW EXECUTE FUNCTION damage_media();`);
    await assert.rejects(migrate(db, options), /verificación/);
    assert.deepEqual(Array.from((await pg.query("SELECT data FROM focus_media WHERE id = 'image1'")).rows[0].data), [0, 1, 254, 255]);
    assert.equal((await pg.query("SELECT version FROM focus_panel")).rows[0].version, 7);
    assert.equal((await pg.query("SELECT to_regclass('focus_organizations') AS name")).rows[0].name, null);
  } finally { await pg.close(); }
});
