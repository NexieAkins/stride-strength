/* Exercise help: ▶ How-to demos (free-exercise-db photos, public domain), hold timers with rest between moves,
   and bodyweight loads that use the saved body weight. */
(function(){
const $=id=>document.getElementById(id);
const IMG='https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/';
let INDEX=null,loading=null;
const load=()=>INDEX?Promise.resolve(INDEX):(loading||(loading=fetch('./exercise-index.json').then(r=>r.json()).then(j=>INDEX=j.map(([id,name,ins])=>({id,name,ins,t:toks(name)})))));
const STOP=new Set(['the','a','of','with','and','or','on','to','in','for','machine','free','weights','stretch','exercise','light','your','each','side','per']);
const norm=s=>String(s||'').toLowerCase().replace(/\(.*?\)/g,' ').replace(/[–—-]/g,' ').replace(/[^a-z0-9/ ]/g,' ').replace(/\s+/g,' ').trim();
const toks=s=>norm(s).split(' ').map(w=>w.replace(/(ies)$/,'y').replace(/(es|s)$/,'')).filter(w=>w&&!STOP.has(w));
const ALIAS=[[/cat.?cow/i,'Cat Stretch'],[/child.?s pose/i,"Child's Pose"],[/world.?s greatest/i,"World's Greatest Stretch"],[/90\/90/i,'90/90 Hamstring'],[/hip flexor/i,'Kneeling Hip Flexor'],[/standing quad/i,'Quad Stretch'],[/^quad/i,'Quad Stretch'],[/calf stretch/i,'Calf Stretch Hands Against Wall'],[/hamstring stretch/i,'Hamstring Stretch'],[/^push.?ups?$|^push.?up$/i,'Pushups'],[/knee push/i,'Pushups'],[/incline push/i,'Incline Push-Up'],[/forearm plank|^plank/i,'Plank'],[/side plank/i,'Push Up to Side Plank'],[/dead.?bug/i,'Dead Bug'],[/glute bridge|hip bridge/i,'Single Leg Glute Bridge'],[/goblet/i,'Goblet Squat'],[/bodyweight squat|air squat|^squats?$/i,'Bodyweight Squat'],[/romanian|rdl/i,'Romanian Deadlift'],[/walking lunge/i,'Bodyweight Walking Lunge'],[/^lunges?$|reverse lunge/i,'Dumbbell Rear Lunge'],[/dumbbell (bent.?over )?row/i,'Bent Over Two-Dumbbell Row'],[/seated (cable )?row/i,'Seated Cable Rows'],[/dumbbell chest press|dumbbell bench/i,'Dumbbell Bench Press'],[/chest press machine/i,'Leverage Chest Press'],[/lat pull/i,'Wide-Grip Lat Pulldown'],[/dumbbell shoulder press|overhead press/i,'Dumbbell Shoulder Press'],[/bicep curl|biceps curl/i,'Dumbbell Bicep Curl'],[/tricep/i,'Triceps Pushdown'],[/mountain climb/i,'Mountain Climbers'],[/superman/i,'Superman'],[/russian twist/i,'Russian Twist'],[/crunch/i,'Crunches'],[/ankle (circle|rock)/i,'Ankle Circles'],[/leg press/i,'Leg Press'],[/step.?up/i,'Dumbbell Step Ups'],[/calf raise/i,'Standing Calf Raises'],[/jumping jack/i,'Star Jump'],[/wall sit/i,'Wall Sit'] ];
function match(name){if(!INDEX)return null;const n=String(name||'').replace(/^\d+\.\s*/,'');for(const [r,t] of ALIAS){if(r.test(n)){const m=INDEX.find(x=>x.name.toLowerCase()===t.toLowerCase());if(m)return m;}}
  const q=toks(n);if(!q.length)return null;let best=null,bs=0;for(const x of INDEX){const inter=q.filter(w=>x.t.includes(w)).length;if(!inter)continue;const sc=inter/Math.max(q.length,x.t.length)+(inter===q.length?.15:0);if(sc>bs){bs=sc;best=x;}}return bs>=.55?best:null;}
/* ---------- demo sheet ---------- */
let flip=null;
function demo(ex,title){
  let d=$('demo6');if(!d){d=document.createElement('dialog');d.id='demo6';d.className='demo6';document.body.append(d);d.addEventListener('close',()=>{clearInterval(flip);});}
  d.innerHTML='<div class="demo6-h"><b></b><button type="button" class="demo6-x" aria-label="Close">✕</button></div><div class="demo6-img"><img alt=""><img alt=""><span class="demo6-tag">Start</span></div><ol class="demo6-ins"></ol><p class="demo6-src">Demo photos: Free Exercise DB (public domain). Move within a comfortable range.</p>';
  d.querySelector('b').textContent=title||ex.name;
  const [a,b]=d.querySelectorAll('.demo6-img img');a.src=IMG+ex.id+'/0.jpg';b.src=IMG+ex.id+'/1.jpg';a.alt=ex.name+' start position';b.alt=ex.name+' end position';
  const ol=d.querySelector('ol');ex.ins.forEach(t=>{const li=document.createElement('li');li.textContent=t;ol.append(li);});
  d.querySelector('.demo6-x').onclick=()=>d.close();
  let on=false;const tag=d.querySelector('.demo6-tag');clearInterval(flip);flip=setInterval(()=>{on=!on;b.style.opacity=on?1:0;tag.textContent=on?'Finish':'Start';},1000);
  d.showModal();
}
function howBtn(name,title){const b=document.createElement('button');b.type='button';b.className='how6';b.innerHTML='<svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path d="M8 5l11 7-11 7z" fill="currentColor"/></svg>How to';b.onclick=e=>{e.preventDefault();e.stopPropagation();load().then(()=>{const m=match(name);if(m)demo(m,title);});};return b;}
/* ---------- timers ---------- */
const parseDose=t=>{t=String(t||'');const sets=Number((t.match(/(\d+)\s*[×x]\s*\d/)||[])[1])||1;let sec=0;const m=t.match(/(\d+(?:\.\d+)?)\s*(?:sec|s\b|seconds?)/i),mi=t.match(/(\d+(?:\.\d+)?)\s*min/i);if(m)sec=Number(m[1]);else if(mi)sec=Math.round(Number(mi[1])*60);if(!sec)return null;const sides=/each side|per side|each leg|per leg/i.test(t)?2:1;return{sec,sets,sides};};
const fmt=s=>Math.floor(s/60)+':'+String(Math.max(0,Math.round(s%60))).padStart(2,'0');
let running=null;
function beep(){try{const c=new (window.AudioContext||window.webkitAudioContext)(),o=c.createOscillator(),g=c.createGain();o.frequency.value=880;o.connect(g);g.connect(c.destination);g.gain.setValueAtTime(.2,c.currentTime);o.start();o.stop(c.currentTime+.25);}catch{}navigator.vibrate?.([120,60,120]);}
function bar(){let b=$('tbar6');if(!b){b=document.createElement('div');b.id='tbar6';b.innerHTML='<div><small></small><b></b></div><button type="button" class="tb6-p">Pause</button><button type="button" class="tb6-s">Skip</button><button type="button" class="tb6-x" aria-label="Stop">✕</button>';document.body.append(b);}return b;}
function runPhases(phases,row,onDone){
  stopAll();const b=bar();let i=0,left=phases[0].sec,paused=false;b.hidden=false;
  const show=()=>{const p=phases[i];b.querySelector('small').textContent=p.label;b.querySelector('b').textContent=fmt(left);b.classList.toggle('rest',p.rest);if(row){const tb=row.querySelector('.tmr6');if(tb)tb.textContent=p.rest?'Rest '+fmt(left):'⏱ '+fmt(left);}};
  const next=()=>{beep();i++;if(i>=phases.length){stopAll();onDone&&onDone();return;}left=phases[i].sec;show();};
  b.querySelector('.tb6-p').onclick=()=>{paused=!paused;b.querySelector('.tb6-p').textContent=paused?'Resume':'Pause';};
  b.querySelector('.tb6-s').onclick=()=>{left=0;};
  b.querySelector('.tb6-x').onclick=()=>stopAll();
  show();running={iv:setInterval(()=>{if(paused)return;left--;if(left<=0)next();else show();},1000),row};
}
function stopAll(){if(running){clearInterval(running.iv);const tb=running.row?.querySelector('.tmr6');if(tb)tb.textContent=tb.dataset.lbl;running=null;}const b=$('tbar6');if(b)b.hidden=true;}
const REST=15;
function startRow(row,chain){
  const dose=parseDose(row.dataset.dose);if(!dose)return;const name=row.dataset.name;const ph=[];
  for(let s=1;s<=dose.sets;s++){for(let side=1;side<=dose.sides;side++){ph.push({sec:dose.sec,label:name+(dose.sets>1?' · set '+s+' of '+dose.sets:'')+(dose.sides>1?(side===1?' · first side':' · second side'):''),rest:false});if(side<dose.sides)ph.push({sec:5,label:'Switch sides',rest:true});}if(s<dose.sets)ph.push({sec:REST,label:'Rest · then set '+(s+1),rest:true});}
  runPhases(ph,row,()=>{const cb=row.querySelector('input[type=checkbox]');if(cb&&!cb.checked)cb.click();
    if(!chain)return;const all=[...row.parentElement.querySelectorAll('[data-dose]')].filter(r=>r.offsetParent);const nx=all[all.indexOf(row)+1];
    if(nx&&parseDose(nx.dataset.dose)){runPhases([{sec:REST,label:'Rest · next: '+nx.dataset.name,rest:true}],nx,()=>startRow(nx,true));nx.scrollIntoView({behavior:'smooth',block:'center'});}});
}

/* ---------- workout pill → back to the workout ---------- */
function pill(){const c=$('workoutControls');if(!c||c.dataset.p6)return;c.dataset.p6=1;c.style.cursor='pointer';c.setAttribute('role','button');c.title='Go to your workout';
  const hint=document.createElement('small');hint.className='pill6';hint.textContent='Tap to open your workout ›';c.append(hint);
  c.addEventListener('click',e=>{if(e.target.closest('button'))return;window.show?.('train');window.dispatchEvent(new CustomEvent('stride-train-view',{detail:'plan'}));setTimeout(()=>{const t=$('sessionTracker');if(t){let el=t;while(el&&el!==document.body){el.hidden=false;el=el.parentElement;}t.scrollIntoView({behavior:'smooth',block:'start'});}},120);});}
/* ---------- close for open recovery routines ---------- */
function recClose(){const it=$('stretchItems');const card=it?.closest('.card,section,details');if(!card||card.querySelector('.rc6-x'))return;const back=[...document.querySelectorAll('#train .t6-back')].find(b=>/all recovery/i.test(b.textContent));if(!back)return;
  const x=document.createElement('button');x.type='button';x.className='rc6-x';x.setAttribute('aria-label','Close');x.textContent='✕';x.onclick=()=>{stopAll();back.click();window.scrollTo({top:0,behavior:'smooth'});};card.style.position='relative';card.prepend(x);
  const done=document.createElement('button');done.type='button';done.className='rc6-done';done.textContent='Done';done.onclick=x.onclick;it.after(done);}
/* ---------- timed sets (plank etc.) in the live tracker ---------- */
function timedSets(){document.querySelectorAll('#sessionTracker details.exercise').forEach(c=>{const tgt=[...c.querySelectorAll('p')].map(p=>p.textContent).join(' ');const m=tgt.match(/(\d+)\s*(sec|second)/i)||tgt.match(/(\d+(?:\.\d+)?)\s*min/i);const timed=/hold|plank|wall sit|seconds?\b|minutes?\b/i.test(tgt)&&m;if(!timed)return;const secs=/min/i.test(m[2]||'min')&&!/sec/i.test(m[2]||'')?Math.round(Number(m[1])*60):Number(m[1]);
  c.querySelectorAll('input[type=checkbox]').forEach(cb=>{if(!/completed/i.test(cb.getAttribute('aria-label')||''))return;const row=cb.closest('div,li,tr');if(!row||row.dataset.ts6)return;row.dataset.ts6=1;row.classList.add('ts6-row');
    const nums=[...row.querySelectorAll('input[type=number],input:not([type])')];const reps=nums[0];if(reps){reps.placeholder='Seconds';reps.setAttribute('aria-label','Seconds held');}
    nums.slice(1).forEach(i=>{i.style.display='none';});row.querySelectorAll('select').forEach(sl=>{if([...sl.options].some(o=>o.value==='bodyweight')){sl.style.display='none';}});
    const b=document.createElement('button');b.type='button';b.className='tmr6 ts6-go';b.textContent='⏱ '+fmt(secs);b.dataset.lbl=b.textContent;
    b.onclick=e=>{e.preventDefault();if(running&&running.row===row){stopAll();return;}runPhases([{sec:5,label:'Get ready · '+c.querySelector('summary')?.textContent,rest:true},{sec:secs,label:(c.querySelector('summary')?.textContent||'Hold')+' · hold',rest:false}],row,()=>{if(reps){reps.value=secs;reps.dispatchEvent(new Event('input',{bubbles:true}));reps.dispatchEvent(new Event('change',{bubbles:true}));}if(!cb.checked)cb.click();});};
    row.querySelector('.tmr6')||row.insertBefore(b,cb);});});}
/* ---------- keep the screen awake during workouts, runs and timers ---------- */
let wl=null;async function wake(){const need=!!(window.strideSessionTracker?.isActive?.()||window.strideLiveRun?.isActive?.()||running);try{if(need&&!wl&&navigator.wakeLock&&document.visibilityState==='visible'){wl=await navigator.wakeLock.request('screen');wl.addEventListener('release',()=>{wl=null;});}else if(!need&&wl){await wl.release();wl=null;}}catch{}
  try{const KA=window.Capacitor?.Plugins?.KeepAwake;if(KA){if(need&&!wake.k){KA.keepAwake();wake.k=1;}else if(!need&&wake.k){KA.allowSleep();wake.k=0;}}}catch{}}
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'){wl=null;wake();}});setInterval(wake,4000);
/* ---------- decorate ---------- */
function rows(){
  document.querySelectorAll('label.stretch-item, label.core-row, #train label').forEach(row=>{
    if(row.dataset.h6||!row.querySelector('input[type=checkbox]')||row.closest('.exercise'))return;const st=row.querySelector('strong,b');if(!st)return;
    const [nm,...rest]=st.textContent.split(' · ');if(!rest.length&&!row.matches('.core-row'))return;row.dataset.h6=1;row.dataset.name=nm.replace(/^\d+\.\s*/,'').trim();row.dataset.dose=rest.join(' · ');
    const tools=document.createElement('span');tools.className='tools6';
    const dose=parseDose(row.dataset.dose);if(dose){const t=document.createElement('button');t.type='button';t.className='tmr6';t.dataset.lbl='⏱ '+fmt(dose.sec)+(dose.sides>1?' ×2':'')+(dose.sets>1?' · '+dose.sets+' sets':'');t.textContent=t.dataset.lbl;t.onclick=e=>{e.preventDefault();e.stopPropagation();if(running&&running.row===row){stopAll();return;}startRow(row,true);};tools.append(t);}
    load().then(()=>{if(match(row.dataset.name))tools.prepend(howBtn(row.dataset.name,row.dataset.name));});
    (st.parentElement!==row?st.parentElement:row).append(tools);row.classList.add('row6');
  });
  // Planner results and live tracker cards
  document.querySelectorAll('#trainPlanResult .exercise, #builder6Result .exercise, #sessionTracker details.exercise').forEach(c=>{
    if(c.dataset.h6)return;const h=c.querySelector('summary')||c.querySelector('label.core-row strong')||c.querySelector('strong');if(!h)return;c.dataset.h6=1;const nm=h.textContent.replace(/^\d+\.\s*/,'');
    load().then(()=>{if(!match(nm))return;const b=howBtn(nm,nm);b.classList.add('how6-card');const tgt=c.querySelector('summary')||c.querySelector('label.core-row')||h;tgt.append(b);});
  });
  bodyweight();pill();recClose();timedSets();
}
function bw(){const w=(window.db?.weights||(typeof db!=='undefined'?db.weights:[])||[]).filter(x=>Number(x.weight)>0).sort((a,b)=>a.date<b.date?-1:1).at(-1);return w?Math.round(Number(w.weight)):null;}
function bodyweight(){
  document.querySelectorAll('#trainPlanResult label, #builder6Result label').forEach(l=>{
    const sel=[...l.querySelectorAll('select')].find(s=>[...s.options].some(o=>o.value==='bodyweight'));const inp=l.querySelector('input[type=number]');if(!sel||!inp)return;
    if(!l.dataset.bw6){l.dataset.bw6=1;l.classList.add('load6');[...l.childNodes].filter(n=>n.nodeType===3&&n.textContent.trim()).forEach(n=>{const sp=document.createElement('span');sp.className='load6-t';sp.textContent=n.textContent.trim();n.replaceWith(sp);});let prev=sel.value;sel.addEventListener('change',()=>{if(prev==='bodyweight'&&sel.value!=='bodyweight'&&inp.dataset.bwv&&inp.value===inp.dataset.bwv){inp.value='';inp.dispatchEvent(new Event('change',{bubbles:true}));}prev=sel.value;bodyweight();});}
    let note=l.querySelector('.bw6');if(!note){note=document.createElement('span');note.className='bw6';l.append(note);}
    const isBW=sel.value==='bodyweight';inp.hidden=isBW;inp.style.display=isBW?'none':'';note.hidden=!isBW;
    if(isBW){const w=bw();if(w){note.innerHTML='Uses your body weight · <b>'+w+' lb</b>';inp.dataset.bwv=String(w);if(String(inp.value)!==String(w)){inp.value=w;inp.dispatchEvent(new Event('change',{bubbles:true}));}}
      else{note.innerHTML='';const a=document.createElement('button');a.type='button';a.className='bw6-add';a.textContent='＋ Add your body weight';a.onclick=()=>{const wf=$('weightForm');[...document.querySelectorAll('nav button,nav a')].find(x=>/log|＋/i.test((x.getAttribute('aria-label')||'')+x.textContent))?.click();setTimeout(()=>{const dd=wf?.closest('details');if(dd)dd.open=true;wf?.scrollIntoView({behavior:'smooth',block:'center'});},300);};note.append('No body weight saved yet. ',a);}}
  });
}
const css=document.createElement('style');css.textContent=`
.how6{display:inline-flex;align-items:center;gap:4px;width:auto!important;margin:0!important;padding:5px 10px!important;font-size:12.5px!important;font-weight:700;border-radius:999px!important;border:1px solid var(--accent)!important;background:color-mix(in srgb,var(--accent) 14%,transparent)!important;color:var(--fg)!important;min-height:0!important;line-height:1.2}
.how6 svg{color:var(--accent)}.how6-card{margin-left:auto!important;flex:none}
.tools6{display:flex;gap:6px;flex-wrap:wrap;margin-top:6px;flex-basis:100%}
.tools6{display:flex}
.tmr6{width:auto!important;margin:0!important;padding:5px 10px!important;font-size:12.5px!important;font-weight:700;border-radius:999px!important;border:1px solid var(--soft)!important;background:var(--card)!important;color:var(--fg)!important;min-height:0!important;font-variant-numeric:tabular-nums}
#tbar6{position:fixed;left:12px;right:12px;bottom:calc(96px + env(safe-area-inset-bottom,0px));z-index:60;display:flex;align-items:center;gap:8px;padding:10px 12px;border-radius:18px;background:var(--accent);color:var(--on-accent);box-shadow:0 10px 30px rgba(0,0,0,.45);max-width:520px;margin:0 auto}
#tbar6.rest{background:var(--card);color:var(--fg);border:1px solid var(--accent)}
#tbar6>div{flex:1;min-width:0}#tbar6 small{display:block;font-size:12px;opacity:.85;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}#tbar6 b{font-size:26px;font-variant-numeric:tabular-nums;line-height:1.1}
#tbar6 button{width:auto!important;margin:0!important;padding:8px 12px!important;border-radius:12px!important;background:rgba(255,255,255,.18)!important;border:0!important;color:inherit!important;font-weight:700;min-height:0!important}
#tbar6.rest button{background:color-mix(in srgb,var(--accent) 18%,transparent)!important}
.demo6{width:min(440px,94vw);max-height:92vh;overflow:auto;border:1px solid var(--soft);border-radius:22px;background:var(--bg);color:var(--fg);padding:14px 16px 16px}.demo6::backdrop{background:rgba(0,0,0,.6)}
.demo6-h{display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:10px}.demo6-h b{font-size:18px}
.demo6-x{width:36px!important;height:36px;flex:none;border-radius:50%!important;padding:0!important;margin:0!important;background:var(--card)!important;border:1px solid var(--soft)!important;color:var(--fg)!important}
.demo6-img{position:relative;aspect-ratio:4/3;border-radius:16px;overflow:hidden;background:#fff}.demo6-img img{position:absolute;inset:0;width:100%;height:100%;object-fit:contain;transition:opacity .35s}.demo6-img img+img{opacity:0}
.demo6-tag{position:absolute;left:10px;top:10px;background:var(--accent);color:var(--on-accent);font-size:12px;font-weight:800;padding:3px 9px;border-radius:999px}
.demo6-ins{margin:12px 0 6px;padding-left:20px;line-height:1.5;font-size:14px}.demo6-ins li{margin:4px 0}.demo6-src{font-size:11.5px;color:var(--muted);margin:6px 0 0}
.load6{display:grid!important;grid-template-columns:110px auto;justify-content:start;gap:8px;align-items:center}.load6>input{width:110px!important;max-width:110px!important;text-align:center}.load6>.load6-t{grid-column:1/-1;font-weight:700}.load6>input[hidden]+select,.load6>input[style*='none']+select{grid-column:1/-1;justify-self:start}.load6>select{width:140px!important;max-width:140px!important;min-width:120px!important;padding:8px 30px 8px 12px!important;font-size:14px!important;height:auto!important;min-height:0!important;margin:0!important}.load6>input{margin:0!important}
.pill6{display:block;margin-top:8px;font-size:12.5px;font-weight:700;color:var(--accent)}.rc6-x{position:absolute!important;top:12px;right:12px;width:36px!important;height:36px!important;border-radius:50%!important;padding:0!important;margin:0!important;background:var(--card)!important;border:1px solid var(--soft)!important;color:var(--fg)!important;z-index:3;min-height:0!important}.rc6-done{display:block;width:100%;margin:12px 0 0!important}.ts6-row .ts6-go{flex:none}.bw6{grid-column:1/-1;font-size:13px;color:var(--muted)}.bw6 b{color:var(--fg)}.bw6-add{width:auto!important;margin:0 0 0 4px!important;padding:4px 10px!important;font-size:12.5px!important;font-weight:700;border:1px solid var(--accent)!important;color:var(--accent)!important;background:none!important;border-radius:10px!important;min-height:0!important}`;
document.head.append(css);
const zc=document.createElement('style');zc.textContent=[['text-large',1.15],['text-xl',1.3]].map(([c,z])=>`body.${c} dialog{width:calc(94vw / ${z})!important;max-width:calc(100vw / ${z} - 12px)!important;max-height:calc(90vh / ${z})!important;box-sizing:border-box}body.${c} dialog .v6-sheethead,body.${c} .demo6-h,body.${c} .scan6-h{position:sticky;top:-14px;z-index:2;background:inherit;padding-top:4px}`).join('')+'dialog .v6-sheethead{position:sticky;top:-14px;z-index:2;background:inherit}';document.head.append(zc);
let q=0;const run=()=>{q=0;try{rows();}catch(e){}};
new MutationObserver(()=>{if(!q){q=1;requestAnimationFrame(run);}}).observe(document.body,{childList:true,subtree:true});
const tick=()=>{run();setTimeout(tick,1500);};tick();
window.strideExerciseDemo=n=>load().then(()=>{const m=match(n);if(m)demo(m,n);return !!m;});
})();
