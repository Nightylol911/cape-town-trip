function grItemCard(item, grIdx){
  const name = LANG==='ar' ? item.n_ar : item.n;
  const about = LANG==='ar' ? item.about_ar : item.about;
  const mynote = LANG==='ar' ? item.mynote_ar : item.mynote;
  const catColors = {activity:"#1f5f6b",restaurant:"#e2622e",coffee:"#8a4fae",shop:"#c9942f"};
  const color = catColors[item.c] || "#6f8c5f";
  const isPicked = grPicked.has(grIdx);
  return `<div class="gr-card ${isPicked?'picked':''}">
    ${slideshow('gr-'+grIdx)}
    <div class="gr-card-body">
    <div class="card-top"><h4>${name}</h4><button class="pick-btn" data-grpick="${grIdx}" title="pick">${isPicked?'♥':'○'}</button></div>
    <div class="pill-row">
      <span class="catpill" style="background:${color}22;color:${color};">${CATS[LANG][item.c]?.label || item.c}</span>
      ${item.rating ? `<span class="rating-pill">★ ${item.rating.toFixed(1)} <i>(${item.ratingCount.toLocaleString()})</i></span>` : ``}
      <span class="price-pill">${item.price ? money(item.price) : tr('freeLabel')}</span>
      ${item.weak ? `<span class="weak-pill" title="${tr('weakSignalTip')}">📶 ${tr('weakSignal')}</span>` : ``}
    </div>
    <p class="about">${about||''}</p>
    ${mynote ? `<div class="mynote">📝 ${mynote}</div>` : ``}
    ${unoteBlock('g:'+item.n)}
    <div class="gr-card-actions">
      <a class="mini-link primary" href="${item.g}" target="_blank">📍 ${tr('directions')}</a>
      ${(item.c==='restaurant'||item.c==='coffee') ? `<a class="mini-link" href="${item.menu||gsearch(item.n+' Garden Route menu')}" target="_blank">📋 ${tr('menuBtn')}</a>` : ``}
      ${item.book ? `<a class="mini-link" href="${item.link}" target="_blank">🎟 ${LANG==='ar'?'الحجز':'Book'}</a>` : ``}
      ${item.phone ? `<a class="mini-link" href="tel:${item.phone.replace(/\s/g,'')}">📞 ${item.phone}</a>` : ``}
    </div>
    </div>
  </div>`;
}
/* ================= SAFARI COMPARISON ================= */
const SAFARI = [
{
  n:"Garden Route Game Lodge", n_ar:"غاردن روت جيم لودج", g:"https://maps.app.goo.gl/6gRZNbo19hLBp6Ju5", site:"https://grgamelodge.co.za/",
  rating:4.6, ratingCount:1441,
  location:"Albertinia — on the Garden Route, ~4hrs (350km) from Cape Town via the N2", location_ar:"ألبرتينيا — على طريق الحدائق نفسه، ~٤ ساعات (٣٥٠كم) من كيب تاون عبر الطريق N2",
  big5:["Elephant","Lion","Buffalo"], big5no:["Leopard","Rhino"],
  price:"~SAR 620–970 pp/night (≈ R2,960–4,630 ZAR)", price_ar:"~٦٢٠-٩٧٠ ريال سعودي للشخص/الليلة (≈ ٢,٩٦٠-٤,٦٣٠ راند)",
  includes:"Half Board Plus — breakfast, dinner, 2 daily game drives, reptile centre tour", includes_ar:"إقامة نصف مقيم بلس — فطور، عشاء، جولتا سفاري يوميًا، جولة مركز الزواحف",
  about:"The most family-friendly and accessible of the five — right on the N2, easy to combine with the rest of your Garden Route drive. Reviews consistently praise the staff and game viewing, but also note it's closer to the road and more 'managed' than a wilderness reserve — a great intro safari, not the wildest one.", about_ar:"الأسهل وصولاً والأنسب للعائلات من بين الخمسة — على الطريق N2 مباشرة، يسهل دمجه مع بقية رحلة طريق الحدائق. المراجعات تمدح الطاقم ومشاهدة الحيوانات باستمرار، لكنها تذكر أيضًا أنه أقرب للطريق وأكثر 'إدارة' من محمية برية حقيقية — سفاري تمهيدي رائع، وليس الأكثر توحشًا.",
  mynote:"Wonderful.", mynote_ar:"رائعة.",
  steps:["Go to grgamelodge.co.za (official site)","Check seasonal rates — prices roughly double Oct–Jan vs May–Sep","Choose room type: Lodge Room, Chalet, or Luxury Suite","Enquire/book online or by phone for a tailor-made quote","Pay deposit to confirm — arrive by check-in (14:00) for the afternoon game drive"],
  steps_ar:["اذهبا إلى grgamelodge.co.za (الموقع الرسمي)","تحققا من الأسعار الموسمية — تتضاعف تقريبًا أكتوبر-يناير مقارنة بمايو-سبتمبر","اختارا نوع الغرفة: غرفة لودج، شاليه، أو جناح فاخر","استفسرا/احجزا إلكترونيًا أو هاتفيًا لعرض سعر مخصص","ادفعا العربون للتأكيد — صلا بحلول وقت تسجيل الدخول (٢ظ) لجولة سفاري بعد الظهر"],
},
{
  n:"Gondwana Game Reserve", n_ar:"غوندوانا جيم ريزيرف", g:"https://maps.app.goo.gl/X7nZuKNU51DKeHsR9", site:"https://gondwanagr.co.za/",
  rating:4.7, ratingCount:777,
  location:"Herbertsdale, near Mossel Bay — ~4.5hrs (400km) from Cape Town, partly on gravel access roads", location_ar:"هيربرتسديل، قرب موسيل باي — ~٤.٥ ساعة (٤٠٠كم) من كيب تاون، جزء من الطريق ترابي",
  big5:["Elephant","Lion","Leopard","Rhino","Buffalo"], big5no:[],
  price:"~SAR 1,575–6,300+ pp/night (≈ R7,500–30,000+ ZAR; varies hugely by suite & season)", price_ar:"~١,٥٧٥-٦,٣٠٠+ ريال سعودي للشخص/الليلة (≈ ٧,٥٠٠-٣٠,٠٠٠+ راند؛ يتفاوت كثيرًا حسب الجناح والموسم)",
  includes:"Full Board Plus — all meals, 2 daily game drives, Junior Ranger programme; conservation fee (~SAR 84–116pp, ≈ R400–550 ZAR) extra", includes_ar:"إقامة كاملة بلس — كل الوجبات، جولتا سفاري يوميًا، برنامج للأطفال؛ رسم حماية طبيعة إضافي (~٨٤-١١٦ ريال سعودي للشخص، ≈ ٤٠٠-٥٥٠ راند)",
  about:"The only fynbos (not bushveld) Big Five reserve in the world, with the southernmost free-roaming elephant herd — genuinely wild and spacious (11,000 hectares). The trade-off: it's the most remote of the five, partly on gravel roads, and pricier at the top end.", about_ar:"محمية الفينبوس (وليس السافانا) الوحيدة في العالم بالخمسة الكبار، بأقصى قطيع أفيال حرة الحركة جنوبًا — بريّة وواسعة فعلاً (١١,٠٠٠ هكتار). المقابل: الأبعد من بين الخمسة، جزء من الطريق ترابي، وأغلى في الفئة العليا.",
  mynote:"The road and the accommodation felt tiring.", mynote_ar:"الطريق والسكن فيها متعب.",
  steps:["Go to gondwanagr.co.za (official site)","Choose a lodge: Kwena Lodge (suites) or a private villa","Select your package on the booking engine — rates exclude the conservation levy","Pay to confirm — 100% deposit required within 3 days or booking is released","Pre-book extra activities (Bokkie Drive, spa, guided walk) by emailing reservations@gondwanagr.co.za"],
  steps_ar:["اذهبا إلى gondwanagr.co.za (الموقع الرسمي)","اختارا نُزلاً: Kwena Lodge (أجنحة) أو فيلا خاصة","حددا الباقة عبر محرك الحجز — الأسعار لا تشمل رسم حماية الطبيعة","ادفعا للتأكيد — يُطلب دفع كامل خلال ٣ أيام وإلا يُلغى الحجز","احجزا الأنشطة الإضافية مسبقًا (Bokkie Drive، سبا، جولة مشي) عبر البريد reservations@gondwanagr.co.za"],
},
{
  n:"Garden Route Safari Camp", n_ar:"غاردن روت سفاري كامب", g:"https://maps.app.goo.gl/b8Vwn9Uiurqes99s5", site:"https://gardenroutesafaricamp.com/",
  rating:4.9, ratingCount:255,
  location:"Mossel Bay — ~4hrs (400km) from Cape Town, 20 min from George Airport (most accessible by air)", location_ar:"موسيل باي — ~٤ ساعات (٤٠٠كم) من كيب تاون، ٢٠ دقيقة من مطار جورج (الأسهل وصولاً جوًا)",
  big5:["Lion"], big5no:["Elephant","Leopard","Rhino","Buffalo"],
  price:"~SAR 900 pp/night (≈ R4,300 ZAR; B&B only — activities/meals extra)", price_ar:"~٩٠٠ ريال سعودي للشخص/الليلة (≈ ٤,٣٠٠ راند؛ فطور فقط — الأنشطة والوجبات إضافية)",
  about:"A small, family-run boutique camp — plains game (zebra, wildebeest, giraffe, eland) plus lions, but not a full Big Five reserve. Praised for personal, warm service and a genuine 'family' feel rather than a big commercial operation. Halal, vegan and gluten-free menu options available. Good value if you want a lighter, cheaper safari taste rather than a full Big Five splurge.", about_ar:"مخيم بوتيك صغير تديره عائلة — حيوانات سهول (حمار وحشي، وايلدبيست، زرافة، إيلاند) بالإضافة للأسود، لكنه ليس محمية خماسية كاملة. يُشاد بخدمته الشخصية الدافئة وأجوائه العائلية الحقيقية بدل عملية تجارية كبيرة. خيارات قائمة حلال ونباتية وخالية من الغلوتين متوفرة. قيمة جيدة إن أردتما تجربة سفاري أخف وأرخص بدل ترف الخمسة الكبار الكامل.",
  includes:"Accommodation + breakfast; game drives and other meals booked/paid separately", includes_ar:"إقامة + فطور؛ جولات السفاري والوجبات الأخرى تُحجز وتُدفع بشكل منفصل",
  steps:["Go to gardenroutesafaricamp.com (official site)","Enquire directly — small camp, so book well ahead in peak season","Confirm which game drives/meal plan you want added, as base rate is B&B only","Pay deposit to secure your dates","WhatsApp them directly for fast responses (contact on site)"],
  steps_ar:["اذهبا إلى gardenroutesafaricamp.com (الموقع الرسمي)","استفسرا مباشرة — مخيم صغير، فاحجزا مبكرًا في موسم الذروة","أكدا أي جولات سفاري/خطة وجبات تريدان إضافتها، فالسعر الأساسي فطور فقط","ادفعا العربون لتثبيت التواريخ","تواصلا معهم عبر واتساب للرد السريع (متوفر بالموقع)"],
  mynote:null, mynote_ar:null,
},
{
  n:"Botlierskop Private Game Reserve", n_ar:"بوتليرسكوب برايفت جيم ريزيرف", g:"https://maps.app.goo.gl/r66ynrJEgP9eveJA6", site:"https://www.botlierskop.co.za/",
  rating:4.7, ratingCount:2431,
  location:"Between Mossel Bay and George — ~4hrs (400km) from Cape Town", location_ar:"بين موسيل باي وجورج — ~٤ ساعات (٤٠٠كم) من كيب تاون",
  big5:["Elephant","Lion","Rhino","Buffalo"], big5no:["Leopard"],
  price:"~SAR 885–1,550 pp/night (≈ R4,215–7,390 ZAR)", price_ar:"~٨٨٥-١,٥٥٠ ريال سعودي للشخص/الليلة (≈ ٤,٢١٥-٧,٣٩٠ راند)",
  includes:"Full Board Plus — all meals, 2 daily game drives; conservation fee ~SAR 126–139/room/stay extra (≈ R600–660 ZAR)", includes_ar:"إقامة كاملة بلس — كل الوجبات، جولتا سفاري يوميًا؛ رسم حماية طبيعة إضافي ~١٢٦-١٣٩ ريال سعودي لكل غرفة (≈ ٦٠٠-٦٦٠ راند)",
  about:"Consistently described as the most luxurious of the five — a proper tented safari lodge feel (canvas suites with real furnishings), a dedicated spa (Fijnebos Spa), and horseback safaris as a standout extra. 6,000 hectares, 4 of the Big Five (no leopard).", about_ar:"يوصف باستمرار بأنه الأفخم بين الخمسة — أجواء نُزل سفاري بخيام حقيقية (أجنحة قماشية بأثاث فعلي)، سبا مخصص (Fijnebos Spa)، وسفاري بالخيول كإضافة مميزة. ٦,٠٠٠ هكتار، ٤ من الخمسة الكبار (بدون النمر).",
  mynote:"Luxury.", mynote_ar:"فخامة.",
  steps:["Go to botlierskop.co.za (official site)","Choose Tented Lodge or Village Lodge accommodation","Check the specials page — packages with sunset/sunrise drives bundled are common","Book online or call Cape Town reservations +27 21 794 9050","Pay deposit — conservation fee settled separately"],
  steps_ar:["اذهبا إلى botlierskop.co.za (الموقع الرسمي)","اختارا إقامة Tented Lodge أو Village Lodge","تحققا من صفحة العروض — باقات بجولات غروب/شروق مجمّعة شائعة","احجزا إلكترونيًا أو اتصلا بحجوزات كيب تاون +27 21 794 9050","ادفعا العربون — رسم حماية الطبيعة يُسدد بشكل منفصل"],
},
{
  n:"Aquila Private Game Reserve", n_ar:"أكويلا برايفت جيم ريزيرف", g:"https://maps.app.goo.gl/GvsSSbpYahLPdrDx5", site:"https://aquilasafari.com/",
  rating:4.2, ratingCount:5990,
  location:"Touws River — only ~2hrs (165km) from Cape Town, but NOT on the Garden Route drive itself (it's the opposite direction/a detour)", location_ar:"تاوس ريفر — على بعد ساعتين فقط (١٦٥كم) من كيب تاون، لكنها ليست على طريق الحدائق نفسه (اتجاه معاكس/انحراف عن الطريق)",
  big5:["Elephant","Lion","Leopard","Rhino","Buffalo"], big5no:[],
  price:"Day trip SAR 209–815 pp; overnight from ~SAR 630+ pp/night (≈ R995–3,880 / R3,000+ ZAR)", price_ar:"رحلة يوم ٢٠٩-٨١٥ ريال سعودي للشخص؛ مبيت من ~٦٣٠+ ريال سعودي للشخص/الليلة (≈ ٩٩٥-٣,٨٨٠ / ٣,٠٠٠+ راند)",
  includes:"Day trip: 1 game drive + meal per package tier. Overnight: all meals, 2 game drives, stargazing", includes_ar:"رحلة اليوم: جولة سفاري واحدة + وجبة حسب الفئة. المبيت: كل الوجبات، جولتا سفاري، ومشاهدة النجوم",
  about:"The most flexible option — bookable as a half/full-day trip straight from Cape Town, no overnight stay or long drive required, and technically full Big Five. That said, it's the smallest and closest reserve to the city, and some travellers and reviews feel the animals are more visibly managed/less 'wild' than the reserves further along the Garden Route — worth weighing if authenticity matters more than convenience to you.", about_ar:"الخيار الأكثر مرونة — يمكن حجزه كرحلة نصف/يوم كامل مباشرة من كيب تاون، دون الحاجة لمبيت أو قيادة طويلة، وتقنيًا كامل الخمسة الكبار. مع ذلك، فهي أصغر وأقرب محمية للمدينة، ويشعر بعض المسافرين والمراجعات أن الحيوانات مُدارة بشكل أكثر وضوحًا/أقل 'توحشًا' من المحميات الأبعد على طريق الحدائق — يستحق الموازنة إن كانت الأصالة أهم من الراحة بالنسبة لكما.",
  mynote:"People say it's not worth it.", mynote_ar:"يقولون ماتستاهل.",
  steps:["Go to aquilasafari.com (official site)","Day trip: choose Early Morning, Afternoon or Full Day safari, self-drive or with transport from Cape Town","Overnight: choose Safari Lodge or Safari Cottage room type","Book and pay online — arrive at the stated time (self-drive) or pickup point (transport)","Bring swimwear, sunscreen and a hat — pool and outdoor time included either way"],
  steps_ar:["اذهبا إلى aquilasafari.com (الموقع الرسمي)","رحلة اليوم: اختارا سفاري الصباح الباكر أو بعد الظهر أو اليوم الكامل، بقيادة ذاتية أو نقل من كيب تاون","المبيت: اختارا نوع الغرفة Safari Lodge أو Safari Cottage","احجزا وادفعا إلكترونيًا — صلا بالوقت المحدد (قيادة ذاتية) أو نقطة الالتقاء (نقل)","أحضرا ملابس سباحة وواقي شمس وقبعة — وقت المسبح والخارج مشمول في الحالتين"],
},
];

