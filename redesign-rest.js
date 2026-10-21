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
  const chipRow=(label,opts,get,set,id)=>{const row=el('div',{className:'v6-feel',id},[el('span',{className:'v6-feel-q',textContent:label+':'})]);opts.forEach(([t,v])=>{const b=el('button',{type:'button',textContent:t});b.onclick=()=>{set(get()===v?'':v);mark();};b.dataset.v=v;row.append(b);});const mark=()=>row.querySelectorAll('button').forEach(b=>b.classList.toggle('on',b.dataset.v===String(get())));setInterval(mark,600);return row;};
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

/* ---------- LOG: mock-up layout ---------- */
function logLayout(){
  const f=$('workoutForm'),type=$('workoutType');if(!f||!type||$('logMain6'))return;
  const strip=n=>{n.classList.remove('log-hidden');return n;};
  const lab=id=>f.querySelector('label[for='+id+']');
  // Date row
  const date=$('workoutDate');lab('workoutDate')&&(lab('workoutDate').hidden=true);
  const dateRow=el('label',{className:'v6-daterow',htmlFor:'workoutDate'},[icon('cal',18),el('span',{className:'v6-datetxt'}),date]);
  const fmtDate=()=>{const v=date.value,t=day();dateRow.querySelector('.v6-datetxt').textContent=v===t?'Today, '+new Date(v+'T12:00').toLocaleDateString(undefined,{month:'short',day:'numeric'}):new Date(v+'T12:00').toLocaleDateString(undefined,{weekday:'short',month:'short',day:'numeric'});};
  date.addEventListener('change',fmtDate);setInterval(fmtDate,1000);f.prepend(dateRow);fmtDate();
  // Main chips + sub choices
  $('typeChips')?.remove();const tl=lab('workoutType');if(tl)tl.hidden=true;
  const MAIN=[['Run','run',[['Easy / long run','Long Run'],['Quality / speed','Quality Run']]],['Walk','walk',[['Walk','Walk']]],['Strength','dumb',[['Upper body','Upper Body'],['Lower body','Lower Body']]],['Core','core',[['Core','Core']]],['Bike','run',[['Bike','Bike']]],['Swim','drop',[['Swim','Swim']]],['Recovery','leaf',[['Recovery','Recovery']]],['Other','plus',[['Other activity','Other activity']]]];
  const main=el('div',{id:'logMain6',className:'v6-chips v6-pills'}),sub=el('div',{id:'logSub6',className:'v6-chips v6-subchips'});
  const setType=v=>{if(![...type.options].some(o=>o.value===v)){type.append(el('option',{value:v,textContent:v}));}type.value=v;type.dispatchEvent(new Event('change',{bubbles:true}));draw();};
  function draw(){const cur=type.value,grp=MAIN.find(m=>m[2].some(x=>x[1]===cur));main.replaceChildren();MAIN.forEach(m=>{const b=el('button',{type:'button',className:grp===m?'on':'',textContent:m[0]});b.onclick=()=>setType((grp===m?cur:null)||m[2][0][1]);main.append(b);if(m[0]==='Core')main.append(el('span',{className:'v6-br'}));});
    sub.replaceChildren();if(grp&&grp[2].length>1)grp[2].forEach(([l,v])=>{const b=el('button',{type:'button',className:v===cur?'on':'',textContent:l});b.onclick=()=>setType(v);sub.append(b);});sub.hidden=!sub.children.length;}
  type.addEventListener('change',draw);f.addEventListener('reset',()=>setTimeout(draw,0));type.before(el('p',{className:'v6-lbl',textContent:'What did you do?'}),main,sub);draw();
  // 2×2 metrics
  const dist=$('distance'),durF=f.querySelector('fieldset.duration-parts'),pace=$('autoPace');
  const kcal=el('input',{id:'logKcal',type:'number',min:'0',inputMode:'numeric',placeholder:'Optional'});
  const cell=(t,node,unit,cls)=>el('div',{className:'v6-mcell'+(cls?' '+cls:'')},[el('small',{textContent:t}),el('div',{className:'v6-minner'},[node,...(unit?[el('i',{textContent:unit})]:[])])]);
  lab('distance')&&(lab('distance').hidden=true);const dl=f.querySelector('label.dist-hidden,label[for=distance]');
  const paceBox=el('b',{id:'logPace6',textContent:'—'});
  const grid=el('div',{className:'v6-mgrid'},[cell('Distance',strip(dist),'mi','v6-distcell'),cell('Duration',strip(durF),''),cell('Avg pace',paceBox,'/mi · auto','v6-distcell'),cell('Active calories',kcal,'kcal')]);
  [...f.querySelectorAll('label')].forEach(l=>{if(/^minutes$/i.test(l.textContent.trim()))l.hidden=true;});
  if(pace)pace.classList.add('v6-gone');
  setInterval(()=>{const wt=($('workoutType')?.value||'');const show=/run|walk|bike|swim|cycl|jog|hike/i.test(wt);if(show){dist.classList.remove('dist-hidden');dist.style.display='';const dl=dist.closest('label,.field');if(dl)dl.style.display='';}grid.querySelectorAll('.v6-distcell').forEach(c=>c.hidden=!show);const mi=Number(dist.value),min=Number($('duration')?.value);paceBox.textContent=mi>0&&min>0?paceTxt(min*60/mi):'—';},500);
  const hint=el('p',{className:'v6-legend',textContent:'Distance & pace only show for runs, walks, bikes and swims.'});
  $('duration')&&($('duration').classList.add('v6-gone'));
  durF?.querySelectorAll('input').forEach((x,i)=>{x.placeholder=['h','min','sec'][i]||'';});
  (sub.nextElementSibling===type?type:sub).after(grid,hint);
  // Feel rows after the grid, note as one line
  const fe=$('feelEnergy'),fs=$('feelSore');if(fe)hint.after(fe);if(fs)fe?.after(fs);
  const notes=$('notes');if(notes){lab('notes')&&(lab('notes').hidden=true);notes.rows=2;notes.placeholder='Add a note… (optional)';(fs||hint).after(notes);}
  // Save + Clear side by side
  const save=[...f.querySelectorAll('button')].find(b=>/save workout/i.test(b.textContent)),clr=f.querySelector('.form-clear');
  if(save&&clr){const row=el('div',{className:'v6-confirmrow'});clr.classList.remove('secondary-btn');clr.classList.add('v6-ghost');save.classList.add('v6-start');save.textContent='✓ Save workout';notes?.after(row);row.append(strip(clr),strip(save));}
  // Active calories go into the notes so workout calories use them
  f.addEventListener('submit',()=>{const k=Number(kcal.value);if(k>0&&notes&&!/active kcal/i.test(notes.value))notes.value=(notes.value?notes.value+' · ':'')+Math.round(k)+' active kcal';setTimeout(()=>{if(!$('food'))kcal.value='';},300);},true);
  f.addEventListener('reset',()=>{kcal.value='';});
  // Weigh-in before recent activity
  const wi=$('weightForm')?.closest('details'),ra=$('recentActivity');if(wi&&ra)ra.before(wi);
}
/* ---------- MEALS ---------- */
function buildMeals(){
  const panel=$('aiMealPanel');if(!panel||$('mealQuick'))return;
  const tot=$('macroTiles')?.closest('.card'),tv=$('mealView-today');if(tot&&tv)tv.prepend(tot);const sub=$('meals')?.querySelector(':scope>p');
  const q=el('div',{id:'mealQuick',className:'v6-quick4'});
  const go=(i,l,f)=>{const b=el('button',{type:'button'},[icon(i,20),el('span',{textContent:l})]);b.onclick=f;q.append(b);};
  go('cam','Photo',()=>$('aiMealPhoto')?.click());
  const mode=m=>{const was=panel.dataset.mode===m;panel.dataset.mode=was?'':m;const mm=$('manualMeal');if(mm)mm.open=!was&&m==='manual';q.querySelectorAll('button').forEach(b=>b.classList.toggle('on',!was&&b.dataset.m===m));if(!was){const t=m==='type'?$('aiMealDescription'):mm;setTimeout(()=>{t?.scrollIntoView({behavior:'smooth',block:'center'});if(m==='type')t?.focus();},50);}};window.__v6mealMode=mode;
  go('pen','Type it',()=>mode('type'));
  const goRecent=()=>{const y=$('yourMeals');const p=$('pastDays');if(p)p.open=true;y?.scrollIntoView({behavior:'smooth',block:'start'});};
  go('list','Enter it',()=>mode('manual'));go('redo','Recent',goRecent);q.children[1].dataset.m='type';q.children[2].dataset.m='manual';
  const h3=panel.querySelector('h3');if(h3)h3.textContent='Log a meal';const pd=panel.querySelector(':scope>p:not([id])');if(pd)pd.hidden=true;
  const ym=$('yourMeals'),yh=ym?.querySelector('h3');if(yh&&!$('v6AddMeal')){const a=el('button',{type:'button',id:'v6AddMeal',className:'v6-addlink',textContent:'＋ Add'});a.onclick=()=>{if(panel.dataset.mode!=='type')mode('type');else $('aiMealDescription')?.focus();};yh.append(a);}
  setInterval(()=>{const n=$('noMealsToday'),mh=$('mealHistory');if(n&&mh)mh.hidden=!n.hidden&&/no entries/i.test(mh.textContent);const ph=(window.strideMealPhotos?.list()||[]).length;panel.classList.toggle('v6-hasphoto',ph>0);},700);
  const gf=[...document.querySelectorAll('#mealView-today>details')].find(d=>/goals/i.test(d.textContent));const gs=gf?.querySelector('summary');if(gs&&!gs.dataset.v6){gs.dataset.v6=1;gs.replaceChildren(icon('trophy',20),el('span',{},[el('b',{textContent:'Goals & achievements'}),el('small',{textContent:'Targets · workout calories: add half'})]));gf.classList.add('v6-import');}
  const h=panel.querySelector('h3');(h||panel.firstChild).after(q);
  ['aiMealPhoto','mealCamera'].forEach(id=>{const f=$(id);if(!f)return;f.classList.add('v6-hidden-select');const l=panel.querySelector('label[for='+id+']');if(l)l.hidden=true;});
  const dl=panel.querySelector('label[for=aiMealDescription]');if(dl)dl.hidden=true;
  const est=$('aiAnalyzeMeal'),d=$('aiMealDescription');if(est&&d){est.classList.add('v6-start');const upd=()=>{est.hidden=!(d.value.trim()||(window.strideMealPhotos?.list()||[]).length);};d.addEventListener('input',upd);setInterval(upd,700);upd();}
  // Water: cups row instead of text + big button
  const w=$('water'),wb=$('addWater');if(w&&wb&&!$('waterRow')){const row=el('div',{id:'waterRow',className:'v6-water'});w.before(row);w.hidden=true;wb.hidden=true;window.__v6drawWater=()=>{const t=day(),n=Number(db.water?.[t])||0;row.replaceChildren(icon('drop',20),el('b',{textContent:'Water'}),el('span',{className:'v6-sub',textContent:n+' / 8'}));const cups=el('span',{className:'v6-cups'});for(let i=0;i<8;i++)cups.append(el('i',{className:i<n?'f':''}));const plus=el('button',{type:'button',className:'v6-plus','aria-label':'Add a glass of water'},[icon('plus',14)]);plus.onclick=()=>wb.click();const minus=el('button',{type:'button',className:'v6-plus v6-minus','aria-label':'Remove a glass of water',textContent:'−',disabled:!n});minus.onclick=()=>window.strideWaterMinus();row.append(minus,cups,plus);};window.__v6drawWater();}
}
function drawMealRing(){
  const tiles=$('macroTiles');if(!tiles||typeof db==='undefined')return;
  const t=window.strideMealDay?.()||day(),m=db.meals.filter(x=>x.date===t),goal=window.strideCalorieGoal?window.strideCalorieGoal():(Number(db.goals.calories)||1900),burn=window.strideBurnedToday?.()||0,base=goal-burn,eaten=sum(m,'calories'),left=goal-eaten,pg=Number(db.goals.protein)||110,fg=Math.round(base*.3/9),cg=Math.max(50,Math.round((base-pg*4-fg*9)/4));
  const pct=Math.max(0,Math.min(1,eaten/goal)),C=194.8;
  const ring=document.createElementNS(NS,'svg');ring.setAttribute('viewBox','0 0 76 76');ring.setAttribute('class','v6-ring');ring.setAttribute('role','img');ring.setAttribute('aria-label',fmt(eaten)+' of '+fmt(goal)+' kcal');
  ring.innerHTML='<circle cx="38" cy="38" r="31" fill="none" stroke="var(--soft)" stroke-width="8"/><circle cx="38" cy="38" r="31" fill="none" stroke="var(--accent)" stroke-width="8" stroke-linecap="round" stroke-dasharray="'+C+'" stroke-dashoffset="'+(C*(1-pct))+'" transform="rotate(-90 38 38)"/><text x="38" y="38" text-anchor="middle" font-size="15" font-weight="800" fill="currentColor">'+fmt(eaten)+'</text><text x="38" y="50" text-anchor="middle" font-size="7" fill="var(--muted)">of '+fmt(goal)+'</text>';
  const mac=el('div',{className:'v6-macros'});[['Protein',sum(m,'protein'),pg],['Carbs',sum(m,'carbs'),cg],['Fat',sum(m,'fat'),fg]].forEach(([l,v,g])=>{const bar=el('div',{className:'v6-bar'},[el('i')]);bar.firstChild.style.width=Math.min(100,v/g*100)+'%';mac.append(el('div',{},[document.createTextNode(l),el('b',{textContent:Math.round(v)+' / '+g+' g'}),bar]));});
  tiles.replaceChildren(el('div',{className:'v6-nut'},[ring,el('div',{},[el('div',{className:'v6-big'},[document.createTextNode(fmt(Math.abs(left))+' '),el('small',{textContent:left<0?'kcal over':'kcal left'})]),el('div',{className:'v6-eq',textContent:fmt(base)+' goal − '+fmt(eaten)+' eaten'+(burn?' + '+fmt(burn)+' from workouts':'')})])]),mac);
  tiles.classList.add('v6-tiles');
}

