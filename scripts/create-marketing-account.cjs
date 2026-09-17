/* eslint-disable @typescript-eslint/no-require-imports */
// Run once in the deployed app container. Never changes PANEL_USER/PANEL_PASSWORD.
const { Client } = require("pg");
const { randomBytes, randomUUID, scryptSync } = require("node:crypto");
async function createMarketingAccount(db, login = "gestor_marketing", company = "Manabiche") {
  if (!/^[a-zA-Z0-9_.-]{3,80}$/.test(login) || login.toLowerCase() === (process.env.PANEL_USER || "").toLowerCase()) throw new Error("Elige un usuario nuevo, distinto del administrador.");
  if (!company.trim() || company.length > 80) throw new Error("Empresa no válida.");
  try {
    await db.query("BEGIN");
    await db.query("SELECT pg_advisory_xact_lock(81734921)");
    const found = await db.query("SELECT 1 FROM focus_panel, jsonb_array_elements(posts) p WHERE p->>'brand' = $1 UNION ALL SELECT 1 FROM focus_media WHERE brand = $1 LIMIT 1", [company]);
    if (!found.rows.length) throw new Error("La empresa no tiene contenido identificado. Verifica primero la migración de Manabiche en producción.");
    await db.query(`CREATE TABLE IF NOT EXISTS focus_accounts (
      id text PRIMARY KEY, login text UNIQUE NOT NULL, display_name text NOT NULL,
      role text NOT NULL CHECK(role = 'marketing_manager'), salt text NOT NULL, password_hash text NOT NULL,
      enabled boolean NOT NULL DEFAULT true, templates jsonb NOT NULL DEFAULT '[]', created_at timestamptz NOT NULL DEFAULT now())`);
    await db.query("CREATE TABLE IF NOT EXISTS focus_account_companies (account_id text REFERENCES focus_accounts(id) ON DELETE CASCADE, company text NOT NULL, PRIMARY KEY(account_id, company))");
    await db.query("CREATE TABLE IF NOT EXISTS focus_account_sessions (token_hash text PRIMARY KEY, account_id text NOT NULL REFERENCES focus_accounts(id) ON DELETE CASCADE, expires_at timestamptz NOT NULL)");
    await db.query("CREATE TABLE IF NOT EXISTS focus_account_tasks (account_id text REFERENCES focus_accounts(id) ON DELETE CASCADE, id text NOT NULL, task jsonb NOT NULL, version integer NOT NULL DEFAULT 0, PRIMARY KEY(account_id, id))");
    if ((await db.query("SELECT 1 FROM focus_accounts WHERE lower(login) = lower($1)", [login])).rows.length) throw new Error("El usuario ya existe. No se modificó su contraseña.");
    const id = randomUUID(); const password = randomBytes(24).toString("base64url"); const salt = randomBytes(32).toString("hex");
    const hash = scryptSync(password, salt, 64).toString("hex");
    await db.query("INSERT INTO focus_accounts(id, login, display_name, role, salt, password_hash) VALUES ($1, $2, $3, 'marketing_manager', $4, $5)", [id, login, "Gestor de marketing", salt, hash]);
    await db.query("INSERT INTO focus_account_companies(account_id, company) VALUES ($1, $2)", [id, company]);
    await db.query("COMMIT");
    return { id, login, password, company };
  } catch (error) { await db.query("ROLLBACK"); throw error; }
}
async function main() {
  if (!process.env.DATABASE_URL) throw new Error("Falta DATABASE_URL.");
  const db = new Client({ connectionString: process.env.DATABASE_URL });
  await db.connect();
  try {
    const account = await createMarketingAccount(db, process.argv[2], process.argv[3]);
    console.log(`Cuenta creada\nUsuario: ${account.login}\nContraseña (guárdala ahora): ${account.password}\nRol: Gestor de marketing\nEmpresa asignada: ${account.company}\nLa cuenta administradora y el contenido no se modificaron.`);
  } finally { await db.end(); }
}
module.exports = { createMarketingAccount };
if (require.main === module) main().catch(error => { console.error(error.message); process.exitCode = 1; });
