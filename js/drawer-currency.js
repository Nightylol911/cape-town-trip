const drawer = document.getElementById('drawer');
const backdrop = document.getElementById('backdrop');
document.getElementById('openDrawer').addEventListener('click', ()=>{drawer.classList.add('open');backdrop.classList.add('open');});
document.getElementById('closeDrawer').addEventListener('click', closeDrawer);
backdrop.addEventListener('click', closeDrawer);
function closeDrawer(){drawer.classList.remove('open');backdrop.classList.remove('open');}
function updateSelCount(){ document.getElementById('openDrawer').innerHTML = `♥ ${picked.size} — <span>${tr('viewItinerary')}</span>`; }
function renderDrawer(){
  const body = document.getElementById('drawerBody');
  const clearBtn = document.getElementById('clearPicksBtn');
  if(clearBtn) clearBtn.disabled = (picked.size===0 && grPicked.size===0);
  let html='';
  if(picked.size===0 && grPicked.size===0){
    html += `<div class="drawer-empty">${tr('nothingPicked')}</div>`;
  }else{
    let total = 0;
    if(picked.size>0){
      const byAreaPicked = {};
      [...picked].forEach(idx=>{ const p = PLACES[idx]; if(!byAreaPicked[p.a]) byAreaPicked[p.a]=[]; byAreaPicked[p.a].push(p); });
      Object.entries(byAreaPicked).forEach(([akey,items])=>{
        html += `<div class="d-area-label">${areaLabel(akey)}</div>`;
        items.forEach(p=>{
          const idx = PLACES.indexOf(p); const name = LANG==='ar'?p.n_ar:p.n;
          total += (p.price||0);
          html += `<div class="d-item"><span>${name} <i class="d-price">${p.price?('· '+money(p.price)):''}</i></span><button class="rm" data-rm="${idx}">${tr('remove')}</button></div>`;
        });
      });
    }
    if(grPicked.size>0){
      const grFlat = GARDEN_ROUTE.flatMap(t=>t.items.map(item=>({...item, _town:LANG==='ar'?t.town_ar:t.town})));
      const byTown = {};
      [...grPicked].forEach(idx=>{ const item = grFlat[idx]; if(!item) return; if(!byTown[item._town]) byTown[item._town]=[]; byTown[item._town].push({item, idx}); });
      Object.entries(byTown).forEach(([town, items])=>{
        html += `<div class="d-area-label">${town} (${LANG==='ar'?'طريق الحدائق':'Garden Route'})</div>`;
        items.forEach(({item, idx})=>{
          const name = LANG==='ar'?item.n_ar:item.n;
          total += (item.price||0);
          html += `<div class="d-item"><span>${name} <i class="d-price">${item.price?('· '+money(item.price)):''}</i></span><button class="rm" data-grrm="${idx}">${tr('remove')}</button></div>`;
        });
      });
    }
    html += `<div class="d-total">${tr('budgetTotal')} <b>≈ ${budgetDisplay(total)}</b></div>`;
  }
  html += renderExpenseSection();
  body.innerHTML = html;
  body.querySelectorAll('[data-rm]').forEach(btn=>{ btn.addEventListener('click', ()=>{ picked.delete(+btn.dataset.rm); renderAreas(); updateSelCount(); renderDrawer(); updateBudget(); }); });
  body.querySelectorAll('[data-grrm]').forEach(btn=>{ btn.addEventListener('click', ()=>{ grPicked.delete(+btn.dataset.grrm); renderGardenRoute(); renderDrawer(); updateBudget(); }); });
  wireExpenseSection();
}

/* ---------- ACTUAL SPENDING (per device — a real running log, separate from the estimated
   budget above which is only ever a guess built from shortlisted places' listed prices) ---------- */
