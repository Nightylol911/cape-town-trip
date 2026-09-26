/* ---- icons (48x48, inline SVG, colours from the site palette) ---- */
const WXC = {sun:'#f4b63a', sunEdge:'#e8961a', cloud:'#e6edf1', cloudEdge:'#a9bcc5', cloudDark:'#8fa3ad', rain:'#2f86b3', bolt:'#f2c230', wind:'#4f7f8b', moon:'#d8dfee', moonEdge:'#98a6c4'};
const wxCloud = (dx=0, dy=0, fill=WXC.cloud)=>`<path transform="translate(${dx} ${dy})" d="M14 35a7 7 0 0 1-.7-13.96A10.5 10.5 0 0 1 33.4 19.3 8 8 0 0 1 34 35z" fill="${fill}" stroke="${WXC.cloudEdge}" stroke-width="1.4" stroke-linejoin="round"/>`;
const wxSun = (cx, cy, r, ray=true)=>{
  let rays = '';
  if(ray) for(let a=0; a<8; a++){ const t=a*Math.PI/4, r1=r+3.2, r2=r+6.4; rays += `<line x1="${(cx+Math.cos(t)*r1).toFixed(1)}" y1="${(cy+Math.sin(t)*r1).toFixed(1)}" x2="${(cx+Math.cos(t)*r2).toFixed(1)}" y2="${(cy+Math.sin(t)*r2).toFixed(1)}" stroke="${WXC.sun}" stroke-width="2.6" stroke-linecap="round"/>`; }
  return `${rays}<circle cx="${cx}" cy="${cy}" r="${r}" fill="${WXC.sun}" stroke="${WXC.sunEdge}" stroke-width="1.2"/>`;
};
const wxMoon = (cx, cy)=>`<path transform="translate(${cx-24} ${cy-24})" d="M29.5 10.5a14 14 0 1 0 8 25.2A11.5 11.5 0 0 1 29.5 10.5z" fill="${WXC.moon}" stroke="${WXC.moonEdge}" stroke-width="1.4" stroke-linejoin="round"/>`;
const wxDrops = (xs, y, len=7)=>xs.map(x=>`<line x1="${x}" y1="${y}" x2="${x-2.6}" y2="${y+len}" stroke="${WXC.rain}" stroke-width="2.6" stroke-linecap="round"/>`).join('');
function wxIcon(kind, size=44, label=''){
  let g = '';
  switch(kind){
    case 'sun': g = wxSun(24, 24, 9); break;
    case 'moon': g = wxMoon(24, 24); break;
    case 'partly': g = wxSun(18, 17, 7.5) + wxCloud(2, 3); break;
    case 'partlyNight': g = wxMoon(17, 17) + wxCloud(2, 3); break;
    case 'cloud': g = wxCloud(0, -2, WXC.cloud); break;
    case 'fog': g = wxCloud(0, -6) + [33,38,43].map((y,i)=>`<line x1="${10+i*2}" y1="${y}" x2="${38-i*2}" y2="${y}" stroke="${WXC.cloudDark}" stroke-width="2.4" stroke-linecap="round"/>`).join(''); break;
    case 'drizzle': g = wxCloud(0, -5) + wxDrops([17,25,33], 34, 4.5); break;
    case 'rain': g = wxCloud(0, -5, '#d5dfe5') + wxDrops([16,24,32], 33, 9) ; break;
    case 'storm': g = wxCloud(0, -5, '#c3cfd6') + `<polygon points="25,29 18,40 24,40 22,47 31,35 25,35 28,29" fill="${WXC.bolt}" stroke="#d29a10" stroke-width="1" stroke-linejoin="round"/>`; break;
    case 'snow': g = wxCloud(0, -5) + [[17,38],[25,42],[33,38]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="2.3" fill="#fff" stroke="${WXC.cloudEdge}" stroke-width="1.2"/>`).join(''); break;
    case 'windy': g = wxSun(38, 10, 5, false)
      + `<g fill="none" stroke="${WXC.wind}" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 22h23a5 5 0 1 0-4.6-7"/><path d="M6 31h31a5.5 5.5 0 1 1-5 7.6"/><path d="M6 40h14"/></g>`; break;
    default: g = wxCloud();
  }
  return `<svg class="wx-svg" viewBox="0 0 48 48" width="${size}" height="${size}" role="img" aria-label="${escHtml(label)}">${g}</svg>`;
}
function wxKind(code, isDay, wind, forceWind){
  let k;
  if(code === 0 || code === 1) k = isDay ? 'sun' : 'moon';
  else if(code === 2) k = isDay ? 'partly' : 'partlyNight';
  else if(code === 3) k = 'cloud';
  else if(code === 45 || code === 48) k = 'fog';
  else if(code >= 51 && code <= 57) k = 'drizzle';
  else if((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) k = 'rain';
  else if((code >= 71 && code <= 77) || code === 85 || code === 86) k = 'snow';
  else if(code >= 95) k = 'storm';
  else k = 'cloud';
  if(wind >= forceWind && ['sun','moon','partly','partlyNight','cloud'].includes(k)) k = 'windy';
  return k;
}
const WX_LABEL = {
  en:{sun:'Sunny', moon:'Clear night', partly:'Partly cloudy', partlyNight:'Partly cloudy', cloud:'Cloudy', fog:'Fog', drizzle:'Drizzle', rain:'Rain', storm:'Thunderstorm', snow:'Snow', windy:'Windy'},
  ar:{sun:'مشمس', moon:'ليلة صافية', partly:'غائم جزئيًا', partlyNight:'غائم جزئيًا', cloud:'غائم', fog:'ضباب', drizzle:'رذاذ', rain:'مطر', storm:'عاصفة رعدية', snow:'ثلج', windy:'رياح قوية'}
};
const wxLabel = k => (WX_LABEL[LANG] || WX_LABEL.en)[k] || k;

/* small stat-tile icons (stroke, currentColor) */
const WTI = {
  high:'<path d="M14 5a2.5 2.5 0 0 0-5 0v9.2a4.5 4.5 0 1 0 5 0z"/><path d="M11.5 9v7"/><path d="M18 6l2.5-2.5L23 6M20.5 3.5V10"/>',
  low:'<path d="M14 5a2.5 2.5 0 0 0-5 0v9.2a4.5 4.5 0 1 0 5 0z"/><path d="M11.5 9v7"/><path d="M18 8l2.5 2.5L23 8M20.5 10.5V4"/>',
  sea:'<path d="M2 9c2.2 0 2.2-2 4.5-2S8.7 9 11 9s2.2-2 4.5-2S17.7 9 20 9s2-2 3-2"/><path d="M2 14c2.2 0 2.2-2 4.5-2S8.7 14 11 14s2.2-2 4.5-2S17.7 14 20 14s2-2 3-2"/><path d="M2 19c2.2 0 2.2-2 4.5-2S8.7 19 11 19s2.2-2 4.5-2S17.7 19 20 19s2-2 3-2"/>',
  wind:'<path d="M2 9h11a3 3 0 1 0-2.8-4"/><path d="M2 14h16a3.2 3.2 0 1 1-3 4.3"/><path d="M2 19h6"/>',
  rain:'<path d="M12 3s6 6.6 6 11a6 6 0 0 1-12 0c0-4.4 6-11 6-11z"/><path d="M9.5 15a2.8 2.8 0 0 0 2.5 2.4"/>',
  uv:'<circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M18.7 5.3l-2.1 2.1M7.4 16.6l-2.1 2.1"/>',
  sunrise:'<path d="M2 19h20"/><path d="M6.5 19a5.5 5.5 0 0 1 11 0"/><path d="M12 5v4.5M12 5l-2.2 2.2M12 5l2.2 2.2M4 12l1.8 1.2M20 12l-1.8 1.2"/>',
  sunset:'<path d="M2 19h20"/><path d="M6.5 19a5.5 5.5 0 0 1 11 0"/><path d="M12 9.5V5M12 9.5L9.8 7.3M12 9.5l2.2-2.2M4 12l1.8 1.2M20 12l-1.8 1.2"/>'
};
function wxTileIcons(){
  document.querySelectorAll('.wstat[data-w]').forEach(el=>{
    if(el.querySelector('.wi')) return;
    const s = document.createElement('span'); s.className = 'wi'; s.setAttribute('aria-hidden', 'true');
    s.innerHTML = `<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${WTI[el.dataset.w] || ''}</svg>`;
    el.insertBefore(s, el.firstChild);
  });
}

/* ---- data ---- */
const wxAddDays = (iso, n)=>{ const d = new Date(iso + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
const wxShiftYear = (iso, y)=>{ const [, m, d] = iso.split('-').map(Number); return new Date(Date.UTC(y, m - 1, d)).toISOString().slice(0, 10); };
const wxIsoToday = ()=>new Date().toISOString().slice(0, 10);
async function wxJson(url){ const r = await fetch(url); if(!r.ok) throw new Error('HTTP ' + r.status); return r.json(); }
const wxUrl = (base, loc, extra)=>`${base}?latitude=${WX_LOC[loc].lat}&longitude=${WX_LOC[loc].lon}&wind_speed_unit=kmh&timezone=Africa%2FJohannesburg${extra}`;
const WX_FDAILY = 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum,wind_speed_10m_max,sunrise,sunset,uv_index_max';
const WX_ADAILY = 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max,sunrise,sunset';

/* small cache: memory + localStorage. If a request fails, the last saved answer is used (works offline). */
const wxMem = new Map();
function wxLsRead(){ try{ return JSON.parse(localStorage.getItem(WX_LS) || '{}') || {}; }catch(e){ return {}; } }
function wxLsWrite(o){
  try{
    const keys = Object.keys(o);
    if(keys.length > 40) keys.sort((a, b)=>o[a].t - o[b].t).slice(0, keys.length - 40).forEach(k=>delete o[k]);
    localStorage.setItem(WX_LS, JSON.stringify(o));
  }catch(e){ /* storage full or blocked: memory cache still works */ }
}
async function wxCached(key, ttl, fn){
  const now = Date.now(), ls = wxLsRead(), hit = wxMem.get(key) || ls[key];
  if(hit && now - hit.t < ttl) return hit.v;
  try{
    const v = await fn(), rec = {t:now, v};
    wxMem.set(key, rec); ls[key] = rec; wxLsWrite(ls);
    return v;
  }catch(e){
    if(hit){ wxStale = true; return hit.v; }
    throw e;
  }
}
function wxDrop(prefix){
  [...wxMem.keys()].forEach(k=>{ if(k.startsWith(prefix)) wxMem.delete(k); });
  const ls = wxLsRead(); Object.keys(ls).forEach(k=>{ if(k.startsWith(prefix)) delete ls[k]; }); wxLsWrite(ls);
}

/* live data (updates every ~25 min) */
const wxCore = loc=>wxCached('core|' + loc, 25*60e3, async()=>{
  const j = await wxJson(wxUrl('https://api.open-meteo.com/v1/forecast', loc,
    `&current=temperature_2m,apparent_temperature,relative_humidity_2m,is_day,weather_code,wind_speed_10m,wind_gusts_10m`
    + `&hourly=temperature_2m,weather_code,precipitation_probability,wind_speed_10m,is_day&daily=${WX_FDAILY}&forecast_days=16`));
  Object.keys(j.hourly || {}).forEach(k=>{ if(Array.isArray(j.hourly[k])) j.hourly[k] = j.hourly[k].slice(0, 48); });   // only the next day or so is needed
  j._t = Date.now();
  return j;
});
const wxPast = loc=>wxCached('past|' + loc, 6*3600e3, ()=>wxJson(wxUrl('https://api.open-meteo.com/v1/forecast', loc, `&daily=${WX_FDAILY}&past_days=92&forecast_days=1`)).then(j=>j.daily));
const wxArchive = (loc, s, e)=>wxCached(`arc|${loc}|${s}|${e}`, 30*864e5, ()=>wxJson(wxUrl('https://archive-api.open-meteo.com/v1/archive', loc, `&start_date=${s}&end_date=${e}&daily=${WX_ADAILY}`)).then(j=>j.daily));

/* typical weather for a date window: average of the same dates (+-2 days) over the previous 5 years */
function wxTypicalDay(hist, i){
  const rows = [];
  hist.forEach(d=>{
    for(let o = i; o <= i + 4; o++){
      if(d.temperature_2m_max && d.temperature_2m_max[o] != null){
        rows.push({code:d.weather_code[o], hi:d.temperature_2m_max[o], lo:d.temperature_2m_min[o], pr:d.precipitation_sum[o] || 0, wind:d.wind_speed_10m_max[o] || 0});
      }
    }
  });
  if(!rows.length) return null;
  const avg = f=>rows.reduce((s, r)=>s + f(r), 0) / rows.length;
  const rainFrac = rows.filter(r=>r.pr >= 1).length / rows.length;
  const dry = rows.filter(r=>r.pr < 1 && r.code <= 3), counts = {};
  (dry.length ? dry : rows).forEach(r=>{ const c = r.code <= 1 ? 0 : r.code; counts[c] = (counts[c] || 0) + 1; });
  const mode = +Object.keys(counts).sort((a, b)=>counts[b] - counts[a])[0], wind = avg(r=>r.wind);
  let kind = wxKind(mode, 1, wind, 40);
  if(rainFrac >= 0.5) kind = 'rain';
  return {hi:avg(r=>r.hi), lo:avg(r=>r.lo), wind, rain:Math.round(rainFrac * 100), kind};
}
const wxTypicalWindow = (loc, startISO, n)=>wxCached(`typ|${loc}|${startISO.slice(5)}|${n}`, 30*864e5, async()=>{
  const y0 = new Date().getUTCFullYear();
  const res = await Promise.allSettled(Array.from({length:WX_HIST_YEARS}, (_, k)=>{
    const s = wxShiftYear(startISO, y0 - 1 - k);
    return wxJson(wxUrl('https://archive-api.open-meteo.com/v1/archive', loc, `&start_date=${wxAddDays(s, -2)}&end_date=${wxAddDays(s, n + 1)}&daily=${WX_ADAILY}`));
  }));
  const ok = res.filter(r=>r.status === 'fulfilled').map(r=>r.value.daily).filter(Boolean);
  if(!ok.length) throw new Error('no history');
  return Array.from({length:n}, (_, i)=>wxTypicalDay(ok, i));
});

/* the day list for any date window: live forecast, recorded weather, or typical weather */
function wxRainKind(kind, rainy){ return (rainy && !['rain', 'drizzle', 'storm', 'snow'].includes(kind)) ? 'rain' : kind; }
async function wxDaysFor(loc, startISO, n){
  const core = await wxCore(loc).catch(()=>null), fd = core && core.daily;
  const today = (fd && fd.time[0]) || wxIsoToday();
  const dates = Array.from({length:n}, (_, i)=>wxAddDays(startISO, i));
  const inF = d=>fd ? fd.time.indexOf(d) : -1;
  const needPast = [], needOld = [], needTyp = [];
  dates.forEach(d=>{
    if(inF(d) >= 0) return;
    if(d < today) (d >= wxAddDays(today, -92) ? needPast : needOld).push(d); else needTyp.push(d);
  });
  const past = needPast.length ? await wxPast(loc).catch(()=>null) : null;
  const old = needOld.length ? await wxArchive(loc, needOld[0], needOld[needOld.length - 1]).catch(()=>null) : null;
  const typ = needTyp.length ? await wxTypicalWindow(loc, startISO, n).catch(()=>null) : null;
  const fromDaily = (src, D, k, forecast)=>{
    const hi = D.temperature_2m_max[k]; if(hi == null) return null;
    const wind = D.wind_speed_10m_max[k], mm = D.precipitation_sum ? D.precipitation_sum[k] : null;
    const prob = forecast ? D.precipitation_probability_max[k] : null;
    let kind = wxKind(D.weather_code[k], 1, wind, 40);
    kind = wxRainKind(kind, forecast ? (prob >= 60) : (mm >= 2));
    return {src, hi, lo:D.temperature_2m_min[k], wind, mm, rain:prob, kind, uv:D.uv_index_max ? D.uv_index_max[k] : null,
      sunrise:D.sunrise ? D.sunrise[k] : null, sunset:D.sunset ? D.sunset[k] : null};
  };
  return dates.map((date, i)=>{
    let day = null, k;
    if((k = inF(date)) >= 0) day = fromDaily('forecast', fd, k, true);
    else if(date < today){
      if(past && (k = past.time.indexOf(date)) >= 0) day = fromDaily('recorded', past, k, false);
      else if(old && (k = old.time.indexOf(date)) >= 0) day = fromDaily('recorded', old, k, false);
    }else if(typ && typ[i]) day = Object.assign({src:'typical'}, typ[i]);
    return Object.assign({date, i, loc}, day || {src:null});
  });
}

/* ---- rendering ---- */
const wxDeg = v=>Math.round(v) + '°';
const wxSvgSmall = p=>`<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
const WX_ICON_DROP = wxSvgSmall('<path d="M12 3s6 6.6 6 11a6 6 0 0 1-12 0c0-4.4 6-11 6-11z"/>');
const WX_ICON_WIND = wxSvgSmall('<path d="M2 9h11a3 3 0 1 0-2.8-4"/><path d="M2 15h16a3.2 3.2 0 1 1-3 4.3"/>');
const wxEl = id=>document.getElementById(id);
const wxLocale = ()=>LANG === 'ar' ? 'ar-SA-u-nu-latn' : 'en-GB';
const wxFmt = (iso, opt)=>new Date(iso + 'T00:00:00Z').toLocaleDateString(wxLocale(), Object.assign({timeZone:'UTC'}, opt));
let wxShown = [], wxSel = '';

function renderWeather(){
  if(!wxEl('wxNow')) return;
  wxTileIcons();
  const nowEl = wxEl('wxNow'), hoursEl = wxEl('wxHours'), noteEl = wxEl('wxNote'), n = WX.now;
  if(n){
    const label = wxLabel(n.kind);
    nowEl.className = 'wx-now';
    nowEl.innerHTML = `<div class="wx-now-ic">${wxIcon(n.kind, 72, label)}</div>
      <div class="wx-now-main"><div class="wx-now-place">${escHtml(tr('wxNowIn'))} <span class="wx-live">${escHtml(tr('wxLive'))}</span></div><div class="wx-now-temp">${wxDeg(n.temp)}<span>C</span></div><div class="wx-now-cond">${escHtml(label)}</div></div>
      <div class="wx-now-facts">
        <div><b>${wxDeg(n.feels)}</b><span>${escHtml(tr('wxFeels'))}</span></div>
        <div><b>${Math.round(n.wind)} <small>km/h</small></b><span>${escHtml(tr('wxWind'))}${n.gust ? ` · ${escHtml(tr('wxGusts'))} ${Math.round(n.gust)}` : ''}</span></div>
        <div><b>${Math.round(n.hum)}%</b><span>${escHtml(tr('wxHumidity'))}</span></div>
        <div><b dir="ltr">${escHtml(n.time)}</b><span>${escHtml(tr('wxLocalTime'))}</span></div>
      </div>`;
  }else{
    nowEl.className = 'wx-now wx-empty';
    nowEl.textContent = tr(WX.status === 'loading' ? 'wxLoading' : 'wxFail');
  }
  hoursEl.innerHTML = WX.hourly.length ? `<div class="wx-hours-t">${escHtml(tr('wxHourly'))}</div><div class="wx-hours-row">` + WX.hourly.map((h, i)=>{
    const label = wxLabel(h.kind);
    return `<div class="wx-hr ${i === 0 ? 'is-now' : ''}"><div class="wx-hr-t" dir="ltr">${i === 0 ? escHtml(tr('wxNowShort')) : h.hour}</div>${wxIcon(h.kind, 34, label)}<b>${wxDeg(h.temp)}</b><span>${WX_ICON_DROP} ${Math.round(h.rain || 0)}%</span></div>`;
  }).join('') + '</div>' : '';
  const t = WX.updated ? new Date(WX.updated).toLocaleTimeString(wxLocale(), {hour:'2-digit', minute:'2-digit'}) : '';
  noteEl.textContent = (WX.status === 'offline' ? tr('wxOffline') + ' ' : '') + (t ? tr('wxUpdated').replace('{t}', t) : '');
  wxRenderStrip();
}

const WX_SRC = {forecast:'wxForecast', recorded:'wxRecorded', typical:'wxTypical'};
function wxRenderStrip(){
  const stripEl = wxEl('wxStrip'); if(!stripEl) return;
  const rangeEl = wxEl('wxRange'), place = tr(wxTab === 'trip' ? 'wxTripTitle' : (wxLoc === 'gr' ? 'wxGR' : 'wxCT'));
  if(wxTab === 'trip') rangeEl.textContent = tr('wxTripTitle');
  else if(wxShown.length) rangeEl.textContent = `${wxFmt(wxShown[0].date, {day:'numeric', month:'short', year:'numeric'})} – ${wxFmt(wxShown[wxShown.length - 1].date, {day:'numeric', month:'short', year:'numeric'})} · ${place}`;
  else rangeEl.textContent = place;
  if(wxLoadingStrip){ stripEl.innerHTML = `<div class="wx-load">${escHtml(tr('wxLoading'))}</div>`; wxEl('wxDetail').innerHTML = ''; return; }
  const usable = wxShown.filter(d=>d.src);
  if(!usable.length){ stripEl.innerHTML = `<div class="wx-load">${escHtml(tr('wxFail'))}</div>`; wxEl('wxDetail').innerHTML = ''; return; }
  stripEl.innerHTML = usable.map(d=>{
    const label = wxLabel(d.kind), fcst = d.src === 'forecast', rainTxt = d.src === 'recorded' ? `${Math.round((d.mm || 0) * 10) / 10} mm` : `${Math.round(d.rain || 0)}%`;
    const head = wxTab === 'trip' ? (LANG === 'ar' ? 'اليوم ' + (d.i + 1) : 'Day ' + (d.i + 1)) : wxFmt(d.date, {weekday:'short'});
    const sub = wxTab === 'trip' ? wxFmt(d.date, {weekday:'short', day:'numeric', month:'short'}) : wxFmt(d.date, {day:'numeric', month:'short'});
    return `<button type="button" class="wx-day is-${d.src} ${d.date === wxSel ? 'is-sel' : ''}" data-date="${d.date}" data-loc="${d.loc}">
      <span class="wx-d1">${escHtml(head)}</span><span class="wx-d2">${escHtml(sub)}</span>
      <span class="wx-ic">${wxIcon(d.kind, 46, label)}</span><span class="wx-cond">${escHtml(label)}</span>
      <span class="wx-t"><b>${wxDeg(d.hi)}</b><span>${wxDeg(d.lo)}</span></span>
      <span class="wx-meta"><span>${WX_ICON_DROP} ${rainTxt}</span><span>${WX_ICON_WIND} ${Math.round(d.wind)}</span></span>
      <span class="wx-badge">${escHtml(tr(WX_SRC[d.src]))}</span>
      ${wxTab === 'trip' ? `<span class="wx-loc">${escHtml(tr(d.loc === 'gr' ? 'wxGR' : 'wxCT'))}</span>` : ''}
    </button>`;
  }).join('');
  wxRenderDetail();
}
function wxRenderDetail(){
  const el = wxEl('wxDetail'), d = wxShown.find(x=>x.date === wxSel && x.src);
  if(!d){ el.innerHTML = ''; return; }
  const hm = s=>s ? String(s).slice(11, 16) : '—';
  const rain = d.src === 'recorded' ? `${Math.round((d.mm || 0) * 10) / 10} mm` : `${Math.round(d.rain || 0)}%` + (d.mm != null && d.src === 'forecast' ? ` · ${Math.round(d.mm * 10) / 10} mm` : '');
  const cells = [[tr('wxHigh'), wxDeg(d.hi)], [tr('wxLow'), wxDeg(d.lo)], [tr('wxRain'), rain], [tr('wxWind'), Math.round(d.wind) + ' km/h'],
    [tr('wxUV'), d.uv != null ? Math.round(d.uv) : '—'], [tr('wxSunrise'), hm(d.sunrise)], [tr('wxSunset'), hm(d.sunset)]];
  const note = d.src === 'forecast' ? tr('wxNoteForecast') : d.src === 'recorded' ? tr('wxNoteRecorded') : tr('wxNoteTypical');
  el.innerHTML = `<div class="wx-detail-h">${wxIcon(d.kind, 40, wxLabel(d.kind))}<div><b>${escHtml(wxFmt(d.date, {weekday:'long', day:'numeric', month:'long', year:'numeric'}))}</b><span>${escHtml(wxLabel(d.kind))} · ${escHtml(tr(d.loc === 'gr' ? 'wxGR' : 'wxCT'))}</span></div></div>
    <div class="wx-detail-grid">${cells.map(([k, v])=>`<div><span>${escHtml(k)}</span><b dir="ltr">${escHtml(String(v))}</b></div>`).join('')}</div>
    <p class="wx-detail-note">${escHtml(note)}</p>`;
}

/* tiles under the strip: typical Cape Town numbers for the trip dates */
async function wxTiles(){
  try{
    const typ = (await wxTypicalWindow('ct', effectiveTripStart(), effectiveTripDays())).filter(Boolean);
    if(!typ.length) return;
    const rng = f=>{ const v = typ.map(f); return [Math.round(Math.min(...v)), Math.round(Math.max(...v))]; };
    const r = a=>a[0] === a[1] ? String(a[0]) : a[0] + '–' + a[1];
    const set = (k, txt)=>{ const el = document.querySelector(`.wstat[data-w="${k}"] .wv`); if(el) el.textContent = txt; };
    set('high', r(rng(t=>t.hi)) + '°C'); set('low', r(rng(t=>t.lo)) + '°C'); set('wind', r(rng(t=>t.wind)) + ' km/h');
    set('rain', '~' + Math.round(typ.reduce((s, t)=>s + t.rain, 0) / typ.length) + '%');
  }catch(e){ /* keep the built-in seasonal numbers */ }
}

/* load + show */
let wxLoadingStrip = true;
async function wxShow(){
  const seq = ++wxSeq;
  wxLoadingStrip = true; wxRenderStrip();
  let days = [];
  try{
    if(wxTab === 'trip'){
      const [ct, gr] = await Promise.all([wxDaysFor('ct', effectiveTripStart(), effectiveTripDays()), wxDaysFor('gr', effectiveTripStart(), effectiveTripDays())]);
      const itin = currentItinerary();
      days = ct.map((d, i)=>(itin[i] && itin[i].region === 'garden-route') ? gr[i] : d);
    }else if(wxTab === 'live'){
      days = await wxDaysFor(wxLoc, WX.today || wxIsoToday(), 16);
    }else{
      days = await wxDaysFor(wxLoc, wxPick || WX.today || wxIsoToday(), 7);
    }
  }catch(e){ days = []; }
  if(seq !== wxSeq) return;      // the user already picked something else
  wxShown = days; wxLoadingStrip = false;
  if(wxSel && !days.some(d=>d.date === wxSel)) wxSel = '';
  wxRenderStrip();
}
function wxSyncControls(){
  document.querySelectorAll('.wx-tab').forEach(b=>b.classList.toggle('active', b.dataset.wxt === wxTab));
  document.querySelectorAll('[data-wxl]').forEach(b=>b.classList.toggle('active', b.dataset.wxl === wxLoc));
  wxEl('wxLocToggle').style.display = wxTab === 'trip' ? 'none' : '';
  wxEl('wxDateCtl').style.display = wxTab === 'date' ? '' : 'none';
  if(wxPick) wxEl('wxDate').value = wxPick;
}
async function loadWeather(force){
  if(wxBusy) return; wxBusy = true; wxStale = false;
  if(force) wxDrop('core|');
  try{
    const core = await wxCore('ct'), c = core.current;
    WX.now = {temp:c.temperature_2m, feels:c.apparent_temperature, hum:c.relative_humidity_2m, wind:c.wind_speed_10m, gust:c.wind_gusts_10m, isDay:c.is_day, time:String(c.time || '').slice(11, 16), kind:wxKind(c.weather_code, c.is_day, c.wind_speed_10m, 32)};
    const h = core.hourly, from = String(c.time || '').slice(0, 13);
    const start = Math.max(0, h.time.findIndex(t=>t.slice(0, 13) >= from));
    WX.hourly = h.time.slice(start, start + 24).map((t, k)=>({hour:t.slice(11, 16), temp:h.temperature_2m[start + k], rain:h.precipitation_probability[start + k], kind:wxKind(h.weather_code[start + k], h.is_day[start + k], h.wind_speed_10m[start + k], 32)}));
    WX.today = core.daily.time[0]; WX.updated = core._t; WX.status = wxStale ? 'offline' : 'ok';
  }catch(e){ WX.now = null; WX.hourly = []; WX.status = 'fail'; }
  wxBusy = false; wxLastFetch = Date.now();
  if(!wxPick) wxPick = WX.today || wxIsoToday();
  renderWeather(); wxSyncControls();
  await wxShow(); wxTiles();
}

/* controls */
document.querySelectorAll('.wx-tab').forEach(b=>b.addEventListener('click', ()=>{ wxTab = b.dataset.wxt; wxSel = (wxTab === 'date') ? wxPick : ''; wxSyncControls(); wxShow(); }));
document.querySelectorAll('[data-wxl]').forEach(b=>b.addEventListener('click', ()=>{ wxLoc = b.dataset.wxl; wxSyncControls(); wxShow(); }));
wxEl('wxDate').addEventListener('change', e=>{ if(/^\d{4}-\d{2}-\d{2}$/.test(e.target.value)){ wxPick = e.target.value; wxSel = wxPick; wxShow(); } });
wxEl('wxPrev').addEventListener('click', ()=>{ wxPick = wxAddDays(wxPick || wxIsoToday(), -7); wxSel = ''; wxSyncControls(); wxShow(); });
wxEl('wxNext').addEventListener('click', ()=>{ wxPick = wxAddDays(wxPick || wxIsoToday(), 7); wxSel = ''; wxSyncControls(); wxShow(); });
wxEl('wxToday').addEventListener('click', ()=>{ wxPick = WX.today || wxIsoToday(); wxSel = wxPick; wxSyncControls(); wxShow(); });
wxEl('wxStrip').addEventListener('click', e=>{
  const b = e.target instanceof Element ? e.target.closest('.wx-day') : null; if(!b) return;
  wxSel = (wxSel === b.dataset.date) ? '' : b.dataset.date;
  wxEl('wxStrip').querySelectorAll('.wx-day').forEach(x=>x.classList.toggle('is-sel', x.dataset.date === wxSel));
  wxRenderDetail();
});
wxEl('wxRefresh').addEventListener('click', ()=>{ WX.status = 'loading'; loadWeather(true); });
document.addEventListener('visibilitychange', ()=>{ if(!document.hidden && Date.now() - wxLastFetch > 25*60e3) loadWeather(); });
setInterval(()=>{ if(!document.hidden) loadWeather(); }, 25*60e3);

