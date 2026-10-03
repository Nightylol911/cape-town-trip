// Plain "no image yet" placeholders (640x420, matching every other wide photo slot on the About
// South Africa page) for the Distances section, which has no photo of its own to start from. Each
// one gets overwritten the moment the owner uploads a real image through the page (see
// wireAboutImgUploads() in data-about.js) — this is just what shows until then.
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, '..', 'images', 'about');
if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

const W = 640, H = 420;
const placeholder = (label) => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="#f1ead9"/>
  <rect x="14" y="14" width="${W-28}" height="${H-28}" fill="none" stroke="#d9cdb4" stroke-width="2" stroke-dasharray="10 8" rx="10"/>
  <text x="50%" y="46%" text-anchor="middle" font-family="Arial, sans-serif" font-size="34" fill="#8a7f70">📍</text>
  <text x="50%" y="58%" text-anchor="middle" font-family="Arial, sans-serif" font-weight="700" font-size="22" fill="#4d453c">${label}</text>
</svg>`;

const DISTANCES = ['Stellenbosch', 'Hermanus', 'Mossel Bay', 'George', 'Wilderness', 'Knysna', 'Plettenberg Bay'];

(async () => {
  for (const name of DISTANCES) {
    const slug = name.toLowerCase().replace(/\s+/g, '-');
    const file = path.join(OUT, `distance-${slug}.jpg`);
    await sharp(Buffer.from(placeholder(name))).jpeg({ quality: 82 }).toFile(file);
    console.log('wrote images/about/distance-' + slug + '.jpg');
  }
})().catch(e => { console.error(e); process.exit(1); });
