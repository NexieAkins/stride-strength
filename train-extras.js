/* Train extras: resume bar on every tab, auto-pause after the phone dies, Repeat in Plan,
   bodyweight sets without load boxes, and "Copy last set". */
(function(){
const $=id=>document.getElementById(id);
const T=()=>window.strideSessionTracker;
(function purge(n){try{if(typeof db!=='undefined'&&window.__strideGone){const b=(db.trainingSessions||[]).length;db.trainingSessions=(db.trainingSessions||[]).filter(x=>!window.__strideGone(x?.id));if(db.trainingSessions.length!==b){localStorage.setItem('stride-strength-v3',JSON.stringify(db));T()?.draw?.();}}}catch{}if(n<20)setTimeout(()=>purge(n+1),1000);})(0);
const fmt=s=>{s=Math.max(0,Math.round(s));const h=Math.floor(s/3600),m=Math.floor(s%3600/60),x=s%60;return (h?h+':'+String(m).padStart(2,'0'):m)+':'+String(x).padStart(2,'0');};
function goWorkout(){window.show?.('train');window.dispatchEvent(new CustomEvent('stride-train-view',{detail:'today'}));[...document.querySelectorAll('#train button')].find(b=>b.textContent.trim()==='Today')?.click();setTimeout(()=>{const t=$('sessionTracker');if(t){let e=t;while(e&&e!==document.body){e.hidden=false;if(e.id&&/^trainingView-/.test(e.id))e.classList.remove('hidden');e=e.parentElement;}t.scrollIntoView({behavior:'smooth',block:'start'});}},150);}
window.strideGoWorkout=goWorkout;
/* 1. Resume bar on every tab */
function bar(){let b=$('resume6');if(!b){b=document.createElement('button');b.type='button';b.id='resume6';b.onclick=goWorkout;document.body.append(b);}return b;}
function tickBar(){const st=T()?.status?.();const onTrain=!!document.querySelector('#train:not(.hidden)')&&$('train')?.offsetParent!==null;const b=bar();if(!st||onTrain){b.hidden=true;return;}b.hidden=false;b.innerHTML='<span class="r6-dot'+(st.paused?' p':'')+'"></span><span class="r6-t"><b></b><small></small></span><span class="r6-go">'+(st.paused?'Resume':'Open')+' ›</span>';b.querySelector('b').textContent=st.title||'Workout';b.querySelector('small').textContent=(st.paused?'Paused · ':'In progress · ')+fmt(st.seconds);}
setInterval(tickBar,1000);
/* 2. Auto-pause if the app stopped (battery died / app killed) during a running workout */
const BEAT='stride-session-beat';
function beat(){try{const st=T()?.status?.();if(st&&!st.paused)localStorage.setItem(BEAT,String(Date.now()));}catch{}}
setInterval(beat,10000);document.addEventListener('visibilitychange',beat);
function recover(){try{if(typeof db==='undefined'||!T()?.isActive?.())return false;const last=Number(localStorage.getItem(BEAT))||0;const s=(db.trainingSessions||[]).find(x=>x&&x.status==='draft'&&x.runningSince);if(!s||!last)return true;const gap=Date.now()-last;if(gap<120000)return true;
  const upTo=Math.max(s.runningSince,last);s.elapsedSeconds=(Number(s.elapsedSeconds)||0)+Math.max(0,(upTo-s.runningSince)/1000);s.runningSince=null;if(typeof save==='function')save();T()?.draw?.();
  window.strideToast?.('Your workout was paused where you left off · tap Resume to keep going');return true;}catch{return true;}}
(function wait(n){if(recover()===false&&n<40)setTimeout(()=>wait(n+1),500);})(0);
/* 3. Repeat workout in Train → Plan */
function planRepeat(){const b6=$('builder6');if(!b6||$('planRepeat6'))return;const r=document.createElement('button');r.type='button';r.id='planRepeat6';r.className='t6-mk';r.innerHTML='<span><b>Repeat a workout</b><small>Pick one from your history</small></span><span style="margin-left:auto">›</span>';r.onclick=()=>window.strideRepeatSheet?.();b6.before(r);}
/* 4. Live tracker: bodyweight sets hide load; Copy last set */
function sets(){document.querySelectorAll('#sessionTracker details.exercise').forEach(c=>{
  c.querySelectorAll('select').forEach(sl=>{if(![...sl.options].some(o=>o.value==='bodyweight'))return;const row=sl.closest('fieldset.v6-set,fieldset,li,tr,div');if(!row)return;const nums=[...row.querySelectorAll('input[type=number],input:not([type])')];const w=nums[1];const bw=sl.value==='bodyweight';
    if(!sl.dataset.bw7){sl.dataset.bw7=1;sl.addEventListener('change',()=>sets());}
    if(w){w.style.display=bw?'none':'';}let tag=row.querySelector('.bwtag7');if(bw&&!row.classList.contains('ts6-row')){if(!tag){tag=document.createElement('span');tag.className='bwtag7';tag.textContent='Bodyweight';sl.before(tag);}sl.classList.add('bwsel7');}else{tag?.remove();sl.classList.remove('bwsel7');}});
  const add=[...c.querySelectorAll('button')].find(b=>/^add set$/i.test(b.textContent.trim()));if(!add||c.querySelector('.dup7'))return;
  const d=document.createElement('button');d.type='button';d.className='dup7';d.textContent='⧉ Copy last set';
  d.onclick=()=>{const rows=()=>[...c.querySelectorAll('input[type=checkbox]')].filter(x=>/completed/i.test(x.getAttribute('aria-label')||'')).map(x=>x.closest('fieldset.v6-set,fieldset,li,tr,div'));const before=rows();const last=before.at(-1);const vals=last?[...last.querySelectorAll('input:not([type=checkbox]),select')].map(i=>i.value):null;add.click();
    setTimeout(()=>{const now=rows();const nr=now.at(-1);if(!nr||nr===last||!vals)return;[...nr.querySelectorAll('input:not([type=checkbox]),select')].forEach((i,k)=>{if(vals[k]!==undefined&&vals[k]!==''){i.value=vals[k];i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));}});sets();},120);};
  add.after(d);});}
