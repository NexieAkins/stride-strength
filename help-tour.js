/* Onboarding help: first-run tour, "How to use" entry in the account menu, one-time tips. Additive only. */
(function(){
'use strict';
var TOUR_KEY='stride-tour-v1-done';
function lsGet(k){try{return localStorage.getItem(k);}catch(e){return null;}}
function lsSet(k,v){try{localStorage.setItem(k,v);}catch(e){}}
var CARDS=[
 ['🏠','Home','Your day at a glance: today’s workout, calories left, water and your week’s rings.'],
 ['🏋️','Train','Plan a workout in a minute, start it, and tap sets as you go. Track runs and walks too — outdoors or treadmill.'],
 ['🍽️','Meals','Log food by photo, barcode, typing or speaking. Kitchen and Menus suggest meals from what you have.'],
 ['📈','Progress','See your history, weight, best lifts, achievements and private progress photos.'],
 ['👤','Your menu','Tap the person icon for preferences, text size & display, your account and this guide anytime.']
];
var tourOpen=false,dlg=null,idx=0,lastFocus=null;
var reduce=function(){try{return window.matchMedia('(prefers-reduced-motion: reduce)').matches;}catch(e){return false;}};

var st=document.createElement('style');
st.textContent='#helpTour.v6-sheet{width:100vw;max-width:100vw;height:100dvh;max-height:100dvh;border:0;border-radius:0;margin:0;padding:0;box-sizing:border-box;overflow:hidden;touch-action:pan-y}'
+'#helpTour .ht-wrap{display:flex;flex-direction:column;height:100%;padding:calc(14px + env(safe-area-inset-top,0px)) 22px calc(18px + env(safe-area-inset-bottom,0px));box-sizing:border-box;max-width:560px;margin:0 auto}'
+'#helpTour .ht-top{display:flex;justify-content:flex-end;min-height:40px}'
+'#helpTour .ht-skip{width:auto!important;margin:0!important;padding:8px 14px!important;background:transparent!important;color:var(--muted)!important;border:0!important;font-size:15px}'
+'#helpTour .ht-stage{flex:1;overflow:hidden;position:relative}'
+'#helpTour .ht-track{display:flex;height:100%;will-change:transform}'
+'#helpTour .ht-track.anim{transition:transform .28s ease}'
+'#helpTour .ht-card{flex:0 0 100%;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:0 8px;box-sizing:border-box}'
+'#helpTour .ht-emo{font-size:96px;line-height:1;width:176px;height:176px;border-radius:50%;display:grid;place-items:center;background:var(--card);border:1px solid var(--soft);margin-bottom:28px}'
+'#helpTour h2{font-size:28px;margin:0 0 10px}#helpTour .ht-card p{font-size:17px;line-height:1.5;color:var(--muted);margin:0;max-width:34ch}'
+'#helpTour .ht-dots{display:flex;justify-content:center;gap:8px;margin:10px 0 14px}'
+'#helpTour .ht-dot{width:9px;height:9px;border-radius:50%;background:var(--soft);transition:all .2s}#helpTour .ht-dot.on{background:var(--accent);width:24px;border-radius:6px}'
+'#helpTour .ht-nav{display:flex;gap:10px}#helpTour .ht-nav button{margin:0!important;flex:1}#helpTour .ht-back[disabled]{visibility:hidden}'
+'@media (prefers-reduced-motion:reduce){#helpTour .ht-track.anim,#helpTour .ht-dot{transition:none}}'
+'#helpGuide button{width:100%}'
+'#helpTip{position:fixed;left:12px;right:12px;bottom:calc(86px + env(safe-area-inset-bottom,0px));z-index:79;max-width:520px;margin:0 auto;display:flex;align-items:center;gap:10px;background:var(--card);color:var(--fg);border:1px solid var(--accent);border-radius:14px;padding:10px 10px 10px 14px;font-size:14px;line-height:1.35;box-shadow:0 6px 24px rgba(0,0,0,.35)}'
+'#helpTip span{flex:1}#helpTip button{width:34px!important;height:34px;margin:0!important;padding:0!important;border-radius:50%!important;background:transparent!important;color:var(--fg)!important;border:1px solid var(--soft)!important}';
document.head.append(st);

function el(t,c,x){var n=document.createElement(t);if(c)n.className=c;if(x!==undefined)n.textContent=x;return n;}

function finishTour(){lsSet(TOUR_KEY,'1');closeTour();}
function closeTour(){tourOpen=false;if(dlg){try{dlg.close();}catch(e){}dlg.remove();dlg=null;}if(lastFocus&&lastFocus.focus){try{lastFocus.focus();}catch(e){}}}
function go(n,animate){
  idx=Math.max(0,Math.min(CARDS.length-1,n));
  var tr=dlg.querySelector('.ht-track');
  tr.classList.toggle('anim',!!animate&&!reduce());
  tr.style.transform='translateX(-'+(idx*100)+'%)';
  dlg.querySelectorAll('.ht-dot').forEach(function(d,i){d.classList.toggle('on',i===idx);});
  dlg.querySelectorAll('.ht-card').forEach(function(c,i){c.setAttribute('aria-hidden',i===idx?'false':'true');});
  var back=dlg.querySelector('.ht-back'),next=dlg.querySelector('.ht-next'),skip=dlg.querySelector('.ht-skip');
  back.disabled=idx===0;next.textContent=idx===CARDS.length-1?'Let’s go':'Next';skip.style.visibility=idx===CARDS.length-1?'hidden':'visible';
  dlg.querySelector('.ht-live').textContent='Step '+(idx+1)+' of '+CARDS.length+': '+CARDS[idx][1];
}
function openTour(){
  if(tourOpen)return;tourOpen=true;idx=0;lastFocus=document.activeElement;
  hideTip();
  dlg=el('dialog','v6-sheet');dlg.id='helpTour';dlg.setAttribute('aria-label','Quick tour of Stride & Strength');
  var wrap=el('div','ht-wrap'),top=el('div','ht-top'),skip=el('button','v6-ghost ht-skip','Skip');skip.type='button';skip.setAttribute('aria-label','Skip the tour');top.append(skip);
  var stage=el('div','ht-stage'),track=el('div','ht-track');
  CARDS.forEach(function(c,i){var card=el('div','ht-card');card.setAttribute('role','group');card.setAttribute('aria-label',(i+1)+' of '+CARDS.length);var e=el('div','ht-emo',c[0]);e.setAttribute('aria-hidden','true');card.append(e,el('h2','',c[1]),el('p','',c[2]));track.append(card);});
  stage.append(track);
  var dots=el('div','ht-dots');dots.setAttribute('aria-hidden','true');CARDS.forEach(function(){dots.append(el('span','ht-dot'));});
  var nav=el('div','ht-nav'),back=el('button','v6-ghost ht-back','Back'),next=el('button','v6-start ht-next','Next');back.type=next.type='button';back.setAttribute('aria-label','Previous step');next.setAttribute('aria-label','Next step');nav.append(back,next);
  var live=el('div','ht-live');live.setAttribute('aria-live','polite');live.style.cssText='position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)';
  wrap.append(top,stage,dots,nav,live);dlg.append(wrap);document.body.append(dlg);
  skip.onclick=finishTour;back.onclick=function(){go(idx-1,true);};
  next.onclick=function(){if(idx===CARDS.length-1)finishTour();else go(idx+1,true);};
  dlg.addEventListener('cancel',function(e){e.preventDefault();finishTour();});
  dlg.addEventListener('keydown',function(e){
    if(e.key==='ArrowRight'){e.preventDefault();go(idx+1,true);}
    else if(e.key==='ArrowLeft'){e.preventDefault();go(idx-1,true);}
    else if(e.key==='Tab'){var f=[].filter.call(dlg.querySelectorAll('button'),function(b){return !b.disabled&&b.style.visibility!=='hidden'&&getComputedStyle(b).visibility!=='hidden';});if(!f.length)return;var a=f[0],z=f[f.length-1];
      if(e.shiftKey&&document.activeElement===a){e.preventDefault();z.focus();}else if(!e.shiftKey&&document.activeElement===z){e.preventDefault();a.focus();}}
  });
  // swipe via pointer events
  var sx=null,sy=0,dx=0,dragging=false;
  stage.addEventListener('pointerdown',function(e){sx=e.clientX;sy=e.clientY;dx=0;dragging=false;});
  stage.addEventListener('pointermove',function(e){if(sx===null)return;var mx=e.clientX-sx,my=e.clientY-sy;if(!dragging){if(Math.abs(mx)>10&&Math.abs(mx)>Math.abs(my))dragging=true;else return;}
    dx=mx;var edge=(idx===0&&dx>0)||(idx===CARDS.length-1&&dx<0);track.classList.remove('anim');track.style.transform='translateX(calc(-'+(idx*100)+'% + '+(edge?dx/4:dx)+'px))';});
  function endSwipe(){if(sx===null)return;var d=dx,was=dragging;sx=null;dragging=false;dx=0;if(was&&Math.abs(d)>50)go(idx+(d<0?1:-1),true);else go(idx,true);}
  stage.addEventListener('pointerup',endSwipe);stage.addEventListener('pointercancel',endSwipe);
  dlg.showModal();go(0,false);next.focus();
}
window.strideTour={open:openTour,isOpen:function(){return tourOpen;}};

/* ---- Help sheet (menu entry) ---- */
function openHelp(){
  var old=document.getElementById('helpGuide');if(old){old.close();old.remove();}
  var d=el('dialog','v6-sheet');d.id='helpGuide';d.setAttribute('aria-label','How to use Stride & Strength');
  var head=el('div','v6-sheethead'),x=el('button','v6-sheetx','✕');x.type='button';x.setAttribute('aria-label','Close');x.onclick=function(){d.close();d.remove();};head.append(el('h2','','How to use'),x);
  var replay=el('button','v6-start','▶ Replay the quick tour'),guide=el('button','v6-ghost','📖 Open the full guide');replay.type=guide.type='button';
  replay.onclick=function(){d.close();d.remove();setTimeout(openTour,60);};
  guide.onclick=function(){d.close();d.remove();location.href='how-to.html';};
  d.append(head,el('p','v6-sub','A 30-second tour, or the full step-by-step guide.'),replay,guide);
  d.addEventListener('cancel',function(){setTimeout(function(){d.remove();},0);});
  document.body.append(d);d.showModal();
}
function addMenuEntry(){
  var p=document.getElementById('acctPanel');if(!p||p.querySelector('.acct-help')||!p.children.length)return;
  var b=document.createElement('button');b.type='button';b.className='acct-help';b.textContent='❓  How to use Stride & Strength';
  b.onclick=function(e){e.stopPropagation();p.hidden=true;var ab=document.getElementById('acctBtn');if(ab)ab.setAttribute('aria-expanded','false');openHelp();};
  var lo=p.querySelector('.acct-logout');if(lo)p.insertBefore(b,lo);else p.append(b);
}
(function watch(n){var p=document.getElementById('acctPanel');if(!p){if(n<80)setTimeout(function(){watch(n+1);},250);return;}
  new MutationObserver(addMenuEntry).observe(p,{childList:true});addMenuEntry();})(0);

/* ---- Tips ---- */
var tipEl=null,tipTimer=0;
function hideTip(){clearTimeout(tipTimer);if(tipEl){tipEl.remove();tipEl=null;}}
function showTip(name,text){
  lsSet('stride-tip-'+name,'1');hideTip();
  tipEl=el('div');tipEl.id='helpTip';tipEl.setAttribute('role','status');
  var x=el('button','','✕');x.type='button';x.setAttribute('aria-label','Dismiss tip');x.onclick=hideTip;
  tipEl.append(el('span','',text),x);document.body.append(tipEl);tipTimer=setTimeout(hideTip,10000);
}
function blocked(){return tourOpen||document.body.classList.contains('welcome')||!!document.querySelector('dialog[open]');}
var curScreen=null,tipShownThisVisit=false;
var TIPS={meals:['meals','Tip: tap ＋1 serving if you had another helping.'],progress:['progress','Tip: search your history with the 🔍 box.']};
function screenNow(){var s=document.querySelector('main>section:not(.hidden)');return s?s.id:null;}
function tipTick(){
  var s=screenNow();
  if(s!==curScreen){curScreen=s;tipShownThisVisit=false;hideTip();}
  if(tipShownThisVisit||blocked())return;
  var t=null;
  if(s==='train'){var a=false;try{a=!!(window.strideSessionTracker&&window.strideSessionTracker.isActive&&window.strideSessionTracker.isActive());}catch(e){}if(a)t=['train','Tip: tap a set’s circle when done — the rest timer starts automatically.'];}
  else if(TIPS[s])t=TIPS[s];
  if(!t||lsGet('stride-tip-'+t[0]))return;
  tipShownThisVisit=true;showTip(t[0],t[1]);
}
setInterval(tipTick,800);

/* ---- First run ---- */
function firstRunTick(){
  if(lsGet(TOUR_KEY)){return;}
  if(tourOpen)return;
  if(!window.strideToast&&document.readyState!=='complete')return;
  if(document.body.classList.contains('welcome')||document.querySelector('dialog[open]'))return;
  if(!document.querySelector('main>section:not(.hidden)'))return;
  openTour();
}
if(!lsGet(TOUR_KEY)){var fr=setInterval(function(){if(lsGet(TOUR_KEY)){clearInterval(fr);return;}firstRunTick();if(tourOpen)clearInterval(fr);},1200);}
})();
