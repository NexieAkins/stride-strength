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
function startRun(kind){
  const type=$('liveRunType');if(!type)return;
  if(!window.strideLiveRun?.isActive()){
    const want=/walk/i.test(kind)?'Walk':/quality/i.test(kind)?'Quality Run':'Long Run';
    type.value=want;type.dispatchEvent(new Event('change'));
    $('liveRunStart')?.click();
  }
  openLive();
}
window.strideStartRun=startRun;

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
  <div class="lr-ctrl"><button type="button" id="lrLock" class="lr-sq" aria-label="Lock screen">🔒</button><button type="button" id="lrPause" class="lr-pz" aria-label="Pause">❚❚</button><button type="button" id="lrEnd" class="lr-sq">End</button></div>
  <div class="lr-end" id="lrEndSheet" hidden><button type="button" id="lrFinish" class="v6-start">Finish &amp; review</button><button type="button" id="lrDiscard" class="v6-ghost">Discard</button><button type="button" id="lrBack" class="v6-ghost">Keep going</button></div>
  <div class="lr-lock" id="lrLockLayer" hidden><button type="button" id="lrUnlock">Hold to unlock</button></div>`;
  document.body.append(live);
  live.querySelector('.lr-min').onclick=()=>{hiddenByUser=true;live.hidden=true;document.body.classList.remove('lr-open');};
  $('lrPause').onclick=()=>{const st=window.strideLiveRun?.state();if(!st)return;(st.running?$('liveRunPause'):$('liveRunStart'))?.click();};
  $('lrEnd').onclick=()=>{$('lrEndSheet').hidden=false;};
  $('lrBack').onclick=()=>{$('lrEndSheet').hidden=true;};
  $('lrFinish').onclick=()=>{$('liveRunFinish')?.click();closeLive();};
  $('lrDiscard').onclick=()=>{$('liveRunDiscard')?.click();setTimeout(()=>{if(!window.strideLiveRun?.isActive())closeLive();},300);};
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
  if(route.length>1){
    const lats=route.map(r=>r[0]),lons=route.map(r=>r[1]),mlat=(Math.max(...lats)+Math.min(...lats))/2,k=Math.cos(mlat*Math.PI/180);
    const xs=lons.map(l=>l*k),minx=Math.min(...xs),maxx=Math.max(...xs),miny=Math.min(...lats),maxy=Math.max(...lats);
    const sc=Math.min(260/Math.max(maxx-minx,1e-9),110/Math.max(maxy-miny,1e-9)),ox=150-(minx+maxx)/2*sc,oy=75+(miny+maxy)/2*sc;
    const pts=route.map((r,i)=>[(xs[i]*sc+ox).toFixed(1),(oy-r[0]*sc).toFixed(1)]);
    g+='<polyline points="'+pts.map(p=>p.join(',')).join(' ')+'" fill="none" stroke="var(--accent)" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>';
    g+='<circle cx="'+pts[0][0]+'" cy="'+pts[0][1]+'" r="6" fill="none" stroke="var(--accent)" stroke-width="3"/><circle cx="'+pts.at(-1)[0]+'" cy="'+pts.at(-1)[1]+'" r="8" fill="var(--accent)"/>';
  }else g+='<text x="150" y="80" text-anchor="middle" fill="var(--muted)" font-size="13">Your route will draw here</text>';
  svg.innerHTML=g;
}
let lastRouteLen=-1;
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
  if(st.route.length!==lastRouteLen){lastRouteLen=st.route.length;drawRoute(st.route);}
}
setInterval(drawLive,1000);

/* ---------- Strength: rest timer after each ticked set, progress bar ---------- */
let restEnd=0,restBox=null,restBase=90;
function restUI(){
  if(restBox)return restBox;
  restBox=el('div',{id:'restTimer',hidden:true,role:'status'});
  restBox.innerHTML='<small>Rest</small><b id="restLeft">1:30</b><div><button type="button" data-d="-15">−15 s</button><button type="button" data-d="skip">Skip</button><button type="button" data-d="15">+15 s</button></div>';
  restBox.addEventListener('click',e=>{const d=e.target.closest('button')?.dataset.d;if(!d)return;if(d==='skip'){restEnd=0;}else restEnd+=Number(d)*1000;tickRest();});
  document.body.append(restBox);return restBox;
}
function tickRest(){const b=restUI(),left=(restEnd-Date.now())/1000;if(left<=0){b.hidden=true;if(restEnd&&left>-1){try{navigator.vibrate?.(200);}catch(e){}}restEnd=0;return;}b.hidden=false;$('restLeft').textContent=clock(left);}
setInterval(()=>{if(restEnd)tickRest();},250);
document.addEventListener('change',e=>{const c=e.target;if(c.type!=='checkbox'||!c.checked||!c.closest('#sessionTracker'))return;if(!/completed .* set/i.test(c.getAttribute('aria-label')||''))return;restEnd=Date.now()+restBase*1000;tickRest();});
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
    const s=el('button',{type:'button',className:'v6-ghost',textContent:'Set my weekly schedule'});s.onclick=()=>{show('home');setTimeout(()=>{const m=$('homeMore');if(m){m.open=true;const pr=$('homePreferences');if(pr)pr.open=true;m.scrollIntoView({behavior:'smooth'});}},100);};
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
    const wu=el('button',{type:'button',className:'t6-link',textContent:'Warm up first · 5 min'});wu.onclick=()=>window.strideOpenStretch?.('warm');hero.append(wu);
  }
  box.append(hero);
  box.append(el('h3',{className:'t6-sec',textContent:'Quick start'}));
  const qs=el('div',{className:'t6-qs'});
  [['run','Run',()=>startRun('run')],['walk','Walk',()=>startRun('walk')],['dumb','Strength',()=>btnByText($('sessionTracker'),/plan my workout/i)?.click()],['core','Core',()=>{window.dispatchEvent(new CustomEvent('stride-train-view',{detail:'plan'}));const c=$('coreChoices');if(c){c.open=true;setTimeout(()=>c.scrollIntoView({behavior:'smooth'}),100);}}]].forEach(([i,l,f])=>{const b=el('button',{type:'button'},[icon(i,22),el('span',{textContent:l})]);b.onclick=f;qs.append(b);});
  box.append(qs);
  box.append(el('h3',{className:'t6-sec',textContent:'Make it yours'}));
  const mk=(i,t,s,re)=>{const b=el('button',{type:'button',className:'t6-mk'},[icon(i,22),el('span',{},[el('b',{textContent:t}),el('small',{textContent:s})]),icon('chev',16)]);b.onclick=()=>btnByText($('sessionTracker'),re)?.click();return b;};
  box.append(el('div',{className:'t6-two'},[mk('spark','Plan my workout','Built around your goals',/plan my workout/i),mk('redo','Repeat workout','From your history',/repeat workout/i)]),mk('plus','Custom session','Build it set by set',/custom session/i));
  if(next&&next.p){const names=['','Tomorrow'];const dn=next.o===1?'Tomorrow':next.p[0];const u=el('button',{type:'button',className:'t6-mk t6-next'},[icon(/run|walk/i.test(next.p[1])?'run':'dumb',22),el('span',{},[el('small',{textContent:'UP NEXT'}),el('b',{textContent:next.p[1]})]),el('em',{textContent:dn+' ›'})]);u.onclick=()=>{const w=$('trainingWeek');if(w){w.open=true;w.scrollIntoView({behavior:'smooth'});}};box.append(u);}
}

/* ---------- Train · Plan: tile grid that opens each section ---------- */
function buildPlan(){
  const v=$('trainingView-plan');if(!v||$('planTiles6'))return;
  const tiles=[['run','Running plans','5K to ultra','runningGoalPlanner'],['core','Core routines','Standing, bed, floor & more','coreChoices'],['plank','Bodyweight skills','Plank, push-ups, pull-ups & more','progressionChoices'],['gauge','Starting weights','Find your starting point','startingWeights'],['dumb','Build your workout','Time, equipment & goal','plannerFold'],['cam','Equipment photo','Snap a machine, learn it','equipmentPhoto']];
  const g=el('div',{id:'planTiles6',className:'t6-grid'});
  tiles.forEach(([i,t,s,id])=>{const b=el('button',{type:'button',className:'t6-tile'},[icon(i==='plank'?'core':i==='gauge'?'bars':i,24),el('b',{textContent:t}),el('small',{textContent:s})]);b.onclick=()=>{const d=$(id)||($(id==='plannerFold'?'trainingPlanner':id));if(!d)return;v.querySelectorAll(':scope>details').forEach(x=>{if(x!==d)x.open=false;});if(d.tagName==='DETAILS')d.open=true;else{const f=d.closest('details');if(f)f.open=true;}setTimeout(()=>d.scrollIntoView({behavior:'smooth',block:'start'}),60);};g.append(b);});
  v.prepend(el('h3',{className:'t6-sec',textContent:'Explore plans'}),g);
}
/* ---------- Train · Recovery: header + quick picks ---------- */
function buildRecovery(){
  const v=$('trainingView-recovery');if(!v||$('recHead6'))return;
  const head=el('div',{id:'recHead6'},[el('h3',{className:'t6-sec',textContent:'Explore recovery'})]);
  const g=el('div',{className:'t6-grid'});
  [['walk','Warm-ups','Before you train','warm'],['leaf','Cool-downs','Post-run & post-lift','cool'],['core','Mobility','Rest-day movement','mobility'],['leaf','Post-run stretch','Calves, hips & hamstrings','run']].forEach(([i,t,s,k])=>{const b=el('button',{type:'button',className:'t6-tile'},[icon(i,24),el('b',{textContent:t}),el('small',{textContent:s})]);b.onclick=()=>{window.strideOpenStretch?.(k);setTimeout(()=>$('stretchRoutine')?.scrollIntoView({behavior:'smooth',block:'center'}),120);};g.append(b);});
  head.append(g);v.prepend(head);
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
#sessionProgress{height:6px;border-radius:4px;background:var(--soft);overflow:hidden;margin:0 0 12px}#sessionProgress i{display:block;height:100%;background:var(--accent);transition:width .3s}
#sessionTracker input[type=checkbox]{width:26px!important;height:26px!important;accent-color:var(--accent)}
#restTimer{position:fixed;left:50%;transform:translateX(-50%);bottom:calc(96px + env(safe-area-inset-bottom,0px));z-index:70;background:var(--card);color:var(--fg);border:1px solid var(--soft);border-radius:20px;padding:12px 18px;text-align:center;box-shadow:0 10px 30px rgba(0,0,0,.4);min-width:240px}
#restTimer small{color:var(--muted)}#restTimer b{display:block;font-size:36px;font-weight:800;font-variant-numeric:tabular-nums;line-height:1.1}
#restTimer div{display:flex;gap:8px;justify-content:center;margin-top:6px}#restTimer button{margin:0!important;padding:6px 12px!important;border-radius:999px!important;background:transparent!important;color:var(--fg)!important;border:1px solid var(--soft)!important;font-size:13px}
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
.lr-ctrl{display:flex;justify-content:center;align-items:center;gap:24px;margin-top:10px}
.lr-pz{width:84px;height:84px;border-radius:50%!important;font-size:26px!important;padding:0!important;margin:0!important}
.lr-sq{width:58px;height:58px;border-radius:50%!important;padding:0!important;margin:0!important;background:var(--card)!important;color:var(--fg)!important;border:1px solid var(--soft)!important;font-weight:800}
.lr-end{margin-top:14px}
.lr-lock{position:fixed;inset:0;z-index:210;background:rgba(0,0,0,.25);display:flex;align-items:flex-end;justify-content:center;padding-bottom:calc(40px + env(safe-area-inset-bottom,0px))}
.lr-lock button{border-radius:999px!important;padding:14px 26px!important;touch-action:none}
`;
document.head.append(css);

function init(){buildToday();buildPlan();buildRecovery();drawToday();const r0=render;render=function(){r0();drawToday();};window.addEventListener('stride-session-update',drawToday);window.addEventListener('stride-session-start',drawToday);window.addEventListener('stride-session-end',drawToday);
  // Home's Start run uses the live screen too.
  const lr=$('liveRunStart');if(lr)lr.addEventListener('click',()=>setTimeout(()=>{if(window.strideLiveRun?.state()?.running)openLive();},300));
}
if(document.readyState==='complete')setTimeout(init,80);else window.addEventListener('load',()=>setTimeout(init,120));
})();
