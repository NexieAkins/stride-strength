/* Stride & Strength redesign: shared icons, tab bar with centre ＋, Performance skin, and the new Home. Loaded last. */
(()=>{
'use strict';
const $=id=>document.getElementById(id);
const el=(tag,props={},kids=[])=>{const n=Object.assign(document.createElement(tag),props);for(const k of [].concat(kids))n.append(k);return n;};
const NS='http://www.w3.org/2000/svg';
const ICONS={
 home:'<path d="M4 11l8-7 8 7v9h-5v-6H9v6H4z" fill="currentColor"/>',
 run:'<g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="14" cy="4" r="2"/><path d="M8 21l3-6 3 2v4M6 12l3-3 4 1 3 3 3 1M11 15l-1-5"/></g>',
 walk:'<g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="13" cy="4" r="2"/><path d="M10 21l2-6 3 3v3M9 13l2-5 3 2 3 2M11 8l-3 3"/></g>',
 fork:'<g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 3v7a2 2 0 0 0 4 0V3M8 10v11M16 3c-2 1-3 4-3 7h3v11"/></g>',
 bars:'<g stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6 20v-6M12 20V8M18 20V4"/></g>',
 plus:'<path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/>',
 drop:'<path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>',
 trophy:'<g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 4h8v5a4 4 0 0 1-8 0V4zM8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4M12 13v4M9 20h6"/></g>',
 chev:'<path d="M9 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
 play:'<path d="M7 5l12 7-12 7z" fill="currentColor"/>',
 dumb:'<g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 10v4M6 8v8M18 8v8M21 10v4M6 12h12"/></g>',
 core:'<g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="6" cy="8" r="2"/><path d="M4 16c4 1 9 1 16-4M8 10l3 5"/></g>',
 spark:'<g fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"><rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4h6v3H9zM9 12h6M9 16h4"/></g>',
 moon:'<path d="M19 15A8 8 0 1 1 10 4a6 6 0 0 0 9 11z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>',
 wind:'<path d="M3 9h11a3 3 0 1 0-3-3M3 15h15a3 3 0 1 1-3 3M3 12h8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
 cam:'<g fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/></g>',
 flame:'<path d="M12 3c1 4 5 5 5 10a5 5 0 0 1-10 0c0-3 2-4 2-7 1.5 1 3 2 3-3z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>',
 cal:'<g fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M9 3v4M15 3v4"/></g>',
 leaf:'<path d="M5 19C5 10 11 5 20 5c0 9-5 14-14 14zM5 19l7-7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
 pen:'<path d="M4 20l4-1 11-11-3-3L5 16zM14 6l3 3" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>',
 list:'<g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M9 6h11M9 12h11M9 18h11"/><circle cx="4.5" cy="6" r="1"/><circle cx="4.5" cy="12" r="1"/><circle cx="4.5" cy="18" r="1"/></g>',
 redo:'<path d="M4 12a8 8 0 1 0 3-6.2M4 4v4h4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
 watch:'<g fill="none" stroke="currentColor" stroke-width="2"><rect x="6" y="6" width="12" height="12" rx="3"/><path d="M9 6l1-3h4l1 3M9 18l1 3h4l1-3"/></g>'
};
const icon=(name,size=20)=>{const s=document.createElementNS(NS,'svg');s.setAttribute('viewBox','0 0 24 24');s.setAttribute('width',size);s.setAttribute('height',size);s.setAttribute('aria-hidden','true');s.innerHTML=ICONS[name]||'';return s;};
window.strideIcon=icon;
window.strideSelDay=window.strideSelDay||null;
const day=(d=new Date())=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
const sum=(a,k)=>a.reduce((n,x)=>n+(Number(x[k])||0),0);
const fmt=n=>Math.round(n).toLocaleString();

/* ---------- Tab bar: icons, centre ＋ for Log ---------- */
function tabbar(){
  const nav=document.querySelector('nav');if(!nav||nav.dataset.v6)return;nav.dataset.v6='1';
  const by=k=>nav.querySelector('[data-go='+k+']');
  const order=['home','train','log','meals','progress'].map(by).filter(Boolean);order.forEach(b=>nav.append(b));
  const names={home:['home','Home'],train:['run','Train'],meals:['fork','Meals'],progress:['bars','Progress']};
  order.forEach(b=>{const k=b.dataset.go;if(k==='log'){b.replaceChildren(el('span',{className:'v6-fab'},[icon('plus',26)]));b.setAttribute('aria-label','Log something');b.classList.add('v6-log');}else{b.replaceChildren(icon(names[k][0],22),el('span',{textContent:names[k][1]}));}});
}

/* ---------- Performance skin (black + lime) ---------- */
function performanceSkin(){
  const sw=document.querySelector('.v5-skins');if(!sw||sw.querySelector('[data-skin=Performance]'))return;
  const V=['#0a0a0a','#151515','#262626','#f5f5f5','#a5a5a5','#c8f43c','#0a0a0a'];
  const props=['--bg','--card','--soft','--fg','--muted','--accent','--on-accent'];
  const owner=()=>window.cloudRecordOwner?.()||'browser';
  const keyName=()=>Object.keys(localStorage).find(k=>/appearance|v5/i.test(k)&&k.endsWith(owner()))||null;
  const apply=()=>{V.forEach((v,i)=>document.documentElement.style.setProperty(props[i],v));document.documentElement.style.colorScheme='dark';sw.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.skin==='Performance')));};
  const b=el('button',{type:'button',textContent:'Performance'});b.dataset.skin='Performance';const i=el('i');i.style.background=V[0];i.style.border='3px solid '+V[5];b.prepend(i);
  b.onclick=()=>{try{localStorage.setItem('stride-skin-performance-'+owner(),'1');}catch(e){}apply();};
  sw.append(b);
  sw.querySelectorAll('button:not([data-skin=Performance])').forEach(o=>o.addEventListener('click',()=>{try{localStorage.removeItem('stride-skin-performance-'+owner());}catch(e){}}));
  const keep=()=>{try{if(localStorage.getItem('stride-skin-performance-'+owner())==='1')apply();}catch(e){}};
  keep();const r0=render;render=function(){r0();keep();};
}

