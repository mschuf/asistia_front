import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const iconsDir = join(__dirname, "..", "public", "icons");
const svgPath = join(iconsDir, "icon.svg");
const svg = readFileSync(svgPath);

const sizes = [
  { name: "icon-192.png", size: 192 },
  { name: "icon-512.png", size: 512 },
  { name: "apple-touch-icon.png", size: 180 },
];

for (const { name, size } of sizes) {
  await sharp(svg).resize(size, size).png().toFile(join(iconsDir, name));
  console.log(`Generated ${name} (${size}x${size})`);
}

// Maskable: icon with safe zone padding (80% of canvas)
const maskableSize = 512;
const innerSize = Math.round(maskableSize * 0.8);
const offset = Math.round((maskableSize - innerSize) / 2);
const inner = await sharp(svg).resize(innerSize, innerSize).png().toBuffer();
await sharp({
  create: {
    width: maskableSize,
    height: maskableSize,
    channels: 4,
    background: { r: 15, g: 23, b: 42, alpha: 1 },
  },
})
  .composite([{ input: inner, left: offset, top: offset }])
  .png()
  .toFile(join(iconsDir, "icon-512-maskable.png"));
console.log("Generated icon-512-maskable.png (512x512)");
