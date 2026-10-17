/* Find my starting weights: a guided step-up test whose results seed future workouts. */
(()=>{
'use strict';
const $=id=>document.getElementById(id);
const planner=$('trainingPlanner');if(!planner)return;
const CUE='Set 1 is a light warm-up. Add a little weight each set. Stop at the weight where 8–10 reps leaves about 2–3 reps in the tank. Never go to failure; stop for pain.';
const PLANS={
 machines:[['Leg Press Machine','Lower body'],['Chest Press Machine','Push'],['Lat Pulldown Machine','Pull'],['Seated Cable Row','Pull'],['Shoulder Press Machine','Push']],
 dumbbells:[['Goblet Squat','Lower body'],['Dumbbell Bench Press','Push'],['One-Arm Dumbbell Row','Pull'],['Dumbbell Shoulder Press','Push'],['Dumbbell Romanian Deadlift','Hinge']]
};
const RANK={beginner:0,intermediate:1,advanced:2};
const box=document.createElement('div');box.id='startingWeights';box.className='starting-weights';
box.innerHTML='<h3>Find my starting weights</h3><p>A guided test (about 20 minutes) so your workouts start at the right weight. Optional, and worth redoing when you move up a level.</p><p id="swPrompt" class="sw-prompt" hidden></p><label for="swEquipment">Equipment</label><select id="swEquipment"><option value="machines">Gym machines</option><option value="dumbbells">Dumbbells</option></select><div class="watch-row"><button type="button" id="swStart">Start the test</button></div><div id="swResults"></div>';
const intro=planner.querySelector('p');(intro||planner.firstChild).after(box);
function latest(){return (window.db?.workouts||db.workouts).filter(w=>w.session?.source==='Diagnostic'&&w.session.exercises?.length).sort((a,b)=>String(b.date).localeCompare(String(a.date)))[0];}
function working(e){const sets=e.sets.filter(s=>s.done&&Number(s.weight)>0);if(!sets.length)return null;const good=sets.filter(s=>Number(s.reps)>=8);const pick=(good.length?good:sets).reduce((a,b)=>Number(b.weight)>Number(a.weight)?b:a);return {weight:Number(pick.weight),unit:pick.weightUnit||'lb'};}
function drawResults(){const out=$('swResults');out.replaceChildren();const w=latest();if(!w)return;const h=document.createElement('h4');h.textContent='Your starting weights · '+w.date;out.append(h);const ul=document.createElement('ul');ul.className='sw-list';for(const e of w.session.exercises){const r=working(e);if(!r)continue;const li=document.createElement('li');li.innerHTML='<span></span><strong></strong>';li.firstChild.textContent=e.name;li.lastChild.textContent=r.weight+' '+r.unit;ul.append(li);}if(ul.children.length){out.append(ul);const p=document.createElement('p');p.className='sw-note';p.textContent='New workouts use these as your starting point, then adjust from what you log.';out.append(p);$('swStart').textContent='Retest my starting weights';}}
$('swStart').onclick=()=>{const T=window.strideSessionTracker;if(!T)return;if(T.isActive()){$('swPrompt').hidden=false;$('swPrompt').textContent='Finish or cancel your current workout first.';return;}const level=$('trainLevel')?.value||'beginner',eq=$('swEquipment').value;const plan={title:'Starting weight test · '+(eq==='machines'?'machines':'dumbbells'),minutes:20,exercises:PLANS[eq].map(([name])=>({name,sets:4,reps:'8–10 reps',load:'Step up each set',cue:CUE,weight_unit:'lb'}))};try{localStorage.setItem('stride-sw-level',level);}catch{}T.start(plan,{focus:'full',level},'Diagnostic');};
const lvl=$('trainLevel');if(lvl)lvl.addEventListener('change',()=>{let last;try{last=localStorage.getItem('stride-sw-level');}catch{}const now=lvl.value;if(last&&RANK[now]>RANK[last]&&latest()){$('swPrompt').hidden=false;$('swPrompt').textContent='You moved up to '+now+'. Retest your starting weights so new workouts match your strength.';}else $('swPrompt').hidden=true;});
const style=document.createElement('style');style.textContent='.starting-weights{border:1px solid var(--soft);border-radius:14px;padding:14px;margin:12px 0}.starting-weights h3{margin:0 0 4px}.sw-prompt{color:var(--accent);font-weight:600}.sw-list{list-style:none;padding:0;margin:6px 0}.sw-list li{display:flex;justify-content:space-between;gap:8px;padding:6px 0;border-bottom:1px solid color-mix(in srgb,var(--muted) 18%,transparent)}.sw-note{font-size:13px;color:var(--muted)}';document.head.append(style);
const prev=render;render=function(){prev();drawResults();};drawResults();
window.addEventListener('stride-session-end',drawResults);
})();