/* ---------- Home ---------- */
function milestone(){
  const runs=db.workouts.filter(w=>/run/i.test(w.type||'')),longest=Math.max(0,...runs.map(w=>Number(w.miles)||0));
  const dist=[[3.1,'Run a 5K'],[6.2,'Run a 10K'],[13.1,'Run a half marathon'],[26.2,'Run a marathon']].find(([m])=>longest<m);
  const n=db.workouts.length,count=[[5,'5 workouts'],[10,'10 workouts'],[25,'25 workouts'],[50,'50 workouts'],[100,'100 workouts']].find(([m])=>n<m);
  const opts=[];if(dist&&runs.length)opts.push({label:dist[1],badge:dist[0]===3.1?'5K':dist[0]===6.2?'10K':dist[0]===13.1?'HM':'M',pct:longest/dist[0]});
  if(count)opts.push({label:'Log '+count[1],badge:String(count[0]),pct:n/count[0]});
  return opts.sort((a,b)=>b.pct-a.pct)[0]||{label:'Keep it going',badge:'★',pct:1};
}
function weekDays(){const d=new Date(),mon=new Date(d);mon.setDate(d.getDate()-((d.getDay()+6)%7));return [...Array(7)].map((_,i)=>{const x=new Date(mon);x.setDate(mon.getDate()+i);return x;});}
function buildHome(){
  const home=$('home');if(!home||$('homeV6'))return;
  const wrap=el('div',{id:'homeV6'});home.prepend(wrap);home.classList.add('v6');
  // Preferences live in a sheet opened from Account (and from Home when nothing is set yet).
  const sheet=el('dialog',{id:'prefsSheet',className:'v6-sheet'});
  const close=el('button',{type:'button',className:'v6-sheetx','aria-label':'Close',textContent:'✕'});close.onclick=()=>sheet.close();
  const prefs=$('homePreferences'),sched=home.querySelector('.calm-fold'),prof=$('setName');
  sheet.append(el('div',{className:'v6-sheethead'},[el('h2',{textContent:'Fitness preferences'}),close]),el('p',{className:'v6-sub',textContent:'Your weekly schedule, meal style and diet rules. Change them any time.'}));
  if(prof){prof.textContent='Edit fitness profile (age, weight, goals)';prof.classList.add('v6-ghost');sheet.append(prof);}
  if(prefs){prefs.open=true;const sm=prefs.querySelector(':scope>summary');if(sm)sm.hidden=true;prefs.classList.add('v6-flatprefs');prefs.addEventListener('toggle',()=>{if(!prefs.open&&prefs.closest('#prefsSheet'))prefs.open=true;});sheet.append(prefs);prefs.querySelectorAll('button').forEach(b=>{if(/^done$/i.test(b.textContent.trim())){b.hidden=true;b.style.display='none';}});}
  // The weekly schedule list stays in the page (hidden on Home) because other screens update it.
  const done=el('button',{type:'button',className:'v6-start',textContent:'Save & close'});done.onclick=()=>sheet.close();sheet.append(done);
  document.body.append(sheet);
  sheet.addEventListener('close',()=>render());
  window.strideOpenPrefs=(focus)=>{setTimeout(()=>{if(focus!=='schedule')return;const h=[...sheet.querySelectorAll('h2,h3,h4,legend,summary,label,b,p')].find(x=>/weekly schedule/i.test(x.textContent)&&x.textContent.length<40);h?.scrollIntoView({behavior:'smooth',block:'start'});},250);const pf=$('homePreferences');if(pf){if(pf.parentElement!==sheet)done.before(pf);pf.hidden=false;pf.classList.remove('hidden');pf.open=true;}if(!sheet.open)sheet.showModal();const p=$('homePreferences');if(p)p.open=true;};
  // First time: ask once for preferences (after sign-in / welcome and any profile dialog).
  const owner=()=>window.cloudRecordOwner?.()||'browser';
  const firstAsk=()=>{try{const k='stride-prefs-asked-'+owner();if(localStorage.getItem(k))return;if(document.body.classList.contains('welcome')||document.querySelector('dialog[open]'))return setTimeout(firstAsk,3000);const noSched=typeof plan!=='undefined'&&plan.every(x=>/choose your schedule/i.test(x[1]));if(!noSched||$('mealStyle')?.value){localStorage.setItem(k,'1');return;}localStorage.setItem(k,'1');window.strideOpenPrefs();}catch(e){}};
  setTimeout(firstAsk,3500);window.addEventListener('stride-account-change',()=>setTimeout(firstAsk,3500));
}
window.strideWeekStrip=(t)=>{const today=day(),logged=new Set([...db.workouts,...db.meals].map(x=>x.date));const strip=el('div',{className:'v6-week',role:'group','aria-label':'Choose a day'});
  weekDays().forEach(d=>{const k=day(d);const b=el('button',{type:'button',className:(k===t?'t ':'')+(k===today?'today ':'')+(logged.has(k)?'dot':'')},[el('span',{textContent:'MTWTFSS'[(d.getDay()+6)%7]}),el('b',{textContent:String(d.getDate())})]);b.setAttribute('aria-pressed',String(k===t));b.setAttribute('aria-label',d.toLocaleDateString(undefined,{weekday:'long',month:'long',day:'numeric'}));{const goal=window.strideCalorieGoal?window.strideCalorieGoal(k):(Number(db.goals?.calories)||1900);const kc=db.meals.filter(m=>m.date===k).reduce((a,m)=>a+(Number(m.calories)||0),0);const wk=db.workouts.some(w=>w.date===k);const nf=Math.min(1,kc/goal);const C1=2*Math.PI*20,C2=2*Math.PI*15;const ns='http://www.w3.org/2000/svg';const sv=document.createElementNS(ns,'svg');sv.setAttribute('viewBox','0 0 48 48');sv.setAttribute('class','ring6');sv.innerHTML='<circle cx="24" cy="24" r="20" class="r6-bg"/><circle cx="24" cy="24" r="20" class="r6-fit" stroke-dasharray="'+(wk?C1:0)+' '+C1+'"/><circle cx="24" cy="24" r="15" class="r6-bg"/><circle cx="24" cy="24" r="15" class="r6-nut'+(nf>=.9?' full':'')+'" stroke-dasharray="'+(nf*C2).toFixed(1)+' '+C2+'"/>';b.querySelector('b').prepend(sv);b.setAttribute('aria-label',b.getAttribute('aria-label')+(wk?', workout done':'')+(kc?', '+Math.round(nf*100)+'% of calorie goal':''));}b.onclick=()=>{window.strideSelDay=k===today?null:k;render();};strip.append(b);});return strip;};
