/* ---------- PHOTO STORAGE (IndexedDB; falls back to memory if the browser blocks it) ---------- */
const photoDB = (function(){
  const mem = new Map();
  let dbPromise = null;
  function open(){
    if(!dbPromise) dbPromise = new Promise(resolve=>{
      let done = false; const fin = v=>{ if(!done){ done = true; resolve(v); } };
      setTimeout(()=>fin(null), 3000);            // Safari can leave open() hanging: never wait more than 3s
      try{
        const req = indexedDB.open('trip-planner-photos', 1);
        req.onupgradeneeded = ()=>req.result.createObjectStore('photos');
        req.onsuccess = ()=>fin(req.result);
        req.onerror = req.onblocked = ()=>fin(null);
      }catch(e){ fin(null); }
    });
    return dbPromise;
  }
  async function write(fn){
    const db = await open(); if(!db) return false;
    return new Promise(resolve=>{
      try{
        const tx = db.transaction('photos','readwrite'); fn(tx.objectStore('photos'));
        tx.oncomplete = ()=>resolve(true); tx.onerror = tx.onabort = ()=>resolve(false);
      }catch(e){ resolve(false); }
    });
  }
  return {
    async all(){
      const db = await open(), out = {};
      if(!db){ mem.forEach((v,k)=>{ out[k]=v; }); return out; }
      return new Promise(resolve=>{
        try{
          const req = db.transaction('photos','readonly').objectStore('photos').openCursor();
          req.onsuccess = ()=>{ const c = req.result; if(c){ out[c.key] = c.value; c.continue(); } else resolve(out); };
          req.onerror = ()=>resolve(out);
        }catch(e){ resolve(out); }
      });
    },
    async put(key, blob){ if(!(await write(s=>s.put(blob,key)))) mem.set(key, blob); },
    async del(key){ mem.delete(key); await write(s=>s.delete(key)); },
    async clear(){ mem.clear(); await write(s=>s.clear()); },
  };
})();

/* ---------- UI STRINGS ---------- */
