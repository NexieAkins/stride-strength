/* Plank and push-up progressions: 10 levels each, soreness check after sessions, awards. */
(()=>{
'use strict';
const $=id=>document.getElementById(id);
const node=(t,x,c)=>{const n=document.createElement(t);if(x!==undefined)n.textContent=x;if(c)n.className=c;return n;};
const TRACKS={
 plank:{name:'Plank',focus:'core',levels:[
  ['Knee plank',3,'20 seconds','Knees down, elbows under shoulders, straight line from knees to head.'],
  ['Forearm plank',3,'30 seconds','Squeeze glutes, ribs down, breathe steadily.'],
  ['Forearm plank',3,'45 seconds','Keep hips level — no sagging or piking.'],
  ['Forearm plank',2,'60 seconds','Push the floor away with your forearms.'],
  ['Forearm plank',2,'90 seconds','Stay tall through the shoulders; breathe.'],
  ['Forearm plank',2,'2 minutes','Rest 60–90 sec between holds.'],
  ['Forearm plank',1,'3 minutes','Break your focus into 30-second chunks.'],
  ['Forearm plank',1,'5 minutes','Stop early if your form breaks.'],
  ['Forearm plank',1,'7 minutes','Steady breathing; keep glutes on.'],
  ['Forearm plank',1,'10 minutes','The 10-minute plank. Form first, always.']]},
 pushup:{name:'Push-up',focus:'upper',levels:[
  ['Wall push-ups',3,'10 reps','Hands at shoulder height on a wall; body in a straight line.'],
  ['Incline push-ups (bench or counter)',3,'10 reps','Chest to the edge, elbows about 45° from your body.'],
  ['Incline push-ups (bench or counter)',3,'15 reps','Lower slowly for 2 seconds.'],
  ['Knee push-ups',3,'10 reps','Straight line from knees to head; full range.'],
  ['Knee push-ups',3,'15 reps','Chest close to the floor each rep.'],
  ['Push-ups',3,'5 reps','Full push-ups. Drop to knees to finish a set if needed.'],
  ['Push-ups',3,'8 reps','Squeeze glutes so hips don’t sag.'],
  ['Push-ups',3,'12 reps','Steady tempo, full lockout.'],
  ['Push-ups',3,'15 reps','Rest 60–90 sec between sets.'],
  ['Push-ups',3,'20 reps','Strong, controlled reps — quality over speed.']]},
 pullup:{name:'Pull-up',focus:'upper',levels:[
  ['Scapular pulls (hanging shrugs)',3,'8 reps','Hang from the bar, pull shoulders down and back without bending elbows.'],
  ['Inverted rows',3,'8 reps','Under a bar or rings; pull chest to the bar with a straight body.'],
  ['Inverted rows',3,'12 reps','Lower the bar or walk feet forward to make it harder.'],
  ['Negative pull-ups',3,'3 reps','Jump or step up, then lower for 3–5 seconds.'],
  ['Negative pull-ups',3,'5 reps','Slow 5-second lowers; full hang at the bottom.'],
  ['Band-assisted pull-ups',3,'5 reps','Use a band or the assisted pull-up machine.'],
  ['Pull-ups',3,'1 reps','Your first strict pull-ups. Chin over the bar.'],
  ['Pull-ups',3,'3 reps','Dead hang at the bottom; no kipping.'],
  ['Pull-ups',3,'5 reps','Rest 2 minutes between sets.'],
  ['Pull-ups',3,'8 reps','Strong, strict reps.']]},
 hang:{name:'Dead hang (grip)',focus:'upper',levels:[
  ['Supported hang (feet on a box)',3,'20 seconds','Take some weight through your feet; relax the shoulders gently.'],
  ['Dead hang',3,'15 seconds','Full grip, shoulders slightly engaged.'],
  ['Dead hang',3,'25 seconds','Breathe; keep a light shoulder engagement.'],
  ['Dead hang',3,'35 seconds','Use chalk if your grip slips.'],
  ['Dead hang',3,'45 seconds','Rest 90 sec between hangs.'],
  ['Dead hang',2,'60 seconds','One-minute hangs.'],
  ['Dead hang',2,'75 seconds','Stay calm and steady.'],
  ['Dead hang',2,'90 seconds','Great for grip and shoulders.'],
  ['Dead hang',1,'2 minutes','Two minutes on the bar.'],
  ['Dead hang',1,'3 minutes','Elite grip — three minutes.']]},
 dip:{name:'Dip',focus:'upper',levels:[
  ['Bench dips (knees bent)',3,'8 reps','Hands on a bench behind you, elbows pointing back.'],
  ['Bench dips (knees bent)',3,'12 reps','Lower until elbows reach about 90°.'],
  ['Bench dips (legs straight)',3,'10 reps','Heels on the floor, legs straight.'],
  ['Bench dips (legs straight)',3,'15 reps','Slow lowers; shoulders down.'],
  ['Dip support hold',3,'20 seconds','On parallel bars, arms straight, shoulders down.'],
  ['Negative dips',3,'3 reps','Lower for 3–5 seconds on parallel bars.'],
  ['Assisted dips',3,'6 reps','Band or assisted dip machine.'],
  ['Dips',3,'3 reps','Parallel bars, slight forward lean.'],
  ['Dips',3,'6 reps','Full range you can control without shoulder pain.'],
  ['Dips',3,'10 reps','Strong, controlled dips.']]},
 squat:{name:'Pistol squat',focus:'lower',levels:[
  ['Bodyweight squats',3,'15 reps','Feet shoulder width; sit back and down.'],
  ['Split squats',3,'10 reps','Each leg. Front knee tracks over toes.'],
  ['Step-ups',3,'10 reps','Each leg, on a knee-height box.'],
  ['Bulgarian split squats',3,'8 reps','Each leg; rear foot on a bench.'],
  ['Box single-leg squats (high box)',3,'5 reps','Each leg. Sit to a high box on one leg and stand.'],
  ['Box single-leg squats (low box)',3,'5 reps','Each leg. Lower the box as you get stronger.'],
  ['Assisted pistol squats',3,'5 reps','Each leg. Hold a post or TRX for balance.'],
  ['Pistol squats',3,'2 reps','Each leg. Arms forward for balance.'],
  ['Pistol squats',3,'4 reps','Each leg; slow and controlled.'],
  ['Pistol squats',3,'6 reps','Each leg — impressive!']]}
};
const owner=()=>window.cloudRecordOwner?.()||'browser';
const getLevel=t=>{try{return Math.min(9,Math.max(0,Number(localStorage.getItem('stride-prog-'+t+'-'+owner()))||0));}catch{return 0;}};
const setLevel=(t,l)=>{try{localStorage.setItem('stride-prog-'+t+'-'+owner(),String(l));}catch{}};
const fold=node('details',undefined,'card');fold.id='progressionChoices';fold.append(node('summary','Bodyweight skills · plank, push-ups, pull-ups & more'));
const body=node('div');body.id='progressionBody';fold.append(body);
const anchor=$('coreChoices')||$('trainingPlanner');if(anchor)anchor.after(fold);
function draw(){body.replaceChildren(node('p','Pick a skill and build up step by step. Finish every set at a level with good form, then move up.','muted'));for(const [key,t] of Object.entries(TRACKS)){const lvl=getLevel(key),[ex,sets,reps,cue]=t.levels[lvl];const card=node('div',undefined,'prog-track');card.append(node('h3',t.name+' · Level '+(lvl+1)+' of 10'));const bar=node('div',undefined,'prog-bar');const fill=node('span');fill.style.width=((lvl+1)*10)+'%';bar.append(fill);card.append(bar,node('p',ex+' · '+sets+' × '+reps),node('p',cue,'muted'));const row=node('div',undefined,'watch-row');const go=node('button','Start level '+(lvl+1));go.type='button';go.onclick=()=>start(key);row.append(go);if(lvl>0){const down=node('button','Easier level','secondary');down.type='button';down.onclick=()=>{setLevel(key,lvl-1);draw();};row.append(down);}if(lvl<9){const up=node('button','Skip ahead','secondary');up.type='button';up.onclick=()=>{setLevel(key,lvl+1);draw();};row.append(up);}card.append(row);body.append(card);}}
function start(key){const T=window.strideSessionTracker;if(!T)return;if(T.isActive()){window.show?.('train');document.getElementById('sessionTracker')?.scrollIntoView({behavior:'smooth'});return;}const t=TRACKS[key],lvl=getLevel(key),[ex,sets,reps,cue]=t.levels[lvl];T.start({title:t.name+' progression · Level '+(lvl+1),minutes:10,exercises:[{name:ex,sets,reps,load:'Bodyweight',cue}]},{focus:t.focus,progression:key,level:lvl},'Progression');}
// After-session check
const dialog=node('dialog');dialog.id='progressCheck';document.body.append(dialog);
const OPTIONS={pullup:[['fine','Feels fine'],['muscle','Back or arms a bit sore or tired'],['joint','Elbows or shoulders hurt'],['sharp','Sharp or lasting pain']],hang:[['fine','Feels fine'],['muscle','Forearms or grip tired'],['joint','Shoulders or elbows hurt'],['sharp','Sharp or lasting pain']],dip:[['fine','Feels fine'],['muscle','Chest or triceps a bit sore'],['joint','Front of the shoulders hurt'],['sharp','Sharp or lasting pain']],squat:[['fine','Feels fine'],['muscle','Legs or glutes a bit sore'],['joint','Knees hurt'],['sharp','Sharp or lasting pain']],pushup:[['fine','Feels fine'],['muscle','Chest, arms or core a bit sore or tired'],['joint','Wrists, elbows or shoulders hurt'],['sharp','Sharp or lasting pain']],plank:[['fine','Feels fine'],['muscle','Core or shoulders a bit sore or tired'],['joint','Lower back ached during the hold'],['sharp','Sharp or lasting pain']]};
function advice(track,answer,complete,lvl){if(answer==='sharp')return ['Stop this progression for now. Rest, and get pain that is sharp, lasting or getting worse checked by a doctor or physiotherapist.',0];if(answer==='joint'){const tips={pullup:'Stay at this level. Pull your shoulders down before bending the elbows, avoid swinging, and use slower lowers. Drop a level if your elbows still hurt.',hang:'Hang with shoulders slightly engaged (not fully relaxed), use shorter holds, and stay at this level.',dip:'Shoulder pain in dips usually means going too deep. Stop at about 90° elbow bend, keep shoulders down, and stay at this level or easier.',squat:'Keep the knee tracking over your toes, sit back more, and use a higher box. Stay at this level or easier.'};if(tips[track])return [tips[track],lvl>0?-1:0];return [track==='pushup'?'That usually means form or load. Stay at this level and try: hands just wider than shoulders, fingers spread, elbows angled about 45° (not flared), and slow 2-second lowers. Use an easier level if it still hurts.':'Lower-back ache usually means the hips are sagging. Squeeze your glutes, tuck the tailbone slightly, and try shorter holds or the easier level.',lvl>0?-1:0];}if(!complete)return ['Good effort. Repeat this level until you can complete every set with good form.',0];if(answer==='muscle')return ['Mild muscle soreness is normal and means you worked. Give it a day or two, then repeat or move up.',lvl<9?1:0];return [lvl<9?'Great work — every set done with good form. You’re ready for the next level.':'You’ve completed the top level. Keep it up!',lvl<9?1:0];}
function check(){const w=(db.workouts||[]).filter(x=>x.session?.source==='Progression'&&!x.session.soreness).sort((a,b)=>String(b.session.finishedAt||'').localeCompare(String(a.session.finishedAt||'')))[0];if(!w||dialog.open)return;if(Date.now()-new Date(w.session.finishedAt||0).getTime()>6*3600e3)return;const key=Object.keys(TRACKS).find(k=>w.session.title.startsWith(TRACKS[k].name))||'plank',e=w.session.exercises[0],complete=e&&e.sets.length&&e.sets.every(s=>s.done),lvl=Number((w.session.title.match(/Level (\d+)/)||[])[1]||1)-1;dialog.replaceChildren(node('h3','How do you feel after that?'),node('p','A quick check so the next level fits you.','muted'));const out=node('p');OPTIONS[key].forEach(([v,label])=>{const b=node('button',label,'secondary');b.type='button';b.style.cssText='display:block;width:100%;margin:6px 0';b.onclick=()=>{const [msg,step]=advice(key,v,complete,lvl);w.session.soreness=v;save();out.textContent=msg;dialog.querySelectorAll('button').forEach(x=>x.hidden=true);if(step){const cur=getLevel(key);setLevel(key,Math.min(9,Math.max(0,cur+step)));}const done=node('button','OK');done.type='button';done.onclick=()=>{dialog.close();draw();};dialog.append(done);};dialog.append(b);});dialog.append(out);dialog.showModal();}
// Awards
function secs(s){const v=Number(s.reps);if(!(v>0))return 0;return s.unit==='minutes'?v*60:s.unit==='seconds'?v:0;}
function bests(){let plank=0,push=0,pull=0,dip=0,hang=0,pistol=0;for(const w of db.workouts||[]){for(const e of w.session?.exercises||[]){for(const s of e.sets||[]){if(!s.done)continue;if(/plank/i.test(e.name)&&!/knee|side/i.test(e.name))plank=Math.max(plank,secs(s));if(/push.?up/i.test(e.name)&&!/wall|incline|knee/i.test(e.name)&&(s.unit==='reps'||!s.unit))push=Math.max(push,Number(s.reps)||0);if(/^pull.?ups?$|\bpull.?ups?\b/i.test(e.name)&&!/negative|assist|band|scap/i.test(e.name))pull=Math.max(pull,Number(s.reps)||0);if(/^dips?$/i.test(e.name.trim()))dip=Math.max(dip,Number(s.reps)||0);if(/dead hang/i.test(e.name))hang=Math.max(hang,secs(s));if(/^pistol squats?$/i.test(e.name.trim()))pistol=Math.max(pistol,Number(s.reps)||0);}}}return {plank,push,pull,dip,hang,pistol};}
function awards(){const box=$('achievementCards');if(!box)return;box.querySelectorAll('.prog-award').forEach(n=>n.remove());const {plank,push,pull,dip,hang,pistol}=bests();const list=[];for(let m=1;m<=10;m++)list.push([m+'-minute plank',plank,m*60,'sec best hold',m===1||m===2||m===3||m===5||m===7||m===10]);[1,5,10,15,20,25,30,40,50].forEach(n=>list.push([n===1?'First full push-up':n+' push-ups in a row',push,n,'reps best set']));[1,3,5,10,15,20].forEach(n=>list.push([n===1?'First pull-up':n+' pull-ups in a row',pull,n,'reps best set']));[1,5,10,20].forEach(n=>list.push([n===1?'First dip':n+' dips in a row',dip,n,'reps best set']));[30,60,120,180].forEach(n=>list.push([(n<60?n+'-second':n/60+'-minute')+' dead hang',hang,n,'sec best hang']));[1,5].forEach(n=>list.push([n===1?'First pistol squat':n+' pistol squats in a row',pistol,n,'reps best set']));let earned=0;for(const [name,value,goal,unit] of list){const ok=value>=goal;if(ok)earned++;const card=node('div',undefined,'card badge prog-award'+(ok?' earned':''));card.append(node('h3',(ok?'✦ ':'○ ')+name),node('p',ok?'Unlocked':Math.round(value)+' / '+goal+' '+unit));const pr=document.createElement('progress');pr.max=goal;pr.value=Math.min(value,goal);card.append(pr);box.append(card);}const sum=$('achievementSummary');if(sum){const m=sum.textContent.match(/(\d+) of (\d+)/);if(m)sum.textContent=(Number(m[1])+earned)+' of '+(Number(m[2])+list.length)+' milestones unlocked';}}
const style=node('style');style.textContent='.prog-track{border:1px solid var(--soft);border-radius:14px;padding:14px;margin:10px 0}.prog-track h3{margin:0 0 8px}.prog-bar{height:8px;background:var(--soft);border-radius:9px;overflow:hidden;margin-bottom:10px}.prog-bar span{display:block;height:100%;background:var(--accent)}#progressCheck{max-width:min(420px,calc(100vw - 32px));border-radius:16px}';document.head.append(style);
const prev=render;render=function(){prev();awards();setTimeout(check,300);};draw();awards();
window.addEventListener('stride-account-change',draw);
})();
