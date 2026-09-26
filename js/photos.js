/* ================= PHOTOS =================
   Two sources of photos per place:
   1. Published: files in the /photos folder listed in photos/manifest.json (everyone sees these).
   2. On this device: added in the browser and stored in IndexedDB (only this browser sees these).
   A place can hold up to MAX_SLOTS photos. */
const MAX_SLOTS = 6;
const PHOTO_MAX_SIDE = 2000;   // longest edge (px) of a saved photo
const PHOTO_QUALITY = 0.85;    // JPEG quality
const photoData = {};          // "idx:slot" -> {url, blob}   (this device)
const sharedPhotos = {};       // "idx:slot" -> url            (published)
let sharedManifest = {};
const slideState = {};         // base -> slide index shown on the card
let pendingMap = {};           // key -> filename: uploaded to GitHub, waiting for the site to rebuild
try{ pendingMap = JSON.parse(localStorage.getItem('ctgr_pending') || '{}') || {}; }catch(e){ pendingMap = {}; }
const savePending = ()=>{ try{ localStorage.setItem('ctgr_pending', JSON.stringify(pendingMap)); }catch(e){} };
let pendingRemoves = new Set();   // keys asked to be deleted from GitHub, still waiting to go through
try{ pendingRemoves = new Set(JSON.parse(localStorage.getItem('ctgr_pending_del') || '[]')); }catch(e){ pendingRemoves = new Set(); }
const savePendingRemoves = ()=>{ try{ localStorage.setItem('ctgr_pending_del', JSON.stringify([...pendingRemoves])); }catch(e){} };

const escHtml = s => String(s).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

function itemForBase(base){
  base = String(base);
  if(base.startsWith('gr-')){
    let n = +base.slice(3);
    for(const t of GARDEN_ROUTE){ if(n < t.items.length) return t.items[n]; n -= t.items.length; }
    return null;
  }
  return PLACES[+base] || null;
}
function nameForBase(base){
  const it = itemForBase(base);
  return it ? (LANG==='ar' ? (it.n_ar || it.n) : it.n) : '';
}
const noThumb = new Set();     // published files that have no small version yet
const thumbUrl = f=>(noThumb.has(f) ? 'photos/' : 'photos/t/') + encodeURIComponent(f);
const canEdit = ()=>!!ghConfig();   // only devices connected with your GitHub token can add / replace / delete
function photosFor(base){
  const out = [];
  for(let s=0; s<MAX_SLOTS; s++){
    const key = base+':'+s;
    if(photoData[key]) out.push({slot:s, key, url:photoData[key].url, thumb:photoData[key].url, local:true, pending:!!pendingMap[key]});
    else if(sharedPhotos[key]) out.push({slot:s, key, url:sharedPhotos[key], thumb:thumbUrl(sharedManifest[key]), local:false});
  }
  return out;
}
function makeThumbBlob(blob){
  return new Promise((resolve, reject)=>{
    const src = URL.createObjectURL(blob), img = new Image();
    img.onload = ()=>{
      const k = Math.min(1, 640 / Math.max(img.naturalWidth, img.naturalHeight));
      const c = document.createElement('canvas'); c.width = Math.max(1, Math.round(img.naturalWidth*k)); c.height = Math.max(1, Math.round(img.naturalHeight*k));
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(src);
      c.toBlob(b=>b ? resolve(b) : reject(new Error('thumb failed')), 'image/jpeg', 0.78);
    };
    img.onerror = ()=>{ URL.revokeObjectURL(src); reject(new Error('thumb decode failed')); };
    img.src = src;
  });
}

/* ---- saving a photo: resize + re-encode as JPEG ---- */
function processImage(file){
  return new Promise((resolve, reject)=>{
    const src = URL.createObjectURL(file);
    const img = new Image();
    img.onload = ()=>{
      let w = img.naturalWidth, h = img.naturalHeight;
      const k = Math.min(1, PHOTO_MAX_SIDE / Math.max(w, h));
      w = Math.round(w*k); h = Math.round(h*k);
      const c = document.createElement('canvas'); c.width = w; c.height = h;
      const ctx = c.getContext('2d');
      ctx.fillStyle = '#fff'; ctx.fillRect(0,0,w,h);
      ctx.drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(src);
      c.toBlob(b=> b ? resolve(b) : reject(new Error('encode failed')), 'image/jpeg', PHOTO_QUALITY);
    };
    img.onerror = ()=>{ URL.revokeObjectURL(src); reject(new Error('decode failed')); };
    img.src = src;
  });
}

let toastTimer;
function toast(msg){
  const el = document.getElementById('toast');
  el.textContent = msg; el.classList.add('show');
  clearTimeout(toastTimer); toastTimer = setTimeout(()=>el.classList.remove('show'), 2800);
}

/* ---- file picker (one shared hidden input) ---- */
const fileInput = document.createElement('input');
fileInput.type = 'file'; fileInput.accept = 'image/*'; fileInput.hidden = true;
document.body.appendChild(fileInput);
let pendingPick = null;
function pickFiles(base, replaceSlot){
  if(!canEdit()){ toast(tr('needToken')); return; }
  pendingPick = {base, replaceSlot: (replaceSlot==null ? null : replaceSlot)};
  fileInput.multiple = (replaceSlot==null);
  fileInput.value = '';
  fileInput.click();
}
fileInput.addEventListener('change', ()=>{
  const files = [...fileInput.files], p = pendingPick; pendingPick = null;
  if(p && files.length) savePhotos(p.base, files, p.replaceSlot);
});

