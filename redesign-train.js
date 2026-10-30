/* Redesign step 2: Train (Today / Plan / Recovery), live run screen with pace and splits, rest timer for strength. */
(()=>{
'use strict';
const $=id=>document.getElementById(id);
const el=(tag,props={},kids=[])=>{const n=Object.assign(document.createElement(tag),props);for(const k of [].concat(kids))n.append(k);return n;};
const icon=(n,s)=>window.strideIcon?window.strideIcon(n,s):el('span');
const NS='http://www.w3.org/2000/svg';
const day=(d=new Date())=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
const pace=s=>{if(!isFinite(s)||s<=0||s>3600)return '—';const m=Math.floor(s/60),x=Math.round(s%60);return m+':'+String(x===60?0:x).padStart(2,'0');};
const clock=s=>{s=Math.max(0,Math.round(s));const h=Math.floor(s/3600),m=Math.floor(s%3600/60),x=s%60;return (h?h+':'+String(m).padStart(2,'0'):m)+':'+String(x).padStart(2,'0');};
const btnByText=(root,re)=>[...(root||document).querySelectorAll('button')].find(b=>re.test(b.textContent));

/* ---------- Starting a run or walk from anywhere ---------- */
let runChecked=false;
function chooseWhere(kind,go){
  const walk=/walk/i.test(kind),mode=$('liveRunMode');let last='gps';try{last=localStorage.getItem('stride-run-where')||'gps';}catch(e){}
  let d=$('whereSheet');if(d)d.remove();d=el('dialog',{id:'whereSheet',className:'v6-sheet'});
  const pick=v=>{try{localStorage.setItem('stride-run-where',v);}catch(e){}if(mode){mode.value=v;mode.dispatchEvent(new Event('change',{bubbles:true}));}d.close();d.remove();go();};
  const opt=(v,ic,t1,t2)=>{const b=el('button',{type:'button',className:'t6-mk v6-where'+(v===last?' on':'')},[icon(ic,24),el('span',{},[el('b',{textContent:t1}),el('small',{textContent:t2})])]);b.onclick=()=>pick(v);return b;};
  const x=el('button',{type:'button',className:'v6-sheetx','aria-label':'Cancel',textContent:'✕'});x.onclick=()=>{d.close();d.remove();};
  d.append(el('div',{className:'v6-sheethead'},[el('h2',{textContent:'Where are you '+(walk?'walking':'running')+'?'}),x]),opt('gps',walk?'walk':'run','Outside','GPS tracks your route, distance and pace'),opt('treadmill','dumb','Treadmill / indoors','Timer only · enter the distance when you finish'));
  document.body.append(d);d.showModal();
}
function startRun(kind,skipCheck,whereDone){
  const type=$('liveRunType');if(!type)return;
  if(!window.strideLiveRun?.isActive()&&!skipCheck&&!whereDone){chooseWhere(kind,()=>startRun(kind,false,true));return;}
  if(!window.strideLiveRun?.isActive()&&!skipCheck&&window.strideWorkoutCheckin){
    const walk=/walk/i.test(kind),plan={title:walk?'Walk':'Run',minutes:30,exercises:[]};
    window.__v6RunCheck=kind;
    window.strideWorkoutCheckin.request(plan,{focus:'run',level:'beginner'},'Run',p=>{window.__v6RunCheck=null;if(/easier/i.test(p?.title||''))setTimeout(()=>{const s=$('lrStatus');if(s)s.textContent='Keep it easy today: conversational pace, stop if you feel unwell.';},1500);startRun(kind,true,true);});
    return;
  }
  if(!window.strideLiveRun?.isActive()){runChecked=true;
    const want=/walk/i.test(kind)?'Walk':/quality/i.test(kind)?'Quality Run':'Long Run';
    type.value=want;type.dispatchEvent(new Event('change'));
    $('liveRunStart')?.click();runChecked=false;
  }
  openLive();
}
window.strideStartRun=startRun;
document.addEventListener('click',e=>{const b=e.target.closest('#liveRunStart');if(!b||runChecked||window.strideLiveRun?.isActive())return;e.preventDefault();e.stopPropagation();startRun($('liveRunType')?.value||'run');},true);
// "Recovery instead" in the check-in.
function recoveryInstead(){
  const d=$('workoutCheckin');if(!d||$('checkinRecover'))return;
  const b=el('button',{type:'button',id:'checkinRecover',className:'secondary',textContent:'Do a recovery routine instead'});
  b.onclick=()=>{const pain=$('checkinPain')?.value,run=!!window.__v6RunCheck;$('checkinCancel')?.click();if(d.open)d.close();show('train');setTimeout(()=>window.strideOpenStretch?.(pain==='leg'?(run?'after running':'after leg day'):pain==='back'||pain==='shoulder'?'mobility':run?'after running':'mobility'),150);};
  $('checkinCancel')?.after(b);
}

/* ---------- Live run screen ---------- */
let live=null,locked=false,hiddenByUser=false;
function buildLive(){
  if(live)return live;
  live=el('div',{id:'liveRunView',hidden:true,role:'dialog','aria-label':'Live run'});
  live.innerHTML=`<div class="lr-top"><button type="button" class="lr-min" aria-label="Minimise">⌄</button><b id="lrTitle">Run</b><span class="lr-gps" id="lrGps"><i></i>GPS</span></div>
  <div class="lr-map"><svg id="lrMap" viewBox="0 0 300 150" preserveAspectRatio="xMidYMid meet" aria-label="Route so far"></svg></div>
  <div class="lr-dist"><span>Distance</span><b id="lrDist">0.00</b><small>mi</small></div>
  <div class="lr-tri"><div><span>Time</span><b id="lrTime">0:00</b></div><div><span>Current pace</span><b id="lrPace">—</b><small>/mi</small></div><div><span>Avg pace</span><b id="lrAvg">—</b><small>/mi</small></div></div>
  <div class="lr-tri"><div><span>Heart rate</span><b id="lrHr">—</b></div><div><span>Calories</span><b id="lrCal">—</b></div><div><span>Splits</span><b id="lrSplitN">0</b></div></div>
  <div class="lr-splits" id="lrSplits"></div>
  <p class="lr-status" id="lrStatus" role="status"></p>
  <div class="lr-ask" id="lrStopAsk" hidden role="alert"><b>Looks like you’ve stopped.</b><span>Pause so your pace stays accurate?</span><div><button type="button" id="lrAskPause">Pause</button><button type="button" id="lrAskNo" class="v6-ghost">Keep going</button></div></div>
  <div class="lr-ctrl"><button type="button" id="lrLock" class="lr-sq" aria-label="Lock screen">🔒</button><button type="button" id="lrPause" class="lr-pz" aria-label="Pause">❚❚</button><button type="button" id="lrEnd" class="lr-sq">End</button></div>
  <div class="lr-end" id="lrEndSheet" hidden><button type="button" id="lrFinish" class="v6-start">Finish &amp; review</button><button type="button" id="lrDiscard" class="v6-ghost">Discard</button><button type="button" id="lrBack" class="v6-ghost">Keep going</button></div>
  <div class="lr-lock" id="lrLockLayer" hidden><button type="button" id="lrUnlock">Hold to unlock</button></div>`;
  document.body.append(live);
  live.querySelector('.lr-min').onclick=()=>{hiddenByUser=true;live.hidden=true;document.body.classList.remove('lr-open');};
  $('lrPause').onclick=()=>{const st=window.strideLiveRun?.state();if(!st)return;(st.running?$('liveRunPause'):$('liveRunStart'))?.click();};
  $('lrEnd').onclick=()=>{$('lrEndSheet').hidden=false;};
  $('lrAskPause').onclick=()=>{$('liveRunPause')?.click();$('lrStopAsk').hidden=true;hist=[];};$('lrAskNo').onclick=()=>{$('lrStopAsk').hidden=true;snoozeUntil=Date.now()+180000;hist=[];};
  $('lrBack').onclick=()=>{$('lrEndSheet').hidden=true;};$('lrDiscard').textContent='Discard (can’t be undone)';
  $('lrFinish').onclick=()=>{$('liveRunFinish')?.click();closeLive();};
  $('lrDiscard').onclick=()=>{const c=window.confirm;window.confirm=()=>true;try{$('liveRunDiscard')?.click();}finally{window.confirm=c;}setTimeout(()=>{if(!window.strideLiveRun?.isActive())closeLive();},300);};
  $('lrLock').onclick=()=>{locked=true;$('lrLockLayer').hidden=false;};
  let t=null;const u=$('lrUnlock');const down=()=>{u.textContent='Keep holding…';t=setTimeout(()=>{locked=false;$('lrLockLayer').hidden=true;u.textContent='Hold to unlock';},900);};const up=()=>{clearTimeout(t);if(locked)u.textContent='Hold to unlock';};
  u.addEventListener('pointerdown',down);u.addEventListener('pointerup',up);u.addEventListener('pointerleave',up);
  return live;
}
function openLive(){buildLive();$('lrPill')&&($('lrPill').hidden=true);hiddenByUser=false;live.hidden=false;document.body.classList.add('lr-open');drawLive();}
function closeLive(){if(!live)return;live.hidden=true;$('lrEndSheet').hidden=true;document.body.classList.remove('lr-open');}
function drawRoute(route){
  const svg=$('lrMap');if(!svg)return;
  let g='<defs><pattern id="lrg" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M20 0H0V20" fill="none" stroke="var(--soft)" stroke-width="1"/></pattern></defs><rect width="300" height="150" fill="url(#lrg)"/>';
  if(route.length>2){const sm=route.map((r,i)=>{if(i===0||i===route.length-1)return r;const w=route.slice(Math.max(0,i-2),i+3);return [w.reduce((n,x)=>n+x[0],0)/w.length,w.reduce((n,x)=>n+x[1],0)/w.length];});route=sm;}
  if(route.length>1){
    const lats=route.map(r=>r[0]),lons=route.map(r=>r[1]),mlat=(Math.max(...lats)+Math.min(...lats))/2,k=Math.cos(mlat*Math.PI/180);
    const xs=lons.map(l=>l*k),minx=Math.min(...xs),maxx=Math.max(...xs),miny=Math.min(...lats),maxy=Math.max(...lats);
    const MIN=0.0035,sc=Math.min(260/Math.max(maxx-minx,MIN),110/Math.max(maxy-miny,MIN/2)),ox=150-(minx+maxx)/2*sc,oy=75+(miny+maxy)/2*sc;
    const pts=route.map((r,i)=>[(xs[i]*sc+ox).toFixed(1),(oy-r[0]*sc).toFixed(1)]);
    g+='<polyline points="'+pts.map(p=>p.join(',')).join(' ')+'" fill="none" stroke="var(--accent)" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>';
    g+='<circle cx="'+pts[0][0]+'" cy="'+pts[0][1]+'" r="6" fill="none" stroke="var(--accent)" stroke-width="3"/><circle cx="'+pts.at(-1)[0]+'" cy="'+pts.at(-1)[1]+'" r="8" fill="var(--accent)"/>';
  }else g+='<text x="150" y="80" text-anchor="middle" fill="var(--muted)" font-size="13">Your route will draw here</text>';
  svg.innerHTML=g;
}
let lastRouteLen=-1,hist=[],snoozeUntil=0;
function drawLive(){
  const st=window.strideLiveRun?.state();
  let pill=$('lrPill');if(!pill){pill=el('button',{type:'button',id:'lrPill',hidden:true});pill.onclick=openLive;document.body.append(pill);}
  pill.hidden=!st||!(live&&live.hidden);if(st&&!pill.hidden)pill.textContent=(/walk/i.test(st.type)?'Walk':'Run')+(st.running?' in progress':' paused')+' · '+(st.metres/1609.344).toFixed(2)+' mi · '+clock(st.seconds)+'  ›';
  if(!live)return;
  if(!st){if(!live.hidden)closeLive();return;}
  if(live.hidden&&!hiddenByUser&&st.running)openLive();
  if(live.hidden)return;
  const mi=st.metres/1609.344,walk=/walk/i.test(st.type);
  $('lrTitle').textContent=(walk?'Walk':'Run')+(st.running?'':' · paused');
  $('lrDist').textContent=st.mode==='gps'?mi.toFixed(2):'—';
  $('lrTime').textContent=clock(st.seconds);
  $('lrPace').textContent=st.running?($('liveRunPace')?.textContent||'—'):'—';
  $('lrAvg').textContent=mi>0.02?pace(st.seconds/mi):'—';
  $('lrHr').textContent=$('liveRunHeart')?.textContent||'—';
  const kg=window.strideEnergy?.weight(db,window.cloudRecordOwner?.()||'browser',day())?.kg||70;
  $('lrCal').textContent=mi>0.05?String(Math.round((walk?.5:1)*kg*mi*1.609)):'—';
  $('lrPause').textContent=st.running?'❚❚':'▶';$('lrPause').setAttribute('aria-label',st.running?'Pause':'Resume');
  const gps=$('lrGps');gps.classList.toggle('ok',st.mode==='gps'&&st.running);gps.lastChild.textContent=st.mode==='gps'?(st.running?' GPS':' Paused'):' Treadmill';
  $('lrSplitN').textContent=String(st.splits.length);
  const sp=$('lrSplits');sp.replaceChildren();let prev=0;const durs=st.splits.map(s=>{const d=s-prev;prev=s;return d;});const fast=Math.min(...durs),slow=Math.max(...durs);
  durs.slice(-5).forEach((d,i,a)=>{const n=st.splits.length-a.length+i+1;const w=slow===fast?80:40+60*(slow-d)/(slow-fast);sp.append(el('div',{className:'lr-split'},[el('span',{textContent:'Mile '+n}),el('i',{style:'width:'+w+'%'}),el('b',{textContent:pace(d)})]));});
  $('lrStatus').textContent=$('liveRunStatus')?.textContent||'';
  // Stopped? Offer to pause (never pauses on its own).
  hist.push([Date.now(),st.metres]);hist=hist.filter(h=>Date.now()-h[0]<=40000);
  const ask=$('lrStopAsk');const first=hist[0];
  const stopped=st.mode==='gps'&&st.running&&st.seconds>60&&first&&Date.now()-first[0]>=30000&&(st.metres-first[1])<12;
  if(stopped&&!snoozeUntil||stopped&&Date.now()>snoozeUntil){ask.hidden=false;}else if(!stopped)ask.hidden=true;
  if(st.route.length!==lastRouteLen){lastRouteLen=st.route.length;drawRoute(st.route);}
}
setInterval(drawLive,1000);

/* ---------- Strength: rest timer after each ticked set, progress bar ---------- */
let restEnd=0,restBox=null,restStored=()=>{try{return Number(localStorage.getItem('stride-rest-sec'))||0;}catch{return 0;}},restBase=()=>restStored()||(window.strideIsOlder?.()?60:30);
function restUI(){
  if(restBox)return restBox;
  restBox=el('div',{id:'restTimer',hidden:true,role:'status'});
  restBox.innerHTML='<small>Rest</small><b id="restLeft">0:30</b><div><button type="button" data-d="-15">−15 s</button><button type="button" data-d="skip">Skip</button><button type="button" data-d="15">+15 s</button></div>';
  restBox.addEventListener('click',e=>{const d=e.target.closest('button')?.dataset.d;if(!d)return;if(d==='skip'){restEnd=0;}else{restEnd+=Number(d)*1000;const nb=Math.max(10,Math.min(300,restBase()+Number(d)));try{localStorage.setItem('stride-rest-sec',String(nb));}catch{}}tickRest();});
  document.body.append(restBox);return restBox;
}
function tickRest(){const b=restUI(),left=(restEnd-Date.now())/1000;if(left<=0){b.hidden=true;if(restEnd&&left>-1){try{navigator.vibrate?.(200);}catch(e){}}restEnd=0;return;}b.hidden=false;$('restLeft').textContent=clock(left);}
setInterval(()=>{if(restEnd){if(!window.strideSessionTracker?.isActive?.()){restEnd=0;}tickRest();}},250);window.addEventListener('stride-session-end',()=>{restEnd=0;tickRest();});
document.addEventListener('change',e=>{const c=e.target;if(c.type!=='checkbox'||!c.checked||!c.closest('#sessionTracker'))return;if(!/completed .* set/i.test(c.getAttribute('aria-label')||''))return;restEnd=Date.now()+restBase()*1000;tickRest();});

window.strideRepeatSheet=()=>repeatSheet();function repeatSheet(){
  let d=$('repeat6');if(!d){d=el('dialog',{id:'repeat6',className:'v6-sheet'});document.body.append(d);}
  const ws=(db.workouts||[]).filter(w=>w&&w.date).slice().sort((a,b)=>b.date.localeCompare(a.date)).slice(0,25);
  const close=el('button',{type:'button',className:'v6-sheetx','aria-label':'Close',textContent:'✕'});close.onclick=()=>d.close();
  d.replaceChildren(el('div',{className:'v6-sheethead'},[el('h2',{textContent:'Repeat a workout'}),close]));
  if(!ws.length){d.append(el('p',{className:'v6-sub',textContent:'No workouts yet. Once you log or finish one, it shows up here to repeat.'}));}
  const ic=t=>/run/i.test(t)?'run':/walk/i.test(t)?'walk':/core/i.test(t)?'core':/recover|stretch|mobil/i.test(t)?'leaf':/bike|swim/i.test(t)?'run':'dumb';
  ws.forEach(w=>{const t=w.session?.title||w.type||'Workout';const bits=[new Date(w.date+'T12:00').toLocaleDateString(undefined,{weekday:'short',month:'short',day:'numeric'})];if(w.miles)bits.push(w.miles+' mi');if(w.minutes)bits.push(Math.round(w.minutes)+' min');if(w.session?.exercises?.length)bits.push(w.session.exercises.length+' exercises');
    let act,lab;
    if(w.session?.exercises?.length){lab='Repeat';act=()=>{d.close();const tr=$('sessionTracker');btnByText(tr,/repeat workout/i)?.click();setTimeout(()=>{const sel=$('repeatWorkoutSelect');if(sel){sel.value=w.id;btnByText(tr,/start repeat/i)?.click();}},80);};}
    else if(/run|walk/i.test(w.type)){lab='Start';act=()=>{d.close();startRun(/walk/i.test(w.type)?'walk':'run');};}
    else{lab='Log again';act=()=>{const c={...w,date:(()=>{const n=new Date();return n.getFullYear()+'-'+String(n.getMonth()+1).padStart(2,'0')+'-'+String(n.getDate()).padStart(2,'0');})()};delete c.id;delete c.session;delete c.healthUuid;if(c.source==='apple-health')c.source='manual';db.workouts.push(c);if(typeof save==='function'&&save()){render();b.textContent='✓ Logged';b.disabled=true;}else db.workouts.pop();};}
    const b=el('button',{type:'button',className:'rp6-go',textContent:lab});b.onclick=act;
    d.append(el('div',{className:'rp6-row'},[el('span',{className:'rp6-ic'},[icon(ic(w.type||t),20)]),el('span',{className:'rp6-t'},[el('b',{textContent:t}),el('small',{textContent:bits.join(' · ')})]),b]));});
  if(!$('rp6css')){const st=el('style',{id:'rp6css'});st.textContent='#repeat6 .rp6-row{display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid var(--soft)}#repeat6 .rp6-row:last-child{border:0}.rp6-ic{width:40px;height:40px;border-radius:12px;display:grid;place-items:center;color:var(--accent);background:color-mix(in srgb,var(--accent) 15%,var(--card));flex:none}.rp6-t{flex:1;min-width:0}.rp6-t b{display:block;font-size:14.5px}.rp6-t small{color:var(--muted);font-size:12.5px}.rp6-go{width:auto!important;margin:0!important;padding:7px 12px!important;font-size:13px!important;font-weight:700;border:1px solid var(--accent)!important;color:var(--accent)!important;background:none!important;border-radius:10px!important;min-height:0!important}';document.head.append(st);}
  d.showModal();
}
function focusExercise(){
  const tr=$('sessionTracker');if(!tr||!window.strideSessionTracker?.isActive?.())return;
  const cards=[...tr.querySelectorAll('details.exercise')];if(!cards.length)return;
  const done=c=>{const b=[...c.querySelectorAll('input[type=checkbox][aria-label^="Completed"]')];return b.length&&b.every(x=>x.checked);};
  let cur=cards.find(c=>!done(c))||cards.at(-1);
  if(tr.dataset.cur!==cur.dataset.exerciseIndex){tr.dataset.cur=cur.dataset.exerciseIndex;cur.open=true;cards.forEach(c=>{if(c!==cur)c.open=false;});}
  cards.forEach((c,i)=>{c.classList.toggle('v6-cur',c===cur);c.classList.toggle('v6-done',done(c)&&c!==cur);c.classList.toggle('v6-nextup',!done(c)&&c!==cur);let tag=c.querySelector('.v6-extag');if(c===cur){if(!tag){tag=el('p',{className:'v6-extag'});c.prepend(tag);}tag.textContent='EXERCISE '+(i+1)+' OF '+cards.length;}else tag?.remove();});
  const first=cards.find(c=>c.classList.contains('v6-nextup'));cards.forEach(c=>c.classList.toggle('v6-nexthead',c===first));
}
function compactSets(){
  document.querySelectorAll('#sessionTracker details.exercise fieldset:not(.v6-set)').forEach(f=>{f.classList.add('v6-set');f.removeAttribute('style');
    const ins=f.querySelectorAll('input:not([type=checkbox])');if(ins[0])ins[0].placeholder=(ins[0].getAttribute('aria-label')==='Seconds to hold'||ins[0].closest('.ts6-row'))?'Seconds':'Reps';if(ins[1])ins[1].placeholder='Load';
    const rm=[...f.querySelectorAll('button')].find(b=>/remove set/i.test(b.textContent));if(rm){rm.textContent='✕';rm.setAttribute('aria-label','Remove set');rm.classList.add('v6-rm');}
    const ck=f.querySelector('input[type=checkbox]');if(ck){const l=ck.closest('label');l?.classList.add('v6-ck');const sync=()=>f.classList.toggle('v6-setdone',ck.checked);ck.addEventListener('change',sync);sync();}
    const legend=f.querySelector('legend');if(legend){f.prepend(Object.assign(document.createElement('span'),{className:'v6-setno',textContent:legend.textContent.replace('Set ','')}));legend.classList.add('v6-srlegend');}
  });
}
setInterval(compactSets,400);
setInterval(focusExercise,600);
function sessionProgress(){
  const tr=$('sessionTracker');if(!tr)return;let bar=$('sessionProgress');
  const boxes=[...tr.querySelectorAll('input[type=checkbox][aria-label^="Completed"]')];
  if(!boxes.length){bar?.remove();return;}
  if(!bar){bar=el('div',{id:'sessionProgress'},[el('i')]);tr.prepend(bar);}
  bar.firstChild.style.width=Math.round(boxes.filter(b=>b.checked).length/boxes.length*100)+'%';
}
setInterval(sessionProgress,700);

/* ---------- Train · Today ---------- */
function weekDays(){const d=new Date(),mon=new Date(d);mon.setDate(d.getDate()-((d.getDay()+6)%7));return [...Array(7)].map((_,i)=>{const x=new Date(mon);x.setDate(mon.getDate()+i);return x;});}
function buildToday(){
  const v=$('trainingView-today');if(!v||$('trainToday6'))return;
  const box=el('div',{id:'trainToday6'});v.prepend(box);
  const tr=$('liveRunTracker');if(tr){tr.open=false;const s=tr.querySelector('summary');if(s)s.textContent='Run & walk settings · treadmill, heart rate';}
  const wk=$('trainingWeek');if(wk){const s=wk.querySelector('summary');if(s)s.textContent='Your week · browse another day';}
}
function drawToday(){
  const box=$('trainToday6');if(!box||typeof db==='undefined')return;
  const active=window.strideSessionTracker?.isActive?.();
  box.hidden=!!active;$('todayTraining')&&($('todayTraining').hidden=true);
  const st=$('sessionTracker');if(st)st.classList.toggle('v6-idle',!active);
  if(active)return;
  const t=day(),idx=(new Date().getDay()+6)%7,p=(typeof plan!=='undefined'&&plan[idx])||['','Choose your schedule',[]],noPlan=/choose your schedule/i.test(p[1]),isRun=/run|walk/i.test(p[1]);
  const next=(typeof plan!=='undefined')?[1,2,3,4,5,6].map(o=>({o,p:plan[(idx+o)%7]})).find(x=>x.p&&!/rest|choose your schedule|recovery/i.test(x.p[1])):null;
  const logged=new Set(db.workouts.map(w=>w.date)),week=weekDays();
  const streak=(()=>{let n=0;const d=new Date();for(;;){if(logged.has(day(d))){n++;d.setDate(d.getDate()-1);}else if(n===0&&day(d)===t){d.setDate(d.getDate()-1);}else break;}return n;})();
  box.replaceChildren();
  const selT=window.strideSelDay&&window.strideSelDay!==t?window.strideSelDay:t;box.append(window.strideWeekStrip?window.strideWeekStrip(selT):el('div'));
  if(selT!==t){const sd=new Date(selT+'T12:00'),sp=plan[(sd.getDay()+6)%7]||['','Choose your schedule',[]],ws=db.workouts.filter(w=>w.date===selT);
    const c=el('div',{className:'card v6-card'},[el('div',{className:'t6-tag',textContent:(selT<t?'LOOKING BACK · ':'COMING UP · ')+sd.toLocaleDateString(undefined,{weekday:'long',month:'short',day:'numeric'}).toUpperCase()})]);
    if(ws.length)ws.forEach(w=>c.append(el('h3',{className:'v6-h3',textContent:w.type||'Workout'}),el('p',{className:'v6-sub',textContent:[Number(w.miles)?Number(w.miles).toFixed(2)+' mi':'',Number(w.minutes)?Math.round(w.minutes)+' min':''].filter(Boolean).join(' · ')||'Logged'})));
    else c.append(el('h3',{className:'v6-h3',textContent:/choose your schedule/i.test(sp[1])?(selT<t?'Nothing logged':'Nothing planned yet'):(selT<t?'Nothing logged · planned '+sp[1]:sp[1])}),el('p',{className:'v6-sub',textContent:(sp[2]||[]).slice(0,3).join(' · ')}));
    if(selT<t&&!ws.length){const r=el('button',{type:'button',className:'v6-ghost',textContent:'Log a workout for this day'});r.onclick=()=>{show('log');const d=$('workoutDate');if(d)d.value=selT;};c.append(r);}
    const back=el('button',{type:'button',className:'v6-start',textContent:'Back to today'});back.onclick=()=>{window.strideSelDay=null;render();};c.append(back);box.append(c);return;}
  if(streak>1)box.append(el('p',{className:'t6-streak',textContent:streak+'-day streak'}));
  const hero=el('div',{className:'card v6-card'});
  if(noPlan){
    hero.append(el('div',{className:'t6-tag',textContent:'TODAY'}),el('h3',{className:'v6-h3',textContent:'Pick today’s workout'}),el('p',{className:'v6-sub',textContent:'Tell us your time, equipment and goal and we’ll build it.'}));
    const b=el('button',{type:'button',className:'v6-start'},[icon('spark',16),document.createTextNode(' Plan my workout')]);b.onclick=()=>{btnByText($('sessionTracker'),/plan my workout/i)?.click();};
    const s=el('button',{type:'button',className:'v6-ghost',textContent:'Set my weekly schedule'});s.onclick=()=>window.strideOpenPrefs?.();
    hero.append(b,s);
  }else{
    hero.append(el('div',{className:'t6-tag'},[el('i'),document.createTextNode('TODAY · '+(isRun?'ENDURANCE':/core/i.test(p[1])?'CORE':/rest|recovery/i.test(p[1])?'RECOVERY':'STRENGTH'))]));
    const route=document.createElementNS(NS,'svg');route.setAttribute('viewBox','0 0 110 44');route.setAttribute('class','v6-route');route.innerHTML='<path d="M2 34 C18 6, 30 6, 42 26 S 64 44, 76 20 S 98 4, 108 14" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/><circle cx="108" cy="14" r="4" fill="currentColor"/>';
    hero.append(el('div',{className:'v6-wk'},[el('div',{},[el('h3',{className:'v6-h3',textContent:p[1]}),el('p',{className:'v6-sub',textContent:(p[2]||[]).slice(0,2).join(' · ')})]),route]));
    if(isRun){
      const walk=/walk/i.test(p[1]);
      const b=el('button',{type:'button',className:'v6-start',textContent:'Start '+(walk?'walk':'run')+' →'});b.onclick=()=>startRun(walk?'walk':/quality/i.test(p[1])?'quality':'run');hero.append(b);
      if(window.Capacitor?.isNativePlatform?.()){const w=el('button',{type:'button',className:'v6-ghost'},[icon('watch',18),document.createTextNode(' Start on Apple Watch')]);w.onclick=()=>{const wb=btnByText(document,/start on (apple )?watch/i)||$('watchStart');if(wb)wb.click();else{const tr=$('liveRunTracker');if(tr){tr.open=true;tr.scrollIntoView({behavior:'smooth'});}}};hero.append(w);}
    }else{
      const b=el('button',{type:'button',className:'v6-start'},[icon('play',16),document.createTextNode(' Start workout')]);b.onclick=()=>{btnByText($('sessionTracker'),/plan my workout/i)?.click();};hero.append(b);
    }
    const wu=el('button',{type:'button',className:'t6-link',textContent:'Warm up first · 5 min'});wu.onclick=()=>window.strideOpenStretch?.(isRun?'before running':/lower|leg/i.test(p[1])?'warm leg':/upper/i.test(p[1])?'warm upper':'warm strength');hero.append(wu);
  }
  box.append(hero);

  box.append(el('h3',{className:'t6-sec',textContent:'Quick start'}));
  const qs=el('div',{className:'t6-qs'});
  [['run','Run',()=>startRun('run')],['walk','Walk',()=>startRun('walk')],['dumb','Strength',()=>btnByText($('sessionTracker'),/plan my workout/i)?.click()],['core','Core',()=>window.strideOpenPlan?.('coreChoices')]].forEach(([i,l,f])=>{const b=el('button',{type:'button'},[icon(i,22),el('span',{textContent:l})]);b.onclick=f;qs.append(b);});
  box.append(qs);
  box.append(el('h3',{className:'t6-sec',textContent:'Make it yours'}));
  const mk=(i,t,s,re)=>{const b=el('button',{type:'button',className:'t6-mk'},[icon(i,22),el('span',{},[el('b',{textContent:t}),el('small',{textContent:s})]),icon('chev',16)]);b.onclick=()=>btnByText($('sessionTracker'),re)?.click();return b;};
  box.append(el('div',{className:'t6-two'},[mk('spark','Build my workout','Built around your goals',/plan my workout/i),(()=>{const b=mk('redo','Repeat workout','From your history',/repeat workout/i);b.onclick=repeatSheet;return b;})()]),mk('plus','Custom session','Build it set by set',/custom session/i));
  if(next&&next.p){const names=['','Tomorrow'];const dn=next.o===1?'Tomorrow':next.p[0];const u=el('button',{type:'button',className:'t6-mk t6-next'},[icon(/run|walk/i.test(next.p[1])?'run':/core/i.test(next.p[1])?'core':/rest|recover|mobil|stretch/i.test(next.p[1])?'leaf':'dumb',22),el('span',{},[el('small',{textContent:'UP NEXT'}),el('b',{textContent:next.p[1]})]),el('em',{textContent:dn+' ›'})]);u.onclick=()=>{const w=$('trainingWeek');if(w){w.open=true;w.scrollIntoView({behavior:'smooth'});}};box.append(u);}
}

/* ---------- Train · Plan: tiles first; a section only appears when you pick it ---------- */
function moveDevices(){
  const v=$('trainingView-plan');if(!v)return;let d=$('devicesFold');
  if(!d){d=el('details',{id:'devicesFold',className:'card'},[el('summary',{textContent:'Devices'})]);v.append(d);}
  const tr=$('liveRunTracker');if(tr&&tr.parentElement!==d){d.append(tr);tr.open=true;}
  const w=[...document.querySelectorAll('details.card')].find(x=>/^apple watch workout/i.test(x.querySelector(':scope>summary')?.textContent||''));if(w&&w.parentElement!==d){d.prepend(w);}
  const wk=$('trainingWeek');if(wk)wk.hidden=true;
}
function buildPlan(){
  moveDevices();setInterval(moveDevices,1500);
  const v=$('trainingView-plan');if(!v||$('planTiles6'))return;
  const tiles=[['run','Running plans','5K to ultra','runningGoalPlanner'],['core','Core routines','Standing, bed, floor & more','coreChoices'],['core','Bodyweight skills','Plank, push-ups, pull-ups & more','progressionChoices'],['bars','Starting weights','Find your starting point','startingWeights'],['dumb','Build your workout','Time, equipment & goal','plannerFold'],['cam','Equipment photo','Snap a machine, learn it','equipmentPhoto'],['watch','Devices','Apple Watch · treadmill · heart rate','devicesFold']];
  const head=el('h3',{className:'t6-sec',textContent:'Explore plans'}),g=el('div',{id:'planTiles6',className:'t6-grid'});
  const back=el('button',{type:'button',className:'t6-back',textContent:'‹ All plans',hidden:true});
  const sections=()=>[...v.children].filter(c=>c!==head&&c!==g&&c!==back);
  const openPlan=id=>{let d=$(id);if(!d&&id==='plannerFold')d=$('trainingPlanner');if(!d)return;const top=sections().find(c=>c===d||c.contains(d));
    sections().forEach(c=>c.hidden=c!==top);g.hidden=true;head.hidden=true;back.hidden=false;
    if(d.tagName==='DETAILS')d.open=true;d.closest('details')&&(d.closest('details').open=true);if(top&&top.tagName==='DETAILS')top.open=true;
    const sm=top?.querySelector(':scope>summary');if(sm)sm.hidden=true;
    window.scrollTo({top:0,behavior:'smooth'});};
  const closePlan=()=>{sections().forEach(c=>{c.hidden=!['builder6','schedule6'].includes(c.id);const sm=c.querySelector(':scope>summary');if(sm)sm.hidden=false;});g.hidden=false;head.hidden=false;back.hidden=true;};
  tiles.forEach(([i,t,s,id])=>{const b=el('button',{type:'button',className:'t6-tile'},[icon(i,24),el('b',{textContent:t}),el('small',{textContent:s})]);b.onclick=()=>openPlan(id);g.append(b);});
  back.onclick=closePlan;
  v.prepend(back,head,g);closePlan();
  window.strideOpenPlan=id=>{window.dispatchEvent(new CustomEvent('stride-train-view',{detail:'plan'}));openPlan(id);};
  // Leaving the Plan tab resets it to the tiles.
  document.querySelectorAll('#trainingTabs button').forEach(b=>b.addEventListener('click',()=>{if(!/plan/i.test(b.textContent))closePlan();}));
  window.addEventListener('stride-plan-workout',()=>openPlan('plannerFold'));
}
/* ---------- Train · Plan: Build your workout + weekly schedule (mock-up) ---------- */
function buildBuilder(){
  const v=$('trainingView-plan'),form=$('trainingPlannerForm');if(!v||!form||$('builder6'))return;
  const g=$('planTiles6');if(!g)return;
  const card=el('div',{id:'builder6',className:'card v6-card'});
  const chipsRow=(opts,multi,get,set)=>{const r=el('div',{className:'v6-chips'});const draw=()=>{r.replaceChildren();opts.forEach(([v,l])=>{const on=get().includes(v);const b=el('button',{type:'button',className:on?'on':'',textContent:(on&&multi?'✓ ':'')+l});b.onclick=()=>{set(v);draw();};r.append(b);});};draw();r.redraw=draw;return r;};
  // What you want
  const req=$('trainRequest');const inp=el('input',{id:'b6req',placeholder:'What would you like to train? e.g. upper body, extra back work',value:req?.value||''});inp.oninput=()=>applyFocus?.();
  // Focus (Upper + Back together = upper body with back priority)
  let focus=new Set([$('trainFocus')?.value==='upperback'?'upper':$('trainFocus')?.value||'full']);if($('trainFocus')?.value==='upperback')focus.add('back');
  const NAMES={full:'full body',upper:'upper body',lower:'lower body',back:'back',core:'core',cardio:'running / cardio',mobility:'mobility'};
  const applyFocus=()=>{const f=$('trainFocus');if(!f)return;const has=x=>focus.has(x);const list=[...focus];
    f.value=has('upper')&&has('back')?'upperback':list.length>1&&!has('full')&&(has('upper')||has('lower'))&&list.length>2?'full':list[0]||'full';f.dispatchEvent(new Event('change',{bubbles:true}));
    if(req){const base=inp.value.trim();req.value=(list.length>1?'Focus on '+list.map(x=>NAMES[x]).join(', ')+'. ':'')+base;}};
  const fr=chipsRow([['full','Full body'],['upper','Upper'],['lower','Lower'],['back','Back'],['core','Core'],['cardio','Run / cardio'],['mobility','Mobility']],true,()=>[...focus],x=>{if(focus.has(x)){focus.delete(x);}else{if(x==='full')focus.clear();else focus.delete('full');focus.add(x);}if(!focus.size)focus.add('full');applyFocus();fr.redraw();});
  // Time + level
  const mins=$('trainMinutes'),lvl=$('trainLevel');
  const timeSel=el('select',{id:'b6time','aria-label':'Workout length'});[15,20,30,45,60,75,90].forEach(m=>timeSel.append(el('option',{value:String(m),textContent:m+' min'})));timeSel.value=String(mins?.value||30);if(!timeSel.value)timeSel.value='30';timeSel.onchange=()=>{if(mins){mins.value=timeSel.value;mins.dispatchEvent(new Event('input',{bubbles:true}));}};
  const lvlSel=el('select',{id:'b6lvl','aria-label':'Experience level'});[['beginner','Beginner'],['intermediate','Intermediate'],['advanced','Advanced']].forEach(([v,l])=>lvlSel.append(el('option',{value:v,textContent:l})));lvlSel.value=lvl?.value||'beginner';lvlSel.onchange=()=>{if(lvl){lvl.value=lvlSel.value;lvl.dispatchEvent(new Event('change',{bubbles:true}));}};
  const twoSel=el('div',{className:'v6-kgrid'},[el('label',{className:'v6-kcell',htmlFor:'b6lvl'},[el('small',{textContent:'Experience'}),lvlSel]),el('label',{className:'v6-kcell',htmlFor:'b6time'},[el('small',{textContent:'Duration'}),timeSel])]);
  // Equipment
  const eq=$('trainEquipment'),ceq=$('trainCustomEquipment');
  const er=chipsRow([['Bodyweight only','Bodyweight'],['Dumbbells and a bench','Dumbbells & bench'],['Full gym: machines, cables, dumbbells, barbell, treadmill','Full gym'],['custom','My equipment']],false,()=>[eq?.value],x=>{if(eq){eq.value=x;eq.dispatchEvent(new Event('change',{bubbles:true}));}myEq.hidden=x!=='custom';});
  const myEq=el('div',{hidden:eq?.value!=='custom'});const myIn=el('input',{placeholder:'e.g. Lat pulldown; chest press; cable machine',value:ceq?.value||''});myIn.oninput=()=>{if(ceq){ceq.value=myIn.value;ceq.dispatchEvent(new Event('input',{bubbles:true}));}};
  const snap=el('button',{type:'button',className:'v6-linkbtn',textContent:'Not sure what it is? Take a picture'});snap.onclick=()=>window.strideOpenPlan?.('equipmentPhoto');myEq.append(myIn,snap);
  // How are you feeling / limits
  const lim=$('trainLimitations');const feel=el('details',{className:'v6-feelrow'},[el('summary',{},[icon('leaf',20),el('span',{},[el('b',{textContent:'How are you feeling today?'}),el('small',{textContent:'Soreness, pain or movements to avoid · adjusts the plan'})])])]);
  const limIn=el('textarea',{placeholder:'e.g. sore legs; avoid overhead movements; no jumping',value:lim?.value||''});limIn.oninput=()=>{if(lim){lim.value=limIn.value;lim.dispatchEvent(new Event('input',{bubbles:true}));}};feel.append(limIn);
  const ok=()=>{const bad=form.querySelector(':invalid');if(!bad)return true;const st=$('trainPlannerStatus');const map={trainCustomEquipment:[myIn,'Describe your equipment first (or pick Bodyweight, Dumbbells or Full gym).'],trainRequest:[inp,'Tell us what you’d like to train.'],trainMinutes:[timeSel,'Choose how long you have.']};const m=map[bad.id]||[null,'Please check: '+(form.querySelector('label[for='+bad.id+']')?.textContent||bad.id)];if(st)st.textContent=m[1];st?.scrollIntoView({behavior:'smooth',block:'center'});m[0]?.focus();return false;};
  const gen=el('button',{type:'button',className:'v6-start',textContent:'Generate workout'});gen.onclick=()=>{applyFocus();if(!ok())return;$('trainGenerate')?.click();setTimeout(()=>res.scrollIntoView({behavior:'smooth',block:'start'}),400);};
  const def=el('button',{type:'button',className:'v6-linkbtn',textContent:'Use a default routine instead'});def.onclick=()=>{applyFocus();if(!ok())return;$('trainDefault')?.click();setTimeout(()=>res.scrollIntoView({behavior:'smooth',block:'start'}),300);};
  const res=el('div',{id:'builder6Result'});['trainPlannerStatus','trainPlanResult','trainUsePlan','trainCancelPlan','trainCheckedStatus','trainCompletedMinutes','trainLogChecked'].forEach(id=>{const n=$(id);if(n)res.append(n);});
  setInterval(()=>{const n=$('trainCancelPlan');if(n&&n.parentElement!==res)res.append(n);const has=!!$('trainPlanResult')?.children.length;let cx=$('planClear6');if(has&&!window.strideSessionTracker?.isActive?.()){if(!cx){cx=el('button',{type:'button',id:'planClear6',className:'v6-ghost',textContent:'✕ Start over'});cx.onclick=()=>{$('trainPlanResult')?.replaceChildren();const st=$('trainPlannerStatus');if(st)st.textContent='';$('trainUsePlan')?.classList.add('hidden');card.scrollIntoView({behavior:'smooth',block:'start'});cx.remove();};}const up=$('trainUsePlan');let row=$('planRow6');if(!row){row=el('div',{id:'planRow6',className:'v6-planrow'});res.append(row);}if(up&&up.parentElement!==row)row.append(up);if(cx.parentElement!==row)row.append(cx);}else cx?.remove();['trainCheckedStatus','trainCompletedMinutes','trainLogChecked'].forEach(id=>{const x=$(id);if(x)x.classList.toggle('v6-gone',!has);});const lb=res.querySelector('label[for=trainCompletedMinutes]');if(lb)lb.classList.toggle('v6-gone',!has);},700);
  card.append(el('h3',{className:'t6-sec',textContent:'Build your workout',style:'margin-top:0'}),inp,el('small',{className:'v6-lbl',textContent:'Focus'}),fr,twoSel,el('small',{className:'v6-lbl',textContent:'Equipment'}),er,myEq,feel,gen,def,res);
  // Weekly schedule
  const sch=el('div',{id:'schedule6'});
  g.after(card,sch);
  // Hide the old planner tile and section (the builder replaces them)
  [...g.children].forEach(b=>{if(/build your workout/i.test(b.textContent))b.remove();});
  const ep=$('equipmentPhoto');if(ep){v.append(ep);ep.hidden=true;}
  const old=$('trainingPlanner');const oldTop=old&&[...v.children].find(c=>c===old||c.contains(old));if(oldTop)oldTop.classList.add('v6-gone');
  window.addEventListener('stride-plan-workout',()=>setTimeout(()=>{const back=v.querySelector('.t6-back');if(back&&!back.hidden)back.click();card.scrollIntoView({behavior:'smooth',block:'start'});inp.focus();},120));
  drawSchedule();
}
let schedAll=false;
function drawSchedule(){
  const sch=$('schedule6');if(!sch||typeof plan==='undefined')return;const idx=(new Date().getDay()+6)%7;
  const days=['MON','TUE','WED','THU','FRI','SAT','SUN'];
  const edit=el('button',{type:'button',className:'v6-linkbtn',textContent:'Edit'});edit.onclick=()=>window.strideOpenPrefs?.('schedule');
  sch.replaceChildren(el('div',{className:'v6-sechead'},[el('h3',{textContent:'Your weekly schedule'}),edit]));
  if(plan.every(x=>/choose your schedule/i.test(x[1]))){const b=el('button',{type:'button',className:'v6-ghost',textContent:'Set my weekly schedule'});b.onclick=()=>window.strideOpenPrefs?.();sch.append(b);return;}
  const order=[...Array(7)].map((_,o)=>(idx+o)%7).slice(0,schedAll?7:2);
  order.forEach(i=>{const p=plan[i];const ic=/run|walk/i.test(p[1])?'run':/upper|lower|strength|full/i.test(p[1])?'dumb':/core/i.test(p[1])?'core':/rest|recover|mobil/i.test(p[1])?'leaf':'dumb';sch.append(el('div',{className:'v6-sched'+(i===idx?' today':'')},[el('span',{className:'v6-day',textContent:days[i]}),icon(ic,18),el('b',{textContent:p[1]})]));});
  const more=el('button',{type:'button',className:'v6-linkbtn',textContent:schedAll?'Show less':'View full week ›'});more.onclick=()=>{schedAll=!schedAll;drawSchedule();};sch.append(more);
}

/* ---------- Train · Recovery: pick a type, then a routine ---------- */
const REC={warm:{t:'Warm-ups',s:'Before you train',i:'walk',m:n=>/^warm-up|before running/i.test(n)},cool:{t:'Cool-downs',s:'After strength & core',i:'leaf',m:n=>/^after (a strength|upper|leg|core)/i.test(n)},mob:{t:'Mobility',s:'Rest-day movement',i:'core',m:n=>/mobility|quick upper/i.test(n)},run:{t:'Post-run stretch',s:'Calves, hips & hamstrings',i:'run',m:n=>/after running/i.test(n)},breath:{t:'Breathing',s:'Slow things down',i:'wind',m:()=>false}};
const BREATH=[['Calm down · 4-7-8',[['Breathe in',4],['Hold',7],['Breathe out',8]],4,'Settles your body after a hard session or before sleep.'],['Box breathing · 4-4-4-4',[['Breathe in',4],['Hold',4],['Breathe out',4],['Hold',4]],6,'Steadies you before a run or a heavy set.'],['Recovery breaths · 5 min',[['Breathe in',4],['Breathe out',6]],30,'Long, easy exhales bring your heart rate down after training.']];
function buildRecovery(){
  const v=$('trainingView-recovery');if(!v||$('recHead6'))return;
  const sel=$('stretchRoutine'),card=sel?.closest('.card');if(!sel||!card)return;
  const head=el('div',{id:'recHead6'},[el('h3',{className:'t6-sec',textContent:'Explore recovery'})]);
  const g=el('div',{className:'t6-grid'});
  const back=el('button',{type:'button',className:'t6-back',textContent:'‹ All recovery',hidden:true});
  const chips=el('div',{className:'v6-chips',id:'recChips'});
  const lab=card.querySelector('label[for=stretchRoutine]');
  sel.classList.add('v6-hidden-select');if(lab)lab.hidden=true;sel.after(chips);
  const pick=name=>{sel.value=name;sel.dispatchEvent(new Event('change',{bubbles:true}));chips.querySelectorAll('button').forEach(b=>b.classList.toggle('on',b.dataset.v===name));};
  const bp=el('div',{id:'breathPanel',className:'card v6-card',hidden:true});let btimer=null;
  const stopB=()=>{clearTimeout(btimer);btimer=null;bp.querySelector('.br-go')&&(bp.querySelector('.br-go').textContent='Start');bp.classList.remove('br-run');const c=bp.querySelector('.br-circle');if(c){c.style.transform='scale(.6)';c.querySelector('b').textContent='Ready';c.querySelector('small').textContent='';}};
  const drawB=i=>{stopB();const [name,steps,rounds,why]=BREATH[i];bp.replaceChildren(el('h2',{textContent:'Breathing'}));const ch=el('div',{className:'v6-chips'});BREATH.forEach((x,k)=>{const b=el('button',{type:'button',textContent:x[0],className:k===i?'on':''});b.onclick=()=>drawB(k);ch.append(b);});
    const circle=el('div',{className:'br-circle'},[el('b',{textContent:'Ready'}),el('small')]);const go=el('button',{type:'button',className:'v6-start br-go',textContent:'Start'});
    go.onclick=()=>{if(btimer){stopB();return;}go.textContent='Stop';bp.classList.add('br-run');let r=0,s=0;const step=()=>{const [label,sec]=steps[s];circle.querySelector('b').textContent=label;circle.querySelector('small').textContent=sec+' sec · round '+(r+1)+' of '+rounds;circle.style.transitionDuration=sec+'s';circle.style.transform=/in/i.test(label)?'scale(1)':/out/i.test(label)?'scale(.6)':circle.style.transform;btimer=setTimeout(()=>{s++;if(s>=steps.length){s=0;r++;}if(r>=rounds){stopB();circle.querySelector('b').textContent='Well done';return;}step();},sec*1000);};step();};
    bp.append(ch,el('p',{className:'v6-sub',textContent:why}),circle,go,el('p',{className:'v6-legend',textContent:'Breathe through your nose if you can. Stop if you feel dizzy.'}));};
  card.after(bp);
  const open=(key,want)=>{if(key==='breath'){g.hidden=true;head.querySelector('h3').hidden=true;back.hidden=false;card.hidden=true;bp.hidden=false;drawB(0);window.scrollTo({top:0,behavior:'smooth'});return;}bp.hidden=true;stopB();const r=REC[key];const names=[...sel.options].map(o=>o.value).filter(n=>n&&r.m(n));chips.replaceChildren();
    names.forEach(n=>{const b=el('button',{type:'button',textContent:n.replace(/ · \d+ minutes?$/,'').replace(/^Warm-up · /,'')});b.dataset.v=n;b.onclick=()=>pick(n);chips.append(b);});
    const h2=card.querySelector('h2,h3');if(h2)h2.textContent=r.t;
    g.hidden=true;head.querySelector('h3').hidden=true;back.hidden=false;card.hidden=false;
    pick(names.find(n=>want&&n.toLowerCase().includes(want))||names[0]);window.scrollTo({top:0,behavior:'smooth'});};
  const close=()=>{g.hidden=false;head.querySelector('h3').hidden=false;back.hidden=true;card.hidden=true;bp.hidden=true;stopB();};
  Object.entries(REC).forEach(([k,r])=>{const b=el('button',{type:'button',className:'t6-tile'},[icon(r.i,24),el('b',{textContent:r.t}),el('small',{textContent:r.s})]);b.onclick=()=>open(k);g.append(b);});
  back.onclick=close;head.append(g);v.prepend(back,head);close();
  // Other buttons in the app ("Warm up first", cool-down after a workout) open the right routine.
  window.strideOpenStretch=key=>{const k=String(key||'').toLowerCase();window.dispatchEvent(new CustomEvent('stride-train-view',{detail:'recovery'}));
    const group=/run/.test(k)&&/after|post/.test(k)?'run':/before running|warm.*run/.test(k)?'warm':/warm|before/.test(k)?'warm':/mobility|rest/.test(k)?'mob':/after|cool/.test(k)?'cool':'warm';
    const want=/leg/.test(k)?'leg':/upper/.test(k)?'upper':/core/.test(k)?'core':/run/.test(k)?'running':/strength/.test(k)?'strength':'';open(group,want);};
  document.querySelectorAll('#trainingTabs button').forEach(b=>b.addEventListener('click',()=>{if(!/recovery/i.test(b.textContent))close();}));
  // "How are you feeling?" + today's pick (mock-up)
  const own=()=>window.cloudRecordOwner?.()||'browser',fk=()=>'stride-feel-'+day()+'-'+own();
  let feel={energy:'steady',sore:'none'};try{feel=Object.assign(feel,JSON.parse(localStorage.getItem(fk())||'{}'));}catch(e){}
  const top=el('div',{id:'recTop6'});v.insertBefore(top,head);
  const feelRow=(label,key,opts)=>{const r=el('div',{className:'v6-feel'},[el('span',{textContent:label})]);opts.forEach(([val,txt])=>{const b=el('button',{type:'button',textContent:txt,className:feel[key]===val?'on':''});b.onclick=()=>{feel[key]=val;try{localStorage.setItem(fk(),JSON.stringify(feel));}catch(e){}drawTop();};r.append(b);});return r;};
  const names=[...sel.options].map(o=>o.value).filter(Boolean),find=re=>names.find(n=>re.test(n));
  function pickRoutine(){
    const t=day(),y=(()=>{const d=new Date();d.setDate(d.getDate()-1);return day(d);})();
    const wt=db.workouts.filter(w=>w.date===t),wy=db.workouts.filter(w=>w.date===y);
    const w=wt.at(-1)||wy.at(-1),when=wt.length?'today':'yesterday';
    if(feel.sore==='moderate'||feel.energy==='low')return {name:find(/rest-day mobility/i),why:feel.sore==='moderate'?'YOU’RE SORE · GENTLE MOBILITY':'LOW ENERGY · KEEP IT GENTLE',group:'mob'};
    if(w){const ty=(w.type||'')+' '+(w.session?.title||'')+' '+(w.notes||'').slice(0,80);const lbl=/run/i.test(ty)?'run':/walk/i.test(ty)?'walk':/lower|leg/i.test(ty)?'lower body':/upper/i.test(ty)?'upper body':/core/i.test(ty)?'core':'workout';
      const n=/run|walk/i.test(ty)?find(/after running/i):/lower|leg/i.test(ty)?find(/after leg/i):/upper/i.test(ty)?find(/after upper/i):/core/i.test(ty)?find(/after core/i):find(/after a strength/i);
      return {name:n,why:'PICKED FOR TODAY · AFTER '+when.toUpperCase()+'’S '+lbl.toUpperCase(),group:/run|walk/i.test(ty)?'run':'cool'};}
    const idx=(new Date().getDay()+6)%7,pl=(typeof plan!=='undefined'&&plan[idx]?.[1])||'';
    if(/run|walk/i.test(pl))return {name:find(/before running/i),why:'PICKED FOR TODAY · BEFORE YOUR '+pl.toUpperCase(),group:'warm'};
    if(/upper|lower|leg|strength|full|core/i.test(pl))return {name:(/lower|leg/i.test(pl)?find(/before leg day/i):/upper/i.test(pl)?find(/before upper body/i):null)||find(/before a strength workout/i),why:'PICKED FOR TODAY · BEFORE YOUR '+pl.toUpperCase(),group:'warm'};
    return {name:find(/rest-day mobility/i),why:'PICKED FOR TODAY · REST-DAY MOVEMENT',group:'mob'};
  }
  function steps(name){const keep=sel.value;sel.value=name;sel.dispatchEvent(new Event('change',{bubbles:true}));const items=[...card.querySelectorAll('#stretchItems label, #stretchItems li')].map(x=>{const cb=x.querySelector('input[type=checkbox]');const txt=(x.textContent||'').split(/·|—/)[0].trim();return {txt,done:!!cb?.checked};}).filter(x=>x.txt);if(keep!==name){sel.value=keep;sel.dispatchEvent(new Event('change',{bubbles:true}));}return items;}
  function drawTop(){
    if(!card.hidden&&!bp.hidden){}top.replaceChildren(el('h3',{className:'t6-sec',textContent:'How are you feeling?',style:'margin-top:0'}),feelRow('Energy','energy',[['low','Low'],['steady','Steady'],['high','High']]),feelRow('Soreness','sore',[['none','None'],['mild','Mild'],['moderate','Moderate']]));
    const lim=el('button',{type:'button',className:'t6-mk'},[icon('plus',20),el('span',{},[el('b',{textContent:'Add pain or movement limits'}),el('small',{textContent:'Used when you build a workout'})]),icon('chev',16)]);lim.onclick=()=>{window.dispatchEvent(new CustomEvent('stride-train-view',{detail:'plan'}));setTimeout(()=>{const f=document.querySelector('#builder6 .v6-feelrow');if(f){f.open=true;f.scrollIntoView({behavior:'smooth',block:'center'});f.querySelector('textarea')?.focus();}},200);};top.append(lim);
    const pk=pickRoutine();if(!pk.name)return;const st=card.hidden?steps(pk.name):[];
    const mins=(pk.name.match(/(\d+) minutes?/)||[])[1];
    const c=el('div',{className:'card v6-card v6-pick'},[el('div',{className:'t6-tag',textContent:pk.why}),el('h3',{className:'v6-h3',textContent:pk.name.replace(/ · \d+ minutes?$/,'')}),el('p',{className:'v6-sub',textContent:(mins?mins+' min · ':'')+'Easy · No equipment'})]);
    if(st.length){const ch=el('div',{className:'v6-chips'});st.forEach(s=>ch.append(el('span',{className:'v6-kchip'+(s.done?' on':''),textContent:(s.done?'✓ ':'')+s.txt})));c.append(ch);}
    const nDone=st.filter(s=>s.done).length,all=st.length&&nDone===st.length;
    if(all){c.classList.add('v6-done');c.querySelector('.t6-tag').textContent='✓ RECOVERY DONE TODAY';c.querySelector('.v6-sub').textContent='Nice work. Your body will thank you tomorrow.';}
    else if(nDone){c.querySelector('.t6-tag').textContent=pk.why+' · '+nDone+' OF '+st.length+' DONE';}
    const go=el('button',{type:'button',className:all?'v6-ghost':'v6-start',textContent:all?'Do it again':nDone?'Continue recovery ▸':'Start recovery ▸'});go.onclick=()=>{open(pk.group,pk.name.toLowerCase().slice(0,14));setTimeout(()=>{sel.value=pk.name;sel.dispatchEvent(new Event('change',{bubbles:true}));card.querySelectorAll('#recChips button').forEach(b=>b.classList.toggle('on',b.dataset.v===pk.name));},50);};c.append(go);top.append(c);
  }
  const showTop=()=>{top.hidden=!g.hidden?false:true;};
  const o0=open;
  drawTop();setInterval(()=>{top.hidden=g.hidden;},400);
  window.addEventListener('stride-train-view',e=>{if(e.detail==='recovery')setTimeout(drawTop,50);});
  const r0=render;render=function(){r0();if(card.hidden)drawTop();};
  // Rest day tile
  const rest=el('button',{type:'button',className:'t6-tile'},[icon('moon',24),el('b',{textContent:'Rest day'}),el('small',{textContent:'Log a recovery day'})]);
  rest.onclick=()=>{const t=day();if(db.workouts.some(w=>w.date===t&&/rest day/i.test(w.notes||''))){rest.querySelector('small').textContent='✓ Logged for today';return;}db.workouts.push({date:t,type:'Recovery',miles:0,minutes:0,notes:'Rest day',energy:'',soreness:feel.sore==='none'?'None':feel.sore==='mild'?'Mild':'Sore'});if(save()){rest.querySelector('small').textContent='✓ Logged for today';render();}else db.workouts.pop();};
  g.append(rest);
}

const css=el('style');css.textContent=`
#trainingTabs{display:grid!important;grid-template-columns:repeat(3,1fr);gap:4px;padding:5px;background:var(--card);border:1px solid var(--soft);border-radius:14px;margin:12px 0}
#trainingTabs button{background:transparent!important;color:var(--muted)!important;margin:0!important;padding:10px 4px!important;border-radius:10px!important;border:0!important}
#trainingTabs button[aria-selected=true]{background:var(--accent)!important;color:var(--on-accent)!important}
#trainToday6 .card{margin:0 0 12px}
.t6-tag{font-size:11px;letter-spacing:.08em;font-weight:700;color:var(--muted);display:flex;align-items:center;gap:6px}.t6-tag i{width:8px;height:8px;border-radius:50%;background:var(--accent)}
.t6-link{display:block;margin:10px auto 0!important;background:transparent!important;color:var(--accent)!important;border:0!important;font-weight:600;font-size:14px;padding:4px!important}
.t6-streak{margin:-6px 0 10px;font-size:13px;color:var(--muted)}
.t6-sec{font-size:18px;font-weight:800;margin:18px 0 10px}
.t6-qs{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}
.t6-qs button{display:flex!important;flex-direction:column;align-items:center;gap:6px;background:var(--card)!important;color:var(--fg)!important;border:1px solid var(--soft)!important;border-radius:16px!important;padding:12px 4px!important;margin:0!important;font-size:13px;font-weight:600}.t6-qs svg{color:var(--accent)}
.t6-two{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:10px}
.t6-mk{display:flex!important;align-items:center;gap:10px;width:100%;text-align:left;background:var(--card)!important;color:var(--fg)!important;border:1px solid var(--soft)!important;border-radius:16px!important;padding:12px!important;margin:0!important}
.t6-mk>svg:first-child{color:var(--accent);flex:none}.t6-mk>span{flex:1;min-width:0}.t6-mk b{display:block;font-size:14px}.t6-mk small{display:block;color:var(--muted);font-size:11.5px;font-weight:500}.t6-mk>svg:last-child{color:var(--muted);flex:none}
.t6-next{margin-top:12px!important}.t6-next small{letter-spacing:.08em;font-weight:700!important}.t6-next em{font-style:normal;color:var(--muted);font-size:12.5px;white-space:nowrap}
#sessionTracker.v6-idle{display:none}
#sessionTracker details.exercise.v6-cur{border:2px solid var(--accent)!important;border-radius:18px;padding:12px 10px!important;margin:8px 0 14px!important}
.v6-extag{margin:0 0 4px;font-size:11px;letter-spacing:.08em;font-weight:700;color:var(--muted)}
#sessionTracker details.exercise.v6-cur>summary{font-size:20px;font-weight:800}
#sessionTracker details.exercise.v6-nextup,#sessionTracker details.exercise.v6-done{border:1px solid var(--soft)!important;border-radius:14px;padding:10px 12px!important;margin:6px 0!important;opacity:.85}
#sessionTracker details.exercise.v6-done>summary::after{content:'  ✓ done';color:var(--accent);font-weight:700;font-size:13px}
#sessionTracker details.exercise.v6-nexthead{margin-top:16px!important;position:relative}#sessionTracker details.exercise.v6-nexthead::before{content:'NEXT UP';position:absolute;top:-18px;left:2px;font-size:11px;letter-spacing:.08em;font-weight:700;color:var(--muted)}
#sessionTracker fieldset.v6-set{display:grid!important;grid-template-columns:18px minmax(0,1fr) minmax(0,1fr) 56px 34px 24px;gap:4px;align-items:center;border:0!important;border-bottom:1px solid var(--soft)!important;border-radius:0!important;margin:0!important;padding:8px 0!important}
#sessionTracker fieldset.v6-set legend.v6-srlegend{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)}#sessionTracker fieldset.v6-set{position:relative}.v6-setno{font-weight:800;font-size:15px;color:var(--muted);text-align:center}
#sessionTracker fieldset.v6-set label{font-size:0!important;margin:0!important;display:block}
#sessionTracker fieldset.v6-set label input,#sessionTracker fieldset.v6-set label select{font-size:16px!important;width:100%;margin:0!important;padding:9px 6px!important;min-height:0}
#sessionTracker fieldset.v6-set .v6-ck{display:grid!important;place-items:center}
#sessionTracker fieldset.v6-set .v6-ck input{width:30px!important;height:30px!important;margin:0!important}
#sessionTracker fieldset.v6-set .v6-rm{width:24px;height:24px;padding:0!important;margin:0!important;border-radius:50%!important;background:transparent!important;color:var(--muted)!important;border:1px solid var(--soft)!important;font-size:12px}
#sessionTracker fieldset.v6-set.v6-setdone{background:color-mix(in srgb,var(--accent) 12%,transparent);border-radius:10px!important}
#sessionProgress{height:6px;border-radius:4px;background:var(--soft);overflow:hidden;margin:0 0 12px}#sessionProgress i{display:block;height:100%;background:var(--accent);transition:width .3s}
#sessionTracker input[type=checkbox]{width:26px!important;height:26px!important;accent-color:var(--accent)}
#restTimer{position:fixed;left:50%;transform:translateX(-50%);bottom:calc(96px + env(safe-area-inset-bottom,0px));z-index:70;background:var(--card);color:var(--fg);border:1px solid var(--soft);border-radius:20px;padding:12px 18px;text-align:center;box-shadow:0 10px 30px rgba(0,0,0,.4);min-width:240px}
#restTimer small{color:var(--muted)}#restTimer b{display:block;font-size:36px;font-weight:800;font-variant-numeric:tabular-nums;line-height:1.1}
#restTimer div{display:flex;gap:8px;justify-content:center;margin-top:6px}#restTimer button{margin:0!important;padding:6px 12px!important;border-radius:999px!important;background:transparent!important;color:var(--fg)!important;border:1px solid var(--soft)!important;font-size:13px}
.br-circle{width:200px;height:200px;margin:18px auto;border-radius:50%;background:radial-gradient(circle,color-mix(in srgb,var(--accent) 55%,transparent),color-mix(in srgb,var(--accent) 15%,transparent));display:flex;flex-direction:column;align-items:center;justify-content:center;transform:scale(.6);transition:transform 4s ease-in-out;text-align:center}.br-circle b{font-size:20px}.br-circle small{font-size:12px;color:var(--fg);opacity:.8}
@media (prefers-reduced-motion:reduce){.br-circle{transition:none!important}}
.v6-gone{display:none!important}
.v6-pick.v6-done{border-color:#3fc495!important}.v6-pick.v6-done .t6-tag{color:#3fc495}
.v6-where{margin:10px 0 0!important;padding:16px!important}.v6-where.on{border-color:var(--accent)!important}
.v6-planrow{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:12px 0;position:sticky;bottom:calc(84px + env(safe-area-inset-bottom,0px));z-index:5;background:var(--card);padding:8px 0}.v6-planrow button{margin:0!important;padding:13px 8px!important;border-radius:14px!important;font-size:15px;font-weight:700;width:100%}.v6-planrow button.hidden{display:none}#planRow6 #planClear6{margin:0!important}
#builder6 input,#builder6 textarea{width:100%}
.v6-lbl{display:block;color:var(--muted);font-weight:700;font-size:12px;letter-spacing:.04em;text-transform:uppercase;margin:12px 0 2px}
.v6-feelrow{border:1px solid var(--soft);border-radius:14px;padding:10px 12px;margin:12px 0}.v6-feelrow>summary{display:flex;align-items:center;gap:10px;cursor:pointer;list-style:none}.v6-feelrow>summary::-webkit-details-marker{display:none}.v6-feelrow>summary svg{color:var(--accent);flex:none}.v6-feelrow b{display:block}.v6-feelrow small{display:block;color:var(--muted);font-size:12px}.v6-feelrow textarea{margin-top:10px}
#builder6Result{margin-top:10px}#builder6Result label{display:block;margin:8px 0 4px}#builder6Result input,#builder6Result select{width:100%}
#schedule6{margin:6px 0 14px}.v6-sched{display:flex;align-items:center;gap:10px;background:var(--card);border:1px solid var(--soft);border-radius:14px;padding:11px 12px;margin:0 0 6px}.v6-sched svg{color:var(--accent)}.v6-sched.today{border-color:var(--accent)}
.v6-day{font-size:11px;font-weight:800;border:1px solid var(--soft);border-radius:6px;padding:2px 6px;min-width:38px;text-align:center}
.t6-back{display:block;margin:0 0 10px!important;padding:6px 0!important;background:transparent!important;border:0!important;color:var(--accent)!important;font-weight:700;font-size:15px}
.t6-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px}
.t6-tile{display:flex!important;flex-direction:column;align-items:flex-start;gap:6px;text-align:left;min-height:108px;background:var(--card)!important;color:var(--fg)!important;border:1px solid var(--soft)!important;border-radius:16px!important;padding:14px!important;margin:0!important}
.t6-tile svg{color:var(--accent)}.t6-tile b{font-size:14.5px}.t6-tile small{color:var(--muted);font-size:12px;font-weight:500;line-height:1.35}
#lrPill{position:fixed;left:50%;transform:translateX(-50%);bottom:calc(92px + env(safe-area-inset-bottom,0px));z-index:65;border-radius:999px!important;padding:10px 18px!important;font-weight:700;box-shadow:0 8px 24px rgba(0,0,0,.35);white-space:nowrap}
#liveRunView{position:fixed;inset:0;z-index:200;background:var(--bg);color:var(--fg);overflow-y:auto;padding:calc(14px + env(safe-area-inset-top,0px)) max(16px,env(safe-area-inset-right,0px)) calc(24px + env(safe-area-inset-bottom,0px)) max(16px,env(safe-area-inset-left,0px))}
body.lr-open{overflow:hidden}
.lr-top{display:flex;justify-content:space-between;align-items:center}.lr-top b{font-size:17px}
.lr-min{width:40px;height:40px;border-radius:50%!important;padding:0!important;margin:0!important;background:var(--card)!important;color:var(--fg)!important;border:1px solid var(--soft)!important;font-size:20px}
.lr-gps{display:inline-flex;align-items:center;gap:6px;font-size:12px;border:1px solid var(--soft);border-radius:999px;padding:4px 10px}.lr-gps i{width:8px;height:8px;border-radius:50%;background:var(--muted)}.lr-gps.ok i{background:#3fc495}
.lr-map{border-radius:18px;overflow:hidden;border:1px solid var(--soft);margin:12px 0;background:var(--card)}.lr-map svg{display:block;width:100%;height:auto;aspect-ratio:2/1}
.lr-dist{text-align:center}.lr-dist span{display:block;font-size:12px;color:var(--muted);text-transform:uppercase;letter-spacing:.06em}.lr-dist b{font-size:64px;font-weight:800;line-height:1;font-variant-numeric:tabular-nums}.lr-dist small{font-size:20px;color:var(--muted);margin-left:4px}
.lr-tri{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:10px}.lr-tri div{background:var(--card);border:1px solid var(--soft);border-radius:14px;padding:10px 6px;text-align:center}.lr-tri span{display:block;font-size:10.5px;color:var(--muted);text-transform:uppercase;letter-spacing:.04em}.lr-tri b{font-size:21px;font-variant-numeric:tabular-nums}.lr-tri small{font-size:11px;color:var(--muted)}
.lr-splits{margin-top:10px}.lr-split{display:grid;grid-template-columns:56px 1fr 48px;align-items:center;gap:8px;font-size:13px;margin-top:7px}.lr-split i{height:8px;border-radius:4px;background:var(--accent);display:block}.lr-split b{text-align:right;font-variant-numeric:tabular-nums}
.lr-status{font-size:12.5px;color:var(--muted);text-align:center;min-height:1em}
.lr-ask{background:var(--card);border:1px solid var(--accent);border-radius:16px;padding:12px 14px;margin:8px 0;text-align:center}.lr-ask b{display:block}.lr-ask span{color:var(--muted);font-size:13px}.lr-ask div{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px}.lr-ask button{margin:0!important}
.lr-ctrl{display:flex;justify-content:center;align-items:center;gap:24px;margin-top:10px}
.lr-pz{width:84px;height:84px;border-radius:50%!important;font-size:26px!important;padding:0!important;margin:0!important}
.lr-sq{width:58px;height:58px;border-radius:50%!important;padding:0!important;margin:0!important;background:var(--card)!important;color:var(--fg)!important;border:1px solid var(--soft)!important;font-weight:800}
.lr-end{margin-top:14px}
.lr-lock{position:fixed;inset:0;z-index:210;background:rgba(0,0,0,.25);display:flex;align-items:flex-end;justify-content:center;padding-bottom:calc(40px + env(safe-area-inset-bottom,0px))}
.lr-lock button{border-radius:999px!important;padding:14px 26px!important;touch-action:none}
`;
document.head.append(css);

function init(){recoveryInstead();buildToday();buildPlan();buildBuilder();buildRecovery();drawToday();const r0=render;render=function(){r0();drawToday();drawSchedule();};window.addEventListener('stride-session-update',drawToday);window.addEventListener('stride-session-start',drawToday);window.addEventListener('stride-session-end',drawToday);
  // Home's Start run uses the live screen too.
  const lr=$('liveRunStart');if(lr)lr.addEventListener('click',()=>setTimeout(()=>{if(window.strideLiveRun?.state()?.running)openLive();},300));
}
if(document.readyState==='complete')setTimeout(init,80);else window.addEventListener('load',()=>setTimeout(init,120));
})();
