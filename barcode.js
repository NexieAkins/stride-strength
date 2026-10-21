/* Barcode scanner for meals: camera scan (BarcodeDetector, or ZXing fallback) or typed code, looked up on Open Food Facts. */
(function(){
const $=id=>document.getElementById(id);
const ICON='<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 7V5a1 1 0 0 1 1-1h2M17 4h2a1 1 0 0 1 1 1v2M20 17v2a1 1 0 0 1-1 1h-2M7 20H5a1 1 0 0 1-1-1v-2"/><path d="M8 8v8M11 8v8M14 8v8M17 8v8" stroke-width="1.6"/></g></svg>';
let stream=null,loopOn=false,zxReader=null;
function addButton(){
  const q=$('mealQuick');if(!q||$('mealScanBtn'))return;
  const b=document.createElement('button');b.type='button';b.id='mealScanBtn';b.innerHTML=ICON+'<span>Scan</span>';b.onclick=open;
  const first=q.querySelector('button');first?first.after(b):q.append(b);q.classList.add('q5');
}
function sheet(){
  let d=$('scanSheet');if(d)return d;
  d=document.createElement('dialog');d.id='scanSheet';d.className='scan6';
  d.innerHTML='<div class="scan6-h"><b>Scan a barcode</b><button type="button" class="scan6-x" aria-label="Close">✕</button></div>'+
  '<div class="scan6-cam"><video playsinline muted autoplay></video><div class="scan6-frame"></div><p class="scan6-hint">Point your camera at the barcode</p></div>'+
  '<form class="scan6-man"><input inputmode="numeric" pattern="[0-9]*" placeholder="Or type the barcode number" aria-label="Barcode number"><button type="submit">Look up</button></form>'+
  '<div class="scan6-res" aria-live="polite"></div>';
  document.body.append(d);
  d.querySelector('.scan6-x').onclick=close;
  d.addEventListener('close',stop);
  d.querySelector('.scan6-man').onsubmit=e=>{e.preventDefault();const v=e.target.querySelector('input').value.replace(/\D/g,'');if(v.length>=6)lookup(v);else msg('Enter the full number under the barcode.');};
  return d;
}
const msg=(t,html)=>{const r=$('scanSheet')?.querySelector('.scan6-res');if(r){if(html)r.innerHTML=t;else{r.textContent=t;}}};
async function open(){
  const d=sheet();d.querySelector('.scan6-res').textContent='';d.querySelector('.scan6-cam').hidden=false;d.querySelector('.scan6-man input').value='';
  d.showModal?d.showModal():d.setAttribute('open','');
  const v=d.querySelector('video');
  try{
    stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'},width:{ideal:1280},height:{ideal:720}},audio:false});
    v.srcObject=stream;await v.play().catch(()=>{});
    scan(v);
  }catch(e){d.querySelector('.scan6-cam').hidden=true;msg('Camera isn’t available here. Type the barcode number instead.');}
}
async function scan(v){
  loopOn=true;
  if('BarcodeDetector' in window){
    let det;try{det=new BarcodeDetector({formats:['ean_13','ean_8','upc_a','upc_e','code_128']});}catch{det=null;}
    if(det){const tick=async()=>{if(!loopOn)return;try{const r=await det.detect(v);if(r&&r[0]?.rawValue){found(r[0].rawValue);return;}}catch{}setTimeout(tick,250);};tick();return;}
  }
  try{
    if(!window.ZXing)await new Promise((res,rej)=>{const s=document.createElement('script');s.src='https://cdn.jsdelivr.net/npm/@zxing/library@0.21.3/umd/index.min.js';s.onload=res;s.onerror=rej;document.head.append(s);});
    const Z=window.ZXing,hints=new Map();hints.set(Z.DecodeHintType.POSSIBLE_FORMATS,[Z.BarcodeFormat.EAN_13,Z.BarcodeFormat.EAN_8,Z.BarcodeFormat.UPC_A,Z.BarcodeFormat.UPC_E,Z.BarcodeFormat.CODE_128]);
    zxReader=new Z.BrowserMultiFormatReader(hints,300);
    zxReader.decodeFromVideoElementContinuously(v,(res)=>{if(res&&loopOn)found(res.getText());});
  }catch(e){msg('Couldn’t start the scanner. Type the barcode number instead.');}
}
function stop(){loopOn=false;try{zxReader?.reset();}catch{}zxReader=null;if(stream){stream.getTracks().forEach(t=>t.stop());stream=null;}}
function close(){stop();const d=$('scanSheet');if(d){d.close?d.close():d.removeAttribute('open');}}
function found(code){if(!loopOn)return;stop();navigator.vibrate?.(60);const d=$('scanSheet');d.querySelector('.scan6-cam').hidden=true;d.querySelector('.scan6-man input').value=code;lookup(code);}
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
async function lookup(code){
  msg('Looking up '+code+'…');
  let p;
  try{const r=await fetch('https://world.openfoodfacts.org/api/v2/product/'+encodeURIComponent(code)+'.json?fields=product_name,brands,nutriments,serving_size,serving_quantity,image_front_small_url');const j=await r.json();if(j.status!==1||!j.product)throw 0;p=j.product;}
  catch{msg('<p>We couldn’t find <b>'+esc(code)+'</b>. You can scan again, or use <b>Enter it</b> to add it yourself.</p><div class="scan6-row"><button type="button" class="scan6-again">Scan again</button><button type="button" class="scan6-manual">Enter it</button></div>',true);wire();return;}
  const n=p.nutriments||{},sq=Number(p.serving_quantity)||0;
  const per=k=>Number(n[k+'_serving']);const p100=k=>Number(n[k+'_100g']);
  const hasServ=Number.isFinite(per('energy-kcal'))&&per('energy-kcal')>0;
  const base={kcal:hasServ?per('energy-kcal'):p100('energy-kcal')||(p100('energy')?p100('energy')/4.184:0),pro:hasServ?per('proteins'):p100('proteins'),carb:hasServ?per('carbohydrates'):p100('carbohydrates'),fat:hasServ?per('fat'):p100('fat'),fib:hasServ?per('fiber'):p100('fiber')};
  const unitLbl=hasServ?('serving'+(p.serving_size?' ('+p.serving_size+')':'')):'100 g';
  const name=[p.brands?.split(',')[0],p.product_name].filter(Boolean).join(' ').trim()||('Barcode '+code);
  const slot=(()=>{const h=new Date().getHours();return h<11?'Breakfast':h<15?'Lunch':h<21?'Dinner':'Snack';})();
  msg('<div class="scan6-prod">'+(p.image_front_small_url?'<img src="'+esc(p.image_front_small_url)+'" alt="">':'<div class="scan6-ph">'+ICON+'</div>')+'<div><b>'+esc(name)+'</b><small>Per '+esc(unitLbl)+': '+Math.round(base.kcal||0)+' kcal · '+(+(base.pro||0)).toFixed(1)+' g protein</small></div></div>'+
   '<div class="scan6-grid"><label>How many '+(hasServ?'servings':'× 100 g')+'<input type="number" class="scan6-q" min="0.25" step="0.25" value="'+(hasServ?1:(sq?Math.round(sq)/100:1))+'"></label><label>Meal<select class="scan6-t">'+['Breakfast','Lunch','Dinner','Snack'].map(t=>'<option'+(t===slot?' selected':'')+'>'+t+'</option>').join('')+'</select></label></div>'+
   '<p class="scan6-tot"></p><div class="scan6-row"><button type="button" class="scan6-again">Scan another</button><button type="button" class="scan6-add">＋ Add to diary</button></div><p class="scan6-src">Nutrition from Open Food Facts · check the label if it looks off.</p>',true);
  const d=$('scanSheet'),q=d.querySelector('.scan6-q'),tot=d.querySelector('.scan6-tot');
  const calc=()=>{const k=Math.max(0,Number(q.value)||0),r=v=>Number.isFinite(v)?v*k:0;return{kcal:Math.round(r(base.kcal)),pro:+r(base.pro).toFixed(1),carb:+r(base.carb).toFixed(1),fat:+r(base.fat).toFixed(1),fib:+r(base.fib).toFixed(1)};};
  const show=()=>{const c=calc();tot.textContent='Total: '+c.kcal+' kcal · '+c.pro+' g protein · '+c.carb+' g carbs · '+c.fat+' g fat';};q.oninput=show;show();
  d.querySelector('.scan6-add').onclick=()=>{const c=calc();const set=(id,v)=>{const e=$(id);if(e)e.value=v;};
    set('mealDate',window.strideMealDay?.()||new Date().toISOString().slice(0,10));set('mealType',d.querySelector('.scan6-t').value);
    const k=Number(q.value)||1;set('food',name+(hasServ?(k!==1?' × '+k+' servings':''):' — '+Math.round(k*100)+' g'));
    set('calories',c.kcal);set('protein',c.pro);set('carbs',c.carb);set('fat',c.fat);set('fiber',c.fib);
    const f=$('mealForm'),before=(window.db?.meals||[]).length;
    if(f){f.requestSubmit?f.requestSubmit():f.dispatchEvent(new Event('submit',{cancelable:true}));}
    setTimeout(()=>{if((window.db?.meals||db?.meals||[]).length>before){msg('<p class="scan6-ok">✓ '+esc(name)+' added to your meals.</p><div class="scan6-row"><button type="button" class="scan6-again">Scan another</button><button type="button" class="scan6-done">Done</button></div>',true);wire();}else{msg('Couldn’t save that. Check the details under Enter it.');window.__v6mealMode?.('manual');}},350);};
  wire();
}
function wire(){const d=$('scanSheet');d.querySelector('.scan6-again')?.addEventListener('click',()=>{close();setTimeout(open,50);});d.querySelector('.scan6-manual')?.addEventListener('click',()=>{close();window.__v6mealMode?.('manual');});d.querySelector('.scan6-done')?.addEventListener('click',close);}
const css=document.createElement('style');css.textContent=`
#mealQuick.q5{grid-template-columns:repeat(5,1fr)!important;gap:6px!important}#mealQuick.q5 button{padding-left:2px!important;padding-right:2px!important;font-size:12.5px}
.scan6{width:min(440px,94vw);max-height:92vh;overflow:auto;border:1px solid var(--soft);border-radius:22px;background:var(--bg);color:var(--fg);padding:14px 16px 18px}
.scan6::backdrop{background:rgba(0,0,0,.6)}
.scan6-h{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px}.scan6-h b{font-size:18px}
.scan6-x{width:36px!important;height:36px;border-radius:50%!important;padding:0!important;margin:0!important;background:var(--card)!important;border:1px solid var(--soft)!important;color:var(--fg)!important}
.scan6-cam{position:relative;border-radius:16px;overflow:hidden;background:#000;aspect-ratio:4/3}.scan6-cam video{width:100%;height:100%;object-fit:cover;display:block}
.scan6-frame{position:absolute;left:12%;right:12%;top:30%;bottom:30%;border:3px solid var(--accent);border-radius:12px;box-shadow:0 0 0 999px rgba(0,0,0,.35)}
.scan6-hint{position:absolute;left:0;right:0;bottom:8px;text-align:center;color:#fff;font-size:13px;margin:0;text-shadow:0 1px 3px #000}
.scan6-man{display:flex;gap:8px;margin:12px 0 4px}.scan6-man input{flex:1;min-width:0;margin:0!important}.scan6-man button{width:auto!important;margin:0!important;padding:10px 14px!important}
.scan6-res{margin-top:8px}.scan6-prod{display:flex;gap:12px;align-items:center;margin:6px 0 10px}.scan6-prod img,.scan6-ph{width:64px;height:64px;border-radius:12px;object-fit:cover;background:#fff;flex:none;display:grid;place-items:center;color:var(--accent)}.scan6-ph{background:var(--card)}.scan6-prod b{display:block}.scan6-prod small{color:var(--muted)}
.scan6-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}.scan6-grid label{display:flex;flex-direction:column;gap:4px;font-size:12px;color:var(--muted);font-weight:600}.scan6-grid input,.scan6-grid select{margin:0!important}
.scan6-tot{font-weight:700;margin:10px 0}.scan6-row{display:flex;gap:8px}.scan6-row button{flex:1;margin:0!important}.scan6-add,.scan6-done{background:var(--accent)!important;color:var(--on-accent)!important;border:0!important}
.scan6-again,.scan6-manual{background:none!important;border:1px solid var(--soft)!important;color:var(--fg)!important}
.scan6-src{font-size:11.5px;color:var(--muted);margin:8px 0 0}.scan6-ok{color:var(--accent);font-weight:700}`;
document.head.append(css);
window.strideOpenScanner=open;
const tick=()=>{try{addButton();}catch{}setTimeout(tick,1200);};tick();
})();
