import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";

test("database enforces membership, read-only clients, version conflicts and revocation", async () => {
  const db = new PGlite();
  try {
    // Substitute only Supabase's auth identities; execute the production schema and RPCs unchanged.
    await db.exec(`
      create role anon; create role authenticated;
      create schema auth;
      create table auth.users(id uuid primary key, email text, email_confirmed_at timestamptz);
      create function auth.uid() returns uuid language sql stable as $$
        select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid;
      $$;
      grant usage on schema auth to authenticated, anon;
      insert into auth.users values
        ('00000000-0000-0000-0000-000000000001', 'owner@example.test', now()),
        ('00000000-0000-0000-0000-000000000002', 'editor@example.test', now()),
        ('00000000-0000-0000-0000-000000000003', 'client@example.test', now()),
        ('00000000-0000-0000-0000-000000000004', 'outsider@example.test', now());
    `);
    await db.exec(await readFile(new URL("../supabase/migrations/20260910_shared_calendar.sql", import.meta.url), "utf8"));
    async function asUser(n) {
      await db.exec("reset role; set role authenticated;");
      await db.query("select set_config('request.jwt.claim.sub', $1, false)", [`00000000-0000-0000-0000-${String(n).padStart(12, "0")}`]);
    }
    await asUser(1);
    const created = await db.query("select public.focus_create_workspace('Mi marca') as id");
    const id = created.rows[0].id;
    await db.query("select public.focus_add_member($1, 'editor@example.test', 'editor')", [id]);
    await db.query("select public.focus_add_member($1, 'client@example.test', 'viewer')", [id]);
    // Updating an existing collaborator must work, not fail on ambiguous SQL names.
    await db.query("select public.focus_add_member($1, 'editor@example.test', 'editor')", [id]);
    await asUser(2);
    assert.equal((await db.query("select * from public.focus_workspaces")).rows.length, 1);
    const saved = await db.query("select public.focus_save_workspace($1, 1, '[]', '[]') as value", [id]);
    assert.equal(saved.rows[0].value.version, 2);
    await assert.rejects(db.query("select public.focus_save_workspace($1, 1, '[]', '[]')", [id]), /CONFLICT/);
    await assert.rejects(db.query("select public.focus_add_member($1, 'outsider@example.test', 'editor')", [id]), /propietario/);
    await assert.rejects(db.query("update public.focus_workspaces set owner_id = auth.uid() where id = $1", [id]), /permission denied/);
    await asUser(3);
    assert.equal((await db.query("select * from public.focus_workspaces")).rows.length, 1);
    await assert.rejects(db.query("select public.focus_save_workspace($1, 2, '[]', '[]')", [id]), /permiso/);
    await asUser(4);
    assert.equal((await db.query("select * from public.focus_workspaces")).rows.length, 0);
    assert.equal((await db.query("select * from public.focus_members")).rows.length, 0);
    await assert.rejects(db.query("select public.focus_save_workspace($1, 2, '[]', '[]')", [id]), /permiso/);
    await asUser(1);
    await db.query("select public.focus_remove_member($1, '00000000-0000-0000-0000-000000000002')", [id]);
    await asUser(2);
    assert.equal((await db.query("select * from public.focus_workspaces")).rows.length, 0);
    await assert.rejects(db.query("select public.focus_save_workspace($1, 2, '[]', '[]')", [id]), /permiso/);
    await db.exec("reset role; set role anon;");
    await assert.rejects(db.query("select * from public.focus_workspaces"), /permission denied/);
    await assert.rejects(db.query("select public.focus_create_workspace('Uninvited')"), /permission denied/);
  } finally { await db.close(); }
});