/* ---------- MEAL PHOTOS: keep a small private photo with each meal ---------- */
const BUCKET='stride-meal-photos',urls={};
const uid=()=>{const o=window.cloudRecordOwner?.();return o&&o!=='browser'?o:null;};
function shrinkData(src,dim){return new Promise((res,rej)=>{const im=new Image();im.onload=()=>{const r=Math.min(1,dim/Math.max(im.width,im.height)),c=document.createElement('canvas');c.width=Math.round(im.width*r);c.height=Math.round(im.height*r);c.getContext('2d').drawImage(im,0,0,c.width,c.height);res(c);};im.onerror=rej;im.src=src;});}
function hookMealPhotos(){
  if(window.__v6MealPhotoHook)return;window.__v6MealPhotoHook=1;
  document.addEventListener('click',e=>{if(!e.target.closest('#aiAddDiary'))return;const pic=window.strideMealPhotos?.list()?.[0];if(!pic)return;const before=db.meals.length;
    setTimeout(async()=>{if(db.meals.length<=before)return;const m=db.meals.at(-1);try{
      const id=uid(),cl=window.strideCloudClient;
      if(id&&cl?.storage){const c=await shrinkData(pic,480);const blob=await new Promise(r=>c.toBlob(r,'image/jpeg',.72));const path=id+'/'+crypto.randomUUID()+'.jpg';const {error}=await cl.storage.from(BUCKET).upload(path,blob,{contentType:'image/jpeg',upsert:false});if(error)throw error;m.photo_path=path;}
      else{const c=await shrinkData(pic,160);m.photo_thumb=c.toDataURL('image/jpeg',.6);}
      save();render();}catch(e){console.warn('Meal photo not saved',e);}},120);},true);
}
async function photoUrl(path){if(urls[path])return urls[path];const cl=window.strideCloudClient;if(!cl?.storage)return null;urls[path]=cl.storage.from(BUCKET).createSignedUrl(path,3600).then(r=>r.data?.signedUrl||null).catch(()=>null);return urls[path];}
function drawMealPhotos(){
  document.querySelectorAll('#yourMeals .meal-diary-entry').forEach(card=>{const food=card.querySelector('h3')?.textContent,kind=card.querySelector('.workout-history-kind')?.textContent;const m=db.meals.find(x=>x.date===card.dataset.date&&x.food===food&&(!kind||x.type===kind));if(!m)return;
    let img=card.querySelector('.v6-mealpic');const src=m.photo_thumb||null;
    if(!src&&!m.photo_path){img?.remove();return;}
    if(!img){img=el('img',{className:'v6-mealpic',alt:'Photo of '+food,loading:'lazy'});card.prepend(img);card.classList.add('v6-haspic');}
    if(src){if(img.src!==src)img.src=src;}else if(!img.dataset.p||img.dataset.p!==m.photo_path){img.dataset.p=m.photo_path;photoUrl(m.photo_path).then(u=>{if(u)img.src=u;else img.remove();});}
  });
}
/* ---------- KITCHEN: ingredient chips ---------- */
function buildKitchen(){
  const ta=$('kitchenIngredients');if(!ta||$('ingChips'))return;
  const row=el('div',{className:'v6-ingadd'});const inp=el('input',{id:'ingAdd',placeholder:'Add an ingredient…','aria-label':'Add an ingredient'});const add=el('button',{type:'button','aria-label':'Add ingredient',className:'v6-plus'},[icon('plus',16)]);row.append(inp,add);
  const chips=el('div',{id:'ingChips',className:'v6-ingchips'});
  const items=()=>ta.value.split(/[,\n]+/).map(x=>x.trim()).filter(Boolean);
  const write=list=>{ta.value=list.join(', ');ta.dispatchEvent(new Event('input',{bubbles:true}));draw();};
  function draw(){chips.replaceChildren();items().forEach((it,i)=>{const c=el('span',{className:'v6-ing'+(/\(\?\)/.test(it)?' unsure':'')},[document.createTextNode(it.replace(/\s*\(\?\)/,'')+(/\(\?\)/.test(it)?' ?':''))]);const x=el('button',{type:'button','aria-label':'Remove '+it,textContent:'✕'});x.onclick=()=>{const l=items();l.splice(i,1);write(l);};c.append(x);chips.append(c);});}
  const push=()=>{const v=inp.value.trim();if(!v)return;write([...items(),...v.split(',').map(x=>x.trim()).filter(Boolean)]);inp.value='';inp.focus();};
  add.onclick=push;inp.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();push();}});
  ta.addEventListener('input',()=>{if(document.activeElement!==ta)draw();});
  ta.before(row,chips);ta.classList.add('v6-hidden-select');
  const lab=ta.form?.querySelector('label[for=kitchenIngredients]');if(lab)lab.textContent='What’s in your kitchen?';
  draw();setInterval(()=>{const n=items().length;if(n!==Number(chips.dataset.n)){chips.dataset.n=n;draw();}},700);
}
/* ---------- KITCHEN: mock-up layout ---------- */
function kitchenLayout(){
  const kf=$('kitchenForm'),mk=$('myKitchen');if(!kf||!mk||mk.dataset.v6)return;if(!$('ingChips'))return;mk.dataset.v6='1';mk.classList.add('v6-kitchen');
  const h=mk.querySelector(':scope>h2'),p=mk.querySelector(':scope>h2+p');if(h)h.textContent='What’s in your kitchen?';if(p)p.textContent='Turn what you have into your next meal.';
  const lab=kf.querySelector('label[for=kitchenIngredients]');if(lab)lab.hidden=true;
  // Input row + Scan button
  const row=kf.querySelector('.v6-ingadd'),snap=$('kitchenSnap'),cam=$('kitchenCamera');
  if(row&&cam){const scan=el('button',{type:'button',className:'v6-scan','aria-label':'Scan ingredients with your camera'},[icon('cam',22),el('span',{textContent:'Scan'})]);scan.onclick=()=>cam.click();row.append(scan);}
  if(snap){snap.classList.add('v6-snapmini');[...snap.querySelectorAll('label')].forEach(l=>l.hidden=true);const lib=$('kitchenLibrary');if(lib){const lk=el('button',{type:'button',className:'v6-linkbtn',textContent:'or choose photos'});lk.onclick=()=>lib.click();snap.prepend(lk);}row?.after(snap);}
  [...mk.querySelectorAll('p,small')].forEach(x=>{if(/^Type what you have|saved for your account/i.test(x.textContent.trim()))x.hidden=true;});
  const scl=row?.querySelector('.v6-scan span');if(scl)scl.innerHTML='Scan<br>fridge';
  {const ki=$('kitchenIngredients');if(ki){ki.required=false;kf.addEventListener('submit',e=>{if(ki.value.trim())return;e.preventDefault();e.stopImmediatePropagation();const inp=kf.querySelector('.v6-ingadd input');let m=$('kitchenNeed6');if(!m){m=el('p',{id:'kitchenNeed6',className:'v6-warn',textContent:'Add at least one ingredient first (or scan your fridge).'});(row||kf).after(m);}m.hidden=false;inp?.focus();setTimeout(()=>m.hidden=true,4000);},true);}}
  // 2×2 settings
  const grid=el('div',{className:'v6-kgrid'});
  const cell=(title,id)=>{const f=$(id);if(!f)return;const l=kf.querySelector('label[for='+id+']');if(l)l.hidden=true;const c=el('label',{className:'v6-kcell',htmlFor:id},[el('small',{textContent:title}),f]);grid.append(c);};
  cell('Plan','kitchenCount');cell('Time (min)','kitchenMinutes');cell('Cuisine','kitchenCuisine');cell('Ingredients','kitchenMode');
  $('ingChips').after(grid);
  const cu=$('kitchenCuisine');if(cu)cu.placeholder='Any cuisine';
  // Diet + avoid chips, More options toggle
  const more=$('kitchenMore');const diet=el('div',{className:'v6-chips v6-kdiet'});grid.after(diet);
  const drawDiet=()=>{diet.replaceChildren();const L={halal:'Halal',kosher:'Kosher',vegetarian:'Vegetarian',vegan:'Vegan',pescatarian:'Pescatarian',noPork:'No pork',noBeef:'No beef',glutenFree:'Gluten-free',dairyFree:'Dairy-free',eggFree:'Egg-free',nutFree:'Nut-free',lowCarb:'Lower-carb'};
    (window.strideDietRules?.()||[]).forEach(r=>diet.append(el('span',{className:'v6-kchip on',textContent:L[r]||r})));
    const st=$('mealStyle')?.value;if(st==='protein')diet.append(el('span',{className:'v6-kchip on',textContent:'High protein'}));
    const av=$('kitchenAvoid')?.value.trim();if(av)diet.append(el('span',{className:'v6-kchip',textContent:'Avoid: '+av}));
    const t=el('button',{type:'button',className:'v6-kchip v6-kmore',textContent:more?.open?'− Fewer options':'＋ More options'});t.onclick=()=>{if(more){more.open=!more.open;drawDiet();}};diet.append(t);};
  if(more){more.classList.add('v6-kmoreopts');const sm=more.querySelector(':scope>summary');if(sm)sm.hidden=true;more.addEventListener('toggle',drawDiet);diet.after(more);}
  ['kitchenAvoid','mealStyle'].forEach(i=>$(i)?.addEventListener('change',drawDiet));$('kitchenAvoid')?.addEventListener('input',drawDiet);document.addEventListener('change',e=>{if(e.target.closest?.('#dietRules'))drawDiet();});drawDiet();
  const tmc=$('trainingMealContext');if(tmc&&more)more.append(tmc);
  // Buttons
  const gen=$('kitchenGenerate');if(gen){gen.replaceChildren(document.createTextNode('Find meal ideas'));gen.classList.add('v6-start');}
  const save=$('kitchenSave');if(save){save.classList.add('v6-linkbtn');save.textContent='Save my ingredients';}
  const clr=$('kitchenClear');if(clr)clr.classList.add('v6-linkbtn');
  const acts=el('div',{className:'v6-kacts'});if(save)acts.append(save);if(clr)acts.append(clr);gen?.after(acts);
  [...kf.querySelectorAll('p:not([id])')].forEach(x=>{if(/calorie and protein/i.test(x.textContent))x.hidden=true;});
  // Results restyle
  const res=$('kitchenResult');if(res){const fix=()=>restyleIdeas(res);new MutationObserver(fix).observe(res,{childList:true});fix();}
}
const foodEmoji=n=>/salad/i.test(n)?'🥗':/soup|stew|chili|curry/i.test(n)?'🍲':/egg|omelet/i.test(n)?'🍳':/rice|jollof|bowl/i.test(n)?'🍛':/pasta|noodle/i.test(n)?'🍝':/fish|salmon|tuna/i.test(n)?'🐟':/chicken|turkey/i.test(n)?'🍗':/beef|steak/i.test(n)?'🥩':/wrap|sandwich|toast/i.test(n)?'🥪':/smoothie|shake/i.test(n)?'🥤':/oat|porridge|yogurt/i.test(n)?'🥣':'🍽️';
function restyleIdeas(res){
  const cards=[...res.querySelectorAll(':scope>.card')];if(!cards.length||res.dataset.v6n===String(cards.length)&&res.querySelector('.v6-idea'))return;res.dataset.v6n=String(cards.length);
  const title=res.querySelector(':scope>h3');if(title&&!res.querySelector('.v6-ideahead')){const head=el('div',{className:'v6-sechead v6-ideahead'},[el('h3',{textContent:'Ideas for your ingredients'}),el('small',{className:'v6-sub',textContent:cards.length+' idea'+(cards.length>1?'s':'')})]);title.before(head);title.hidden=true;}
  res.querySelectorAll(':scope>p').forEach(x=>x.classList.add('v6-legend'));
  cards.forEach(c=>{if(c.classList.contains('v6-idea'))return;c.classList.add('v6-idea');
    const name=c.querySelector('h3')?.textContent||'',ps=c.querySelectorAll(':scope>p'),meta=ps[0]?.textContent||'',mac=ps[1]?.textContent||'';
    const ul=c.querySelector(':scope>ul'),ol=c.querySelector(':scope>ol'),btn=c.querySelector(':scope>button');
    const lis=ul?[...ul.children]:[],extra=lis.filter(li=>/shopping list/i.test(li.textContent)).length,have=lis.length-extra;
    const kcal=(mac.match(/(\d+) kcal/)||[])[1],pro=(mac.match(/([\d.]+) g protein/)||[])[1],carb=(mac.match(/([\d.]+) g carbs/)||[])[1],fat=(mac.match(/([\d.]+) g fat/)||[])[1],mins=(meta.match(/(\d+) min/)||[])[1];
    const recipe=el('details',{className:'v6-recipe'},[el('summary',{textContent:'View recipe'})]);if(ul)recipe.append(el('b',{textContent:'Ingredients'}),ul);if(ol)recipe.append(el('b',{textContent:'Steps'}),ol);
    if(btn){btn.textContent='＋ Log';btn.classList.add('v6-logmeal');btn.addEventListener('click',()=>{setTimeout(()=>{const f=$('mealForm');const md=$('mealDate');if(md&&window.strideMealDay)md.value=window.strideMealDay();if(f){const n=db.meals.length;f.requestSubmit?f.requestSubmit():f.dispatchEvent(new Event('submit',{cancelable:true}));setTimeout(()=>{if(db.meals.length>n){btn.textContent='✓ Logged';btn.disabled=true;const st=$('kitchenStatus');if(st)st.textContent='✓ '+name+' added to your meals.';}else{const st=$('kitchenStatus');if(st)st.textContent='Couldn’t log that meal. Check the details in Meals → Today → Enter it.';window.__v6mealMode?.('manual');}},300);}},0);});}
    const body=el('div',{className:'v6-ideabody'},[el('b',{className:'v6-ideaname',textContent:name}),el('small',{textContent:[mins&&mins+' min',kcal&&kcal+' kcal'].filter(Boolean).join(' · ')}),el('small',{textContent:[pro&&pro+' g protein',carb&&carb+' g carbs',fat&&fat+' g fat'].filter(Boolean).join(' · ')}),el('small',{className:extra?'v6-warn':'v6-ok',textContent:extra?'! Needs '+extra+' extra ingredient'+(extra>1?'s':''):'✓ Uses '+have+' of your ingredients'})]);
    c.replaceChildren(el('div',{className:'v6-ideatop'},[(()=>{const d=el('div',{className:'v6-ideapic'});const e=window.strideFoodPic?.(name)||foodEmoji(name);const a=[...e.matchAll(/\p{Extended_Pictographic}\uFE0F?/gu)].map(m=>m[0]);if(a.length>1){d.classList.add('pic6-two');d.innerHTML='<span>'+a[0]+'</span><span>'+a[1]+'</span>';}else d.textContent=e;return d;})(),body,btn||el('span')]),recipe);
  });
}
/* ---------- MENUS: tidy an active custom menu ---------- */
function tidyMenus(){
  const plan=$('mealPlan');if(!plan)return;const outer=plan.closest('details');if(outer){if(!outer.dataset.v6open){outer.dataset.v6open='1';outer.querySelector(':scope>summary')?.addEventListener('click',()=>{outer.dataset.userSet='1';});}if(!outer.dataset.userSet)outer.open=true;}
  plan.querySelectorAll(':scope>details.card:not(.stride-week)').forEach(d=>{const sm=d.querySelector(':scope>summary');if(outer&&sm&&/my meal plan/i.test(sm.textContent)){sm.hidden=true;d.open=true;d.classList.add('v6-flat');}});
  if(plan.querySelector('details.card:not(.stride-week)')&&!$('menuBack')){const b=el('button',{type:'button',id:'menuBack',className:'v6-linkbtn',textContent:'‹ Back to my 7-day plan'});b.onclick=()=>{const r=[...document.querySelectorAll('#mealView-tools button')].find(x=>/restore default meal plan/i.test(x.textContent));r?.click();b.remove();setTimeout(()=>render(),50);};plan.before(b);}
  if(!plan.querySelector('details.card:not(.stride-week)'))$('menuBack')?.remove();
  const rd=[...document.querySelectorAll('#mealView-tools button')].find(x=>/restore default meal plan/i.test(x.textContent));if(rd)rd.hidden=true;
}
/* ---------- MENUS: + Log on each planned meal ---------- */
function menuLogButtons(){
  document.querySelectorAll('#mealPlan .stride-week li').forEach(li=>{if(li.querySelector('.v6-logmeal'))return;const slot=li.querySelector('b')?.textContent.replace(':','').trim(),food=li.textContent.replace(/^[^:]*:\s*/,'').trim();
    const b=el('button',{type:'button',className:'v6-logmeal',textContent:'＋ Log'});b.onclick=()=>{const d=$('aiMealDescription');if(d){d.value='1 serving '+food;}const t=$('aiMealType');if(t&&slot)t.value=slot;$('aiAnalyzeMeal')?.click();};li.append(b);});
}
/* ---------- PROGRESS ---------- */
function buildProgress(){
  const sec=$('progress');if(!sec||$('progressV6'))return;
  const aw=[...sec.querySelectorAll(':scope>p button, :scope>button')].find(b=>/view awards/i.test(b.textContent));
  if(aw){const row=el('button',{type:'button',className:'t6-mk v6-awards'},[icon('trophy',22),el('span',{},[el('b',{textContent:'Achievements'}),el('small',{textContent:'Your awards and next goals'})]),icon('chev',16)]);row.onclick=()=>aw.click();(aw.closest('p')||aw).replaceWith(row);}
  const tr=$('myTransformation');if(tr)tr.classList.add('v6-trans');
  [...sec.querySelectorAll(':scope>.card')].forEach(c=>{const t=c.querySelector('h2,h3')?.textContent||'';if(/training milestones/i.test(t))c.dataset.v6move='history';if(/weight progress graph/i.test(t)){c.classList.add('v6-trans','v6-wgraph');c.querySelector('h2,h3').textContent='Weight trend';}});
  const h=sec.querySelector('h2');if(h)h.classList.add('v6-pagetitle');
  const box=el('div',{id:'progressV6'});(h||sec.firstChild).after(el('p',{className:'v6-pagesub',textContent:'See how far you’ve come.'}),box);
  $('progressStats')&&($('progressStats').hidden=true);
  // Group the history lists into one fold.
  const fold=el('details',{id:'historyFold',className:'card'},[el('summary',{},[icon('cal',18),document.createTextNode(' History, reports & backup')])]);
  const kids=[...sec.children];const start=kids.findIndex(k=>k.tagName==='H2'&&/weight history/i.test(k.textContent));
  if(start>=0){kids.slice(start).forEach(k=>{if(k.id!=='progressV6')fold.append(k);});sec.append(fold);}
  sec.querySelectorAll('[data-v6move=history]').forEach(c=>fold.prepend(c));
  fold.querySelectorAll('details').forEach(d=>d.open=false);
}
let range='month';
function drawProgress(){document.querySelectorAll('.v6-wgraph').forEach(c=>c.hidden=(db.weights||[]).length<2);
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
  box.append(el('div',{className:'card v6-card'},[el('div',{className:'v6-ch'},[icon('run',18),el('span',{textContent:'Running & walking'})]),...(weeks.some(w=>w.mi)?[]:[(chart.hidden=true,el('span'))]),el('p',{className:'v6-sub',textContent:miR?miR.toFixed(1)+' mi'+(minsR?' · avg pace '+paceTxt(minsR*60/miR)+' /mi':''):'No runs or walks in this period yet.'}),chart]));
  // Nutrition: last 7 days vs goal.
  const g=Number(db.goals.calories)||1900,dots=el('div',{className:'v6-dots7'});let on=0;
  for(let i=6;i>=0;i--){const d=new Date(now);d.setDate(d.getDate()-i);const k=day(d),kc=sum(db.meals.filter(m=>m.date===k),'calories');const cls=!kc?'':kc>g*1.1?'o':kc>=g*.8?'g':'u';if(cls==='g')on++;dots.append(el('i',{className:cls,textContent:'MTWTFSS'[(d.getDay()+6)%7],title:kc?fmt(kc)+' kcal':'Nothing logged'}));}
  box.append(el('div',{className:'card v6-card'},[el('div',{className:'v6-ch'},[icon('fork',18),el('span',{textContent:'Nutrition · last 7 days'}),el('em',{className:'v6-chr',textContent:on+' of 7 on target'})]),dots,el('p',{className:'v6-legend'},[el('i',{className:'lg g'}),document.createTextNode(' on target  '),el('i',{className:'lg o'}),document.createTextNode(' over  '),el('i',{className:'lg u'}),document.createTextNode(' under  '),el('i',{className:'lg'}),document.createTextNode(' not logged')])]));
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
.v6-feel{display:grid;grid-template-columns:78px repeat(3,1fr);gap:6px;align-items:center;margin:8px 0}.v6-feel span{font-weight:700;font-size:14px}.v6-feel button{margin:0!important;padding:11px 4px!important;border-radius:12px!important;background:var(--card)!important;color:var(--fg)!important;border:1.5px solid color-mix(in srgb,var(--fg) 28%,transparent)!important;font-weight:700;box-shadow:0 1px 2px rgba(0,0,0,.15)}.v6-feel button.on{background:var(--accent)!important;color:var(--on-accent)!important;border-color:transparent!important}
#log.v6-log label[for=energy],#log.v6-log #energy,#log.v6-log #energy+div,#log.v6-log label[for=soreness],#log.v6-log #soreness{display:none!important}
.v6-ingadd{display:flex;gap:8px;align-items:center}.v6-ingadd input{flex:1}.v6-ingchips{display:flex;flex-wrap:wrap;gap:6px;margin:10px 0 12px}.v6-ing{display:inline-flex;align-items:center;gap:6px;border:1px solid var(--soft);border-radius:999px;padding:6px 6px 6px 12px;font-size:14px;font-weight:600}.v6-ing.unsure{border-style:dashed;border-color:var(--accent)}.v6-ing button{width:22px;height:22px;border-radius:50%!important;padding:0!important;margin:0!important;background:var(--soft)!important;color:var(--fg)!important;border:0!important;font-size:11px}
.v6-logmeal{float:right;margin:0 0 0 8px!important;padding:3px 10px!important;border-radius:10px!important;background:transparent!important;color:var(--accent)!important;border:1px solid var(--accent)!important;font-size:12px;font-weight:700}.stride-week li{overflow:hidden;padding:4px 0}
.v6-mealpic{float:left;width:64px;height:64px;object-fit:cover;border-radius:14px;margin:0 12px 6px 0;border:1px solid var(--soft)}
.v6-kitchen>h2{font-size:21px!important;margin:4px 0 2px!important}.v6-kitchen>h2+p{color:var(--muted);margin:0 0 12px}
.v6-scan{display:flex!important;flex-direction:column;align-items:center;gap:2px;width:62px;padding:6px 0!important;margin:0!important;border-radius:14px!important;background:transparent!important;color:var(--fg)!important;border:1px solid var(--soft)!important;font-size:11px}.v6-scan svg{color:var(--accent)}
.v6-snapmini{border:0!important;padding:0!important;margin:4px 0 0!important}.v6-snapmini>input[type=file]{display:none}.v6-snapmini .v6-linkbtn{font-size:13px}
.v6-kgrid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:4px 0 10px}
.v6-kcell{display:flex!important;flex-direction:column;gap:2px;border:1px solid var(--soft);border-radius:14px;padding:8px 10px;margin:0!important;background:var(--bg)}
.v6-kcell small{color:var(--muted);font-size:11.5px;font-weight:600}.v6-kcell select,.v6-kcell input{border:0!important;background:transparent!important;padding:2px 0!important;margin:0!important;font-weight:700;color:var(--fg)!important;width:100%;min-height:0}
.v6-kchip{display:inline-flex;align-items:center;border:1px solid var(--soft);border-radius:999px;padding:7px 13px;font-size:13.5px;font-weight:600;margin:0!important;background:transparent!important;color:var(--fg)!important}.v6-kchip.on{background:var(--accent)!important;color:var(--on-accent)!important;border-color:transparent}
.v6-kmore{border-style:dashed!important;color:var(--accent)!important}
.v6-kmoreopts:not([open]){display:none!important}.v6-kmoreopts{border:1px solid var(--soft);border-radius:14px;padding:10px 12px;margin:0 0 10px}
.v6-kacts{display:flex;justify-content:space-between;margin:4px 0}
.v6-idea{padding:12px!important}.v6-ideatop{display:flex;gap:12px;align-items:flex-start}.v6-ideapic{width:72px;height:72px;border-radius:14px;flex:none;display:grid;place-items:center;font-size:34px;background:color-mix(in srgb,var(--accent) 15%,var(--card))}
.v6-ideabody{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px}.v6-ideaname{font-size:15.5px}.v6-ideabody small{color:var(--muted);font-size:12.5px}.v6-ideabody .v6-ok{color:#3fc495}.v6-ideabody .v6-warn{color:#f0a050}
.v6-idea .v6-logmeal{float:none;flex:none}
.v6-recipe{margin-top:8px}.v6-recipe>summary{font-weight:700;color:var(--accent);cursor:pointer;font-size:13.5px}.v6-recipe b{display:block;margin:8px 0 2px;font-size:13px}
.v6-legend .lg{display:inline-block;width:10px;height:10px;border-radius:3px;border:1px dashed var(--soft);vertical-align:-1px;margin-left:6px}.v6-legend .lg.g{background:#3fc495;border:0}.v6-legend .lg.o{background:#f0a050;border:0}.v6-legend .lg.u{background:color-mix(in srgb,var(--accent) 45%,transparent);border:0}
.v6-flat{}
#yourMeals .diary-day,#yourMeals>#mealHistory>div:not(.meal-diary-entry){background:transparent!important;border:0!important;padding:0!important;margin:0!important;box-shadow:none!important}
#yourMeals .diary-day>h3{display:none}
#yourMeals .meal-diary-entry{background:transparent!important;border:0!important;border-bottom:1px solid var(--soft)!important;border-radius:0!important;box-shadow:none!important;padding:12px 0!important;margin:0!important}
#yourMeals .meal-diary-entry:last-child{border-bottom:0!important}
#yourMeals .meal-diary-metrics{gap:16px!important;margin-top:6px}
#pastMeals .meal-diary-entry{border-bottom:1px solid var(--soft)!important}
.v6-flat{background:transparent!important;border:0!important;box-shadow:none!important;padding:0!important}
.v6-awards{margin:0 0 10px!important}
.v6-trans h2,.v6-trans h3{font-size:17px!important;margin:0 0 4px!important}.v6-trans{padding:16px!important}
#waterRow{display:flex;align-items:center;gap:10px;margin:14px 0 0;padding-top:12px;border-top:1px solid var(--soft)}#waterRow>svg{color:var(--accent)}
#mealTabs button:focus:not([aria-selected=true]),#trainingTabs button:focus:not([aria-selected=true]){background:transparent!important;color:var(--muted)!important}
.v6-daterow{display:flex!important;align-items:center;gap:10px;border:1px solid var(--soft);border-radius:14px;padding:12px 14px;margin:0 0 12px!important;position:relative;cursor:pointer;font-weight:700}.v6-daterow svg{color:var(--accent)}.v6-daterow input{position:absolute;inset:0;opacity:0;width:100%;height:100%;cursor:pointer}
.v6-subchips{margin-top:-4px}.v6-subchips button{padding:6px 12px!important;font-size:13px!important}
.v6-mgrid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:8px 0 4px}
.v6-mcell{display:flex;flex-direction:column;gap:4px;min-width:0}.v6-mcell>small{color:var(--muted);font-size:12px;font-weight:700}
.v6-minner{display:flex;align-items:center;gap:6px;border:1px solid var(--soft);border-radius:12px;padding:8px 10px;background:var(--bg);min-height:48px}.v6-minner i{font-style:normal;color:var(--muted);font-size:12px;white-space:nowrap}
.v6-minner input{border:0!important;background:transparent!important;padding:0!important;margin:0!important;font-size:18px!important;font-weight:700;min-width:0;width:100%}
.v6-minner b{font-size:18px}
.v6-minner fieldset{border:0!important;padding:0!important;margin:0!important;display:grid!important;grid-template-columns:repeat(3,1fr);gap:4px;min-width:0;width:100%}.v6-minner fieldset legend{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)}.v6-minner fieldset label{font-size:0!important;margin:0!important;display:block}.v6-minner fieldset label input{width:100%}.v6-minner fieldset input{font-size:16px!important;text-align:center;border:1px solid var(--soft)!important;border-radius:8px!important;padding:4px 0!important}
#log.v6-log label[for=energy]{display:none!important}
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

