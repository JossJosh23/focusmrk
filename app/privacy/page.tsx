import type { Metadata } from "next";
import PrivacyPage, { metadata as privacyMetadata } from "@/app/privacidad/page";

export const metadata: Metadata = {
  ...privacyMetadata,
  alternates: { canonical: "https://focusmrkt.tgxlabs.io/privacy" },
  robots: { index: true, follow: true },
};

export default PrivacyPage;
