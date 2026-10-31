/* Floating workout bar (flag: floatingBar) and Log workout form tidy-up (flag: logForm).
   Both are CSS-first: #resume6 and #workoutControls become one consistent compact bar, and the Log form
   is re-laid-out without touching any field id or the submit handler. */
(()=>{
'use strict';
const F=window.STRIDE_FLAGS||{};
const $=id=>document.getElementById(id);
const css=[];

if(F.floatingBar){
document.body.classList.add('fb8');
css.push(`
/* one compact bar: status dot, title (ellipsis) + elapsed time, one clear button */
body.fb8 #resume6{left:12px;right:12px;bottom:calc(92px + env(safe-area-inset-bottom,0px));max-width:520px;box-sizing:border-box;height:56px;padding:6px 8px 6px 14px!important;gap:12px;border-radius:16px!important}
body.fb8 #resume6 .r6-t b{font-size:15px;line-height:1.25}
body.fb8 #resume6 .r6-go{background:var(--accent);color:var(--on-accent);border-radius:999px;padding:9px 16px;font-size:14px;line-height:1;white-space:nowrap}
body.fb8 .r6-dot{box-shadow:0 0 0 3px color-mix(in srgb,#3fc495 25%,transparent)}
body.fb8 .r6-dot.p{box-shadow:0 0 0 3px color-mix(in srgb,#f0b45a 25%,transparent)}
body.fb8.fb8-vis{padding-bottom:calc(120px + var(--fb8-h,56px) + 20px)!important}
body.fb8 #workoutControls{display:grid;grid-template-columns:auto minmax(0,1fr) auto;grid-template-rows:auto auto;column-gap:12px;row-gap:0;align-items:center;box-sizing:border-box;min-height:56px;padding:8px 8px 8px 14px!important;margin:8px 0 12px!important;border-radius:16px!important;border:1.5px solid var(--accent)}
body.fb8 #workoutControls[hidden]{display:none!important}
body.fb8 #workoutControls::before{content:"";grid-column:1;grid-row:1/3;width:10px;height:10px;border-radius:50%;background:#3fc495;box-shadow:0 0 0 3px color-mix(in srgb,#3fc495 25%,transparent)}
body.fb8 #workoutControls[data-st=paused]::before{background:#f0b45a;box-shadow:0 0 0 3px color-mix(in srgb,#f0b45a 25%,transparent)}
body.fb8 #workoutControls strong{grid-column:2;grid-row:1;font-size:15px;line-height:1.25;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0}
body.fb8 #workoutControls p{grid-column:2;grid-row:2;margin:0!important;font-size:12px;color:var(--muted);font-variant-numeric:tabular-nums}
body.fb8 #workoutControls button{grid-column:3;grid-row:1/3;width:auto!important;margin:0!important;padding:10px 16px!important;min-height:0!important;border-radius:999px!important;font-size:14px;white-space:nowrap}
body.fb8 #workoutControls .pill6{display:none!important}
`);
const T=()=>window.strideSessionTracker;
function tick(){
  const b=$('resume6'),c=$('workoutControls');
  try{const st=T()?.status?.();if(c)c.dataset.st=st?(st.paused?'paused':'running'):'';}catch(e){}
  const vis=!!b&&!b.hidden&&b.getBoundingClientRect().height>0;
  document.body.classList.toggle('fb8-vis',vis);
  if(vis)document.body.style.setProperty('--fb8-h',Math.round(b.getBoundingClientRect().height)+'px');
}
setInterval(tick,500);
window.addEventListener('stride-session-update',tick);window.addEventListener('stride-session-end',tick);
}

if(F.logForm){
document.body.classList.add('lf8');
css.push(`
/* Log workout form: heading row with the date, duration on one full row, distance/pace row, full-width Save */
body.lf8 #workoutForm{display:grid;grid-template-columns:minmax(0,1fr) auto;column-gap:10px;align-items:center}
body.lf8 #workoutForm>*{grid-column:1/-1;min-width:0}
body.lf8 #workoutForm>.v6-lbl{grid-column:1;grid-row:1;margin:0}
body.lf8 #workoutForm>.v6-daterow{grid-column:2;grid-row:1;width:auto;margin:0!important;padding:8px 12px!important;min-height:0}
body.lf8 #workoutForm>#logMultiHint{margin:6px 0 8px!important}
body.lf8 #workoutForm .v6-mgrid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:10px 0 4px}
body.lf8 #workoutForm .v6-mgrid>.v6-mcell{order:3}
body.lf8 #workoutForm .v6-mgrid>.v6-mcell:has(.duration-parts){grid-column:1/-1;order:1}
body.lf8 #workoutForm .v6-mgrid>.v6-mcell.v6-distcell{order:2}
body.lf8 #workoutForm .v6-mgrid>.v6-mcell:has(#logKcal){grid-column:1/-1;order:4}
body.lf8 #workoutForm .duration-parts{margin:0;gap:8px}
body.lf8 #workoutForm .duration-parts label{display:flex;align-items:center;gap:6px;font-size:0;margin:0}
body.lf8 #workoutForm .duration-parts label::after{font-size:13px;font-weight:700;color:var(--muted)}
body.lf8 #workoutForm .duration-parts label[for=durationHours]::after{content:"h"}
body.lf8 #workoutForm .duration-parts label[for=durationMinutes]::after{content:"m"}
body.lf8 #workoutForm .duration-parts label[for=durationSeconds]::after{content:"s"}
body.lf8 #workoutForm .duration-parts input{font-size:18px!important;text-align:center;font-variant-numeric:tabular-nums;min-height:46px;padding:6px 4px!important;flex:1;min-width:0}
body.lf8 #workoutForm .v6-feel{display:grid!important;grid-template-columns:84px repeat(3,minmax(0,1fr))!important;gap:6px;margin:6px 0!important;align-items:center}
body.lf8 #workoutForm .v6-feel>span:first-child{grid-column:1!important;display:block;font-size:12px;letter-spacing:.05em;text-transform:uppercase;color:var(--muted)}
body.lf8 #workoutForm .v6-feel button{min-height:38px!important;padding:6px 4px!important;font-size:14px!important;border-radius:999px!important;margin:0!important}
body.lf8 #workoutForm .v6-confirmrow{display:flex!important;flex-direction:column-reverse;gap:8px;margin-top:14px}
body.lf8 #workoutForm .v6-confirmrow .v6-start{width:100%!important;min-height:50px;font-size:16px;margin:0!important}
body.lf8 #workoutForm .v6-confirmrow .v6-ghost{width:100%!important;min-height:40px;margin:0!important;background:transparent!important;border:0!important;color:var(--muted)!important;font-size:14px}
`);
}
if(css.length){const s=document.createElement('style');s.textContent=css.join('\n');document.head.append(s);}
})();
