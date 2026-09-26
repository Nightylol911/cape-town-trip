/* ---------- CUSTOMIZE THE DAY-BY-DAY PLAN (per device — not synced) ----------
   The curated ITINERARY14 array is never mutated. Instead each day+slot can carry an override
   — items removed from the curated list, and items the user added — kept in localStorage and
   merged in at render time. Whatever's on screen is also what the PDF/ICS export uses, since
   both read through effectiveSlotItems(). */
let ITIN_OVERRIDES = {};
try{ ITIN_OVERRIDES = JSON.parse(localStorage.getItem('ctgr_itin_overrides') || '{}') || {}; }catch(e){}
const saveItinOverrides = ()=>{ try{ localStorage.setItem('ctgr_itin_overrides', JSON.stringify(ITIN_OVERRIDES)); }catch(e){} };
const slotKey = (day, slot)=> day + ':' + slot;
function slotOverride(day, slot){ return ITIN_OVERRIDES[slotKey(day, slot)] || {removed:[], added:[]}; }
function effectiveSlotItems(day, slot, baseItems){
  const o = slotOverride(day, slot);
  return baseItems.filter(n=> typeof n !== 'string' || !o.removed.includes(n)).concat(o.added);
}
function dayHasOverrides(day, blocksLen){
  for(let j = 0; j < blocksLen; j++){ const o = ITIN_OVERRIDES[slotKey(day, j)]; if(o && (o.removed.length || o.added.length)) return true; }
  return false;
}
function resetItinDay(day, blocksLen){
  for(let j = 0; j < blocksLen; j++) delete ITIN_OVERRIDES[slotKey(day, j)];
  saveItinOverrides();
  renderPlanItinerary();
  toast(tr('itinReset'));
}
function removeFromSlot(day, slot, name){
  const key = slotKey(day, slot);
  const o = ITIN_OVERRIDES[key] || {removed:[], added:[]};
  if(o.added.includes(name)) o.added = o.added.filter(n=>n!==name);
  else if(!o.removed.includes(name)) o.removed.push(name);
  ITIN_OVERRIDES[key] = o;
  saveItinOverrides();
  renderPlanItinerary();
}
function addToSlot(day, slot, name){
  const base = currentItinerary()[day].blocks[slot].items;
  if(effectiveSlotItems(day, slot, base).includes(name)){ toast(tr('itinAlready')); return; }
  const key = slotKey(day, slot);
  const o = ITIN_OVERRIDES[key] || {removed:[], added:[]};
  if(o.removed.includes(name)) o.removed = o.removed.filter(n=>n!==name);
  else o.added.push(name);
  ITIN_OVERRIDES[key] = o;
  saveItinOverrides();
  renderPlanItinerary();
  closePicker();
  toast(tr('itinAdded'));
}

/* ---------- PACKING LIST (checkable, per device) ----------
   UI[lang].pack is a plain, same-order-in-both-languages list of strings, so a checked item is
   remembered by its index — switching EN/AR keeps the same items ticked. */
let PACK_CHECKED = {};
try{ PACK_CHECKED = JSON.parse(localStorage.getItem('ctgr_pack_checked') || '{}') || {}; }catch(e){}
const savePackChecked = ()=>{ try{ localStorage.setItem('ctgr_pack_checked', JSON.stringify(PACK_CHECKED)); }catch(e){} };
function renderPackList(){
  const el = document.getElementById('packList');
  if(!el) return;
  el.innerHTML = UI[LANG].pack.map((t,i)=>{
    const checked = !!PACK_CHECKED[i];
    return `<label class="pack-item ${checked?'checked':''}"><input type="checkbox" data-packidx="${i}" ${checked?'checked':''}><span>${t}</span></label>`;
  }).join('');
  el.querySelectorAll('[data-packidx]').forEach(cb=>{
    cb.addEventListener('change', ()=>{
      const i = +cb.dataset.packidx;
      if(cb.checked) PACK_CHECKED[i] = true; else delete PACK_CHECKED[i];
      savePackChecked();
      cb.closest('.pack-item').classList.toggle('checked', cb.checked);
    });
  });
}

