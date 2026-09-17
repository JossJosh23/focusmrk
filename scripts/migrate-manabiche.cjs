/* eslint-disable @typescript-eslint/no-require-imports -- Standalone Node 22 command for Dokploy. */
// Node 22-compatible, explicit migration only. Never invoked by build/start/database().
const { Client } = require("pg");
const { createReadStream, statSync } = require("node:fs");
const { createHash } = require("node:crypto");
const { resolve } = require("node:path");
const { execFileSync } = require("node:child_process");
const { inspect, migrate } = require("./lib/manabiche-migration.cjs");

async function main() {
  const args = process.argv.slice(2);
  if (args.includes("--help")) { console.log("Revisar: npm run migrate:manabiche -- --check\nAplicar: npm run migrate:manabiche -- --apply --all-content-is-manabiche --backup /ruta/respaldo.dump"); return; }
  const apply = args.includes("--apply");
  const backupIndex = args.indexOf("--backup");
  const allowed = new Set(["--apply", "--check", "--all-content-is-manabiche", "--backup"]);
  if (args.some((arg, index) => !(backupIndex >= 0 && index === backupIndex + 1) && !allowed.has(arg)) || (apply && args.includes("--check"))) throw new Error("Argumentos no válidos. Usa --help.");
  if (!process.env.DATABASE_URL) throw new Error("Falta DATABASE_URL. Ejecuta dentro del contenedor de la aplicación o carga el entorno de una copia de pruebas.");
  if (!process.env.PANEL_USER || !process.env.PANEL_PASSWORD || process.env.PANEL_PASSWORD.length < 16) throw new Error("Mantén PANEL_USER y PANEL_PASSWORD actuales (mínimo 16 caracteres).");
  let backupSha256;
  if (apply) {
    if (!args.includes("--all-content-is-manabiche")) throw new Error("Revisa primero --check y confirma que todo el contenido existente es de Manabiche.");
    if (backupIndex < 0 || !args[backupIndex + 1]) throw new Error("Es obligatorio indicar --backup con un pg_dump completo descargado y probado en una copia.");
    const path = resolve(args[backupIndex + 1]);
    if (!statSync(path).isFile() || statSync(path).size < 100) throw new Error("El respaldo está vacío o no es un archivo.");
    let listing;
    try { listing = execFileSync("pg_restore", ["--list", path], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], maxBuffer: 20 * 1024 * 1024 }); }
    catch { throw new Error("No se pudo leer el respaldo. Necesitas pg_restore compatible con el servidor y un respaldo de formato custom (-Fc)."); }
    if (!["focus_panel", "focus_media"].every(table => new RegExp(`TABLE DATA public ${table} `).test(listing))) throw new Error("El respaldo no contiene los datos de focus_panel y focus_media.");
    const hash = createHash("sha256");
    for await (const chunk of createReadStream(path)) hash.update(chunk);
    backupSha256 = hash.digest("hex");
  }
  const client = new Client({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 10000 });
  try {
    await client.connect();
    if (apply) console.log(JSON.stringify(await migrate(client, { login: process.env.PANEL_USER, backupSha256 }), null, 2));
    else {
      await client.query("BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY");
      console.log(JSON.stringify(await inspect(client), null, 2));
      await client.query("ROLLBACK");
      console.log("Solo revisión: no se modificó ningún dato. Verifica que todas las marcas listadas pertenecen a Manabiche.");
    }
  } finally { await client.end(); }
}
main().catch(error => {
  // Do not log connection strings, PostgreSQL errors with user data, or credentials.
  console.error(error.code ? `Operación cancelada (${error.code}). Revisa conectividad, permisos y conflictos; no compartas credenciales.` : error.message);
  process.exitCode = 1;
});
