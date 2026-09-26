/* ================= ITINERARY PDF =================
   Builds a clean, print-only document (#printDoc) from the 14-day plan (+ your shortlist),
   with up to 3 small photos per place, then opens the browser's print dialog ("Save as PDF"). */
const thumbData = new Map();       // photo url -> small JPEG data URL (keeps the PDF light)
const thumbJobs = new Map();
let pdfBusy = false;
const CAT_BY_COLOR = {'#e2622e':'restaurant','#8a4fae':'coffee','#1f5f6b':'activity','#c9942f':'shop','#2f9e8f':'icecream'};
const pt = (o,k)=> (LANG==='ar' ? (o[k+'_ar'] || o[k]) : o[k]) || '';
const BIG5_AR = {Elephant:'الفيل', Lion:'الأسد', Leopard:'النمر', Rhino:'وحيد القرن', Buffalo:'الجاموس'};

function clipText(s, n){
  s = String(s || ''); if(s.length <= n) return s;
  const cut = s.slice(0, n), dot = cut.lastIndexOf('. ');
  return dot > n*0.55 ? cut.slice(0, dot+1) : cut.replace(/\s+\S*$/, '') + '…';
}
const shortUrl = u => String(u||'').replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');

function makeThumb(url, small){
  if(thumbJobs.has(url)) return thumbJobs.get(url);
  const job = new Promise(resolve=>{
    const img = new Image(); let done = false, triedFull = !small || small === url;
    const finish = v=>{ if(done) return; done = true; if(v) thumbData.set(url, v); resolve(v); };
    setTimeout(()=>finish(null), 20000);
    img.onload = ()=>{
      try{
        const k = Math.min(1, 480 / Math.max(img.naturalWidth, img.naturalHeight));
        const c = document.createElement('canvas'); c.width = Math.max(1, Math.round(img.naturalWidth*k)); c.height = Math.max(1, Math.round(img.naturalHeight*k));
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        finish(c.toDataURL('image/jpeg', 0.75));
      }catch(e){ finish(null); }
    };
    img.onerror = ()=>{ if(!triedFull){ triedFull = true; img.src = url; } else finish(null); };
    img.src = triedFull ? url : small;
  });
  thumbJobs.set(url, job); return job;
}
async function runPool(list, limit, fn){
  let i = 0;
  await Promise.all(Array.from({length: Math.min(limit, list.length)}, async ()=>{ while(i < list.length){ const x = list[i++]; await fn(x); } }));
}

