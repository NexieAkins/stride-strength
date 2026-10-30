/* Apple Health two-way workout sync (iOS app only; a no-op on web and Android).
   Import: Health workouts -> db.workouts.   Export: workouts logged in the app -> Health.
   Duplicates are prevented by healthUuid (Health sample id), our own id stored as the Health
   external UUID, and a same-day similarity match. */
(function(){
'use strict';
const cap=window.Capacitor;
let H=null;
try{
  if(cap&&cap.isNativePlatform&&cap.isNativePlatform()&&cap.getPlatform&&cap.getPlatform()==='ios'&&typeof cap.registerPlugin==='function'){
    if(typeof cap.isPluginAvailable!=='function'||cap.isPluginAvailable('StrideHealth'))H=cap.registerPlugin('StrideHealth');
  }
}catch{H=null;}
if(!H)return;

const APP_ID='com.strideandstrength.app',WATCH_ID='com.strideandstrength.app.watchkitapp';
const MIN=60000,DAY=86400000,EVERY=5*MIN;
const owner=()=>window.cloudRecordOwner?.()||null;
const sKey=o=>'stride-health-'+o,iKey=o=>'stride-health-ignored-'+o;
const read=(k,d)=>{try{const v=JSON.parse(localStorage.getItem(k));return v==null?d:v;}catch{return d;}};
const write=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v));}catch{}};
const toast=m=>{try{window.strideToast?.(m);}catch{}};
const state=()=>{const o=owner();return o?read(sKey(o),{on:false,lastSync:0}):{on:false,lastSync:0};};
const setState=p=>{const o=owner();if(!o)return;write(sKey(o),{...state(),...p});};
const ignored=()=>new Set(read(iKey(owner()||'x'),[]));
const ignore=ids=>{const o=owner();if(!o||!ids.length)return;const s=ignored();ids.forEach(i=>s.add(i));write(iKey(o),[...s].slice(-2000));};
const localDay=ms=>{const d=new Date(ms);return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');};
const r1=n=>Math.round(n*10)/10,r2=n=>Math.round(n*100)/100;
const ready=()=>{const o=owner();if(!o||window.strideProfileReadyOwner!==o)return false;try{if(document.querySelector('main')?.inert)return false;}catch{}return typeof db!=='undefined'&&Array.isArray(db.workouts);};
const persist=()=>{try{return typeof save==='function'?save():false;}catch{return false;}};
const redraw=()=>{try{if(typeof render==='function')render();}catch{}};

/* ---------- categories & matching ---------- */
const catOfType=t=>{t=String(t||'');if(/run|jog/i.test(t)||/walk|hike/i.test(t))return 'run';if(/bike|cycl/i.test(t))return 'bike';if(/swim/i.test(t))return 'swim';if(/upper|lower|core|strength|weights/i.test(t))return 'strength';return 'other';};
const catOfActivity=a=>{switch(a){case 'running':case 'walking':case 'hiking':return 'run';case 'cycling':return 'bike';case 'swimming':return 'swim';case 'traditionalStrengthTraining':case 'functionalStrengthTraining':case 'coreTraining':case 'hiit':return 'strength';default:return 'other';}};
const typeOfActivity=a=>({running:'Long Run',walking:'Walk',hiking:'Walk',cycling:'Bike',swimming:'Swim',coreTraining:'Core'}[a]||'Other activity');
function recWindow(rec){
  const fin=rec.session?.finishedAt?Date.parse(rec.session.finishedAt):NaN,st=rec.session?.startedAt?Date.parse(rec.session.startedAt):NaN;
  if(Number.isFinite(st)&&Number.isFinite(fin))return [st,fin];
  if(Number.isFinite(fin)&&Number(rec.minutes)>0)return [fin-Number(rec.minutes)*MIN,fin];
  return null;
}
/* hw = {start,end,cat,minutes,miles}; rec = db.workouts record. Returns a score (lower = closer) or -1. */
function similarity(rec,hw){
  const win=recWindow(rec);
  if(win&&hw.start<win[1]&&hw.end>win[0])return 0;
  if(catOfType(rec.type)!==hw.cat)return -1;
  const a=Number(rec.minutes)||0,b=hw.minutes;
  if(a>0&&b>0){const d=Math.abs(a-b);return (d<=10||d<=0.25*a)?d:-1;}
  const ma=Number(rec.miles)||0,mb=hw.miles||0;
  if(ma>0&&mb>0){const d=Math.abs(ma-mb);return (d<=0.25*ma||d<=0.25)?d:-1;}
  return -1;
}
function findMatch(hw){
  let best=null,bs=Infinity;
  for(const rec of db.workouts){
    if(rec.healthUuid||rec.date!==hw.date)continue;
    const s=similarity(rec,hw);
    if(s>=0&&s<bs){best=rec;bs=s;}
  }
  return best;
}
function attach(rec,uuid,hw){
  rec.healthUuid=uuid;
  if(hw){
    if(!(Number(rec.minutes)>0)&&hw.minutes>0)rec.minutes=r1(hw.minutes);
    if(!(Number(rec.miles)>0)&&hw.miles>0)rec.miles=r2(hw.miles);
  }
}

/* ---------- import ---------- */
let syncing=false,lastAttempt=0;
async function sync(force){
  if(syncing||!state().on||!ready())return;
  if(!force&&Date.now()-lastAttempt<EVERY)return;
  syncing=true;lastAttempt=Date.now();
  const startedAt=Date.now(),who=owner();
  try{
    const st=state();
    const sinceMs=st.lastSync?st.lastSync-2*DAY:startedAt-30*DAY;
    const res=await H.fetchWorkouts({sinceMs});
    if(owner()!==who||!ready())return;
    const list=(Array.isArray(res)?res:res?.workouts||[]).filter(w=>w&&w.uuid&&Number.isFinite(Number(w.start))).sort((a,b)=>a.start-b.start);
    const skip=ignored();let added=0,changed=false;
    for(const w of list){
      if(skip.has(w.uuid))continue;
      if(db.workouts.some(r=>r.healthUuid===w.uuid))continue;
      const bundle=String(w.sourceBundleId||'');
      const byId=w.externalId?db.workouts.find(r=>r.id===w.externalId):null;
      if(byId){byId.healthUuid=w.uuid;changed=true;continue;}   // our own export coming back
      if(bundle.startsWith(APP_ID)&&bundle!==WATCH_ID)continue;   // written by the phone app: never re-import
      const minutes=(Number(w.durationSec)||(Number(w.end)-Number(w.start))/1000||0)/60,miles=Number(w.distanceMiles)||0;
      if(!(minutes>0))continue;
      const hw={start:Number(w.start),end:Number(w.end)||Number(w.start)+minutes*MIN,cat:catOfActivity(w.activityType),minutes,miles,date:localDay(Number(w.start))};
      const match=findMatch(hw);
      if(match){attach(match,w.uuid,hw);changed=true;continue;}
      db.workouts.push({id:crypto.randomUUID(),date:hw.date,type:typeOfActivity(w.activityType),miles:r2(miles),minutes:r1(minutes),source:'apple-health',notes:'From Apple Health · '+(w.sourceName||'Health'),energy:'',soreness:'',healthUuid:w.uuid});
      added++;changed=true;
    }
    if(changed){if(!persist()){/* storage failure: leave lastSync so we retry */return;}refreshSnap();redraw();}
    setState({lastSync:startedAt});
    if(added>0)toast('✓ Added '+added+' workout'+(added===1?'':'s')+' from Apple Health');
    updateRow();
  }catch(e){try{console.warn('Apple Health sync',e);}catch{}}
  finally{syncing=false;}
}

/* ---------- export ---------- */
const exporting=new Set();
const activityOfType=t=>{t=String(t||'');if(/run|jog/i.test(t))return 'running';if(/walk|hike/i.test(t))return 'walking';if(/bike|cycl/i.test(t))return 'cycling';if(/core/i.test(t))return 'core';if(/upper|lower|strength|weights/i.test(t))return 'strength';return 'other';};
function mergeIntoImported(rec){
  const mins=Number(rec.minutes)||0;if(!(mins>0))return false;
  const hw={start:0,end:0,cat:catOfType(rec.type),minutes:mins,miles:Number(rec.miles)||0,date:rec.date};
  let best=null,bs=Infinity;
  for(const imp of db.workouts){
    if(imp===rec||imp.source!=='apple-health'||!imp.healthUuid||imp.date!==rec.date)continue;
    if(catOfType(imp.type)!==hw.cat)continue;
    const a=Number(imp.minutes)||0;if(!(a>0))continue;
    const d=Math.abs(a-mins);if((d<=10||d<=0.25*a)&&d<bs){best=imp;bs=d;}
  }
  if(!best)return false;
  rec.healthUuid=best.healthUuid;
  if(!(Number(rec.miles)>0)&&Number(best.miles)>0)rec.miles=best.miles;
  db.workouts=db.workouts.filter(r=>r!==best);
  const o=owner();if(o)db.pendingDeletes=[...(db.pendingDeletes||[]),{id:best.id,table:'workouts',userId:o}];
  return true;
}
async function exportRecord(rec){
  try{
    if(!rec||!rec.id||rec.healthUuid||rec.source==='apple-health'||!state().on||!owner())return;
    if(/Recorded on Apple Watch/i.test(rec.notes||'')||rec.session?.watch||rec.watch)return;
    const mins=Number(rec.minutes)||0;if(!(mins>=1)||exporting.has(rec.id))return;
    if(!db.workouts.includes(rec))return;
    if(mergeIntoImported(rec)){persist();refreshSnap();redraw();return;}
    exporting.add(rec.id);
    const act=activityOfType(rec.type),fin=rec.session?.finishedAt?Date.parse(rec.session.finishedAt):NaN,now=Date.now();
    let endMs;
    if(Number.isFinite(fin)&&fin<=now+MIN)endMs=fin;
    else if(rec.date===localDay(now)||!rec.date)endMs=now;
    else{const d=new Date(rec.date+'T12:00:00');endMs=(Number.isFinite(d.getTime())?d.getTime():now)+mins*MIN;}
    if(endMs>now)endMs=now;
    const payload={id:rec.id,activity:act,startMs:Math.round(endMs-mins*MIN),endMs:Math.round(endMs)};
    const mi=Number(rec.miles)||0;if(mi>0&&['running','walking','cycling'].includes(act))payload.distanceMiles=mi;
    const res=await H.saveWorkout(payload);
    if(res?.uuid){
      const cur=db.workouts.find(r=>r.id===rec.id);
      if(cur&&!cur.healthUuid&&!db.workouts.some(r=>r.healthUuid===res.uuid)){cur.healthUuid=res.uuid;persist();}
    }
  }catch(e){try{console.warn('Apple Health export',e);}catch{}}
  finally{if(rec?.id)exporting.delete(rec.id);}
}

/* ---------- deletes: remember deleted Health-linked records so they are not re-imported ---------- */
let snap=null,snapOwner=null;
function refreshSnap(){
  const o=owner();if(!o||typeof db==='undefined'||!Array.isArray(db.workouts)){snap=null;snapOwner=null;return;}
  snap=new Map(db.workouts.map(r=>[r.id,r.healthUuid||null]));snapOwner=o;
}
function afterSave(fresh){
  const o=owner();if(!o||typeof db==='undefined'||!Array.isArray(db.workouts))return;
  if(snap&&snapOwner===o){
    const nowIds=new Set(db.workouts.map(r=>r.id)),live=new Set(db.workouts.map(r=>r.healthUuid).filter(Boolean)),gone=[];
    for(const [id,u] of snap)if(u&&!nowIds.has(id)&&!live.has(u))gone.push(u);
    if(gone.length)ignore(gone);
  }
  refreshSnap();
  if(fresh&&fresh.length)setTimeout(()=>{fresh.forEach(exportRecord);},0);
}
let wrapped=false;
function wrapSave(){
  if(wrapped||typeof save!=='function')return;
  wrapped=true;const orig=save;
  save=function(){
    let fresh=[];
    try{if(typeof db!=='undefined'&&Array.isArray(db.workouts))fresh=db.workouts.filter(w=>w&&!w.id);}catch{}
    const ok=orig.apply(this,arguments);
    try{if(ok!==false)afterSave(fresh);}catch{}
    return ok;
  };
}
wrapSave();

/* Finished strength sessions already carry an id, so they are exported from the session-end event. */
window.addEventListener('stride-session-end',()=>setTimeout(()=>{
  try{
    const rec=db.workouts[db.workouts.length-1];
    if(rec&&rec.session&&rec.session.finishedAt&&Date.now()-Date.parse(rec.session.finishedAt)<30000)exportRecord(rec);
  }catch{}
},0));

/* ---------- settings row ---------- */
let row=null;
function updateRow(){
  if(!row)return;
  const st=state(),cb=row.querySelector('input'),sub=row.querySelector('.hs-status');
  cb.checked=!!st.on;
  sub.textContent=st.on?(st.lastSync?'On · last synced '+new Date(st.lastSync).toLocaleString([], {month:'short',day:'numeric',hour:'numeric',minute:'2-digit'}):'On · syncing…'):'Off';
}
async function toggle(cb){
  if(!owner()){cb.checked=false;toast('Sign in first to sync with Apple Health.');return;}
  if(cb.checked){
    cb.disabled=true;
    try{
      const a=await H.isAvailable();
      if(a&&a.available===false){cb.checked=false;toast('Apple Health is not available on this device.');return;}
      await H.requestAuthorization();
      setState({on:true});updateRow();
      toast('Apple Health sync is on');
      sync(true);
    }catch(e){cb.checked=false;toast('Could not connect to Apple Health.');}
    finally{cb.disabled=false;updateRow();}
  }else{setState({on:false});updateRow();}
}
function buildRow(){
  if(row&&row.isConnected)return true;
  const sheet=document.getElementById('prefsSheet');if(!sheet)return false;
  const anchor=sheet.querySelector('.v6-start');
  row=document.createElement('div');row.id='healthSyncRow';row.className='card';
  row.style.cssText='display:flex;align-items:center;justify-content:space-between;gap:12px;margin:12px 0;padding:14px';
  const txt=document.createElement('div'),t=document.createElement('b'),s=document.createElement('div'),p=document.createElement('div');
  t.textContent='Sync with Apple Health';s.className='hs-status muted';s.style.fontSize='12px';
  p.className='muted';p.style.fontSize='12px';p.textContent='Brings in Apple Watch and other workouts, and saves the ones you log here, without duplicates.';
  txt.append(t,p,s);
  const cb=document.createElement('input');cb.type='checkbox';cb.setAttribute('aria-label','Sync with Apple Health');
  cb.addEventListener('change',()=>toggle(cb));
  row.append(txt,cb);
  if(anchor)anchor.before(row);else sheet.append(row);
  updateRow();return true;
}

/* ---------- triggers ---------- */
function tick(){
  try{
    wrapSave();buildRow();
    if(ready())refreshSnap();   // deletes are always followed by save() in the same tick, so this is the pre-delete state
    if(state().on&&ready())sync(false);
  }catch{}
}
setInterval(tick,4000);
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'){lastAttempt=0;setTimeout(tick,300);}});
window.addEventListener('stride-account-change',()=>{snap=null;snapOwner=null;lastAttempt=0;updateRow();setTimeout(tick,500);});
window.addEventListener('pageshow',()=>{lastAttempt=0;});
setTimeout(tick,1500);
window.strideHealthSync={sync:()=>sync(true),state};
})();
