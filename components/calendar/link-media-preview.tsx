"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { resolveLinkPreview } from "@/lib/link-preview";

export function LinkMediaPreview({ url, title }: { url: string; title: string }) {
  const [settled, setSettled] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setSettled(true), 600);
    return () => clearTimeout(timer);
  }, []);
  if (!settled) return <p role="status">Preparando vista previa…</p>;
  return <ResolvedMedia url={url} title={title} />;
}

function ResolvedMedia({ url, title }: { url: string; title: string }) {
  const media = resolveLinkPreview(url);
  const [tryVideo, setTryVideo] = useState(false);
  const [failed, setFailed] = useState(false);
  if (!media) return <p role="status">Introduce un enlace http o https válido.</p>;
  if (failed) return <div className="link-preview-error" role="status"><strong>No se pudo mostrar este enlace.</strong><p>Puede requerir acceso, bloquear la vista previa o no apuntar a una imagen o video. Usa un archivo público o súbelo a la biblioteca.</p><a href={media.src} target="_blank" rel="noopener noreferrer">Abrir enlace original ↗</a></div>;
  if (media.kind === "embed") return <div className="link-preview-embed"><iframe src={media.src} title={title || "Vista previa del enlace"} allow="fullscreen; encrypted-media; picture-in-picture" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" /><a href={url} target="_blank" rel="noopener noreferrer">Si no se muestra, abrir original ↗</a></div>;
  if (media.kind === "video" || tryVideo) return <video src={media.src} controls playsInline preload="metadata" aria-label={title || "Video del enlace"} onError={() => setFailed(true)} />;
  return <Image unoptimized src={media.src} width={1080} height={1350} alt={title || "Imagen del enlace"} referrerPolicy="no-referrer" onError={() => setTryVideo(true)} />;
}