/* turn a name / custom pick / hotel into one uniform record */
function resolveRef(ref){
  if(!ref) return null;
  if(typeof ref === 'object'){
    if(ref.hotel) return {kind:'hotel', id:ref.n, name:pt(ref,'n'), g:ref.g, rating:ref.rating, ratingCount:ref.ratingCount, note:pt(ref,'note')};
    const cat = CAT_BY_COLOR[ref.color] || null;
    return {kind:'pick', id:ref.n, name:pt(ref,'n'), cat, g:ref.g, rating:ref.rating, ratingCount:ref.ratingCount, facts:[]};
  }
  const bookOf = (b, phone)=>{
    if(b && typeof b === 'object') return {bookFlag:true, bookNote:pt(b,'note'), steps:(LANG==='ar' ? (b.steps_ar||b.steps) : b.steps) || [], bookLink:b.link || ''};
    return {bookFlag:!!b, bookNote:'', steps:[], bookLink:''};
  };
  const idx = PLACES.findIndex(p=>p.n === ref);
  if(idx >= 0){
    const p = PLACES[idx];
    return Object.assign({kind:'place', id:p.n, base:String(idx), name:pt(p,'n'), cat:p.c, area:AREAS_META[p.a] ? AREAS_META[p.a][LANG] : '',
      about:clipText(pt(p,'about'), 380), cuisine:pt(p,'cuisine'), rating:p.rating, ratingCount:p.ratingCount, weak:p.weak, phone:p.phone||'', g:p.g, mynote:pt(p,'mynote'),
      priceText: p.price>0 ? money(p.price) : (p.c==='activity' ? tr('freeLabel') : ''),
      facts:[[tr('best'),pt(p,'best')],[tr('dur'),pt(p,'dur')],[tr('wear'),pt(p,'wear')]].filter(f=>f[1])}, bookOf(p.book));
  }
  let flatIdx = 0;
  for(const t of GARDEN_ROUTE){
    for(const it of t.items){
      if(it.n === ref){
        return Object.assign({kind:'gr', id:it.n, base:'gr-'+flatIdx, name:pt(it,'n'), cat:it.c, area:pt(t,'town'),
          about:clipText(pt(it,'about'), 380), rating:it.rating, ratingCount:it.ratingCount, weak:it.weak, g:it.g, mynote:pt(it,'mynote'),
          priceText: it.price>0 ? money(it.price) : (it.c==='activity' ? tr('freeLabel') : ''), facts:[]}, {bookFlag:!!it.book, bookNote:'', steps:[], bookLink:''});
      }
      flatIdx++;
    }
  }
  const s = SAFARI.find(x=>x.n === ref);
  if(s){
    const big5 = (s.big5||[]).map(b=>LANG==='ar' ? (BIG5_AR[b]||b) : b).join(LANG==='ar' ? '، ' : ', ');
    return {kind:'safari', id:s.n, name:pt(s,'n'), area:pt(s,'location'), about:clipText(pt(s,'about'), 380), rating:s.rating, ratingCount:s.ratingCount,
      g:s.g, mynote:pt(s,'mynote'), priceText:pt(s,'price'), bookFlag:false, steps:(LANG==='ar' ? (s.steps_ar||s.steps) : s.steps) || [], bookLink:s.site||'', bookNote:'',
      facts:[[LANG==='ar'?'يشمل':'Includes', pt(s,'includes')],[LANG==='ar'?'الخمسة الكبار':'Big Five here', big5]].filter(f=>f[1])};
  }
  return {kind:'text', id:String(ref), name:String(ref)};
}

function buildPrintModel(){
  const used = new Set(); let stay = null;
  const itin = currentItinerary();
  const days = itin.map((d, i)=>{
    if(d.hotel) stay = d.hotel;
    const blocks = d.blocks.map((b,j)=>({label:pt(b,'slot'), items:effectiveSlotItems(i, j, b.items).map(r=>{ const it = resolveRef(r); if(it) used.add(it.id); return it; }).filter(Boolean)}));
    return {i, title:pt(d,'title'), tip:pt(d,'tip'), date:dayDateLabel(isoPlusDays(effectiveTripStart(), i)), hotel:d.hotel ? resolveRef(d.hotel) : null, stay:(i === itin.length-1) ? null : (stay ? resolveRef(stay) : null), blocks};
  });
  const groups = {}, already = [];
  const add = (label, it)=>{ if(!it) return; if(used.has(it.id)){ already.push(it.name); return; } (groups[label] = groups[label] || []).push(it); };
  [...picked].sort((a,b)=>a-b).forEach(i=>{ const p = PLACES[i]; if(p) add(AREAS_META[p.a] ? AREAS_META[p.a][LANG] : '', resolveRef(p.n)); });
  const grFlat = GARDEN_ROUTE.flatMap(t=>t.items.map(it=>({it, t})));
  [...grPicked].sort((a,b)=>a-b).forEach(i=>{ const x = grFlat[i]; if(x) add(pt(x.t,'town') + (LANG==='ar' ? ' (طريق الحدائق)' : ' (Garden Route)'), resolveRef(x.it.n)); });
  return {days, groups, already, budget:computeBudget()};
}