async function savePhotos(base, files, replaceSlot){
  if(!canEdit()){ toast(tr('needToken')); return; }
  let slots = [];
  if(replaceSlot != null){ slots = [replaceSlot]; files = files.slice(0,1); }
  else{
    const used = new Set(photosFor(base).map(p=>p.slot));
    for(let s=0; s<MAX_SLOTS && slots.length<files.length; s++) if(!used.has(s)) slots.push(s);
    if(!slots.length){ toast(tr('photoLimit').replace('{n}', MAX_SLOTS)); return; }
    if(slots.length < files.length) toast(tr('photoLimit').replace('{n}', MAX_SLOTS));
  }
  if(files.length > 1 || replaceSlot != null) toast(tr('photoSaving'));
  let firstSlot = null, failed = 0;
  const saved = [], stamp = Date.now().toString(36);
  for(let n=0; n<slots.length; n++){
    const key = base+':'+slots[n];
    try{
      const blob = await processImage(files[n]);
      if(photoData[key]) URL.revokeObjectURL(photoData[key].url);
      const thumb = await makeThumbBlob(blob).catch(()=>null);
      const filename = key.replace(':','_') + '-' + stamp + '.jpg';
      photoData[key] = {url: URL.createObjectURL(blob), blob, thumb, filename};
      delete pendingMap[key];
      await photoDB.put(key, blob);
      saved.push({key});
      if(firstSlot === null) firstSlot = slots[n];
    }catch(err){ console.error('Photo failed', err); failed++; }
  }
  savePending();
  if(failed) toast(tr('photoFail'));
  if(firstSlot === null) return;
  try{ if(navigator.storage && navigator.storage.persist) navigator.storage.persist(); }catch(e){}
  const idx = Math.max(0, photosFor(base).findIndex(p=>p.slot===firstSlot));
  slideState[base] = idx;
  refreshSlideshow(base);
  if(lbOpen() && lb.base === base) lbShow(idx);
  if(ghConfig()) scheduleUpload();
  else if(!failed) toast(tr('ghHint'));
}

/* ---- Upload queue --------------------------------------------------------
   Adding several photos quickly (common on a phone) used to fire one GitHub
   commit per photo at the same time; those commits raced each other and the
   losers were silently dropped. Everything below batches whatever hasn't been
   uploaded yet into ONE commit at a time (never two at once), retries on
   failure, and picks back up automatically next time the page is open  —
   including a photo whose upload was cut short by the phone locking or the
   tab going to the background mid-request. */
// A single FIFO chain: uploads, replaces and deletes all funnel through here, one at a time.
// This is what stops "Update is not a fast forward" errors — that error means two
// GitHub commits were attempted at the same moment (e.g. adding one photo while
// removing another); queuing them one after another instead of side by side removes the race.
let ghChain = Promise.resolve();
function ghSerial(task){
  const run = ghChain.then(task, task);
  ghChain = run.catch(()=>{});
  return run;
}
let uploadTimer = null, uploadFails = 0, uploadState = 'idle';   // 'idle' | 'uploading' | 'retrying'
let lastUploadNote = '';   // human-readable detail on the most recent problem, shown in the Photos panel so it's visible without opening the browser console
function scheduleUpload(delay){
  clearTimeout(uploadTimer);
  uploadTimer = setTimeout(()=>ghSerial(uploadQueued), delay == null ? 2500 : delay);
}
function pendingUploadBases(){
  return [...new Set(Object.keys(photoData).filter(k=>!pendingMap[k]).map(k=>k.split(':')[0]))];
}
function pendingUploadCount(){ return Object.keys(photoData).filter(k=>!pendingMap[k]).length + pendingRemoves.size; }
const UPLOAD_CHUNK = 10;   // photos per commit — a big batch is sent in small steps instead of one giant one,
                            // so most of it is safely saved even if something interrupts partway through
let uploadTotal = 0, uploadDone = 0;
// filename/thumb only ever live in memory (photoData) — if the page reloads while a photo is
// still waiting to upload, IndexedDB still has the raw picture, but not those two fields. This
// fills them back in before anything is sent, so a lost filename never becomes the literal text
// "undefined" (which used to make every such photo silently overwrite the same broken file).
async function ensureUploadMeta(key, v){
  if(!v.filename){
    v.filename = key.replace(':','_') + '-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2,6) + '.jpg';
  }
  if(!v.thumb){
    v.thumb = await makeThumbBlob(v.blob).catch(()=>null);
  }
  return v;
}
async function uploadQueued(){
  const cfg = ghConfig(); if(!cfg) return;
  const pendingKeys = Object.keys(photoData).filter(k=>!pendingMap[k]);
  await Promise.all(pendingKeys.map(k=>ensureUploadMeta(k, photoData[k])));
  let adds = pendingKeys.map(key=>{ const v = photoData[key]; return {key, blob:v.blob, thumb:v.thumb, filename:v.filename}; });
  let removeKeys = [...pendingRemoves];
  if(!adds.length && !removeKeys.length){ uploadState = 'idle'; uploadFails = 0; uploadTotal = 0; uploadDone = 0; return; }
  uploadTotal = adds.length + removeKeys.length; uploadDone = 0;
  uploadState = 'uploading'; refreshUploadStatus();
  const touchedBases = new Set();
  while(adds.length || removeKeys.length){
    // "Disconnect this device" only stops NEW uploads from starting — without this check, a big
    // batch already mid-flight (this loop) would just keep going to completion regardless, using
    // the token it grabbed when it started. Checking fresh before every chunk means disconnecting
    // actually takes effect within seconds, not only once the whole batch finishes on its own.
    if(!ghConfig()){ uploadState = 'idle'; uploadFails = 0; uploadTotal = 0; uploadDone = 0; refreshUploadStatus(); return; }
    const chunkAdds = adds.splice(0, UPLOAD_CHUNK);
    const chunkRemoves = removeKeys; removeKeys = [];   // deletes are cheap (no file upload) — clear them all in the first chunk
    const n = chunkAdds.length + chunkRemoves.length;
    toast(uploadTotal > n ? tr('ghUploadingProgress').replace('{a}', uploadDone).replace('{b}', uploadTotal) : (n > 1 ? tr('ghUploadingN').replace('{n}', n) : tr('ghUploading')));
    try{
      await ghCommit(cfg, {adds: chunkAdds, removeKeys: chunkRemoves, message: 'Update ' + n + ' photo' + (n === 1 ? '' : 's')});
      chunkAdds.forEach(a=>{ pendingMap[a.key] = a.filename; touchedBases.add(a.key.split(':')[0]); });
      chunkRemoves.forEach(k=>{ pendingRemoves.delete(k); delete sharedPhotos[k]; touchedBases.add(k.split(':')[0]); });
      savePending(); savePendingRemoves();
      uploadDone += n;
      touchedBases.forEach(b=>{ refreshSlideshow(b); if(lbOpen() && b === lb.base) lbShow(lb.i); });
      console.log('[upload] chunk saved — pendingMap now has', Object.keys(pendingMap).length, 'total,', pendingUploadCount(), 'still unsent');
      uploadFails = 0; refreshUploadStatus();
    }catch(err){
      console.error('[upload] chunk failed —', err && err.status, err && (err.detail || err.message));
      lastUploadNote = 'Chunk failed (' + (err && err.status || '?') + '): ' + (err && (err.detail || err.message) || String(err));
      toast(ghErrText(err));
      uploadFails++; uploadState = 'retrying';
      // whatever uploaded before this point is already safely committed on GitHub — only what's left
      // (this chunk onward) still needs to go, and that's what the next attempt will pick up
      scheduleUpload(Math.min(60000, 4000 * Math.pow(1.8, uploadFails - 1)) + Math.random() * 1000);
      refreshUploadStatus();
      return;
    }
  }
  // Every chunk reported success — but confirm that against what's actually still marked
  // unsent, rather than assuming. GitHub's own APIs can briefly disagree with each other right
  // after a write, so trust the real count over "the loop finished with no errors".
  const stillUnsent = pendingUploadCount();
  if(stillUnsent > 0){
    console.warn('[upload] loop finished with no errors, but', stillUnsent, 'item(s) are still unmarked — retrying shortly instead of reporting done.');
    lastUploadNote = stillUnsent + ' photo(s) did not get marked as saved even though no error was reported. Retrying automatically.';
    uploadFails++; uploadState = 'retrying'; refreshUploadStatus();
    scheduleUpload(Math.min(60000, 4000 * Math.pow(1.8, uploadFails - 1)) + Math.random() * 1000);
    return;
  }
  toast(tr('ghDone'));
  lastUploadNote = '';
  uploadState = 'idle'; uploadFails = 0; uploadTotal = 0; uploadDone = 0;
  refreshUploadStatus();
}
function refreshUploadStatus(){
  const el = document.getElementById('ppUploadStatus'); if(!el) return;
  const n = pendingUploadCount();
  const noteSuffix = lastUploadNote ? ' — ' + lastUploadNote : '';
  el.textContent = (uploadState === 'uploading' ? (uploadTotal > 1 ? tr('ghQueueProgress').replace('{a}', uploadDone).replace('{b}', uploadTotal) : tr('ghQueueBusy'))
    : uploadState === 'retrying' ? tr('ghQueueRetry').replace('{n}', n) + noteSuffix
    : n ? tr('ghQueueWaiting').replace('{n}', n) : '');
}
document.addEventListener('visibilitychange', ()=>{ if(!document.hidden && pendingUploadCount()) scheduleUpload(300); });
window.addEventListener('online', ()=>{ if(pendingUploadCount()) scheduleUpload(300); });
setInterval(()=>{ if(!document.hidden && pendingUploadCount()) scheduleUpload(0); }, 60000);

