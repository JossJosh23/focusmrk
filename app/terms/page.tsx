import type { Metadata } from "next";
import TermsPage, { metadata as termsMetadata } from "@/app/terminos/page";

export const metadata: Metadata = {
  ...termsMetadata,
  alternates: { canonical: "https://focusmrkt.tgxlabs.io/terms" },
  robots: { index: true, follow: true },
};

export default TermsPage;
