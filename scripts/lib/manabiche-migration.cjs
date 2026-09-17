/* eslint-disable @typescript-eslint/no-require-imports -- Standalone Node 22 command for Dokploy. */
const { createHash } = require("node:crypto");
const MIGRATION = "20260916_manabiche_manager_v1";
const COMPANY_ID = "manabiche";
const USER_ID = "legacy-marketing-manager";
const COMPANY_NAME = "Manabiche";
function assert(condition, message) { if (!condition) throw new Error(message); }
async function exists(db, table) { return !!(await db.query("SELECT to_regclass($1) AS name", [`public.${table}`])).rows[0].name; }
function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === "object") return Object.fromEntries(Object.keys(value).sort().map(key => [key, canonical(value[key])]));
  return value;
}
function digest(value) { return createHash("sha256").update(JSON.stringify(canonical(value))).digest("hex"); }
async function inventory(db) {
  assert(await exists(db, "focus_panel") && await exists(db, "focus_media"), "No se encontró la base existente de FocusMRK. No se creará una base vacía.");
  const rows = (await db.query("SELECT id, version, posts, templates FROM focus_panel ORDER BY id")).rows;
  assert(rows.length === 1 && rows[0].id === 1, "Se esperaba un único panel existente.");
  const panel = rows[0];
  assert(Array.isArray(panel.posts) && Array.isArray(panel.templates), "El calendario no tiene un formato válido.");
  assert(panel.posts.every(post => post && typeof post.id === "string" && typeof post.mediaId === "string"), "Hay publicaciones no válidas.");
  assert(new Set(panel.posts.map(post => post.id)).size === panel.posts.length, "Hay publicaciones con identificadores repetidos.");
  // Compare database-side binary hashes without downloading videos into Node memory.
  const media = (await db.query('SELECT id, name, brand, type, size, created_at::text AS created, md5(data) AS checksum, octet_length(data) AS bytes FROM focus_media ORDER BY id')).rows;
  const ids = new Set(media.map(asset => asset.id));
  assert(panel.posts.every(post => !post.mediaId || ids.has(post.mediaId)), "Hay publicaciones con archivos ausentes. Corrige las referencias antes de migrar.");
  assert(media.every(asset => Number(asset.size) === Number(asset.bytes)), "El tamaño registrado no coincide con algún archivo.");
  const brands = [...new Set([...panel.posts.map(post => post.brand || "(sin empresa)"), ...media.map(asset => asset.brand)])].sort();
  const stripBrand = item => { const copy = { ...item }; delete copy.brand; return copy; };
  const unchanged = { posts: panel.posts.map(stripBrand), templates: panel.templates, media: media.map(stripBrand) };
  const extras = {};
  for (const table of ["focus_tasks", "focus_notification_settings", "focus_push_subscriptions", "focus_push_deliveries", "focus_push_health", "focus_company_profiles"]) {
    if (await exists(db, table)) extras[table] = (await db.query(`SELECT to_jsonb(t) AS value FROM ${table} t ORDER BY to_jsonb(t)::text`)).rows.map(row => row.value);
  }
  return { panel, brands, posts: panel.posts.length, files: media.length, bytes: media.reduce((n, item) => n + Number(item.bytes), 0), templates: panel.templates.length, fingerprint: digest(unchanged), extrasFingerprint: digest(extras) };
}
async function inspect(db) {
  const result = await inventory(db);
  const applied = await exists(db, "focus_migrations") && !!(await db.query("SELECT id FROM focus_migrations WHERE id = $1", [MIGRATION])).rows.length;
  return { applied, posts: result.posts, files: result.files, bytes: result.bytes, templates: result.templates, companiesDetected: result.brands, fingerprint: result.fingerprint };
}
async function migrate(db, { login, backupSha256 }) {
  assert(typeof login === "string" && login.trim() && login.length <= 200, "Falta PANEL_USER o no es válido.");
  assert(/^[a-f0-9]{64}$/.test(backupSha256 || ""), "Falta un respaldo verificado.");
  await db.query("BEGIN");
  try {
    await db.query("SET LOCAL lock_timeout = '10s'");
    await db.query("SELECT pg_advisory_xact_lock(81734922)");
    if (await exists(db, "focus_migrations")) {
      const prior = (await db.query("SELECT details FROM focus_migrations WHERE id = $1", [MIGRATION])).rows[0];
      if (prior) {
        assert(prior.details.login === login, "La migración ya pertenece a otro PANEL_USER. No se reasignará automáticamente.");
        await db.query("COMMIT"); return { alreadyApplied: true, ...prior.details };
      }
    }
    // Stop concurrent application writes during verification and assignment.
    assert(await exists(db, "focus_panel") && await exists(db, "focus_media"), "No se encontró la base de FocusMRK.");
    await db.query("LOCK TABLE focus_panel, focus_media IN ACCESS EXCLUSIVE MODE");
    for (const table of ["focus_tasks", "focus_notification_settings", "focus_push_subscriptions", "focus_push_deliveries", "focus_push_health", "focus_company_profiles"]) {
      if (await exists(db, table)) await db.query(`LOCK TABLE ${table} IN SHARE MODE`);
    }
    const before = await inventory(db);
    await db.query("CREATE TABLE IF NOT EXISTS focus_organizations (id TEXT PRIMARY KEY, name TEXT NOT NULL UNIQUE, created_at TIMESTAMPTZ NOT NULL DEFAULT now())");
    await db.query("CREATE TABLE IF NOT EXISTS focus_users (id TEXT PRIMARY KEY, login TEXT NOT NULL UNIQUE, display_name TEXT NOT NULL, auth_provider TEXT NOT NULL CHECK (auth_provider = 'panel_env'), created_at TIMESTAMPTZ NOT NULL DEFAULT now())");
    await db.query("CREATE TABLE IF NOT EXISTS focus_memberships (user_id TEXT NOT NULL REFERENCES focus_users(id), company_id TEXT NOT NULL REFERENCES focus_organizations(id), role TEXT NOT NULL CHECK (role IN ('marketing_manager', 'administrator')), PRIMARY KEY (user_id, company_id))");
    await db.query("CREATE TABLE IF NOT EXISTS focus_migrations (id TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT now(), details JSONB NOT NULL)");
    // Deliberately fail on conflicting identities, instead of silently merging clients.
    await db.query("INSERT INTO focus_organizations (id, name) VALUES ($1, $2)", [COMPANY_ID, COMPANY_NAME]);
    await db.query("INSERT INTO focus_users (id, login, display_name, auth_provider) VALUES ($1, $2, $3, 'panel_env')", [USER_ID, login, "Gestor de marketing de Manabiche"]);
    await db.query("INSERT INTO focus_memberships (user_id, company_id, role) VALUES ($1, $2, 'marketing_manager')", [USER_ID, COMPANY_ID]);
    await db.query("ALTER TABLE focus_panel ADD COLUMN IF NOT EXISTS company_id TEXT REFERENCES focus_organizations(id)");
    await db.query("ALTER TABLE focus_media ADD COLUMN IF NOT EXISTS company_id TEXT REFERENCES focus_organizations(id)");
    assert(!(await db.query("SELECT id FROM focus_panel WHERE company_id IS NOT NULL")).rows.length, "El panel ya tiene una empresa asignada.");
    assert(!(await db.query("SELECT id FROM focus_media WHERE company_id IS NOT NULL LIMIT 1")).rows.length, "Hay archivos que ya pertenecen a otra empresa.");
    const posts = before.panel.posts.map(post => ({ ...post, brand: COMPANY_NAME }));
    await db.query("UPDATE focus_panel SET posts = $1::jsonb, company_id = $2, version = version + 1, updated_at = now() WHERE id = 1", [JSON.stringify(posts), COMPANY_ID]);
    await db.query("UPDATE focus_media SET brand = $1, company_id = $2", [COMPANY_NAME, COMPANY_ID]);
    await db.query("CREATE TABLE IF NOT EXISTS focus_companies (name TEXT PRIMARY KEY)");
    await db.query("INSERT INTO focus_companies (name) VALUES ($1) ON CONFLICT DO NOTHING", [COMPANY_NAME]);
    const after = await inventory(db);
    assert(before.fingerprint === after.fingerprint && before.extrasFingerprint === after.extrasFingerprint, "La verificación detectó un cambio inesperado. Se canceló la migración.");
    const details = { login, companyId: COMPANY_ID, company: COMPANY_NAME, role: "marketing_manager", posts: after.posts, files: after.files, bytes: after.bytes, templates: after.templates, fingerprint: after.fingerprint, backupSha256, previousVersion: before.panel.version };
    await db.query("INSERT INTO focus_migrations (id, details) VALUES ($1, $2::jsonb)", [MIGRATION, JSON.stringify(details)]);
    await db.query("COMMIT"); return { alreadyApplied: false, ...details };
  } catch (error) { await db.query("ROLLBACK"); throw error; }
}
module.exports = { inspect, migrate, MIGRATION };