function drawHome(){
  const wrap=$('homeV6');if(!wrap||typeof db==='undefined')return;
  const today=day(),t=window.strideSelDay&&window.strideSelDay!==today?window.strideSelDay:today,isToday=t===today,sel=new Date(t+'T12:00'),meals=db.meals.filter(m=>m.date===t),h=new Date().getHours();
  const name=(db.profile?.user_id===(window.cloudRecordOwner?.()||'browser')&&db.profile.display_name)||(($('personalGreeting')?.textContent||'').match(/, ([^👋]+)/)?.[1]||'').trim();
  const base0=Number(db.goals.calories)||1900,burn=isToday?(window.strideBurnedToday?.()||0):0,goal=base0+burn,base=base0;
  const eaten=sum(meals,'calories'),left=goal-eaten,pg=Number(db.goals.protein)||110;
  const fg=Math.round(base*.3/9),cg=Math.max(50,Math.round((base-pg*4-fg*9)/4));
  const plan0=(typeof plan!=='undefined'&&plan[(sel.getDay()+6)%7])||['', 'Choose your schedule',[]];const dayWorkouts=db.workouts.filter(w=>w.date===t);const dayName=sel.toLocaleDateString(undefined,{weekday:'long',month:'short',day:'numeric'});
  const noPlan=/choose your schedule/i.test(plan0[1]);
  const isRun=/run|walk/i.test(plan0[1]);
  const week=weekDays(),logged=new Set([...db.workouts,...db.meals].map(x=>x.date));
  const wk=db.workouts.filter(w=>w.date>=day(week[0])&&w.date<=day(week[6]));
  const ms=milestone(),water=Number(db.water?.[t])||0;
  wrap.replaceChildren();
  wrap.append(el('p',{className:'v6-hello',textContent:isToday?(h<12?'Good morning':h<17?'Good afternoon':'Good evening')+(name?', '+name:''):(t<today?'Looking back':'Looking ahead')}),el('h2',{className:'v6-title',textContent:isToday?'Your day, in motion.':dayName}));
  if(!isToday){const bk=el('button',{type:'button',className:'v6-linkbtn v6-back',textContent:'‹ Back to today'});bk.onclick=()=>{window.strideSelDay=null;render();};wrap.append(bk);}
  wrap.append(window.strideWeekStrip(t));
  // Today's workout
  const wc=el('div',{className:'card v6-card'});
  wc.append(el('div',{className:'v6-ch'},[icon(isRun?'run':'dumb',18),el('span',{textContent:isToday?'Today’s workout':t<today?'Workouts that day':'Planned workout'})]));
  if(!isToday&&(t<today||dayWorkouts.length)){
    if(dayWorkouts.length)dayWorkouts.forEach(w=>wc.append(el('div',{className:'v6-wk'},[el('div',{},[el('h3',{className:'v6-h3',textContent:w.type||'Workout'}),el('p',{className:'v6-sub',textContent:[Number(w.miles)?Number(w.miles).toFixed(2)+' mi':'',Number(w.minutes)?Math.round(w.minutes)+' min':''].filter(Boolean).join(' · ')||'Logged'})])])));
    else wc.append(el('h3',{className:'v6-h3',textContent:'Nothing logged'}),el('p',{className:'v6-sub',textContent:noPlan?'No plan that day.':'Planned: '+plan0[1]}));
  }else if(!isToday){
    wc.append(el('h3',{className:'v6-h3',textContent:noPlan?'Nothing planned yet':plan0[1]}),el('p',{className:'v6-sub',textContent:noPlan?'Set your weekly schedule to plan ahead.':(plan0[2]||[]).slice(0,3).join(' · ')}));
    const back=el('button',{type:'button',className:'v6-ghost',textContent:'Back to today'});back.onclick=()=>{window.strideSelDay=null;render();};wc.append(back);
  }else if(noPlan){
    wc.append(el('h3',{className:'v6-h3',textContent:'Pick today’s workout'}),el('p',{className:'v6-sub',textContent:'Plan one in a minute, or set your weekly schedule once.'}));
    const b=el('button',{type:'button',className:'v6-start'},[icon('spark',16),document.createTextNode(' Plan my workout')]);b.onclick=()=>{show('train');window.dispatchEvent(new CustomEvent('stride-plan-workout'));};
    const s=el('button',{type:'button',className:'v6-ghost',textContent:'Set my weekly schedule'});s.onclick=()=>window.strideOpenPrefs('schedule');
    wc.append(b,s);
  }else{
    const items=(plan0[2]||[]).slice(0,3).join(' · ');
    wc.append(el('div',{className:'v6-wk'},[el('div',{},[el('h3',{className:'v6-h3',textContent:plan0[1]}),el('p',{className:'v6-sub',textContent:items})])]));
    const route=document.createElementNS(NS,'svg');route.setAttribute('viewBox','0 0 110 44');route.setAttribute('class','v6-route');route.innerHTML='<path d="M2 34 C18 6, 30 6, 42 26 S 64 44, 76 20 S 98 4, 108 14" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/><circle cx="108" cy="14" r="4" fill="currentColor"/>';wc.querySelector('.v6-wk').append(route);
    const b=el('button',{type:'button',className:'v6-start'},[icon('play',16),document.createTextNode(isRun?' Start '+(/walk/i.test(plan0[1])?'walk':'run'):' Start workout')]);
    b.onclick=()=>{show('train');window.dispatchEvent(new CustomEvent('stride-train-view',{detail:'today'}));if(isRun&&window.strideStartRun)window.strideStartRun(/walk/i.test(plan0[1])?'walk':/quality/i.test(plan0[1])?'quality':'run');};
    wc.append(b);
  }
  wrap.append(wc);
  // Nutrition
  const nc=el('div',{className:'card v6-card'});nc.append(el('div',{className:'v6-ch'},[icon('fork',18),el('span',{textContent:isToday?'Today’s nutrition':'Nutrition · '+sel.toLocaleDateString(undefined,{weekday:'short'})})]));
  const pct=Math.max(0,Math.min(1,eaten/goal)),C=194.8;
  const ring=document.createElementNS(NS,'svg');ring.setAttribute('viewBox','0 0 76 76');ring.setAttribute('width','76');ring.setAttribute('height','76');ring.setAttribute('role','img');ring.setAttribute('aria-label',Math.round(pct*100)+'% of calorie goal eaten');
  ring.innerHTML='<circle cx="38" cy="38" r="31" fill="none" stroke="var(--soft)" stroke-width="9"/><circle cx="38" cy="38" r="31" fill="none" stroke="var(--accent)" stroke-width="9" stroke-linecap="round" stroke-dasharray="'+C+'" stroke-dashoffset="'+(C*(1-pct))+'" transform="rotate(-90 38 38)"/>';
  const over=left<0;
  nc.append(el('div',{className:'v6-nut'},[ring,el('div',{},[el('div',{className:'v6-big'},[document.createTextNode(fmt(Math.abs(left))+' '),el('small',{textContent:over?'kcal over':isToday?'kcal left':'kcal under goal'})]),el('div',{className:'v6-eq',textContent:fmt(base)+' goal − '+fmt(eaten)+' eaten'+(burn?' + '+fmt(burn)+' workout':'')})])]));
  const mac=el('div',{className:'v6-macros'});[['Protein',sum(meals,'protein'),pg],['Carbs',sum(meals,'carbs'),cg],['Fat',sum(meals,'fat'),fg]].forEach(([l,v,g])=>{const bar=el('div',{className:'v6-bar'},[el('i')]);bar.firstChild.style.width=Math.min(100,v/g*100)+'%';mac.append(el('div',{},[document.createTextNode(l),el('b',{textContent:Math.round(v)+' / '+g+' g'}),bar]));});
  nc.append(mac);nc.onclick=e=>{if(!e.target.closest('button'))show('meals');};nc.style.cursor='pointer';wrap.append(nc);
  // Water
  const cups=el('span',{className:'v6-cups'});for(let i=0;i<8;i++)cups.append(el('i',{className:i<water?'f':''}));
  const add=el('button',{type:'button',className:'v6-plus','aria-label':'Add a glass of water',hidden:!isToday},[icon('plus',14)]);add.onclick=()=>$('addWater')?.click();
  wrap.append(el('div',{className:'card v6-card v6-water'},[icon('drop',20),el('b',{textContent:'Water'}),el('span',{className:'v6-sub',textContent:water+' / 8'}),(()=>{const m=el('button',{type:'button',className:'v6-plus v6-minus','aria-label':'Remove a glass of water',textContent:'−',hidden:!isToday,disabled:!water});m.onclick=()=>window.strideWaterMinus?.();return m;})(),cups,add]));
  // This week + milestone
  const wkc=el('div',{className:'card v6-card'},[el('div',{className:'v6-ch'},[icon('bars',16),el('span',{textContent:'This week'})]),el('div',{className:'v6-stat'},[document.createTextNode(wk.length+' '),el('small',{textContent:wk.length===1?'workout':'workouts'}),el('br'),document.createTextNode(sum(wk,'miles').toFixed(1)+' '),el('small',{textContent:'mi'})])]);
  wkc.onclick=()=>show('progress');
  const badge=document.createElementNS(NS,'svg');badge.setAttribute('viewBox','0 0 42 46');badge.setAttribute('class','v6-badge');badge.innerHTML='<path d="M21 2l18 10v22L21 44 3 34V12z" fill="color-mix(in srgb,var(--accent) 22%,transparent)" stroke="var(--accent)" stroke-width="2"/><text x="21" y="28" text-anchor="middle" font-size="11" font-weight="800" fill="currentColor">'+ms.badge+'</text>';
  const mbar=el('div',{className:'v6-bar'},[el('i')]);mbar.firstChild.style.width=Math.round(Math.min(1,ms.pct)*100)+'%';
  const mc=el('div',{className:'card v6-card'},[el('div',{className:'v6-ch'},[icon('trophy',16),el('span',{textContent:'Next milestone'})]),el('div',{className:'v6-mil'},[badge,el('div',{},[el('b',{textContent:ms.label}),el('p',{textContent:Math.round(Math.min(1,ms.pct)*100)+'% there'})])]),mbar]);
  mc.onclick=()=>show('progress');
  wrap.append(el('div',{className:'v6-two'},[wkc,mc]));
}

