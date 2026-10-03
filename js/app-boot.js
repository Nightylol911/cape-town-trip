/* ---------- COLLAPSIBLE MAJOR SECTIONS ----------
   Weather, Universal Travel Checklist, Before-you-travel, Currency, Useful Apps, Renting a car
   and Emergency info all get a toggle appended to their header, collapsing everything else in
   that card. Runs once at boot (it restructures the DOM by moving children into a wrapper) —
   later re-renders (language switch etc.) only touch what's already inside .section-body, they
   don't rebuild the card's own header/body split. Every section starts expanded. */
function makeSectionCollapsible(cardEl, headEl){
  if(!cardEl || !headEl || cardEl.dataset.collapsible) return;
  cardEl.dataset.collapsible = '1';
  headEl.classList.add('section-head-flex');
  const body = document.createElement('div');
  body.className = 'section-body';
  [...cardEl.children].forEach(ch=>{ if(ch !== headEl) body.appendChild(ch); });
  cardEl.appendChild(body);
  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'section-toggle';
  toggle.setAttribute('aria-label', tr('sectionToggle'));
  toggle.setAttribute('aria-expanded', 'true');
  toggle.textContent = '▾';
  headEl.appendChild(toggle);
  toggle.addEventListener('click', (e)=>{
    e.stopPropagation();
    const collapsed = cardEl.classList.toggle('section-collapsed');
    toggle.setAttribute('aria-expanded', String(!collapsed));
  });
}
function initCollapsibleSections(){
  makeSectionCollapsible(document.querySelector('.weather'), document.querySelector('.weather-head'));
  makeSectionCollapsible(document.querySelector('.checklist-card'), document.querySelector('.checklist-card-head'));
  makeSectionCollapsible(document.querySelector('.travel-notice'), document.querySelector('.tn-head'));
  makeSectionCollapsible(document.querySelector('.fx-card'), document.querySelector('.fx-head'));
  makeSectionCollapsible(document.querySelector('.apps-card'), document.querySelector('.apps-card h2'));
  makeSectionCollapsible(document.querySelector('.car-rental-card'), document.querySelector('.car-rental-head'));
  makeSectionCollapsible(document.querySelector('.emergency-card'), document.querySelector('.emergency-head'));
}

/* ---------- THEME (dark mode) ---------- */
const ICON_SUN = '<circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>';
const ICON_MOON = '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z"/>';
let THEME = 'light';
function applyTheme(theme){
  document.getElementById('htmlRoot').setAttribute('data-theme', theme === 'dark' ? 'dark' : 'light');
  if(theme !== 'dark') document.getElementById('htmlRoot').removeAttribute('data-theme');
  const icon = document.getElementById('themeIcon');
  if(icon) icon.innerHTML = theme === 'dark' ? ICON_MOON : ICON_SUN;
  const btn = document.getElementById('btnTheme');
  if(btn) btn.setAttribute('aria-pressed', theme === 'dark' ? 'true' : 'false');
}
function setTheme(theme, persist){
  THEME = theme === 'dark' ? 'dark' : 'light';
  if(persist){ try{ localStorage.setItem('ctgr_theme', THEME); }catch(e){} }
  applyTheme(THEME);
}
(function initTheme(){
  let saved = null;
  try{ saved = localStorage.getItem('ctgr_theme'); }catch(e){}
  setTheme(saved || 'light', false);   // light is the default; dark is opt-in via the toggle
})();
const btnTheme = document.getElementById('btnTheme');
if(btnTheme) btnTheme.addEventListener('click', ()=> setTheme(THEME === 'dark' ? 'light' : 'dark', true));