function bigFivePills(item){
  const ALL5 = LANG==='ar' ? ["الفيل","الأسد","النمر","وحيد القرن","الجاموس"] : ["Elephant","Lion","Leopard","Rhino","Buffalo"];
  const ALL5EN = ["Elephant","Lion","Leopard","Rhino","Buffalo"];
  return ALL5EN.map((en,i)=>{
    const has = item.big5.includes(en);
    return `<span class="${has?'':'no'}">${ALL5[i]}</span>`;
  }).join('');
}
function renderSafari(){
  const el = document.getElementById('safContent');
  const T_HEAD = LANG==='ar'
    ? ["النُزل","الموقع والمسافة","الخمسة الكبار","التقييم","السعر"]
    : ["Lodge","Location & distance","Big Five present","Rating","From"];
  let table = `<div class="saf-compare-wrap"><table class="saf-compare"><thead><tr>${T_HEAD.map(h=>`<th>${h}</th>`).join('')}</tr></thead><tbody>`;
  SAFARI.forEach(s=>{
    const name = LANG==='ar'?s.n_ar:s.n;
    const loc = LANG==='ar'?s.location_ar:s.location;
    const price = LANG==='ar'?s.price_ar:s.price;
    const ratingTxt = s.rating ? `★ ${s.rating.toFixed(1)} (${s.ratingCount.toLocaleString()})` : '—';
    table += `<tr><td><b>${name}</b></td><td>${loc}</td><td><div class="saf-big5">${bigFivePills(s)}</div></td><td>${ratingTxt}</td><td>${price}</td></tr>`;
  });
  table += `</tbody></table></div>`;

  let cards = '';
  SAFARI.forEach(s=>{
    const name = LANG==='ar'?s.n_ar:s.n;
    const about = LANG==='ar'?s.about_ar:s.about;
    const includes = LANG==='ar'?s.includes_ar:s.includes;
    const price = LANG==='ar'?s.price_ar:s.price;
    const mynote = LANG==='ar'?s.mynote_ar:s.mynote;
    const steps = LANG==='ar'?s.steps_ar:s.steps;
    cards += `<div class="saf-card">
      <div class="saf-card-head"><h3>${name}</h3><span class="saf-price-tag">${price}</span></div>
      <div class="pill-row">
        <div class="saf-big5">${bigFivePills(s)}</div>
        ${s.rating ? `<span class="rating-pill">★ ${s.rating.toFixed(1)} <i>(${s.ratingCount.toLocaleString()})</i></span>` : ``}
      </div>
      <p class="about">${about}</p>
      <p class="about"><b>${LANG==='ar'?'يشمل':'Includes'}:</b> ${includes}</p>
      ${mynote ? `<div class="mynote saf-mynote">📝 ${mynote}</div>` : ``}
      <div class="card-actions">
        <a class="mini-link primary" href="${s.g}" target="_blank">📍 ${tr('directions')}</a>
        <a class="mini-link verified" href="${s.site}" target="_blank">🌐 ${LANG==='ar'?'الموقع الرسمي':'Official site'}</a>
      </div>
      <button type="button" class="steps-toggle" data-safstep="${SAFARI.indexOf(s)}" style="margin-top:10px;">${tr('howToBook')} ▸</button>
      <div class="steps" id="safsteps-${SAFARI.indexOf(s)}">
        <ol>${steps.map(st=>`<li>${st}</li>`).join('')}</ol>
      </div>
    </div>`;
  });

  el.innerHTML = table + cards;
  el.querySelectorAll('[data-safstep]').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const stepsEl = document.getElementById('safsteps-'+btn.dataset.safstep);
      stepsEl.classList.toggle('open');
      btn.textContent = (stepsEl.classList.contains('open')?tr('howToBook')+' ▾':tr('howToBook')+' ▸');
    });
  });
}