const css=el('style');css.textContent=`
nav{display:grid!important;grid-template-columns:repeat(5,1fr);align-items:center}
nav button{display:flex!important;flex-direction:column;align-items:center;gap:3px;background:transparent!important;color:var(--muted)!important;font-size:11px!important;font-weight:600;padding:8px 0!important;margin:0!important;border:0!important;box-shadow:none!important}
nav button.active{color:var(--accent)!important}
nav button.v6-log{overflow:visible}
.v6-fab{width:56px;height:56px;border-radius:50%;background:var(--accent);color:var(--on-accent);display:grid;place-items:center;margin-top:-26px;border:4px solid var(--bg);box-shadow:0 8px 22px color-mix(in srgb,var(--accent) 45%,transparent)}
nav button.v6-log.active .v6-fab{outline:2px solid var(--fg);outline-offset:2px}
#home.v6>*:not(#homeV6){display:none!important}
#homeV6 .card{margin:0 0 10px}
.v6-hello{color:var(--muted);margin:8px 0 0;font-size:15px}
.v6-title{font-size:28px;font-weight:800;margin:2px 0 14px;letter-spacing:-.01em}
.v6-week{display:grid;grid-template-columns:repeat(7,1fr);text-align:center;font-size:12px;color:var(--muted);margin-bottom:14px}
.v6-week button{background:transparent!important;border:0!important;margin:0!important;padding:0!important;color:var(--muted)!important;font-size:12px;display:flex!important;flex-direction:column;align-items:center;cursor:pointer}
.v6-week .today{color:var(--accent)!important;font-weight:700}
.v6-week b{display:grid;place-items:center;width:34px;height:34px;margin:4px auto 0;border-radius:50%;font-weight:600;color:var(--fg);font-size:14px}
.v6-week .t{color:var(--accent);font-weight:700}.v6-week .t b{background:var(--accent);color:var(--on-accent)}
.v6-week .dot b{box-shadow:inset 0 -3px 0 -1px var(--accent)}.v6-week .t.dot b{box-shadow:none}
.v6-card{border-radius:20px!important;padding:16px!important}
.v6-ch{display:flex;align-items:center;gap:8px;font-size:14px;color:var(--muted);font-weight:600}.v6-ch svg{color:var(--accent)}
.v6-h3{margin:8px 0 2px;font-size:22px}.v6-sub{margin:0;color:var(--muted);font-size:14px}
.v6-wk{display:flex;justify-content:space-between;align-items:flex-end;gap:10px;margin-bottom:12px}.v6-wk>div{min-width:0}
.v6-route{width:100px;height:40px;color:var(--accent);flex:none}
.v6-start{display:flex!important;justify-content:center;align-items:center;gap:6px;width:100%;margin:8px 0 0!important;padding:13px!important;border-radius:14px!important;font-size:16px!important;font-weight:700}
.v6-ghost{display:block;width:100%;margin:8px 0 0!important;background:transparent!important;color:var(--fg)!important;border:1px solid var(--soft)!important;border-radius:14px!important}
.v6-nut{display:flex;gap:14px;align-items:center;margin-top:10px}
.v6-big{font-size:26px;font-weight:800;font-variant-numeric:tabular-nums}.v6-big small{font-size:13px;color:var(--muted);font-weight:600}
.v6-eq{font-size:12.5px;color:var(--muted);font-variant-numeric:tabular-nums}
.v6-macros{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-top:14px}.v6-macros>div{font-size:12px;color:var(--muted)}.v6-macros b{display:block;color:var(--fg);font-size:13.5px;font-variant-numeric:tabular-nums}
.v6-bar{height:6px;border-radius:4px;background:var(--soft);overflow:hidden;margin-top:5px}.v6-bar i{display:block;height:100%;background:var(--accent)}
.v6-water{display:flex!important;align-items:center;gap:10px}.v6-water>svg{color:var(--accent)}
.v6-cups{display:flex;gap:3px;margin-left:auto}.v6-cups i{width:9px;height:16px;border-radius:3px;background:var(--soft)}.v6-cups i.f{background:var(--accent)}
.v6-plus{width:32px;height:32px;border-radius:50%!important;padding:0!important;margin:0!important;display:grid!important;place-items:center}
.v6-two{display:grid;grid-template-columns:1fr 1fr;gap:10px}.v6-two .card{cursor:pointer}
.v6-stat{font-size:24px;font-weight:800;line-height:1.2;margin-top:8px;font-variant-numeric:tabular-nums}.v6-stat small{font-size:13px;color:var(--muted);font-weight:500}
.v6-mil{display:flex;gap:10px;align-items:center;margin:8px 0 2px}.v6-mil b{font-size:14px}.v6-mil p{margin:0;font-size:12px;color:var(--muted)}
.v6-badge{width:40px;height:44px;flex:none;color:var(--fg)}
header h1 small{display:none}.v6-plus[hidden]{display:none!important}.v6-back{display:block;margin:-8px 0 10px!important;background:transparent!important;border:0!important;color:var(--accent)!important;padding:4px 0!important;font-weight:600}.v6-amp{color:var(--accent)}
.v6-sheet{width:min(560px,calc(100vw - 24px));max-height:88vh;overflow:auto;border:1px solid var(--soft);border-radius:22px;background:var(--bg);color:var(--fg);padding:18px}
.v6-confirm{width:min(420px,calc(100vw - 32px))}.v6-confirm h2{font-size:19px;margin:0 0 6px;line-height:1.3}.v6-confirmrow{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:16px}.v6-confirmrow button{margin:0!important;width:100%}.v6-confirmrow:has(> :only-child){grid-template-columns:1fr}.v6-danger{background:#e5484d!important;color:#fff!important}
.v6-sheet::backdrop{background:rgba(0,0,0,.55)}
.v6-sheethead{display:flex;justify-content:space-between;align-items:center}.v6-sheethead h2{margin:0;font-size:22px}
.v6-sheetx{width:36px;height:36px;border-radius:50%!important;padding:0!important;margin:0!important;background:var(--card)!important;color:var(--fg)!important;border:1px solid var(--soft)!important}
.v6-flatprefs{border:0!important;padding:0!important;background:transparent!important;box-shadow:none!important}.v6-flatprefs .card{background:transparent!important;border:0!important;padding:0!important}
#prefsSheet #setName{display:block;width:100%;margin:12px 0!important}
`;
document.head.append(css);

