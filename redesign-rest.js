/* Redesign step 3: Log, Meals and Progress in the new style. */
(()=>{
'use strict';
const $=id=>document.getElementById(id);
const el=(tag,props={},kids=[])=>{const n=Object.assign(document.createElement(tag),props);for(const k of [].concat(kids))n.append(k);return n;};
const icon=(n,s)=>window.strideIcon?window.strideIcon(n,s):el('span');
const NS='http://www.w3.org/2000/svg';
const day=(d=new Date())=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
const sum=(a,k)=>a.reduce((n,x)=>n+(Number(x[k])||0),0);
const fmt=n=>Math.round(n).toLocaleString();
const paceTxt=s=>{if(!isFinite(s)||s<=0||s>3600)return '';const m=Math.floor(s/60),x=Math.round(s%60);return m+':'+String(x===60?0:x).padStart(2,'0');};

/* ---------- LOG ---------- */
function buildLog(){
  const sec=$('log');if(!sec||sec.dataset.v6)return;sec.dataset.v6='1';
  const h=sec.querySelector('h2');if(h){h.textContent='Log';h.classList.add('v6-pagetitle');h.after(el('p',{className:'v6-pagesub',textContent:'Every effort counts.'}));}
  const imp=$('runPhotoImport');if(imp){const s=imp.querySelector('summary');if(s){s.replaceChildren(icon('cam',20),el('span',{},[el('b',{textContent:'Import from photos'}),el('small',{textContent:'Read a workout plan or result · up to 4 photos'})]));}imp.classList.add('v6-import');}
  const type=$('workoutType');
  if(type&&!$('typeChips')){
    const chips=el('div',{id:'typeChips',className:'v6-chips',role:'group','aria-label':'Workout type'});
    const ic=t=>/run/i.test(t)?'run':/walk/i.test(t)?'walk':/core/i.test(t)?'core':/upper|lower|strength/i.test(t)?'dumb':/recovery/i.test(t)?'leaf':'plus';
    [...type.options].filter(o=>o.value).forEach(o=>{const b=el('button',{type:'button'},[icon(ic(o.value),16),el('span',{textContent:o.textContent})]);b.dataset.v=o.value;b.onclick=()=>{type.value=o.value;type.dispatchEvent(new Event('change',{bubbles:true}));mark();};chips.append(b);});
    const mark=()=>chips.querySelectorAll('button').forEach(b=>b.classList.toggle('on',b.dataset.v===type.value));
    type.addEventListener('change',mark);type.form?.addEventListener('reset',()=>setTimeout(mark,0));setInterval(mark,800);
    type.before(chips);type.classList.add('v6-hidden-select');
    const lab=type.form?.querySelector('label[for=workoutType]');if(lab)lab.textContent='What did you do?';
  }
  const dur=$('duration'),dist=$('distance');
  if(dur&&dist&&!$('autoPace')){
    const p=el('p',{id:'autoPace',className:'v6-pace',role:'status'});
    const upd=()=>{const mi=Number(dist.value),min=Number(dur.value);const show=mi>0&&min>0&&getComputedStyle(dist).display!=='none';p.hidden=!show;if(show)p.textContent='Pace '+paceTxt(min*60/mi)+' /mi';};
    ($('notes')?.previousElementSibling||dur).before(p);setInterval(upd,600);
  }
  // Energy + soreness as tap chips (the slider and text box stay underneath for saving).
  const chipRow=(label,opts,get,set,id)=>{const row=el('div',{className:'v6-feel',id},[el('span',{textContent:label})]);opts.forEach(([t,v])=>{const b=el('button',{type:'button',textContent:t});b.onclick=()=>{set(get()===v?'':v);mark();};b.dataset.v=v;row.append(b);});const mark=()=>row.querySelectorAll('button').forEach(b=>b.classList.toggle('on',b.dataset.v===String(get())));setInterval(mark,600);return row;};
  const en=$('energy'),so=$('soreness');
  if(en&&so&&!$('feelEnergy')){
    const band=v=>{const n=Number(v);return !n?'':n<=3?'3':n<=6?'6':'9';};
    const r1=chipRow('Energy',[['Low','3'],['Steady','6'],['High','9']],()=>band(en.value),v=>{en.value=v;en.dispatchEvent(new Event('input',{bubbles:true}));en.dispatchEvent(new Event('change',{bubbles:true}));},'feelEnergy');
    const r2=chipRow('Soreness',[['None','None'],['Mild','Mild'],['Sore','Sore']],()=>so.value,v=>{so.value=v;so.dispatchEvent(new Event('input',{bubbles:true}));},'feelSore');
    const lab=sec.querySelector('label[for=energy]');(lab||en).before(r1,r2);
    sec.classList.add('v6-log');
  }
  const wf=$('weightForm')?.closest('details');if(wf&&!wf.classList.contains('v6-import')){const s2=wf.querySelector('summary');if(s2)s2.replaceChildren(icon('bars',20),el('span',{},[el('b',{textContent:'Weekly weigh-in'}),el('small',{textContent:'Add or update your weight · lb or kg'})]));wf.classList.add('v6-import','card');}
  if(!$('recentActivity')){
    const box=el('div',{id:'recentActivity'});const formCard=$('workoutForm')?.closest('.card');(formCard||sec).after(box);
  }
}
function drawRecent(){
  const box=$('recentActivity');if(!box||typeof db==='undefined')return;
  const list=db.workouts.slice().sort((a,b)=>(b.date+(b.finishedAt||'')).localeCompare(a.date+(a.finishedAt||''))).slice(0,3);
  box.replaceChildren();if(!list.length)return;
  const all=el('button',{type:'button',className:'v6-linkbtn',textContent:'View all'});all.onclick=()=>show('progress');
  box.append(el('div',{className:'v6-sechead'},[el('h3',{textContent:'Recent activity'}),all]));
  const t=day(),y=new Date();y.setDate(y.getDate()-1);
  list.forEach(w=>{const when=w.date===t?'Today':w.date===day(y)?'Yesterday':new Date(w.date+'T12:00').toLocaleDateString(undefined,{weekday:'short',month:'short',day:'numeric'});
    const bits=[Number(w.miles)?Number(w.miles).toFixed(2)+' mi':'',Number(w.minutes)?Math.round(w.minutes)+' min':''].filter(Boolean).join(' · ');
    box.append(el('div',{className:'v6-row card'},[icon(/run/i.test(w.type)?'run':/walk/i.test(w.type)?'walk':/core/i.test(w.type)?'core':'dumb',22),el('span',{},[el('b',{textContent:w.type||'Workout'}),el('small',{textContent:bits||'Logged'})]),el('em',{textContent:when})]));});
}

/* ---------- MEALS ---------- */
function buildMeals(){
  const panel=$('aiMealPanel');if(!panel||$('mealQuick'))return;
  const tot=$('macroTiles')?.closest('.card'),tv=$('mealView-today');if(tot&&tv)tv.prepend(tot);const sub=$('meals')?.querySelector(':scope>p');
  const q=el('div',{id:'mealQuick',className:'v6-quick4'});
  const go=(i,l,f)=>{const b=el('button',{type:'button'},[icon(i,20),el('span',{textContent:l})]);b.onclick=f;q.append(b);};
  go('cam','Camera',()=>$('mealCamera')?.click());
  go('fork','Type it',()=>{const d=$('aiMealDescription');d?.focus();d?.scrollIntoView({behavior:'smooth',block:'center'});});
  go('redo','Recent',()=>{const y=$('yourMeals');const p=$('pastDays');if(p)p.open=true;y?.scrollIntoView({behavior:'smooth',block:'start'});});
  go('plus','Enter it',()=>{const m=$('manualMeal');if(m){m.open=true;m.scrollIntoView({behavior:'smooth',block:'center'});}});
  const h=panel.querySelector('h3');(h||panel.firstChild).after(q);
}
function drawMealRing(){
  const tiles=$('macroTiles');if(!tiles||typeof db==='undefined')return;
  const t=day(),m=db.meals.filter(x=>x.date===t),goal=window.strideCalorieGoal?window.strideCalorieGoal():(Number(db.goals.calories)||1900),burn=window.strideBurnedToday?.()||0,base=goal-burn,eaten=sum(m,'calories'),left=goal-eaten,pg=Number(db.goals.protein)||110,fg=Math.round(base*.3/9),cg=Math.max(50,Math.round((base-pg*4-fg*9)/4));
  const pct=Math.max(0,Math.min(1,eaten/goal)),C=194.8;
  const ring=document.createElementNS(NS,'svg');ring.setAttribute('viewBox','0 0 76 76');ring.setAttribute('class','v6-ring');ring.setAttribute('role','img');ring.setAttribute('aria-label',fmt(eaten)+' of '+fmt(goal)+' kcal');
  ring.innerHTML='<circle cx="38" cy="38" r="31" fill="none" stroke="var(--soft)" stroke-width="8"/><circle cx="38" cy="38" r="31" fill="none" stroke="var(--accent)" stroke-width="8" stroke-linecap="round" stroke-dasharray="'+C+'" stroke-dashoffset="'+(C*(1-pct))+'" transform="rotate(-90 38 38)"/><text x="38" y="38" text-anchor="middle" font-size="15" font-weight="800" fill="currentColor">'+fmt(eaten)+'</text><text x="38" y="50" text-anchor="middle" font-size="7" fill="var(--muted)">of '+fmt(goal)+'</text>';
  const mac=el('div',{className:'v6-macros'});[['Protein',sum(m,'protein'),pg],['Carbs',sum(m,'carbs'),cg],['Fat',sum(m,'fat'),fg]].forEach(([l,v,g])=>{const bar=el('div',{className:'v6-bar'},[el('i')]);bar.firstChild.style.width=Math.min(100,v/g*100)+'%';mac.append(el('div',{},[document.createTextNode(l),el('b',{textContent:Math.round(v)+' / '+g+' g'}),bar]));});
  tiles.replaceChildren(el('div',{className:'v6-nut'},[ring,el('div',{},[el('div',{className:'v6-big'},[document.createTextNode(fmt(Math.abs(left))+' '),el('small',{textContent:left<0?'kcal over':'kcal left'})]),el('div',{className:'v6-eq',textContent:fmt(base)+' goal − '+fmt(eaten)+' eaten'+(burn?' + '+fmt(burn)+' from workouts':'')})])]),mac);
  tiles.classList.add('v6-tiles');
}

/* ---------- KITCHEN: ingredient chips ---------- */
function buildKitchen(){
  const ta=$('kitchenIngredients');if(!ta||$('ingChips'))return;
  const row=el('div',{className:'v6-ingadd'});const inp=el('input',{id:'ingAdd',placeholder:'Add an ingredient…','aria-label':'Add an ingredient'});const add=el('button',{type:'button','aria-label':'Add ingredient',className:'v6-plus'},[icon('plus',16)]);row.append(inp,add);
  const chips=el('div',{id:'ingChips',className:'v6-ingchips'});
  const items=()=>ta.value.split(/[,\n]+/).map(x=>x.trim()).filter(Boolean);
  const write=list=>{ta.value=list.join(', ');ta.dispatchEvent(new Event('input',{bubbles:true}));draw();};
  function draw(){chips.replaceChildren();items().forEach((it,i)=>{const c=el('span',{className:'v6-ing'+(/\(\?\)/.test(it)?' unsure':'')},[document.createTextNode(it.replace(/\s*\(\?\)/,'')+(/\(\?\)/.test(it)?' ?':''))]);const x=el('button',{type:'button','aria-label':'Remove '+it,textContent:'✕'});x.onclick=()=>{const l=items();l.splice(i,1);write(l);};c.append(x);chips.append(c);});if(!items().length)chips.append(el('small',{className:'v6-sub',textContent:'Type what you have, or scan your fridge above.'}));}
  const push=()=>{const v=inp.value.trim();if(!v)return;write([...items(),...v.split(',').map(x=>x.trim()).filter(Boolean)]);inp.value='';inp.focus();};
  add.onclick=push;inp.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();push();}});
  ta.addEventListener('input',()=>{if(document.activeElement!==ta)draw();});
  ta.before(row,chips);ta.classList.add('v6-hidden-select');
  const lab=ta.form?.querySelector('label[for=kitchenIngredients]');if(lab)lab.textContent='What’s in your kitchen?';
  draw();setInterval(()=>{const n=items().length;if(n!==Number(chips.dataset.n)){chips.dataset.n=n;draw();}},700);
}
/* ---------- MENUS: + Log on each planned meal ---------- */
function menuLogButtons(){
  document.querySelectorAll('#mealPlan .stride-week li').forEach(li=>{if(li.querySelector('.v6-logmeal'))return;const slot=li.querySelector('b')?.textContent.replace(':','').trim(),food=li.textContent.replace(/^[^:]*:\s*/,'').trim();
    const b=el('button',{type:'button',className:'v6-logmeal',textContent:'＋ Log'});b.onclick=()=>{$('mealTab-today')?.click();const d=$('aiMealDescription');if(d){d.value='1 serving '+food;}const t=$('aiMealType');if(t&&slot)t.value=slot;$('aiAnalyzeMeal')?.click();$('aiMealPanel')?.scrollIntoView({behavior:'smooth',block:'start'});};li.append(b);});
}
/* ---------- PROGRESS ---------- */
function buildProgress(){
  const sec=$('progress');if(!sec||$('progressV6'))return;
  const h=sec.querySelector('h2');if(h)h.classList.add('v6-pagetitle');
  const box=el('div',{id:'progressV6'});(h||sec.firstChild).after(el('p',{className:'v6-pagesub',textContent:'See how far you’ve come.'}),box);
  $('progressStats')&&($('progressStats').hidden=true);
  // Group the history lists into one fold.
  const fold=el('details',{id:'historyFold',className:'card'},[el('summary',{},[icon('cal',18),document.createTextNode(' History, reports & backup')])]);
  const kids=[...sec.children];const start=kids.findIndex(k=>k.tagName==='H2'&&/weight history/i.test(k.textContent));
  if(start>=0){kids.slice(start).forEach(k=>{if(k.id!=='progressV6')fold.append(k);});sec.append(fold);}
  fold.querySelectorAll('details').forEach(d=>d.open=false);
}
let range='month';
function drawProgress(){
  const box=$('progressV6');if(!box||typeof db==='undefined')return;
  const now=new Date(),t=day(now);
  const from=range==='week'?(()=>{const d=new Date(now);d.setDate(d.getDate()-6);return day(d);})():range==='month'?(()=>{const d=new Date(now);d.setDate(d.getDate()-29);return day(d);})():'0000';
  const ws=db.workouts.filter(w=>w.date>=from&&w.date<=t),runs=ws.filter(w=>/run|walk/i.test(w.type||'')&&Number(w.miles)>0);
  const dates=new Set(db.workouts.map(w=>w.date));let streak=0;{const d=new Date(now);if(!dates.has(day(d)))d.setDate(d.getDate()-1);while(dates.has(day(d))){streak++;d.setDate(d.getDate()-1);}}
  box.replaceChildren();
  const seg=el('div',{className:'v6-seg',role:'group','aria-label':'Time range'});[['week','Week'],['month','Month'],['all','All time']].forEach(([k,l])=>{const b=el('button',{type:'button',textContent:l,className:range===k?'on':''});b.onclick=()=>{range=k;drawProgress();};seg.append(b);});box.append(seg);
  const tile=(i,v,l)=>el('div',{className:'v6-tile3'},[icon(i,18),el('b',{textContent:v}),el('small',{textContent:l})]);
  box.append(el('div',{className:'v6-tri'},[tile('dumb',String(ws.length),'Workouts'),tile('run',sum(runs,'miles').toFixed(1)+' mi','Distance'),tile('flame',streak+(streak===1?' day':' days'),'Streak')]));
  // Running: last 4 weeks (or 7 days) bars + average pace.
  const weeks=[...Array(4)].map((_,i)=>{const end=new Date(now);end.setDate(end.getDate()-7*(3-i));const st=new Date(end);st.setDate(end.getDate()-6);const r=db.workouts.filter(w=>/run|walk/i.test(w.type||'')&&w.date>=day(st)&&w.date<=day(end));return {l:i===3?'This wk':'W'+(i+1),mi:sum(r,'miles')};});
  const max=Math.max(1,...weeks.map(w=>w.mi)),minsR=sum(runs,'minutes'),miR=sum(runs,'miles');
  const chart=el('div',{className:'v6-chart'});weeks.forEach(w=>{const c=el('div',{},[el('em',{textContent:w.mi?w.mi.toFixed(1):''}),el('span',{textContent:w.l})]);c.style.height=Math.max(4,w.mi/max*100)+'%';chart.append(c);});
  box.append(el('div',{className:'card v6-card'},[el('div',{className:'v6-ch'},[icon('run',18),el('span',{textContent:'Running & walking'})]),el('p',{className:'v6-sub',textContent:miR?miR.toFixed(1)+' mi'+(minsR?' · avg pace '+paceTxt(minsR*60/miR)+' /mi':''):'No runs or walks in this period yet.'}),chart]));
  // Nutrition: last 7 days vs goal.
  const g=Number(db.goals.calories)||1900,dots=el('div',{className:'v6-dots7'});let on=0;
  for(let i=6;i>=0;i--){const d=new Date(now);d.setDate(d.getDate()-i);const k=day(d),kc=sum(db.meals.filter(m=>m.date===k),'calories');const cls=!kc?'':kc>g*1.1?'o':kc>=g*.8?'g':'u';if(cls==='g')on++;dots.append(el('i',{className:cls,textContent:'MTWTFSS'[(d.getDay()+6)%7],title:kc?fmt(kc)+' kcal':'Nothing logged'}));}
  box.append(el('div',{className:'card v6-card'},[el('div',{className:'v6-ch'},[icon('fork',18),el('span',{textContent:'Nutrition · last 7 days'}),el('em',{className:'v6-chr',textContent:on+' of 7 on target'})]),dots,el('p',{className:'v6-legend',textContent:'● on target  ● over  ● under  ○ not logged'})]));
  // Weight
  const w=db.weights.slice().sort((a,b)=>a.date.localeCompare(b.date)),last=w.at(-1),firstM=w.filter(x=>x.date>=from)[0];
  if(last){const ch=firstM&&firstM!==last?Number(last.weight)-Number(firstM.weight):0;const add=el('button',{type:'button',className:'v6-pill',textContent:'＋ Weigh-in'});add.onclick=()=>{show('log');const f=$('weightForm')?.closest('details');if(f)f.open=true;setTimeout(()=>$('weightValue')?.focus(),200);};
    box.append(el('div',{className:'card v6-card'},[el('div',{className:'v6-ch'},[icon('bars',18),el('span',{textContent:'Weight'}),add]),el('div',{className:'v6-big'},[document.createTextNode(Number(last.weight).toFixed(1)+' lb '),el('small',{textContent:ch?(ch>0?'+':'')+ch.toFixed(1)+' this '+(range==='all'?'period':range):'latest entry'})])]));}
}

