/**
 * Gera os ícones PNG do app a partir do SVG fonte.
 * Execute: node scripts/generate-icons.mjs
 */
import sharp from 'sharp';
import { readFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dir = dirname(fileURLToPath(import.meta.url));
const root  = join(__dir, '..');

const svg = readFileSync(join(root, 'public', 'icon.svg'));

mkdirSync(join(root, 'public', 'icons'), { recursive: true });

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

console.log('Gerando ícones PNG...');

for (const size of sizes) {
  const outPath = join(root, 'public', 'icons', `icon-${size}.png`);
  await sharp(svg)
    .resize(size, size)
    .png()
    .toFile(outPath);
  console.log(`  ✓ icon-${size}.png`);
}

// Ícone Apple Touch (180×180, sem cantos arredondados — o iOS arredonda sozinho)
await sharp(svg)
  .resize(180, 180)
  .png()
  .toFile(join(root, 'public', 'apple-touch-icon.png'));
console.log('  ✓ apple-touch-icon.png');

// Favicon 32×32
await sharp(svg)
  .resize(32, 32)
  .png()
  .toFile(join(root, 'public', 'favicon-32.png'));
console.log('  ✓ favicon-32.png');

console.log('\nÍcones gerados com sucesso em public/icons/');
