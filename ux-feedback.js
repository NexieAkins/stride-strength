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
  const num=id=>{const v=$(id)?.value;return v===''||v==null?'':Number(v);};
  add.onclick=()=>{
    const food=$('aiEstimateName').value.trim(),cal=Number($('aiEstimateCalories').value),pro=Number($('aiEstimateProtein').value);
    const st=$('aiMealStatus');
    if(!food||!Number.isFinite(cal)||!Number.isFinite(pro)){if(st)st.textContent='Check the food, calories and protein first.';return;}
    const d=new Date(),day=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
    db.meals.push({date:day,type:type.value,food,calories:cal,protein:pro,carbs:num('aiEstimateCarbs'),fat:num('aiEstimateFat'),fiber:num('aiEstimateFiber')});
    if(save()){res.classList.add('hidden');$('aiMealDescription').value='';['aiMealPhoto','mealCamera'].forEach(i=>{if($(i))$(i).value='';});$('mealPreview')?.classList.add('hidden');$('clearMealPhoto')?.classList.add('hidden');if(st)st.textContent='✓ Added to today’s diary.';render();}
    else{db.meals.pop();if(st)st.textContent='Could not save. Try again.';}
  };
  compressMeals(panel,today,use);
}

// Meals: Today (add + your meals) · Kitchen · Menus. Diary merges into Today.
function compressMeals(panel,today,use){
  const form=$('mealForm'),oldFormBox=form&&(form.closest('details')||form.closest('.card'));
  // Manual entry lives inside the one "add" box.
  const manual=el('details',{id:'manualMeal'},[el('summary',{textContent:'Enter it myself'})]);
  if(form){manual.append(form);panel.append(manual);}
  if(oldFormBox&&oldFormBox!==panel&&!oldFormBox.contains(form))oldFormBox.remove();
  const goToday=()=>setTimeout(()=>{$('mealTab-today')?.click();manual.open=true;form?.scrollIntoView({behavior:'smooth',block:'center'});},0);
  use.textContent='Edit details first';use.addEventListener('click',goToday);
  $('kitchenResult')?.addEventListener('click',e=>{if(e.target.closest('button')?.textContent==='Review in meal log')goToday();});
  form?.addEventListener('submit',()=>setTimeout(()=>{if(!$('food').value)manual.open=false;},300));
  // Drop the duplicate shortcuts and preview; show the real, editable list instead.
  today.querySelector(':scope>.actions')?.remove();
  $('todayMealPreview')?.closest('.card')?.remove();
  const hist=$('mealHistory');
  if(hist){const box=hist.closest('details')||hist;const card=el('div',{className:'card',id:'yourMeals'},[el('h3',{textContent:'Your meals'})]);card.append(hist);if(box!==hist)box.remove();panel.after(card);}
  // Goals + achievements in one small fold.
  const goal=$('calGoal')?.closest('details'),ach=$('nutritionComplete')?.closest('.nutrition-achievement');
  if(goal){const s=goal.querySelector('summary');if(s)s.textContent='Goals & achievements';if(ach){const old=ach.closest('details');goal.append(ach);if(old&&old!==goal)old.remove();}today.append(goal);}
  // Tabs: hide Diary, rename tools to Menus, move meal ideas there.
  const diaryTab=$('mealTab-diary');if(diaryTab)diaryTab.style.display='none';
  const tools=$('mealTab-tools');if(tools)tools.textContent='Menus';
  const menus=$('mealView-tools');
  if(menus){const rec=$('mealRecommendations');if(rec){const hd=document.querySelector('#meals h2');}
    [...document.querySelectorAll('#mealView-kitchen > *')].forEach(n=>{if(n.id!=='myKitchen')menus.append(n);});
    const mf=menus.querySelector('details>summary');if(mf&&/menu/i.test(mf.textContent))mf.parentElement.open=false;}
}

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
body>.size-row{display:none}`;
document.head.append(css);

if(document.readyState==='complete')setup();else window.addEventListener('load',()=>setTimeout(setup,0));
})();
