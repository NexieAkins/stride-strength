/* Scenes: soft illustrated backgrounds (pure SVG, tinted to the skin's accent) for the main cards. */
(function(){
const $=id=>document.getElementById(id);
const svg=b=>'url("data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 220" preserveAspectRatio="xMaxYMid slice">'+b+'</svg>')+'")';
const A='#8b6cff',B='#3fc495',C='#f0b45a',S='#ffd9b8',H='#3b2a24';
const run=svg(`<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${A}" stop-opacity=".0"/><stop offset="1" stop-color="${A}" stop-opacity=".35"/></linearGradient></defs>
<circle cx="330" cy="58" r="30" fill="${C}" opacity=".55"/>
<path d="M0 170 Q80 120 160 150 T320 135 T400 140 V220 H0Z" fill="${B}" opacity=".28"/>
<path d="M0 190 Q100 160 200 182 T400 172 V220 H0Z" fill="${B}" opacity=".45"/>
<path d="M150 205 C210 180 260 200 400 186" stroke="#fff" stroke-opacity=".35" stroke-width="5" fill="none" stroke-dasharray="2 12" stroke-linecap="round"/>
<g transform="translate(268 74)"><circle cx="22" cy="10" r="10" fill="${S}"/><path d="M12 4 Q22 -6 32 6" stroke="${H}" stroke-width="7" fill="none" stroke-linecap="round"/>
<path d="M20 22 L14 60" stroke="${A}" stroke-width="16" stroke-linecap="round"/>
<path d="M18 30 L-4 46 M18 30 L40 40 L52 26" stroke="${S}" stroke-width="7" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M14 60 L-6 84 L-22 82 M14 60 L34 80 L30 104" stroke="#2d3561" stroke-width="10" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M-28 80 h14 M24 106 h16" stroke="#fff" stroke-width="6" stroke-linecap="round"/></g>
<path d="M210 96 h30 M200 112 h26 M214 128 h22" stroke="#fff" stroke-opacity=".35" stroke-width="4" stroke-linecap="round"/>`);
const lift=svg(`<circle cx="320" cy="110" r="90" fill="${A}" opacity=".18"/>
<g transform="translate(270 40)"><circle cx="50" cy="16" r="12" fill="${S}"/><path d="M38 10 Q50 -4 62 10" stroke="${H}" stroke-width="8" fill="none" stroke-linecap="round"/>
<path d="M50 30 v52" stroke="${A}" stroke-width="22" stroke-linecap="round"/>
<path d="M44 40 L14 32 L10 6 M56 40 L86 32 L90 6" stroke="${S}" stroke-width="8" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M-10 6 H110" stroke="#cfd6ea" stroke-width="7" stroke-linecap="round"/><rect x="-22" y="-12" width="14" height="36" rx="4" fill="#2d3561"/><rect x="108" y="-12" width="14" height="36" rx="4" fill="#2d3561"/>
<path d="M44 82 L32 130 M56 82 L68 130" stroke="#2d3561" stroke-width="12" stroke-linecap="round"/></g>
<path d="M0 200 H400" stroke="${A}" stroke-opacity=".4" stroke-width="6"/>`);
const food=svg(`<circle cx="300" cy="120" r="88" fill="#fff" opacity=".9"/><circle cx="300" cy="120" r="70" fill="#f4efe6"/>
<path d="M300 120 L300 52 A68 68 0 0 1 362 146Z" fill="${C}"/><circle cx="318" cy="80" r="5" fill="#fff8"/><circle cx="338" cy="104" r="4" fill="#fff8"/>
<path d="M300 120 L362 146 A68 68 0 0 1 252 170Z" fill="${B}"/><circle cx="300" cy="160" r="9" fill="#2f8f4f"/><circle cx="278" cy="152" r="7" fill="#2f8f4f"/>
<path d="M300 120 L252 170 A68 68 0 0 1 300 52Z" fill="#c0703e"/><path d="M262 104 q12 -10 24 0" stroke="#8f4f2c" stroke-width="5" fill="none"/>
<circle cx="190" cy="168" r="34" fill="#e85d5d" opacity=".85"/><path d="M182 140 q8 -10 16 0" stroke="${B}" stroke-width="5" fill="none"/>
<circle cx="200" cy="64" r="22" fill="${C}" opacity=".7"/><path d="M386 30 v150 M374 30 v40 q12 14 24 0 v-40" stroke="#cfd6ea" stroke-width="5" fill="none" stroke-linecap="round"/>`);
const calm=svg(`<circle cx="320" cy="70" r="34" fill="${C}" opacity=".45"/>
<path d="M0 180 Q100 140 200 170 T400 160 V220 H0Z" fill="${B}" opacity=".35"/>
<g transform="translate(270 92)"><circle cx="34" cy="0" r="11" fill="${S}"/><path d="M24 -6 Q34 -18 44 -6" stroke="${H}" stroke-width="7" fill="none" stroke-linecap="round"/>
<path d="M34 12 v34" stroke="${A}" stroke-width="18" stroke-linecap="round"/>
<path d="M30 22 L6 38 L-4 30 M38 22 L62 38 L72 30" stroke="${S}" stroke-width="7" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M34 50 C10 52 0 64 -14 66 M34 50 C58 52 68 64 82 66" stroke="#2d3561" stroke-width="12" fill="none" stroke-linecap="round"/></g>
<path d="M200 60 q16 -10 32 0 M180 92 q12 -8 24 0" stroke="#fff" stroke-opacity=".4" stroke-width="4" fill="none" stroke-linecap="round"/>`);
const kitchen=svg(`<rect x="230" y="40" width="130" height="150" rx="16" fill="#cfd6ea" opacity=".25"/><path d="M230 100 H360" stroke="#cfd6ea" stroke-opacity=".5" stroke-width="4"/>
<circle cx="262" cy="74" r="14" fill="#e85d5d"/><circle cx="292" cy="78" r="11" fill="${C}"/><path d="M318 60 l12 26 l-24 0z" fill="${B}"/>
<ellipse cx="270" cy="150" rx="22" ry="16" fill="#f4efe6"/><rect x="300" y="128" width="40" height="40" rx="8" fill="${A}" opacity=".7"/>
<path d="M180 200 q20 -40 50 -30" stroke="${B}" stroke-width="6" fill="none" stroke-linecap="round"/><circle cx="178" cy="196" r="10" fill="${B}"/>`);
const U=id=>'url("https://images.unsplash.com/photo-'+id+'?w=900&q=60&auto=format&fit=crop")';
const SC={run:U('1590333748338-d629e4564ad9'),lift:U('1589579234096-25cb6b83e021'),calm:U('1548966268-b978ed7b2e83'),food:U('1674316037121-5210009059f5'),kitchen:U('1674316037121-5210009059f5')};
function put(node,key,cls){if(!node||node.dataset.sc6===key)return;node.dataset.sc6=key;node.classList.add('sc6',cls||'sc6-r');node.style.setProperty('--sc6',SC[key]);}
const txt=(n)=>n?.textContent||'';
function apply(){
  // Home: today's workout + nutrition
  const hv=$('homeV6');if(hv){const cards=[...hv.querySelectorAll('.card,.v6-card')];const w=cards.find(c=>/today.s workout/i.test(txt(c).slice(0,40)));if(w)put(w,/strength|upper|lower|core|lift/i.test(txt(w))?'lift':'run');const n=cards.find(c=>/today.s nutrition/i.test(txt(c).slice(0,40)));if(n)put(n,'food','sc6-r sc6-soft');}
  // Train hero
  const hero=[...document.querySelectorAll('#train .t6-tag')].find(t=>/^TODAY/.test(t.textContent))?.closest('.card');if(hero)put(hero,/strength|upper|lower|core|lift/i.test(txt(hero))?'lift':'run');
  // Recovery pick
  const rp=document.querySelector('#train .v6-pick');if(rp)put(rp,'calm');
  else{const c=[...document.querySelectorAll('#train .card')].find(c=>/picked for today/i.test(txt(c).slice(0,60)));if(c)put(c,'calm');}
  // Menus day card + Kitchen
  const md=document.querySelector('.mv6-day');if(md)put(md,'food','sc6-top');
  const mk=$('myKitchen');if(mk)put(mk,'kitchen','sc6-r sc6-soft');
}
const css=document.createElement('style');css.textContent=`
.sc6{position:relative;overflow:hidden;isolation:isolate}
.sc6::before{content:"";position:absolute;inset:0;z-index:-1;background-image:linear-gradient(90deg,var(--card) 18%,color-mix(in srgb,var(--card) 70%,transparent) 55%,color-mix(in srgb,var(--card) 25%,transparent)),var(--sc6);background-size:cover;background-position:center;pointer-events:none}
.sc6-soft::before{background-image:linear-gradient(90deg,var(--card) 35%,color-mix(in srgb,var(--card) 80%,transparent) 70%,color-mix(in srgb,var(--card) 50%,transparent)),var(--sc6)}
.sc6-top{padding-top:118px!important}.sc6-top::before{background-image:linear-gradient(transparent 40%,var(--card) 118px),var(--sc6);background-size:100% 100%,cover;background-position:center 35%;background-repeat:no-repeat;height:130px;inset:0 0 auto 0}
.sc6 > *{position:relative}`;
document.head.append(css);
let q=0;const run6=()=>{q=0;try{apply();}catch(e){}};
new MutationObserver(()=>{if(!q){q=1;requestAnimationFrame(run6);}}).observe(document.body,{childList:true,subtree:true});
const tick=()=>{run6();setTimeout(tick,1500);};tick();
})();
