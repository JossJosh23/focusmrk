import { randomBytes } from "node:crypto";
import type { Pool } from "pg";
import type { Publication } from "./calendar";

// Approval links: /aprobar/<token>. The token is the only credential, so it is long and random (24 bytes, 32 base64url chars).
export const REVIEW_TOKEN = /^[A-Za-z0-9_-]{32}$/;
export const newReviewToken = () => randomBytes(24).toString("base64url");
export const REVIEWER_MAX = 80;
export const COMMENT_MAX = 2000;

export type ReviewDecision = "approved" | "changes";
export type PostReview = {
  token: string; postId: string; createdAt: string;
  decision: ReviewDecision | null; reviewer: string | null; comment: string | null;
  decidedAt: string | null; appliedAt: string | null;
};
export const REVIEW_COLUMNS = 'token, post_id AS "postId", created_at AS "createdAt", decision, reviewer, comment, decided_at AS "decidedAt", applied_at AS "appliedAt"';

export async function panelPosts(db: Pool): Promise<Publication[]> {
  return (await db.query("SELECT posts FROM focus_panel WHERE id = 1")).rows[0]?.posts || [];
}

/** The review and its publication (null once the post is deleted), or null for an unknown token. */
export async function reviewByToken(db: Pool, token: string) {
  if (!REVIEW_TOKEN.test(token)) return null;
  const review: PostReview | undefined = (await db.query(`SELECT ${REVIEW_COLUMNS} FROM focus_post_reviews WHERE token = $1`, [token])).rows[0];
  if (!review) return null;
  return { review, post: (await panelPosts(db)).find(post => post.id === review.postId) || null };
}

/** What the reviewer may see: the publication as it will look, without the internal brief. */
export function reviewerView(post: Publication): Publication {
  return { ...post, objective: "", production: "" };
}