async function removeLocalPhoto(base, key){
  if(!photoData[key]) return;
  URL.revokeObjectURL(photoData[key].url);
  delete photoData[key];
  await photoDB.del(key);
  slideState[base] = Math.max(0, (slideState[base]||0) - 1);
  refreshSlideshow(base);
}

/* ---- card slideshow ---- */
const ICON_CAM = '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8h3l1.5-2h7L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z"/><circle cx="12" cy="13" r="3.5"/></svg>';
const ICON_EXPAND = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>';

function slideshow(base){
  const ps = photosFor(base);
  if(!ps.length){
    return `<div class="slideshow empty" data-slideshow="${base}">${canEdit()
      ? `<button type="button" class="ph-empty" data-add="${base}">${ICON_CAM}<span>${tr('addPhoto')}</span></button>`
      : `<div class="ph-empty ph-static">${ICON_CAM}<span>${tr('noPhotoYet')}</span></div>`}</div>`;
  }
  const cur = Math.min(slideState[base]||0, ps.length-1);
  const nm = escHtml(nameForBase(base));
  const slides = ps.map((p,i)=>`<img class="slide ${i===cur?'show':''}" data-view="${i}" src="${p.thumb}" data-full="${p.url}" alt="${nm}" loading="lazy" tabindex="0" role="button" aria-label="${tr('viewFull')}">`).join('');
  const multi = ps.length > 1;
  return `<div class="slideshow" data-slideshow="${base}">${slides}
    <span class="ph-expand" aria-hidden="true">${ICON_EXPAND}</span>
    ${canEdit() ? `<button type="button" class="ph-btn" data-add="${base}" title="${tr('addPhoto')}" aria-label="${tr('addPhoto')}">+</button>` : ''}
    ${multi ? `<button type="button" class="slide-nav prev" data-nav="-1" aria-label="${tr('prevPhoto')}">‹</button><button type="button" class="slide-nav next" data-nav="1" aria-label="${tr('nextPhoto')}">›</button>
    <div class="slide-dots">${ps.map((p,i)=>`<button type="button" class="${i===cur?'active':''}" data-dot="${i}" aria-label="${i+1}"></button>`).join('')}</div>` : ''}
  </div>`;
}
function refreshSlideshow(base){
  document.querySelectorAll(`[data-slideshow="${base}"]`).forEach(el=>{ el.outerHTML = slideshow(base); });
}
function showSlide(base, i){
  const ss = document.querySelector(`[data-slideshow="${base}"]`);
  if(!ss) return;
  slideState[base] = i;
  ss.querySelectorAll('.slide').forEach((s,k)=>s.classList.toggle('show', k===i));
  ss.querySelectorAll('[data-dot]').forEach((d,k)=>d.classList.toggle('active', k===i));
}
function stepSlide(base, dir){
  const n = photosFor(base).length; if(n < 2) return;
  showSlide(base, ((slideState[base]||0) + dir + n) % n);
}

document.addEventListener('click', e=>{
  const t = e.target; if(!(t instanceof Element)) return;
  const add = t.closest('.slideshow [data-add]');
  if(add){ e.preventDefault(); pickFiles(add.closest('.slideshow').dataset.slideshow); return; }
  const nav = t.closest('.slideshow [data-nav]');
  if(nav){ e.preventDefault(); stepSlide(nav.closest('.slideshow').dataset.slideshow, +nav.dataset.nav); return; }
  const dot = t.closest('.slideshow [data-dot]');
  if(dot){ e.preventDefault(); showSlide(dot.closest('.slideshow').dataset.slideshow, +dot.dataset.dot); return; }
  const view = t.closest('.slideshow [data-view]');
  if(view){ openLightbox(view.closest('.slideshow').dataset.slideshow, +view.dataset.view); }
});
document.addEventListener('error', e=>{
  const img = e.target;
  if(!(img instanceof HTMLImageElement) || !img.dataset || !img.dataset.full) return;
  const full = new URL(img.dataset.full, location.href).href;
  if(img.src !== full){
    const m = img.src.split('/photos/t/')[1]; if(m) noThumb.add(decodeURIComponent(m));
    img.src = full;
  }
}, true);
document.addEventListener('keydown', e=>{
  if((e.key==='Enter' || e.key===' ') && e.target instanceof Element && e.target.matches('.slideshow [data-view]')){
    e.preventDefault(); openLightbox(e.target.closest('.slideshow').dataset.slideshow, +e.target.dataset.view);
  }
});
let swipe = null;
document.addEventListener('touchstart', e=>{
  const ss = e.target instanceof Element ? e.target.closest('.slideshow') : null;
  swipe = (ss && e.touches.length===1) ? {ss, x:e.touches[0].clientX, y:e.touches[0].clientY} : null;
}, {passive:true});
document.addEventListener('touchend', e=>{
  if(!swipe) return;
  const dx = e.changedTouches[0].clientX - swipe.x, dy = e.changedTouches[0].clientY - swipe.y;
  if(Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)*1.5) stepSlide(swipe.ss.dataset.slideshow, dx<0 ? 1 : -1);
  swipe = null;
}, {passive:true});

