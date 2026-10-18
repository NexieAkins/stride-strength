/* Meals defaults to today's totals and a short diary, not every tool. */
(()=>{
'use strict';
const node=(tag,text)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;return n},meals=$('meals');
const totals=$('nutrition').closest('.card'),goals=$('calGoal').closest('details')||$('calGoal').closest('.card'),logger=$('aiMealPanel').closest('details')||$('aiMealPanel'),form=$('mealForm').closest('details')||$('mealForm').closest('.card'),history=$('mealHistory').closest('details')||$('mealHistory'),achievement=$('nutritionComplete').closest('.nutrition-achievement'),kitchen=$('myKitchen'),menu=$('menuGenerate').closest('.card'),recommendations=$('mealRecommendations');
const restore=[...meals.querySelectorAll('button')].find(b=>b.textContent==='Restore Default Meal Plan');
const tabs=node('div');tabs.id='mealTabs';tabs.setAttribute('role','tablist');tabs.setAttribute('aria-label','Meal views');
const names={today:'Today',diary:'Diary',kitchen:'Kitchen',tools:'Meal tools'},views={},buttons={};let selected='today',currentOwner=null;
for(const [name,label]of Object.entries(names)){const b=node('button',label);b.type='button';b.id='mealTab-'+name;b.setAttribute('role','tab');b.setAttribute('aria-controls','mealView-'+name);b.onclick=()=>select(name);buttons[name]=b;tabs.append(b);const panel=node('div');panel.id='mealView-'+name;panel.setAttribute('role','tabpanel');panel.setAttribute('aria-labelledby',b.id);views[name]=panel;}
const quick=node('div');quick.className='card';quick.append(node('h3','Today’s food diary'));const preview=node('div');preview.id='todayMealPreview';quick.append(preview);
function action(text,fn){const b=node('button',text);b.type='button';b.onclick=fn;return b;}
const actions=node('div');actions.className='actions';actions.append(action('Log a meal',openLog),action('Use my ingredients',()=>select('kitchen')));views.today.append(actions,quick);
const achievements=node('details');achievements.className='card';achievements.append(node('summary','Today’s nutrition achievements'),achievement);views.today.append(achievements,goals);
views.diary.append(form,history);
views.kitchen.append(kitchen);if(recommendations)views.kitchen.append(recommendations);if(restore)views.kitchen.append(restore);
const menuFold=node('details');menuFold.className='card';menuFold.append(node('summary','Build or substitute a menu'),menu);views.tools.append(logger,menuFold);
meals.replaceChildren(node('h2','Meals'),node('p','Today’s fuel, at a glance.'),totals,tabs,...Object.values(views));
function select(name){selected=name;for(const key of Object.keys(names)){const active=key===name;views[key].hidden=!active;views[key].classList.toggle('hidden',!active);buttons[key].setAttribute('aria-selected',String(active));buttons[key].tabIndex=active?0:-1;}}
function openLog(){select('diary');if(form.tagName==='DETAILS')form.open=true;$('mealForm').scrollIntoView({behavior:'smooth',block:'start'});}
tabs.onkeydown=event=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;event.preventDefault();const keys=Object.keys(names),index=keys.indexOf(selected),next=event.key==='Home'?0:event.key==='End'?keys.length-1:(index+(event.key==='ArrowRight'?1:-1)+keys.length)%keys.length;select(keys[next]);buttons[keys[next]].focus();};
$('aiUseEstimate').addEventListener('click',()=>{if($('food').value)openLog();});
$('kitchenResult').addEventListener('click',event=>{if(event.target.closest('button')?.textContent==='Review in meal log')openLog();});
function update(){const owner=window.cloudRecordOwner?.()||'browser';if(currentOwner!==owner){currentOwner=owner;select('today');}const entries=db.meals.filter(m=>m.date===date());preview.replaceChildren();if(!entries.length)preview.append(node('p','No meals logged today yet.'));else{entries.slice(-3).forEach(m=>preview.append(node('p',m.food+' · '+m.calories+' kcal · '+m.protein+' g protein'+(m.carbs!==''&&m.carbs!=null?' · '+m.carbs+' g carbs':'')+(m.fat!==''&&m.fat!=null?' · '+m.fat+' g fat':''))));preview.append(action(entries.length>3?'View all '+entries.length+' meals':'Open food diary',()=>select('diary')));}}
const previous=render;render=function(){previous();update();};
const style=node('style');style.textContent='#mealTabs{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:4px;padding:5px;background:var(--card);border-radius:12px;margin:16px 0}#mealTabs button{background:transparent;color:var(--muted);padding:10px 4px}#mealTabs button[aria-selected=true]{background:var(--accent);color:var(--on-accent)}#mealView-today details>summary{cursor:pointer;font-weight:700}#todayMealPreview p{padding:8px 0;border-bottom:1px solid var(--soft);overflow-wrap:anywhere}#mealView-today .nutrition-achievement{border:0;margin-bottom:0;padding:8px 0}#mealRecommendations{background:var(--card)}#mealHistory .diary-day,#mealHistory .card{background:var(--card);border-color:var(--soft);color:var(--fg)}';document.head.append(style);select('today');update();
})();
