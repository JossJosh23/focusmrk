/* eslint-disable @typescript-eslint/no-require-imports -- Standalone Node 22 command for Dokploy. */
const { execFileSync } = require("node:child_process");
const { existsSync, mkdirSync, chmodSync, renameSync } = require("node:fs");
const { resolve, dirname } = require("node:path");
function main() {
  if (process.argv.includes("--help")) { console.log("npm run db:backup -- /ruta/privada/focusmrk.dump (requiere pg_dump y pg_restore compatibles)"); return; }
  const target = process.argv[2];
  if (!target || !process.env.DATABASE_URL) throw new Error("Indica el archivo de salida y configura DATABASE_URL en el entorno; no la pegues en el comando.");
  const path = resolve(target); const partial = `${path}.partial`;
  if (existsSync(path) || existsSync(partial)) throw new Error("Ya existe el archivo. Elige otro nombre; no se sobrescriben respaldos.");
  const url = new URL(process.env.DATABASE_URL);
  if (!["postgres:", "postgresql:"].includes(url.protocol)) throw new Error("DATABASE_URL no es PostgreSQL.");
  // Supply credentials via the child environment, never command arguments or output.
  const env = { ...process.env, PGHOST: url.hostname, PGPORT: url.port || "5432", PGDATABASE: decodeURIComponent(url.pathname.slice(1)), PGUSER: decodeURIComponent(url.username), PGPASSWORD: decodeURIComponent(url.password) };
  if (url.searchParams.has("sslmode")) env.PGSSLMODE = url.searchParams.get("sslmode");
  for (const key of url.searchParams.keys()) if (key !== "sslmode") throw new Error("La conexión incluye opciones adicionales. Usa pg_dump configurado por el administrador para conservarlas.");
  mkdirSync(dirname(path), { recursive: true, mode: 0o700 });
  process.umask(0o077);
  try {
    execFileSync("pg_dump", ["--format=custom", "--no-owner", "--no-acl", "--file", partial], { env, stdio: ["ignore", "ignore", "pipe"] });
    execFileSync("pg_restore", ["--list", partial], { stdio: ["ignore", "ignore", "pipe"] });
  } catch { throw new Error("No se pudo generar o verificar el respaldo. Comprueba pg_dump/pg_restore, su versión y la conexión. Un archivo .partial no es un respaldo confirmado."); }
  chmodSync(partial, 0o600); renameSync(partial, path);
  console.log(`Respaldo completo creado: ${path}\nDescárgalo fuera del servidor y prueba restaurarlo en una base vacía. No contiene roles ni permisos del servidor PostgreSQL.`);
}
try { main(); } catch (error) { console.error(error.message); process.exitCode = 1; }