/* the "+ Add" picker: a search + category list over everything in PLACES / GARDEN_ROUTE / SAFARI */
let pickerTarget = null, pickerCat = 'all';
function buildPickerIndex(){
  const idx = [];
  PLACES.forEach(p=> idx.push({n:p.n, n_ar:p.n_ar, c:p.c, rating:p.rating}));
  GARDEN_ROUTE.forEach(t=> t.items.forEach(item=> idx.push({n:item.n, n_ar:item.n_ar, c:item.c, rating:item.rating})));
  SAFARI.forEach(s=> idx.push({n:s.n, n_ar:s.n_ar, c:'activity', rating:s.rating}));
  return idx;
}
function openPicker(day, slot){
  pickerTarget = {day, slot};
  pickerCat = 'all';
  const search = document.getElementById('pickerSearch');
  search.value = '';
  search.placeholder = tr('pickerSearchPh');
  renderPickerFilters();
  renderPickerResults();
  document.getElementById('pickerBack').hidden = false;
  search.focus();
}
function closePicker(){ document.getElementById('pickerBack').hidden = true; pickerTarget = null; }
function renderPickerFilters(){
  const el = document.getElementById('pickerFilters');
  const cats = ['all', ...Object.keys(CATS[LANG])];
  el.innerHTML = cats.map(k=>{
    const label = k === 'all' ? tr('allChip') : CATS[LANG][k].label;
    const dot = k === 'all' ? '' : `<span class="dot" style="background:${CATS[LANG][k].color}"></span>`;
    return `<button type="button" class="chip ${pickerCat===k?'active':''}" data-pcat="${k}">${dot}${label}</button>`;
  }).join('');
  el.querySelectorAll('[data-pcat]').forEach(btn=>{
    btn.addEventListener('click', ()=>{ pickerCat = btn.dataset.pcat; renderPickerFilters(); renderPickerResults(); });
  });
}
function renderPickerResults(){
  const q = (document.getElementById('pickerSearch').value || '').trim().toLowerCase();
  const el = document.getElementById('pickerResults');
  const list = buildPickerIndex().filter(it=>{
    if(pickerCat !== 'all' && it.c !== pickerCat) return false;
    if(!q) return true;
    const name = ((LANG==='ar' ? it.n_ar : it.n) || it.n || '').toLowerCase();
    return name.includes(q) || (it.n||'').toLowerCase().includes(q);
  }).slice(0, 80);
  if(!list.length){ el.innerHTML = `<div class="sr-empty">${LANG==='ar'?'لا نتائج':'No results'}</div>`; return; }
  el.innerHTML = list.map(it=>{
    const name = LANG==='ar' ? (it.n_ar||it.n) : it.n;
    const color = (CATS[LANG][it.c] || {}).color || '#6f8c5f';
    return `<button type="button" class="picker-row" data-pick="${escHtml(it.n)}"><span class="ic-dot" style="background:${color}"></span><span class="picker-name">${escHtml(name)}</span>${it.rating?`<span class="ic-star">★${it.rating.toFixed(1)}</span>`:''}</button>`;
  }).join('');
  el.querySelectorAll('[data-pick]').forEach(btn=>{
    btn.addEventListener('click', ()=>{ if(pickerTarget) addToSlot(pickerTarget.day, pickerTarget.slot, btn.dataset.pick); });
  });
}
function initItinPicker(){
  const search = document.getElementById('pickerSearch'), closeBtn = document.getElementById('pickerClose'), back = document.getElementById('pickerBack');
  if(!search) return;
  search.addEventListener('input', renderPickerResults);
  closeBtn.addEventListener('click', closePicker);
  back.addEventListener('click', (e)=>{ if(e.target === back) closePicker(); });
  document.addEventListener('keydown', (e)=>{ if(e.key === 'Escape' && !back.hidden) closePicker(); });
}