function pdHotel(h){
  return `<div class="pd-hotel"><span class="pd-hotel-ic">🏨</span><div class="pd-hotel-main"><b>${escHtml(h.name)}</b><div class="pd-sub">${h.rating ? `★ ${h.rating.toFixed(1)} (${h.ratingCount.toLocaleString()}) · ` : ''}${escHtml(h.note||'')}</div></div><a class="pd-link" href="${escHtml(h.g)}">${escHtml(tr('pdfMap'))}</a></div>`;
}
function pdItem(it){
  if(it.kind === 'text') return `<div class="pd-item pd-plain"><div class="pd-main"><h4>${escHtml(it.name)}</h4></div></div>`;
  const photos = it.base ? photosFor(it.base).slice(0,3).map(p=>thumbData.get(p.url)).filter(Boolean) : [];
  const cat = it.cat && CATS[LANG][it.cat];
  const color = cat ? cat.color : (it.kind === 'safari' ? '#8a4fae' : '#6f8c5f');
  const pills = [];
  if(cat) pills.push(`<span class="pd-pill" style="--c:${cat.color}">${escHtml(cat.label)}</span>`);
  if(it.kind === 'safari') pills.push(`<span class="pd-pill" style="--c:#8a4fae">${LANG==='ar' ? 'سفاري' : 'Safari'}</span>`);
  if(it.cuisine) pills.push(`<span class="pd-pill pd-soft">${escHtml(it.cuisine)}</span>`);
  const meta = [];
  if(it.area) meta.push(escHtml(it.area));
  if(it.rating) meta.push(`★ ${it.rating.toFixed(1)}${it.ratingCount ? ` (${it.ratingCount.toLocaleString()})` : ''}`);
  if(it.priceText) meta.push(`<b>${escHtml(it.priceText)}</b>`);
  if(it.weak) meta.push(escHtml(tr('weakSignal')));
  const facts = (it.facts||[]).filter(([k,v])=>!(k === tr('wear') && /^(casual|كاجوال)[.\s]*$/i.test(String(v).trim())))
    .map(([k,v])=>`<div class="pd-fact"><b>${escHtml(k)}</b> ${escHtml(v)}</div>`).join('');
  const steps = (it.steps||[]).slice(0,4).map(s=>`<li>${escHtml(s)}</li>`).join('');
  const book = (it.bookFlag || it.bookLink || steps)
    ? `<div class="pd-book">${it.bookFlag ? `<b>${escHtml(tr('bookBadge'))}</b>` : `<b>${escHtml(tr('pdfHowBook'))}</b>`}${it.bookNote ? ` — ${escHtml(it.bookNote)}` : ''}${steps ? `<ol>${steps}</ol>` : ''}${it.bookLink ? `<div><a class="pd-link" href="${escHtml(it.bookLink)}">${escHtml(shortUrl(it.bookLink))}</a></div>` : ''}</div>` : '';
  return `<div class="pd-item" style="--c:${color}">
    <div class="pd-main">
      <h4>${escHtml(it.name)}</h4>
      <div class="pd-meta">${pills.join('')}${meta.length ? `<span>${meta.join(' · ')}</span>` : ''}</div>
      ${it.about ? `<p class="pd-about">${escHtml(it.about)}</p>` : ''}
      ${facts ? `<div class="pd-facts">${facts}</div>` : ''}
      ${it.mynote ? `<div class="pd-note">📝 ${escHtml(it.mynote)}</div>` : ''}
      ${book}
      <div class="pd-links">${it.g ? `<a class="pd-link" href="${escHtml(it.g)}">📍 ${escHtml(tr('pdfMap'))}</a>` : ''}${it.phone ? `<a class="pd-link" href="tel:${escHtml(String(it.phone).replace(/\s/g,''))}">📞 ${escHtml(it.phone)}</a>` : ''}</div>
    </div>
    ${photos.length ? `<div class="pd-photos">${photos.map(src=>`<img src="${src}" alt="">`).join('')}</div>` : ''}
  </div>`;
}