function renderGardenRoute(){
  const el = document.getElementById('grContent');
  let total = 0;
  let grIdx = 0;
  let html = '';
  GARDEN_ROUTE.forEach(t=>{
    total += t.items.length;
    const name = LANG==='ar' ? t.town_ar : t.town;
    html += `<div class="gr-town"><div class="gr-town-head"><span class="gr-pin">${t.pin}</span><h3>${name}</h3><span class="count" style="margin-inline-start:auto;font-family:'JetBrains Mono',monospace;font-size:12.5px;color:#8a7f70;">${t.items.length}</span></div><div class="gr-grid">`;
    t.items.forEach(item=>{ html += grItemCard(item, grIdx); grIdx++; });
    html += `</div></div>`;
  });
  el.innerHTML = html;
  const countEl = document.getElementById('grCount');
  if(countEl) countEl.textContent = total;
  wireGRCardEvents(el);
}
function wireGRCardEvents(container){
  container.querySelectorAll('[data-grpick]').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const idx=+btn.dataset.grpick;
      if(grPicked.has(idx)) grPicked.delete(idx); else grPicked.add(idx);
      renderGardenRoute(); renderDrawer(); updateBudget();
    });
  });
  wireNoteEvents(container);
}

/* ================= GARDEN ROUTE ITINERARY ================= */
const GR_ITINERARY = [
{title:"Cape Town → Hermanus", title_ar:"كيب تاون ← هيرمانوس",
 tip:"~2hr drive. Leave Cape Town by mid-morning to arrive with the afternoon free.", tip_ar:"قيادة ~ساعتين. غادرا كيب تاون منتصف الصباح لتصلا وأمامكما بعد ظهر حر.",
 blocks:[
  {slot:"Drive", slot_ar:"القيادة", items:["Hermanus Waterfront"]},
  {slot:"Afternoon", slot_ar:"بعد الظهر", items:["Cliff Path","Old Harbour Museum"]},
  {slot:"Dinner", slot_ar:"العشاء", items:["Theo's Taverna","Bientang's Cave Restaurant & Wine Bar"]},
 ]},
{title:"Hermanus — full day", title_ar:"هيرمانوس — يوم كامل",
 tip:"Book the shark cage diving ahead — weather-dependent and often sells out.", tip_ar:"احجزا غطس قفص القرش مسبقًا — مرتبط بالطقس ويُحجز بالكامل غالبًا.",
 blocks:[
  {slot:"Breakfast", slot_ar:"الفطور", items:["Café Anna"]},
  {slot:"Morning", slot_ar:"الصباح", items:["Apex Shark Cage Diving – Gansbaai"]},
  {slot:"Lunch", slot_ar:"الغداء", items:["The Station Pizza Hermanus"]},
  {slot:"Afternoon", slot_ar:"بعد الظهر", items:["Cliff Path"]},
  {slot:"Dinner", slot_ar:"العشاء", items:["La Pentola","Char'd Grill & Wine Bar"]},
 ]},
{title:"Hermanus → Mossel Bay", title_ar:"هيرمانوس ← موسيل باي",
 tip:"~2.5hr drive. Stop at the Post Office Tree on arrival before checking in.", tip_ar:"قيادة ~٢.٥ ساعة. توقفا عند شجرة مكتب البريد فور الوصول قبل تسجيل الدخول.",
 blocks:[
  {slot:"Drive & arrival", slot_ar:"القيادة والوصول", items:["Post Office Tree"]},
  {slot:"Afternoon", slot_ar:"بعد الظهر", items:["Mossel Bay Zipline"]},
 ]},
{title:"Safari day (near Mossel Bay/Albertinia)", title_ar:"يوم سفاري (قرب موسيل باي/ألبرتينيا)",
 tip:"See the Safari tab to compare and book — Garden Route Game Lodge, Gondwana and Botlierskop are all within reach of Mossel Bay; book well ahead.", tip_ar:"راجعا تبويب السفاري للمقارنة والحجز — Garden Route Game Lodge وGondwana وBotlierskop كلها قريبة من موسيل باي؛ احجزا مبكرًا.",
 blocks:[
  {slot:"Full day", slot_ar:"يوم كامل", items:[]},
 ]},
{title:"Mossel Bay → George → Wilderness", title_ar:"موسيل باي ← جورج ← ويلدرنس",
 tip:"Cango Caves is a worthwhile detour via Oudtshoorn (~1hr each way from George) if you have the time.", tip_ar:"كهوف كانجو انحراف يستحق عبر أودتسهورن (~ساعة بكل اتجاه من جورج) إن سمح وقتكما.",
 blocks:[
  {slot:"Morning (George)", slot_ar:"الصباح (جورج)", items:["Redberry Farm","Outeniqua Transport Museum"]},
  {slot:"Detour (optional)", slot_ar:"انحراف (اختياري)", items:["Cango Caves"]},
  {slot:"Lunch", slot_ar:"الغداء", items:["Garden Route Mall"]},
  {slot:"Evening (Wilderness)", slot_ar:"المساء (ويلدرنس)", items:["Map of Africa viewpoint"]},
 ]},
{title:"Wilderness — full day", title_ar:"ويلدرنس — يوم كامل",
 tip:"Pick one big adventure activity (WildX, Eden Adventures kayak, or Acrobranch) rather than trying all three.", tip_ar:"اختارا نشاط مغامرة كبير واحد (WildX، كاياك إيدن، أو أكروبرانش) بدل تجربة الثلاثة.",
 blocks:[
  {slot:"Breakfast", slot_ar:"الفطور", items:["Jammwich"]},
  {slot:"Morning", slot_ar:"الصباح", items:["Eden Adventures","WildX Adventures Wilderness"]},
  {slot:"Lunch", slot_ar:"الغداء", items:["The Green Shed Coffee Roastery"]},
  {slot:"Afternoon", slot_ar:"بعد الظهر", items:["Acrobranch Garden Route","Wilderness Beach","Timberlake Village"]},
  {slot:"Dinner", slot_ar:"العشاء", items:["The Girls on the Square","Joplins Steak Bar"]},
 ]},
{title:"Wilderness → Sedgefield → Knysna", title_ar:"ويلدرنس ← سيدجفيلد ← كنيسنا",
 tip:"If it's a Saturday morning, stop at Wild Oats Market in Sedgefield on the way through.", tip_ar:"إن كان صباح سبت، توقفا في سوق وايلد أوتس بسيدجفيلد في الطريق.",
 blocks:[
  {slot:"Morning (Sedgefield)", slot_ar:"الصباح (سيدجفيلد)", items:["Wild Oats Community Farmers' Market","Paraglide Africa – Sedgefield"]},
  {slot:"Lunch", slot_ar:"الغداء", items:["Pearl View Coffee Shop"]},
  {slot:"Afternoon (Knysna)", slot_ar:"بعد الظهر (كنيسنا)", items:["Knysna Heads viewpoint parking"]},
  {slot:"Dinner", slot_ar:"العشاء", items:["34 Degrees South","OPescador Restaurant Knysna"]},
 ]},
{title:"Knysna — full day", title_ar:"كنيسنا — يوم كامل",
 tip:"Book Knysna Elephant Park and the zipline ahead in peak season.", tip_ar:"احجزا حديقة أفيال كنيسنا والزيبلاين مسبقًا في موسم الذروة.",
 blocks:[
  {slot:"Breakfast", slot_ar:"الفطور", items:["île de Païn"]},
  {slot:"Morning", slot_ar:"الصباح", items:["Knysna Elephant Park","Scootours Knysna"]},
  {slot:"Lunch", slot_ar:"الغداء", items:["île de Païn"]},
  {slot:"Afternoon", slot_ar:"بعد الظهر", items:["Knysna Waterfront","The Red Bridge","Knysna Ziplines"]},
  {slot:"Dinner", slot_ar:"العشاء", items:["Zinzi Restaurant"]},
 ]},
{title:"Knysna → Plettenberg Bay", title_ar:"كنيسنا ← بليتنبرغ باي",
 tip:"The Crags animal sanctuaries (Monkeyland, Birds of Eden, Jukani) are clustered together — easy to combine two in one visit.", tip_ar:"ملاذات الحيوانات في The Crags (مونكيلاند، بيردز أوف إيدن، جوكاني) متجمعة معًا — سهل الجمع بين اثنين في زيارة واحدة.",
 blocks:[
  {slot:"Morning", slot_ar:"الصباح", items:["Monkeyland","Birds of Eden"]},
  {slot:"Lunch", slot_ar:"الغداء", items:["Jukani Wildlife Sanctuary"]},
  {slot:"Afternoon", slot_ar:"بعد الظهر", items:["Lookout Beach","Tenikwa Wildlife Rehabilitation & Awareness Centre"]},
  {slot:"Dinner", slot_ar:"العشاء", items:["Zinzi Restaurant"]},
 ]},
{title:"Plettenberg Bay → Tsitsikamma (final day)", title_ar:"بليتنبرغ باي ← تسيتسيكاما (اليوم الأخير)",
 tip:"Bloukrans Bungy is optional and not for everyone — Storms River suspension bridge and the kayak trip are calmer highlights if you'd rather skip it.", tip_ar:"بلوكرانس بنجي اختياري وليس للجميع — جسر ستورمز المعلق وجولة الكاياك أهدأ إن أردتما تخطيه.",
 blocks:[
  {slot:"Morning", slot_ar:"الصباح", items:["Tsitsikamma National Park","Storms River bridge"]},
  {slot:"Optional thrill", slot_ar:"إثارة اختيارية", items:["Bloukrans Bungy"]},
  {slot:"Afternoon", slot_ar:"بعد الظهر", items:["Untouched Adventures","Tsitsikamma Wolf Sanctuary"]},
  {slot:"Onward", slot_ar:"المتابعة", items:[]},
 ]},
];

