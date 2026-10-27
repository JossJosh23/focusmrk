import { database } from "@/lib/database";
import { postMediaIds } from "@/lib/calendar";
import { COMMENT_MAX, REVIEWER_MAX, reviewByToken, reviewerView, REVIEW_COLUMNS } from "@/lib/post-reviews";
import { socialProfiles } from "@/lib/social-profiles";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Public: the approval link's token is the only credential (see proxy.ts). Never expose anything beyond the preview.
const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { "Cache-Control": "no-store", "X-Robots-Tag": "noindex" } });
const GONE = "Este enlace ya no es válido. Pide uno nuevo a quien te lo envió.";

export async function GET(request: Request) {
  try {
    const db = await database();
    const found = await reviewByToken(db, new URL(request.url).searchParams.get("token") || "");
    if (!found) return json({ error: GONE }, 404);
    const { review, post } = found;
    if (!post) return json({ error: "Esta publicación fue eliminada." }, 410);
    const ids = postMediaIds(post);
    const assets = ids.length ? (await db.query('SELECT id, name, brand, type, size, created_at AS "createdAt" FROM focus_media WHERE id = ANY($1::text[])', [ids])).rows : [];
    const profiles = await socialProfiles(post.brand).catch(() => ({}));
    return json({ post: reviewerView(post), assets, profiles, review: { decision: review.decision, reviewer: review.reviewer, comment: review.comment, decidedAt: review.decidedAt } });
  } catch { return json({ error: "No se pudo cargar la publicación. Inténtalo de nuevo en unos minutos." }, 503); }
}

/** { token, decision: "approved" | "changes", reviewer, comment } — a later decision replaces the previous one. */
export async function POST(request: Request) {
  if (request.headers.get("sec-fetch-site") === "cross-site") return json({ error: "Solicitud no permitida." }, 403);
  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return json({ error: "Solicitud no válida." }, 400); }
  const reviewer = typeof body.reviewer === "string" ? body.reviewer.trim() : "";
  const comment = typeof body.comment === "string" ? body.comment.trim() : "";
  if (body.decision !== "approved" && body.decision !== "changes") return json({ error: "Elige aprobar o solicitar cambios." }, 400);
  if (!reviewer || reviewer.length > REVIEWER_MAX) return json({ error: "Escribe tu nombre (hasta 80 caracteres)." }, 400);
  if (comment.length > COMMENT_MAX) return json({ error: "El comentario supera los 2000 caracteres." }, 400);
  if (body.decision === "changes" && !comment) return json({ error: "Cuenta qué cambios necesitas." }, 400);
  try {
    const db = await database();
    const found = await reviewByToken(db, typeof body.token === "string" ? body.token : "");
    if (!found) return json({ error: GONE }, 404);
    if (!found.post) return json({ error: "Esta publicación fue eliminada." }, 410);
    const { rows } = await db.query(`UPDATE focus_post_reviews SET decision = $2, reviewer = $3, comment = $4, decided_at = date_trunc('milliseconds', now()), applied_at = NULL WHERE token = $1 RETURNING ${REVIEW_COLUMNS}`, [found.review.token, body.decision, reviewer, comment || null]);
    const review = rows[0];
    return json({ decision: review.decision, reviewer: review.reviewer, comment: review.comment, decidedAt: review.decidedAt });
  } catch { return json({ error: "No se pudo guardar tu respuesta. Inténtalo de nuevo." }, 503); }
}
