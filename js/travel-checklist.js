/* ---------- UNIVERSAL TRAVEL CHECKLIST ----------
   General packing/prep checklist — not Cape Town–specific (that's the "Weather & what to pack"
   tips above, which stays a plain list). Same sync model as your own notes: always saved to this
   device first, and if a GitHub token is connected also synced to checklist.json in the repo, so
   it's the same checked-off list on every device. A visitor without a token just gets their own
   local copy, exactly like their notes/shortlist/expenses. Each item's key is "<section>:<index>"
   — stable across a language switch, since it doesn't depend on the item's own text. */
const TRAVEL_CHECKLIST = [
  {key:'documents', icon:'🛂', title:'Documents & Important Items', title_ar:'المستندات والأغراض المهمة',
    items:['Passport','Visa / e-visa if required','Flight tickets / boarding passes','Hotel / accommodation confirmations','Travel insurance',"Driver's license",'International Driving Permit','Copies of passport & important documents','Emergency contact information','Wallet','Credit/debit cards','Backup card','Some local currency'],
    items_ar:['جواز السفر','تأشيرة / تأشيرة إلكترونية إن تطلب الأمر','تذاكر الطيران / بطاقات الصعود','تأكيدات الفندق / الإقامة','تأمين السفر','رخصة القيادة','رخصة القيادة الدولية','نسخ من جواز السفر والمستندات المهمة','معلومات التواصل في الطوارئ','المحفظة','بطاقات ائتمان/خصم','بطاقة احتياطية','بعض العملة المحلية']},
  {key:'electronics', icon:'📱', title:'Electronics', title_ar:'الإلكترونيات',
    items:['Mobile phone','Phone charger','Charging cables','Power bank','Travel adapter','Laptop/tablet + charger','Smartwatch + charger','Earphones/headphones','Camera + charger','Extra camera batteries','Memory cards','USB flash drive if needed'],
    items_ar:['الهاتف المحمول','شاحن الهاتف','كابلات الشحن','بطارية محمولة','محول كهرباء للسفر','لابتوب/آيباد + الشاحن','ساعة ذكية + الشاحن','سماعات أذن/رأس','كاميرا + الشاحن','بطاريات إضافية للكاميرا','بطاقات ذاكرة','ذاكرة USB إن لزم الأمر']},
  {key:'clothing', icon:'👕', title:'Clothing', title_ar:'الملابس',
    items:['Underwear','Socks','T-shirts','Shirts','Pants/trousers','Shorts','Sleepwear','Jacket/coat','Sweater/hoodie','Comfortable walking clothes','Formal/smart outfit if needed','Swimwear','Hat/cap','Sunglasses'],
    items_ar:['ملابس داخلية','جوارب','تيشيرتات','قمصان','بناطيل','شورتات','ملابس النوم','جاكيت/معطف','سترة/هودي','ملابس مريحة للمشي','إطلالة رسمية أنيقة إن لزم الأمر','ملابس سباحة','قبعة','نظارة شمسية']},
  {key:'shoes', icon:'👟', title:'Shoes', title_ar:'الأحذية',
    items:['Comfortable everyday shoes','Walking/hiking shoes if needed','Smart shoes if needed','Sandals/slippers'],
    items_ar:['حذاء مريح للاستخدام اليومي','حذاء مشي/تسلق إن لزم الأمر','حذاء أنيق إن لزم الأمر','صنادل/شبشب']},
  {key:'toiletries', icon:'🧴', title:'Toiletries', title_ar:'مستلزمات الاستحمام والعناية',
    items:['Toothbrush','Toothpaste','Deodorant','Shampoo','Conditioner','Body wash','Face wash','Moisturizer','Razor/shaving products','Hair products','Perfume','Nail clipper','Lip balm','Wet wipes','Tissues','Hand sanitizer','Sunscreen'],
    items_ar:['فرشاة أسنان','معجون أسنان','مزيل عرق','شامبو','بلسم شعر','غسول الجسم','غسول الوجه','مرطب','موس حلاقة / مستلزمات الحلاقة','منتجات للشعر','عطر','مقص أظافر','مرطب شفاه','مناديل مبللة','مناديل ورقية','معقم يدين','واقي شمس']},
  {key:'health', icon:'💊', title:'Health & Medicine', title_ar:'الصحة والأدوية',
    items:['Regular medications','Prescription copies','Painkillers','Allergy medication','Stomach medication','Motion-sickness medication','Band-aids','Small first-aid kit','Insect repellent','Rehydration salts'],
    items_ar:['الأدوية المعتادة','نسخ من الوصفات الطبية','مسكنات الألم','دواء الحساسية','دواء المعدة','دواء دوار الحركة','لواصق جروح','حقيبة إسعافات أولية صغيرة','طارد الحشرات','أملاح الإماهة']},
  {key:'carryon', icon:'🎒', title:'Carry-On / Day Bag', title_ar:'حقيبة اليد / حقيبة اليوم',
    items:['Passport','Wallet/cards','Phone','Power bank','Chargers','Medication','Headphones','Travel documents','Valuables','Camera','Small water bottle','Tissues','Hand sanitizer','Light jacket'],
    items_ar:['جواز السفر','المحفظة/البطاقات','الهاتف','بطارية محمولة','الشواحن','الأدوية','سماعات','مستندات السفر','المقتنيات الثمينة','الكاميرا','زجاجة ماء صغيرة','مناديل ورقية','معقم يدين','جاكيت خفيف']},
  {key:'carRental', icon:'🚗', title:'If Renting a Car', title_ar:'عند استئجار سيارة',
    items:["Driver's license",'International Driving Permit','Rental confirmation','Insurance documents','Phone holder','Car charger','Offline maps','Emergency numbers'],
    items_ar:['رخصة القيادة','رخصة القيادة الدولية','تأكيد حجز الإيجار','مستندات التأمين','حامل هاتف','شاحن السيارة','خرائط بدون إنترنت','أرقام الطوارئ']},
  {key:'beforeHome', icon:'📲', title:'Before Leaving Home', title_ar:'قبل مغادرة المنزل',
    items:['Check passport validity','Check visa requirements','Check airline baggage allowance','Check destination weather','Download offline maps','Download airline/hotel apps','Activate roaming/eSIM','Inform bank if necessary','Make sure cards work internationally','Charge all electronics','Download important documents','Share itinerary with someone you trust','Check home appliances','Lock doors/windows','Arrange pets/plants if needed'],
    items_ar:['تحقق من صلاحية جواز السفر','تحقق من متطلبات التأشيرة','تحقق من مسموح الأمتعة لدى شركة الطيران','تحقق من طقس الوجهة','نزّل خرائط بدون إنترنت','نزّل تطبيقات شركة الطيران/الفندق','فعّل التجوال/شريحة eSIM','أبلغ البنك إذا لزم الأمر','تأكد أن البطاقات تعمل دوليًا','اشحن جميع الأجهزة الإلكترونية','نزّل المستندات المهمة','شارك خطة رحلتك مع شخص تثق به','تحقق من الأجهزة المنزلية','أقفل الأبواب/النوافذ','رتّب أمر الحيوانات الأليفة/النباتات إن لزم الأمر']},
  {key:'beforeAirport', icon:'✈️', title:'Before Leaving for the Airport', title_ar:'قبل التوجه إلى المطار',
    items:['Passport','Wallet','Phone','Flight booking','Visa','Carry-on','Checked luggage','Medication','Chargers','Keys'],
    items_ar:['جواز السفر','المحفظة','الهاتف','حجز الطيران','التأشيرة','حقيبة اليد','الأمتعة المسجّلة','الأدوية','الشواحن','المفاتيح']},
];