function grItinChip(name){
  if(!name) return '';
  const item = GARDEN_ROUTE.flatMap(t=>t.items).find(i=>i.n===name);
  if(!item) return '';
  const catColors = {activity:"#1f5f6b",restaurant:"#e2622e",coffee:"#8a4fae",shop:"#c9942f"};
  const color = catColors[item.c] || "#6f8c5f";
  const label = LANG==='ar' ? item.n_ar : item.n;
  return `<a class="itin-chip" href="${item.g}" target="_blank"><span class="ic-dot" style="background:${color}"></span>${label}${item.rating?`<span class="ic-star">★${item.rating.toFixed(1)}</span>`:''}${item.book?`<span class="ic-book">●</span>`:''}</a>`;
}
/* ================= TRANSPORT ================= */
function gmap(lat,lng,placeId){ return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}&query_place_id=${placeId}`; }
const HOSPITALS = [
  {area:"City Bowl & Foreshore", area_ar:"وسط المدينة والفورشور", n:"Mediclinic Cape Town Hospital", rating:3.9, ratingCount:471, g:gmap(-33.9362122,18.4105972,"ChIJg_X5jnZnzB0Rxdc2XC5FI_M"), pharmacy:"Clicks / Dis-Chem on Adderley St or Long St", pharmacy_ar:"صيدلية Clicks / Dis-Chem في شارع Adderley أو Long"},
  {area:"V&A Waterfront & Green Point", area_ar:"واجهة V&A البحرية وغرين بوينت", n:"New Somerset Hospital (public)", rating:3.0, ratingCount:546, g:gmap(-33.9046571,18.4169286,"ChIJb3z1E1BnzB0Rw2zbWZZmzv4"), pharmacy:"Clicks / Dis-Chem, Victoria Wharf Shopping Centre", pharmacy_ar:"صيدلية Clicks / Dis-Chem، مركز Victoria Wharf للتسوق"},
  {area:"Foreshore / City Bowl (private, ~10 min from Waterfront)", area_ar:"Foreshore / وسط المدينة (خاص، ~١٠ دقائق من الواجهة البحرية)", n:"Netcare Christiaan Barnard Memorial Hospital", rating:3.4, ratingCount:545, g:gmap(-33.9178451,18.4307814,"ChIJ2SQId2ZnzB0RWcLneU9cLtg"), pharmacy:"On-site pharmacy at the hospital", pharmacy_ar:"صيدلية داخل المستشفى"},
  {area:"Southern Suburbs & Constantia", area_ar:"الضواحي الجنوبية وكونستانتيا", n:"Life Kingsbury Hospital", rating:3.5, ratingCount:380, g:gmap(-33.9864132,18.4688705,"ChIJ1XtcTNpCzB0RF4szjgj-QvI"), pharmacy:"Clicks, Cavendish Square, Claremont", pharmacy_ar:"صيدلية Clicks، Cavendish Square، كلارمونت"},
  {area:"Hout Bay & Cape Point Peninsula", area_ar:"هاوت باي وشبه جزيرة كيب بوينت", n:"Hout Bay Family Medical Centre (GP clinic)", rating:4.6, ratingCount:59, g:gmap(-34.0422933,18.3498851,"ChIJlxuTd2dpzB0RIGXx3hQFb4o"), pharmacy:"Medicross/pharmacy in Hout Bay village centre", pharmacy_ar:"مركز Medicross/صيدلية في وسط قرية هاوت باي"},
];
const CAR_RENTALS = [
  {n:"Woodford Car Hire — Cape Town Int'l Airport", n_ar:"وودفورد لتأجير السيارات — مطار كيب تاون الدولي", rating:4.3, ratingCount:4807, g:gsearch("Woodford Car Hire Cape Town International Airport"), site:"https://www.woodford.co.za/", recommended:true},
  {n:"Avis Rent a Car — Cape Town Int'l Airport", n_ar:"أفيس لتأجير السيارات — مطار كيب تاون الدولي", rating:3.5, ratingCount:2249, g:gsearch("Avis Rent a Car Cape Town International Airport"), site:"https://www.avis.co.za/"},
  {n:"Europcar — Cape Town Airport", n_ar:"يوروكار — مطار كيب تاون", rating:3.6, ratingCount:1311, g:gsearch("Europcar Cape Town Airport"), site:"https://www.europcar.co.za/"},
  {n:"First Car Rental — Cape Town Int'l Airport", n_ar:"فيرست كار رنتال — مطار كيب تاون الدولي", rating:3.6, ratingCount:639, g:gsearch("First Car Rental Cape Town International Airport"), site:"https://www.firstcarrental.co.za/"},
];

