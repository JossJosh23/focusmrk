import type { MetadataRoute } from "next";
export default function manifest(): MetadataRoute.Manifest {
  return { id: "/", name: "Kromaiso · Calendario", short_name: "Kromaiso", start_url: "/", scope: "/", display: "standalone", background_color: "#F6F7F9", theme_color: "#0A0C10", icons: [{ src: "/icon", sizes: "512x512", type: "image/png", purpose: "any" }, { src: "/brand/kromaiso-icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }] };
}
