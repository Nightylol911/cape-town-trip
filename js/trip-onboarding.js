/* ================= WEATHER (Open-Meteo, free, no key) =================
   - Live: current conditions + next 24 hours + next 16 days (refreshes every ~25 min).
   - Tabs: your trip dates, the next 16 days, or any date you pick (a week at a time).
   - Dates beyond the 16-day forecast show typical weather (average of the same dates over the last 5 years).
   - Past dates show recorded weather. Falls back to the last saved data when offline. */
const WX_LOC = {ct:{lat:-33.9249, lon:18.4241}, gr:{lat:-34.0361, lon:23.0487}};   // Cape Town, Knysna (Garden Route)
/* REAL_TRIP_START/TRIP_DAYS are the owner's actual booked trip (the ITINERARY14 array below).
   Everyone else who isn't GitHub-connected (see isOwner()) either skips onboarding — and gets
   that same real 14-day plan, just so they can see what it looks like — or builds their own
   trip (own arrival/departure, own cities and day-counts, own hotels) in the onboarding modal,
   which generates a day-by-day skeleton into CUSTOM_ITIN for them to fill in with the same
   "+ Add" picker the real plan uses. currentItinerary()/effectiveTripStart()/effectiveTripDays()
   are what the rest of the page should always read instead of the fixed constants directly. */
const REAL_TRIP_START = '2026-10-28', TRIP_DAYS = 14;
const REAL_ARRIVAL_TIME = '10:30am', REAL_DEPART_TIME = '12:35pm';   // Qatar Airways, see Day 1/14 tips
let VISITOR_START = null, CUSTOM_ITIN = null, VISITOR_ARRIVAL_TIME = '', VISITOR_DEPART_TIME = '';
try{ VISITOR_START = localStorage.getItem('ctgr_visitor_start'); }catch(e){}
try{
  const saved = JSON.parse(localStorage.getItem('ctgr_custom_itin') || 'null');
  if(Array.isArray(saved) && saved.length) CUSTOM_ITIN = saved;
}catch(e){}
try{
  const t = JSON.parse(localStorage.getItem('ctgr_visitor_times') || 'null');
  if(t){ VISITOR_ARRIVAL_TIME = t.arrival || ''; VISITOR_DEPART_TIME = t.depart || ''; }
}catch(e){}
function isOwner(){ return !!ghConfig(); }
function effectiveTripStart(){ return isOwner() ? REAL_TRIP_START : (VISITOR_START || REAL_TRIP_START); }
function currentItinerary(){ return (!isOwner() && CUSTOM_ITIN) ? CUSTOM_ITIN : ITINERARY14; }
function effectiveTripDays(){ return (!isOwner() && CUSTOM_ITIN) ? CUSTOM_ITIN.length : TRIP_DAYS; }
// A non-owner who hasn't saved their own dates yet (or skipped) has no VISITOR_START — the
// functions above quietly fall back to the REAL trip's dates/length in that case, which is fine
// for calculations but means text built from them would show Yazeed's actual Oct 28–Nov 10 dates
// to a total stranger who hasn't asked for them yet. Anything user-facing that names real dates
// or day/night counts should check this first and show something generic instead while pending.
function visitorPending(){ return !isOwner() && !VISITOR_START; }
// True for the owner, and for a visitor who explicitly clicked "skip" (same real trip, on purpose)
// — the only two cases where showing the real couple's-trip framing ("Just the two of you") is
// accurate. A visitor with their own custom itinerary gets neutral wording instead.
function usingRealTrip(){ return isOwner() || (!!VISITOR_START && !CUSTOM_ITIN); }
function tripArrivalTime(){ return usingRealTrip() ? REAL_ARRIVAL_TIME : VISITOR_ARRIVAL_TIME; }
function tripDepartTime(){ return usingRealTrip() ? REAL_DEPART_TIME : VISITOR_DEPART_TIME; }
const WX_HIST_YEARS = 5, WX_LS = 'ctgr_wxc_v2';
let wxTab = 'trip', wxLoc = 'ct', wxPick = '', wxSeq = 0, wxStale = false, wxBusy = false, wxLastFetch = 0;
const WX = {now:null, hourly:[], today:'', updated:0, status:'loading'};

