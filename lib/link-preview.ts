export function resolveLinkPreview(value: string): { kind: "embed" | "image" | "video"; src: string } | null {
  let url: URL;
  try { url = new URL(value.trim()); } catch { return null; }
  if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) return null;
  const host = url.hostname.toLowerCase();
  const parts = url.pathname.split("/").filter(Boolean);
  const youtube = ["youtube.com", "www.youtube.com", "m.youtube.com", "youtube-nocookie.com", "www.youtube-nocookie.com"].includes(host);
  const videoId = host === "youtu.be" ? parts[0] : youtube ? (url.searchParams.get("v") || (["embed", "shorts", "live"].includes(parts[0]) ? parts[1] : "")) : "";
  if (videoId && /^[\w-]{11}$/.test(videoId)) return { kind: "embed", src: `https://www.youtube-nocookie.com/embed/${videoId}` };
  if (host === "drive.google.com") {
    const id = parts[0] === "file" && parts[1] === "d" ? parts[2] : url.searchParams.get("id");
    if (id && /^[\w-]+$/.test(id)) return { kind: "embed", src: `https://drive.google.com/file/d/${id}/preview` };
  }
  return { kind: /\.(mp4|webm|mov|m4v|ogv|ogg)$/i.test(url.pathname) ? "video" : "image", src: url.href };
}
