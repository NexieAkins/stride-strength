/* Tester feedback: accessibility menu, account menu on every screen, quick meal estimate on Meals › Today. */
(()=>{
'use strict';
const $=id=>document.getElementById(id);
const el=(tag,props={},kids=[])=>{const n=Object.assign(document.createElement(tag),props);n.append(...kids);return n;};
const signedIn=()=>{const s=$('signedIn');return !!s&&!s.classList.contains('hidden');};
const email=()=>($('accountEmail')?.textContent||'').replace(/^Signed in:\s*/,'').trim();

function setup(){
  if($('topTools'))return;
  const header=document.querySelector('header');if(!header)return;
  const ICON_A11Y='<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" fill="currentColor"><circle cx="12" cy="4" r="2"/><path d="M4 7.5c2.6.8 5.3 1.2 8 1.2s5.4-.4 8-1.2l.5 1.9c-2 .6-4.1 1-6.2 1.2V14l2 7h-2.1L12.5 15h-1L9.8 21H7.7l2-7v-3.4c-2.1-.2-4.2-.6-6.2-1.2z"/></svg>';
  const ICON_USER='<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" fill="currentColor"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7z"/></svg>';
  const a11yBtn=el('button',{type:'button',id:'a11yBtn',className:'top-tool',innerHTML:ICON_A11Y,title:'Accessibility'});a11yBtn.setAttribute('aria-label','Accessibility: text size and skin');
  const acctBtn=el('button',{type:'button',id:'acctBtn',className:'top-tool',innerHTML:ICON_USER,title:'Account'});acctBtn.setAttribute('aria-label','Account menu');
  const a11yPanel=el('div',{id:'a11yPanel',className:'top-panel',hidden:true});
  const acctPanel=el('div',{id:'acctPanel',className:'top-panel',hidden:true});
  const tools=el('div',{id:'topTools'},[a11yBtn,acctBtn,a11yPanel,acctPanel]);
  header.append(tools);

  // Accessibility: text size + skin.
  a11yPanel.append(el('h3',{textContent:'Accessibility'}));
  const size=document.querySelector('.size-row');if(size)a11yPanel.append(size);
  const skin=$('skinFold');
  if(skin){const wrap=el('div',{className:'a11y-skins'});wrap.append(el('h4',{textContent:'Skin'}),...[...skin.childNodes].filter(n=>n.tagName!=='SUMMARY'));a11yPanel.append(wrap);skin.remove();}

  // Account menu.
  function drawAccount(){
    acctPanel.replaceChildren();
    if(signedIn()){
      acctPanel.append(el('p',{className:'acct-email',textContent:email()||'Signed in'}),
        el('button',{type:'button',textContent:'Account & sync',onclick:()=>{close();document.querySelector('[data-go=accountpage]')?.click()||window.show?.('accountpage');}}),
        el('button',{type:'button',className:'acct-logout',textContent:'Log out',onclick:()=>{close();$('signout')?.click();}}));
    }else{
      acctPanel.append(el('p',{className:'acct-email',textContent:'Not syncing · saved on this device'}),
        el('button',{type:'button',textContent:'Sign in or create account',onclick:()=>{close();if(window.strideShowWelcome)window.strideShowWelcome();else window.show?.('accountpage');}}));
    }
  }
  function close(){a11yPanel.hidden=acctPanel.hidden=true;a11yBtn.setAttribute('aria-expanded','false');acctBtn.setAttribute('aria-expanded','false');}
  function toggle(panel,btn){const open=panel.hidden;close();if(open){if(panel===acctPanel)drawAccount();panel.hidden=false;btn.setAttribute('aria-expanded','true');}}
  a11yBtn.onclick=e=>{e.stopPropagation();toggle(a11yPanel,a11yBtn);};
  acctBtn.onclick=e=>{e.stopPropagation();toggle(acctPanel,acctBtn);};
  document.addEventListener('click',e=>{if(!tools.contains(e.target))close();});
  document.addEventListener('keydown',e=>{if(e.key==='Escape')close();});
  document.querySelector('nav')?.addEventListener('click',close);

  // Account page: Log out right under the email; bold heading.
  const so=$('signout'),ae=$('accountEmail');if(so&&ae){so.textContent='Log out';so.classList.add('acct-logout');ae.after(so);}
  // Home hero no longer needs its own Account button.
  document.querySelectorAll('#home .hero [data-go=accountpage]').forEach(b=>b.style.display='none');

  quickMeal();
}

function quickMeal(){
  const panel=$('aiMealPanel'),today=$('mealView-today');if(!panel||!today||panel.dataset.quick)return;
  panel.dataset.quick='1';
  const fold=panel.closest('details');
  today.prepend(panel);
  if(fold&&!fold.contains(panel)&&!fold.querySelector('*:not(summary)'))fold.remove();
  const h=panel.querySelector('h3');if(h)h.textContent='What did you eat?';
  const p=panel.querySelector('h3+p');if(p)p.textContent='Snap a photo or type it — we’ll estimate calories, protein, carbs and fat.';
  const lp=panel.querySelector('label[for=aiMealPhoto]');if(lp)lp.textContent='Choose a photo';
  const res=$('aiMealResults'),use=$('aiUseEstimate');if(!res||!use)return;
  const type=el('select',{id:'aiMealType'});['Breakfast','Lunch','Dinner','Snack','Other'].forEach(t=>type.append(el('option',{textContent:t})));
  const hr=new Date().getHours();type.value=hr<11?'Breakfast':hr<15?'Lunch':hr<21?'Dinner':'Snack';
  const add=el('button',{type:'button',id:'aiAddDiary',textContent:'Add to today’s diary'});
  use.textContent='Edit in full form';use.classList.add('secondary-btn');
  use.before(el('label',{htmlFor:'aiMealType',textContent:'Meal'}),type,add);
  const clr=el('button',{type:'button',id:'aiClearEstimate',className:'secondary-btn',textContent:'Clear',onclick:()=>{res.classList.add('hidden');['aiMealDescription','aiEstimateName','aiEstimateCalories','aiEstimateProtein','aiEstimateCarbs','aiEstimateFat','aiEstimateFiber','aiMealPhoto','mealCamera'].forEach(i=>{if($(i))$(i).value='';});if($('aiEstimateNotes'))$('aiEstimateNotes').textContent='';window.strideMealPhotos?.clear();$('mealPreview')?.classList.add('hidden');$('clearMealPhoto')?.classList.add('hidden');const st=$('aiMealStatus');if(st)st.textContent='';$('aiMealDescription')?.focus();}});
  use.after(clr);
  const num=id=>{const v=$(id)?.value;return v===''||v==null?'':Number(v);};
  add.onclick=()=>{
    const food=$('aiEstimateName').value.trim(),cal=Number($('aiEstimateCalories').value),pro=Number($('aiEstimateProtein').value);
    const st=$('aiMealStatus');
    if(!food||!Number.isFinite(cal)||!Number.isFinite(pro)){if(st)st.textContent='Check the food, calories and protein first.';return;}
    const d=new Date(),day=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
    db.meals.push({date:day,type:type.value,food,calories:cal,protein:pro,carbs:num('aiEstimateCarbs'),fat:num('aiEstimateFat'),fiber:num('aiEstimateFiber')});
    if(save()){res.classList.add('hidden');$('aiMealDescription').value='';window.strideMealPhotos?.clear();['aiMealPhoto','mealCamera'].forEach(i=>{if($(i))$(i).value='';});$('mealPreview')?.classList.add('hidden');$('clearMealPhoto')?.classList.add('hidden');if(st)st.textContent='✓ Added to today’s diary.';render();}
    else{db.meals.pop();if(st)st.textContent='Could not save. Try again.';}
  };
  compressMeals(panel,today,use);
}

// Meals: Today (add + your meals) · Kitchen · Menus. Diary merges into Today.
function compressMeals(panel,today,use){
  // Progress › Nutrition history folds like the other history sections.
  {const hp=document.querySelector('.nutrition-history-panel');if(hp&&!hp.closest('details#nutritionFold')){const d=el('details',{id:'nutritionFold',className:'card'},[el('summary',{textContent:'View Nutrition History'})]);const h=hp.querySelector('h3');hp.before(el('h2',{textContent:'Nutrition history'}),d);if(h)h.remove();d.append(hp);hp.style.border='0';hp.style.padding='0';hp.style.background='transparent';}}
  // Clear buttons for the manual meal form and the workout log.
  const addClear=(formId,after)=>{const f=$(formId);if(!f||f.querySelector('.form-clear'))return;const btn=el('button',{type:'button',className:'secondary-btn form-clear',textContent:'Clear',onclick:()=>{const d=f.querySelector('input[type=date]'),keep=d?.value;f.reset();if(d)d.value=keep;after?.();}});const sub=f.querySelector('button:not([type=button])')||f.lastElementChild;sub.after(btn);};
  addClear('mealForm');addClear('workoutForm',()=>{const t=$('workoutType');if(t){t.value='';t.dispatchEvent(new Event('change'));}});
  const form=$('mealForm'),oldFormBox=form&&(form.closest('details')||form.closest('.card'));
  const h=panel.querySelector('h3');if(h)h.textContent='Add a meal';
  const p=panel.querySelector('h3+p');if(p)p.textContent='Snap a photo or type it. We’ll estimate the numbers.';
  $('aiAddDiary').textContent='Add to today';
  // Manual entry lives inside the one "add" box.
  const manual=el('details',{id:'manualMeal'},[el('summary',{textContent:'Enter it myself'})]);
  if(form){manual.append(form);panel.append(manual);const dl=form.querySelector('label[for=mealDate]');}
  if(oldFormBox&&oldFormBox!==panel&&!oldFormBox.contains(form))oldFormBox.remove();
  const goToday=()=>setTimeout(()=>{$('mealTab-today')?.click();manual.open=true;form?.scrollIntoView({behavior:'smooth',block:'center'});},0);
  use.textContent='Edit details first';use.addEventListener('click',goToday);
  $('kitchenResult')?.addEventListener('click',e=>{if(e.target.closest('button')?.textContent==='Review in meal log')goToday();});
  form?.addEventListener('submit',()=>setTimeout(()=>{if(!$('food').value)manual.open=false;},300));
  // Drop duplicate shortcuts/preview; show the real, editable list.
  today.querySelector(':scope>.actions')?.remove();
  $('todayMealPreview')?.closest('.card')?.remove();
  const hist=$('mealHistory');let past=null,pastList=null;
  if(hist){const box=hist.closest('details')||hist;const card=el('div',{className:'card',id:'yourMeals'},[el('h3',{textContent:'Your meals'})]);
    const empty=el('p',{id:'noMealsToday',className:'muted',textContent:'Nothing logged today yet.'});
    pastList=el('div',{id:'pastMeals'});past=el('details',{id:'pastDays'},[el('summary',{textContent:'Past days'}),pastList]);
    card.append(empty,hist,past);if(box!==hist)box.remove();panel.after(card);}
  const day=()=>{const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');};
  function repeatButtons(){const t=day();document.querySelectorAll('#yourMeals .meal-diary-entry').forEach(c=>{if(c.querySelector('.repeat-meal'))return;const food=c.querySelector('h3')?.textContent,kind=c.querySelector('.workout-history-kind')?.textContent;const m=db.meals.find(x=>x.date===c.dataset.date&&x.food===food&&(!kind||x.type===kind));if(!m)return;const b=el('button',{type:'button',className:'secondary-btn repeat-meal',textContent:c.dataset.date===t?'＋ Log again':'＋ Log again today',onclick:()=>{const copy={...m,date:t};delete copy.id;db.meals.push(copy);if(save()){render();const st=$('aiMealStatus');if(st)st.textContent='✓ '+m.food+' added to today.';$('yourMeals')?.scrollIntoView({behavior:'smooth',block:'start'});}else db.meals.pop();}});c.append(b);});}
  function splitDays(){if(!hist||!pastList)return;pastList.replaceChildren();const t=day();let n=0,last=null;
    [...hist.querySelectorAll(':scope .meal-diary-entry')].forEach(c=>{if(c.dataset.date===t){n++;return;}if(c.dataset.date!==last){last=c.dataset.date;pastList.append(el('p',{className:'past-day',textContent:new Date(last+'T12:00').toLocaleDateString(undefined,{weekday:'short',month:'short',day:'numeric'})}));}pastList.append(c);});
    hist.querySelectorAll(':scope>.diary-day,:scope>h3').forEach(x=>{if(!x.querySelector('.meal-diary-entry'))x.remove();});
    repeatButtons();$('noMealsToday').hidden=n>0||db.meals.some(x=>x.date===t);past.hidden=!pastList.children.length;}
  // Totals as four tiles.
  const nut=$('nutrition');let tiles=null;
  if(nut){tiles=el('div',{id:'macroTiles'});nut.before(tiles);nut.hidden=true;const h3=nut.closest('.card')?.querySelector('h3');if(h3)h3.remove();}
  function drawTiles(){if(!tiles)return;const t=day(),m=db.meals.filter(x=>x.date===t),sum=k=>m.reduce((n,x)=>n+(Number(x[k])||0),0),g=window.strideCalorieGoal(),burn=window.strideBurnedToday();
    tiles.innerHTML='';[['calories','kcal',0],['protein','protein',1],['carbs','carbs',1],['fat','fat',1]].forEach(([k,l,gr])=>tiles.append(el('div',{},[el('b',{textContent:Math.round(sum(k))+(gr?'g':'')}),el('span',{textContent:l})])));
    const bar=el('div',{className:'mbar'},[el('i')]);bar.firstChild.style.width=Math.min(100,sum('calories')/g*100)+'%';tiles.append(bar,el('p',{className:'muted mgoal',textContent:'of '+g+' kcal'+(burn?' (incl. '+burn+' burned in workouts)':'')+' · '+(db.goals?.protein||110)+' g protein'}));}
  const prevR=render;render=function(){prevR();splitDays();drawTiles();};splitDays();drawTiles();
  // Goals + achievements in one small fold.
  const goal=$('calGoal')?.closest('details'),ach=$('nutritionComplete')?.closest('.nutrition-achievement');
  if(goal){const eb=el('label',{className:'eat-back'},[el('input',{type:'checkbox',id:'eatBack',checked:eatBack(),onchange:e=>{try{localStorage.setItem(eatKey(),e.target.checked?'on':'off');}catch(x){}render();}}),document.createTextNode(' Add calories burned in workouts to today’s goal')]);$('calGoal')?.parentElement&&goal.append(eb);const s=goal.querySelector('summary');if(s)s.textContent='Goals & achievements';if(ach){const old=ach.closest('details');goal.append(ach);if(old&&old!==goal)old.remove();}today.append(goal);}
  // Tabs: Today · Kitchen · Menus.
  const diaryTab=$('mealTab-diary');if(diaryTab)diaryTab.remove();
  const tools=$('mealTab-tools');if(tools)tools.textContent='Menus';
  const menus=$('mealView-tools');
  if(menus){[...document.querySelectorAll('#mealView-kitchen > *')].forEach(n=>{if(n.id!=='myKitchen'){if(n.tagName==='BUTTON')menus.append(n);else menus.prepend(n);}});}
  // Kitchen: essentials up top, the rest under "More options".
  const kf=$('kitchenForm');
  if(kf&&!$('kitchenMore')){const more=el('details',{id:'kitchenMore'});const sum=el('summary',{textContent:'More options '});const hint=el('span',{className:'muted',id:'kitchenHint'});sum.append(hint);more.append(sum);
    ['kitchenAvoid','kitchenCuisine','kitchenPreference','kitchenMinutes'].forEach(id=>{const f=$(id);if(!f)return;const l=kf.querySelector('label[for='+id+']');if(l)more.append(l);more.append(f);});
    const pantry=$('kitchenPantry');if(pantry){pantry.open=true;const s=pantry.querySelector('summary');if(s){const lab=el('label',{textContent:'Pantry basics I have'});s.replaceWith(lab);}more.append(pantry);}
    more.append(el('p',{className:'muted',textContent:'Saved for next time.'}));
    const anchor=$('kitchenGenerate');(anchor?.closest('.actions')||anchor)?.before(more);
    const upd=()=>{const a=$('kitchenAvoid')?.value.trim(),c=$('kitchenCuisine')?.value.trim();hint.textContent=[a&&'· avoid '+a,c&&'· '+c].filter(Boolean).join(' ');};
    ['kitchenAvoid','kitchenCuisine'].forEach(i=>$(i)?.addEventListener('input',upd));setTimeout(upd,500);}
  // Kitchen photos: snap the fridge/pantry and we list what we see.
  const ki=$('kitchenIngredients');
  if(ki&&!$('kitchenSnap')&&window.strideMultiPhoto){
    const box=el('div',{id:'kitchenSnap'});
    const camL=el('label',{htmlFor:'kitchenCamera',textContent:'📷 Take a photo of your fridge or pantry'}),cam=el('input',{type:'file',id:'kitchenCamera',accept:'image/*'});cam.setAttribute('capture','environment');
    const libL=el('label',{htmlFor:'kitchenLibrary',textContent:'Or choose photos'}),lib=el('input',{type:'file',id:'kitchenLibrary',accept:'image/*'});
    const read=el('button',{type:'button',id:'kitchenRead',textContent:'Read my photos',hidden:true}),st=el('p',{id:'kitchenSnapStatus',className:'muted',role:'status'});
    box.append(camL,cam,libL,lib,read,st);
    (kf.querySelector('label[for=kitchenIngredients]')||ki).before(box);
    let pics=[];const mp=window.strideMultiPhoto.attach({inputs:[cam,lib],after:lib,onChange:(l,err)=>{pics=l;read.hidden=!l.length;st.textContent=err||(l.length?l.length+' photo'+(l.length>1?'s':'')+' ready.':'');}});
    read.onclick=async()=>{if(!pics.length)return;read.disabled=true;st.textContent='Looking at your photos…';
      try{const token=await window.mealAiGetToken?.();if(!token)throw Error('Sign in to read kitchen photos.');
        const r=await fetch('/.netlify/functions/read-pantry',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify({photos:pics})});
        const d=await r.json().catch(()=>({error:'Invalid server response'}));if(!r.ok)throw Error(d.error||'Could not read the photos.');
        if(!d.items.length){st.textContent='No food found. Try a clearer, closer photo.';return;}
        const have=ki.value.trim(),line=d.items.map(i=>(i.amount?i.amount+' ':'')+i.name+(i.confidence==='uncertain'?' (?)':'')).join(', ');
        ki.value=have?have+', '+line:line;ki.dispatchEvent(new Event('input',{bubbles:true}));mp.clear();pics=[];read.hidden=true;
        st.textContent='Added '+d.items.length+' items below. Check them, fix anything marked (?), then plan.';ki.focus();
      }catch(e){st.textContent=e.message;}finally{read.disabled=false;}};
  }
  const kfold=$('kitchenFold');if(kfold&&kf){kfold.before(kf);kfold.remove();}
}


// Menus › My meal plan: always a full week (unless a custom menu is active).
// Meal pool tagged by what each dish contains, so the week can follow any mix of diet rules.
const POOL={
 Breakfast:['Greek yogurt, oats & berries|dairy gluten carb hp','Veggie omelette & toast|egg gluten hp','Oats with chia & banana|gluten carb','Tofu scramble & toast|gluten hp','Peanut butter banana smoothie|nuts dairy carb','Egg & avocado toast|egg gluten','Cottage cheese & fruit|dairy hp','Akara (bean fritters) & pap|carb hp','Chicken sausage & egg wrap|poultry egg gluten hp','Turkey bacon, eggs & toast|poultry egg gluten hp','Smoked salmon & cream cheese bagel|fish dairy gluten hp','Rice porridge with fruit|carb','Overnight soy-milk oats & seeds|gluten carb','Spinach & mushroom egg muffins|egg hp','Coconut yogurt & granola|nuts gluten carb','Breakfast potatoes, beans & avocado|carb'],
 Lunch:['Chicken rice bowl|poultry carb hp','Turkey & lettuce wrap|poultry gluten hp','Tuna salad sandwich|fish egg gluten hp','Chickpea & quinoa salad|carb hp','Lentil soup & bread|gluten carb','Beef burrito bowl|beef carb hp','Black bean burrito bowl|carb','Grilled chicken salad|poultry hp','Hummus & falafel pita|gluten carb','Egg fried rice with vegetables|egg carb','Jollof rice & grilled chicken|poultry carb hp','Shrimp tacos|shellfish gluten carb hp','Sardines on rice crackers & salad|fish hp','Tofu & edamame noodle bowl|gluten carb hp','Cheese & tomato toastie|dairy gluten carb','Ham & cheese sandwich|pork dairy gluten meatdairy','Baked potato with beans|carb','Salmon poke bowl|fish carb hp'],
 Dinner:['Salmon, potatoes & greens|fish carb hp','Chicken stir-fry & rice|poultry carb hp','Lentil curry & rice|carb hp','Beef stew & yam|beef carb hp','Turkey meatballs & pasta|poultry gluten carb egg hp','Tofu & vegetable curry|carb hp','Roast chicken & vegetables|poultry hp','Grilled fish & plantain|fish carb hp','Bean & sweet potato chili|carb','Chickpea & spinach stew|hp','Pork chops & mashed potatoes|pork dairy carb meatdairy hp','Shrimp & vegetable stir-fry|shellfish hp','Egusi soup with fish & swallow|fish carb hp','Steak, salad & roast potatoes|beef carb hp','Vegetable lasagne|dairy gluten egg carb','Lamb kofta & salad|hp','Chicken suya & coleslaw|poultry nuts hp','Grilled chicken, broccoli & avocado|poultry hp']};
const FORBID={halal:['pork'],kosher:['pork','shellfish','meatdairy'],vegetarian:['pork','beef','poultry','fish','shellfish','meat'],vegan:['pork','beef','poultry','fish','shellfish','meat','egg','dairy','meatdairy'],pescatarian:['pork','beef','poultry','meat'],noPork:['pork'],noBeef:['beef'],glutenFree:['gluten'],dairyFree:['dairy','meatdairy'],eggFree:['egg'],nutFree:['nuts'],lowCarb:['carb']};
const DIET_LABELS={halal:'Halal',kosher:'Kosher',vegetarian:'Vegetarian',vegan:'Vegan',pescatarian:'Pescatarian',noPork:'No pork',noBeef:'No beef',glutenFree:'Gluten-free',dairyFree:'Dairy-free',eggFree:'Egg-free',nutFree:'Nut-free',lowCarb:'Lower-carb'};
const dietKey=()=>'stride-diet-'+(window.cloudRecordOwner?.()||'browser');
function dietRules(){try{const v=JSON.parse(localStorage.getItem(dietKey())||'[]');return Array.isArray(v)?v.filter(k=>DIET_LABELS[k]):[];}catch(e){return [];}}
window.strideDietRules=()=>{const r=dietRules();if($('mealStyle')?.value==='plant'&&!r.includes('vegan'))r.push('vegan');return r;};
// Lamb is meat for vegetarian checks.
POOL.Dinner=POOL.Dinner.map(x=>/Lamb/.test(x)?x+' meat':x);
const DAYS=['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
function weekFor(style,rules){
  const bad=new Set(rules.flatMap(r=>FORBID[r]||[]));
  const out={};
  for(const slot of Object.keys(POOL)){
    let list=POOL[slot].map(x=>{const [n,t]=x.split('|');return {n,t:new Set((t||'').split(' '))};}).filter(m=>![...m.t].some(t=>bad.has(t)));
    if(style==='protein')list.sort((a,b)=>(b.t.has('hp')?1:0)-(a.t.has('hp')?1:0));
    out[slot]=list;
  }
  return out;
}
function drawWeek(){
  const plan=$('mealPlan');if(!plan)return;
  if(plan.querySelector('details.card:not(.stride-week)'))return; // custom menu is active
  const style=$('mealStyle')?.value||'balanced',rules=window.strideDietRules(),sig=style+'|'+rules.join(',');
  if(plan.dataset.week===sig&&plan.querySelector('.stride-week'))return;
  plan.dataset.week=sig;
  const w=weekFor(style,rules),todayIdx=(new Date().getDay()+6)%7;
  const label=({balanced:'Balanced',protein:'Higher-protein',plant:'Plant-based',custom:'Your'})[style]||'Balanced';
  const ruleTxt=rules.filter(r=>!(style==='plant'&&r==='vegan')).map(r=>DIET_LABELS[r]).join(', ');
  const head=el('p',{className:'muted',textContent:label+' week'+(ruleTxt?' · '+ruleTxt:'')+'. Change this in Edit preferences on Home.'});
  if(Object.values(w).some(l=>!l.length)){plan.replaceChildren(head,el('p',{textContent:'Not enough meals fit all your diet rules for a full week. Use “Build or substitute a menu” below and we’ll create one that fits.'}));return;}
  const note=rules.includes('halal')?' (halal)':'';
  plan.replaceChildren(head,...DAYS.map((d,i)=>{const det=el('details',{className:'card stride-week',open:i===todayIdx},[el('summary',{textContent:d+(i===todayIdx?' · today':'')})]);
    const ul=el('ul');Object.keys(w).forEach((slot,j)=>{const l=w[slot],m=l[(i*(j+2)+j)%l.length].n;ul.append(el('li',{},[el('b',{textContent:slot+': '}),document.createTextNode(m+(note&&/chicken|beef|lamb|turkey|steak|meatball|suya/i.test(m)?note:''))]));});det.append(ul);return det;}));
}
// Home › Edit preferences: diet rules checklist.
function dietPicker(){
  const style=$('mealStyle');if(!style||$('dietRules'))return;
  const box=el('fieldset',{id:'dietRules'},[el('legend',{textContent:'Diet rules (tick any that apply)'})]);
  const saved=new Set(dietRules());
  Object.entries(DIET_LABELS).forEach(([k,l])=>{const cb=el('input',{type:'checkbox',value:k,id:'diet-'+k,checked:saved.has(k)});box.append(el('label',{htmlFor:'diet-'+k,className:'diet-chip'},[cb,document.createTextNode(' '+l)]));});
  box.append(el('p',{className:'muted',textContent:'Your 7-day plan, My Kitchen and menu building all follow these.'}));
  box.addEventListener('change',()=>{const v=[...box.querySelectorAll('input:checked')].map(c=>c.value);try{localStorage.setItem(dietKey(),JSON.stringify(v));}catch(e){}drawWeek();});
  (style.closest('label')||style).after(box);
}
{const r0=render;render=function(){r0();drawWeek();};setTimeout(()=>{dietPicker();drawWeek();},800);document.addEventListener('change',e=>{if(e.target.id==='mealStyle')setTimeout(drawWeek,50);});}

// Calories burned today (watch reading first, then the session estimate, then a standard MET estimate).
const MET=[[/long run|quality run|\brun/i,9.8],[/walk/i,3.5],[/bike|cycl/i,7],[/swim/i,7],[/upper|lower|strength|diagnostic|test/i,5],[/standing core|core/i,3.8],[/recovery|mobility|stretch/i,2.5]];
const eatKey=()=>'stride-eatback-'+(window.cloudRecordOwner?.()||'browser');
const eatBack=()=>{try{return localStorage.getItem(eatKey())!=='off';}catch(e){return true;}};
function burnedOn(day){
  if(typeof db==='undefined')return 0;const owner=window.cloudRecordOwner?.()||'browser';
  const kg=window.strideEnergy?.weight(db,owner,day)?.kg||70;let sum=0;
  for(const w of db.workouts.filter(x=>x.date===day)){
    const watch=String(w.notes||'').match(/(\d{2,4})\s*active kcal/i);if(watch){sum+=Number(watch[1]);continue;}
    const s=w.session;if(s&&window.strideEnergy){const e=window.strideEnergy.estimate(s,Number(w.minutes)||Number(s.minutes)||0);if(e){sum+=Math.round((e.low+e.high)/2);continue;}}
    const mi=Number(w.miles)||0,min=Number(w.minutes)||0;
    if(mi>0&&/run/i.test(w.type)){sum+=Math.round(1.0*kg*mi*1.609);continue;}
    if(mi>0&&/walk/i.test(w.type)){sum+=Math.round(0.5*kg*mi*1.609);continue;}
    const met=(MET.find(([r])=>r.test(w.type||''))||[0,4])[1];if(min>0)sum+=Math.round(met*kg*min/60);
  }
  return Math.max(0,Math.min(3000,Math.round(sum/5)*5));
}
const todayStr=()=>{const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');};
window.strideBurnedToday=()=>eatBack()?burnedOn(todayStr()):0;
window.strideCalorieGoal=()=>(Number(db.goals?.calories)||1900)+window.strideBurnedToday();
const css=document.createElement('style');
css.textContent=`header{position:relative}
#topTools{position:absolute;top:12px;right:12px;display:flex;gap:8px;z-index:60}
body.welcome #topTools{display:none}
.top-tool{width:42px;height:42px;padding:0!important;margin:0!important;border-radius:50%!important;display:grid;place-items:center;background:var(--card)!important;color:var(--fg)!important;border:1px solid var(--soft)!important}
.top-panel{position:absolute;top:52px;right:0;width:min(300px,calc(100vw - 32px));background:var(--card);color:var(--fg);border:1px solid var(--soft);border-radius:16px;padding:16px;box-shadow:0 12px 32px rgba(0,0,0,.35)}
.top-panel h3{margin:0 0 10px;font-size:17px}.top-panel h4{margin:14px 0 8px;font-size:14px;color:var(--muted)}
.top-panel .size-row{display:flex!important;margin:0;gap:8px;align-items:center}
.top-panel button:not(.top-tool){display:block;width:100%;margin:8px 0 0!important}
.top-panel .size-row button,.top-panel .v5-skins button{display:inline-block;width:auto}
.acct-email{margin:0 0 6px;font-weight:700;overflow-wrap:anywhere}
.acct-logout{background:transparent!important;color:var(--fg)!important;border:1px solid var(--soft)!important}
.secondary-btn{background:transparent!important;color:var(--fg)!important;border:1px solid var(--soft)!important}
.calm-account>summary{font-weight:800!important;color:var(--fg)!important;opacity:1!important;font-size:18px}
.macro-row{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}.macro-row input{width:100%}
header h1,header p{padding-right:100px}
body>.size-row{display:none}
#aiMealPanel{background:var(--card)!important;border:1px solid var(--soft)!important;border-radius:18px!important;padding:18px!important}
#pastMeals .meal-diary-entry{padding:16px;margin:10px 0;border:1px solid var(--soft);border-radius:18px}#pastMeals .meal-diary-metrics{display:flex;gap:18px;flex-wrap:wrap}
#mealTabs{grid-template-columns:repeat(3,minmax(0,1fr))!important}
#macroTiles{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;text-align:center}#macroTiles>div{display:flex;flex-direction:column;gap:2px}#macroTiles b{font-size:19px;font-variant-numeric:tabular-nums}#macroTiles span{font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:.05em}
.mbar{grid-column:1/-1;height:6px;background:var(--soft);border-radius:4px;overflow:hidden;margin-top:8px}.mbar i{display:block;height:100%;background:var(--accent)}.mgoal{grid-column:1/-1;margin:2px 0 0;text-align:left}
#manualMeal,#pastDays,#kitchenMore{margin-top:12px}#manualMeal>summary,#pastDays>summary,#kitchenMore>summary{font-weight:700;cursor:pointer}
.past-day{font-size:12px;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;margin:14px 0 2px}
#kitchenPantry>summary{display:none}
#yourMeals .repeat-meal{margin:10px 0 0!important;padding:8px 14px!important;font-size:14px}
#kitchenSnap{border:1px dashed var(--soft);border-radius:14px;padding:12px;margin:8px 0 12px}#kitchenSnap label{margin-top:4px}#kitchenRead{margin-top:10px}
.eat-back{display:flex;gap:8px;align-items:center;font-weight:500;margin:12px 0}.eat-back input{width:auto!important}
#nutritionFold>summary{font-weight:700;cursor:pointer}
#dietRules{border:1px solid var(--soft);border-radius:14px;padding:12px;margin:12px 0;display:flex;flex-wrap:wrap;gap:8px}#dietRules legend{font-weight:700;padding:0 6px}.diet-chip{display:inline-flex;align-items:center;gap:6px;border:1px solid var(--soft);border-radius:999px;padding:6px 12px;margin:0!important;font-weight:500;cursor:pointer}.diet-chip input{width:auto!important;margin:0}.diet-chip:has(input:checked){background:var(--accent);color:var(--on-accent,#fff);border-color:var(--accent)}#dietRules p{flex-basis:100%;margin:4px 0 0}
.stride-week ul{margin:8px 0 0;padding-left:18px;line-height:1.7}.stride-week>summary{font-weight:700;cursor:pointer}`;
document.head.append(css);

if(document.readyState==='complete')setup();else window.addEventListener('load',()=>setTimeout(setup,0));
})();