const TAB_IDS = ['about','plan','capetown','gardenroute','safari'];
const tabFromHash = ()=>{ const m = location.hash.match(/^#\/?([a-z]+)$/); return (m && TAB_IDS.includes(m[1])) ? m[1] : null; };
function activateTab(tab, opts){
  if(!TAB_IDS.includes(tab)) tab = 'about';
  document.querySelectorAll('.maintab').forEach(b=>b.classList.toggle('active', b.dataset.tab === tab));
  document.querySelectorAll('.tabpanel').forEach(p=>p.classList.toggle('active', p.id === 'tab-' + tab));
  activeTab = tab;
  // The activity search only covers Cape Town/Garden Route/Safari places — nothing on the About
  // South Africa tab is searchable, so hide the search box there instead of showing one that
  // searches content that isn't even on screen. .search-wrap has no unconditional `display:` of
  // its own, so plain [hidden] works without needing a CSS override.
  const searchWrap = document.querySelector('.search-wrap');
  if(searchWrap){
    searchWrap.hidden = (tab === 'about');
    if(tab === 'about'){
      const resultsEl = document.getElementById('searchResults');
      if(resultsEl) resultsEl.style.display = 'none';
    }
  }
  // Places curated / neighbourhoods / need pre-booking / countdown are all Cape Town itinerary
  // stats — jarring as the very first thing a visitor sees now that About South Africa is the
  // default landing tab, before they've reached anything those numbers describe. Hidden there,
  // shown everywhere else (same pattern as the search box above).
  const heroStats = document.querySelector('.hero-stats');
  if(heroStats) heroStats.hidden = (tab === 'about');
  updateHeroTitle();
  if(tab === 'capetown' && typeof map !== 'undefined') setTimeout(()=>{ map.invalidateSize(); }, 50);
  if(!(opts && opts.noHash)){ try{ history.replaceState(history.state, '', '#/' + tab); }catch(e){} }
  if(window.scrollFabsUpdate) setTimeout(window.scrollFabsUpdate, 60);
}
document.querySelectorAll('.maintab').forEach(btn=>{ btn.addEventListener('click', ()=>activateTab(btn.dataset.tab)); });
window.addEventListener('hashchange', ()=>{ const tb = tabFromHash(); if(tb && tb !== activeTab) activateTab(tb, {noHash:true}); });

/* restore what you had open before a refresh: tab (from the URL), language, hearted places */
(function restoreState(){
  try{
    const s = JSON.parse(localStorage.getItem('ctgr_picks') || 'null');
    if(s){ (s.p||[]).forEach(i=>{ if(PLACES[+i]) picked.add(+i); }); (s.g||[]).forEach(i=>grPicked.add(+i)); }
  }catch(e){}
})();
let savedLang = 'en'; try{ savedLang = localStorage.getItem('ctgr_lang') === 'ar' ? 'ar' : 'en'; }catch(e){}
setLang(savedLang);
initCollapsibleSections();
activateTab(tabFromHash() || 'about', {noHash:true});
loadPhotos();
loadWeather();
renderAboutSA();
renderGardenRoute();
renderSafari();
fxLoad();
loadNotes().then(()=>{ renderAreas(); renderGardenRoute(); });
loadTravelChecklist();
loadDoneItems();
initAddPlace();
initItinPicker();
initFxWidget();
initOnboarding();
initInstallPrompt();
loadCustomPlaces();
setInterval(updateCountdown, 60 * 60 * 1000);
document.addEventListener('visibilitychange', ()=>{ if(!document.hidden && notesDirty.size) scheduleNotesSync(300); if(!document.hidden && checklistDirty.size) scheduleChecklistSync(300); if(!document.hidden && doneDirty.size) scheduleDoneSync(300); });
window.addEventListener('online', ()=>{ if(notesDirty.size) scheduleNotesSync(300); if(checklistDirty.size) scheduleChecklistSync(300); if(doneDirty.size) scheduleDoneSync(300); });

/* ---------- GLOBAL SEARCH ---------- */
function buildSearchIndex(){
  const idx = [];
  PLACES.forEach(p=>{
    idx.push({n:p.n, n_ar:p.n_ar, g:p.g, rating:p.rating, cat:CATS.en[p.c]?.label||p.c, cat_ar:CATS.ar[p.c]?.label||p.c, area:AREAS_META[p.a]?AREAS_META[p.a].en:'', area_ar:AREAS_META[p.a]?AREAS_META[p.a].ar:'', color:(CATS.en[p.c]?{activity:"#1f5f6b",restaurant:"#e2622e",coffee:"#8a4fae",shop:"#c9942f",icecream:"#2f9e8f",market:"#6f8c5f",sim:"#5c6f52"}[p.c]:"#6f8c5f"), tab:'capetown'});
  });
  GARDEN_ROUTE.forEach(t=>{
    t.items.forEach(item=>{
      idx.push({n:item.n, n_ar:item.n_ar, g:item.g, rating:item.rating, cat:CATS.en[item.c]?.label||item.c, cat_ar:CATS.ar[item.c]?.label||item.c, area:t.town, area_ar:t.town_ar, color:{activity:"#1f5f6b",restaurant:"#e2622e",coffee:"#8a4fae",shop:"#c9942f"}[item.c]||"#6f8c5f", tab:'gardenroute'});
    });
  });
  SAFARI.forEach(s=>{
    idx.push({n:s.n, n_ar:s.n_ar, g:s.g, rating:s.rating, cat:LANG==='ar'?'سفاري':'Safari', cat_ar:'سفاري', area:'', area_ar:'', color:"#8a4fae", tab:'safari'});
  });
  return idx;
}
let SEARCH_INDEX = null;
function runSearch(q){
  const resultsEl = document.getElementById('searchResults');
  if(!q || q.trim().length<2){ resultsEl.style.display='none'; resultsEl.innerHTML=''; return; }
  if(!SEARCH_INDEX) SEARCH_INDEX = buildSearchIndex();
  const ql = q.trim().toLowerCase();
  const matches = SEARCH_INDEX.filter(it=>{
    const name = (LANG==='ar' ? it.n_ar : it.n) || it.n || '';
    return name.toLowerCase().includes(ql) || (it.n||'').toLowerCase().includes(ql) || (it.n_ar||'').includes(q.trim());
  }).slice(0,25);
  if(matches.length===0){
    resultsEl.innerHTML = `<div class="sr-empty">${LANG==='ar'?'لا نتائج':'No results'}</div>`;
    resultsEl.style.display='block';
    return;
  }
  resultsEl.innerHTML = matches.map(it=>{
    const name = LANG==='ar' ? it.n_ar : it.n;
    const cat = LANG==='ar' ? it.cat_ar : it.cat;
    const area = LANG==='ar' ? it.area_ar : it.area;
    return `<a class="sr-item" href="${it.g}" target="_blank" data-tab="${it.tab}"><span class="sr-dot" style="background:${it.color}"></span><span class="sr-name">${name}</span><span class="sr-meta">${cat}${area?' · '+area:''}${it.rating?' · ★'+it.rating.toFixed(1):''}</span></a>`;
  }).join('');
  resultsEl.style.display='block';
  resultsEl.querySelectorAll('.sr-item').forEach(a=>{
    a.addEventListener('click', ()=>{
      const tabBtn = document.querySelector(`.maintab[data-tab="${a.dataset.tab}"]`);
      if(tabBtn) tabBtn.click();
    });
  });
}
const searchInputEl = document.getElementById('searchInput');
if(searchInputEl){
  // This field should only ever hold what someone actually typed. If the browser (Chrome's
  // account autofill has done this here) fills it on its own, wipe it out immediately —
  // the CSS animation above only plays at the exact moment autofill happens.
  searchInputEl.addEventListener('animationstart', e=>{
    if(e.animationName === 'ctgrAutofillStart' && searchInputEl.value && !searchInputEl.dataset.userTyped){
      searchInputEl.value = '';
      runSearch('');
    }
  });
  searchInputEl.addEventListener('input', ()=>{ searchInputEl.dataset.userTyped = '1'; });
  searchInputEl.addEventListener('input', (e)=> runSearch(e.target.value));
  searchInputEl.addEventListener('focus', (e)=> { if(e.target.value.trim().length>=2) runSearch(e.target.value); });
  document.addEventListener('click', (e)=>{
    if(!e.target.closest('.search-wrap')){ document.getElementById('searchResults').style.display='none'; }
  });
}

/* ---------- SCROLL TO TOP / BOTTOM ---------- */
(function(){
  const fabTop = document.getElementById('fabTop'), fabBottom = document.getElementById('fabBottom');
  if(!fabTop || !fabBottom) return;
  let ticking = false;
  function update(){
    ticking = false;
    const y = window.scrollY || document.documentElement.scrollTop;
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    fabTop.classList.toggle('show', y > 500);
    fabBottom.classList.toggle('show', maxScroll > 500 && y < maxScroll - 400);
  }
  function requestUpdate(){ if(!ticking){ ticking = true; requestAnimationFrame(update); } }
  window.addEventListener('scroll', requestUpdate, {passive:true});
  window.addEventListener('resize', requestUpdate);
  fabTop.addEventListener('click', ()=> window.scrollTo({top:0, behavior:'smooth'}));
  fabBottom.addEventListener('click', ()=> window.scrollTo({top:document.documentElement.scrollHeight, behavior:'smooth'}));
  window.scrollFabsUpdate = requestUpdate;
  update();
})();

/* ---------- TRACK YOUR FLIGHT ----------
   Looked up in-page, not a redirect — adsbdb.com is a free, keyless, CORS-open API (verified
   directly: `Access-Control-Allow-Origin: *` on every response) that resolves either an IATA
   ("QR1130") or ICAO ("QTR1130") callsign to its airline and scheduled origin/destination
   airports. That's genuine flight detail shown right here, no API key needed for it.
   Scheduled/estimated/actual times and delay status are a separate, second lookup against
   AeroDataBox (via RapidAPI) — unlike route lookups, no free *keyless* source for live flight
   status exists (OpenSky only gives raw ADS-B position, not gate/delay data, and even that blocks
   browser-origin requests; airplanes.live now requires an emailed approval). AeroDataBox needs an
   API key, which — per an explicit choice made when adding this — is embedded directly below
   rather than hidden behind a serverless proxy: this is a static personal trip site with no
   backend, the free tier is 600 lookups/month, and the realistic risk of a scraper finding and
   draining an obscure personal GitHub Pages site's key is low enough to accept for the convenience.
   Get a free key at https://rapidapi.com/aedbx-aedbx/api/aerodatabox (subscribe to the free/Basic
   plan) and paste it below — until then this constant stays empty and the feature just skips
   straight to "fetchStatus()'s block never runs", leaving the free adsbdb route lookup working on
   its own with no error shown. */
const FLIGHT_STATUS_KEY = "f6556755cbmsh3e6d873fad16b74p1415fcjsne7b4a4291003";
(function(){
  const form = document.getElementById('flightTrackForm');
  if(!form) return;
  const input = document.getElementById('flightTrackInput');
  const dateInput = document.getElementById('flightTrackDate');
  const resultEl = document.getElementById('flightTrackResult');
  try{ const last = localStorage.getItem('ctgr_last_flight'); if(last) input.value = last; }catch(e){}
  if(dateInput && !dateInput.value) dateInput.value = new Date().toISOString().slice(0, 10);

  function renderFlightState(kind, html){
    resultEl.hidden = false;
    resultEl.className = 'flight-track-result ft-' + kind;
    resultEl.innerHTML = html;
  }

  function formatMovementTime(mv){
    // Parsed straight out of the string, not via `new Date(...).toLocaleTimeString()` — AeroDataBox's
    // `.local` field is already the correct wall-clock time AT THAT AIRPORT (with its own UTC offset
    // baked in, e.g. "23:25+03:00"), and running it through Date/toLocaleTimeString would silently
    // convert it to whichever timezone the *viewer's device* happens to be in instead, which is wrong
    // for a departure/arrival time that's supposed to mean "what the airport clock will say".
    if(!mv || !mv.local) return null;
    const m = mv.local.match(/(\d{2}):(\d{2})/);
    if(!m) return null;
    let h = parseInt(m[1], 10);
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12; if(h === 0) h = 12;
    return h + ':' + m[2] + ' ' + ampm;
  }

  function delayMinutes(mv){
    // Computed ourselves from the timestamps rather than trusting a single API-provided field —
    // AeroDataBox's `status` is a flight PHASE (Expected/EnRoute/Arrived/Canceled/…), not a
    // delayed/on-time flag, so "is it delayed" has to come from comparing scheduledTime against
    // whichever of runwayTime (actual)/revisedTime/predictedTime (estimate) is the best information
    // available right now — same priority order already used for the "Estimated"/"Actual" rows.
    if(!mv || !mv.scheduledTime || !mv.scheduledTime.utc) return null;
    const best = mv.runwayTime || mv.revisedTime || mv.predictedTime;
    if(!best || !best.utc) return null;
    const schedMs = Date.parse(mv.scheduledTime.utc.replace(' ', 'T'));
    const bestMs = Date.parse(best.utc.replace(' ', 'T'));
    if(isNaN(schedMs) || isNaN(bestMs)) return null;
    return Math.round((bestMs - schedMs) / 60000);
  }

  function delayPillHtml(mv){
    const d = delayMinutes(mv);
    if(d === null) return '';
    if(d <= 10) return `<span class="price-pill">${escHtml(tr('flightTrackOnTime'))}</span>`;
    return `<span class="weak-pill">+${d} ${escHtml(tr('flightTrackMinLate'))}</span>`;
  }

  function legHtml(label, mv){
    if(!mv) return '';
    // "Estimated" can come back as either field depending on how close to departure the lookup
    // happens — confirmed against live responses: a flight still days out only carries
    // `predictedTime` (a modelled best-guess), while one on the day itself gets `revisedTime` (the
    // airline's own updated schedule) instead. Preferring revisedTime when both are present since
    // it's the more authoritative of the two.
    const rows = [
      [tr('flightTrackScheduled'), formatMovementTime(mv.scheduledTime)],
      [tr('flightTrackEstimated'), formatMovementTime(mv.revisedTime || mv.predictedTime)],
      [tr('flightTrackActual'), formatMovementTime(mv.runwayTime)],
    ].filter(([,t])=>t).map(([l,t])=>`<div class="ft-time-row"><span>${escHtml(l)}</span><b>${escHtml(t)}</b></div>`).join('');
    if(!rows) return '';
    const metaParts = [];
    if(mv.terminal) metaParts.push(tr('flightTrackTerminal') + ' ' + mv.terminal);
    if(mv.gate) metaParts.push(tr('flightTrackGate') + ' ' + mv.gate);
    if(mv.baggageBelt) metaParts.push(tr('flightTrackBaggage') + ' ' + mv.baggageBelt);
    const meta = metaParts.length ? `<div class="ft-leg-meta">${escHtml(metaParts.join(' · '))}</div>` : '';
    return `<div><div class="ft-leg-label">${escHtml(label)} ${delayPillHtml(mv)}</div>${rows}${meta}</div>`;
  }

  async function appendLiveStatus(flightNumber, dateStr){
    if(!FLIGHT_STATUS_KEY) return;
    try{
      const res = await fetch('https://aerodatabox.p.rapidapi.com/flights/number/' + encodeURIComponent(flightNumber) + '/' + encodeURIComponent(dateStr) + '?withAircraftImage=true', {
        headers:{ 'X-RapidAPI-Key': FLIGHT_STATUS_KEY, 'X-RapidAPI-Host':'aerodatabox.p.rapidapi.com' }
      });
      const list = res.ok ? await res.json() : null;
      const flight = Array.isArray(list) ? list[0] : null;
      const depHtml = flight ? legHtml(tr('flightTrackDeparture'), flight.departure) : '';
      const arrHtml = flight ? legHtml(tr('flightTrackArrival'), flight.arrival) : '';
      if(depHtml || arrHtml){
        // Status PHASE badge colour: red for the two genuinely bad outcomes (cancelled/diverted —
        // the ones worth catching at a glance), neutral for every normal phase in between
        // (Expected/EnRoute/Boarding/Arrived/…) since those aren't bad news on their own — lateness
        // is already called out separately by the per-leg delay pill above.
        const statusText = flight.status || '';
        const isBad = /cancel|divert/i.test(statusText);
        const badge = statusText ? `<span class="ft-status-badge${isBad ? ' bad' : ''}">${escHtml(statusText)}</span>` : '';
        const ac = flight.aircraft;
        const acBits = [];
        if(ac && ac.model) acBits.push(ac.model);
        if(ac && ac.reg) acBits.push(ac.reg);
        const acLine = acBits.length ? `<div class="ft-aircraft">${ac && ac.image && ac.image.url ? `<img src="${escHtml(ac.image.url)}" alt="" loading="lazy">` : ''}<span>${escHtml(acBits.join(' · '))}</span></div>` : '';
        resultEl.insertAdjacentHTML('beforeend', `<div class="ft-status-row">${badge}</div><div class="ft-legs">${depHtml}${arrHtml}</div>${acLine}`);
      }else{
        resultEl.insertAdjacentHTML('beforeend', `<p class="ft-msg" style="margin-top:12px;">${escHtml(tr('flightTrackStatusUnavailable'))}</p>`);
      }
    }catch(err){
      // A configured key that can't be reached right now (network hiccup, quota, bad key) stays
      // silent rather than erroring — the free route lookup above already succeeded on its own,
      // which is the part that matters most if this optional enhancement has a bad moment.
    }
  }

  form.addEventListener('submit', async (e)=>{
    e.preventDefault();
    const raw = input.value.trim().toUpperCase().replace(/\s+/g, '');
    if(!raw){ toast(tr('flightTrackNeedNumber')); input.focus(); return; }
    try{ localStorage.setItem('ctgr_last_flight', raw); }catch(e){}
    renderFlightState('loading', `<p class="ft-msg">⏳ ${escHtml(tr('flightTrackLoading'))}</p>`);
    let data;
    try{
      const res = await fetch('https://api.adsbdb.com/v0/callsign/' + encodeURIComponent(raw));
      if(!res.ok){ renderFlightState('empty', `<p class="ft-msg">${escHtml(tr('flightTrackNotFound'))}</p>`); return; }
      data = await res.json();
    }catch(err){
      renderFlightState('empty', `<p class="ft-msg">${escHtml(tr('flightTrackError'))}</p>`);
      return;
    }
    const route = data && data.response && data.response.flightroute;
    if(!route){ renderFlightState('empty', `<p class="ft-msg">${escHtml(tr('flightTrackNotFound'))}</p>`); return; }
    const airline = route.airline;
    const org = route.origin, dst = route.destination;
    const airportLine = (ap)=> ap ? `<b>${escHtml(ap.iata_code || ap.icao_code || '')}</b> ${escHtml(ap.name || '')}<span>${escHtml(ap.municipality || '')}${ap.municipality && ap.country_name ? ', ' : ''}${escHtml(ap.country_name || '')}</span>` : '';
    const liveCallsign = route.callsign_icao || route.callsign || raw;
    renderFlightState('ok', `
      <div class="ft-airline">${airline ? escHtml(airline.name) + (airline.iata ? ' (' + escHtml(airline.iata) + ')' : '') : escHtml(tr('flightTrackAirline'))}</div>
      <div class="ft-route">
        <div class="ft-airport">${airportLine(org)}</div>
        <div class="ft-arrow">→</div>
        <div class="ft-airport">${airportLine(dst)}</div>
      </div>
      <a class="mini-link" href="https://www.flightradar24.com/data/flights/${encodeURIComponent(liveCallsign.toLowerCase())}" target="_blank">🛰️ ${escHtml(tr('flightTrackLiveLink'))}</a>
    `);
    appendLiveStatus(raw, dateInput && dateInput.value ? dateInput.value : new Date().toISOString().slice(0, 10));
  });
})();
