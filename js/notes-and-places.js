/* ================= BUILD ================= */
const picked = new Set();
const grPicked = new Set();
let activeFilter = "all";

/* ---------- YOUR OWN NOTES (per place) ----------
   Always saved to this browser first (instant, works offline). If a GitHub token is connected
   (same one used for ⚙️ Admin — see ghConfig()), edited notes also sync to notes.json in the
   repo, so they follow you to any device instead of being stuck on this one. Only the keys you
   actually changed on THIS device get pushed — merged into whatever's already there — so two
   devices editing different places' notes never clobber each other. */
let USER_NOTES = {};
try{ USER_NOTES = JSON.parse(localStorage.getItem('ctgr_usernotes') || '{}') || {}; }catch(e){}
let notesDirty = new Set();
try{ notesDirty = new Set(JSON.parse(localStorage.getItem('ctgr_notes_dirty') || '[]')); }catch(e){}
const saveNotesLocal = ()=>{ try{ localStorage.setItem('ctgr_usernotes', JSON.stringify(USER_NOTES)); }catch(e){} };
const saveNotesDirty = ()=>{ try{ localStorage.setItem('ctgr_notes_dirty', JSON.stringify([...notesDirty])); }catch(e){} };
function saveUserNote(key, val){
  val = (val || '').trim();
  if(val) USER_NOTES[key] = val; else delete USER_NOTES[key];
  saveNotesLocal();
  notesDirty.add(key); saveNotesDirty();
  if(ghConfig()) scheduleNotesSync();
}
let notesSyncTimer = null, notesSyncBusy = false, notesSyncFails = 0;
function scheduleNotesSync(delay){
  if(notesSyncTimer) clearTimeout(notesSyncTimer);
  notesSyncTimer = setTimeout(syncNotesNow, delay != null ? delay : 2500);
}
const b64ToText = b64 => new TextDecoder().decode(Uint8Array.from(atob(b64.replace(/\n/g,'')), c=>c.charCodeAt(0)));
async function syncNotesNow(){
  const cfg = ghConfig();
  if(!cfg || notesDirty.size === 0 || notesSyncBusy) return;
  notesSyncBusy = true;
  const myDirty = [...notesDirty];
  try{
    const branch = (await ghJson(cfg, '')).default_branch || 'main';
    let sha, remote = {};
    const r = await ghFetch(cfg, '/contents/notes.json?ref=' + encodeURIComponent(branch), {headers:{'Accept':'application/vnd.github+json'}});
    // NOTE: don't swallow a parse failure here into remote={} — that would make a hiccup reading
    // the existing file look like "there are no notes yet" and overwrite everyone else's synced
    // notes with just this device's. Let it throw, so the outer catch retries later instead.
    if(r.ok){ const d = await r.json(); sha = d.sha; remote = JSON.parse(b64ToText(d.content)) || {}; }
    else if(r.status !== 404){ throw Object.assign(new Error('GitHub ' + r.status), {status: r.status}); }
    // apply only what changed on THIS device on top of whatever's on GitHub right now
    myDirty.forEach(k=>{ if(USER_NOTES[k] != null) remote[k] = USER_NOTES[k]; else delete remote[k]; });
    const sorted = Object.fromEntries(Object.entries(remote).sort((a,b)=>a[0].localeCompare(b[0])));
    const content = await blobToB64(new Blob([JSON.stringify(sorted, null, 1)], {type:'application/json'}));
    await ghJson(cfg, '/contents/notes.json', {method:'PUT', body:{message:'Update notes', content, sha, branch}});
    myDirty.forEach(k=>notesDirty.delete(k)); saveNotesDirty();
    // this is now what's on GitHub: our overlaid changes + anything other devices added — but
    // keep whatever's currently typed locally for any key edited again while this sync was in
    // flight (still marked dirty), so a fast second edit is never silently reverted
    const stillDirty = {};
    notesDirty.forEach(k=>{ if(USER_NOTES[k] != null) stillDirty[k] = USER_NOTES[k]; });
    USER_NOTES = Object.assign({}, sorted, stillDirty);
    saveNotesLocal();
    renderAreas(); renderGardenRoute();
    notesSyncFails = 0;
  }catch(e){
    notesSyncFails++;
    scheduleNotesSync(Math.min(60000, 4000 * Math.pow(1.8, notesSyncFails)) + Math.random() * 1000);
  }finally{
    notesSyncBusy = false;
    if(notesDirty.size) scheduleNotesSync(2000);
  }
}
async function loadNotes(){
  try{
    const r = await fetch('notes.json?v=' + Date.now(), {cache:'no-store'});
    if(r.ok){
      const remote = await r.json() || {};
      Object.entries(remote).forEach(([k, v])=>{ if(!notesDirty.has(k)) USER_NOTES[k] = v; });
      saveNotesLocal();
    }
  }catch(e){}
  if(ghConfig() && notesDirty.size) scheduleNotesSync(1000);
}

