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

const TAB_IDS = ['plan','capetown','gardenroute','safari'];
const tabFromHash = ()=>{ const m = location.hash.match(/^#\/?([a-z]+)$/); return (m && TAB_IDS.includes(m[1])) ? m[1] : null; };
function activateTab(tab, opts){
  if(!TAB_IDS.includes(tab)) tab = 'plan';
  document.querySelectorAll('.maintab').forEach(b=>b.classList.toggle('active', b.dataset.tab === tab));
  document.querySelectorAll('.tabpanel').forEach(p=>p.classList.toggle('active', p.id === 'tab-' + tab));
  activeTab = tab;
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
activateTab(tabFromHash() || 'plan', {noHash:true});
loadPhotos();
loadWeather();
renderGardenRoute();
renderSafari();
fxLoad();
loadNotes().then(()=>{ renderAreas(); renderGardenRoute(); });
initAddPlace();
initItinPicker();
initFxWidget();
initOnboarding();
initInstallPrompt();
loadCustomPlaces();
setInterval(updateCountdown, 60 * 60 * 1000);
document.addEventListener('visibilitychange', ()=>{ if(!document.hidden && notesDirty.size) scheduleNotesSync(300); });
window.addEventListener('online', ()=>{ if(notesDirty.size) scheduleNotesSync(300); });

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
