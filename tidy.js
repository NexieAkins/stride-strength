/* Keep screens tidy: secondary sections start collapsed and fold away again once you're done. */
(()=>{
'use strict';
const $=id=>document.getElementById(id);
const shut=el=>{const d=el&&(el.tagName==='DETAILS'?el:el.closest('details'));if(d)d.open=false;};
const later=(fn,ms=350)=>setTimeout(fn,ms);
// Meals: fold the meal form after a successful save; fold the AI estimate once it's been used.
$('mealForm')?.addEventListener('submit',()=>later(()=>{if(!$('food')?.value){shut($('mealForm'));shut($('aiMealPanel'));$('aiMealResults')?.classList.add('hidden');}}));
$('aiUseEstimate')?.addEventListener('click',()=>later(()=>shut($('aiMealPanel'))));
$('menuAddDiary')?.addEventListener('click',()=>later(()=>{if(/added/i.test($('menuStatus')?.textContent||''))shut($('menuAddDiary'));},500));
// Weekly weigh-in folds after saving.
$('weightForm')?.addEventListener('submit',()=>later(()=>{const v=$('weightValue');if(!v||!v.value)shut($('weightForm'));}));
// Train: once a workout starts, fold the planners so the session is front and centre.
window.addEventListener('stride-session-start',()=>['plannerFold','startingWeights','coreChoices','progressionChoices'].forEach(id=>{const d=$(id);if(d)d.open=false;}));
// Run/walk tracker folds after Finish or Discard.
['liveRunFinish','liveRunDiscard'].forEach(id=>$(id)?.addEventListener('click',()=>later(()=>{if(!window.strideLiveRun?.isActive?.()||id==='liveRunFinish'){const d=$('liveRunTracker');if(d)d.open=false;}})));
// My Kitchen: put the long ingredient form behind a tap; fold it again when a plan is ready.
const kf=$('kitchenForm');
if(kf&&!kf.closest('details#kitchenFold')){const d=document.createElement('details');d.id='kitchenFold';const s=document.createElement('summary');s.textContent='Plan meals from what I have';s.style.cssText='font-weight:700;cursor:pointer';kf.before(d);d.append(s,kf);const res=$('kitchenResult');if(res)new MutationObserver(()=>{if(res.children.length)d.open=false;}).observe(res,{childList:true});}
// Home: fold preferences once they've been chosen.
$('mealStyle')?.addEventListener('change',()=>later(()=>{if($('mealStyle').value)shut($('homePreferences'));},800));
// Home: fold the skin picker (rarely changed).
{const sk=document.querySelector('.v5-skins');const card=sk&&sk.closest('.card');if(card&&card.tagName!=='DETAILS'){const h=card.querySelector('h2,h3');const d=document.createElement('details');d.className=card.className;d.id='skinFold';const sm=document.createElement('summary');sm.textContent=(h?.textContent||'Choose your skin');sm.style.cssText='font-weight:700;cursor:pointer';if(h)h.remove();d.append(sm,...card.childNodes);card.replaceWith(d);}}
})();