/* ---------- ADD A PLACE (GitHub-connected devices only) ----------
   New cards are appended to custom-places.json in the repo (same read-merge-write pattern as
   notes.json above) and merged into PLACES / GARDEN_ROUTE at load time, so every existing
   feature — picks, notes, the budget, search, the map — treats them exactly like a curated
   place. The section (Cape Town neighbourhood, or Garden Route town) is auto-detected from
   whichever already-known location is geographically closest to the coordinates given. */
const GR_TOWN_COORDS = {
  'Hermanus':{lat:-34.4187,lng:19.2345}, 'Mossel Bay':{lat:-34.1830,lng:22.1460}, 'George':{lat:-33.9628,lng:22.4619},
  'Oudtshoorn':{lat:-33.5906,lng:22.2014}, 'Wilderness':{lat:-33.9989,lng:22.5793}, 'Sedgefield':{lat:-34.0206,lng:22.7943},
  'Knysna':{lat:-34.0363,lng:23.0471}, 'Plettenberg Bay':{lat:-34.0527,lng:23.3716}, 'Tsitsikamma':{lat:-34.0176,lng:23.8879}
};
function haversineKm(lat1, lng1, lat2, lng2){
  const R = 6371, toRad = d=>d*Math.PI/180;
  const dLat = toRad(lat2-lat1), dLng = toRad(lng2-lng1);
  const a = Math.sin(dLat/2)**2 + Math.cos(toRad(lat1))*Math.cos(toRad(lat2))*Math.sin(dLng/2)**2;
  return 2*R*Math.asin(Math.sqrt(a));
}
function detectSection(lat, lng){
  let best = null, bestDist = Infinity;
  Object.entries(AREAS_META).forEach(([key, m])=>{
    const d = haversineKm(lat, lng, m.lat, m.lng);
    if(d < bestDist){ bestDist = d; best = {kind:'ct', key}; }
  });
  Object.entries(GR_TOWN_COORDS).forEach(([town, c])=>{
    const d = haversineKm(lat, lng, c.lat, c.lng);
    if(d < bestDist){ bestDist = d; best = {kind:'gr', town}; }
  });
  return best ? Object.assign({distanceKm: bestDist}, best) : null;
}
function parseLatLng(input){
  input = (input || '').trim();
  let m = input.match(/^(-?\d{1,3}(?:\.\d+)?)\s*,\s*(-?\d{1,3}(?:\.\d+)?)$/);
  if(m) return {lat:+m[1], lng:+m[2]};
  m = input.match(/@(-?\d{1,3}\.\d+),(-?\d{1,3}\.\d+)/);
  if(m) return {lat:+m[1], lng:+m[2]};
  m = input.match(/[?&](?:q|ll|daddr)=(-?\d{1,3}\.\d+),(-?\d{1,3}\.\d+)/);
  if(m) return {lat:+m[1], lng:+m[2]};
  return null;
}
function apSectionOptionsHtml(){
  const parts = [];
  Object.entries(AREAS_META).forEach(([key, m])=> parts.push(`<option value="ct:${key}">${LANG==='ar'?m.ar:m.en}</option>`));
  Object.keys(GR_TOWN_COORDS).forEach(town=>{
    const t = GARDEN_ROUTE.find(x=>x.town===town);
    const label = t ? (LANG==='ar'?t.town_ar:t.town) : town;
    parts.push(`<option value="gr:${town}">${label} (${LANG==='ar'?'طريق الحدائق':'Garden Route'})</option>`);
  });
  return parts.join('');
}
function mergeCustomPlace(place){
  if(place._kind === 'gr'){
    const t = GARDEN_ROUTE.find(x=>x.town === place._town);
    if(t) t.items.push(place);
  } else if(place.a){
    PLACES.push(place);
    if(!byArea[place.a]) byArea[place.a] = [];
    byArea[place.a].push(place);
  }
}
async function loadCustomPlaces(){
  try{
    const r = await fetch('custom-places.json?v=' + Date.now(), {cache:'no-store'});
    if(!r.ok) return;
    const list = await r.json();
    if(!Array.isArray(list) || !list.length) return;
    list.forEach(mergeCustomPlace);
    SEARCH_INDEX = null;
    document.getElementById('statTotal').textContent = PLACES.length;
    document.getElementById('mapCount').textContent = PLACES.length;
    document.getElementById('statAreas').textContent = Object.keys(byArea).length;
    renderAreas(); renderGardenRoute(); renderMarkers();
  }catch(e){}
}
async function saveCustomPlace(place){
  const cfg = ghConfig();
  if(!cfg) throw new Error('not connected');
  const branch = (await ghJson(cfg, '')).default_branch || 'main';
  let sha, list = [];
  const r = await ghFetch(cfg, '/contents/custom-places.json?ref=' + encodeURIComponent(branch), {headers:{'Accept':'application/vnd.github+json'}});
  if(r.ok){ const d = await r.json(); sha = d.sha; list = JSON.parse(b64ToText(d.content)) || []; if(!Array.isArray(list)) list = []; }
  else if(r.status !== 404){ throw Object.assign(new Error('GitHub ' + r.status), {status: r.status}); }
  list.push(place);
  const content = await blobToB64(new Blob([JSON.stringify(list, null, 1)], {type:'application/json'}));
  await ghJson(cfg, '/contents/custom-places.json', {method:'PUT', body:{message:'Add place: ' + place.n, content, sha, branch}});
  return list;
}
function initAddPlace(){   // called later, once canEdit()/ghConfig() etc. below are defined — see the init calls near the bottom of the script
  const back = document.getElementById('addPlaceBack'), btn = document.getElementById('btnAddPlace');
  if(!back || !btn) return;
  const nameEl = document.getElementById('apName'), nameArEl = document.getElementById('apNameAr'),
    catEl = document.getElementById('apCategory'), locEl = document.getElementById('apLocation'),
    detectedEl = document.getElementById('apDetected'), sectionWrap = document.getElementById('apSectionWrap'),
    sectionEl = document.getElementById('apSection'), priceEl = document.getElementById('apPrice'),
    aboutEl = document.getElementById('apAbout'), statusEl = document.getElementById('apStatus'),
    saveBtn = document.getElementById('apSave'), closeBtn = document.getElementById('apClose');
  let detected = null;

  function refreshAddPlaceBtn(){ btn.style.display = canEdit() ? '' : 'none'; }
  refreshAddPlaceBtn();
  window.addEventListener('ctgr-gh-changed', refreshAddPlaceBtn);

  function resetDetected(){
    detected = null;
    detectedEl.textContent = tr('apDetectedEmpty'); detectedEl.classList.add('ap-empty');
    sectionWrap.hidden = true;
  }
  function openForm(){
    catEl.innerHTML = Object.entries(CATS[LANG]).map(([k,v])=>`<option value="${k}">${v.label}</option>`).join('');
    sectionEl.innerHTML = apSectionOptionsHtml();
    nameEl.value = ''; nameArEl.value = ''; locEl.value = ''; priceEl.value = ''; aboutEl.value = ''; statusEl.textContent = '';
    resetDetected();
    back.hidden = false;
    nameEl.focus();
  }
  function closeForm(){ back.hidden = true; }
  btn.addEventListener('click', openForm);
  closeBtn.addEventListener('click', closeForm);
  back.addEventListener('click', (e)=>{ if(e.target === back) closeForm(); });
  document.addEventListener('keydown', (e)=>{ if(e.key === 'Escape' && !back.hidden) closeForm(); });

  locEl.addEventListener('input', ()=>{
    const coords = parseLatLng(locEl.value);
    if(!coords){ resetDetected(); return; }
    const d = detectSection(coords.lat, coords.lng);
    if(!d){ resetDetected(); return; }
    detected = Object.assign({}, coords, d);
    const areaLabel = detected.kind === 'ct'
      ? (LANG==='ar' ? AREAS_META[detected.key].ar : AREAS_META[detected.key].en)
      : (function(){ const t = GARDEN_ROUTE.find(x=>x.town===detected.town); return t ? (LANG==='ar'?t.town_ar:t.town) : detected.town; })();
    detectedEl.textContent = tr('apDetectedFound').replace('{area}', areaLabel).replace('{dist}', detected.distanceKm.toFixed(1));
    detectedEl.classList.remove('ap-empty');
    sectionEl.value = detected.kind === 'ct' ? ('ct:' + detected.key) : ('gr:' + detected.town);
    sectionWrap.hidden = false;
  });

  saveBtn.addEventListener('click', async ()=>{
    const name = nameEl.value.trim();
    if(!name){ statusEl.textContent = tr('apNeedName'); return; }
    const coords = parseLatLng(locEl.value);
    if(!coords || !detected){ statusEl.textContent = tr('apNeedLocation'); return; }
    const sectionVal = sectionEl.value || (detected.kind==='ct' ? 'ct:'+detected.key : 'gr:'+detected.town);
    const [kind, keyOrTown] = sectionVal.split(':');
    const priceVal = priceEl.value ? Math.round(+priceEl.value) : 0;
    const about = aboutEl.value.trim();
    const g = `https://www.google.com/maps?q=${coords.lat},${coords.lng}`;
    const place = kind === 'ct'
      ? {n:name, c:catEl.value, a:keyOrTown, g, lat:coords.lat, lng:coords.lng, price:priceVal, about}
      : {_kind:'gr', _town:keyOrTown, n:name, c:catEl.value, g, price:priceVal, about};
    if(nameArEl.value.trim()) place.n_ar = nameArEl.value.trim();
    if(about) place.about_ar = about;   // no auto-translation available — keeps the card from showing blank in Arabic

    saveBtn.disabled = true;
    statusEl.textContent = tr('apSaving');
    try{
      await saveCustomPlace(place);
      mergeCustomPlace(place);
      SEARCH_INDEX = null;
      document.getElementById('statTotal').textContent = PLACES.length;
      document.getElementById('mapCount').textContent = PLACES.length;
      document.getElementById('statAreas').textContent = Object.keys(byArea).length;
      renderAreas(); renderGardenRoute(); renderMarkers();
      statusEl.textContent = tr('apSaved');
      toast(tr('apSaved'));
      setTimeout(closeForm, 900);
    }catch(e){
      statusEl.textContent = tr('apFail').replace('{e}', (e && (e.detail || e.message)) || '?');
    }finally{
      saveBtn.disabled = false;
    }
  });
}