/* ---- full-size viewer ---- */
const lbEl = document.getElementById('lb'), lbStage = document.getElementById('lbStage'),
      lbImg = document.getElementById('lbImg'), lbThumbs = document.getElementById('lbThumbs');
const lb = {base:null, list:[], i:0, s:1, tx:0, ty:0};
const lbOpen = ()=>!lbEl.hidden;

function openLightbox(base, i){
  lb.base = base; lbEl.hidden = false; document.body.classList.add('lb-open');
  try{ history.pushState({lb:1}, ''); }catch(e){}
  lbShow(i);
  document.getElementById('lbClose').focus({preventScroll:true});
}
function closeLightbox(fromPop){
  if(!lbOpen()) return;
  lbEl.hidden = true; document.body.classList.remove('lb-open'); lbImg.removeAttribute('src');
  if(!fromPop){ try{ if(history.state && history.state.lb) history.back(); }catch(e){} }
}
window.addEventListener('popstate', ()=>{ if(lbOpen()) closeLightbox(true); });

function lbMeta(){
  const p = lb.list[lb.i]; if(!p) return;
  const dims = lbImg.naturalWidth ? ` · ${lbImg.naturalWidth} × ${lbImg.naturalHeight}` : '';
  document.getElementById('lbMeta').textContent = `${lb.i+1} / ${lb.list.length}${dims} · ${p.pending ? tr('ppPending') : p.local ? tr('ppLocal') : tr('ppShared')}`;
}
function lbShow(i){
  const list = photosFor(lb.base);
  if(!list.length){ closeLightbox(); return; }
  lb.list = list; lb.i = ((i % list.length) + list.length) % list.length;
  const p = list[lb.i], name = nameForBase(lb.base);
  lb.s = 1; lb.tx = 0; lb.ty = 0; applyT();
  lbStage.classList.add('loading');
  lbImg.onload = ()=>{ lbStage.classList.remove('loading'); lbMeta(); };
  lbImg.onerror = ()=>lbStage.classList.remove('loading');
  lbImg.src = p.url; lbImg.alt = name;
  document.getElementById('lbName').textContent = name;
  lbMeta();
  const dl = document.getElementById('lbDownload');
  dl.href = p.url; dl.download = (name.replace(/[^\w]+/g,'-').replace(/^-|-$/g,'') || 'photo') + '-' + (lb.i+1) + '.jpg';
  const edit = canEdit();
  document.getElementById('lbAdd').style.display = edit ? '' : 'none';
  document.getElementById('lbReplace').style.display = edit ? '' : 'none';
  document.getElementById('lbRemove').style.display = (edit && (p.local || sharedManifest[p.key])) ? '' : 'none';
  document.querySelectorAll('.lb-nav').forEach(b=>b.style.display = list.length>1 ? '' : 'none');
  lbThumbs.innerHTML = list.map((q,k)=>`<button type="button" class="lb-thumb ${k===lb.i?'active':''}" data-ti="${k}" aria-label="${k+1}"><img src="${q.thumb}" data-full="${q.url}" alt=""></button>`).join('')
    + (edit && list.length < MAX_SLOTS ? `<button type="button" class="lb-thumb add" id="lbThumbAdd" aria-label="${tr('addPhoto')}">+</button>` : '');
  const act = lbThumbs.querySelector('.active'); if(act && act.scrollIntoView) act.scrollIntoView({inline:'center', block:'nearest'});
  [['lbClose','closeViewer'],['lbZoomIn','zoomIn'],['lbZoomOut','zoomOut'],['lbFit','zoomReset'],['lbAdd','addPhoto'],['lbReplace','replacePhoto'],['lbDownload','downloadPhoto'],['lbRemove','removePhoto'],['lbPrev','prevPhoto'],['lbNext','nextPhoto']]
    .forEach(([id,k])=>{ const el = document.getElementById(id); el.title = tr(k); el.setAttribute('aria-label', tr(k)); });
  slideState[lb.base] = lb.i; showSlide(lb.base, lb.i);
  [1,-1].forEach(d=>{ const q = list[(lb.i+d+list.length) % list.length]; if(q && list.length>1){ const im = new Image(); im.src = q.url; } });
}

/* zoom + pan */
function applyT(){
  lbImg.style.transform = `translate(${lb.tx}px,${lb.ty}px) scale(${lb.s})`;
  lbStage.classList.toggle('zoomed', lb.s > 1.01);
}
function clampT(){
  const mx = Math.max(0, (lbImg.offsetWidth*lb.s - lbStage.clientWidth)/2);
  const my = Math.max(0, (lbImg.offsetHeight*lb.s - lbStage.clientHeight)/2);
  lb.tx = Math.min(mx, Math.max(-mx, lb.tx)); lb.ty = Math.min(my, Math.max(-my, lb.ty));
}
function zoomAt(ns, cx, cy){
  ns = Math.min(8, Math.max(1, ns));
  const k = ns / lb.s;
  lb.tx = cx - (cx - lb.tx)*k; lb.ty = cy - (cy - lb.ty)*k; lb.s = ns;
  if(ns <= 1.001){ lb.s = 1; lb.tx = 0; lb.ty = 0; }
  clampT(); applyT();
}
function toggleZoom(e){
  if(lb.s > 1.01){ zoomAt(1,0,0); return; }
  const r = lbStage.getBoundingClientRect();
  const actual = lbImg.naturalWidth / Math.max(1, lbImg.offsetWidth);   // 100% pixel size
  zoomAt(Math.min(8, Math.max(2, actual)), e.clientX - r.left - r.width/2, e.clientY - r.top - r.height/2);
}
lbStage.addEventListener('wheel', e=>{
  e.preventDefault();
  const r = lbStage.getBoundingClientRect();
  zoomAt(lb.s * Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.0018)), e.clientX - r.left - r.width/2, e.clientY - r.top - r.height/2);
}, {passive:false});

