/* ---------- ABOUT SOUTH AFRICA (tab #1, "about") ----------
   General background info — not Cape Town–specific — shown before the trip plan itself: the
   country, entry rules, embassy contacts, and practical travel basics. One render function builds
   the whole tab from the data below, same pattern as renderCarRentalSection()/renderEmergencySection()
   in data-apps.js (plain LANG ternaries per line rather than the central UI[] dictionary, since this
   is page content, not UI chrome). Re-run on every language switch via setLang()'s render list.

   Embassy contact details were cross-checked against gov.za's foreign-representatives directory and
   the embassy's own za.saudiembassy.sa site (Oct 2026) rather than taken as given — see emgCaption-style
   disclaimer at the end of that block. The phone number that had been circulating (used in a social-media
   flyer, and already baked into this site's own Emergency Info tab from an earlier round) didn't match
   either official source, so it's corrected here and in renderEmergencySection(). */

// photo: real CC-licensed aircraft photos from Wikimedia Commons (verified by rendering each one
// before trusting the filename — an earlier attempt at a plug-socket diagram turned out, once
// actually rendered, to be an unrelated world map under a misleading filename). Source + licence:
//  - Qatar Airways: "Qatar Airways Airbus A350-1000.jpg" (CC BY-SA 4.0)
//  - Emirates: "Emirates A350-900 Bologna Airport - 2025.jpg" (CC BY-SA 4.0)
//  - Turkish Airlines: "Turkish Airlines TC-LLF 787-9.jpg" (CC BY 2.0)
//  - Ethiopian Airlines: "ET-AMF Boeing 767-300ER of Ethiopian Airlines.jpg" by Ayan Zaman (CC BY-SA 4.0)
const SA_AIRLINES_INTL = [
  {slug:"qatar", photo:"airline-qatar.jpg", name:"Qatar Airways", name_ar:"الخطوط القطرية", hub:"via Doha (DOH)", hub_ar:"عبر الدوحة", color:"#8a1538"},
  {slug:"emirates", photo:"airline-emirates.jpg", name:"Emirates", name_ar:"طيران الإمارات", hub:"via Dubai (DXB)", hub_ar:"عبر دبي", color:"#c8102e"},
  {slug:"turkish", photo:"airline-turkish.jpg", name:"Turkish Airlines", name_ar:"الخطوط التركية", hub:"via Istanbul (IST)", hub_ar:"عبر إسطنبول", color:"#a3222c"},
  {slug:"ethiopian", photo:"airline-ethiopian.jpg", name:"Ethiopian Airlines", name_ar:"الخطوط الإثيوبية", hub:"via Addis Ababa (ADD)", hub_ar:"عبر أديس أبابا", color:"#2e7d32"},
];
// FlySafair/Airlink/SAA: real CC-licensed Commons aircraft photos (same sourcing note as above:
//  - FlySafair: "FlySafair B737-844 ZS-SJR (23478799879).jpg" (CC BY-SA 2.0)
//  - Airlink: "ZS-SJW Embraer Emb.135 South African Airlink (7684869048).jpg" (CC BY-SA 3.0)
//  - SAA: "Boeing 737-844, South African Airways AN0986179.jpg" (GFDL/CC BY-SA)
// LIFT/CemAir/Federal Air: no correctly-matching free photo could be confirmed, so these three use
// a plain generated colour tile (tools/make-about-wide-tiles.js) instead — not a real photo.
const SA_DOMESTIC_AIRLINES = [
  {slug:"flysafair", photo:"airline-flysafair.jpg", name:"FlySafair", desc:"Competitive fares, frequent scheduled domestic routes to multiple destinations.", desc_ar:"أسعار تنافسية، رحلات داخلية منتظمة إلى وجهات متعددة."},
  {slug:"airlink", photo:"airline-airlink.jpg", name:"Airlink", desc:"Excellent service, regular flights, with international connections.", desc_ar:"خدمة ممتازة، رحلات منتظمة، مع ارتباطات دولية."},
  {slug:"saa", photo:"airline-saa.jpg", name:"South African Airways (SAA)", desc:"The national carrier — wide network, full service.", desc_ar:"الناقل الوطني — شبكة واسعة، خدمة كاملة."},
  {slug:"lift", photo:"airline-lift.jpg", generated:true, name:"LIFT", desc:"Good fares, comfortable and flexible service.", desc_ar:"أسعار جيدة، خدمة مريحة ومرنة."},
  {slug:"cemair", photo:"airline-cemair.jpg", generated:true, name:"CemAir", desc:"Accurate schedules, modern fleet, solid experience.", desc_ar:"مواعيد دقيقة، أسطول حديث، تجربة جيدة."},
  {slug:null, photo:"airline-federalair.jpg", generated:true, name:"Federal Air", desc:"Charter shuttle flights straight from Johannesburg (OR Tambo) or Mbombela into private safari-reserve airstrips — relevant if you ever add a Kruger-area lodge, not the Garden Route lodges already in this trip.", desc_ar:"رحلات تاكسي جوي مستأجرة مباشرة من جوهانسبرغ (أورتامبو) أو مبومبيلا إلى مهابط محميات السفاري الخاصة — مفيدة فقط إن أُضيف نُزل في منطقة كروغر، وليس نُزل طريق الحدائق المدرجة في هذه الرحلة."},
];
// MTN and Telkom use their real logos (both "File:MTN Logo.svg" and "File:TelkomSA.svg" on
// Wikimedia Commons are PD-textlogo — simple enough not to meet the threshold of originality for
// copyright, same basis Wikipedia itself uses them on). Vodacom stays a generated tile: the only
// freely-licensed version on Commons is their pre-2017 logo (with the globe), and the current one
// is only hosted as Wikipedia's own non-free/fair-use media, not reusable here.
const SA_TELECOMS = [
  {slug:"mtn", name:"MTN", desc:"Wide coverage across most of South Africa, with varied data/call bundles.", desc_ar:"تغطية واسعة في معظم أنحاء جنوب أفريقيا، مع باقات متنوعة للإنترنت والمكالمات."},
  {slug:"vodacom", name:"Vodacom", desc:"The strongest and fastest network, with flexible deals.", desc_ar:"أقوى وأسرع شبكة، مع عروض مرنة."},
  {slug:"telkom", name:"Telkom", desc:"Excellent coverage in cities and rural areas, with affordable economical plans.", desc_ar:"تغطية ممتازة في المدن والمناطق الريفية، مع باقات اقتصادية بأسعار مناسبة."},
];
const SA_STAYS = [
  {slug:"airbnb", name:"Airbnb", desc:"Varied apartments and houses suited to couples and families, real privacy and comfort, authentic local experiences, and locations near the main sights.", desc_ar:"خيارات متنوعة من الشقق والمنازل تناسب الأزواج والعائلات، خصوصية وراحة حقيقية، تجارب محلية أصيلة، ومواقع قريبة من أهم المعالم."},
  {slug:"booking", name:"Booking.com", desc:"Hotels and serviced apartments for every budget, competitive prices with exclusive deals, real guest reviews to help you choose, and free cancellation on most bookings.", desc_ar:"فنادق وشقق مخدومة بخيارات تناسب كل ميزانية، أسعار تنافسية وعروض حصرية، تقييمات حقيقية من النزلاء تساعد على الاختيار، وإلغاء مجاني في أغلب الحجوزات."},
];
// Photos are real CC-licensed photographs from Wikimedia Commons (not the reference flyer's
// AI-generated, watermarked graphics) — downloaded, resized and committed to images/about/ rather
// than hotlinked, so the page doesn't depend on Commons being up. Source file + licence per photo:
//  - Cape Town: "Cape Town Table Mountain.jpg" (CC BY-SA 4.0)
//  - Stellenbosch: "Stellenbosch vineyards.jpg" (CC BY 2.0)
//  - Hermanus: "New Harbour Hermanus (South Africa).jpg" (CC BY-SA 4.0)
//  - Wilderness: "Wilderness WC.jpg" (CC BY-SA, general Commons licence)
//  - Knysna: "Knysna Waterfront.jpg" (CC BY-SA, general Commons licence)
const SA_TOP_CITIES = [
  {photo:"city-capetown.jpg", name:"Cape Town", desc:"A vibrant city blending nature, beaches and world-famous landmarks.", desc_ar:"مدينة نابضة بالحياة تجمع بين الطبيعة الخلابة والشواطئ الساحرة والمعالم السياحية العالمية."},
  {photo:"city-stellenbosch.jpg", name:"Stellenbosch", desc:"South Africa's wine capital — lush vineyards, historic old farms, refined restaurants.", desc_ar:"عاصمة النبيذ في جنوب أفريقيا، تشتهر بالكروم الخضراء والمزارع القديمة والمطاعم الراقية."},
  {photo:"city-hermanus.jpg", name:"Hermanus", desc:"The place for close-up whale watching, with calm bays and beautiful views.", desc_ar:"وجهة مثالية لمشاهدة الحيتان عن قرب، إلى جانب أجوائها الهادئة وإطلالاتها الجميلة على المحيط."},
  {photo:"city-wilderness.jpg", name:"Wilderness", desc:"A quiet coastal village known for long beaches, untouched nature and outdoor activities.", desc_ar:"قرية ساحلية هادئة تتميز بشواطئها الطويلة وطبيعتها البكر والأنشطة الخارجية الممتعة."},
  {photo:"city-knysna.jpg", name:"Knysna", desc:"A coastal town on the Knysna lagoon, known for wild scenery, forests and waterfront restaurants.", desc_ar:"مدينة ساحلية تقع على بحيرة نايزنا، تشتهر بطبيعتها الخلابة والغابات والمطاعم المطلة على الواجهة البحرية."},
];
const SA_BEST_AREAS_CT = [
  {name:"Sea Point", desc:"Beautiful sea views, close to restaurants/cafés and the beachfront promenade.", desc_ar:"إطلالة بحرية رائعة، قريبة من المطاعم والمقاهي والشاطئ."},
  {name:"Green Point", desc:"Central and convenient, close to the Waterfront and the lively city centre.", desc_ar:"موقع مركزي وهادئ، قريبة من الواتر فرونت والوسط الحيوي."},
  {name:"V&A Waterfront", desc:"Luxury, close to restaurants, shopping and the main landmarks.", desc_ar:"فخامة ورفاهية، قريبة من المطاعم والتسوق والمعالم."},
  {name:"Camps Bay", desc:"Upscale atmosphere, beautiful beach, fancy restaurants and stunning sunset views.", desc_ar:"أجواء راقية وشاطئ جميل، مطاعم فاخرة وإطلالات ساحرة على الغروب."},
  {name:"Bloubergstrand", desc:"A wide beach with the iconic Table Mountain view, a kitesurfing hub, calm atmosphere.", desc_ar:"شاطئ واسع وإطلالات خلابة على جبل الطاولة، أجواء هادئة."},
  {name:"CBD (City Bowl)", desc:"Close to businesses, services and transport — ideal for business travellers.", desc_ar:"قريبة من الشركات والخدمات والمواصلات، مثالية لرجال الأعمال."},
];
// photo: a plain "no image yet" placeholder (tools/make-about-placeholders.js) for every entry —
// unlike the sections above, there was no real photo to start from here at all. Each one is its
// own uploadable slot (see wireAboutImgUploads() below), same 640×420 box as every other photo-card.
const SA_DISTANCES = [
  {slug:"stellenbosch", photo:"distance-stellenbosch.jpg", name:"Stellenbosch", name_ar:"ستيلينبوش", km:51, time:"~45 min", time_ar:"~٤٥ دقيقة"},
  {slug:"hermanus", photo:"distance-hermanus.jpg", name:"Hermanus", name_ar:"هيرمانوس", km:123, time:"~1h 45m", time_ar:"~١ س ٤٥ د"},
  {slug:"mossel-bay", photo:"distance-mossel-bay.jpg", name:"Mossel Bay", name_ar:"موسل باي", km:388, time:"~4h 15m", time_ar:"~٤ س ١٥ د"},
  {slug:"george", photo:"distance-george.jpg", name:"George", name_ar:"جورج", km:435, time:"~4h 45m", time_ar:"~٤ س ٤٥ د"},
  {slug:"wilderness", photo:"distance-wilderness.jpg", name:"Wilderness", name_ar:"وايلدرنس", km:441, time:"~4h 50m", time_ar:"~٤ س ٥٠ د"},
  {slug:"knysna", photo:"distance-knysna.jpg", name:"Knysna", name_ar:"نايزنا", km:488, time:"~5h 30m", time_ar:"~٥ س ٣٠ د"},
];