function header(){const h=document.querySelector('header h1');if(h)h.innerHTML='Stride <span class="v6-amp">&amp;</span> Strength';const p=document.querySelector('header p');if(p)p.hidden=true;}
/* ---------- Pretty confirm/alert ---------- */
function prettyDialogs(){
  if(window.__v6confirm)return;window.__v6confirm=1;
  let last=null,bypass=false;const nativeConfirm=window.confirm.bind(window);
  document.addEventListener('click',e=>{if(!bypass)last=e.target.closest('button,a,[role=button]')||e.target;},true);
  const sheet=(msg,okLabel,danger,onOk)=>{const d=el('dialog',{className:'v6-sheet v6-confirm'});const parts=String(msg).split(/\s+(?=[A-Z])/);
    const no=el('button',{type:'button',className:'v6-ghost',textContent:'Cancel'}),ok=el('button',{type:'button',className:'v6-start'+(danger?' v6-danger':''),textContent:okLabel});
    no.onclick=()=>{d.close();d.remove();};ok.onclick=()=>{d.close();d.remove();onOk&&onOk();};
    d.append(el('h2',{textContent:parts[0]}),...(parts.length>1?[el('p',{className:'v6-sub',textContent:parts.slice(1).join(' ')})]:[]),el('div',{className:'v6-confirmrow'},onOk?[no,ok]:[ok]));
    document.body.append(d);d.showModal();ok.focus();};
  window.confirm=msg=>{if(bypass)return true;const target=last;if(!target||!document.contains(target))return nativeConfirm(msg);
    const m=String(msg),danger=/discard|delete|remove|clear|restore default|erase/i.test(m),label=(m.match(/\b(Discard|Delete|Remove|Clear|Restore|Replace|Import|Sign out|Log out)\b/i)||[])[1]||'OK';
    sheet(m,label.charAt(0).toUpperCase()+label.slice(1),danger,()=>{bypass=true;try{target.click();}finally{bypass=false;}});return false;};
  window.alert=msg=>sheet(msg,'OK',false,null);
}
function init(){header();prettyDialogs();tabbar();performanceSkin();buildHome();drawHome();const r0=render;render=function(){r0();drawHome();};}
if(document.readyState==='complete')setTimeout(init,0);else window.addEventListener('load',()=>setTimeout(init,50));
})();

(function(){const st=document.createElement('style');st.textContent='.v6-week b{position:relative;overflow:visible!important}.ring6{position:absolute;left:50%;top:50%;width:44px;height:44px;transform:translate(-50%,-50%) rotate(-90deg);pointer-events:none;z-index:-1}.v6-week b{isolation:isolate}.ring6 circle{fill:none;stroke-width:3.2;stroke-linecap:round}.ring6 .r6-bg{stroke:color-mix(in srgb,var(--fg) 10%,transparent)}.ring6 .r6-fit{stroke:var(--accent)}.ring6 .r6-nut{stroke:#3fc495;opacity:.85}.ring6 .r6-nut.full{opacity:1}.v6-week .dot b{box-shadow:none!important}';document.head.append(st);})();