const ptrs = new Map(); let pan = null, pinch = null, downOnImg = false, lastTap = 0;
const ptrDist = ()=>{ const [a,b] = [...ptrs.values()]; return Math.hypot(a.x-b.x, a.y-b.y); };
lbStage.addEventListener('pointerdown', e=>{
  try{ lbStage.setPointerCapture(e.pointerId); }catch(err){}
  ptrs.set(e.pointerId, {x:e.clientX, y:e.clientY});
  if(ptrs.size === 1){ pan = {x:e.clientX, y:e.clientY, tx:lb.tx, ty:lb.ty, moved:false}; downOnImg = (e.target === lbImg); }
  else if(ptrs.size === 2){ pinch = {d:ptrDist(), s:lb.s}; pan = null; }
});
lbStage.addEventListener('pointermove', e=>{
  if(!ptrs.has(e.pointerId)) return;
  ptrs.set(e.pointerId, {x:e.clientX, y:e.clientY});
  if(ptrs.size === 2 && pinch){
    const r = lbStage.getBoundingClientRect(), [a,b] = [...ptrs.values()];
    zoomAt(pinch.s * ptrDist() / pinch.d, (a.x+b.x)/2 - r.left - r.width/2, (a.y+b.y)/2 - r.top - r.height/2);
  }else if(pan){
    const dx = e.clientX - pan.x, dy = e.clientY - pan.y;
    if(Math.abs(dx)+Math.abs(dy) > 6) pan.moved = true;
    if(lb.s > 1.01){ lb.tx = pan.tx + dx; lb.ty = pan.ty + dy; clampT(); applyT(); lbStage.classList.add('dragging'); }
  }
});
function endPointer(e){
  if(!ptrs.has(e.pointerId)) return;
  ptrs.delete(e.pointerId); lbStage.classList.remove('dragging');
  if(ptrs.size < 2) pinch = null;
  if(pan && ptrs.size === 0 && e.type === 'pointerup'){
    const dx = e.clientX - pan.x, dy = e.clientY - pan.y;
    if(lb.s <= 1.01 && Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy)*1.4) lbShow(lb.i + (dx<0 ? 1 : -1));
    else if(!pan.moved){
      if(!downOnImg) closeLightbox();
      else{ const now = Date.now(); if(now - lastTap < 320){ toggleZoom(e); lastTap = 0; } else lastTap = now; }
    }
  }
  if(ptrs.size === 0) pan = null;
}
lbStage.addEventListener('pointerup', endPointer);
lbStage.addEventListener('pointercancel', endPointer);

document.getElementById('lbClose').addEventListener('click', ()=>closeLightbox());
document.getElementById('lbPrev').addEventListener('click', ()=>lbShow(lb.i-1));
document.getElementById('lbNext').addEventListener('click', ()=>lbShow(lb.i+1));
document.getElementById('lbZoomIn').addEventListener('click', ()=>zoomAt(lb.s*1.5, 0, 0));
document.getElementById('lbZoomOut').addEventListener('click', ()=>zoomAt(lb.s/1.5, 0, 0));
document.getElementById('lbFit').addEventListener('click', ()=>zoomAt(1, 0, 0));
document.getElementById('lbAdd').addEventListener('click', ()=>pickFiles(lb.base));
document.getElementById('lbReplace').addEventListener('click', ()=>pickFiles(lb.base, lb.list[lb.i].slot));
document.getElementById('lbRemove').addEventListener('click', async ()=>{
  const p = lb.list[lb.i]; if(!p) return;
  const cfg = ghConfig(), published = !!sharedManifest[p.key];
  if(cfg && published){
    if(!confirm(tr('confirmRemoveAll'))) return;
    toast(tr('ghUploading'));
    try{
      await ghSerial(()=>ghCommit(cfg, {removeKeys:[p.key], message:'Remove photo ' + p.key}));
    }catch(err){
      console.error(err); toast(ghErrText(err));
      pendingRemoves.add(p.key); savePendingRemoves();   // keep trying quietly in the background; nothing is lost
      scheduleUpload(20000);
      if(photoData[p.key]) await removeLocalPhoto(lb.base, p.key); else refreshSlideshow(lb.base);
      lbShow(lb.i);
      return;
    }
    delete sharedPhotos[p.key]; delete pendingMap[p.key]; pendingRemoves.delete(p.key); savePending(); savePendingRemoves();
    if(photoData[p.key]) await removeLocalPhoto(lb.base, p.key); else refreshSlideshow(lb.base);
    toast(tr('ghDone'));
  }else if(p.local){
    if(!confirm(tr('confirmRemove'))) return;
    await removeLocalPhoto(lb.base, p.key);
  }
  lbShow(lb.i);
});
lbThumbs.addEventListener('click', e=>{
  const t = e.target instanceof Element ? e.target.closest('button') : null; if(!t) return;
  if(t.id === 'lbThumbAdd') pickFiles(lb.base); else if(t.dataset.ti != null) lbShow(+t.dataset.ti);
});
document.addEventListener('keydown', e=>{
  if(!lbOpen()) return;
  if(e.key === 'Escape') closeLightbox();
  else if(e.key === 'ArrowLeft') lbShow(lb.i-1);
  else if(e.key === 'ArrowRight') lbShow(lb.i+1);
  else if(e.key === '+' || e.key === '=') zoomAt(lb.s*1.4, 0, 0);
  else if(e.key === '-') zoomAt(lb.s/1.4, 0, 0);
  else if(e.key === '0') zoomAt(1, 0, 0);
});

