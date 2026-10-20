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
 spark:'<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" fill="currentColor"/>',
 cal:'<g fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M9 3v4M15 3v4"/></g>',
 leaf:'<path d="M5 19C5 10 11 5 20 5c0 9-5 14-14 14zM5 19l7-7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
 watch:'<g fill="none" stroke="currentColor" stroke-width="2"><rect x="6" y="6" width="12" height="12" rx="3"/><path d="M9 6l1-3h4l1 3M9 18l1 3h4l1-3"/></g>'
};
const icon=(name,size=20)=>{const s=document.createElementNS(NS,'svg');s.setAttribute('viewBox','0 0 24 24');s.setAttribute('width',size);s.setAttribute('height',size);s.setAttribute('aria-hidden','true');s.innerHTML=ICONS[name]||'';return s;};
window.strideIcon=icon;
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
  // Move preferences, schedule and profile button into one tidy fold at the bottom.
  const more=el('details',{id:'homeMore',className:'card'},[el('summary',{textContent:'Your week & preferences'})]);
  const prefs=$('homePreferences'),sched=home.querySelector('.calm-fold'),prof=$('setName');
  if(prof)more.append(prof);if(prefs){prefs.open=false;more.append(prefs);}if(sched)more.append(sched);
  home.append(more);
}
function drawHome(){
  const wrap=$('homeV6');if(!wrap||typeof db==='undefined')return;
  const t=day(),meals=db.meals.filter(m=>m.date===t),h=new Date().getHours();
  const name=(db.profile?.user_id===(window.cloudRecordOwner?.()||'browser')&&db.profile.display_name)||(($('personalGreeting')?.textContent||'').match(/, ([^👋]+)/)?.[1]||'').trim();
  const goal=window.strideCalorieGoal?window.strideCalorieGoal():(Number(db.goals.calories)||1900),burn=window.strideBurnedToday?.()||0,base=goal-burn;
  const eaten=sum(meals,'calories'),left=goal-eaten,pg=Number(db.goals.protein)||110;
  const fg=Math.round(base*.3/9),cg=Math.max(50,Math.round((base-pg*4-fg*9)/4));
  const plan0=(typeof plan!=='undefined'&&plan[(new Date().getDay()+6)%7])||['', 'Choose your schedule',[]];
  const noPlan=/choose your schedule/i.test(plan0[1]);
  const isRun=/run|walk/i.test(plan0[1]);
  const week=weekDays(),logged=new Set([...db.workouts,...db.meals].map(x=>x.date));
  const wk=db.workouts.filter(w=>w.date>=day(week[0])&&w.date<=day(week[6]));
  const ms=milestone(),water=Number(db.water?.[t])||0;
  wrap.replaceChildren();
  wrap.append(el('p',{className:'v6-hello',textContent:(h<12?'Good morning':h<17?'Good afternoon':'Good evening')+(name?', '+name:'')}),el('h2',{className:'v6-title',textContent:'Your day, in motion.'}));
  const strip=el('div',{className:'v6-week'});week.forEach(d=>{const k=day(d);strip.append(el('span',{className:(k===t?'t ':'')+(logged.has(k)?'dot':'')},[document.createTextNode('MTWTFSS'[(d.getDay()+6)%7]),el('b',{textContent:String(d.getDate())})]));});wrap.append(strip);
  // Today's workout
  const wc=el('div',{className:'card v6-card'});
  wc.append(el('div',{className:'v6-ch'},[icon(isRun?'run':'dumb',18),el('span',{textContent:'Today’s workout'})]));
  if(noPlan){
    wc.append(el('h3',{className:'v6-h3',textContent:'Pick today’s workout'}),el('p',{className:'v6-sub',textContent:'Plan one in a minute, or set your weekly schedule once.'}));
    const b=el('button',{type:'button',className:'v6-start'},[icon('spark',16),document.createTextNode(' Plan my workout')]);b.onclick=()=>{show('train');window.dispatchEvent(new CustomEvent('stride-plan-workout'));};
    const s=el('button',{type:'button',className:'v6-ghost',textContent:'Set my weekly schedule'});s.onclick=()=>{const m=$('homeMore');m.open=true;const p=$('homePreferences');if(p)p.open=true;m.scrollIntoView({behavior:'smooth'});};
    wc.append(b,s);
  }else{
    const items=(plan0[2]||[]).slice(0,3).join(' · ');
    wc.append(el('div',{className:'v6-wk'},[el('div',{},[el('h3',{className:'v6-h3',textContent:plan0[1]}),el('p',{className:'v6-sub',textContent:items})])]));
    const route=document.createElementNS(NS,'svg');route.setAttribute('viewBox','0 0 110 44');route.setAttribute('class','v6-route');route.innerHTML='<path d="M2 34 C18 6, 30 6, 42 26 S 64 44, 76 20 S 98 4, 108 14" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/><circle cx="108" cy="14" r="4" fill="currentColor"/>';wc.querySelector('.v6-wk').append(route);
    const b=el('button',{type:'button',className:'v6-start'},[icon('play',16),document.createTextNode(isRun?' Start '+(/walk/i.test(plan0[1])?'walk':'run'):' Start workout')]);
    b.onclick=()=>{show('train');window.dispatchEvent(new CustomEvent('stride-train-view',{detail:'today'}));if(isRun){const tr=$('liveRunTracker');if(tr){tr.open=true;setTimeout(()=>tr.scrollIntoView({behavior:'smooth',block:'start'}),150);}}};
    wc.append(b);
  }
  wrap.append(wc);
  // Nutrition
  const nc=el('div',{className:'card v6-card'});nc.append(el('div',{className:'v6-ch'},[icon('fork',18),el('span',{textContent:'Today’s nutrition'})]));
  const pct=Math.max(0,Math.min(1,eaten/goal)),C=194.8;
  const ring=document.createElementNS(NS,'svg');ring.setAttribute('viewBox','0 0 76 76');ring.setAttribute('width','76');ring.setAttribute('height','76');ring.setAttribute('role','img');ring.setAttribute('aria-label',Math.round(pct*100)+'% of calorie goal eaten');
  ring.innerHTML='<circle cx="38" cy="38" r="31" fill="none" stroke="var(--soft)" stroke-width="9"/><circle cx="38" cy="38" r="31" fill="none" stroke="var(--accent)" stroke-width="9" stroke-linecap="round" stroke-dasharray="'+C+'" stroke-dashoffset="'+(C*(1-pct))+'" transform="rotate(-90 38 38)"/>';
  const over=left<0;
  nc.append(el('div',{className:'v6-nut'},[ring,el('div',{},[el('div',{className:'v6-big'},[document.createTextNode(fmt(Math.abs(left))+' '),el('small',{textContent:over?'kcal over':'kcal left'})]),el('div',{className:'v6-eq',textContent:fmt(base)+' goal − '+fmt(eaten)+' eaten'+(burn?' + '+fmt(burn)+' workout':'')})])]));
  const mac=el('div',{className:'v6-macros'});[['Protein',sum(meals,'protein'),pg],['Carbs',sum(meals,'carbs'),cg],['Fat',sum(meals,'fat'),fg]].forEach(([l,v,g])=>{const bar=el('div',{className:'v6-bar'},[el('i')]);bar.firstChild.style.width=Math.min(100,v/g*100)+'%';mac.append(el('div',{},[document.createTextNode(l),el('b',{textContent:Math.round(v)+' / '+g+' g'}),bar]));});
  nc.append(mac);nc.onclick=e=>{if(!e.target.closest('button'))show('meals');};nc.style.cursor='pointer';wrap.append(nc);
  // Water
  const cups=el('span',{className:'v6-cups'});for(let i=0;i<8;i++)cups.append(el('i',{className:i<water?'f':''}));
  const add=el('button',{type:'button',className:'v6-plus','aria-label':'Add a glass of water'},[icon('plus',14)]);add.onclick=()=>$('addWater')?.click();
  wrap.append(el('div',{className:'card v6-card v6-water'},[icon('drop',20),el('b',{textContent:'Water'}),el('span',{className:'v6-sub',textContent:water+' / 8'}),cups,add]));
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
#home.v6>*:not(#homeV6):not(#homeMore){display:none!important}
#homeV6 .card{margin:0 0 10px}
.v6-hello{color:var(--muted);margin:8px 0 0;font-size:15px}
.v6-title{font-size:28px;font-weight:800;margin:2px 0 14px;letter-spacing:-.01em}
.v6-week{display:grid;grid-template-columns:repeat(7,1fr);text-align:center;font-size:12px;color:var(--muted);margin-bottom:14px}
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
#homeMore>summary{font-weight:700;cursor:pointer}
`;
document.head.append(css);

function init(){tabbar();performanceSkin();buildHome();drawHome();const r0=render;render=function(){r0();drawHome();};}
if(document.readyState==='complete')setTimeout(init,0);else window.addEventListener('load',()=>setTimeout(init,50));
})();
