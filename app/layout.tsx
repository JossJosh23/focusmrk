import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  appleWebApp: { capable: true, title: "FocusMRK", statusBarStyle: "default" },
  icons: { apple: "/icon" },
  title: "FocusMRK | Calendario de contenido",
  description: "Planifica y organiza las publicaciones de tu marca en Instagram, TikTok y Facebook.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
