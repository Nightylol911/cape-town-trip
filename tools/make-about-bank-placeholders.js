// Plain "no image yet" placeholders for the Banks & ATM withdrawals section — same 640x420 box,
// same look as every other photo-card placeholder (tools/make-about-placeholders.js). Each one gets
// overwritten the moment the owner uploads a real bank/ATM photo through the page.
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, '..', 'images', 'about');
if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

const W = 640, H = 420;
const xmlEscape = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const placeholder = (label) => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="#f1ead9"/>
  <rect x="14" y="14" width="${W-28}" height="${H-28}" fill="none" stroke="#d9cdb4" stroke-width="2" stroke-dasharray="10 8" rx="10"/>
  <text x="50%" y="46%" text-anchor="middle" font-family="Arial, sans-serif" font-size="34" fill="#8a7f70">🏧</text>
  <text x="50%" y="58%" text-anchor="middle" font-family="Arial, sans-serif" font-weight="700" font-size="22" fill="#4d453c">${xmlEscape(label)}</text>
</svg>`;

const BANKS = ['Nedbank', 'Standard Bank', 'FNB'];

(async () => {
  for (const name of BANKS) {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const file = path.join(OUT, `bank-${slug}.jpg`);
    await sharp(Buffer.from(placeholder(name))).jpeg({ quality: 82 }).toFile(file);
    console.log('wrote images/about/bank-' + slug + '.jpg');
  }
})().catch(e => { console.error(e); process.exit(1); });
