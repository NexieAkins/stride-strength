/* Success confirmations: after any Save / Log / Add / Copy action that actually saves, show a short toast. */
(function(){
let lastAct=null,lastToast=0;
const word=t=>{t=(t||'').trim().toLowerCase();
  if(/copy/.test(t))return null; // copy handled separately below
  if(/^(log|add .*log|log )|logged|log it|log meal|log workout/.test(t)||/^log\b/.test(t))return '✓ Logged';
  if(/^(add|\+)/.test(t))return '✓ Added';
  if(/save|update|done|finish/.test(t))return '✓ Saved';
  return null;};
document.addEventListener('click',e=>{const b=e.target.closest('button,[role=button],input[type=submit]');if(!b)return;const w=word(b.textContent||b.value||b.getAttribute('aria-label'));if(w)lastAct={w,at:Date.now()};},true);
document.addEventListener('submit',e=>{const b=e.submitter;const w=word(b?.textContent||'')||'✓ Saved';lastAct={w,at:Date.now()};},true);
const orig=window.toastHook;
const show=t=>{const now=Date.now();if(now-lastToast<1200)return;lastToast=now;window.strideToast?.(t);};
// Don't double up when a feature shows its own toast
(function wrapToast(n){if(!window.strideToast){if(n<40)setTimeout(()=>wrapToast(n+1),250);return;}const t0=window.strideToast;window.strideToast=m=>{lastToast=Date.now();lastAct=null;return t0(m);};})(0);
(function wrapSave(n){if(typeof window.save!=='function'){if(n<40)setTimeout(()=>wrapSave(n+1),250);return;}const s0=window.save;window.save=function(){const r=s0.apply(this,arguments);if(r!==false&&lastAct&&Date.now()-lastAct.at<1500){const w=lastAct.w;lastAct=null;setTimeout(()=>{if(Date.now()-lastToast>600)show(w);},350);}return r;};})(0);
// Copy: clipboard writes and the "Copy last set" button
if(navigator.clipboard?.writeText){const c0=navigator.clipboard.writeText.bind(navigator.clipboard);navigator.clipboard.writeText=x=>c0(x).then(r=>{show('✓ Copied');return r;});}
document.addEventListener('click',e=>{if(e.target.closest('.dup7'))setTimeout(()=>show('✓ Set copied'),200);},true);
})();
