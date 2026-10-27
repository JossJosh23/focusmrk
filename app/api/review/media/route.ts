import { database } from "@/lib/database";
import { postMediaIds } from "@/lib/calendar";
import { serveMedia } from "@/lib/media-files";
import { reviewByToken } from "@/lib/post-reviews";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Public: a file of the reviewed publication, and only of that publication. */
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const id = params.get("id") || "";
  try {
    const found = await reviewByToken(await database(), params.get("token") || "");
    if (!found?.post || !postMediaIds(found.post).includes(id)) return new Response("Archivo no encontrado", { status: 404 });
    return await serveMedia(id, request, params.get("thumb") === "1");
  } catch { return new Response("No se pudo cargar el archivo.", { status: 503 }); }
}