function unifiedChip(ref){
  if(!ref) return '';
  if(typeof ref === 'object'){
    const label = LANG==='ar' ? (ref.n_ar||ref.n) : ref.n;
    const color = ref.hotel ? "#8a4fae" : (ref.color || "#6f8c5f");
    const icon = ref.hotel ? '🏨 ' : '';
    return `<a class="itin-chip ${ref.hotel?'itin-chip-hotel':''}" href="${ref.g}" target="_blank">${icon}<span class="ic-dot" style="background:${color}"></span>${label}${ref.rating?`<span class="ic-star">★${ref.rating.toFixed(1)}</span>`:''}</a>`;
  }
  const name = ref;
  let item = PLACES.find(p=>p.n===name);
  let cat = item ? item.c : null;
  let g = item ? item.g : null;
  let rating = item ? item.rating : null;
  let ratingCount = item ? item.ratingCount : null;
  let book = item ? item.book : null;
  let label = item ? (LANG==='ar'?item.n_ar:item.n) : null;
  if(!item){
    const grItem = GARDEN_ROUTE.flatMap(t=>t.items).find(i=>i.n===name);
    if(grItem){ item=grItem; cat=grItem.c; g=grItem.g; rating=grItem.rating; ratingCount=grItem.ratingCount; book=grItem.book; label=LANG==='ar'?grItem.n_ar:grItem.n; }
  }
  if(!item){
    const safItem = SAFARI.find(s=>s.n===name);
    if(safItem){ item=safItem; cat='activity'; g=safItem.g; rating=safItem.rating; ratingCount=safItem.ratingCount; book=false; label=LANG==='ar'?safItem.n_ar:safItem.n; }
  }
  if(!item) return `<span class="itin-chip" style="opacity:.6;">${name}</span>`;
  const catColors = {activity:"#1f5f6b",restaurant:"#e2622e",coffee:"#8a4fae",shop:"#c9942f",icecream:"#2f9e8f",market:"#6f8c5f",sim:"#5c6f52"};
  const color = catColors[cat] || "#6f8c5f";
  return `<a class="itin-chip" href="${g}" target="_blank"><span class="ic-dot" style="background:${color}"></span>${label}${rating?`<span class="ic-star">★${rating.toFixed(1)}</span>`:''}${book?`<span class="ic-book">●</span>`:''}</a>`;
}
// Where an item could move to — every day's every slot except the one it's already in, grouped
// by day so a 14-day trip's ~65 remaining slots are still easy to scan in a native <select>.
function moveOptionsHtml(excludeDay, excludeSlot){
  let html = '';
  currentItinerary().forEach((day, di)=>{
    const dayLabel = LANG==='ar' ? `اليوم ${di+1}` : `Day ${di+1}`;
    let opts = '';
    day.blocks.forEach((b, si)=>{
      if(di===excludeDay && si===excludeSlot) return;
      const slotLabel = LANG==='ar' ? b.slot_ar : b.slot;
      opts += `<option value="${di}:${si}">${escHtml(slotLabel)}</option>`;
    });
    if(opts) html += `<optgroup label="${escHtml(dayLabel)}">${opts}</optgroup>`;
  });
  return html;
}
function moveItinItem(fromDay, fromSlot, name, toDay, toSlot){
  if(fromDay === toDay && fromSlot === toSlot) return;
  const fromKey = slotKey(fromDay, fromSlot);
  const fo = ITIN_OVERRIDES[fromKey] || {removed:[], added:[]};
  if(fo.added.includes(name)) fo.added = fo.added.filter(n=>n!==name);
  else if(!fo.removed.includes(name)) fo.removed.push(name);
  ITIN_OVERRIDES[fromKey] = fo;
  const toBase = currentItinerary()[toDay].blocks[toSlot].items;
  const alreadyThere = effectiveSlotItems(toDay, toSlot, toBase).includes(name);
  if(!alreadyThere){
    const toKey = slotKey(toDay, toSlot);
    const to = ITIN_OVERRIDES[toKey] || {removed:[], added:[]};
    if(to.removed.includes(name)) to.removed = to.removed.filter(n=>n!==name);
    else to.added.push(name);
    ITIN_OVERRIDES[toKey] = to;
  }
  saveItinOverrides();
  renderPlanItinerary();
  toast(alreadyThere ? tr('itinAlready') : tr('itinMoved'));
}
// Minimal weather nudge: a small rain badge on any day whose forecast (or, beyond the 16-day
// forecast window, typical/historical odds) crosses 50% — nothing more elaborate than that.
let PLAN_RAIN = {};
async function loadPlanRainBadges(){
  const start = effectiveTripStart(), days = effectiveTripDays();
  try{
    const [ct, gr] = await Promise.all([wxDaysFor('ct', start, days), wxDaysFor('gr', start, days)]);
    currentItinerary().forEach((day, i)=>{
      const src = (day.region === 'garden-route' || day.region === 'safari') ? gr[i] : ct[i];
      PLAN_RAIN[i] = (src && src.rain != null) ? src.rain : null;
    });
  }catch(e){ return; }
  applyPlanRainBadges();
}
function applyPlanRainBadges(){
  document.querySelectorAll('.day-rain').forEach(elx=>{
    const rain = PLAN_RAIN[+elx.dataset.rainday];
    if(rain != null && rain >= 50){
      elx.textContent = `🌧 ${Math.round(rain)}%`;
      elx.title = tr('itinRainTip');
      elx.hidden = false;
    }else{
      elx.hidden = true;
    }
  });
}
function renderPlanItinerary(){
  const el = document.getElementById('planItinerary');
  if(!el) return;
  const start = effectiveTripStart(), todayIso = isoToday();
  let html = '';
  currentItinerary().forEach((day,i)=>{
    const title = LANG==='ar' ? day.title_ar : day.title;
    const tip = LANG==='ar' ? day.tip_ar : day.tip;
    const dayLabel = LANG==='ar' ? `اليوم ${i+1}` : `Day ${i+1}`;
    const resetBtn = dayHasOverrides(i, day.blocks.length) ? `<button type="button" class="itin-reset-btn" data-resetday="${i}" aria-label="${tr('itinResetDay')}" title="${tr('itinResetDay')}">↺</button>` : '';
    const dayIso = isoPlusDays(start, i);
    const isToday = dayIso === todayIso;
    const dateLabel = dayDateLabel(dayIso);
    const rainBadge = `<span class="day-rain" data-rainday="${i}" hidden></span>`;
    const todayBadge = isToday ? `<span class="day-today-badge">${escHtml(tr('todayBadge'))}</span>` : '';
    html += `<div class="day-card${isToday?' today':''}" id="${isToday?'planTodayCard':''}"><div class="day-head"><span class="day-num">${dayLabel}</span>${todayBadge}<h3>${title}</h3><div class="day-head-right">${rainBadge}<span class="day-date">${dateLabel}</span>${resetBtn}</div></div><p class="day-tip">${tip}</p>`;
    if(day.hotel){
      const h = day.hotel;
      const hname = LANG==='ar' ? (h.n_ar||h.n) : h.n;
      html += `<div class="hotel-box"><span class="hotel-ic">🏨</span><div><b>${hname}</b><div class="hotel-meta">${h.rating?`★ ${h.rating.toFixed(1)} (${h.ratingCount.toLocaleString()}) · `:''}${LANG==='ar'?h.note_ar:h.note}</div></div><a class="mini-link primary" href="${h.g}" target="_blank">📍 ${tr('directions')}</a></div>`;
    }
    day.blocks.forEach((b,j)=>{
      const slot = LANG==='ar' ? b.slot_ar : b.slot;
      const items = effectiveSlotItems(i, j, b.items);
      const chips = items.map(ref=>{
        const chip = unifiedChip(ref);
        if(typeof ref !== 'string') return chip;
        const moveSel = `<select class="itin-chip-move" data-mvday="${i}" data-mvslot="${j}" data-mvname="${escHtml(ref)}" aria-label="${tr('itinMove')}" title="${tr('itinMove')}"><option value="">⇄</option>${moveOptionsHtml(i,j)}</select>`;
        return `<span class="itin-chip-wrap">${chip}${moveSel}<button type="button" class="itin-chip-rm" data-rmday="${i}" data-rmslot="${j}" data-rmname="${escHtml(ref)}" aria-label="${tr('itinRemove')}" title="${tr('itinRemove')}">×</button></span>`;
      }).join('');
      html += `<div class="slot"><div class="slot-label">${slot}</div><div class="slot-items">${chips}<button type="button" class="itin-add-btn" data-addday="${i}" data-addslot="${j}">+ ${tr('itinAddBtn')}</button></div></div>`;
    });
    html += `</div>`;
  });
  el.innerHTML = html;
  applyPlanRainBadges();
  el.querySelectorAll('[data-rmday]').forEach(btn=>{
    btn.addEventListener('click', ()=> removeFromSlot(+btn.dataset.rmday, +btn.dataset.rmslot, btn.dataset.rmname));
  });
  el.querySelectorAll('[data-mvday]').forEach(sel=>{
    sel.addEventListener('change', ()=>{
      if(!sel.value) return;
      const [toDay, toSlot] = sel.value.split(':').map(Number);
      moveItinItem(+sel.dataset.mvday, +sel.dataset.mvslot, sel.dataset.mvname, toDay, toSlot);
    });
  });
  el.querySelectorAll('[data-addday]').forEach(btn=>{
    btn.addEventListener('click', ()=> openPicker(+btn.dataset.addday, +btn.dataset.addslot));
  });
  el.querySelectorAll('[data-resetday]').forEach(btn=>{
    btn.addEventListener('click', ()=> resetItinDay(+btn.dataset.resetday, currentItinerary()[+btn.dataset.resetday].blocks.length));
  });
  const jumpBtn = document.getElementById('jumpTodayBtn');
  if(jumpBtn) jumpBtn.hidden = !document.getElementById('planTodayCard');
}

