/* Pictures: food tiles for meals/menus/plans, equipment pictograms for exercises, calendar for past meal days. */
(function(){
const $=id=>document.getElementById(id);
const S=(b,v='0 0 48 48')=>'<svg viewBox="'+v+'" width="100%" height="100%" aria-hidden="true">'+b+'</svg>';
const PLATE=S('<circle cx="24" cy="24" r="21" fill="#e9edf5"/><circle cx="24" cy="24" r="16" fill="#fff" stroke="#d5dbe7" stroke-width="1.5"/><path d="M24 24L24 9A15 15 0 0 1 38.3 28.6z" fill="#f2b04a"/><path d="M24 24L38.3 28.6A15 15 0 0 1 14 35.2z" fill="#58b368"/><path d="M24 24L14 35.2A15 15 0 0 1 24 9z" fill="#b86b3e"/><circle cx="31" cy="17" r="2" fill="#fff8" /><circle cx="22" cy="31" r="2.2" fill="#3f8f4f"/><circle cx="17" cy="22" r="1.8" fill="#8f4f2c"/>');
const food=n=>{n=String(n||'');return /shake|smoothie|protein drink/i.test(n)?'🥤':/coffee|latte|tea\b|cappuccino/i.test(n)?'☕':/milk/i.test(n)?'🥛':/juice/i.test(n)?'🧃':/water/i.test(n)?'💧':/salad/i.test(n)?'🥗':/soup|stew|chili|curry|okra|egusi|efo|pepper ?soup/i.test(n)?'🍲':/egg|omelet|akara/i.test(n)?'🍳':/jollof|rice|bowl|fried rice/i.test(n)?'🍛':/pasta|spaghetti|noodle/i.test(n)?'🍝':/fish|salmon|tuna|shrimp/i.test(n)?'🐟':/chicken|turkey|suya/i.test(n)?'🍗':/beef|steak|goat/i.test(n)?'🥩':/burger/i.test(n)?'🍔':/pizza/i.test(n)?'🍕':/wrap|sandwich|toast|bread/i.test(n)?'🥪':/oat|porridge|pap|ogi|yogurt|cereal|granola/i.test(n)?'🥣':/banana|apple|orange|fruit|berries|mango/i.test(n)?'🍎':/plantain|dodo/i.test(n)?'🍌':/pancake|waffle/i.test(n)?'🥞':/nuts|peanut|almond/i.test(n)?'🥜':/bar\b|granola bar/i.test(n)?'🍫':/yam|potato|fries/i.test(n)?'🍠':null;};
const tile=(n,cls)=>{const d=document.createElement('div');d.className='pic6 '+(cls||'');const e=food(n);if(e)d.textContent=e;else d.innerHTML=PLATE;return d;};
/* Equipment pictograms */
const st='fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"';
const EQ={
 dumbbell:S('<g '+st+'><path d="M10 18v12M15 14v20M33 14v20M38 18v12M15 24h18"/></g>'),
 barbell:S('<g '+st+'><path d="M4 24h40M9 15v18M14 12v24M34 12v24M39 15v18"/></g>'),
 kettlebell:S('<g '+st+'><path d="M17 17a7 7 0 0 1 14 0"/><path d="M15 18h18l3 6a12 12 0 1 1-24 0z"/></g>'),
 band:S('<g '+st+'><path d="M8 34c6-20 26-20 32 0"/><rect x="5" y="32" width="8" height="6" rx="2"/><rect x="35" y="32" width="8" height="6" rx="2"/></g>'),
 machine:S('<g '+st+'><path d="M10 42V6h6v36M16 10h18v8M30 18v8h-6"/><rect x="20" y="30" width="14" height="10" rx="2"/></g>'),
 run:S('<g '+st+'><circle cx="28" cy="8" r="4"/><path d="M16 42l6-12 6 4v8M12 24l6-6 8 2 6 6 6 2M22 30l-2-10"/></g>'),
 bike:S('<g '+st+'><circle cx="12" cy="32" r="8"/><circle cx="36" cy="32" r="8"/><path d="M12 32l8-16h10l6 16M20 16l4 16"/></g>'),
 core:S('<g '+st+'><circle cx="10" cy="20" r="4"/><path d="M14 23l26 6M14 23v9M40 29v4M4 36h40"/></g>'),
 body:S('<g '+st+'><circle cx="24" cy="8" r="4"/><path d="M24 13v15M14 20l10-3 10 3M24 28l-7 14M24 28l7 14"/></g>'),
 stretch:S('<g '+st+'><circle cx="24" cy="8" r="4"/><path d="M24 13v14M10 10l14 8 14-8M24 27l-10 14M24 27l10 14"/></g>')
};
const eqFor=t=>{t=String(t||'');return /kettlebell|\bkb\b|swing/i.test(t)?'kettlebell':/dumbbell|\bdb\b|goblet/i.test(t)?'dumbbell':/barbell|bench press|deadlift|\bbar\b/i.test(t)?'barbell':/band/i.test(t)?'band':/cable|machine|pulldown|leg press|row machine|smith|pec deck|curl machine/i.test(t)?'machine':/run|jog|treadmill|sprint|stride|walk/i.test(t)?'run':/bike|cycl|spin/i.test(t)?'bike':/plank|crunch|dead bug|bird dog|sit-up|hollow|core|ab\b|abs|russian|leg raise|mountain/i.test(t)?'core':/stretch|mobility|yoga|pose|foam/i.test(t)?'stretch':'body';};
const eqTile=t=>{const d=document.createElement('div');const k=eqFor(t);d.className='eq6';d.dataset.eq=k;d.innerHTML=EQ[k];d.title=k==='body'?'Bodyweight':k[0].toUpperCase()+k.slice(1);return d;};

let mvSel=null,mvWk=0;
function menuView(){
  const first=document.querySelector('details.stride-week');const plan=first?.parentElement;if(!plan)return;
  const days=[...plan.querySelectorAll(':scope>details.stride-week')];
  const key=days.map(d=>d.textContent).join('|')+'|'+mvSel+'|'+mvWk;let mv=$('mv6');
  if(mv&&mv.dataset.k===key)return;
  if(!mv){mv=document.createElement('div');mv.id='mv6';plan.prepend(mv);const outer=plan.closest('details');if(outer){outer.open=true;const sm=outer.querySelector(':scope>summary');if(sm)sm.style.display='none';outer.classList.add('mv6-outer');}}
  mv.dataset.k=key;days.forEach(d=>d.classList.add('mv6-hide'));
  const head=plan.querySelector(':scope>p.muted');if(head)head.classList.add('mv6-hide');
  const sub=(head?.textContent||'').replace(/\.?\s*Change this.*$/,'').replace(/ week/,'').replace(/ · /g,' · ');
  const todayIdx=Math.max(0,days.findIndex(d=>/today/i.test(d.querySelector('summary')?.textContent||'')));
  if(mvSel===null)mvSel=todayIdx;
  const now=new Date(),mon=new Date(now);mon.setDate(now.getDate()-((now.getDay()+6)%7)+mvWk*7);
  const dt=i=>{const d=new Date(mon);d.setDate(mon.getDate()+i);return d;};
  const f=d=>d.toLocaleDateString(undefined,{month:'short',day:'numeric'});
  const build=[...document.querySelectorAll('details')].find(d=>/build or substitute/i.test(d.querySelector(':scope>summary')?.textContent||''));
  if(build&&!build.dataset.mv6){build.dataset.mv6=1;build.classList.add('mv6-build');build.open=false;const c=document.createElement('button');c.type='button';c.className='mv6-close';c.textContent='✕ Close';c.onclick=()=>{build.open=false;$('mv6')?.scrollIntoView({behavior:'smooth',block:'start'});};build.querySelector(':scope>summary')?.after(c);}
  const openBuild=fill=>{if(!build)return;build.open=true;if(fill){const r=$('menuReplace');if(r)r.value=fill;}build.scrollIntoView({behavior:'smooth',block:'start'});};
  const day=days[mvSel],dn=(day?.querySelector('summary')?.textContent||'').replace(/\s*·.*$/,'');
  const lis=day?[...day.querySelectorAll('li')]:[];
  mv.innerHTML='<div class="mv6-top"><div><b>Your weekly menu</b><small>'+(sub||'Balanced')+'</small></div></div><button type="button" class="mv6-create">Create a meal plan</button><div class="mv6-range"><button type="button" data-w="-1" aria-label="Previous week">‹</button><span>'+(mvWk===0?'This week · ':mvWk===1?'Next week · ':mvWk===-1?'Last week · ':'')+f(dt(0))+' – '+f(dt(6))+'</span><button type="button" data-w="1" aria-label="Next week">›</button></div><div class="mv6-strip">'+days.map((d,i)=>'<button type="button" data-i="'+i+'" class="'+(i===mvSel?'on ':'')+(i===todayIdx&&mvWk===0?'tod':'')+'"><i>'+['M','T','W','T','F','S','S'][i]+'</i><b>'+dt(i).getDate()+'</b></button>').join('')+'</div><div class="mv6-day"><b class="mv6-dn">'+dn+'</b></div><button type="button" class="mv6-swap">↻ Swap a meal or regenerate this day <span>›</span></button>';
  const card=mv.querySelector('.mv6-day');
  lis.forEach(li=>{const slot=(li.querySelector('b')?.textContent||'').replace(/[:\s]+$/,'');const name=[...li.childNodes].filter(n=>n.nodeType===3||(n.tagName&&!/^(B|BUTTON|DIV)$/.test(n.tagName))).map(n=>n.textContent).join('').trim();const row=document.createElement('div');row.className='mv6-row';row.append(tile(name,'pic6-md'));const t=document.createElement('div');t.innerHTML='<small>'+slot.toUpperCase()+'</small><b></b>';t.querySelector('b').textContent=name;row.append(t);const ob=li.querySelector('button');if(ob){const b=document.createElement('button');b.type='button';b.className='mv6-log';b.textContent='＋ Log';b.onclick=()=>{ob.click();b.textContent='✓ Logged';};row.append(b);}card.append(row);});
  mv.querySelector('.mv6-create').onclick=()=>openBuild('');
  mv.querySelector('.mv6-swap').onclick=()=>openBuild(dn?dn+': ':'');
  mv.querySelector('.mv6-range').onclick=e=>{const b=e.target.closest('button');if(!b)return;mvWk+=Number(b.dataset.w);menuView();};mv.querySelector('.mv6-strip').onclick=e=>{const b=e.target.closest('button');if(!b)return;mvSel=Number(b.dataset.i);menuView();};
}
function decorate(){
  menuView();
  document.querySelectorAll('.meal-diary-entry:not([data-p6])').forEach(c=>{c.dataset.p6=1;if(c.querySelector('.v6-mealpic'))return;c.prepend(tile(c.querySelector('h3')?.textContent,'pic6-float'));c.classList.add('v6-haspic');});
  document.querySelectorAll('.meal-diary-entry:not([data-s6])').forEach(c=>{const st=[...c.querySelectorAll('.meal-diary-metrics .workout-history-stat')].map(x=>x.querySelector('strong')?.textContent+' '+(x.querySelector('span')?.textContent||'').toLowerCase().replace('protein','g protein').replace(/^(\S+) g g/,'$1 g'));if(!st.length)return;c.dataset.s6=1;const sub=document.createElement('p');sub.className='ml6-sub';sub.textContent=st.join(' · ').replace(/ g g protein/,' g protein');c.querySelector('.workout-history-title')?.append(sub);c.classList.add('ml6');});
  document.querySelectorAll('.menu-meal:not([data-p6])').forEach(c=>{c.dataset.p6=1;const t=c.querySelector('li')?.textContent;c.querySelector('.menu-meal-head')?.prepend(tile(t,'pic6-sm'));});
  document.querySelectorAll('details.stride-week li:not([data-p6])').forEach(li=>{li.dataset.p6=1;li.prepend(tile(li.textContent.replace(/^[^:]*:/,''),'pic6-sm'));li.classList.add('li6');});
  document.querySelectorAll('.exercise:not([data-p6])').forEach(c=>{c.dataset.p6=1;const nm=(c.querySelector('summary,strong')?.textContent||'')+' '+c.textContent.slice(0,200);const h=c.querySelector('summary')||c.querySelector('label.core-row')||c.firstElementChild;if(!h)return;h.prepend(eqTile(nm));h.classList.add('eqrow6');});
  calendar();
}
let calMonth=null;
function calendar(){
  if(typeof db==='undefined')return;
  const row=$('mealDay6');if(!row)return;let box=$('pastCal6');if(!box){box=document.createElement('div');box.id='pastCal6';box.hidden=true;(row.parentElement).style.position='relative';row.after(box);document.addEventListener('click',e=>{if(!box.hidden&&!box.contains(e.target)&&!e.target.closest('#mealDay6'))box.hidden=true;});const cal=row.querySelector('.v6-dcal');if(cal){const b=document.createElement('button');b.type='button';b.className='v6-dnav';b.setAttribute('aria-label','Choose a day');b.innerHTML=cal.querySelector('svg')?.outerHTML||'📅';b.onclick=()=>{box.hidden=!box.hidden;};cal.replaceWith(b);}}
  const iso=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
  const now=new Date();if(!calMonth)calMonth=new Date(now.getFullYear(),now.getMonth(),1);
  const has=new Set((db.meals||[]).map(m=>m.date)),sel=window.strideMealDay?.()||iso(now);
  const key=iso(calMonth)+'|'+sel+'|'+has.size;if(box.dataset.k===key)return;box.dataset.k=key;
  const y=calMonth.getFullYear(),m=calMonth.getMonth(),first=(new Date(y,m,1).getDay()+6)%7,n=new Date(y,m+1,0).getDate();
  let h='<div class="cal6-h"><button type="button" data-n="-1" aria-label="Previous month">‹</button><b>'+calMonth.toLocaleDateString(undefined,{month:'long',year:'numeric'})+'</b><button type="button" data-n="1" aria-label="Next month"'+(y===now.getFullYear()&&m===now.getMonth()?' disabled':'')+'>›</button></div><div class="cal6-g">'+['M','T','W','T','F','S','S'].map(d=>'<i>'+d+'</i>').join('')+'<span></span>'.repeat(first);
  for(let d=1;d<=n;d++){const k=iso(new Date(y,m,d)),fut=k>iso(now);h+='<button type="button" data-d="'+k+'" class="'+(has.has(k)?'has ':'')+(k===sel?'sel ':'')+(k===iso(now)?'tod':'')+'"'+(fut?' disabled':'')+'>'+d+'</button>';}
  box.innerHTML=h+'</div><p class="cal6-k"><i></i> meals logged · tap a day to see it</p>';
  box.onclick=e=>{const b=e.target.closest('button');if(!b||b.disabled)return;if(b.dataset.n){calMonth=new Date(y,m+Number(b.dataset.n),1);box.dataset.k='';calendar();return;}window.strideMealSetDay?.(b.dataset.d);box.hidden=true;};
}
const css=document.createElement('style');css.textContent=`
.mv6-hide{display:none!important}.mv6-build:not([open]){display:none!important}.mv6-build>summary{display:none!important}.mv6-close{float:right;width:auto!important;background:none!important;border:0!important;color:var(--muted)!important;font-weight:700;padding:4px!important;margin:0!important}.mv6-outer{background:none!important;border:0!important;padding:0!important;box-shadow:none!important}
.mv6-top b{display:block;font-size:19px}.mv6-top small{color:var(--muted);font-size:13px}
.mv6-create{display:block;width:100%;margin:12px 0!important;background:var(--accent)!important;color:var(--on-accent)!important;border:0!important;border-radius:14px!important;padding:13px!important;font-weight:700;font-size:15px}
.mv6-range{font-weight:700;margin:4px 0 8px;display:flex;align-items:center;justify-content:space-between}.mv6-range button{background:none!important;border:0!important;color:var(--fg)!important;font-size:24px;line-height:1;padding:2px 12px!important;margin:0!important;width:auto!important;min-height:0!important}
.mv6-strip{display:grid;grid-template-columns:repeat(7,1fr);gap:4px;margin-bottom:12px}.mv6-strip button{background:none!important;border:0!important;color:var(--fg)!important;padding:4px 0!important;margin:0!important;display:flex;flex-direction:column;align-items:center;gap:4px;width:auto!important;min-height:0!important}.mv6-strip i{font-style:normal;font-size:12px;color:var(--muted)}.mv6-strip b{display:grid;place-items:center;width:34px;height:34px;border-radius:50%;font-size:14px}.mv6-strip .tod i{color:var(--accent);font-weight:700}.mv6-strip .on b{background:var(--accent);color:var(--on-accent)}
.mv6-day{background:var(--card);border:1px solid var(--soft);border-radius:18px;padding:14px;margin-bottom:10px}.mv6-dn{font-size:17px}
.mv6-row{display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid var(--soft)}.mv6-row:last-child{border:0;padding-bottom:0}.mv6-row>div:nth-child(2){flex:1;min-width:0}.mv6-row small{display:block;font-size:11px;letter-spacing:.08em;font-weight:700;color:var(--muted)}.mv6-row b{font-size:14.5px}
.pic6-md{width:52px;height:52px;font-size:28px}.pic6-md svg{width:44px;height:44px}
.mv6-log{flex:none;width:auto!important;margin:0!important;padding:6px 10px!important;font-size:12.5px!important;font-weight:700;border:1px solid var(--accent)!important;color:var(--accent)!important;background:none!important;border-radius:10px!important;min-height:0!important}
.mv6-swap{display:flex;width:100%;justify-content:space-between;align-items:center;background:var(--card)!important;border:1px solid var(--soft)!important;color:var(--fg)!important;border-radius:14px!important;padding:13px 14px!important;font-weight:700;margin:0 0 10px!important;text-align:left}.mv6-swap span{color:var(--muted)}
.meal-diary-entry.ml6{padding:10px 12px!important;display:flow-root}.meal-diary-entry.ml6 .meal-diary-metrics{display:none!important}.meal-diary-entry.ml6 .workout-history-head{border:0!important;padding:0!important;margin:0!important}.meal-diary-entry.ml6 h3{font-size:15px!important;margin:0!important}.ml6-sub{margin:2px 0 0;font-size:12.5px;color:var(--muted)}.meal-diary-entry.ml6 .repeat-meal{float:right;margin:-26px 0 0!important;padding:5px 10px!important;font-size:12px!important;min-height:0!important;border:1px solid var(--accent)!important;color:var(--accent)!important;background:none!important;border-radius:10px!important}
.meal-diary-entry.ml6 .pic6-float{width:52px;height:52px;margin:0 12px 0 0}
.pic6{display:grid;place-items:center;border-radius:14px;flex:none;background:color-mix(in srgb,var(--accent) 15%,var(--card));overflow:hidden}
.pic6-float{float:left;width:56px;height:56px;font-size:30px;margin:0 12px 6px 0}.pic6-float svg{width:48px;height:48px}
.pic6-sm{width:40px;height:40px;font-size:22px;border-radius:10px;margin-right:10px;display:inline-grid;vertical-align:middle}.pic6-sm svg{width:34px;height:34px}
.menu-meal-head{display:flex;align-items:center;gap:6px}
li.li6{display:flex;align-items:center;list-style:none;margin:6px 0}
.eq6{width:44px;height:44px;flex:none;border-radius:12px;padding:7px;color:var(--accent);background:color-mix(in srgb,var(--accent) 15%,var(--card));display:inline-grid;vertical-align:middle;margin-right:10px}
.eqrow6{display:flex!important;align-items:center}
#pastWrap6{border-top:1px solid var(--soft);margin-top:12px;padding-top:10px}.cal6-t{margin:0 0 6px;font-size:16px}#mealDay6{position:relative}#pastCal6{position:absolute;z-index:30;right:12px;top:52px;width:260px;margin:0;padding:8px 10px;border:1px solid var(--soft);border-radius:14px;background:var(--card);box-shadow:0 12px 30px rgba(0,0,0,.45)}#pastCal6 .cal6-h b{font-size:13.5px}#pastCal6 .cal6-h button{font-size:18px}#pastCal6 .cal6-g{gap:2px}#pastCal6 .cal6-g i{font-size:10.5px}#pastCal6 .cal6-g button{height:28px;width:28px!important;font-size:12.5px}#pastCal6 .cal6-g button.has::after{bottom:2px;width:4px;height:4px;margin-left:-2px}#pastCal6 .cal6-k{font-size:11px;margin-top:4px}.cal6-h{display:flex;align-items:center;justify-content:space-between;margin-bottom:6px}.cal6-h button{background:none!important;border:0!important;color:var(--fg)!important;font-size:22px;width:auto!important;padding:2px 10px!important;margin:0!important}.cal6-h button:disabled{opacity:.3}
.cal6-g{display:grid;grid-template-columns:repeat(7,1fr);gap:4px;text-align:center}.cal6-g i{font-style:normal;font-size:12px;color:var(--muted)}
.cal6-g button{height:34px;width:34px!important;justify-self:center;margin:0!important;padding:0!important;border-radius:50%!important;background:transparent!important;border:0!important;color:var(--fg)!important;font-weight:600;font-size:14px;position:relative;min-height:0!important}
.cal6-g button.has::after{content:"";position:absolute;left:50%;bottom:4px;width:5px;height:5px;margin-left:-2.5px;border-radius:50%;background:var(--accent)}
.cal6-g button.tod{box-shadow:inset 0 0 0 1.5px var(--accent)}.cal6-g button.sel{background:var(--accent)!important;color:var(--on-accent)!important}.cal6-g button.sel::after{background:var(--on-accent)}.cal6-g button:disabled{opacity:.3}
.cal6-k{font-size:12px;color:var(--muted);margin:6px 0 0}.cal6-k i{display:inline-block;width:6px;height:6px;border-radius:50%;background:var(--accent);vertical-align:middle}`;
document.head.append(css);
window.strideFoodPic=food;window.strideEquipPic=eqTile;
window.__p6=decorate;let q=0;const run=()=>{q=0;try{decorate()}catch(e){console.warn('p6',e.message)}};new MutationObserver(()=>{if(!q){q=1;requestAnimationFrame(run);}}).observe(document.body,{childList:true,subtree:true});run();
})();