function mealDateRow(){
  const tiles=$('macroTiles'),card=tiles?.closest('.card');if(!card||$('mealDay6'))return;
  const iso=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
  const today=()=>iso(new Date());let sel=null;window.strideMealDay=()=>sel||today();window.strideMealSetDay=v=>set(v);
  const lbl=el('b'),pick=el('input',{type:'date',className:'v6-dpick','aria-label':'Choose a day'});
  const set=v=>{sel=v&&v<today()?v:null;draw();try{render();}catch(e){}const md=$('mealDate');if(md)md.value=window.strideMealDay();const em=$('noMealsToday');if(em)em.textContent=sel?'Nothing logged this day.':'Nothing logged today yet.';};
  const shift=n=>{const d=new Date(window.strideMealDay()+'T12:00');d.setDate(d.getDate()+n);set(iso(d));};
  const prev=el('button',{type:'button',className:'v6-dnav','aria-label':'Previous day',textContent:'‹'});prev.onclick=()=>shift(-1);
  const next=el('button',{type:'button',className:'v6-dnav','aria-label':'Next day',textContent:'›'});next.onclick=()=>shift(1);
  const cal=el('span',{className:'v6-dnav v6-dcal'},[icon('cal',18),pick]);pick.max=today();pick.value=window.strideMealDay();pick.onfocus=()=>{pick.max=today();};pick.onchange=()=>{if(pick.value){set(pick.value);}pick.blur();};
  function draw(){const d=new Date(window.strideMealDay()+'T12:00'),y=new Date();y.setDate(y.getDate()-1);const s=d.toLocaleDateString(undefined,{month:'short',day:'numeric'});lbl.textContent=(sel?(iso(d)===iso(y)?'Yesterday, ':d.toLocaleDateString(undefined,{weekday:'short'})+', '):'Today, ')+s;next.disabled=!sel;}
  const row=el('div',{id:'mealDay6',className:'v6-dayrow'},[prev,lbl,next,el('span',{style:'flex:1'}),cal]);card.prepend(row);draw();
  const st=document.createElement('style');st.textContent='.v6-dayrow{display:flex;align-items:center;gap:6px;margin:-4px 0 10px}.v6-dayrow b{font-size:16px}.v6-dnav{background:none!important;border:0!important;color:var(--fg)!important;font-size:22px;line-height:1;padding:4px 8px!important;width:auto!important;margin:0!important;box-shadow:none!important}.v6-dnav:disabled{opacity:.3}.v6-dcal{position:relative;display:inline-grid;place-items:center;width:36px;height:36px}.v6-dpick{position:absolute!important;inset:0;width:100%!important;height:100%!important;opacity:0;cursor:pointer;margin:0!important;padding:0!important;border:0!important}.v6-dpick::-webkit-calendar-picker-indicator{position:absolute;inset:0;width:100%;height:100%;cursor:pointer}.v6-dnav svg{color:var(--accent)}';document.head.append(st);
}
function init(){titles();hookMealPhotos();buildKitchen();kitchenLayout();buildLog();logLayout();buildMeals();mealDateRow();buildProgress();const r0=render;render=function(){r0();window.__v6drawWater?.();drawRecent();drawMealRing();drawProgress();menuLogButtons();drawMealPhotos();tidyMenus();};setInterval(tidyMenus,1200);setInterval(drawMealPhotos,1500);setInterval(menuLogButtons,1000);drawRecent();drawMealRing();drawProgress();}
if(document.readyState==='complete')setTimeout(init,120);else window.addEventListener('load',()=>setTimeout(init,160));
})();