/* ---------- COUNTDOWN ---------- */
function isoPlusDays(iso, n){
  // UTC throughout, deliberately — mixing a local-time parse with toISOString's UTC output
  // shifts the date by a day on any machine/browser set to a positive UTC offset (which, for
  // what it's worth, includes Riyadh, Doha and Cape Town themselves).
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + n);
  return dt.toISOString().slice(0, 10);
}
function isoToday(){   // the viewer's own local calendar date — not UTC's, which can be a day off
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
const WEEKDAYS_EN = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'], MONTHS_EN = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const WEEKDAYS_AR = ['الأحد','الاثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'];
const MONTHS_AR = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
function dayDateLabel(iso){   // "Wed 28 Oct" / "الأربعاء ٢٨ أكتوبر"
  const d = new Date(iso + 'T00:00:00');
  return LANG === 'ar'
    ? `${WEEKDAYS_AR[d.getDay()]} ${d.getDate()} ${MONTHS_AR[d.getMonth()]}`
    : `${WEEKDAYS_EN[d.getDay()]} ${d.getDate()} ${MONTHS_EN[d.getMonth()]}`;
}
function shortDateLabel(iso){   // "28 Oct" / "٢٨ أكتوبر" — no weekday, no year
  const d = new Date(iso + 'T00:00:00');
  return LANG === 'ar' ? `${d.getDate()} ${MONTHS_AR[d.getMonth()]}` : `${d.getDate()} ${MONTHS_EN[d.getMonth()]}`;
}
const arDigits = n => String(n).replace(/[0-9]/g, d => '٠١٢٣٤٥٦٧٨٩'[d]);
function dateRangeLabel(startIso, days){   // "28 Oct – 10 Nov 2026" / "٢٨ أكتوبر – ١٠ نوفمبر ٢٠٢٦"
  const endIso = isoPlusDays(startIso, days - 1), e = new Date(endIso + 'T00:00:00');
  const endYear = LANG === 'ar' ? arDigits(e.getFullYear()) : e.getFullYear();
  return `${shortDateLabel(startIso)} – ${shortDateLabel(endIso)} ${endYear}`;
}
/* Re-derives every on-screen date-range string from effectiveTripStart() — called after
   language changes and whenever a visitor picks (or the owner's identity determines) the
   trip's dates. Kept as one function so nothing here can drift out of sync with the others. */
function updateDateDisplays(){
  const pending = visitorPending(), usingReal = usingRealTrip();
  const start = effectiveTripStart(), days = effectiveTripDays();
  const range = dateRangeLabel(start, days);
  const startShort = shortDateLabel(start), endShort = shortDateLabel(isoPlusDays(start, days - 1));
  const ar = LANG === 'ar';

  const nDays = ar ? arDigits(days) : days, nNights = ar ? arDigits(days - 1) : (days - 1);

  const eyebrowEl = document.querySelector('.eyebrow');
  if(eyebrowEl){
    eyebrowEl.textContent = pending
      ? (ar ? 'أدخلا تواريخ رحلتكما لرؤية خطة مخصصة لكما' : 'Enter your travel dates to get a trip built around you')
      : usingReal
        ? `${range} · ${ar ? `${nDays} يومًا / ${nNights} ليلة · لكما فقط` : `${nDays} Days / ${nNights} Nights · Just the two of you`}`
        : `${range} · ${ar ? `${nDays} يومًا / ${nNights} ليلة` : `${nDays} Days / ${nNights} Nights`}`;
  }

  const wxTag = document.querySelector('.weather-tag');
  if(wxTag) wxTag.textContent = pending ? (ar ? 'أدخلا تواريخكما' : 'Enter your dates') : range;

  const planTitleEl = document.querySelector('[data-t="planTitle"]');
  if(planTitleEl){
    planTitleEl.textContent = pending
      ? (ar ? 'رحلتكما، يومًا بيوم' : 'Your trip, day by day')
      : (ar ? `رحلتكما لـ${nDays} يومًا و${nNights} ليلة، يومًا بيوم` : `Your ${nDays}-day, ${nNights}-night trip, day by day`);
  }

  const planTag = document.querySelector('[data-t="planTag"]');
  if(planTag) planTag.textContent = pending ? (ar ? 'أدخلا تواريخكما أدناه' : 'Enter your dates below') : `${range} · ${ar ? `${nDays} يومًا / ${nNights} ليلة` : `${nDays} days / ${nNights} nights`}`;

  const sunriseLbl = document.querySelector('[data-t="wSunrise"]');
  if(sunriseLbl) sunriseLbl.textContent = ar ? `الشروق (${startShort} ← ${endShort})` : `Sunrise (${startShort} → ${endShort})`;
  const sunsetLbl = document.querySelector('[data-t="wSunset"]');
  if(sunsetLbl) sunsetLbl.textContent = ar ? `الغروب (${startShort} ← ${endShort})` : `Sunset (${startShort} → ${endShort})`;

  const planSub = document.querySelector('[data-t="planSub"]');
  if(planSub){
    planSub.textContent = pending
      ? (ar ? 'أضيفا تواريخ الوصول والمغادرة، والمدن التي ستزورانها، لنبني خطتكما اليومية أدناه.'
             : "Add your arrival and departure dates, and the cities you're visiting, and we'll build your day-by-day plan below.")
      : usingReal
        ? (ar ? `الوصول ${startShort} الساعة ١٠:٣٠ص حتى المغادرة ${endShort} الساعة ١٢:٣٥ظ — أي ١٤ يومًا تقويميًا و١٣ ليلة فندقية عبر ٥ إقامات. تفاصيل التنقل أولاً، ثم الخطة الكاملة أدناه.`
               : `Arrival ${startShort} at 10:30am to departure ${endShort} at 12:35pm — that's 14 calendar days and 13 hotel nights across 5 stays. Transport details first, full itinerary below.`)
        : (ar ? `الوصول ${startShort} حتى المغادرة ${endShort} — أي ${nDays} يومًا تقويميًا و${nNights} ليلة فندقية عبر توقفاتكما. تفاصيل التنقل أولاً، ثم الخطة الكاملة أدناه.`
               : `Arrival ${startShort} to departure ${endShort} — ${nDays} calendar days and ${nNights} hotel nights across your stops. Transport details first, full itinerary below.`);
  }

  const drawerTitleEl = document.querySelector('[data-t="drawerTitle"]');
  if(drawerTitleEl){
    drawerTitleEl.textContent = pending
      ? tr('drawerTitle')
      : (ar ? `${nDays} يومًا / ${nNights} ليلة — مخطط رحلتنا` : `${nDays} Days / ${nNights} Nights — Our Trip Planner`);
  }
}

/* ---------- ONBOARDING (visitors who aren't the owner) ----------
   isOwner() (a saved GitHub token — see ghConfig()) is treated as "signed in" per how the rest
   of the site already uses that connection. Anyone else either skips (sees the real 14-day trip
   as an example, unchanged) or builds their own: their own arrival/departure, their own cities
   and day-counts, their own hotels (or "not decided yet"). That builds an empty day-by-day
   skeleton (CUSTOM_ITIN) on those dates/cities, which currentItinerary() then serves everywhere
   instead of ITINERARY14 — the existing "+ Add" picker, notes, budget etc. all already work on
   "whatever the itinerary array is" and need no changes to handle it. */
const ONBOARD_CITIES = [
  {key:'cape-town', en:'Cape Town', ar:'كيب تاون', region:'cape-town'},
  {key:'Hermanus', en:'Hermanus', ar:'هيرمانوس', region:'garden-route'},
  {key:'Mossel Bay', en:'Mossel Bay', ar:'موسيل باي', region:'garden-route'},
  {key:'George', en:'George', ar:'جورج', region:'garden-route'},
  {key:'Oudtshoorn', en:'Oudtshoorn', ar:'أودتسهورن', region:'garden-route'},
  {key:'Wilderness', en:'Wilderness', ar:'ويلدرنس', region:'garden-route'},
  {key:'Sedgefield', en:'Sedgefield', ar:'سيدجفيلد', region:'garden-route'},
  {key:'Knysna', en:'Knysna', ar:'كنيسنا', region:'garden-route'},
  {key:'Plettenberg Bay', en:'Plettenberg Bay', ar:'بليتنبرغ باي', region:'garden-route'},
  {key:'Tsitsikamma', en:'Tsitsikamma', ar:'تسيتسيكاما', region:'garden-route'},
  {key:'safari', en:'Safari lodge', ar:'نزل سفاري', region:'safari'},
];
const ONBOARD_SLOTS = [
  {slot:'Breakfast', slot_ar:'الفطور'}, {slot:'Morning', slot_ar:'الصباح'}, {slot:'Lunch', slot_ar:'الغداء'},
  {slot:'Afternoon', slot_ar:'بعد الظهر'}, {slot:'Dinner', slot_ar:'العشاء'},
];
function onDateChanged(){
  updateHeroTitle();
  updateDateDisplays();
  renderPlanItinerary();
  updateCountdown();
  loadWeather(true);
  loadPlanRainBadges();
}
function onboardCityLabel(key){
  const c = ONBOARD_CITIES.find(x=>x.key===key);
  return c ? (LANG==='ar' ? c.ar : c.en) : key;
}
function onboardCityRowHtml(){
  return `<div class="onboard-city-row">
    <select class="onboard-city-select">${ONBOARD_CITIES.map(c=>`<option value="${c.key}">${LANG==='ar'?c.ar:c.en}</option>`).join('')}</select>
    <input type="number" class="onboard-city-days" min="1" max="60" placeholder="${tr('onboardDaysPh')}">
    <input type="text" class="onboard-city-hotel" placeholder="${tr('onboardHotelPh')}">
    <label class="onboard-city-check"><input type="checkbox" class="onboard-city-nodecide">${tr('onboardNotDecided')}</label>
    <button type="button" class="onboard-city-rm" aria-label="${tr('itinRemove')}">✕</button>
  </div>`;
}
function wireOnboardCityRow(row){
  row.querySelector('.onboard-city-days').addEventListener('input', updateOnboardDaysCheck);
  row.querySelector('.onboard-city-nodecide').addEventListener('change', (e)=>{
    const hotelInput = row.querySelector('.onboard-city-hotel');
    hotelInput.disabled = e.target.checked;
    if(e.target.checked) hotelInput.value = '';
  });
  row.querySelector('.onboard-city-rm').addEventListener('click', ()=>{
    if(document.querySelectorAll('.onboard-city-row').length <= 1) return;
    row.remove();
    updateOnboardDaysCheck();
  });
}
function addOnboardCityRow(){
  const wrap = document.getElementById('onboardCities');
  wrap.insertAdjacentHTML('beforeend', onboardCityRowHtml());
  wireOnboardCityRow(wrap.lastElementChild);
  updateOnboardDaysCheck();
}
function computeOnboardTotalDays(){
  const aD = document.getElementById('onboardArrivalDate').value, dD = document.getElementById('onboardDepartDate').value;
  if(!aD || !dD) return null;
  const a = new Date(aD + 'T00:00:00'), d = new Date(dD + 'T00:00:00');
  const days = Math.round((d - a) / 864e5) + 1;
  return days > 0 ? days : null;
}
function updateOnboardDaysCheck(){
  const total = computeOnboardTotalDays();
  const totalEl = document.getElementById('onboardTotalDays'), checkEl = document.getElementById('onboardDaysCheck'), saveBtn = document.getElementById('onboardSave');
  const addBtn = document.getElementById('onboardAddCity');
  totalEl.textContent = total ? tr('onboardTotalDaysText').replace('{n}', LANG==='ar'?arDigits(total):total) : tr('onboardNeedDates');
  const sum = [...document.querySelectorAll('.onboard-city-days')].reduce((s,i)=> s + (parseInt(i.value,10) || 0), 0);
  if(!total){ checkEl.textContent = ''; saveBtn.disabled = true; if(addBtn) addBtn.disabled = false; return; }
  // No days left to hand to a new city once the allocated days already reach the trip length —
  // re-enable the button the moment a shorter stay on an existing city frees a day back up.
  if(addBtn) addBtn.disabled = sum >= total;
  if(sum === total){ checkEl.textContent = tr('onboardDaysMatch'); checkEl.style.color = 'var(--sage)'; saveBtn.disabled = false; }
  else{ checkEl.textContent = tr('onboardDaysMismatch').replace('{sum}', LANG==='ar'?arDigits(sum):sum).replace('{total}', LANG==='ar'?arDigits(total):total); checkEl.style.color = '#b3473b'; saveBtn.disabled = true; }
}
function formatTimeInput(hhmm){   // "14:30" (native <input type=time>) -> "2:30pm"
  if(!hhmm || !/^\d{1,2}:\d{2}$/.test(hhmm)) return '';
  let [h, m] = hhmm.split(':').map(Number);
  const suffix = h >= 12 ? 'pm' : 'am';
  h = h % 12 || 12;
  return `${h}:${String(m).padStart(2,'0')}${suffix}`;
}
function onboardArrivalTip(cityLabel, time){
  return LANG==='ar'
    ? `تصلان اليوم${time?` الساعة ${time}`:''}. خصصا اليوم الأول للاستقرار — تسجيل الدخول، استراحة، وجولة هادئة أولى في ${cityLabel}.`
    : `You arrive today${time?` at ${time}`:''}. Keep day one easy — check in, settle in, and a gentle first look around ${cityLabel}.`;
}
function onboardDepartureTip(time){
  return LANG==='ar'
    ? `رحلة المغادرة اليوم${time?` الساعة ${time}`:''}. أبقيا الصباح لتناول الفطور وتسجيل الخروج فقط.`
    : `Your flight leaves today${time?` at ${time}`:''}. Keep the morning to breakfast and checkout, nothing more.`;
}
function onboardTravelTip(cityLabel){
  return LANG==='ar' ? `يوم انتقال إلى ${cityLabel}.` : `Travel day to ${cityLabel}.`;
}
function onboardStayTip(cityLabel){
  return LANG==='ar'
    ? `يوم حر في ${cityLabel} — استخدما زر "+ إضافة" في كل فترة لاختيار أنشطتكما من القائمة.`
    : `Free day in ${cityLabel} — use the "+ Add" button on each time slot to pick your own activities from the list.`;
}
function buildCustomSkeleton(plan){
  const days = [], totalDays = plan.cities.reduce((s,c)=>s+c.days, 0);
  let dayIdx = 0;
  plan.cities.forEach((c, cIdx)=>{
    const meta = ONBOARD_CITIES.find(x=>x.key===c.key) || {en:c.key, ar:c.key, region:'cape-town'};
    const cityLabel = LANG==='ar' ? meta.ar : meta.en;
    const hotelName = c.undecided || !c.hotel ? tr('onboardHotelTBD') : c.hotel;
    for(let k=0; k<c.days; k++){
      const isFirst = dayIdx===0, isLast = dayIdx===totalDays-1, isCityFirst = k===0;
      let tip;
      if(isFirst) tip = onboardArrivalTip(cityLabel, plan.arrivalTime);
      else if(isLast) tip = onboardDepartureTip(plan.departTime);
      else if(isCityFirst && cIdx>0) tip = onboardTravelTip(cityLabel);
      else tip = onboardStayTip(cityLabel);
      const title = isCityFirst && cIdx>0 ? (LANG==='ar'?`الانتقال إلى ${cityLabel}`:`Travel to ${cityLabel}`) : cityLabel;
      days.push({
        title, title_ar:title, tip, tip_ar:tip, region:meta.region,
        hotel: isCityFirst ? {n:hotelName, n_ar:hotelName, g:gsearch(hotelName+' '+cityLabel), note:'', note_ar:'', hotel:true} : null,
        blocks: ONBOARD_SLOTS.map(s=>({slot:s.slot, slot_ar:s.slot_ar, items:[]})),
      });
      dayIdx++;
    }
  });
  return days;
}
function initOnboarding(){
  const back = document.getElementById('onboardBack');
  if(!back) return;
  const status = document.getElementById('onboardStatus'), saveBtn = document.getElementById('onboardSave'), skipBtn = document.getElementById('onboardSkip');
  function maybeShow(){ back.hidden = isOwner() || !!VISITOR_START; }
  maybeShow();
  if(!document.querySelector('.onboard-city-row')) addOnboardCityRow();
  document.getElementById('onboardAddCity').addEventListener('click', addOnboardCityRow);

  // Constrain the date pickers themselves rather than only catching it after the fact: arrival
  // can't be in the past, and departure can't be before whatever arrival date is currently set.
  const arrivalDateEl = document.getElementById('onboardArrivalDate'), departDateEl = document.getElementById('onboardDepartDate');
  arrivalDateEl.min = isoToday();
  function syncDepartMin(){
    departDateEl.min = arrivalDateEl.value || isoToday();
    if(departDateEl.value && departDateEl.value < departDateEl.min) departDateEl.value = departDateEl.min;
  }
  syncDepartMin();
  arrivalDateEl.addEventListener('input', syncDepartMin);
  // A native <input type=date>'s min only stops the browser's own picker UI from offering an
  // earlier date — it doesn't clamp a value entered another way (typed, pasted, autofilled), so
  // the departure field also corrects itself directly whenever it changes.
  departDateEl.addEventListener('input', ()=>{ if(departDateEl.value && departDateEl.value < departDateEl.min) departDateEl.value = departDateEl.min; });

  ['onboardArrivalDate','onboardDepartDate'].forEach(id=> document.getElementById(id).addEventListener('input', updateOnboardDaysCheck));
  wireOnboardCityRow(document.querySelector('.onboard-city-row'));

  saveBtn.addEventListener('click', ()=>{
    const arrivalDate = document.getElementById('onboardArrivalDate').value, arrivalTime = formatTimeInput(document.getElementById('onboardArrivalTime').value);
    const departDate = document.getElementById('onboardDepartDate').value, departTime = formatTimeInput(document.getElementById('onboardDepartTime').value);
    const total = computeOnboardTotalDays();
    if(!arrivalDate || !departDate || !total){ status.textContent = tr('onboardNeedDates'); return; }
    const rows = [...document.querySelectorAll('.onboard-city-row')];
    const cities = rows.map(row=>({
      key: row.querySelector('.onboard-city-select').value,
      days: parseInt(row.querySelector('.onboard-city-days').value, 10) || 0,
      hotel: row.querySelector('.onboard-city-hotel').value.trim(),
      undecided: row.querySelector('.onboard-city-nodecide').checked,
    }));
    if(cities.some(c=>c.days < 1)){ status.textContent = tr('onboardNeedName'); return; }
    const sum = cities.reduce((s,c)=>s+c.days, 0);
    if(sum !== total){ status.textContent = tr('onboardDaysMismatch').replace('{sum}', sum).replace('{total}', total); return; }

    VISITOR_START = arrivalDate;
    VISITOR_ARRIVAL_TIME = arrivalTime; VISITOR_DEPART_TIME = departTime;
    CUSTOM_ITIN = buildCustomSkeleton({arrivalTime, departTime, cities});
    try{
      localStorage.setItem('ctgr_visitor_start', arrivalDate);
      localStorage.setItem('ctgr_custom_itin', JSON.stringify(CUSTOM_ITIN));
      localStorage.setItem('ctgr_visitor_times', JSON.stringify({arrival:arrivalTime, depart:departTime}));
      localStorage.removeItem('ctgr_itin_overrides');   // a fresh plan shouldn't inherit stray add/remove deltas from anything earlier
    }catch(e){}
    ITIN_OVERRIDES = {};
    back.hidden = true;
    onDateChanged();
  });
  skipBtn.addEventListener('click', ()=>{
    VISITOR_START = REAL_TRIP_START;
    CUSTOM_ITIN = null;
    VISITOR_ARRIVAL_TIME = ''; VISITOR_DEPART_TIME = '';
    try{ localStorage.setItem('ctgr_visitor_start', VISITOR_START); localStorage.removeItem('ctgr_custom_itin'); localStorage.removeItem('ctgr_visitor_times'); }catch(e){}
    back.hidden = true;
    onDateChanged();
  });

  // "Reset my trip" — owner-only pages don't need this (there's nothing per-visitor to undo), but
  // any non-owner who mistyped dates/cities/hotels, or just wants to start over, gets a clean slate:
  // every bit of their own local state (onboarding answers, custom itinerary, shortlist, local
  // notes) is wiped and the page reloads straight back to the onboarding landing screen.
  const resetBtn = document.getElementById('btnResetTrip');
  function refreshResetTripBtn(){ if(resetBtn) resetBtn.style.display = isOwner() ? 'none' : ''; }
  refreshResetTripBtn();
  if(resetBtn) resetBtn.addEventListener('click', ()=>{
    if(!confirm(tr('resetTripConfirm'))) return;
    ['ctgr_visitor_start','ctgr_custom_itin','ctgr_visitor_times','ctgr_itin_overrides','ctgr_usernotes','ctgr_notes_dirty','ctgr_picks'].forEach(k=>{
      try{ localStorage.removeItem(k); }catch(e){}
    });
    location.reload();
  });

  window.addEventListener('ctgr-gh-changed', ()=>{ updateHeroTitle(); updateDateDisplays(); maybeShow(); refreshResetTripBtn(); });
}
function updateCountdown(){
  const b = document.getElementById('statCountdown'), lbl = document.getElementById('countdownLabel');
  if(!b || !lbl) return;
  const todayIso = isoToday(), days = effectiveTripDays();
  const start = new Date(effectiveTripStart() + 'T00:00:00'), today = new Date(todayIso + 'T00:00:00');
  const end = new Date(isoPlusDays(effectiveTripStart(), days - 1) + 'T00:00:00');
  const daysTo = Math.round((start - today) / 864e5);
  if(daysTo > 0){
    b.textContent = daysTo.toLocaleString(LANG==='ar' ? 'ar' : 'en-US');
    lbl.textContent = tr('statCountdownDefault');
  } else if(today <= end){
    const dayNum = Math.round((today - start) / 864e5) + 1;
    b.textContent = dayNum + ' / ' + days;
    lbl.textContent = tr('statCountdownToday');
  } else {
    b.textContent = '🎉';
    lbl.textContent = tr('statCountdownDone');
  }
}

/* ---------- CALENDAR EXPORT (.ics) ---------- */
function icsEscape(s){ return String(s).replace(/\\/g,'\\\\').replace(/;/g,'\\;').replace(/,/g,'\\,').replace(/\n/g,'\\n'); }
function icsFold(line){ // RFC5545: lines over 75 octets should be folded with a leading space
  const out = [];
  let rest = line;
  while(rest.length > 74){ out.push(rest.slice(0, 74)); rest = ' ' + rest.slice(74); }
  out.push(rest);
  return out.join('\r\n');
}
function buildICS(events){
  const stamp = new Date().toISOString().replace(/[-:]/g,'').split('.')[0] + 'Z';
  const lines = ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Cape Town Trip Planner//EN','CALSCALE:GREGORIAN'];
  events.forEach((e, i)=>{
    const start = e.date.replace(/-/g,''), end = isoPlusDays(e.date, 1).replace(/-/g,'');
    lines.push('BEGIN:VEVENT');
    lines.push('UID:ctgr-' + e.date + '-' + i + '@capetown-trip');
    lines.push('DTSTAMP:' + stamp);
    lines.push('DTSTART;VALUE=DATE:' + start);
    lines.push('DTEND;VALUE=DATE:' + end);
    lines.push(icsFold('SUMMARY:' + icsEscape(e.title)));
    if(e.description) lines.push(icsFold('DESCRIPTION:' + icsEscape(e.description)));
    lines.push('END:VEVENT');
  });
  lines.push('END:VCALENDAR');
  return lines.join('\r\n') + '\r\n';
}
function downloadICS(filename, text){
  const blob = new Blob([text], {type:'text/calendar;charset=utf-8'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(()=>URL.revokeObjectURL(url), 4000);
  toast(tr('icsAdded'));
}
function icsEventForDay(i){
  const day = currentItinerary()[i];
  const title = (LANG==='ar' ? day.title_ar : day.title) || '';
  const tip = (LANG==='ar' ? day.tip_ar : day.tip) || '';
  const items = day.blocks.map((b,j)=>{
    const slot = LANG==='ar' ? b.slot_ar : b.slot;
    const names = effectiveSlotItems(i, j, b.items).map(ref=>{
      const it = typeof ref === 'object' ? ref : (typeof ref === 'string' ? {n:ref} : null);
      return it ? (LANG==='ar' ? (it.n_ar||it.n) : it.n) : String(ref);
    }).join(', ');
    return `${slot}: ${names}`;
  }).join('\n');
  return {date: isoPlusDays(effectiveTripStart(), i), title: `Day ${i+1} — ${title}`, description: [tip, items].filter(Boolean).join('\n\n')};
}
function downloadTripICS(dayIndex){
  if(typeof dayIndex === 'number'){
    downloadICS(`cape-town-trip-day-${dayIndex+1}.ics`, buildICS([icsEventForDay(dayIndex)]));
  } else {
    downloadICS('cape-town-trip.ics', buildICS(currentItinerary().map((_, i)=>icsEventForDay(i))));
  }
}

