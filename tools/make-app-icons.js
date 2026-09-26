// Generates placeholder icons for the "Useful apps" section — a plain colored monogram per
// app, all the same size, so the grid looks clean and uniform before real logos are added.
// To use a REAL app icon instead: just save the actual logo as icons/apps/<slug>.png (square,
// at least 128x128) and re-run nothing — the site already looks for that exact filename first.
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, '..', 'icons', 'apps');
if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

const APPS = [
  { slug: 'uber', letters: 'U', color: '#1c1c1c' },
  { slug: 'bolt', letters: 'B', color: '#34d186' },
  { slug: 'uber-eats', letters: 'UE', color: '#06c167' },
  { slug: 'mr-d', letters: 'MD', color: '#e2622e' },
  { slug: 'getyourguide', letters: 'GYG', color: '#ff5533' },
  { slug: 'klook', letters: 'K', color: '#ff5722' },
  { slug: 'airalo', letters: 'A', color: '#1f5f6b' },
  { slug: 'nomad', letters: 'N', color: '#5c6f52' },
  { slug: 'rova', letters: 'R', color: '#5b2d90' },
  { slug: 'flush', letters: 'F', color: '#2f9e8f' },
  { slug: 'skyscanner', letters: 'S', color: '#0770e3' },
  { slug: 'wego', letters: 'W', color: '#c9942f' },
  { slug: 'airbnb', letters: 'AB', color: '#ff385c' },
  { slug: 'takealot', letters: 'T', color: '#1f7a3d' },
  { slug: 'pnp-asap', letters: 'PnP', color: '#c8102e' },
  { slug: 'checkers-sixty60', letters: '60', color: '#00a950' },
];

const SIZE = 256;
const svg = (letters, color) => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SIZE} ${SIZE}">
  <rect width="${SIZE}" height="${SIZE}" rx="56" fill="${color}"/>
  <text x="50%" y="53%" text-anchor="middle" dominant-baseline="middle"
    font-family="Arial, sans-serif" font-weight="700" font-size="${letters.length > 2 ? 72 : 100}" fill="#fff">${letters}</text>
</svg>`;

(async () => {
  for (const a of APPS) {
    await sharp(Buffer.from(svg(a.letters, a.color))).resize(SIZE, SIZE).png().toFile(path.join(OUT, a.slug + '.png'));
    console.log('wrote icons/apps/' + a.slug + '.png');
  }
})().catch(e => { console.error(e); process.exit(1); });
