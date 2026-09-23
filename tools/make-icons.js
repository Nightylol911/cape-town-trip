// Generates the PWA/home-screen icons (favicon already lives inline in index.html as a data
// URI — these are the larger raster sizes browsers/OSes need for "Add to Home Screen" and
// install prompts). Re-run with `npm run icons` any time the logo colors change.
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, '..', 'icons');
if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

// Same compass-rose mark as the inline favicon, on a solid square (no transparency, so it
// also works as an apple-touch-icon, which iOS renders with its own rounded-corner mask).
const svgFull = (pad) => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" fill="#123840"/>
  <g transform="translate(32,32) scale(${1 - pad}) translate(-32,-32)">
    <polygon points="32,10 36,32 32,54 28,32" fill="#faf6ee"/>
    <polygon points="10,32 32,28 54,32 32,36" fill="#c9942f"/>
    <circle cx="32" cy="32" r="3" fill="#e2622e"/>
  </g>
</svg>`;

const jobs = [
  { file: 'icon-192.png', size: 192, pad: 0 },
  { file: 'icon-512.png', size: 512, pad: 0 },
  { file: 'icon-maskable-512.png', size: 512, pad: 0.34 }, // extra margin so masks (circle/squircle) don't clip it
  { file: 'apple-touch-icon.png', size: 180, pad: 0.1 },
];

(async () => {
  for (const j of jobs) {
    await sharp(Buffer.from(svgFull(j.pad)))
      .resize(j.size, j.size)
      .png()
      .toFile(path.join(OUT, j.file));
    console.log('wrote icons/' + j.file);
  }
})().catch(e => { console.error(e); process.exit(1); });
