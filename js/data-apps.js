/* App Store links: apps.apple.com has no public "/search?term=" page (that was my mistake last
   round — it 404s, there's no such route). The iTunes Search API is the real, public, documented
   Apple endpoint (itunes.apple.com/search) and returns each result's actual, live storefront URL
   (trackViewUrl) — so instead of guessing a link, every tap looks the app up for real and opens
   whatever Apple's own index says is the correct page for the "sa" (Saudi) storefront.
   window.open() is called synchronously on click (before the lookup) and only *retargeted* once
   the answer comes back — calling window.open() itself after an await gets blocked as a pop-up
   by most browsers, since by then it's no longer inside the original click.
   Icons: each app looks for icons/apps/<slug>.png first (a plain colored-monogram placeholder
   ships there today — see tools/make-app-icons.js). Drop the real app icon in at that exact
   path (square, 128px+) any time and it replaces the placeholder automatically, no code change —
   same GitHub upload flow as adding photos. Falls back to the emoji only if even that 404s. */
async function resolveAppStoreUrl(search){
  let cache = {};
  try{ cache = JSON.parse(localStorage.getItem('ctgr_appstore_cache') || '{}'); }catch(e){}
  const hit = cache[search];
  if(hit && (Date.now() - hit.t) < 30 * 86400e3) return hit.url;
  const r = await fetch('https://itunes.apple.com/search?country=sa&entity=software&limit=1&term=' + encodeURIComponent(search));
  if(!r.ok) throw new Error('lookup failed');
  const data = await r.json();
  const url = data.results && data.results[0] && data.results[0].trackViewUrl;
  if(!url) throw new Error('no results');
  cache[search] = {url, t: Date.now()};
  try{ localStorage.setItem('ctgr_appstore_cache', JSON.stringify(cache)); }catch(e){}
  return url;
}
async function openAppStoreLink(search){
  const win = window.open('', '_blank');
  try{ if(win) win.document.write('<title>' + escHtml(search) + '</title><body style="font:15px -apple-system,sans-serif;padding:40px;color:#555">Opening the App Store…</body>'); }catch(e){}
  let url;
  try{ url = await resolveAppStoreUrl(search); }
  catch(e){ url = 'https://www.google.com/search?q=' + encodeURIComponent(search + ' app store'); }
  if(win) win.location.href = url; else window.open(url, '_blank');
}
const USEFUL_APPS = [
  {slug:'uber', icon:'🚕', name:'Uber', search:'Uber', desc:"Order a taxi", desc_ar:"طلب سيارة أجرة"},
  {slug:'bolt', icon:'⚡', name:'Bolt', search:'Bolt Taxi', desc:"Order a taxi", desc_ar:"طلب سيارة أجرة"},
  {slug:'uber-eats', icon:'🍔', name:'Uber Eats', search:'Uber Eats', desc:"Order food delivery", desc_ar:"طلب توصيل طعام"},
  {slug:'mr-d', icon:'🛒', name:'Mr D', search:'Mr D Food', desc:"Order groceries & takeaway", desc_ar:"طلب بقالة ووجبات جاهزة"},
  {slug:'pnp-asap', icon:'🛒', name:'Pick n Pay ASAP!', search:'Pick n Pay asap', desc:"Grocery delivery, plus SmartShopper rewards (one app — Pick n Pay merged them)", desc_ar:"توصيل بقالة، مع مكافآت SmartShopper (تطبيق واحد بعد دمجهما من بيك أند باي)"},
  {slug:'checkers-sixty60', icon:'🛒', name:'Checkers Sixty60', search:'Checkers Sixty60', desc:"Order grocery delivery in ~60 minutes", desc_ar:"طلب توصيل بقالة خلال ~٦٠ دقيقة"},
  {slug:'getyourguide', icon:'🎫', name:'GetYourGuide', search:'GetYourGuide', desc:"Plan your trip and book tours & events", desc_ar:"خططا لرحلتكما واحجزا جولات وفعاليات"},
  {slug:'klook', icon:'🎡', name:'Klook', search:'Klook Travel', desc:"Book travel and activities", desc_ar:"احجزا سفرًا وأنشطة سياحية"},
  {slug:'airalo', icon:'🌐', name:'Airalo', search:'Airalo eSIM', desc:"Buy an eSIM for mobile data", desc_ar:"شراء شريحة eSIM للبيانات"},
  {slug:'nomad', icon:'📶', name:'Nomad', search:'Nomad eSIM', desc:"Buy an eSIM for mobile data", desc_ar:"شراء شريحة eSIM للبيانات"},
  {slug:'rova', icon:'📡', name:'Rova by STC', search:'Rova eSIM STC', desc:"Buy an eSIM for mobile data", desc_ar:"شراء شريحة eSIM للبيانات"},
  {slug:'flush', icon:'🚻', name:'Flush', search:'Flush Toilet Finder', desc:"Find a public bathroom, with ratings", desc_ar:"إيجاد حمامات عامة مع تقييمات"},
  {slug:'skyscanner', icon:'✈️', name:'Skyscanner', search:'Skyscanner Flights', desc:"Compare flight prices", desc_ar:"مقارنة أسعار تذاكر الطيران"},
  {slug:'wego', icon:'🛫', name:'Wego', search:'Wego Flights Hotels', desc:"Compare flight prices", desc_ar:"مقارنة أسعار تذاكر الطيران"},
  {slug:'airbnb', icon:'🏠', name:'Airbnb', search:'Airbnb', desc:"Book an apartment to stay in", desc_ar:"حجز شقق للإقامة"},
  {slug:'takealot', icon:'🛍️', name:'Takealot', search:'Takealot', desc:"South Africa's online retail store", desc_ar:"متجر جنوب أفريقيا الإلكتروني"},
];
/* Icon upload (GitHub-connected devices only) — lets you replace a placeholder with the real
   app icon right from the page, instead of having to touch files in the repo yourself. Center-
   crops to a square and re-encodes at a fixed size, so every icon — however it was sourced —
   ends up the same size and quality as the rest. */