const css=el('style');css.textContent=`
.v6-pagetitle{font-size:30px!important;font-weight:800;margin:6px 0 0!important;letter-spacing:-.01em}
.v6-pagesub{color:var(--muted);margin:2px 0 14px}
.v6-import>summary{display:flex!important;align-items:center;gap:12px;list-style:none;cursor:pointer}.v6-import>summary::-webkit-details-marker{display:none}.v6-import>summary svg{color:var(--accent);flex:none}.v6-import>summary b{display:block}.v6-import>summary small{display:block;color:var(--muted);font-weight:500;font-size:12.5px}
.v6-chips{display:flex;flex-wrap:wrap;gap:8px;margin:6px 0 12px}
.v6-chips button{display:inline-flex!important;align-items:center;gap:6px;margin:0!important;padding:9px 13px!important;border-radius:12px!important;background:transparent!important;color:var(--fg)!important;border:1px solid var(--soft)!important;font-size:14px;font-weight:600}
.v6-chips button svg{color:var(--accent)}.v6-chips button.on{background:var(--accent)!important;color:var(--on-accent)!important;border-color:transparent!important}.v6-chips button.on svg{color:inherit}
.v6-hidden-select{position:absolute!important;opacity:0!important;pointer-events:none!important;height:1px!important;width:1px!important;overflow:hidden}
.v6-feel{display:grid;grid-template-columns:78px repeat(3,1fr);gap:6px;align-items:center;margin:8px 0}.v6-feel span{font-weight:700;font-size:14px}.v6-feel button{margin:0!important;padding:10px 4px!important;border-radius:12px!important;background:transparent!important;color:var(--fg)!important;border:1px solid var(--soft)!important;font-weight:600}.v6-feel button.on{background:var(--accent)!important;color:var(--on-accent)!important;border-color:transparent!important}
#log.v6-log label[for=energy],#log.v6-log #energy,#log.v6-log #energy+div,#log.v6-log label[for=soreness],#log.v6-log #soreness{display:none!important}
.v6-ingadd{display:flex;gap:8px;align-items:center}.v6-ingadd input{flex:1}.v6-ingchips{display:flex;flex-wrap:wrap;gap:6px;margin:10px 0 12px}.v6-ing{display:inline-flex;align-items:center;gap:6px;border:1px solid var(--soft);border-radius:999px;padding:6px 6px 6px 12px;font-size:14px;font-weight:600}.v6-ing.unsure{border-style:dashed;border-color:var(--accent)}.v6-ing button{width:22px;height:22px;border-radius:50%!important;padding:0!important;margin:0!important;background:var(--soft)!important;color:var(--fg)!important;border:0!important;font-size:11px}
.v6-logmeal{float:right;margin:0 0 0 8px!important;padding:3px 10px!important;border-radius:10px!important;background:transparent!important;color:var(--accent)!important;border:1px solid var(--accent)!important;font-size:12px;font-weight:700}.stride-week li{overflow:hidden;padding:4px 0}
.v6-pace{margin:6px 0 4px;font-weight:700;color:var(--accent)}
.v6-sechead{display:flex;justify-content:space-between;align-items:center;margin:18px 0 8px}.v6-sechead h3{margin:0;font-size:18px}
.v6-linkbtn{background:transparent!important;color:var(--accent)!important;border:0!important;padding:4px!important;margin:0!important;font-weight:600}
.v6-row{display:flex!important;align-items:center;gap:12px;padding:12px 14px!important;margin:0 0 8px!important}.v6-row>svg{color:var(--accent);flex:none}.v6-row span{flex:1;min-width:0}.v6-row b{display:block}.v6-row small{color:var(--muted)}.v6-row em{font-style:normal;color:var(--muted);font-size:13px}
.v6-quick4{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin:10px 0 12px}
.v6-quick4 button{display:flex!important;flex-direction:column;align-items:center;gap:5px;margin:0!important;padding:11px 4px!important;border-radius:14px!important;background:var(--bg)!important;color:var(--fg)!important;border:1px solid var(--soft)!important;font-size:12.5px;font-weight:600}.v6-quick4 svg{color:var(--accent)}
#macroTiles.v6-tiles{display:block!important;text-align:left}#macroTiles.v6-tiles>.v6-nut{display:flex!important;flex-direction:row!important;align-items:center;gap:14px}#macroTiles.v6-tiles>.v6-macros{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:10px;margin-top:14px}#macroTiles.v6-tiles>.v6-macros>div{display:block!important;font-size:12px;color:var(--muted)}#macroTiles.v6-tiles b{font-size:13.5px}#macroTiles.v6-tiles .v6-big b,#macroTiles.v6-tiles .v6-big{font-size:26px}
.v6-ring{width:96px;height:96px;flex:none;color:var(--fg)}
.v6-seg{display:grid;grid-template-columns:repeat(3,1fr);gap:4px;padding:5px;background:var(--card);border:1px solid var(--soft);border-radius:14px;margin:0 0 12px}
.v6-seg button{margin:0!important;padding:9px 4px!important;border-radius:10px!important;background:transparent!important;color:var(--muted)!important;border:0!important}.v6-seg button.on{background:var(--accent)!important;color:var(--on-accent)!important}
.v6-tri{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:10px}
.v6-tile3{background:var(--card);border:1px solid var(--soft);border-radius:16px;padding:12px;display:flex;flex-direction:column;gap:2px}.v6-tile3 svg{color:var(--accent)}.v6-tile3 b{font-size:19px;font-variant-numeric:tabular-nums}.v6-tile3 small{color:var(--muted);font-size:12px}
#progressV6 .card{margin:0 0 10px}
.v6-chart{display:flex;align-items:flex-end;gap:14px;height:120px;margin:14px 4px 22px}.v6-chart div{flex:1;background:var(--accent);border-radius:8px 8px 0 0;position:relative;min-height:4px}
.v6-chart em{position:absolute;top:-17px;left:0;right:0;text-align:center;font-style:normal;font-size:11px;color:var(--muted)}.v6-chart span{position:absolute;bottom:-19px;left:0;right:0;text-align:center;font-size:11px;color:var(--muted)}
.v6-chr{margin-left:auto;font-style:normal;font-size:12px;color:var(--muted);font-weight:500}
.v6-dots7{display:grid;grid-template-columns:repeat(7,1fr);gap:6px;margin-top:10px}.v6-dots7 i{font-style:normal;text-align:center;font-size:11px;font-weight:700;border-radius:9px;padding:9px 0;border:1px dashed var(--soft)}
.v6-dots7 .g{background:color-mix(in srgb,#3fc495 28%,transparent);border-style:solid;border-color:transparent}.v6-dots7 .o{background:color-mix(in srgb,#f0a050 30%,transparent);border-style:solid;border-color:transparent}.v6-dots7 .u{background:color-mix(in srgb,var(--accent) 18%,transparent);border-style:solid;border-color:transparent}
.v6-legend{font-size:11.5px;color:var(--muted);margin:8px 0 0}
.v6-pill{margin:0 0 0 auto!important;padding:6px 12px!important;border-radius:999px!important;background:transparent!important;color:var(--accent)!important;border:1px solid var(--accent)!important;font-size:13px}
#historyFold>summary{font-weight:700;cursor:pointer;display:flex;align-items:center;gap:8px}#historyFold>summary svg{color:var(--accent)}
`;
document.head.append(css);

function titles(){[['meals','Fuel your day.'],['train','Make today count.']].forEach(([id,sub])=>{const sec=$(id),h=sec?.querySelector(':scope>h2');if(!h||h.classList.contains('v6-pagetitle'))return;h.classList.add('v6-pagetitle');const p=h.nextElementSibling;if(p&&p.tagName==='P')p.textContent=sub;});}
function init(){titles();buildKitchen();buildLog();buildMeals();buildProgress();const r0=render;render=function(){r0();drawRecent();drawMealRing();drawProgress();menuLogButtons();};setInterval(menuLogButtons,1000);drawRecent();drawMealRing();drawProgress();}
if(document.readyState==='complete')setTimeout(init,120);else window.addEventListener('load',()=>setTimeout(init,160));
})();
