import { POST as instagramAction } from "@/app/api/instagram/route";

// Dedicated entry point; reuse the same authorization, tenant checks and state
// storage as the existing action route. Do not add a second OAuth implementation.
export async function POST(request: Request) {
  return instagramAction(new Request(request, {
    method: "POST",
    body: JSON.stringify({ action: "connect" }),
  }));
}
