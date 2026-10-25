/* Weekend flex (opt-in): keep the same weekly calorie total, but move extra calories to Sat & Sun.
   Weekdays drop by (2 × extra) ÷ 5. Off by default. */
(function(){
const $=id=>document.getElementById(id);
const own=()=>window.cloudRecordOwner?.()||'local';
const K=()=>'stride-weekend-flex-'+own();
const read=()=>{try{return JSON.parse(localStorage.getItem(K())||'null')||{on:false,extra:400};}catch{return {on:false,extra:400};}};
const write=v=>{try{localStorage.setItem(K(),JSON.stringify(v));}catch{}};
const ymd=d=>{const x=new Date(d.getTime()-d.getTimezoneOffset()*60000);return x.toISOString().slice(0,10);};
const base=()=>Number(typeof db!=='undefined'&&db.goals?.calories)||1900;
function split(){const b=base(),f=read();if(!f.on)return {wk:b,we:b,on:false};let ex=Math.max(0,Number(f.extra)||0);let wk=Math.round(b-2*ex/5);if(wk<1200){wk=1200;ex=Math.max(0,Math.round((b-1200)*5/2));}return {wk:Math.round(wk/10)*10,we:Math.round((b+ex)/10)*10,on:true};}
function goalFor(day){const s=split();if(!s.on)return base();const d=day?new Date(day+'T12:00'):new Date();const w=d.getDay();return (w===0||w===6)?s.we:s.wk;}
window.strideGoalFor=goalFor;
(function hook(n){if(!window.strideCalorieGoal||!window.strideBurnedToday){if(n<60)setTimeout(()=>hook(n+1),250);return;}
  window.strideCalorieGoal=d=>{const t=ymd(new Date());const day=d||window.strideMealDay?.()||t;return goalFor(day)+(day===t?(window.strideBurnedToday()||0):0);};
  window.render?.();})(0);
function ui(){const sg=$('saveGoals');if(!sg||$('flex6'))return;const box=document.createElement('div');box.id='flex6';
  box.innerHTML='<label class="flex6-row"><input type="checkbox" id="flex6On"> <span><b>Weekend flex</b><small>Eat more on Sat &amp; Sun, a little less on weekdays — same weekly total</small></span></label><div id="flex6More"><label for="flex6Extra">Extra on each weekend day</label><select id="flex6Extra"><option value="200">+200 kcal</option><option value="300">+300 kcal</option><option value="400">+400 kcal</option><option value="500">+500 kcal</option><option value="700">+700 kcal</option><option value="1000">+1000 kcal</option></select><p id="flex6Sum" class="flex6-sum"></p></div>';
  sg.after(box);const on=$('flex6On'),ex=$('flex6Extra');
  const sync=()=>{const f=read();on.checked=!!f.on;ex.value=String(f.extra||400);$('flex6More').hidden=!f.on;const s=split();$('flex6Sum').textContent=s.on?('Mon–Fri: '+s.wk+' kcal · Sat–Sun: '+s.we+' kcal · weekly total '+(s.wk*5+s.we*2).toLocaleString()+' kcal'+(s.wk===1200?' (weekdays kept at the 1200 minimum)':'')):'';};
  const ch=()=>{write({on:on.checked,extra:Number(ex.value)});sync();window.render?.();window.strideToast?.(on.checked?'✓ Weekend flex on':'✓ Weekend flex off');};
  on.onchange=ch;ex.onchange=ch;sync();$('calGoal')?.addEventListener('change',()=>setTimeout(sync,50));sg.addEventListener('click',()=>setTimeout(sync,100));}
const st=document.createElement('style');st.textContent='#flex6{margin-top:16px;padding-top:14px;border-top:1px solid color-mix(in srgb,var(--fg) 10%,transparent)}.flex6-row{display:flex!important;gap:12px;align-items:flex-start;font-weight:400}.flex6-row input{width:22px!important;height:22px;flex:none;margin-top:2px}.flex6-row small{display:block;color:var(--muted);font-size:13px;margin-top:2px}#flex6More[hidden]{display:none}.flex6-sum{color:var(--accent);font-weight:700;font-size:14px;margin:8px 0 0}';document.head.append(st);
new MutationObserver(()=>{if(!$('flex6'))ui();}).observe(document.body,{childList:true,subtree:true});ui();
})();
