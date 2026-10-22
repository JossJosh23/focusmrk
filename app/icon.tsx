import { ImageResponse } from "next/og";
export const size = { width: 512, height: 512 };
export const contentType = "image/png";

// Kromaiso isotype (public/brand/kromaiso-icon.svg, 50×52 units): Gantt rows as [x, y, width]; each row is 8 units tall.
const bars = [[0, 0, 10], [32, 0, 18], [0, 11, 10], [23, 11, 17], [0, 22, 30], [0, 33, 10], [23, 33, 17], [0, 44, 10], [32, 44, 18]];
const unit = 300 / 52;

export default function Icon() {
  return new ImageResponse(<div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#2F6BFF" }}>
    <div style={{ position: "relative", display: "flex", width: 50 * unit, height: 52 * unit }}>
      {bars.map(([x, y, w]) => <div key={`${x}-${y}`} style={{ position: "absolute", left: x * unit, top: y * unit, width: w * unit, height: 8 * unit, borderRadius: 2 * unit, background: "#FFFFFF" }} />)}
    </div>
  </div>, size);
}
