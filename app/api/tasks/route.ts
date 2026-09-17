import { panelAccess, marketingAccount } from "@/lib/account-access";
import { database } from "@/lib/database";
import { validTask } from "@/lib/tasks";

async function access(request: Request) {
  return await panelAccess(request) || (!process.env.DATABASE_URL ? Response.json({ error: "Servidor no configurado." }, { status: 503 }) : null);
}
export async function GET(request: Request) {
  const denied = await access(request); if (denied) return denied;
  try {
    const db = await database(); const account = await marketingAccount(request);
    const result = account ? await db.query("SELECT task, version FROM focus_account_tasks WHERE account_id = $1 ORDER BY id", [account.id]) : await db.query("SELECT task, version FROM focus_tasks ORDER BY id");
    return Response.json({ tasks: result.rows.map(r => ({ ...r.task, version: r.version })) }, { headers: { "Cache-Control": "no-store" } });
  } catch { return Response.json({ error: "No se pudieron cargar las tareas." }, { status: 503 }); }
}
export async function PUT(request: Request) {
  const denied = await access(request); if (denied) return denied;
  let task;
  try { const raw = await request.text(); if (raw.length > 4096) throw new Error(); task = JSON.parse(raw); } catch { return Response.json({ error: "Tarea inválida." }, { status: 400 }); }
  if (!validTask(task)) return Response.json({ error: "Revisa el título, la fecha y la prioridad." }, { status: 400 });
  try {
    const db = await database();
    const account = await marketingAccount(request);
    if (account) {
      const result = task.version === 0
        ? await db.query("INSERT INTO focus_account_tasks(account_id,id,task,version) VALUES($1,$2,$3::jsonb,1) ON CONFLICT DO NOTHING RETURNING version", [account.id, task.id, JSON.stringify(task)])
        : await db.query("UPDATE focus_account_tasks SET task=$3::jsonb, version=version+1 WHERE account_id=$1 AND id=$2 AND version=$4 RETURNING version", [account.id, task.id, JSON.stringify(task), task.version]);
      if (!result.rows.length) return Response.json({ error: "La tarea cambió. Recarga antes de editarla." }, { status: 409 });
      return Response.json({ task: { ...task, version: result.rows[0].version } });
    }
    // A new task starts at version 0; every accepted edit advances its version.
    const result = task.version === 0
      ? await db.query("INSERT INTO focus_tasks(id,task,version) VALUES($1,$2::jsonb,1) ON CONFLICT DO NOTHING RETURNING version", [task.id, JSON.stringify(task)])
      : await db.query("UPDATE focus_tasks SET task=$2::jsonb, version=version+1 WHERE id=$1 AND version=$3 RETURNING version", [task.id, JSON.stringify(task), task.version]);
    if (!result.rows.length) return Response.json({ error: "La tarea cambió en otro dispositivo. Recarga las tareas antes de editarla." }, { status: 409 });
    return Response.json({ task: { ...task, version: result.rows[0].version } });
  } catch { return Response.json({ error: "No se pudo guardar la tarea." }, { status: 503 }); }
}
