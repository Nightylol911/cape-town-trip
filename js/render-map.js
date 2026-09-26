function jitter(lat,lng,i){ const dx=((i*37)%9-4)*0.0022, dy=((i*53)%9-4)*0.0022; return [lat+dx,lng+dy]; }
const byArea = {};
PLACES.forEach((p)=>{ if(!byArea[p.a]) byArea[p.a]=[]; byArea[p.a].push(p); });

function tr(key){ return UI[LANG][key]; }
function areaLabel(k){ return AREAS_META[k][LANG]; }

function setLang(lang){
  LANG = lang;
  try{ localStorage.setItem('ctgr_lang', lang); }catch(e){}
  document.getElementById('htmlRoot').setAttribute('lang', lang);
  document.getElementById('htmlRoot').setAttribute('dir', lang==='ar'?'rtl':'ltr');
  document.getElementById('bodyRoot').classList.toggle('ar', lang==='ar');
  document.getElementById('btnEn').classList.toggle('active', lang==='en');
  document.getElementById('btnAr').classList.toggle('active', lang==='ar');
  document.querySelectorAll('[data-t]').forEach(el=>{
    const k = el.dataset.t;
    if(k==='statAreas') el.textContent = UI[lang].statAreasL;
    else if(k==='statBooking') el.textContent = UI[lang].statBookingL;
    else el.textContent = UI[lang][k] || '';
  });
  document.querySelectorAll('[data-html]').forEach(el=>{ el.innerHTML = UI[lang][el.dataset.html] || ''; });
  document.querySelectorAll('[data-t-aria]').forEach(el=>{ const v = UI[lang][el.dataset.tAria] || ''; el.setAttribute('aria-label', v); el.title = v; });
  updateHeroTitle();
  renderPackList();
  const searchEl = document.getElementById('searchInput');
  if(searchEl) searchEl.placeholder = UI[lang].searchPlaceholder;
  renderFilters(); renderLegend(); renderAreas(); updateSelCount(); renderDrawer(); renderItinerary(); renderGardenRoute(); renderSafari(); renderGRItinerary(); renderTransport(); renderPlanItinerary(); updateBudget(); renderWeather(); renderApps(); renderTravelChecklist();
  updateCountdown();
  updateDateDisplays();
  fxWidgetRefresh();
  loadPlanRainBadges();
  window.dispatchEvent(new Event('ctgr-lang-changed'));
}
function planHeroTitle(){
  // No day/night count here any more — a visitor's own trip length can differ wildly from
  // yours, and this title used to hardcode "Your 14-Day, 13-Night" regardless of who's looking.
  // Kept in the same "<verb> your <em>South Africa</em> ..." tone as the other 3 tabs' titles.
  return LANG === 'ar' ? 'خططا لرحلتكما إلى<br><em>جنوب أفريقيا</em>' : 'Plan your<br><em>South Africa</em> trip';
}
function updateHeroTitle(){
  const el = document.querySelector('[data-html="heroTitle"]');
  if(!el) return;
  el.innerHTML = activeTab === 'plan' ? planHeroTitle() : ((UI[LANG].heroTitles && UI[LANG].heroTitles[activeTab]) || UI[LANG].heroTitle);
}

function renderFilters(){
  const filtersEl = document.getElementById('filters');
  let fHtml = `<button class="chip ${activeFilter==='all'?'active':''}" data-f="all">${tr('allChip')}</button>`;
  Object.entries(CATS[LANG]).forEach(([k,v])=>{ fHtml += `<button class="chip ${activeFilter===k?'active':''}" data-f="${k}"><span class="dot" style="background:${v.color}"></span>${v.label}</button>`; });
  filtersEl.innerHTML = fHtml;
  filtersEl.querySelectorAll('.chip').forEach(btn=>{
    btn.addEventListener('click', ()=>{ activeFilter = btn.dataset.f; renderFilters(); renderAreas(); renderMarkers(); });
  });
}
function renderLegend(){
  document.getElementById('legend').innerHTML = Object.entries(AREAS_META).map(([k,v])=>`<span><i style="background:${v.color}"></i>${v[LANG]}</span>`).join('');
}

document.getElementById('statTotal').textContent = PLACES.length;
document.getElementById('statAreas').textContent = Object.keys(byArea).length;
document.getElementById('statBooking').textContent = PLACES.filter(p=>p.book).length;
document.getElementById('mapCount').textContent = PLACES.length;

const map = L.map('map',{scrollWheelZoom:false}).setView([-33.98,18.47],10.5);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{attribution:'&copy; OpenStreetMap contributors', maxZoom:18}).addTo(map);
let markers = [];
function renderMarkers(){
  markers.forEach(m=>map.removeLayer(m)); markers=[];
  PLACES.forEach((p,i)=>{
    if(activeFilter!=='all' && p.c!==activeFilter) return;
    const areaColor = AREAS_META[p.a].color;
    const [lat,lng] = (p.lat && p.lng) ? [p.lat,p.lng] : jitter(AREAS_META[p.a].lat, AREAS_META[p.a].lng, i);
    const marker = L.circleMarker([lat,lng],{radius:6, color:'#fff', weight:1.5, fillColor:areaColor, fillOpacity:.95}).addTo(map);
    const nm = LANG==='ar' ? p.n_ar : p.n;
    marker.bindPopup(`<b>${nm}</b><br><span style="color:#8a7f70;font-size:12px">${areaLabel(p.a)}</span><br><a href="${p.g}" target="_blank" style="color:#e2622e;font-weight:600;font-size:12.5px;">${LANG==='ar'?'فتح في خرائط جوجل ←':'Open in Google Maps →'}</a>`);
    markers.push(marker);
  });
}
renderMarkers();

function placeByName(name){
  return PLACES.find(p=>p.n===name);
}
function itinChip(name){
  const p = placeByName(name);
  if(!p) return '';
  const cat = CATS[LANG][p.c];
  const label = LANG==='ar' ? p.n_ar : p.n;
  const star = p.rating ? `<span class="ic-star">★${p.rating.toFixed(1)}</span>` : '';
  const bookFlag = p.book ? `<span class="ic-book">●</span>` : '';
  return `<a class="itin-chip" href="${p.g}" target="_blank"><span class="ic-dot" style="background:${cat.color}"></span>${label}${star}${bookFlag}</a>`;
}