(function(){const st=document.createElement('style');st.textContent='.v6-feel{grid-template-columns:repeat(3,1fr)!important}.v6-feel>span:first-child{grid-column:1/-1;display:block;font-size:.78rem!important;font-weight:800!important;letter-spacing:.08em;text-transform:uppercase;color:var(--muted,#8a8f98);margin:6px 0 2px}.v6-feel .v6-feel-q{grid-column:1/-1;font-size:.78rem;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--muted,#8a8f98);margin:6px 0 2px;background:none!important;border:0!important;padding:0!important}';document.head.append(st);})();

(function(){const st=document.createElement('style');st.textContent='#logMain6.v6-pills{column-gap:7px;row-gap:0}#logMain6 .v6-br{flex-basis:100%;height:8px}#logMain6.v6-pills button{border-radius:999px!important;padding:8px 13px!important;font-size:15px;font-weight:700;border:1.5px solid color-mix(in srgb,var(--fg) 22%,transparent)!important}#logMain6.v6-pills button.on{border-color:transparent!important}';document.head.append(st);})();

(function(){const st=document.createElement('style');st.textContent='#aiMealPanel:not([data-mode=type]):not(.v6-hasphoto) #aiMealDescription,#aiMealPanel:not([data-mode=type]):not(.v6-hasphoto) #aiAnalyzeMeal{display:none!important}#aiMealPanel:not([data-mode=manual]) #manualMeal{display:none!important}#manualMeal>summary{display:none!important}#manualMeal{border:0!important;padding:0!important;margin-top:10px}#mealQuick button.on{background:var(--accent)!important;color:var(--on-accent)!important}#mealQuick button.on svg{color:inherit!important}#yourMeals h3{display:flex;align-items:center}.v6-addlink{margin-left:auto!important;background:none!important;border:0!important;color:var(--accent)!important;font-weight:700;font-size:15px;padding:4px!important;width:auto!important}';document.head.append(st);})();