function renderGRItinerary(){
  const el = document.getElementById('grItinerary');
  if(!el) return;
  let html = '';
  GR_ITINERARY.forEach((day,i)=>{
    const title = LANG==='ar' ? day.title_ar : day.title;
    const tip = LANG==='ar' ? day.tip_ar : day.tip;
    const dayLabel = LANG==='ar' ? `اليوم ${i+1}` : `Day ${i+1}`;
    html += `<div class="day-card"><div class="day-head"><span class="day-num">${dayLabel}</span><h3>${title}</h3></div><p class="day-tip">${tip}</p>`;
    day.blocks.forEach(b=>{
      const slot = LANG==='ar' ? b.slot_ar : b.slot;
      const chips = b.items.map(grItinChip).join('');
      html += `<div class="slot"><div class="slot-label">${slot}</div><div class="slot-items">${chips || (LANG==='ar'?'<span style="color:#8a7f70;font-size:12.5px;">راجعا تبويب السفاري</span>':'<span style="color:#8a7f70;font-size:12.5px;">See the Safari tab</span>')}</div></div>`;
    });
    html += `</div>`;
  });
  el.innerHTML = html;
}

function renderItinerary(){
  const el = document.getElementById('itinerary');
  if(!el) return;
  let html = '';
  ITINERARY.forEach((day,i)=>{
    const title = LANG==='ar' ? day.title_ar : day.title;
    const tip = LANG==='ar' ? day.tip_ar : day.tip;
    const dayLabel = LANG==='ar' ? `اليوم ${i+1}` : `Day ${i+1}`;
    html += `<div class="day-card"><div class="day-head"><span class="day-num">${dayLabel}</span><h3>${title}</h3></div><p class="day-tip">${tip}</p>`;
    day.blocks.forEach(b=>{
      const slot = LANG==='ar' ? b.slot_ar : b.slot;
      const chips = b.items.map(itinChip).join('');
      html += `<div class="slot"><div class="slot-label">${slot}</div><div class="slot-items">${chips}</div></div>`;
    });
    html += `</div>`;
  });
  el.innerHTML = html;
}

