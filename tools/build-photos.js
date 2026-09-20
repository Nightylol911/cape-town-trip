// Resizes everything in "pictures/" and writes the "photos/" folder + photos/manifest.json
// that the website reads.
// Run:  npm run photos        (resize + build)
//       npm run missing       (just list places that have no pictures yet)
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'pictures');
const OUT = path.join(ROOT, 'photos');
const MAX_SIDE = 2000;      // longest edge in pixels
const QUALITY = 85;         // JPEG quality
const SLOTS = 6;            // the site shows up to 6 photos per place
const IMG = /\.(jpe?g|png|webp|gif|tiff?|avif)$/i;
const listOnly = process.argv.includes('--missing');

if (!fs.existsSync(SRC)) { console.error('No "pictures" folder yet. Run:  npm run folders'); process.exit(1); }

// find every "NNN - Name" folder inside pictures/cape-town and pictures/garden-route
const places = [];
for (const top of ['cape-town', 'garden-route']) {
  const start = path.join(SRC, top);
  if (!fs.existsSync(start)) continue;
  (function walk(dir) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      if (!e.isDirectory()) continue;
      const full = path.join(dir, e.name);
      const m = e.name.match(/^(\d+)\s*-\s*(.*)$/);
      if (m) {
        const files = fs.readdirSync(full).filter((f) => IMG.test(f) && !f.startsWith('.'))
          .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
        const n = parseInt(m[1], 10);
        places.push({ key: top === 'garden-route' ? `gr-${n}` : String(n), name: m[2], top, dir: full, files });
      } else walk(full);
    }
  })(start);
}

const empty = places.filter((p) => p.files.length === 0);
if (listOnly) {
  console.log(`${places.length - empty.length} of ${places.length} places have pictures.\n`);
  if (empty.length) console.log('Still missing:\n' + empty.map((p) => `  ${p.top}/${path.basename(p.dir)}`).join('\n'));
  else console.log('Every place has at least one picture.');
  process.exit(0);
}

(async () => {
  const sharp = require('sharp');
  fs.mkdirSync(OUT, { recursive: true });
  const manifest = {};
  let made = 0, reused = 0, failed = 0, skipped = 0;

  for (const p of places) {
    if (p.files.length > SLOTS) {
      skipped += p.files.length - SLOTS;
      console.log(`! ${p.name}: ${p.files.length} pictures, only the first ${SLOTS} are used.`);
    }
    for (let i = 0; i < Math.min(SLOTS, p.files.length); i++) {
      const file = path.join(p.dir, p.files[i]);
      const hash = crypto.createHash('md5').update(fs.readFileSync(file)).update(`${MAX_SIDE}-${QUALITY}`).digest('hex').slice(0, 8);
      const outName = `${p.key}_${i}-${hash}.jpg`;
      const outPath = path.join(OUT, outName);
      try {
        if (fs.existsSync(outPath)) reused++;
        else {
          await sharp(file).rotate()
            .resize({ width: MAX_SIDE, height: MAX_SIDE, fit: 'inside', withoutEnlargement: true })
            .flatten({ background: '#ffffff' })
            .jpeg({ quality: QUALITY, mozjpeg: true })
            .toFile(outPath);
          made++;
        }
        manifest[`${p.key}:${i}`] = outName;
      } catch (err) {
        failed++;
        console.log(`x Could not read ${path.relative(ROOT, file)} (${err.message.split('\n')[0]}). If it is an iPhone HEIC photo, export it as JPG first.`);
      }
    }
  }

  // Keep photos that were uploaded from the website for places you have no local pictures for.
  // (If a place has pictures in your pictures/ folder, that folder wins for that place.)
  let kept = 0;
  const covered = new Set(places.filter((p) => p.files.length > 0).map((p) => p.key));
  try {
    const old = JSON.parse(fs.readFileSync(path.join(OUT, 'manifest.json'), 'utf8'));
    for (const [k, f] of Object.entries(old)) {
      if (!covered.has(k.split(':')[0]) && !(k in manifest) && fs.existsSync(path.join(OUT, f))) { manifest[k] = f; kept++; }
    }
  } catch (e) { /* no manifest yet */ }

  // remove resized files that are no longer used
  const keep = new Set(Object.values(manifest));
  let removed = 0;
  for (const f of fs.readdirSync(OUT)) {
    if (f !== 'manifest.json' && !keep.has(f)) { fs.unlinkSync(path.join(OUT, f)); removed++; }
  }
  const sorted = Object.fromEntries(Object.entries(manifest).sort((a, b) => a[0].localeCompare(b[0], undefined, { numeric: true })));
  fs.writeFileSync(path.join(OUT, 'manifest.json'), JSON.stringify(sorted, null, 1));

  const withPics = places.length - empty.length;
  console.log(`\nDone. ${Object.keys(manifest).length} photos in photos/  (${made} new, ${reused} unchanged, ${removed} old removed${kept ? ', ' + kept + ' from the website kept' : ''}${failed ? ', ' + failed + ' failed' : ''}).`);
  console.log(`${withPics} of ${places.length} places have pictures.  Run "npm run missing" to see the rest.`);
  if (failed) process.exitCode = 1;
})();