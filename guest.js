/* Guest mode: everything that works on the phone stays open; features that need the server
   (AI estimates, plans, photos, cloud sync) show a clear "create a free account" sheet. */
(function(){
const $=id=>document.getElementById(id);
const signedOut=()=>window.strideSignedOut===true&&!window.cloudRecordOwner?.();
function goAccount(mode){const s=$('acct6');if(s){s.close();s.remove();}document.querySelector('[data-go=accountpage]')?.click()||window.show?.('accountpage');setTimeout(()=>{if(mode==='signup'){const b=$('signup');if(b&&!/sign in/i.test(b.textContent))b.click();}$('authEmail')?.focus();},150);}
function sheet(what){if($('acct6'))return;const d=document.createElement('dialog');d.id='acct6';d.className='v6-sheet';
  d.innerHTML='<h2>Create a free account</h2><p class="v6-sub"></p><p class="v6-sub">Everything you’ve logged as a guest comes with you.</p><button type="button" class="v6-start" id="acct6Up">Sign up — it’s free</button><button type="button" class="v6-ghost" id="acct6In">I have an account · Sign in</button><button type="button" class="v6-ghost" id="acct6No">Not now</button>';
  d.querySelector('p').textContent=(what||'This feature')+' uses your Stride & Strength account.';document.body.append(d);d.showModal();
  d.querySelector('#acct6Up').onclick=()=>goAccount('signup');d.querySelector('#acct6In').onclick=()=>goAccount('signin');d.querySelector('#acct6No').onclick=()=>{d.close();d.remove();};}
window.strideNeedAccount=sheet;
function label(){const a=document.activeElement?.closest?.('button');const t=(a?.textContent||'').trim();
  if(/estimate/i.test(t))return 'AI meal estimates';if(/menu/i.test(t))return 'Menu building';if(/kitchen|pantry/i.test(t))return 'My Kitchen';if(/plan|workout/i.test(t))return 'AI workout plans';if(/run/i.test(t))return 'Run reviews';if(/photo/i.test(t))return 'Photo features';return 'This feature';}
(function hook(n){const f=window.mealAiGetToken;if(typeof f!=='function'){if(n<60)setTimeout(()=>hook(n+1),250);return;}if(f.__g)return;
  const w=async function(){if(signedOut()){sheet(label());return null;}return f.apply(this,arguments);};w.__g=1;window.mealAiGetToken=w;})(0);
(function hookToast(n){const t=window.strideToast;if(typeof t!=='function'){if(n<60)setTimeout(()=>hookToast(n+1),250);return;}if(t.__g)return;
  const w=m=>{if(signedOut()&&/^sign in/i.test(String(m||''))){sheet(/health/i.test(m)?'Apple Health sync':/fitness profile/i.test(m)?'This':'This feature');return;}return t(m);};w.__g=1;window.strideToast=w;})(0);
function banner(){const home=$('homeV6')||$('home');if(!home)return;let b=$('guest6');if(!signedOut()){b?.remove();return;}let hide=false;try{hide=sessionStorage.getItem('guest6x')==='1';}catch(e){}if(hide){b?.remove();return;}if(b){if(b.parentElement!==home)home.prepend(b);return;}
  b=document.createElement('div');b.id='guest6';b.className='card';b.innerHTML='<span>👋 You’re using Stride &amp; Strength as a guest. <b>Sign up free</b> to back up your data and unlock AI meal estimates and plans.</span><button type="button" class="v6-start g6-up">Sign up</button><button type="button" class="g6-x" aria-label="Hide">✕</button>';
  b.querySelector('.g6-up').onclick=()=>goAccount('signup');b.querySelector('.g6-x').onclick=()=>{try{sessionStorage.setItem('guest6x','1');}catch(e){}b.remove();};home.prepend(b);}
const st=document.createElement('style');st.textContent='#guest6{display:flex;align-items:center;gap:10px;flex-wrap:wrap;border:1.5px solid var(--accent)!important}#guest6 span{flex:1 1 200px;font-size:14px;line-height:1.4}#guest6 .g6-up{width:auto!important;padding:8px 16px!important;margin:0!important}#guest6{position:relative;padding-right:40px!important}#guest6 .g6-x{position:absolute;top:8px;right:8px;width:auto!important;background:none!important;border:0!important;color:var(--muted)!important;padding:4px 6px!important;margin:0!important;min-height:0!important}#acct6 button{width:100%;margin-top:8px}';document.head.append(st);
setInterval(banner,1500);banner();
})();