// The drawer's own "view itinerary" print button (as opposed to the full-plan "Download PDF"
// button on the Plan tab) should print exactly what's in that drawer — the visitor's own
// selected/favourite places — not the entire day-by-day plan with the shortlist tacked on after.
// Where each hotel stay starts/ends, read straight off currentItinerary()'s own d.hotel markers
// (the same source the full-plan PDF and the day cards use) — works for the real trip and for a
// visitor's custom one alike, no separate bookkeeping needed.
function buildStaysList(){
  const itin = currentItinerary(), start = effectiveTripStart();
  const starts = [];
  itin.forEach((d, i)=>{ if(d.hotel) starts.push({i, title:pt(d,'title'), hotel:resolveRef(d.hotel)}); });
  return starts.map((s, idx)=>{
    const endIdx = (idx+1 < starts.length) ? starts[idx+1].i - 1 : itin.length - 1;
    return {
      title: s.title,
      hotelName: s.hotel ? s.hotel.name : '',
      startDate: dayDateLabel(isoPlusDays(start, s.i)),
      endDate: dayDateLabel(isoPlusDays(start, endIdx)),
    };
  });
}
function buildShortlistPrintModel(){
  const groups = {};
  const add = (label, it)=>{ if(!it) return; (groups[label] = groups[label] || []).push(it); };
  [...picked].sort((a,b)=>a-b).forEach(i=>{ const p = PLACES[i]; if(p) add(AREAS_META[p.a] ? AREAS_META[p.a][LANG] : '', resolveRef(p.n)); });
  const grFlat = GARDEN_ROUTE.flatMap(t=>t.items.map(it=>({it, t})));
  [...grPicked].sort((a,b)=>a-b).forEach(i=>{ const x = grFlat[i]; if(x) add(pt(x.t,'town') + (LANG==='ar' ? ' (طريق الحدائق)' : ' (Garden Route)'), resolveRef(x.it.n)); });
  const start = effectiveTripStart(), days = effectiveTripDays();
  return {
    groups, budget:computeBudget(), stays:buildStaysList(),
    arrival:{date:dayDateLabel(start), time:tripArrivalTime()},
    departure:{date:dayDateLabel(isoPlusDays(start, days - 1)), time:tripDepartTime()},
  };
}
function renderShortlistPrintDoc(m){
  const ar = LANG === 'ar';
  const title = ar ? 'كيب تاون وطريق الحدائق' : 'Cape Town & Garden Route';
  const today = new Date().toLocaleDateString(ar ? 'ar-SA-u-nu-latn' : 'en-GB', {day:'numeric', month:'short', year:'numeric'});
  const groupNames = Object.keys(m.groups);
  let html = `<section class="pd-cover">
    <div class="pd-kicker">${escHtml(tr('viewItinerary'))}</div>
    <h1>${title}</h1>
    <table class="pd-glance"><tbody>
      <tr><td><b>${escHtml(tr('pdfArrival'))}</b></td><td>${escHtml(m.arrival.date)}${m.arrival.time ? ` · ${escHtml(m.arrival.time)}` : ''}</td></tr>
      <tr><td><b>${escHtml(tr('pdfDeparture'))}</b></td><td>${escHtml(m.departure.date)}${m.departure.time ? ` · ${escHtml(m.departure.time)}` : ''}</td></tr>
    </tbody></table>
    <p class="pd-foot">${escHtml(tr('pdfFoot'))} · ${today}</p>
  </section>`;
  if(m.stays.length){
    html += `<section class="pd-day pd-short pd-flow"><header class="pd-dayhead"><h2>${escHtml(tr('pdfStays'))}</h2></header>`;
    html += m.stays.map(s=>`<div class="pd-staying">🏨 <b>${escHtml(s.hotelName || tr('onboardHotelTBD'))}</b> — ${escHtml(s.title)} <span class="pd-sub">(${escHtml(s.startDate)}${s.endDate!==s.startDate ? ` – ${escHtml(s.endDate)}` : ''})</span></div>`).join('');
    html += `</section>`;
  }
  html += `<section class="pd-day pd-short pd-flow"><header class="pd-dayhead"><h2>${escHtml(tr('pdfShortlist'))}</h2></header>`;
  if(!groupNames.length) html += `<p class="pd-tip">${escHtml(tr('nothingPicked'))}</p>`;
  groupNames.forEach(g=>{ html += `<h3 class="pd-h3">${escHtml(g)}</h3>${m.groups[g].map(pdItem).join('')}`; });
  if(m.budget.count) html += `<div class="pd-total">${escHtml(tr('budgetTotal'))} <b>≈ ${escHtml(budgetDisplay(m.budget.total))}</b> <span>${escHtml(tr('budgetApprox'))}</span></div>`;
  html += `</section>`;
  return html;
}
async function printShortlist(){
  if(pdfBusy) return; pdfBusy = true;
  try{
    const model = buildShortlistPrintModel();
    const bases = new Set();
    Object.values(model.groups).forEach(arr=>arr.forEach(it=>{ if(it && it.base) bases.add(it.base); }));
    const smallOf = new Map();
    [...bases].forEach(b=>photosFor(b).slice(0,3).forEach(p=>{ if(!thumbData.has(p.url)) smallOf.set(p.url, p.thumb); }));
    const urls = [...smallOf.keys()];
    let done = 0;
    if(urls.length){
      toast(tr('pdfPreparing').replace('{a}', 0).replace('{b}', urls.length));
      await runPool(urls, 4, async u=>{ await makeThumb(u, smallOf.get(u)); done++; toast(tr('pdfPreparing').replace('{a}', done).replace('{b}', urls.length)); });
    }
    const doc = document.getElementById('printDoc');
    doc.innerHTML = renderShortlistPrintDoc(model);
    await Promise.all([...doc.querySelectorAll('img')].map(i=>i.decode ? i.decode().catch(()=>{}) : null));
    document.body.classList.add('printing');
    const cleanup = ()=>{ document.body.classList.remove('printing'); window.removeEventListener('afterprint', cleanup); };
    window.addEventListener('afterprint', cleanup);
    setTimeout(cleanup, 180000);
    window.print();
  }catch(err){ console.error(err); toast(tr('pdfFail')); }
  finally{ pdfBusy = false; }
}
function renderPrintDoc(m){
  const ar = LANG === 'ar';
  const dayWord = i => ar ? `اليوم ${i+1}` : `Day ${i+1}`;
  const title = ar ? 'كيب تاون وطريق الحدائق' : 'Cape Town & Garden Route';
  const today = new Date().toLocaleDateString(ar ? 'ar-SA-u-nu-latn' : 'en-GB', {day:'numeric', month:'short', year:'numeric'});
  const glance = m.days.map(d=>`<tr><td><b>${dayWord(d.i)}</b></td><td>${escHtml(d.date)}</td><td>${escHtml(d.title)}</td><td>${d.stay ? escHtml(d.stay.name) : '—'}</td></tr>`).join('');
  const num = (label, v)=>`<div class="pd-num">${escHtml(label)}: <b dir="ltr">${v}</b></div>`;
  let html = `<section class="pd-cover">
    <div class="pd-kicker">${escHtml(tr('eyebrow'))}</div>
    <h1>${title}</h1>
    <h3 class="pd-h3">${escHtml(tr('pdfGlance'))}</h3>
    <table class="pd-glance"><thead><tr><th>${escHtml(tr('pdfColDay'))}</th><th>${escHtml(tr('pdfColDate'))}</th><th>${escHtml(tr('pdfColPlan'))}</th><th>${escHtml(tr('pdfColStay'))}</th></tr></thead><tbody>${glance}</tbody></table>
    <p class="pd-foot">${escHtml(tr('pdfFoot'))} · ${today}</p>
  </section>`;
  m.days.forEach(d=>{
    html += `<section class="pd-day"><header class="pd-dayhead"><span class="pd-daynum">${dayWord(d.i)}</span>${d.date ? `<span class="pd-date">${escHtml(d.date)}</span>` : ''}<h2>${escHtml(d.title)}</h2></header>`;
    if(d.tip) html += `<p class="pd-tip">${escHtml(d.tip)}</p>`;
    if(d.hotel) html += pdHotel(d.hotel);
    else if(d.stay) html += `<div class="pd-staying">🏨 ${escHtml(tr('pdfStayingAt'))} <b>${escHtml(d.stay.name)}</b></div>`;
    d.blocks.forEach(b=>{
      html += `<div class="pd-slot"><div class="pd-slotlabel">${escHtml(b.label)}</div>${b.items.map(pdItem).join('')}</div>`;
    });
    html += `</section>`;
  });
  const groupNames = Object.keys(m.groups);
  if(groupNames.length || m.already.length){
    html += `<section class="pd-day pd-short"><header class="pd-dayhead"><h2>${escHtml(tr('pdfShortlist'))}</h2></header>`;
    if(m.already.length) html += `<p class="pd-tip">${escHtml(tr('pdfAlready'))}: ${escHtml(m.already.join(ar ? '، ' : ', '))}</p>`;
    groupNames.forEach(g=>{ html += `<h3 class="pd-h3">${escHtml(g)}</h3>${m.groups[g].map(pdItem).join('')}`; });
    if(m.budget.count) html += `<div class="pd-total">${escHtml(tr('budgetTotal'))} <b>≈ ${escHtml(budgetDisplay(m.budget.total))}</b> <span>${escHtml(tr('budgetApprox'))}</span></div>`;
    html += `</section>`;
  }
  return html;
}

