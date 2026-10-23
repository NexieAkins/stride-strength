/* Make the app feel native: no text selection or callouts, no bounce or pinch-zoom, pressed states,
   tab transitions with remembered scroll, light haptics, and the disclaimer only on Home. */
(function(){
const native=!!window.Capacitor?.isNativePlatform?.();
document.documentElement.classList.add('nf6',native?'nf6-native':'nf6-web');
const vp=document.querySelector('meta[name=viewport]');if(vp)vp.content='width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover';
const st=document.createElement('style');st.textContent=`
html.nf6,html.nf6 body{overscroll-behavior:none;-webkit-tap-highlight-color:transparent}
html.nf6 body{-webkit-user-select:none;user-select:none;-webkit-touch-callout:none;touch-action:manipulation}
html.nf6 input,html.nf6 textarea,html.nf6 [contenteditable]{-webkit-user-select:text;user-select:text;-webkit-touch-callout:default}
html.nf6 img{-webkit-user-drag:none;-webkit-touch-callout:none}
html.nf6 button,html.nf6 .t6-mk,html.nf6 .t6-tile,html.nf6 summary,html.nf6 [role=button]{transition:transform .12s ease,filter .12s ease}
html.nf6 button:active,html.nf6 .t6-mk:active,html.nf6 .t6-tile:active,html.nf6 summary:active,html.nf6 [role=button]:active{transform:scale(.97);filter:brightness(.92)}
html.nf6 main>section.nf6-in{animation:nf6in .22s ease both}
@keyframes nf6in{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
@media (prefers-reduced-motion:reduce){html.nf6 main>section.nf6-in{animation:none}html.nf6 button:active{transform:none}}
html.nf6 footer{display:none}html.nf6 body.nf6-home footer{display:block}
html.nf6 dialog{animation:nf6up .22s ease both}@keyframes nf6up{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:none}}
html.nf6-native a[href^="http"]{-webkit-touch-callout:none}`;
document.head.append(st);
// light haptic on taps (Android vibrates; iOS uses the native plugin if present)
const tick=()=>{try{const H=window.Capacitor?.Plugins?.Haptics;if(H){H.impact({style:'LIGHT'});return;}navigator.vibrate?.(8);}catch{}};
document.addEventListener('click',e=>{if(e.target.closest('nav button,nav a,.v6-seg button,#mealQuick button,.v6-plus,input[type=checkbox]'))tick();},true);
// tab transitions + remembered scroll per tab
const pos={};let cur=null;
const watch=()=>{const vis=[...document.querySelectorAll('main>section')].find(s=>!s.classList.contains('hidden')&&!s.hidden&&s.offsetParent!==null);if(!vis||vis.id===cur)return;if(cur)pos[cur]=window.scrollY;cur=vis.id;document.body.classList.toggle('nf6-home',cur==='home');vis.classList.remove('nf6-in');void vis.offsetWidth;vis.classList.add('nf6-in');requestAnimationFrame(()=>window.scrollTo(0,pos[cur]||0));};
new MutationObserver(watch).observe(document.querySelector('main')||document.body,{attributes:true,subtree:true,attributeFilter:['class','hidden']});watch();
// no long-press context menu outside text fields
document.addEventListener('contextmenu',e=>{if(!e.target.closest('input,textarea,[contenteditable]'))e.preventDefault();});
// links to other sites open in the system browser in the app
if(native)document.addEventListener('click',e=>{const a=e.target.closest('a[href^="http"]');if(!a||a.host===location.host)return;e.preventDefault();try{window.Capacitor?.Plugins?.Browser?.open({url:a.href})||window.open(a.href,'_system');}catch{window.open(a.href,'_blank');}},true);
})();
