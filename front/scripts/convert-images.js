import fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';

async function main() {
  const workspace = process.cwd();
  const assetsDir = path.join(workspace, 'src', 'assets');
  const outDir = path.join(assetsDir, 'optimized');
  await fs.mkdir(outDir, { recursive: true });

  const files = await fs.readdir(assetsDir);
  const exts = ['.jpg', '.jpeg', '.png'];
  const sizes = [800, 1600];

  for (const file of files) {
    const ext = path.extname(file).toLowerCase();
    if (!exts.includes(ext)) continue;
    const name = path.basename(file, ext);
    const input = path.join(assetsDir, file);

    console.log(`Processing ${file}...`);

    // copy original as-is for fallback
    try {
      await fs.copyFile(input, path.join(outDir, file));
    } catch (err) {
      console.error('Copy error:', err);
    }

    for (const w of sizes) {
      const webpOut = path.join(outDir, `${name}-${w}.webp`);
      const avifOut = path.join(outDir, `${name}-${w}.avif`);
      try {
        await sharp(input).resize({ width: w }).webp({ quality: 80 }).toFile(webpOut);
        await sharp(input).resize({ width: w }).avif({ quality: 50 }).toFile(avifOut);
        console.log(`  -> ${w}px webp/avif generated`);
      } catch (err) {
        console.error(`  Error processing ${file} at ${w}px:`, err.message || err);
      }
    }
  }

  console.log('Done. Optimized images are in src/assets/optimized/');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
