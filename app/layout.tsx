import type { Metadata } from "next";
import "./tokens.css";
import "./globals.css";

export const metadata: Metadata = {
  appleWebApp: { capable: true, title: "Kromaiso", statusBarStyle: "default" },
  icons: { apple: "/icon" },
  title: "Kromaiso | Calendario de contenido",
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