function renderAreas(){
  const areasEl = document.getElementById('areas');
  let html = '';
  Object.keys(AREAS_META).forEach((akey)=>{
    let items = byArea[akey] || [];
    if(activeFilter!=='all') items = items.filter(p=>p.c===activeFilter);
    if(items.length===0) return;
    const ameta = AREAS_META[akey];
    html += `<div class="area-block"><div class="area-head"><span class="swatch" style="background:${ameta.color}"></span><h3>${ameta[LANG]}</h3><span class="count">${items.length}</span></div><div class="grid">`;
    items.forEach(p=>{
      const idx = PLACES.indexOf(p);
      const cat = CATS[LANG][p.c];
      const isPicked = picked.has(idx);
      const name = LANG==='ar'?p.n_ar:p.n;
      const about = LANG==='ar'?p.about_ar:p.about;
      const wear = LANG==='ar'?p.wear_ar:p.wear;
      const best = LANG==='ar'?p.best_ar:p.best;
      const dur = LANG==='ar'?p.dur_ar:p.dur;
      const mynote = LANG==='ar'?p.mynote_ar:p.mynote;
      const cuisine = LANG==='ar'?p.cuisine_ar:p.cuisine;
      html += `<div class="card ${isPicked?'picked':''}" data-idx="${idx}">
        ${slideshow(idx)}
        <div class="card-body">
          <div class="card-top"><h4>${name}</h4><button class="pick-btn" data-pick="${idx}" title="pick">${isPicked?'♥':'○'}</button></div>
          <div class="pill-row">
            <span class="catpill" style="background:${cat.color}22;color:${cat.color}">${cat.label}</span>
            ${cuisine ? `<span class="catpill cuisine-pill">${cuisine}</span>` : ``}
            ${p.rating ? `<span class="rating-pill">★ ${p.rating.toFixed(1)} <i>(${p.ratingCount.toLocaleString()})</i></span>` : ``}
            <span class="price-pill">${p.price ? money(p.price) : tr('freeLabel')}</span>
            ${p.weak ? `<span class="weak-pill" title="${tr('weakSignalTip')}">📶 ${tr('weakSignal')}</span>` : ``}
          </div>
          <p class="about">${about||''}</p>
          ${mynote ? `<div class="mynote">📝 ${mynote}</div>` : ``}
          ${wear ? `<div class="wear">🧥 <span><b>${tr('wear')}:</b> ${wear}</span></div>` : ``}
          <div class="meta-row"><div>🕐 <b>${best||'—'}</b></div><div>⏱ <b>${dur||'—'}</b></div></div>
          ${p.book ? `<div class="badge-book">${tr('bookBadge')}</div>` : ``}
          ${unoteBlock('p:'+p.n)}
          <div class="card-actions">
            <a class="mini-link primary" href="${p.g}" target="_blank">📍 ${tr('directions')}</a>
            ${(p.c==='restaurant'||p.c==='coffee') ? `<a class="mini-link ${p.menu&&p.menu.v?'verified':''}" href="${p.menu?p.menu.url:gsearch(p.n+' Cape Town menu')}" target="_blank">📋 ${tr('menuBtn')}</a>` : ``}
            ${p.phone ? `<a class="mini-link" href="tel:${p.phone.replace(/\s/g,'')}">📞 ${p.phone}</a>` : ``}
          </div>
          ${p.book ? `<button class="steps-toggle" data-toggle="${idx}">${tr('howToBook')} ▸</button>
          <div class="steps" id="steps-${idx}">
            <p style="margin:0 0 8px;color:#6b6157">${LANG==='ar'?p.book.note_ar:p.book.note}</p>
            <ol>${(LANG==='ar'?p.book.steps_ar:p.book.steps).map(s=>`<li>${s}</li>`).join('')}</ol>
            <a class="book-link" href="${p.book.link}" target="_blank">${p.book.v?tr('official'):tr('findOperator')}</a>
            ${p.phone ? `<span class="book-phone">📞 <a href="tel:${p.phone.replace(/\s/g,'')}">${p.phone}</a></span>` : ``}
          </div>` : ``}
        </div>
      </div>`;
    });
    html += `</div></div>`;
  });
  areasEl.innerHTML = html || '';
  wireCardEvents(areasEl);
}

function wireCardEvents(areasEl){
  areasEl.querySelectorAll('[data-pick]').forEach(btn=>{
    btn.addEventListener('click', ()=>{ const idx=+btn.dataset.pick; if(picked.has(idx)) picked.delete(idx); else picked.add(idx); renderAreas(); updateSelCount(); renderDrawer(); updateBudget(); });
  });
  areasEl.querySelectorAll('[data-toggle]').forEach(btn=>{
    btn.addEventListener('click', ()=>{ const el=document.getElementById('steps-'+btn.dataset.toggle); el.classList.toggle('open'); btn.textContent=(el.classList.contains('open')?tr('howToBook')+' ▾':tr('howToBook')+' ▸'); });
  });
  wireNoteEvents(areasEl);
}