async function printItinerary(){
  if(pdfBusy) return; pdfBusy = true;
  try{
    const model = buildPrintModel();
    const bases = new Set();
    const collect = it=>{ if(it && it.base) bases.add(it.base); };
    model.days.forEach(d=>d.blocks.forEach(b=>b.items.forEach(collect)));
    Object.values(model.groups).forEach(arr=>arr.forEach(collect));
    const smallOf = new Map();
    [...bases].forEach(b=>photosFor(b).slice(0,3).forEach(p=>{ if(!thumbData.has(p.url)) smallOf.set(p.url, p.thumb); }));
    const urls = [...smallOf.keys()];
    let done = 0;
    if(urls.length){
      toast(tr('pdfPreparing').replace('{a}', 0).replace('{b}', urls.length));
      await runPool(urls, 4, async u=>{ await makeThumb(u, smallOf.get(u)); done++; toast(tr('pdfPreparing').replace('{a}', done).replace('{b}', urls.length)); });
    }
    const doc = document.getElementById('printDoc');
    doc.innerHTML = renderPrintDoc(model);
    await Promise.all([...doc.querySelectorAll('img')].map(i=>i.decode ? i.decode().catch(()=>{}) : null));
    document.body.classList.add('printing');
    const cleanup = ()=>{ document.body.classList.remove('printing'); window.removeEventListener('afterprint', cleanup); };
    window.addEventListener('afterprint', cleanup);
    setTimeout(cleanup, 180000);
    window.print();
  }catch(err){ console.error(err); toast(tr('pdfFail')); }
  finally{ pdfBusy = false; }
}
document.getElementById('printBtn').addEventListener('click', printShortlist);
document.getElementById('clearPicksBtn').addEventListener('click', ()=>{
  if(picked.size===0 && grPicked.size===0) return;
  if(!confirm(tr('confirmClearPicks'))) return;
  picked.clear(); grPicked.clear();
  renderAreas(); renderGardenRoute(); updateSelCount(); renderDrawer(); updateBudget();
});
document.getElementById('pdfBtnPlan').addEventListener('click', printItinerary);
document.getElementById('icsBtnPlan').addEventListener('click', ()=>downloadTripICS());
document.getElementById('jumpTodayBtn').addEventListener('click', ()=>{
  const card = document.getElementById('planTodayCard');
  if(card) card.scrollIntoView({behavior:'smooth', block:'center'});
});

