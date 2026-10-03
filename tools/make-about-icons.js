// Small colored monogram badges for the "About South Africa" tab's icon-style slots (Telecom,
// Stays) — only for the entries that don't have a real, correctly-licensed logo. Same approach as
// make-app-icons.js: a plain colored rounded-square tile with 1-3 letters, in each brand's real
// colour, generated locally with sharp rather than reusing anyone else's artwork.
//
// MTN and Telkom are deliberately NOT listed here any more — they now use their real logos
// (icons/about/mtn.png, icons/about/telkom.png, sourced from Wikimedia Commons' PD-textlogo
// files; see the sourcing comment on SA_TELECOMS in js/data-about.js). Re-running this script
// would silently overwrite those real logos with a fake monogram, so don't add them back here —
// a real logo replaces a generated one exactly the same way an owner upload does: just save it
// at that exact path.
//
// The 9 airline entries (Qatar/Emirates/Turkish/Ethiopian/FlySafair/Airlink/SAA/LIFT/CemAir) that
// used to live here were removed as orphaned dead files once those sections switched to real
// aircraft photos (images/about/airline-*.jpg, via photoCard()) instead of icon badges.
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, '..', 'icons', 'about');
if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

const BADGES = [
  // Vodacom: generated on purpose, not a placeholder-to-be-replaced-eventually — the only freely
  // licensed logo on Commons is their pre-2017 design, and the current one is Wikipedia's own
  // non-free/fair-use media, not reusable here. See SA_TELECOMS' comment in js/data-about.js.
  { slug: 'vodacom', letters: 'V', color: '#e60000' },
  // Booking apps: no free logo pursued for these yet.
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