/* ---------- OWNER IMAGE UPLOADS ----------
   Generalizes the Useful Apps icon-upload pattern (js/data-apps.js: processAppIcon/uploadAppIcon/
   wireAppIconUploads) across every image slot on this page, instead of duplicating that logic per
   section. Click the small 📤 on an image (GitHub-connected devices only — canEdit()) to replace
   it: picked file is center-cropped client-side to that slot's exact box, then uploaded straight
   to this repo at the given path, same as photos/notes/checklist. Box sizes, so replacement images
   can be designed to fit with zero cropping:
     - "icon" slots (Telecom, Stays) — 256×256, same as Useful Apps icons (shown at 72×72 here).
     - "wide" slots (Airlines, Power sockets, Distances, Domestic flights) — 640×420. */
function processImageToBox(file, W, H){
  return new Promise((resolve, reject)=>{
    const src = URL.createObjectURL(file);
    const img = new Image();
    img.onload = ()=>{
      // Math.min (fit the whole image inside the box, letterbox any leftover space) — not
      // Math.max (fill the box, crop whatever doesn't fit). An earlier version of this used
      // Math.max, which is exactly the "planes with their nose/tail cut off" bug the static
      // Wikimedia aircraft photos had before being fixed — except here it silently did the same
      // thing to every image anyone uploads through this page. Pads with the site's own card
      // background colour instead of leaving transparent corners, so a non-matching aspect ratio
      // still looks intentional rather than broken.
      const scale = Math.min(W / img.naturalWidth, H / img.naturalHeight);
      const dw = img.naturalWidth * scale, dh = img.naturalHeight * scale;
      const dx = (W - dw) / 2, dy = (H - dh) / 2;
      const c = document.createElement('canvas'); c.width = W; c.height = H;
      const ctx = c.getContext('2d');
      ctx.fillStyle = '#f1ead9'; // --paper-2
      ctx.fillRect(0, 0, W, H);
      ctx.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight, dx, dy, dw, dh);
      URL.revokeObjectURL(src);
      c.toBlob(b=> b ? resolve(b) : reject(new Error('encode failed')), 'image/jpeg', 0.86);
    };
    img.onerror = ()=>{ URL.revokeObjectURL(src); reject(new Error('decode failed')); };
    img.src = src;
  });
}
async function uploadAboutImage(path, blob){
  const cfg = ghConfig();
  if(!cfg) throw new Error('not connected');
  const branch = (await ghJson(cfg, '')).default_branch || 'main';
  let sha;
  const r = await ghFetch(cfg, `/contents/${path}?ref=${encodeURIComponent(branch)}`, {headers:{'Accept':'application/vnd.github+json'}});
  if(r.ok){ sha = (await r.json()).sha; }
  else if(r.status !== 404){ throw Object.assign(new Error('GitHub ' + r.status), {status: r.status}); }
  const content = await blobToB64(blob);
  await ghJson(cfg, `/contents/${path}`, {method:'PUT', body:{message:'Update About SA image: ' + path, content, sha, branch}});
}
function uploadSlot(path, w, h){
  return `<button type="button" class="about-img-upload" data-path="${path}" data-w="${w}" data-h="${h}" aria-label="${tr('imgUpload')}" title="${tr('imgUpload')}">📤</button><input type="file" class="about-img-file" data-path="${path}" data-w="${w}" data-h="${h}" accept="image/*" hidden>`;
}
let aboutImgGhListenerAdded = false;
function wireAboutImgUploads(el){
  el.querySelectorAll('.about-img-upload').forEach(btn=>{
    btn.style.display = canEdit() ? 'flex' : 'none';
    btn.addEventListener('click', (e)=>{
      e.preventDefault(); e.stopPropagation();
      el.querySelector(`.about-img-file[data-path="${btn.dataset.path}"]`).click();
    });
  });
  el.querySelectorAll('.about-img-file').forEach(input=>{
    input.addEventListener('change', async ()=>{
      const file = input.files[0];
      input.value = '';
      if(!file) return;
      if(!ghConfig()){ toast(tr('appIconNeedConnect')); return; }
      const path = input.dataset.path, W = +input.dataset.w, H = +input.dataset.h;
      const imgEl = input.closest('[data-img-slot]').querySelector('img');
      try{
        toast(tr('imgUploading'));
        const blob = await processImageToBox(file, W, H);
        await uploadAboutImage(path, blob);
        if(imgEl) imgEl.src = path + '?v=' + Date.now();
        toast(tr('imgUploaded'));
      }catch(e){
        toast(tr('imgFail').replace('{e}', (e && (e.detail || e.message)) || '?'));
      }
    });
  });
  if(!aboutImgGhListenerAdded){
    aboutImgGhListenerAdded = true;
    window.addEventListener('ctgr-gh-changed', ()=>{
      document.querySelectorAll('.about-img-upload').forEach(btn=>{ btn.style.display = canEdit() ? 'flex' : 'none'; });
    });
  }
}