/* ---- "Photos" panel: export for publishing / clear this device ---- */
const crcTable = (()=>{ const t = new Uint32Array(256); for(let n=0;n<256;n++){ let c=n; for(let k=0;k<8;k++) c = c&1 ? 0xEDB88320 ^ (c>>>1) : c>>>1; t[n]=c>>>0; } return t; })();
function crc32(buf){ let c = 0xFFFFFFFF; for(let i=0;i<buf.length;i++) c = crcTable[(c ^ buf[i]) & 255] ^ (c>>>8); return (c ^ 0xFFFFFFFF)>>>0; }
function makeZip(files){   // files: [{name, data:Uint8Array}] -> Blob (stored, no compression; JPEGs are already compressed)
  const enc = new TextEncoder(), parts = [], central = [];
  let offset = 0;
  files.forEach(f=>{
    const name = enc.encode(f.name), crc = crc32(f.data), size = f.data.length;
    const lh = new DataView(new ArrayBuffer(30));
    lh.setUint32(0,0x04034b50,true); lh.setUint16(4,20,true); lh.setUint16(6,0x0800,true); lh.setUint16(8,0,true);
    lh.setUint16(10,0,true); lh.setUint16(12,0x21,true); lh.setUint32(14,crc,true); lh.setUint32(18,size,true);
    lh.setUint32(22,size,true); lh.setUint16(26,name.length,true); lh.setUint16(28,0,true);
    parts.push(new Uint8Array(lh.buffer), name, f.data);
    const ch = new DataView(new ArrayBuffer(46));
    ch.setUint32(0,0x02014b50,true); ch.setUint16(4,20,true); ch.setUint16(6,20,true); ch.setUint16(8,0x0800,true);
    ch.setUint16(10,0,true); ch.setUint16(12,0,true); ch.setUint16(14,0x21,true); ch.setUint32(16,crc,true);
    ch.setUint32(20,size,true); ch.setUint32(24,size,true); ch.setUint16(28,name.length,true); ch.setUint32(42,offset,true);
    central.push(new Uint8Array(ch.buffer), name);
    offset += 30 + name.length + size;
  });
  const cdSize = central.reduce((a,c)=>a+c.length, 0);
  const end = new DataView(new ArrayBuffer(22));
  end.setUint32(0,0x06054b50,true); end.setUint16(8,files.length,true); end.setUint16(10,files.length,true);
  end.setUint32(12,cdSize,true); end.setUint32(16,offset,true);
  return new Blob([...parts, ...central, new Uint8Array(end.buffer)], {type:'application/zip'});
}
async function exportPhotos(){
  const keys = Object.keys(photoData);
  if(!keys.length){ toast(tr('ppNone')); return; }
  const stamp = Date.now().toString(36), manifest = Object.assign({}, sharedManifest), files = [];
  for(const k of keys){
    const name = k.replace(':','_') + '-' + stamp + '.jpg';
    manifest[k] = name;
    files.push({name:'photos/'+name, data:new Uint8Array(await photoData[k].blob.arrayBuffer())});
  }
  files.push({name:'photos/manifest.json', data:new TextEncoder().encode(JSON.stringify(manifest, null, 1))});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(makeZip(files)); a.download = 'trip-photos.zip';
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(()=>URL.revokeObjectURL(a.href), 4000);
}
const ppBack = document.getElementById('ppBack');
function openPanel(){
  const n = Object.keys(photoData).length;
  document.getElementById('ppCount').textContent = n ? tr('ppCount').replace('{n}', n) : tr('ppNone');
  document.getElementById('ppExport').disabled = document.getElementById('ppClear').disabled = !n;
  const cfg = ghConfig(), unsent = Object.keys(photoData).filter(k=>!pendingMap[k]);
  document.getElementById('ppLocalSec').style.display = n ? '' : 'none';
  document.getElementById('ppThumbs').style.display = cfg ? '' : 'none';
  const pubKeys = Object.keys(sharedManifest).filter(k=>/^(gr-)?\d+:\d+$/.test(k));
  document.getElementById('ppPub').textContent = tr('ppPublished').replace('{n}', pubKeys.length);
  const cp = document.getElementById('ppClearPublished');
  cp.style.display = (cfg && pubKeys.length) ? '' : 'none';
  cp.textContent = tr('ppClearPublished').replace('{n}', pubKeys.length);
  document.getElementById('ghStatus').textContent = cfg ? tr('ghConnected').replace('{r}', cfg.owner + '/' + cfg.repo) : tr('ghNotConnected');
  document.getElementById('ghForm').style.display = cfg ? 'none' : '';
  document.getElementById('ghDisconnect').style.display = cfg ? '' : 'none';
  const up = document.getElementById('ppUpload');
  up.style.display = (cfg && unsent.length) ? '' : 'none';
  up.textContent = tr(uploadState === 'retrying' ? 'ppRetryNow' : 'ppUpload').replace('{n}', unsent.length);
  refreshUploadStatus();
  // Owner/repo are never pre-filled: this popup is reachable by any visitor, connected or not, and
  // guessing them from location.hostname/pathname (GitHub Pages URLs are <owner>.github.io/<repo>/)
  // would show the site owner's real GitHub username and repo name to a stranger who never asked
  // for them. Anyone who actually has a token for this repo already knows both values.
  ppBack.hidden = false;
}
const closePanel = ()=>{ ppBack.hidden = true; };
document.getElementById('btnPhotos').addEventListener('click', openPanel);
document.getElementById('ppClose').addEventListener('click', closePanel);
ppBack.addEventListener('click', e=>{ if(e.target === ppBack) closePanel(); });
document.addEventListener('keydown', e=>{ if(e.key==='Escape' && !ppBack.hidden) closePanel(); });
document.getElementById('ppExport').addEventListener('click', exportPhotos);
document.getElementById('ghConnect').addEventListener('click', async ()=>{
  const cfg = {owner:document.getElementById('ghOwner').value.trim(), repo:document.getElementById('ghRepo').value.trim(), token:document.getElementById('ghToken').value.trim()};
  if(!cfg.owner || !cfg.repo || !cfg.token) return;
  toast(tr('ghChecking'));
  try{
    const info = await ghJson(cfg, '');
    if(info.permissions && !info.permissions.push){ toast(tr('ghNoAccess')); return; }
    ghSaveConfig(cfg);
    document.getElementById('ghToken').value = '';
    toast(tr('ghConnected').replace('{r}', cfg.owner + '/' + cfg.repo));
    openPanel(); renderAreas(); renderGardenRoute();
    if(notesDirty.size) scheduleNotesSync(500); else loadNotes().then(()=>{ renderAreas(); renderGardenRoute(); });
    window.dispatchEvent(new Event('ctgr-gh-changed'));
  }catch(err){ toast(ghErrText(err)); }
});
document.getElementById('ghDisconnect').addEventListener('click', ()=>{
  ghSaveConfig(null);
  window.dispatchEvent(new Event('ctgr-gh-changed'));
  clearTimeout(uploadTimer);   // cancel any scheduled retry; an already-running upload stops itself within seconds (see the check inside uploadQueued)
  uploadState = 'idle'; uploadFails = 0;
  openPanel(); renderAreas(); renderGardenRoute();
});
document.getElementById('ppClearPublished').addEventListener('click', async ()=>{
  const cfg = ghConfig(); if(!cfg) return;
  const keys = Object.keys(sharedManifest).filter(k=>/^(gr-)?\d+:\d+$/.test(k));
  if(!keys.length) return;
  if(!confirm(tr('ppConfirmClearPublished').replace('{n}', keys.length))) return;
  document.getElementById('ppClearPublished').disabled = true;
  toast(tr('ghUploadingN').replace('{n}', keys.length));
  try{
    await ghSerial(()=>ghCommit(cfg, {removeKeys:keys, message:'Clear all ' + keys.length + ' published photos'}));
    keys.forEach(k=>{ delete sharedPhotos[k]; delete pendingMap[k]; pendingRemoves.delete(k); });
    savePending(); savePendingRemoves();
    toast(tr('ghAllCleared'));
  }catch(err){
    console.error(err); toast(ghErrText(err));
    keys.forEach(k=>{ delete sharedPhotos[k]; pendingRemoves.add(k); });   // hide them locally now, finish deleting on GitHub in the background
    savePendingRemoves();
    scheduleUpload(20000);
  }
  document.getElementById('ppClearPublished').disabled = false;
  renderAreas(); renderGardenRoute(); openPanel();
});
document.getElementById('ppThumbs').addEventListener('click', async ()=>{
  const cfg = ghConfig(); if(!cfg) return;
  const entries = Object.entries(sharedManifest).filter(([k])=>/^(gr-)?\d+:\d+$/.test(k));
  if(!entries.length){ toast(tr('thumbsNone')); return; }
  toast(tr('thumbsWorking').replace('{a}', 0).replace('{b}', entries.length));
  const need = [];
  await runPool(entries, 6, async([k, f])=>{
    try{ const r = await fetch('photos/t/' + encodeURIComponent(f), {method:'HEAD', cache:'no-store'}); if(!r.ok) need.push(f); }catch(e){ need.push(f); }
  });
  if(!need.length){ toast(tr('thumbsNone')); return; }
  const extra = []; let done = 0;
  await runPool(need, 3, async f=>{
    try{
      const r = await fetch('photos/' + encodeURIComponent(f), {cache:'no-store'});
      if(r.ok) extra.push({path:'photos/t/' + f, blob: await makeThumbBlob(await r.blob())});
    }catch(e){ console.error('thumb failed', f, e); }
    done++; toast(tr('thumbsWorking').replace('{a}', done).replace('{b}', need.length));
  });
  if(!extra.length){ toast(tr('photoFail')); return; }
  try{ await ghCommit(cfg, {extra, message:'Add small versions of ' + extra.length + ' photos'}); toast(tr('thumbsDone')); }
  catch(err){ console.error(err); toast(ghErrText(err)); }
});
document.getElementById('ppUpload').addEventListener('click', async ()=>{
  clearTimeout(uploadTimer); uploadFails = 0;      // a manual tap resets the backoff and tries right away
  await ghSerial(uploadQueued);
  renderAreas(); renderGardenRoute(); openPanel();
});
document.getElementById('ppClear').addEventListener('click', async ()=>{
  if(!confirm(tr('ppConfirmClear'))) return;
  Object.values(photoData).forEach(v=>URL.revokeObjectURL(v.url));
  Object.keys(photoData).forEach(k=>delete photoData[k]);
  await photoDB.clear();
  renderAreas(); renderGardenRoute(); closePanel();
});

