import type { Metadata } from "next";
import { ReviewPage } from "@/components/review/review-page";

export const metadata: Metadata = { title: "Aprobar publicación | Kromaiso", robots: { index: false, follow: false }, referrer: "no-referrer" };

export default async function Page({ params }: PageProps<"/aprobar/[token]">) {
  const { token } = await params;
  return <ReviewPage token={token} />;
}