function renderAboutSA(){
  const el = document.getElementById('aboutSaContent');
  if(!el) return;
  const ar = LANG === 'ar';

  const historyEN = "The Dutch East India Company founded a resupply station at the Cape in 1652, on land taken from the indigenous Khoikhoi and San peoples and built up largely by enslaved people brought from East Africa, Madagascar and the Dutch East Indies — slavery at the Cape wasn't abolished until 1834. Britain took control early in the 1800s, and in 1948 the National Party formalised a system of racial segregation known as apartheid, which the African National Congress and leaders like Nelson Mandela spent decades resisting. Mandela was imprisoned for 27 years — most of them on Robben Island, visible from the Cape Town waterfront — before his release in 1990. He became the country's first Black, democratically elected president in 1994, ending apartheid and starting the reconciliation process that shaped modern South Africa.";
  const historyAR = "أسّست شركة الهند الشرقية الهولندية محطة إعاشة عند رأس الرجاء الصالح عام ١٦٥٢، على أرض انتُزعت من شعبي الخويخوي والسان الأصليين، وبُنيت إلى حد كبير بأيدي عبيد جُلبوا من شرق أفريقيا ومدغشقر وجزر الهند الشرقية الهولندية — ولم يُلغَ الرق في الكيب إلا عام ١٨٣٤. سيطرت بريطانيا على المنطقة في مطلع القرن التاسع عشر، وفي عام ١٩٤٨ أسّس حزب الوطنيين نظامًا رسميًا للفصل العنصري عُرف بـ«الأبارتهايد»، وقاومه المؤتمر الوطني الأفريقي وقادة مثل نيلسون مانديلا لعقود. سُجن مانديلا ٢٧ عامًا، قضى معظمها في جزيرة روبن — التي تُرى من واجهة كيب تاون البحرية — قبل الإفراج عنه عام ١٩٩٠. وأصبح أول رئيس أسود يُنتخب ديمقراطيًا للبلاد عام ١٩٩٤، لينهي الأبارتهايد ويبدأ مسار المصالحة الذي شكّل جنوب أفريقيا الحديثة.";

  const mapsLink = (q) => "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(q);
  // Generated brand-colour monogram badges (tools/make-about-icons.js) — not real logos, see the
  // file header comment for why. badgeCard() builds one .emg-card with the badge + text; falls
  // back to a plain .emg-card (no badge) when an entry has no slug (e.g. Federal Air). Pass
  // `uploadable:true` to add the 📤 owner-upload slot (256×256 box) over the badge, and `large:true`
  // for the bigger 72×72 badge variant (Telecom and Stays both use it — see each section below).
  const badgeCard = (slug, name, line, extraStyle, uploadable, large) => slug
    ? `<div class="emg-card emg-card-ib${large?' emg-card-ib-lg':''}"${extraStyle?` style="${extraStyle}"`:''}${uploadable?` data-img-slot`:''}><img class="emg-badge" src="icons/about/${slug}.png" alt="${name}" width="${large?72:40}" height="${large?72:40}" loading="lazy">${uploadable?uploadSlot(`icons/about/${slug}.png`,256,256):''}<div><b>${name}</b><div class="emg-line">${line}</div></div></div>`
    : `<div class="emg-card"${extraStyle?` style="${extraStyle}"`:''}><b>${name}</b><div class="emg-line">${line}</div></div>`;
  // photoCard(): the landscape-photo variant (real photo on top, text below) used for top cities
  // and, where a real photo was found, airlines — see each data array's own sourcing comment. Pass
  // `uploadable:true` to add the 📤 owner-upload slot (640×420 box) over the photo.
  const photoCard = (photo, name, line, uploadable) => `<div class="photo-card"${uploadable?` data-img-slot`:''}><img src="images/about/${photo}" alt="${name}" width="640" height="420" loading="lazy">${uploadable?uploadSlot(`images/about/${photo}`,640,420):''}<div class="photo-card-body"><b>${name}</b><div class="emg-line">${line}</div></div></div>`;

  let html = '';

  // 1. South Africa at a glance
  html += `<div class="about-block">
    <h3><img class="sa-flag-img" src="images/about/flag-za.svg" alt="${ar?'علم جنوب أفريقيا':'Flag of South Africa'}" width="32" height="21" loading="lazy"> ${ar?'جنوب أفريقيا باختصار':'South Africa at a glance'}</h3>
    <div class="sa-fact-row">
      <div class="sa-fact"><b>≈ 63 ${ar?'مليون':'million'}</b>${ar?'عدد السكان (تقدير ٢٠٢٤)':'Population (2024 estimate)'}</div>
      <div class="sa-fact"><b>${ar?'3 عواصم':'3 capitals'}</b>${ar?'بريتوريا (إدارية)، كيب تاون (تشريعية)، بلومفونتين (قضائية)':'Pretoria (administrative), Cape Town (legislative), Bloemfontein (judicial)'}</div>
    </div>
    <p class="about">${ar?historyAR:historyEN}</p>
  </div>`;

  // 2. Passport & visa
  // The regular-passport image is a real Saudi passport cover (PD-Saudi Arabia-exempt / CC BY 4.0,
  // Wikimedia Commons). No free image of the diplomatic passport specifically could be confirmed,
  // so that one uses a plain generated tile (tools/make-about-wide-tiles.js) instead of a real photo.
  html += `<div class="about-block">
    <h3>🛂 ${ar?'جواز السفر والتأشيرة':'Passport & visa'}</h3>
    <div class="passport-grid">
      <div class="passport-card ok"><img class="passport-img" src="images/about/passport-regular.svg" alt="${ar?'الجواز العادي':'Regular passport'}" width="80" height="113" loading="lazy"><div><b>${ar?'الجواز العادي':'Regular passport'}</b><span>${ar?'لا يحتاج تأشيرة — إقامة بحد أقصى 90 يومًا.':'No visa needed — max stay of 90 days.'}</span></div></div>
      <div class="passport-card no"><img class="passport-img" src="images/about/passport-diplomatic.png" alt="${ar?'الجواز الدبلوماسي':'Diplomatic passport'}" width="80" height="113" loading="lazy"><div><b>${ar?'الجواز الدبلوماسي':'Diplomatic passport'}</b><span>${ar?'يحتاج تأشيرة قبل السفر.':'Requires a visa before travel.'}</span></div></div>
    </div>
    <p class="about" style="margin-top:8px;">${ar?'تأكدا من صلاحية الجواز 6 أشهر على الأقل، واحتفظا بنسخة من ختم الدخول/بطاقة الصعود.':"Keep the passport valid for 6+ months, and keep a copy of your entry stamp/boarding pass."}</p>
  </div>`;

  // 3. Saudi Embassy
  const embAddr = "711 Jan Shoba Street, Hatfield, Pretoria, 0028, South Africa";
  html += `<div class="about-block">
    <h3>🕌 ${ar?'السفارة السعودية في جنوب أفريقيا':'Saudi Embassy in South Africa'}</h3>
    <div class="emg-nums">
      <div class="emg-num">${ar?'المدينة':'City'}: <b>${ar?'بريتوريا':'Pretoria'}</b></div>
      <div class="emg-num">${ar?'هاتف السفارة':'Embassy phone'}: <b>+27 12 362 4230</b></div>
      <div class="emg-num">${ar?'البريد الإلكتروني':'Email'}: <b>zaemb@mofa.gov.sa</b></div>
      <div class="emg-num">X/Twitter: <b>@KSAembassyZA</b></div>
    </div>
    <div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap;">
      <a class="mini-link primary" href="${mapsLink(embAddr)}" target="_blank">📍 ${ar?'فتح في خرائط قوقل':'Open in Google Maps'}</a>
      <a class="mini-link verified" href="https://za.saudiembassy.sa/" target="_blank">🌐 ${ar?'الموقع الرسمي':'Official site'}</a>
    </div>
    <p style="margin-top:10px;font-size:12px;color:#8a7f70;">${ar?'العنوان: 711 شارع جان شوبا، هاتفيلد، بريتوريا، 2028. تحققا من أرقام التواصل عبر الموقع الرسمي قبل السفر — بيانات الاتصال قد تتغير.':'Address: 711 Jan Shoba Street, Hatfield, Pretoria, 0028. Double-check contact details on the official site before you travel — they can change.'}</p>
  </div>`;

  // 4. Niqab
  html += `<div class="about-block">
    <h3>🧕 ${ar?'النقاب في جنوب أفريقيا':'The niqab in South Africa'}</h3>
    <p class="about">${ar?'مسموح به بالكامل قانونيًا، ولا توجد أي قيود أو قوانين حكومية تمنع ارتداءه. يتميز المجتمع هناك بتنوعه الثقافي والديني، ويتقبل الناس ارتداء الحجاب والنقاب دون أي مضايقات أو استنكار.':'Fully legal, with no government restrictions or bans on wearing it. South African society is culturally and religiously diverse, and wearing the hijab or niqab is accepted without hassle or stares.'}</p>
  </div>`;

  // 5. International airlines — real aircraft photos (see SA_AIRLINES_INTL's sourcing comment)
  html += `<div class="about-block">
    <h3>✈️ ${ar?'خطوط الطيران التي تصل إلى كيب تاون':'Airlines flying to Cape Town'}</h3>
    <div class="photo-grid">
      ${SA_AIRLINES_INTL.map(a=>photoCard(a.photo, ar?a.name_ar:a.name, ar?a.hub_ar:a.hub, true)).join('')}
    </div>
  </div>`;

  // 6. Power sockets — real photo "M plug.jpg" (public domain, Wikimedia Commons; author released it
  // PD worldwide). An earlier attempt here used a file wrongly labelled as a Type M diagram that
  // turned out, once actually rendered, to be an unrelated world map — this one was verified first.
  html += `<div class="about-block">
    <h3>🔌 ${ar?'المقابس والجهد الكهربائي':'Power sockets & voltage'}</h3>
    <div class="socket-row">
      <div class="socket-photo-wrap" data-img-slot>
        <img class="socket-photo" src="images/about/socket-za.jpg" alt="${ar?'قابس ومقبس من نوع M':'Type M plug and socket'}" width="640" height="420" loading="lazy">
        ${uploadSlot('images/about/socket-za.jpg',640,420)}
      </div>
      <div class="socket-info">
        <div class="sa-fact-row">
          <div class="sa-fact"><b>Type M</b>${ar?'المقبس الأكثر شيوعًا — ٣ سنون دائرية كبيرة (بعض الفنادق الأحدث تستخدم Type N الأنحف)':'The most common socket — 3 large round pins (some newer hotels use the slimmer Type N instead)'}</div>
          <div class="sa-fact"><b>220–240V</b>${ar?'الجهد الكهربائي':'Voltage'}</div>
          <div class="sa-fact"><b>50Hz</b>${ar?'التردد':'Frequency'}</div>
        </div>
        <p class="about" style="margin-top:8px;">${ar?'محول سفر عالمي واحد يغطي كل هذا. أماكن شراء المحولات والأفياش: Clicks، Dis-Chem، Makro، Builders.':'A universal travel adapter covers this. Buy one at: Clicks, Dis-Chem, Makro, Builders.'}</p>
      </div>
    </div>
  </div>`;

  // 7. Seasons
  const seasons = [
    {name:ar?'الصيف':'Summer', months:ar?'ديسمبر · يناير · فبراير':'Dec · Jan · Feb', desc:ar?'طقس دافئ إلى حار وأيام مشمسة':'Warm to hot, sunny days', icon:'☀️'},
    {name:ar?'الخريف':'Autumn', months:ar?'مارس · أبريل · مايو':'Mar · Apr · May', desc:ar?'طقس معتدل ومريح وألوان طبيعية خلابة':'Mild and comfortable, lovely autumn colours', icon:'🍂'},
    {name:ar?'الشتاء':'Winter', months:ar?'يونيو · يوليو · أغسطس':'Jun · Jul · Aug', desc:ar?'بارد وممطر — مثالي للهروب من حر الخليج':'Cold and rainy — good for escaping Gulf heat', icon:'❄️'},
    {name:ar?'الربيع':'Spring', months:ar?'سبتمبر · أكتوبر · نوفمبر':'Sep · Oct · Nov', desc:ar?'معتدل ومشمس، وأزهار برية (موسم هذه الرحلة)':'Mild and sunny, wildflowers (this trip\'s season)', icon:'🌸'},
  ];
  html += `<div class="about-block">
    <h3>🌦️ ${ar?'الطقس والفصول في جنوب أفريقيا':'Weather & seasons in South Africa'}</h3>
    <div class="emg-grid">
      ${seasons.map(s=>`<div class="emg-card"><b>${s.icon} ${s.name}</b><div class="emg-line">${s.months}</div><div class="emg-line">${s.desc}</div></div>`).join('')}
    </div>
    <p class="about" style="margin-top:10px;">${ar?'أفضل الفصول لمسافري الخليج: <b>الربيع والخريف</b> لاعتدال الطقس وجمال الطبيعة، و<b>الشتاء</b> خيار جيد لمن يبحث عن الهروب من حرارة الخليج العالية رغم الأمطار.':"Best seasons for Gulf travellers: <b>Spring and Autumn</b> for mild weather and scenery, and <b>Winter</b> is a solid option if you're mainly after an escape from Gulf summer heat, rain aside."}</p>
  </div>`;

  // 8. Telecoms — bigger logos than the other icon-badge sections (Stays), fixed at 3 per row
  // (there are exactly 3 telecoms, so .telecom-grid locks the column count instead of the usual
  // auto-fit, which could otherwise drop to 2 once the badges got wider).
  html += `<div class="about-block">
    <h3>📶 ${ar?'شركات الاتصالات':'Telecom companies'}</h3>
    <div class="telecom-grid">
      ${SA_TELECOMS.map(t=>badgeCard(t.slug, t.name, ar?t.desc_ar:t.desc, null, true, true)).join('')}
    </div>
  </div>`;

  // 9. Stays booking — same bigger 72×72 badge as Telecom. Only 2 entries, so the plain .emg-grid
  // (auto-fit) already lays them out evenly side by side without needing a locked column count.
  html += `<div class="about-block">
    <h3>🏨 ${ar?'حجز السكن':'Booking your stay'}</h3>
    <div class="emg-grid">
      ${SA_STAYS.map(s=>badgeCard(s.slug, s.name, ar?s.desc_ar:s.desc, null, true, true)).join('')}
    </div>
  </div>`;

  // 10. Safety tips
  const dos = ar
    ? ["احمل جواز سفرك وتأكد من صلاحيته لأكثر من 6 أشهر","احصل على تأمين سفر شامل لتغطية أي طارئ صحي أو فقدان أمتعة","استخدم البطاقات البنكية الموثوقة في الأماكن، واحفظ بعض النقد (راند أفريقي)","اشترِ شريحة اتصال محلية (MTN أو Vodacom) للبقاء متصلاً","خطط لرحلاتك واحجز الإقامة مسبقًا والأنشطة في المواسم","استخدم تطبيقات النقل الموثوقة مثل Bolt وUber وتأكد من تفاصيل الرحلة","احفظ مقتنياتك الثمينة في الخزنة أو منتهيا في الأماكن العامة","استمتع بالطبيعة البرية واحترم واتبع تعليمات المرشدين","تعلم بعض العبارات الأساسية باللغة الإنجليزية فهي اللغة الأكثر استخدامًا"]
    : ["Carry your passport and keep it valid 6+ months","Get comprehensive travel insurance for any health emergency or lost luggage","Use trusted bank cards in shops, and keep some cash (South African Rand) on hand","Get a local SIM (MTN or Vodacom) to stay connected","Plan your route and book accommodation/activities ahead, especially in peak season","Use trusted ride-hailing apps like Bolt and Uber, and confirm ride details","Keep valuables in the safe or hotel locker, not out in public","Enjoy the wildlife and nature, and follow your guides' instructions","Learn a few basic English phrases — it's the most widely used language"];
  const donts = ar
    ? ["تجنب التجول في المناطق المعزولة أو غير المأهولة خاصة في الليل","تجنب القيادة ليلاً قدر الإمكان، واحرص على قفل الأبواب والنوافذ دائمًا","تجنب إظهار المقتنيات الثمينة والهواتف والأجهزة باهظة الثمن في الأماكن العامة","تجنب حمل مبالغ نقدية كبيرة، واحرص على تقسيم أموالك","تجنب التجمعات أو المظاهرات السياسية، وابتعد عن أي منطقة غير آمنة","تجنب استخدام سيارات الأجرة العشوائية في الشارع، واستخدم التطبيقات الموثوقة","تجنب ارتداء المجوهرات اللافتة للانتباه","تجنب إطعام أو الاقتراب من الحيوانات البرية","تجنب ترك حقائبك أو أغراضك دون مراقبة في أي مكان"]
    : ["Avoid wandering into isolated or unfamiliar areas, especially at night","Avoid driving at night when you can, and always keep doors locked and windows up","Avoid flashing valuables, phones or expensive gear in public","Avoid carrying large amounts of cash — split your money up instead","Avoid political gatherings or protests, and steer clear of any area that feels unsafe","Avoid unlicensed street taxis — stick to trusted apps","Avoid wearing attention-drawing jewellery","Avoid feeding or approaching wild animals","Avoid leaving your bags or belongings unattended anywhere"];
  html += `<div class="about-block">
    <h3>🛡️ ${ar?'نصائح للسفر الآمن':'Tips for safe travel'}</h3>
    <div class="dos-donts-grid">
      <div class="dos-card"><h4>✅ ${ar?'ماذا يجب اتباعه':'Do'}</h4><ul>${dos.map(d=>`<li>${d}</li>`).join('')}</ul></div>
      <div class="donts-card"><h4>❌ ${ar?'ماذا يجب تجنبه':'Avoid'}</h4><ul>${donts.map(d=>`<li>${d}</li>`).join('')}</ul></div>
    </div>
  </div>`;

  // 11. Distances from Cape Town — photo-card layout (same 640×420 box as everywhere else), with
  // an uploadable placeholder per destination (see SA_DISTANCES' header comment).
  html += `<div class="about-block">
    <h3>🧭 ${ar?'المسافات من كيب تاون':'Distances from Cape Town'}</h3>
    <div class="photo-grid">
      ${SA_DISTANCES.map(d=>photoCard(d.photo, ar?d.name_ar:d.name, `${d.km} ${ar?'كم':'km'} · ${ar?d.time_ar:d.time}`, true)).join('')}
    </div>
    <p class="about" style="margin-top:10px;">${ar?'الطريق الرئيسي هو N2 — طريق ساحلي سريع ومُصان جيدًا يربط كيب تاون بكل طريق الحدائق، ورسوم الطرق عليه قليلة. تأكدا من تعبئة الوقود قبل المسافات الطويلة والقيادة الآمنة أولاً.':'The main road is the N2 — a well-maintained coastal highway linking Cape Town to the whole Garden Route, with minimal tolls. Fill up before long stretches, and safe driving comes first.'}</p>
  </div>`;

  // 12. Domestic flights — real photos for FlySafair/Airlink/SAA; LIFT/CemAir/Federal Air use a
  // generated tile instead (see SA_DOMESTIC_AIRLINES' sourcing comment — no free photo confirmed).
  html += `<div class="about-block">
    <h3>🛫 ${ar?'الرحلات الداخلية':'Domestic flights'}</h3>
    <div class="photo-grid">
      ${SA_DOMESTIC_AIRLINES.map(a=>photoCard(a.photo, a.name, ar?a.desc_ar:a.desc, true)).join('')}
    </div>
  </div>`;

  // 13. Top tourist cities — real photos (see SA_TOP_CITIES' header comment for sourcing/licensing)
  html += `<div class="about-block">
    <h3>🏙️ ${ar?'أهم المدن السياحية في جنوب أفريقيا':'Best tourist cities in South Africa'}</h3>
    <div class="photo-grid">
      ${SA_TOP_CITIES.map(c=>photoCard(c.photo, c.name, ar?c.desc_ar:c.desc)).join('')}
    </div>
  </div>`;

  // 14. Driving in South Africa
  html += `<div class="about-block">
    <h3>🚗 ${ar?'القيادة في جنوب أفريقيا':'Driving in South Africa'}</h3>
    <p class="about">${ar?'القيادة هناك معكوسة عن السعودية — المقود على الجانب الأيمن من السيارة، والسير على الجهة اليسرى من الطريق.':"Driving there is the reverse of KSA — the steering wheel is on the right side of the car, and you drive on the left side of the road."}</p>
    <div class="dos-donts-grid" style="margin-top:10px;">
      <div class="donts-card"><h4>⚠️ ${ar?'عند الإشارات والتوقف':'At traffic lights & stops'}</h4><ul>
        <li>${ar?'لا تتركا نوافذ السيارة مفتوحة':"Don't leave the car windows open"}</li>
        <li>${ar?'لا تتركا الأبواب مقفلة غير مؤمّنة':"Don't leave the doors unlocked"}</li>
        <li>${ar?'كونا متيقظين دائمًا':'Stay alert at all times'}</li>
      </ul></div>
      <div class="dos-card"><h4>✅ ${ar?'عند الوقوف':'When parking'}</h4><ul>
        <li>${ar?'اختارا أماكن وقوف آمنة ومراقَبة':'Choose safe, attended parking spots'}</li>
        <li>${ar?'لا تتركا أغراضكما ظاهرة داخل السيارة':"Don't leave belongings visible inside the car"}</li>
      </ul></div>
    </div>
  </div>`;

  // 15. Best areas to stay in Cape Town
  html += `<div class="about-block">
    <h3>📍 ${ar?'أفضل مناطق الإقامة في كيب تاون':'Best areas to stay in Cape Town'}</h3>
    <div class="emg-grid">
      ${SA_BEST_AREAS_CT.map(a=>`<div class="emg-card"><b>${a.name}</b><div class="emg-line">${ar?a.desc_ar:a.desc}</div></div>`).join('')}
    </div>
  </div>`;

  el.innerHTML = html;
  wireAboutImgUploads(el);
}
