import type { MetadataRoute } from "next";
export default function manifest(): MetadataRoute.Manifest {
  return { id: "/", name: "FocusMRK · Calendario", short_name: "FocusMRK", start_url: "/", scope: "/", display: "standalone", background_color: "#f8f9fc", theme_color: "#7053d6", icons: [{ src: "/icon", sizes: "512x512", type: "image/png", purpose: "any" }] };
}