/* ---- GitHub sync (saves photos into your repo so every device sees them) ---- */
function ghConfig(){ try{ const c = JSON.parse(localStorage.getItem('ctgr_gh') || 'null'); return (c && c.token && c.owner && c.repo) ? c : null; }catch(e){ return null; } }
function ghSaveConfig(c){ try{ if(c) localStorage.setItem('ctgr_gh', JSON.stringify(c)); else localStorage.removeItem('ctgr_gh'); }catch(e){} }
async function ghFetch(cfg, path, opt){
  opt = opt || {};
  // GitHub's API sends its own Cache-Control headers on GET responses (e.g. the ref/commit/contents
  // lookups below), and the browser will honour those by default — silently serving a stale, cached
  // answer instead of asking GitHub again. Since every commit here depends on reading the repo's
  // CURRENT state first, a stale read means we keep building on top of an outdated ref, which GitHub
  // then rejects as "not a fast-forward" — forever, since the next attempt reads the same stale cache.
  // cache:'no-store' forces a real network request every time, so we always see the true current state.
  return fetch('https://api.github.com/repos/' + encodeURIComponent(cfg.owner) + '/' + encodeURIComponent(cfg.repo) + path, {
    method: opt.method || 'GET',
    cache: 'no-store',
    headers: Object.assign({'Authorization':'Bearer ' + cfg.token, 'Accept':'application/vnd.github+json', 'X-GitHub-Api-Version':'2022-11-28'}, opt.headers || {}),
    body: opt.body ? JSON.stringify(opt.body) : undefined
  });
}
async function ghJson(cfg, path, opt){
  const r = await ghFetch(cfg, path, opt);
  if(!r.ok){ const e = new Error('GitHub ' + r.status); e.status = r.status; try{ e.detail = (await r.json()).message; }catch(_){} throw e; }
  return r.json();
}
function ghErrText(err){
  if(err && err.status === 401) return tr('ghBadToken');
  if(err && err.status === 403) return tr('ghNoAccess');
  if(err && err.status === 404) return tr('ghNotFound');
  return tr('ghFail').replace('{e}', (err && (err.detail || err.message)) || '?');
}
const blobToB64 = b => new Promise((res, rej)=>{ const fr = new FileReader(); fr.onload = ()=>res(String(fr.result).split(',')[1]); fr.onerror = ()=>rej(fr.error); fr.readAsDataURL(b); });