const st=document.createElement('style');st.textContent=`
#resume6{position:fixed;left:12px;right:12px;bottom:calc(92px + env(safe-area-inset-bottom,0px));z-index:55;display:flex;align-items:center;gap:10px;max-width:520px;margin:0 auto;padding:10px 14px!important;border-radius:16px!important;background:var(--card)!important;color:var(--fg)!important;border:1.5px solid var(--accent)!important;box-shadow:0 10px 28px rgba(0,0,0,.45);text-align:left;min-height:0!important;width:auto!important}
#resume6[hidden]{display:none!important}.r6-dot{width:10px;height:10px;border-radius:50%;background:#3fc495;flex:none;animation:r6p 1.4s infinite}.r6-dot.p{background:#f0b45a;animation:none}@keyframes r6p{50%{opacity:.35}}
.r6-t{flex:1;min-width:0}.r6-t b{display:block;font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.r6-t small{color:var(--muted);font-size:12px;font-variant-numeric:tabular-nums}.r6-go{font-weight:800;color:var(--accent);flex:none}
#planRepeat6{display:flex;align-items:center;width:100%;margin:0 0 12px!important;text-align:left}#planRepeat6 small{display:block;color:var(--muted);font-size:12px}
.bwtag7{font-size:13px;font-weight:700;color:var(--muted);padding:0 6px;white-space:nowrap}.bwsel7{max-width:44px;opacity:.6}
fieldset.ts6-row .max6{grid-column:1/-1;width:100%!important;order:21;margin-top:6px!important;max-width:none!important;white-space:nowrap;background:none!important;border:1.5px solid var(--accent)!important;color:var(--accent)!important}fieldset.ts6-row .max6.live{background:var(--accent)!important;color:var(--on-accent)!important}fieldset.ts6-row .ts6-go{grid-column:1/-1;width:100%!important;max-width:none!important;white-space:nowrap;writing-mode:horizontal-tb;order:20;margin-top:8px!important}fieldset.ts6-row input[placeholder=Load],fieldset.ts6-row label:has(input[placeholder=Load]){display:none!important}.dup7{margin-left:8px!important;width:auto!important;background:none!important;border:1px solid var(--accent)!important;color:var(--accent)!important;font-weight:700}`;
document.head.append(st);
let q=0;const run=()=>{q=0;try{planRepeat();sets();}catch(e){}};
new MutationObserver(()=>{if(!q){q=1;requestAnimationFrame(run);}}).observe(document.body,{childList:true,subtree:true});setInterval(run,2000);run();
})();
