/**
 * Convert the Warhammer-optics handoff PNGs to size-optimised WebPs under
 * public/img/. Idempotent — re-running re-emits the same outputs from the
 * source PNGs. Source folder defaults to the local download path; override
 * with the WARHAMMER_OPTICS env var.
 *
 * Targets (each ≤ ~350 KB):
 *   - public/img/vista.webp         (Hub + Books hero)
 *   - public/img/librarium.webp     (Ask)
 *   - public/img/cartog-hall.webp   (future /map)
 *
 * The accompanying `logo_cl_v2.svg` is copied verbatim alongside.
 */
import { copyFile, mkdir } from "node:fs/promises";
import { join, resolve } from "node:path";
import sharp from "sharp";

const SRC = process.env.WARHAMMER_OPTICS
  ?? "C:/Users/Phil/Downloads/Warhammer optics/assets";
const DEST = resolve(process.cwd(), "public/img");

const PNGS: Array<{ in: string; out: string; width: number; quality: number }> = [
  { in: "vista.png",       out: "vista.webp",       width: 2400, quality: 78 },
  { in: "librarium.png",   out: "librarium.webp",   width: 2400, quality: 78 },
  { in: "cartog-hall.png", out: "cartog-hall.webp", width: 2400, quality: 78 },
];

async function main() {
  await mkdir(DEST, { recursive: true });
  for (const file of PNGS) {
    const input = join(SRC, file.in);
    const output = join(DEST, file.out);
    const { size } = await sharp(input)
      .resize({ width: file.width, withoutEnlargement: true })
      .webp({ quality: file.quality, effort: 6 })
      .toFile(output);
    console.log(`${file.out}: ${(size / 1024).toFixed(1)} KB`);
  }
  await copyFile(join(SRC, "logo_cl_v2.svg"), join(DEST, "logo_cl_v2.svg"));
  console.log("logo_cl_v2.svg copied");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
