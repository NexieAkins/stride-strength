// Older-adult (65+) adaptations. Everything here is a no-op when age is missing or under 65.
(()=>{
'use strict';
const owner=()=>window.cloudRecordOwner?.()||'browser';
function age(){try{const p=typeof db==='object'&&db?db.profile:null;if(!p||p.user_id!==owner())return null;const a=Number(p.age_years);return Number.isFinite(a)&&a>=13&&a<=110?a:null;}catch{return null;}}
window.strideAge=age;
window.strideIsOlder=()=>{const a=age();return a!==null&&a>=65;};
window.strideWithAge=body=>{const a=age();return a===null?body:{...body,age_years:Math.round(a)};};

const TIP='Tip: calcium and vitamin D foods (dairy or fortified alternatives, leafy greens, fish) help protect bones.';
function tip(){const anchor=document.getElementById('macroTiles')||document.getElementById('saveGoals');if(!anchor)return;let p=document.getElementById('olderNutritionTip');if(!p){p=document.createElement('p');p.id='olderNutritionTip';p.className='muted';p.style.cssText='font-size:.9em;margin:10px 0 0;color:var(--muted,#a9b8cc);line-height:1.4';p.textContent=TIP;}if(p.previousElementSibling!==anchor)anchor.after(p);p.hidden=!window.strideIsOlder();}

const style=document.createElement('style');style.textContent='#olderTextSheet{width:min(92vw,420px);box-sizing:border-box;border:1px solid var(--soft,#2a3a55);border-radius:18px;background:var(--card,#1b273a);color:var(--fg,#f5f7fb);padding:22px}#olderTextSheet::backdrop{background:rgba(0,0,0,.55)}#olderTextSheet h2{margin:0 0 6px;font-size:1.3em}#olderTextSheet p{margin:0 0 14px;color:var(--muted,#a9b8cc);line-height:1.45}#olderTextSheet .row{display:flex;gap:10px;flex-wrap:wrap}#olderTextSheet button{flex:1 1 auto;min-height:48px;margin:0;font-size:1.05em}#olderTextSheet button.secondary{flex-basis:100%;background:transparent;border:1px solid var(--soft,#2a3a55);color:var(--fg,#f5f7fb)}';document.head.append(style);
function offerText(){
 if(!window.strideIsOlder())return;const key='stride-older-text-offered-'+owner();
 try{if(localStorage.getItem(key))return;localStorage.setItem(key,'1');}catch{return;}
 const d=document.createElement('dialog');d.id='olderTextSheet';d.setAttribute('aria-labelledby','olderTextTitle');
 d.innerHTML='<h2 id="olderTextTitle">Would you like larger text?</h2><p>Bigger text can be easier to read. You can change this any time with the Text size buttons at the top.</p><div class="row"><button type="button" data-pick="large">A+</button><button type="button" data-pick="xl">A++</button><button type="button" class="secondary" data-pick="">Keep as is</button></div>';
 d.addEventListener('click',e=>{const b=e.target.closest('button[data-pick]');if(!b)return;if(b.dataset.pick)document.querySelector('[data-text-size="'+b.dataset.pick+'"]')?.click();d.close();});
 d.addEventListener('close',()=>d.remove());document.body.append(d);setTimeout(()=>{try{d.showModal();}catch{}},60);
}
window.strideOlder={offerText,tip};
if(typeof render==='function'){const previous=render;render=function(){const r=previous.apply(this,arguments);try{tip();}catch{}return r;};}
window.addEventListener('stride-account-change',()=>setTimeout(tip,0));
tip();
})();
