/* Voice meal logging: mic button on the "describe your meal" box. Uses speech recognition where the
   phone/browser supports it; otherwise opens the keyboard and points to its dictation mic. */
(function(){
const $=id=>document.getElementById(id);
const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
let rec=null,on=false;
function hint(){const d=$('aiMealDescription');if(!d)return;window.__v6mealMode&&$('aiMealPanel')?.dataset.mode!=='type'&&window.__v6mealMode('type');d.focus();d.scrollIntoView({block:'center'});window.strideToast?.('🎤 Tap the mic on your keyboard (bottom row) and say what you ate');}
function stop(){on=false;try{rec?.stop();}catch{}$('mic6')?.classList.remove('live');}
function start(){const d=$('aiMealDescription');if(!d)return;if(window.__v6mealMode&&$('aiMealPanel')?.dataset.mode!=='type')window.__v6mealMode('type');
  if(!SR||window.Capacitor?.isNativePlatform?.())return hint();if(on)return stop();
  try{rec=new SR();rec.lang=navigator.language||'en-US';rec.interimResults=true;rec.continuous=false;}catch{return hint();}
  const base=d.value.trim();let got=false;
  rec.onresult=e=>{got=true;const t=[...e.results].map(r=>r[0].transcript).join(' ');d.value=(base?base+', ':'')+t;d.dispatchEvent(new Event('input',{bubbles:true}));};
  rec.onerror=e=>{stop();if(e.error==='not-allowed'||e.error==='service-not-allowed')hint();else if(e.error==='no-speech')window.strideToast?.('Didn’t catch that — tap the mic and try again');};
  let heard=false;rec.onaudiostart=()=>{heard=true;};setTimeout(()=>{if(on&&!heard){stop();hint();}},2500);rec.onend=()=>{const was=on;stop();if(was&&got)window.strideToast?.('✓ Got it — check it, then tap Estimate');else if(was&&!got)hint();};
  try{rec.start();on=true;$('mic6')?.classList.add('live');}catch{hint();}}
function place(){const q0=$('mealQuick');const tb0=q0&&[...q0.querySelectorAll('button span')].find(x=>/^type it$/i.test(x.textContent));if(tb0)tb0.textContent='Type or say';const d=$('aiMealDescription');if(!d||$('mic6'))return;
  const b=document.createElement('button');b.type='button';b.id='mic6';b.setAttribute('aria-label','Say what you ate');b.innerHTML='<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg><span>Speak</span>';b.onclick=start;d.after(b);
  const q=$('mealQuick');const tb=q&&[...q.querySelectorAll('button')].find(x=>/type it/i.test(x.textContent));if(tb){const s=tb.querySelector('span');if(s)s.textContent='Type or say';}
  if(!d.placeholder||/describe/i.test(d.placeholder))d.placeholder='Type or say what you ate, e.g. “jollof rice with chicken and a coke”';}
const st=document.createElement('style');st.textContent='#mic6{display:inline-flex!important;align-items:center;gap:6px;width:auto!important;margin:8px 0!important;padding:8px 14px!important;border-radius:999px!important;background:none!important;border:1.5px solid var(--accent)!important;color:var(--accent)!important;font-weight:700}#aiMealPanel:not([data-mode=type]):not(.v6-hasphoto) #mic6{display:none!important}#mic6.live{background:var(--accent)!important;color:var(--on-accent)!important;animation:mic6 1.2s infinite}@keyframes mic6{50%{opacity:.6}}';document.head.append(st);
new MutationObserver(()=>place()).observe(document.body,{childList:true,subtree:true});place();
})();