function processAppIcon(file){
  return new Promise((resolve, reject)=>{
    const src = URL.createObjectURL(file);
    const img = new Image();
    img.onload = ()=>{
      const SIZE = 256;
      const side = Math.min(img.naturalWidth, img.naturalHeight);
      const sx = (img.naturalWidth - side) / 2, sy = (img.naturalHeight - side) / 2;
      const c = document.createElement('canvas'); c.width = SIZE; c.height = SIZE;
      c.getContext('2d').drawImage(img, sx, sy, side, side, 0, 0, SIZE, SIZE);
      URL.revokeObjectURL(src);
      c.toBlob(b=> b ? resolve(b) : reject(new Error('encode failed')), 'image/png');
    };
    img.onerror = ()=>{ URL.revokeObjectURL(src); reject(new Error('decode failed')); };
    img.src = src;
  });
}
async function uploadAppIcon(slug, blob){
  const cfg = ghConfig();
  if(!cfg) throw new Error('not connected');
  const branch = (await ghJson(cfg, '')).default_branch || 'main';
  const path = `icons/apps/${slug}.png`;
  let sha;
  const r = await ghFetch(cfg, `/contents/${path}?ref=${encodeURIComponent(branch)}`, {headers:{'Accept':'application/vnd.github+json'}});
  if(r.ok){ sha = (await r.json()).sha; }
  else if(r.status !== 404){ throw Object.assign(new Error('GitHub ' + r.status), {status: r.status}); }
  const content = await blobToB64(blob);
  await ghJson(cfg, `/contents/${path}`, {method:'PUT', body:{message:'Update app icon: ' + slug, content, sha, branch}});
}
function wireAppIconError(el){
  el.querySelectorAll('.app-icon img').forEach(img=>{
    img.addEventListener('error', ()=>{
      const slug = img.closest('.app-tile').dataset.slug;
      const app = USEFUL_APPS.find(a=>a.slug===slug);
      img.parentElement.innerHTML = `<span class="app-icon-fallback">${app ? app.icon : '📱'}</span>`;
    }, {once:true});
  });
}
function wireAppIconUploads(el){
  el.querySelectorAll('.app-icon-upload').forEach(btn=>{
    btn.style.display = canEdit() ? 'flex' : 'none';
    btn.addEventListener('click', (e)=>{
      e.preventDefault(); e.stopPropagation();
      el.querySelector(`.app-icon-file[data-slug="${btn.dataset.slug}"]`).click();
    });
  });
  el.querySelectorAll('.app-icon-file').forEach(input=>{
    input.addEventListener('change', async ()=>{
      const file = input.files[0];
      input.value = '';
      if(!file) return;
      if(!ghConfig()){ toast(tr('appIconNeedConnect')); return; }
      const slug = input.dataset.slug;
      try{
        toast(tr('appIconUploading'));
        const blob = await processAppIcon(file);
        await uploadAppIcon(slug, blob);
        input.closest('.app-tile').querySelector('.app-icon').innerHTML = `<img src="icons/apps/${slug}.png?v=${Date.now()}" alt="" width="56" height="56">`;
        toast(tr('appIconUploaded'));
      }catch(e){
        toast(tr('appIconFail').replace('{e}', (e && (e.detail || e.message)) || '?'));
      }
    });
  });
}
let appIconGhListenerAdded = false;
function renderApps(){
  const el = document.getElementById('appsGrid');
  if(!el) return;
  el.innerHTML = USEFUL_APPS.map(a=>`<div class="app-tile" data-slug="${a.slug}">
    <button type="button" class="app-link" data-search="${escHtml(a.search)}">
      <span class="app-icon"><img src="icons/apps/${a.slug}.png" alt="" width="56" height="56" loading="lazy"></span>
      <span class="app-info"><span class="app-name">${a.name}</span><span class="app-desc">${LANG==='ar'?a.desc_ar:a.desc}</span></span>
    </button>
    <button type="button" class="app-icon-upload" data-slug="${a.slug}" aria-label="${tr('appIconUpload')}" title="${tr('appIconUpload')}">📤</button>
    <input type="file" class="app-icon-file" data-slug="${a.slug}" accept="image/*" hidden>
  </div>`).join('');
  el.querySelectorAll('.app-link').forEach(btn=>{
    btn.addEventListener('click', ()=> openAppStoreLink(btn.dataset.search));
  });
  wireAppIconError(el);
  wireAppIconUploads(el);
  if(!appIconGhListenerAdded){
    appIconGhListenerAdded = true;
    window.addEventListener('ctgr-gh-changed', ()=>{
      document.querySelectorAll('.app-icon-upload').forEach(btn=>{ btn.style.display = canEdit() ? 'flex' : 'none'; });
    });
  }
}
function renderTransport(){
  const el = document.getElementById('transportSection');
  if(!el) return;
  const rentalCards = CAR_RENTALS.map(c=>{
    const name = LANG==='ar'?c.n_ar:c.n;
    return `<div class="tt-rental-card">${c.recommended?`<span class="rec-badge">★ ${LANG==='ar'?'موصى به':'Recommended'}</span>`:''}<b>${name}</b><br><span class="rating-pill">★ ${c.rating.toFixed(1)} <i>(${c.ratingCount.toLocaleString()})</i></span><br><div style="display:flex;gap:6px;margin-top:8px;flex-wrap:wrap;"><a class="mini-link verified" href="${c.site}" target="_blank">🌐 ${LANG==='ar'?'الموقع الرسمي':'Official site'}</a><a class="mini-link" href="${c.g}" target="_blank">🔎 ${LANG==='ar'?'بحث':'Search'}</a></div></div>`;
  }).join('');
  el.innerHTML = `
    <div class="tt-block">
      <h3>🚗 ${tr('ttCarTitle')}</h3>
      <p>${tr('ttCarBody')}</p>
      <h3 style="margin-top:16px;font-size:14px;">📄 ${tr('ttDocsTitle')}</h3>
      <ul>${UI[LANG].ttDocs.map(d=>`<li>${d}</li>`).join('')}</ul>
      <h3 style="margin-top:16px;font-size:14px;">${tr('ttCarRentalTitle')}</h3>
      <div class="tt-rental-grid">${rentalCards}</div>
    </div>
    <div class="tt-block">
      <h3>🚑 ${tr('emgTitle')}</h3>
      <p>${tr('emgIntro')}</p>
      <div class="emg-nums">
        <div class="emg-num">${LANG==='ar'?'طوارئ عامة (أي جوال)':'General emergency (any phone)'}: <b>112</b></div>
        <div class="emg-num">${LANG==='ar'?'الشرطة':'Police'}: <b>10111</b></div>
        <div class="emg-num">${LANG==='ar'?'الإسعاف':'Ambulance'}: <b>10177</b></div>
      </div>
      <h3 style="margin-top:18px;font-size:14px;">🕌 ${tr('emgEmbassyTitle')}</h3>
      <div class="emg-nums">
        <div class="emg-num">${LANG==='ar'?'هاتف السفارة':'Embassy phone'}: <b>+27 12 072 0200</b></div>
        <div class="emg-num">${LANG==='ar'?'هاتف الطوارئ':'Emergency phone'}: <b>+27 71 000 0017</b></div>
        <div class="emg-num">${LANG==='ar'?'البريد الإلكتروني':'Email'}: <b>ZAEMB@MOFA.GOV.SA</b></div>
      </div>
      <h3 style="margin-top:18px;font-size:14px;">${LANG==='ar'?'أقرب مستشفى حسب المنطقة':'Nearest hospital by area'}</h3>
      <div class="emg-grid">
        ${HOSPITALS.map(h=>`<div class="emg-card"><b>${LANG==='ar'?h.area_ar:h.area}</b><div class="emg-line">🏥 <a href="${h.g}" target="_blank" style="color:inherit;">${h.n}</a> — <span class="rating-pill">★ ${h.rating.toFixed(1)} <i>(${h.ratingCount.toLocaleString()})</i></span></div><div class="emg-line" style="margin-top:4px;">💊 ${LANG==='ar'?h.pharmacy_ar:h.pharmacy}</div></div>`).join('')}
      </div>
      <p style="margin-top:12px;font-size:12px;color:#8a7f70;">${tr('emgCaption')}</p>
    </div>
  `;
}

