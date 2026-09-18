import { panelAccess, marketingAccount, changeAccountPassword } from "@/lib/account-access";
import { database } from "@/lib/database";
import { SESSION_COOKIE } from "@/lib/panel-auth";

const headers = { "Cache-Control": "no-store" };
const failure = (error: string, status: number) => Response.json({ error }, { status, headers });

export async function GET(request: Request) {
  const denied = await panelAccess(request); if (denied) return denied;
  if (!process.env.DATABASE_URL) return Response.json({ account: null }, { headers });
  try {
    const account = await marketingAccount(request);
    if (account) return Response.json({ account: { ...account, role: "marketing_manager", company: account.companies.join(", "), canChangePassword: true } }, { headers });
    const { rows } = await (await database()).query("SELECT display_name FROM focus_owner_profiles WHERE login = $1", [process.env.PANEL_USER]);
    return Response.json({ account: { login: process.env.PANEL_USER, display_name: rows[0]?.display_name || process.env.PANEL_USER, role: "administrator", company: "Todas las empresas", canChangePassword: false } }, { headers });
  } catch { return failure("No se pudo cargar tu perfil. Inténtalo de nuevo.", 503); }
}

async function mutationAccess(request: Request) {
  const denied = await panelAccess(request); if (denied) return denied;
  if (!process.env.DATABASE_URL) return failure("El perfil local se guarda en este navegador.", 409);
  if (request.headers.get("sec-fetch-site") === "cross-site" || request.headers.get("x-focusmrk-request") !== "1") return failure("Solicitud no permitida.", 403);
  return null;
}

export async function PUT(request: Request) {
  const denied = await mutationAccess(request); if (denied) return denied;
  let body;
  try { const raw = await request.text(); if (raw.length > 4096) return failure("Perfil demasiado largo.", 413); body = JSON.parse(raw); }
  catch { return failure("Datos no válidos.", 400); }
  if (!body || typeof body.display_name !== "string" || !body.display_name.trim() || body.display_name.trim().length > 80) return failure("Escribe un nombre de entre 1 y 80 caracteres.", 400);
  try {
    const name = body.display_name.trim();
    const account = await marketingAccount(request);
    const db = await database();
    if (account) {
      const { rows } = await db.query("UPDATE focus_accounts SET display_name = $2 WHERE id = $1 AND enabled = true RETURNING id", [account.id, name]);
      if (!rows.length) return failure("La cuenta ya no está disponible.", 401);
    } else {
      await db.query("INSERT INTO focus_owner_profiles (login, display_name) VALUES ($1, $2) ON CONFLICT (login) DO UPDATE SET display_name = EXCLUDED.display_name", [process.env.PANEL_USER, name]);
    }
    return Response.json({ display_name: name }, { headers });
  } catch { return failure("No se pudo guardar tu perfil.", 503); }
}

export async function PATCH(request: Request) {
  const denied = await mutationAccess(request); if (denied) return denied;
  let body;
  try { const raw = await request.text(); if (raw.length > 4096) return failure("Solicitud demasiado larga.", 413); body = JSON.parse(raw); }
  catch { return failure("Datos no válidos.", 400); }
  if (!body || typeof body.currentPassword !== "string" || body.currentPassword.length > 1024 || typeof body.newPassword !== "string" || body.newPassword.length < 16 || body.newPassword.length > 1024 || body.newPassword === body.currentPassword) return failure("Usa una contraseña nueva de entre 16 y 1024 caracteres.", 400);
  try {
    const account = await marketingAccount(request);
    if (!account) return failure("La contraseña de administrador se administra en la configuración del servidor.", 409);
    if (!await changeAccountPassword(account.id, body.currentPassword, body.newPassword)) return failure("La contraseña actual no es correcta.", 400);
    return Response.json({ reauthenticate: true }, { headers: {
      ...headers,
      "Set-Cookie": `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${process.env.NODE_ENV === "production" ? "; Secure" : ""}`,
    } });
  } catch { return failure("No se pudo cambiar la contraseña. Inténtalo de nuevo.", 503); }
}
