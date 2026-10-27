import { database } from "@/lib/database";
import { marketingAccount, panelAccess } from "@/lib/account-access";
import { newReviewToken, panelPosts, REVIEW_COLUMNS, type PostReview } from "@/lib/post-reviews";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

/** Post ids this session may manage: every post for the owner, assigned companies for a marketing account. */
async function visiblePostIds(request: Request) {
  const db = await database();
  const account = await marketingAccount(request);
  const posts = await panelPosts(db);
  return { db, ids: new Set(posts.filter(post => !account || account.companies.includes(post.brand)).map(post => post.id)) };
}

/** Approval links and decisions for the visible posts (or one, with ?postId=). */
export async function GET(request: Request) {
  const denied = await panelAccess(request); if (denied) return denied;
  try {
    const { db, ids } = await visiblePostIds(request);
    const postId = new URL(request.url).searchParams.get("postId");
    const { rows } = await db.query(`SELECT ${REVIEW_COLUMNS} FROM focus_post_reviews${postId ? " WHERE post_id = $1" : ""}`, postId ? [postId] : []);
    return json((rows as PostReview[]).filter(review => ids.has(review.postId)));
  } catch { return json({ error: "No se pudieron cargar las aprobaciones." }, 503); }
}

/** { postId, regenerate? } → the post's link, created on first use. `regenerate` revokes the previous link and its decision. */
export async function POST(request: Request) {
  const denied = await panelAccess(request); if (denied) return denied;
  let body: { postId?: unknown; regenerate?: unknown };
  try { body = await request.json(); } catch { return json({ error: "Solicitud no válida." }, 400); }
  if (typeof body.postId !== "string" || !body.postId) return json({ error: "Falta la publicación." }, 400);
  try {
    const { db, ids } = await visiblePostIds(request);
    if (!ids.has(body.postId)) return json({ error: "Guarda la publicación antes de compartirla." }, 404);
    if (body.regenerate === true) await db.query("DELETE FROM focus_post_reviews WHERE post_id = $1", [body.postId]);
    await db.query("INSERT INTO focus_post_reviews (token, post_id) VALUES ($1, $2) ON CONFLICT (post_id) DO NOTHING", [newReviewToken(), body.postId]);
    return json((await db.query(`SELECT ${REVIEW_COLUMNS} FROM focus_post_reviews WHERE post_id = $1`, [body.postId])).rows[0]);
  } catch { return json({ error: "No se pudo crear el enlace de aprobación." }, 503); }
}

/** { items: [{ postId, decidedAt }] } → the calendar applied these decisions to the posts' status.
 *  Matching decidedAt keeps a newer answer (given meanwhile) pending. */
export async function PATCH(request: Request) {
  const denied = await panelAccess(request); if (denied) return denied;
  let body: { items?: unknown };
  try { body = await request.json(); } catch { return json({ error: "Solicitud no válida." }, 400); }
  const items = Array.isArray(body.items) ? body.items.filter((item): item is { postId: string; decidedAt: string } =>
    !!item && typeof item.postId === "string" && typeof item.decidedAt === "string" && !Number.isNaN(Date.parse(item.decidedAt))) : [];
  if (!items.length) return json({ error: "Solicitud no válida." }, 400);
  try {
    const { db, ids } = await visiblePostIds(request);
    const allowed = items.filter(item => ids.has(item.postId));
    if (allowed.length) await db.query("UPDATE focus_post_reviews r SET applied_at = now() FROM unnest($1::text[], $2::timestamptz[]) AS a(post_id, decided_at) WHERE r.post_id = a.post_id AND r.decided_at = a.decided_at", [allowed.map(item => item.postId), allowed.map(item => item.decidedAt)]);
    return json({ ok: true });
  } catch { return json({ error: "No se pudo actualizar la aprobación." }, 503); }
}

/** ?postId= → revokes the link; anyone holding it loses access. */
export async function DELETE(request: Request) {
  const denied = await panelAccess(request); if (denied) return denied;
  const postId = new URL(request.url).searchParams.get("postId") || "";
  try {
    const { db, ids } = await visiblePostIds(request);
    if (!ids.has(postId)) return json({ error: "Publicación no disponible." }, 404);
    await db.query("DELETE FROM focus_post_reviews WHERE post_id = $1", [postId]);
    return json({ ok: true });
  } catch { return json({ error: "No se pudo desactivar el enlace." }, 503); }
}
