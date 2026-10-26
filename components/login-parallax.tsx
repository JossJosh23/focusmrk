"use client";

import { useEffect, useRef, type ReactNode } from "react";

// Feeds the pointer position (-1..1) to CSS as --px/--py so the story layers can drift at different depths.
export function LoginParallax({ className, children }: { className: string; children: ReactNode }) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const node = ref.current;
    if (!node || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let frame = 0;
    function move(event: PointerEvent) {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const box = node!.getBoundingClientRect();
        node!.style.setProperty("--px", (((event.clientX - box.left) / box.width) * 2 - 1).toFixed(3));
        node!.style.setProperty("--py", (((event.clientY - box.top) / box.height) * 2 - 1).toFixed(3));
      });
    }
    function leave() { node!.style.setProperty("--px", "0"); node!.style.setProperty("--py", "0"); }
    node.addEventListener("pointermove", move);
    node.addEventListener("pointerleave", leave);
    return () => { cancelAnimationFrame(frame); node.removeEventListener("pointermove", move); node.removeEventListener("pointerleave", leave); };
  }, []);
  return <section ref={ref} className={className} aria-label="Kromaiso">{children}</section>;
}