let EXPENSES = [];
try{ EXPENSES = JSON.parse(localStorage.getItem('ctgr_expenses') || '[]') || []; }catch(e){}
const saveExpenses = ()=>{ try{ localStorage.setItem('ctgr_expenses', JSON.stringify(EXPENSES)); }catch(e){} };
const toSar = (val, cur)=> (val / fxRate(cur)) * FX_AUTHOR_RATE;
function expenseTotalSar(){ return EXPENSES.reduce((s,e)=>s+e.sar, 0); }
function addExpense(desc, amount, cur){
  if(!desc || !amount || amount<=0) return;
  EXPENSES.push({id: Date.now().toString(36)+Math.random().toString(36).slice(2,6), desc, sar: toSar(amount, cur), amount, cur});
  saveExpenses();
  renderDrawer();
}
function removeExpense(id){
  EXPENSES = EXPENSES.filter(e=>e.id!==id);
  saveExpenses();
  renderDrawer();
}
function renderExpenseSection(){
  const rows = [...EXPENSES].reverse().map(e=>
    `<div class="d-item"><span>${escHtml(e.desc)} <i class="d-price">· ${money(e.sar)}</i></span><button class="rm" data-exprm="${e.id}">${tr('remove')}</button></div>`
  ).join('');
  return `<div class="expense-card">
    <div class="d-area-label">${tr('expenseTitle')}</div>
    ${rows || `<p class="expense-empty">${tr('expenseEmpty')}</p>`}
    <form class="expense-form" id="expenseForm">
      <input type="text" id="expDesc" placeholder="${tr('expenseDescPh')}" autocomplete="off">
      <input type="number" id="expAmount" min="0" step="any" inputmode="decimal" placeholder="${tr('expenseAmountPh')}">
      <select id="expCur">${['SAR','ZAR','USD'].map(c=>`<option value="${c}" ${c===CURRENCY?'selected':''}>${c}</option>`).join('')}</select>
      <button type="submit">${tr('expenseAddBtn')}</button>
    </form>
    <div class="d-total">${tr('expenseTotal')} <b>≈ ${money(expenseTotalSar())}</b></div>
  </div>`;
}
function wireExpenseSection(){
  const form = document.getElementById('expenseForm');
  if(!form) return;
  form.addEventListener('submit', e=>{
    e.preventDefault();
    const desc = document.getElementById('expDesc').value.trim();
    const amount = parseFloat(document.getElementById('expAmount').value);
    const cur = document.getElementById('expCur').value;
    if(!desc || !amount || amount<=0) return;
    addExpense(desc, amount, cur);
  });
  document.querySelectorAll('[data-exprm]').forEach(btn=>{
    btn.addEventListener('click', ()=> removeExpense(btn.dataset.exprm));
  });
}
/* ---------- CURRENCY ---------- */
// Every price in this page's data is already stored as a SAR number (fixed-rate converted at
// authoring time — see the travel-notice caption: 1 ZAR ~= 0.21 SAR, and SAR is itself pegged
// at exactly 3.75 to the US dollar). To offer a *live* conversion without rewriting every price
// in the dataset back to ZAR, we recover each stored SAR figure's implied ZAR amount using that
// same fixed authoring rate, then apply today's live rate on top of that recovered ZAR amount.
const FX_AUTHOR_RATE = 0.21;   // ZAR -> SAR, as used when the prices in this page were written
const FX_SAR_PER_USD = 3.75;   // real, fixed peg — not an estimate
let FX_LIVE = null;            // {SAR, USD} = how many of each 1 ZAR buys, once fetched
let CURRENCY = 'SAR', TRAVELERS = 2, SPLIT_PER_PERSON = false;
try{ CURRENCY = localStorage.getItem('ctgr_currency') || 'SAR'; }catch(e){}
try{ TRAVELERS = Math.max(1, Math.min(12, parseInt(localStorage.getItem('ctgr_travelers'), 10) || 2)); }catch(e){}
try{ SPLIT_PER_PERSON = localStorage.getItem('ctgr_split') === '1'; }catch(e){}
function fxRate(cur){
  if(cur === 'ZAR') return 1;
  if(cur === 'SAR') return (FX_LIVE && FX_LIVE.SAR) || FX_AUTHOR_RATE;
  return (FX_LIVE && FX_LIVE.USD) || (FX_AUTHOR_RATE / FX_SAR_PER_USD);   // USD
}
function money(sar){
  if(sar == null) return '';
  const zar = sar / FX_AUTHOR_RATE;
  const val = Math.round(zar * fxRate(CURRENCY));
  const locale = LANG === 'ar' ? 'ar' : 'en-US';
  const n = val.toLocaleString(locale);
  return CURRENCY === 'USD' ? '$' + n : (CURRENCY === 'ZAR' ? 'R ' + n : 'SAR ' + n);
}
async function fxLoad(){
  try{
    FX_LIVE = await wxCached('fx|zar', 6 * 3600e3, async()=>{
      const r = await fetch('https://open.er-api.com/v6/latest/ZAR');
      if(!r.ok) throw new Error('fx http ' + r.status);
      const d = await r.json();
      if(d.result !== 'success' || !d.rates || !d.rates.SAR) throw new Error('fx bad payload');
      return {SAR: d.rates.SAR, USD: d.rates.USD};
    });
  }catch(e){ /* keep the fixed fallback rate — same one the prices were authored at */ }
  updateBudget(); renderDrawer(); renderAreas(); renderGardenRoute(); renderPlanItinerary();
  fxWidgetRefresh();
}

/* ---------- CURRENCY CONVERTER WIDGET (Plan tab) ----------
   A free-standing, bidirectional converter — type an amount in any of the three currencies and
   the other two recompute live — separate from the CURRENCY setting above (which controls what
   currency every price *on the site* is displayed in). Reuses the exact same fxRate()/FX_LIVE
   data, so it's never a second, inconsistent source of truth for the rate. */
