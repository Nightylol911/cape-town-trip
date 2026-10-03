// Small colored monogram badges for the "About South Africa" tab — airlines, telecoms and
// booking apps that don't have a real fetched logo (unlike icons/apps/, which can use a real
// store icon once one is saved there). Same approach as make-app-icons.js: a plain colored
// rounded-square tile with 1-3 letters, in each brand's real colour, generated locally with
// sharp rather than reusing anyone else's artwork. To swap one for a real logo later, just save
// the actual logo as icons/about/<slug>.png (square, at least 128x128) — the site looks for
// that exact filename first.
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, '..', 'icons', 'about');
if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

const BADGES = [
  // International airlines
  { slug: 'qatar', letters: 'QR', color: '#8a1538' },
  { slug: 'emirates', letters: 'EK', color: '#c8102e' },
  { slug: 'turkish', letters: 'TK', color: '#a3222c' },
  { slug: 'ethiopian', letters: 'ET', color: '#2e7d32' },
  // Domestic airlines
  { slug: 'flysafair', letters: 'FA', color: '#d6006f' },
  { slug: 'airlink', letters: 'AL', color: '#0b4ea2' },
  { slug: 'saa', letters: 'SAA', color: '#0a3d62' },
  { slug: 'lift', letters: 'LT', color: '#0f9b8e' },
  { slug: 'cemair', letters: 'CA', color: '#b02a37' },
  // Telecoms
  { slug: 'mtn', letters: 'MTN', color: '#ffcb05', dark: true },
  { slug: 'vodacom', letters: 'V', color: '#e60000' },
  { slug: 'telkom', letters: 'T', color: '#00a0af' },
  // Booking apps
  { slug: 'airbnb', letters: 'AB', color: '#ff385c' },
  { slug: 'booking', letters: 'B', color: '#003580' },
];

const SIZE = 128;
const svg = (letters, color, dark) => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SIZE} ${SIZE}">
  <rect width="${SIZE}" height="${SIZE}" rx="28" fill="${color}"/>
  <text x="50%" y="53%" text-anchor="middle" dominant-baseline="middle"
    font-family="Arial, sans-serif" font-weight="700" font-size="${letters.length > 2 ? 38 : 52}" fill="${dark ? '#1c1c1c' : '#fff'}">${letters}</text>
</svg>`;

(async () => {
  for (const b of BADGES) {
    await sharp(Buffer.from(svg(b.letters, b.color, b.dark))).resize(SIZE, SIZE).png().toFile(path.join(OUT, b.slug + '.png'));
    console.log('wrote icons/about/' + b.slug + '.png');
  }
})().catch(e => { console.error(e); process.exit(1); });
