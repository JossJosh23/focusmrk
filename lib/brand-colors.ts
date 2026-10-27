const hex = (rgb: number[]) => `#${rgb.map(value => Math.round(value).toString(16).padStart(2, "0")).join("")}`.toUpperCase();
const distance = (a: number[], b: number[]) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

/** Main colours of a logo from its RGBA pixels, most used first. Transparent and near-white pixels are treated as
 *  background; colours closer than `minDistance` merge so anti-aliased edges do not show up as extra colours. */
export function dominantColors(pixels: ArrayLike<number>, max = 5, minDistance = 48): string[] {
  const buckets = new Map<number, { count: number; sum: number[] }>();
  for (let i = 0; i + 3 < pixels.length; i += 4) {
    const [r, g, b, a] = [pixels[i], pixels[i + 1], pixels[i + 2], pixels[i + 3]];
    if (a < 128 || (r > 235 && g > 235 && b > 235)) continue;
    const key = (r >> 4) << 8 | (g >> 4) << 4 | b >> 4;
    const bucket = buckets.get(key) || { count: 0, sum: [0, 0, 0] };
    bucket.count++; bucket.sum[0] += r; bucket.sum[1] += g; bucket.sum[2] += b;
    buckets.set(key, bucket);
  }
  const total = [...buckets.values()].reduce((sum, bucket) => sum + bucket.count, 0);
  const picked: { rgb: number[]; count: number }[] = [];
  for (const bucket of [...buckets.values()].sort((a, b) => b.count - a.count)) {
    const rgb = bucket.sum.map(value => value / bucket.count);
    const near = picked.find(color => distance(color.rgb, rgb) < minDistance);
    if (near) { near.count += bucket.count; continue; }
    // Ignore specks: a colour must cover at least 2% of the visible logo.
    if (bucket.count / total < 0.02 || picked.length >= max) continue;
    picked.push({ rgb, count: bucket.count });
  }
  return picked.sort((a, b) => b.count - a.count).map(color => hex(color.rgb));
}

/** Browser only: decodes an image (data: URL) and returns its main colours. */
export async function logoColors(src: string, max = 5): Promise<string[]> {
  const image = new Image();
  image.src = src;
  await image.decode();
  const size = 96;
  const scale = Math.min(1, size / Math.max(image.naturalWidth, image.naturalHeight));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) return [];
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  return dominantColors(context.getImageData(0, 0, canvas.width, canvas.height).data, max);
}