(function(){const st=document.createElement('style');st.textContent='#ingChips:empty{display:none!important}#myKitchen .v6-linkbtn{margin:-4px 0 4px!important;padding:2px 4px!important;font-size:13px}';document.head.append(st);})();

(function(){const st=document.createElement('style');st.textContent='#kitchenNeed6{color:var(--accent);font-weight:700;font-size:13.5px;margin:6px 2px}';document.head.append(st);})();

window.strideWaterMinus=()=>{const d0=new Date(),t=d0.getFullYear()+'-'+String(d0.getMonth()+1).padStart(2,'0')+'-'+String(d0.getDate()).padStart(2,'0');const n=Number(db.water?.[t])||0;if(!n)return;db.water[t]=n-1;if(typeof save==='function')save();render();};
(function(){const st=document.createElement('style');st.textContent='header{display:flex!important;align-items:center;justify-content:space-between;gap:12px}header h1{margin:0!important;line-height:1.1;white-space:nowrap;flex:1;min-width:0}#topTools{position:static!important;margin-right:-6px;flex:none;align-items:center}.top-tool,.v6-plus,.v6-sheetx,.scan6-x,.demo6-x,.tb6-x{aspect-ratio:1/1!important;flex:none!important;box-sizing:border-box!important;padding:0!important;display:inline-grid!important;place-items:center}.top-tool{width:42px!important;height:42px!important;min-width:42px!important;max-width:42px!important;min-height:42px!important;max-height:42px!important}.v6-plus{width:38px!important;height:38px!important;min-width:38px!important;max-width:38px!important;min-height:38px!important;max-height:38px!important;align-self:center!important;border-radius:50%!important}.v6-sheetx,.scan6-x,.demo6-x{width:36px!important;height:36px!important;min-width:36px!important;max-width:36px!important;min-height:36px!important;max-height:36px!important;border-radius:50%!important}.v6-water .v6-minus{margin-left:auto!important;margin-right:6px!important}.v6-water .v6-cups{margin-left:0!important}.v6-minus{font-size:20px!important;font-weight:700;line-height:1;background:var(--card)!important;color:var(--fg)!important;border:1px solid var(--soft)!important}.v6-minus:disabled{opacity:.35}';document.head.append(st);})();
// Meal type follows the time of day (unless the person picked one this session).
(function(){const slot=()=>{const h=new Date().getHours();return h<11?'Breakfast':h<16?'Lunch':h<22?'Dinner':'Snack';};
const touched=new Set();const ids=['aiMealType','mealType'];
const apply=()=>ids.forEach(id=>{const s=document.getElementById(id);if(!s)return;if(!s.dataset.mt6){s.dataset.mt6=1;s.addEventListener('change',e=>{if(e.isTrusted)touched.add(id);});}if(touched.has(id))return;const v=slot();if([...s.options].some(o=>o.value===v||o.textContent===v)&&s.value!==v){s.value=v;}});
document.addEventListener('click',e=>{if(e.target.closest('#mealQuick,#mealScanBtn,.repeat-meal'))setTimeout(apply,0);},true);
document.addEventListener('submit',e=>{if(e.target.id==='mealForm')setTimeout(()=>{touched.delete('mealType');apply();},400);},true);
const t=()=>{apply();setTimeout(t,30000);};setTimeout(t,800);})();
