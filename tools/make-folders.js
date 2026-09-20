// Creates one folder per place inside "pictures/".
// Run:  npm run folders
// Safe to run again any time (it never deletes anything).
const fs = require('fs');
const path = require('path');
const { JSDOM, VirtualConsole } = require('jsdom');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const dom = new JSDOM(html, {
  runScripts: 'dangerously',
  url: 'https://example.test/',
  virtualConsole: new VirtualConsole(),      // silence page logs
  beforeParse(w) {
    const chain = new Proxy(function () {}, { get: () => chain, apply: () => chain });
    w.L = { map: () => chain, tileLayer: () => chain, circleMarker: () => chain };  // map library stub
    w.fetch = async () => ({ ok: false });
  },
});
const { PLACES, GARDEN_ROUTE, AREAS_META } = dom.window.eval('({PLACES, GARDEN_ROUTE, AREAS_META})');

const clean = (s) => String(s).replace(/[<>:"/\\|?*\u0000-\u001f]/g, '').replace(/\s+/g, ' ').replace(/[. ]+$/, '').trim().slice(0, 60);
const pad = (n) => String(n).padStart(3, '0');
const root = path.join(__dirname, '..', 'pictures');
let count = 0;

PLACES.forEach((p, i) => {
  const area = clean((AREAS_META[p.a] && AREAS_META[p.a].en) || p.a);
  fs.mkdirSync(path.join(root, 'cape-town', area, `${pad(i)} - ${clean(p.n)}`), { recursive: true });
  count++;
});
let g = 0;
GARDEN_ROUTE.forEach((town) => {
  town.items.forEach((item) => {
    fs.mkdirSync(path.join(root, 'garden-route', clean(town.town), `${pad(g)} - ${clean(item.n)}`), { recursive: true });
    g++; count++;
  });
});

console.log(`Done. ${count} place folders are ready in the "pictures" folder.`);
console.log('Drop up to 6 pictures into each place folder (they show in filename order).');
console.log('Do not rename the numbers at the start of the folder names.');
process.exit(0);