function unoteBlock(key){
  const val = USER_NOTES[key] || '';
  const preview = val.length > 70 ? val.slice(0, 70) + '…' : val;
  return `<div class="unote" data-notewrap="${escHtml(key)}">
    ${val ? `<div class="unote-preview" data-noteedit="${escHtml(key)}">🖊️ ${escHtml(preview)}</div>`
          : `<button type="button" class="unote-toggle" data-noteedit="${escHtml(key)}">🖊️ ${tr('noteAdd')}</button>`}
    <textarea class="unote-box" rows="2" data-notesave="${escHtml(key)}" placeholder="${tr('notePlaceholder')}" hidden>${escHtml(val)}</textarea>
    <p class="unote-hint" hidden></p>
  </div>`;
}
function wireNoteEvents(container){
  container.querySelectorAll('[data-noteedit]').forEach(el=>{
    el.addEventListener('click', ()=>{
      const wrap = el.closest('[data-notewrap]');
      const box = wrap.querySelector('[data-notesave]');
      const hint = wrap.querySelector('.unote-hint');
      el.style.display = 'none';
      box.hidden = false;
      box.focus();
      const v = box.value; box.value = ''; box.value = v; // put the caret at the end
      if(hint){
        hint.hidden = false;
        hint.textContent = canEdit() ? '☁ ' + tr('noteSynced') : '📱 ' + tr('ghHint');
        hint.classList.toggle('unote-hint-local', !canEdit());
      }
    });
  });
  container.querySelectorAll('[data-notesave]').forEach(box=>{
    let t;
    box.addEventListener('input', ()=>{ clearTimeout(t); t = setTimeout(()=>saveUserNote(box.dataset.notesave, box.value), 500); });
    box.addEventListener('blur', ()=>{ clearTimeout(t); saveUserNote(box.dataset.notesave, box.value); });
  });
}