// One commit that adds/replaces/removes photos and rewrites photos/manifest.json
async function ghCommit(cfg, {adds = [], removeKeys = [], extra = [], message}){
  // Belt-and-braces: a photo can never be written under a missing/blank filename — that's what
  // silently overwrote a single "photos/undefined" file over and over in the past. If this ever
  // fires it means a caller forgot to run it through the upload queue's own safety check.
  for(const a of adds){ if(!a.filename || typeof a.filename !== 'string'){ throw new Error('Refusing to upload a photo with no filename (key: ' + a.key + ')'); } }
  let lastErr;
  for(let attempt = 0; attempt < 5; attempt++){
    if(attempt > 0) await new Promise(res=>setTimeout(res, 400 * attempt + Math.random() * 400));
    try{
      const branch = (await ghJson(cfg, '')).default_branch || 'main';
      const head = (await ghJson(cfg, '/git/ref/heads/' + branch)).object.sha;
      const baseTree = (await ghJson(cfg, '/git/commits/' + head)).tree.sha;
      // Read the existing manifest.json through the SAME low-level Git Data API used for
      // everything else here (never the higher-level "contents" API), which can lag a few
      // seconds behind right after a write. Reading it out of the exact tree this commit is
      // about to build on guarantees it reflects every earlier chunk's commit, every time —
      // a stale read here was silently dropping earlier chunks' entries from the manifest.
      let manifest = {};
      const fullTree = await ghJson(cfg, '/git/trees/' + baseTree + '?recursive=1');
      const manifestEntry = (fullTree.tree || []).find(e => e.path === 'photos/manifest.json');
      if(manifestEntry){
        const blobText = await ghJson(cfg, '/git/blobs/' + manifestEntry.sha);
        try{ manifest = JSON.parse(b64ToText(blobText.content)) || {}; }catch(e){ manifest = {}; }
      }
      const tree = [], deletes = [];
      for(const a of adds){
        if(!a.sha) a.sha = (await ghJson(cfg, '/git/blobs', {method:'POST', body:{content: await blobToB64(a.blob), encoding:'base64'}})).sha;
        tree.push({path:'photos/' + a.filename, mode:'100644', type:'blob', sha:a.sha});
        if(a.thumb){
          if(!a.tsha) a.tsha = (await ghJson(cfg, '/git/blobs', {method:'POST', body:{content: await blobToB64(a.thumb), encoding:'base64'}})).sha;
          tree.push({path:'photos/t/' + a.filename, mode:'100644', type:'blob', sha:a.tsha});
        }
        if(manifest[a.key] && manifest[a.key] !== a.filename){ deletes.push('photos/' + manifest[a.key], 'photos/t/' + manifest[a.key]); }
        manifest[a.key] = a.filename;
      }
      for(const x of extra){
        if(!x.sha) x.sha = (await ghJson(cfg, '/git/blobs', {method:'POST', body:{content: await blobToB64(x.blob), encoding:'base64'}})).sha;
        tree.push({path:x.path, mode:'100644', type:'blob', sha:x.sha});
      }
      removeKeys.forEach(k=>{ if(manifest[k]){ deletes.push('photos/' + manifest[k], 'photos/t/' + manifest[k]); delete manifest[k]; } });
      const sorted = Object.fromEntries(Object.entries(manifest).sort((x,y)=>x[0].localeCompare(y[0], undefined, {numeric:true})));
      tree.push({path:'photos/manifest.json', mode:'100644', type:'blob', content: JSON.stringify(sorted, null, 1)});
      const mkTree = extra => ghJson(cfg, '/git/trees', {method:'POST', body:{base_tree: baseTree, tree: tree.concat(extra.map(p=>({path:p, mode:'100644', type:'blob', sha:null})))}});
      let t;
      try{ t = await mkTree(deletes); }
      catch(e){
        if(!(e.status === 422 && deletes.length)) throw e;            // an old file (or its small version) was already gone
        try{ t = await mkTree(deletes.filter(p=>!p.startsWith('photos/t/'))); }
        catch(e2){ if(e2.status === 422) t = await mkTree([]); else throw e2; }
      }
      const c = await ghJson(cfg, '/git/commits', {method:'POST', body:{message: message || 'Update photos', tree: t.sha, parents:[head]}});
      await ghJson(cfg, '/git/refs/heads/' + branch, {method:'PATCH', body:{sha: c.sha}});
      sharedManifest = sorted;
      return sorted;
    }catch(e){ lastErr = e; if(!(e.status === 422 || e.status === 409)) break; }   // 422/409 = someone (another device, or our own retry) committed meanwhile: retry with the new head
  }
  throw lastErr;
}

async function loadManifest(){
  for(let attempt = 0; attempt < 2; attempt++){
    try{
      const r = await fetch('photos/manifest.json?v=' + Date.now(), {cache:'no-store'});
      if(r.ok){
        sharedManifest = (await r.json()) || {};
        Object.keys(sharedPhotos).forEach(k=>delete sharedPhotos[k]);
        Object.entries(sharedManifest).forEach(([k,f])=>{ sharedPhotos[k] = 'photos/' + encodeURIComponent(f); });
      }
      return;      // loaded, or there is no manifest yet
    }catch(e){ await new Promise(res=>setTimeout(res, 1500)); }   // network hiccup: try once more
  }
}
const withTimeout = (p, ms, dflt)=>Promise.race([p, new Promise(res=>setTimeout(()=>res(dflt), ms))]);
const isRealFilename = f => typeof f === 'string' && /\.(jpe?g|png)$/i.test(f);
async function loadPhotos(){
  await loadManifest();
  renderAreas(); renderGardenRoute();      // published photos appear straight away
  try{
    const all = await withTimeout(photoDB.all(), 4000, {});
    Object.entries(all).forEach(([k,b])=>{ if(!photoData[k]) photoData[k] = {url:URL.createObjectURL(b), blob:b}; });
  }catch(e){}
  // A past bug could mark a photo "uploaded" under a broken filename (literally the text
  // "undefined") without it ever really being saved. Treat any such entry as still-pending —
  // never as a match to delete the local original over — so it gets re-uploaded properly instead.
  let repaired = false;
  for(const k of Object.keys(pendingMap)){
    if(!isRealFilename(pendingMap[k])){ delete pendingMap[k]; repaired = true; }
  }
  if(repaired) savePending();
  // photos uploaded to GitHub earlier: once the site's own manifest has them, drop the temporary local copy
  let changed = false;
  for(const [k,f] of Object.entries(pendingMap)){
    if(isRealFilename(f) && sharedManifest[k] === f){
      delete pendingMap[k]; changed = true;
      if(photoData[k]){ URL.revokeObjectURL(photoData[k].url); delete photoData[k]; await photoDB.del(k); }
    }
  }
  if(changed) savePending();
  renderAreas(); renderGardenRoute();
  if(ghConfig() && (pendingUploadBases().length || pendingRemoves.size)) scheduleUpload(1500);
}