const FX_WIDGET_CURS = ['ZAR','SAR','USD'];
function fxWidgetInputs(){
  return Object.fromEntries(FX_WIDGET_CURS.map(c=>[c, document.getElementById('fx'+c)]));
}
function fxWidgetRecalc(sourceCur){
  const inputs = fxWidgetInputs();
  if(!inputs.ZAR) return;
  const amount = parseFloat(inputs[sourceCur].value);
  if(!isFinite(amount)){
    FX_WIDGET_CURS.forEach(c=>{ if(c !== sourceCur) inputs[c].value = ''; });
    return;
  }
  const zar = sourceCur === 'ZAR' ? amount : amount / fxRate(sourceCur);
  FX_WIDGET_CURS.forEach(c=>{
    if(c === sourceCur) return;
    inputs[c].value = (zar * fxRate(c)).toFixed(2);
  });
}
function fxWidgetRefresh(){
  const inputs = fxWidgetInputs();
  if(!inputs.ZAR) return;
  const tag = document.getElementById('fxUpdated'), note = document.getElementById('fxNote');
  if(tag) tag.textContent = FX_LIVE ? tr('fxLive') : tr('fxApprox');
  if(note) note.textContent = FX_LIVE ? '' : tr('fxFallback');
  // recompute from whichever field currently has focus, else from ZAR
  const active = document.activeElement && FX_WIDGET_CURS.includes(document.activeElement.id.replace('fx',''))
    ? document.activeElement.id.replace('fx','') : 'ZAR';
  fxWidgetRecalc(active);
}
function initFxWidget(){
  const inputs = fxWidgetInputs();
  if(!inputs.ZAR) return;
  FX_WIDGET_CURS.forEach(c=> inputs[c].addEventListener('input', ()=> fxWidgetRecalc(c)));
  inputs.ZAR.value = '1000';
  fxWidgetRefresh();
}
function setCurrency(cur){
  CURRENCY = cur;
  try{ localStorage.setItem('ctgr_currency', cur); }catch(e){}
  updateBudget(); renderDrawer(); renderAreas(); renderGardenRoute(); renderPlanItinerary();
}
function setTravelers(n){
  TRAVELERS = Math.max(1, Math.min(12, n));
  try{ localStorage.setItem('ctgr_travelers', String(TRAVELERS)); }catch(e){}
  updateBudget(); renderDrawer();
}
function setSplitPerPerson(on){
  SPLIT_PER_PERSON = on;
  try{ localStorage.setItem('ctgr_split', on ? '1' : '0'); }catch(e){}
  updateBudget(); renderDrawer();
}
function budgetDisplay(total){
  const t = SPLIT_PER_PERSON ? total / TRAVELERS : total;
  const suffix = SPLIT_PER_PERSON ? (LANG === 'ar' ? ' / للشخص' : ' / person') : '';
  return money(t) + suffix;
}
(function initBudgetSettings(){
  const sel = document.getElementById('currencySel'), split = document.getElementById('splitToggle'),
    travWrap = document.getElementById('dsTravelers'), travCount = document.getElementById('travelersCount'),
    minus = document.getElementById('travelersMinus'), plus = document.getElementById('travelersPlus');
  if(!sel) return;
  sel.value = CURRENCY;
  split.checked = SPLIT_PER_PERSON;
  travWrap.hidden = !SPLIT_PER_PERSON;
  travCount.textContent = TRAVELERS;
  sel.addEventListener('change', ()=> setCurrency(sel.value));
  split.addEventListener('change', ()=>{ setSplitPerPerson(split.checked); travWrap.hidden = !split.checked; });
  minus.addEventListener('click', ()=>{ setTravelers(TRAVELERS - 1); travCount.textContent = TRAVELERS; });
  plus.addEventListener('click', ()=>{ setTravelers(TRAVELERS + 1); travCount.textContent = TRAVELERS; });
})();

function computeBudget(){
  let total=0, count=0;
  picked.forEach(idx=>{ const p=PLACES[idx]; if(p){ total+=(p.price||0); count++; } });
  const grFlat = GARDEN_ROUTE.flatMap(t=>t.items);
  grPicked.forEach(idx=>{ const item=grFlat[idx]; if(item){ total+=(item.price||0); count++; } });
  return {total, count};
}
function updateBudget(){
  try{ localStorage.setItem('ctgr_picks', JSON.stringify({p:[...picked], g:[...grPicked]})); }catch(e){}
  const bar = document.getElementById('budgetBar');
  if(!bar) return;
  const {total, count} = computeBudget();
  if(count===0){ bar.style.display='none'; return; }
  bar.style.display='flex';
  bar.innerHTML = `<span>♥ ${count} ${LANG==='ar'?'مختارة':'selected'}</span><span class="budget-total">≈ ${budgetDisplay(total)}</span><span class="budget-note">${tr('budgetApprox')}</span>`;
  bar.onclick = ()=>{ document.getElementById('drawer').classList.add('open'); document.getElementById('backdrop').classList.add('open'); };
}
document.getElementById('btnEn').addEventListener('click', ()=>setLang('en'));
document.getElementById('btnAr').addEventListener('click', ()=>setLang('ar'));

