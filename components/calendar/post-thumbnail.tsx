"use client";
import Image from "next/image";
import { useEffect, useState } from "react";
import { Film } from "lucide-react";
import { getMedia } from "@/lib/media";
import { validReferenceUrl } from "@/lib/calendar";

export function PostThumbnail({ mediaId, imageUrl, title }: { mediaId: string; imageUrl: string; title: string }) {
  const [source, setSource] = useState("");
  const [video, setVideo] = useState(false);
  const [failed, setFailed] = useState("");
  useEffect(() => {
    let active = true; let local = "";
    if (mediaId) void getMedia(mediaId).then(asset => {
      if (!active || !asset) return;
      setVideo(asset.type.startsWith("video/"));
      if (asset.type.startsWith("image/")) { const url = asset.remoteUrl || (local = URL.createObjectURL(asset.blob)); setSource(url); }
    }).catch(() => {});
    return () => { active = false; if (local) URL.revokeObjectURL(local); };
  }, [mediaId]);
  const url = mediaId ? source : validReferenceUrl(imageUrl) ? imageUrl : "";
  if (video) return <span className="post-thumbnail video-thumbnail" aria-label="Video adjunto"><Film size={20} /></span>;
  if (!url || failed === url) return null;
  return <Image className="post-thumbnail" unoptimized src={url} width={48} height={48} alt={`Imagen de ${title}`} onError={() => setFailed(url)} />;
}