let TRAVEL_CHECKED = {};
try{ TRAVEL_CHECKED = JSON.parse(localStorage.getItem('ctgr_travel_checklist') || '{}') || {}; }catch(e){}
let checklistDirty = new Set();
try{ checklistDirty = new Set(JSON.parse(localStorage.getItem('ctgr_checklist_dirty') || '[]')); }catch(e){}
const saveChecklistLocal = ()=>{ try{ localStorage.setItem('ctgr_travel_checklist', JSON.stringify(TRAVEL_CHECKED)); }catch(e){} };
const saveChecklistDirty = ()=>{ try{ localStorage.setItem('ctgr_checklist_dirty', JSON.stringify([...checklistDirty])); }catch(e){} };
function toggleChecklistItem(key, checked){
  if(checked) TRAVEL_CHECKED[key] = true; else delete TRAVEL_CHECKED[key];
  saveChecklistLocal();
  checklistDirty.add(key); saveChecklistDirty();
  if(ghConfig()) scheduleChecklistSync();
}
let checklistSyncTimer = null, checklistSyncBusy = false, checklistSyncFails = 0;
function scheduleChecklistSync(delay){
  if(checklistSyncTimer) clearTimeout(checklistSyncTimer);
  checklistSyncTimer = setTimeout(syncChecklistNow, delay != null ? delay : 2500);
}
// Same merge-on-write shape as syncNotesNow(): read the repo's current file by its own sha, apply
// only the keys touched on THIS device on top of it, write it back — so two devices toggling
// different items never clobber each other's changes.
async function syncChecklistNow(){
  const cfg = ghConfig();
  if(!cfg || checklistDirty.size === 0 || checklistSyncBusy) return;
  checklistSyncBusy = true;
  const myDirty = [...checklistDirty];
  try{
    const branch = (await ghJson(cfg, '')).default_branch || 'main';
    let sha, remote = {};
    const r = await ghFetch(cfg, '/contents/checklist.json?ref=' + encodeURIComponent(branch), {headers:{'Accept':'application/vnd.github+json'}});
    if(r.ok){ const d = await r.json(); sha = d.sha; remote = JSON.parse(b64ToText(d.content)) || {}; }
    else if(r.status !== 404){ throw Object.assign(new Error('GitHub ' + r.status), {status: r.status}); }
    myDirty.forEach(k=>{ if(TRAVEL_CHECKED[k]) remote[k] = true; else delete remote[k]; });
    const sorted = Object.fromEntries(Object.entries(remote).sort((a,b)=>a[0].localeCompare(b[0])));
    const content = await blobToB64(new Blob([JSON.stringify(sorted, null, 1)], {type:'application/json'}));
    await ghJson(cfg, '/contents/checklist.json', {method:'PUT', body:{message:'Update travel checklist', content, sha, branch}});
    myDirty.forEach(k=>checklistDirty.delete(k)); saveChecklistDirty();
    const stillDirty = {};
    checklistDirty.forEach(k=>{ if(TRAVEL_CHECKED[k]) stillDirty[k] = true; });
    TRAVEL_CHECKED = Object.assign({}, sorted, stillDirty);
    saveChecklistLocal();
    renderTravelChecklist();
    checklistSyncFails = 0;
  }catch(e){
    checklistSyncFails++;
    scheduleChecklistSync(Math.min(60000, 4000 * Math.pow(1.8, checklistSyncFails)) + Math.random() * 1000);
  }finally{
    checklistSyncBusy = false;
    if(checklistDirty.size) scheduleChecklistSync(2000);
  }
}
async function loadTravelChecklist(){
  try{
    const r = await fetch('checklist.json?v=' + Date.now(), {cache:'no-store'});
    if(r.ok){
      const remote = await r.json() || {};
      Object.keys(remote).forEach(k=>{ if(!checklistDirty.has(k)) TRAVEL_CHECKED[k] = true; });
      saveChecklistLocal();
      renderTravelChecklist();
    }
  }catch(e){}
  if(ghConfig() && checklistDirty.size) scheduleChecklistSync(1000);
}
function checklistSectionCount(idx){
  const sec = TRAVEL_CHECKLIST[idx];
  const items = LANG==='ar' ? sec.items_ar : sec.items;
  const done = items.filter((_, ii)=> !!TRAVEL_CHECKED[sec.key+':'+ii]).length;
  return done + '/' + items.length;
}
// Tracked here (module-level), not re-scanned off the DOM at render time — loadTravelChecklist()
// re-renders asynchronously once checklist.json comes back (same as loadNotes()/notes.json for
// everyone, not just the owner, since reading a public repo file needs no token), and reading
// "what's currently open" from the DOM right as that fires was a real race: a click and that
// re-render landing close together could make the section snap back to collapsed right after
// opening it. This survives any number of re-renders regardless of timing.
let checklistOpenSections = new Set();
function renderTravelChecklist(){
  const el = document.getElementById('travelChecklist');
  if(!el) return;
  el.innerHTML = TRAVEL_CHECKLIST.map((sec, si)=>{
    const items = LANG==='ar' ? sec.items_ar : sec.items;
    const isOpen = checklistOpenSections.has(si);
    const rows = items.map((t, ii)=>{
      const key = sec.key + ':' + ii;
      const checked = !!TRAVEL_CHECKED[key];
      return `<label class="checklist-item ${checked?'checked':''}"><input type="checkbox" data-key="${key}" data-secidx="${si}" ${checked?'checked':''}><span>${t}</span></label>`;
    }).join('');
    return `<div class="checklist-section">
      <button type="button" class="checklist-head${isOpen?' open':''}" data-secidx="${si}" aria-expanded="${isOpen}">
        <span class="checklist-ic">${sec.icon}</span>
        <span class="checklist-title">${LANG==='ar'?sec.title_ar:sec.title}</span>
        <span class="checklist-count" data-countidx="${si}">${checklistSectionCount(si)}</span>
        <span class="checklist-caret">▾</span>
      </button>
      <div class="checklist-body" ${isOpen?'':'hidden'}>${rows}</div>
    </div>`;
  }).join('');
  el.querySelectorAll('.checklist-head').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const idx = +btn.dataset.secidx;
      const body = btn.nextElementSibling;
      const willOpen = body.hidden;
      body.hidden = !willOpen;
      btn.classList.toggle('open', willOpen);
      btn.setAttribute('aria-expanded', String(willOpen));
      if(willOpen) checklistOpenSections.add(idx); else checklistOpenSections.delete(idx);
    });
  });
  el.querySelectorAll('[data-key]').forEach(cb=>{
    cb.addEventListener('change', ()=>{
      toggleChecklistItem(cb.dataset.key, cb.checked);
      cb.closest('.checklist-item').classList.toggle('checked', cb.checked);
      const idx = cb.dataset.secidx;
      const countEl = el.querySelector(`[data-countidx="${idx}"]`);
      if(countEl) countEl.textContent = checklistSectionCount(+idx);
    });
  });
  const syncNote = document.getElementById('checklistSyncNote');
  if(syncNote) syncNote.textContent = isOwner() ? tr('checklistSynced') : tr('checklistLocal');
}
window.addEventListener('ctgr-gh-changed', ()=>{
  renderTravelChecklist();
  if(ghConfig()) loadTravelChecklist();   // pick up whatever's already on GitHub the moment a token connects
});
