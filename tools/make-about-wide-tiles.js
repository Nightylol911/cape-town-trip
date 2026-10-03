// Wide (640x420) generated tiles for the "About South Africa" page, for the handful of spots
// where no real, correctly-licensed photo could be confirmed:
//  - the diplomatic passport (no free image of Saudi Arabia's diplomatic passport was found —
//    the regular passport DOES use a real one, images/about/passport-regular.svg)
//  - LIFT and CemAir (no confirmed real aircraft photo found on Wikimedia Commons; Federal Air
//    never had one to begin with)
// Kept visually consistent with the real photos they sit next to (same 640x420 box) rather than
// stretching the small square monogram badges from make-about-icons.js across a landscape frame.
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, '..', 'images', 'about');
if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

const W = 640, H = 420;

const wideTile = (label, color) => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="${color}"/>
  <text x="50%" y="53%" text-anchor="middle" dominant-baseline="middle"
    font-family="Arial, sans-serif" font-weight="700" font-size="44" fill="#fff">${label}</text>
</svg>`;

const passportIcon = (color) => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 334 473">
  <rect width="334" height="473" rx="14" fill="${color}"/>
  <rect x="24" y="24" width="286" height="425" rx="4" fill="none" stroke="#e8c468" stroke-width="2"/>
  <text x="50%" y="46%" text-anchor="middle" font-family="Arial, sans-serif" font-size="30" fill="#e8c468">✦</text>
  <text x="50%" y="62%" text-anchor="middle" font-family="Arial, sans-serif" font-weight="700" font-size="22" fill="#e8c468">PASSPORT</text>
</svg>`;

(async () => {
  for (const [label, color, file] of [['LIFT', '#0f9b8e', 'airline-lift.jpg'], ['CemAir', '#b02a37', 'airline-cemair.jpg'], ['Federal Air', '#5c6f52', 'airline-federalair.jpg']]) {
    await sharp(Buffer.from(wideTile(label, color))).jpeg({quality:80}).toFile(path.join(OUT, file));
    console.log('wrote images/about/' + file);
  }
  await sharp(Buffer.from(passportIcon('#7a1f2b'))).png().toFile(path.join(OUT, 'passport-diplomatic.png'));
  console.log('wrote images/about/passport-diplomatic.png');
})().catch(e => { console.error(e); process.exit(1); });