/* ---------- BACKUP: download/restore everything this device remembers about the trip ----------
   Everything below is per-device localStorage — a visitor's own dates/cities/hotels, their day-by-day
   customizations, shortlist, packing checklist and actual-spending log. None of it is synced anywhere
   (only the owner's GitHub-connected notes/photos are), so switching phones or clearing site data
   loses it silently. This is a plain-JSON backup file the person keeps themselves and can reload. */
function exportTripFile(){
  const data = {
    exportedAt: new Date().toISOString(),
    visitorStart: VISITOR_START,
    visitorArrivalTime: VISITOR_ARRIVAL_TIME,
    visitorDepartTime: VISITOR_DEPART_TIME,
    customItin: CUSTOM_ITIN,
    itinOverrides: ITIN_OVERRIDES,
    picked: [...picked],
    grPicked: [...grPicked],
    expenses: EXPENSES,
    packChecked: PACK_CHECKED,
    notes: isOwner() ? undefined : USER_NOTES,   // the owner's notes already sync via GitHub
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], {type:'application/json'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'my-cape-town-trip.json';
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(()=>URL.revokeObjectURL(a.href), 4000);
  toast(tr('exportTripDone'));
}
function importTripFile(file){
  const reader = new FileReader();
  reader.onload = ()=>{
    let data;
    try{ data = JSON.parse(reader.result); }catch(e){ toast(tr('importTripFail')); return; }
    try{
      if(data.visitorStart){ localStorage.setItem('ctgr_visitor_start', data.visitorStart); }
      if(Array.isArray(data.customItin) && data.customItin.length){ localStorage.setItem('ctgr_custom_itin', JSON.stringify(data.customItin)); }
      if(data.visitorArrivalTime || data.visitorDepartTime){ localStorage.setItem('ctgr_visitor_times', JSON.stringify({arrival:data.visitorArrivalTime||'', depart:data.visitorDepartTime||''})); }
      if(data.itinOverrides){ localStorage.setItem('ctgr_itin_overrides', JSON.stringify(data.itinOverrides)); }
      if(Array.isArray(data.picked) && Array.isArray(data.grPicked)){ localStorage.setItem('ctgr_picks', JSON.stringify({p:data.picked, g:data.grPicked})); }
      if(Array.isArray(data.expenses)){ localStorage.setItem('ctgr_expenses', JSON.stringify(data.expenses)); }
      if(data.packChecked){ localStorage.setItem('ctgr_pack_checked', JSON.stringify(data.packChecked)); }
      if(data.notes && !isOwner()){ localStorage.setItem('ctgr_usernotes', JSON.stringify(data.notes)); }
    }catch(e){ toast(tr('importTripFail')); return; }
    toast(tr('importTripDone'));
    setTimeout(()=>location.reload(), 600);   // simplest safe way to have every part of the page re-init from the new state
  };
  reader.onerror = ()=> toast(tr('importTripFail'));
  reader.readAsText(file);
}
document.getElementById('exportTripBtn').addEventListener('click', exportTripFile);
document.getElementById('importTripBtn').addEventListener('click', ()=> document.getElementById('importTripFile').click());
document.getElementById('importTripFile').addEventListener('change', (e)=>{
  const file = e.target.files && e.target.files[0];
  if(file) importTripFile(file);
  e.target.value = '';
});

/* ---------- "ADD TO HOME SCREEN" PROMPT ----------
   Chrome/Edge/Android fire beforeinstallprompt and give us a real, one-tap native install flow.
   iOS Safari never fires that event at all — "Add to Home Screen" only exists inside its Share
   sheet, so the best this page can do there is point at it once. Either way: never shown if
   already installed (standalone display mode), and permanently dismissible. */
function initInstallPrompt(){
  const banner = document.getElementById('installBanner');
  if(!banner) return;
  const KEY = 'ctgr_install_dismissed';
  let dismissed = false;
  try{ dismissed = localStorage.getItem(KEY) === '1'; }catch(e){}
  // matchMedia should exist in any real browser, but this whole feature is a nice-to-have — never
  // let a missing/throwing API here take down every init call that runs after it.
  let isStandalone = false;
  try{ isStandalone = (typeof window.matchMedia === 'function' && window.matchMedia('(display-mode: standalone)').matches) || window.navigator.standalone === true; }catch(e){}
  if(dismissed || isStandalone) return;

  const textEl = document.getElementById('installBannerText'), btn = document.getElementById('installBannerBtn'),
    closeBtn = document.getElementById('installBannerClose');
  let deferredPrompt = null, mode = null;   // mode: 'android' (real prompt) | 'ios' (manual instructions)

  function refreshText(){
    if(!mode) return;
    textEl.textContent = tr(mode === 'android' ? 'installBannerTextAndroid' : 'installBannerTextIos');
    btn.hidden = mode !== 'android';
    if(mode === 'android') btn.textContent = tr('installNowBtn');
  }
  function show(m){ mode = m; refreshText(); banner.hidden = false; }
  function hide(persist){ banner.hidden = true; if(persist){ try{ localStorage.setItem(KEY, '1'); }catch(e){} } }

  closeBtn.addEventListener('click', ()=> hide(true));
  window.addEventListener('ctgr-lang-changed', refreshText);

  window.addEventListener('beforeinstallprompt', (e)=>{
    e.preventDefault();
    deferredPrompt = e;
    show('android');
  });
  btn.addEventListener('click', async ()=>{
    if(!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice.catch(()=>{});
    deferredPrompt = null;
    hide(true);
  });
  window.addEventListener('appinstalled', ()=> hide(true));

  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.MSStream;
  if(isIOS){
    // Give beforeinstallprompt (which won't fire on iOS anyway) no chance to race this, and don't
    // interrupt the moment the page loads — a few seconds in feels less like a popup ad.
    setTimeout(()=>{ if(banner.hidden) show('ios'); }, 3000);
  }
}

