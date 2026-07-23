/**
 * Rebuild the live `vista.webp` and logo master from the local optics handoff.
 * Override the default source folder with `WARHAMMER_OPTICS`.
 */
import { copyFile, mkdir } from "node:fs/promises";
import { join, resolve } from "node:path";
import sharp from "sharp";

const SRC = process.env.WARHAMMER_OPTICS
  ?? "C:/Users/Phil/Downloads/Warhammer optics/assets";
const DEST = resolve(process.cwd(), "public/img");

const PNGS: Array<{ in: string; out: string; width: number; quality: number }> = [
  { in: "vista.png",       out: "vista.webp",       width: 2400, quality: 78 },
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
