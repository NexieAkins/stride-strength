/* Train opens with today's activity; libraries appear only when requested. */
(()=>{
'use strict';
const node=(tag,text)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;return n};
const train=$('train'),tracker=$('sessionTracker'),planner=$('trainingPlanner'),core=$('coreLibrary'),stretch=$('stretchRoutine').closest('.card');
const week=node('details');week.className='card';week.id='trainingWeek';week.append(node('summary','Browse another day'),$('daySelect'),$('dayDetails'));
const oldLog=train.querySelector('button[data-go="log"]');if(oldLog)week.append(oldLog);
const tabs=node('div');tabs.id='trainingTabs';tabs.setAttribute('role','tablist');tabs.setAttribute('aria-label','Training views');
const views={},buttons={},names={today:'Today',plan:'Plan',recovery:'Recovery'};
for(const [key,label] of Object.entries(names)){const b=node('button',label);b.type='button';b.id='trainingTab-'+key;b.setAttribute('role','tab');b.setAttribute('aria-controls','trainingView-'+key);b.onclick=()=>select(key);buttons[key]=b;tabs.append(b);const panel=node('div');panel.id='trainingView-'+key;panel.setAttribute('role','tabpanel');panel.setAttribute('aria-labelledby',b.id);views[key]=panel;}
tabs.onkeydown=event=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;event.preventDefault();const keys=Object.keys(names),current=keys.indexOf(selected);const next=event.key==='Home'?0:event.key==='End'?keys.length-1:(current+(event.key==='ArrowRight'?1:-1)+keys.length)%keys.length;select(keys[next]);buttons[keys[next]].focus();};
const today=node('div');today.className='card';today.id='todayTraining';
views.today.append(tracker,today,week);const coreFold=node('details');coreFold.id='coreChoices';coreFold.className='card';coreFold.append(node('summary','Core routines'),core);views.plan.append(coreFold,planner);views.recovery.append(stretch);
train.replaceChildren(node('h2','Train'),node('p','One workout at a time.'),tabs,...Object.values(views));
let selected='today',currentOwner=null;
function select(key){selected=key;for(const name of Object.keys(names)){const active=name===key;views[name].hidden=!active;views[name].classList.toggle('hidden',!active);buttons[name].setAttribute('aria-selected',String(active));buttons[name].tabIndex=active?0:-1;}if(key==='today')update();}
function action(label,fn){const b=node('button',label);b.type='button';b.onclick=fn;return b;}
function update(){const id=window.cloudRecordOwner?.()||'browser';if(currentOwner!==id){currentOwner=id;selected='today';week.open=false;select('today');return;}const active=window.strideSessionTracker.isActive();today.hidden=active;week.hidden=active;if(active)return;const index=(new Date().getDay()+6)%7,p=plan[index];today.replaceChildren(node('h3',p[0]+' · Today'),node('p',p[1]));
if(!p||/choose your schedule/i.test(p[1])){today.append(node('p','Set your weekly schedule, or choose a workout for today.'),action('Choose a workout',()=>select('plan')),action('Set my schedule',()=>show('home')));}
else if(/run/i.test(p[1])){today.append(node('p','Use your prescribed run, then log your actual distance and time.'),action('Log today’s run',()=>{show('log');$('workoutType').value=/quality/i.test(p[1])?'Quality Run':'Long Run';$('workoutDate').value=date();}),action('Choose a different workout',()=>select('plan')));}
else if(/rest|recovery/i.test(p[1])){today.append(node('p','Take your planned recovery day.'),action('Open recovery routines',()=>select('recovery')),action('Choose a workout',()=>select('plan')));}
else if(/standing core/i.test(p[1])){today.append(action('Start standing core',()=>{$('coreCategory').value='standing';$('coreCategory').dispatchEvent(new Event('change'));$('coreSave').click();}));}
else{today.append(action('Plan today’s workout',()=>{$('trainFocus').value=/lower|leg/i.test(p[1])?'lower':/back/i.test(p[1])?'upperback':/upper/i.test(p[1])?'upper':/core/i.test(p[1])?'core':'full';select('plan');}));}
tracker.querySelector('p')?.replaceChildren(document.createTextNode('Start a workout or resume a saved session.'));
}
window.addEventListener('stride-plan-workout',()=>select('plan'));window.addEventListener('stride-session-start',()=>select('today'));
const originalStart=window.strideSessionTracker.start;window.strideSessionTracker.start=function(...args){originalStart(...args);if(window.strideSessionTracker.isActive()){select('today');tracker.scrollIntoView({behavior:'smooth',block:'start'});}};
const originalRender=render;render=function(){originalRender();update();};
const style=node('style');style.textContent='#trainingTabs{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:4px;padding:5px;background:var(--card);border-radius:12px;margin:16px 0}#trainingTabs button{background:transparent;color:var(--muted);padding:10px 4px}#trainingTabs button[aria-selected=true]{background:var(--accent);color:var(--on-accent)}#todayTraining button{margin:4px 4px 4px 0}#trainingWeek summary{cursor:pointer;font-weight:700}#trainingView-today #sessionTracker>h2{margin-top:0}';document.head.append(style);
select('today');
})();
