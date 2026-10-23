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
  '<button type="button" class="scan6-snap">📷 Trouble scanning? Take a photo of the barcode</button><input type="file" accept="image/*" capture="environment" class="scan6-file" hidden>'+'<form class="scan6-man"><input inputmode="numeric" pattern="[0-9]*" placeholder="Or type the barcode number" aria-label="Barcode number"><button type="submit">Look up</button></form>'+
  '<div class="scan6-res" aria-live="polite"></div>';
  document.body.append(d);
  d.querySelector('.scan6-x').onclick=close;const sf=d.querySelector('.scan6-file');d.querySelector('.scan6-snap').onclick=()=>sf.click();sf.onchange=async()=>{const f=sf.files?.[0];sf.value='';if(!f)return;stop();d.querySelector('.scan6-cam').hidden=true;msg('Reading the barcode…');const codes=await codeFromFile(f);if(codes&&codes.length){d.querySelector('.scan6-man input').value=codes[0];if(codes.length>1){for(const c of codes.slice(1)){const it=await quick(c);if(it)basket.push(it);}bk();}lookup(codes[0]);}else msg('Couldn’t read a barcode in that photo. Get closer so the bars fill the photo, or type the numbers under it.');};
  d.addEventListener('close',stop);d.addEventListener('cancel',()=>{});
  d.querySelector('.scan6-man').onsubmit=e=>{e.preventDefault();const v=e.target.querySelector('input').value.replace(/\D/g,'');if(v.length>=6)lookup(v);else msg('Enter the full number under the barcode.');};
  return d;
}
const msg=(t,html)=>{const r=$('scanSheet')?.querySelector('.scan6-res');if(r){if(html)r.innerHTML=t;else{r.textContent=t;}}};
async function open(){
  const d=sheet();d.querySelector('.scan6-res').textContent='';d.querySelector('.scan6-cam').hidden=false;d.querySelector('.scan6-man input').value='';
  d.showModal?d.showModal():d.setAttribute('open','');bk();
  const v=d.querySelector('video');
  try{
    stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'},width:{ideal:1920},height:{ideal:1080},advanced:[{focusMode:'continuous'}]},audio:false});
    v.srcObject=stream;await v.play().catch(()=>{});
    scan(v);
  }catch(e){d.querySelector('.scan6-cam').hidden=true;msg('Camera isn’t available here. Type the barcode number instead.');}
}
async function scan(v){
  loopOn=true;
  if('BarcodeDetector' in window){
    let det;try{det=new BarcodeDetector({formats:['ean_13','ean_8','upc_a','upc_e','code_128','code_39','code_93','itf','codabar','qr_code','data_matrix'].filter(f=>!BarcodeDetector.getSupportedFormats||true)});}catch{det=null;}
    if(det){const tick=async()=>{if(!loopOn)return;try{const r=await det.detect(v);if(r&&r[0]?.rawValue){found(r[0].rawValue);return;}}catch{}setTimeout(tick,250);};tick();return;}
  }
  try{
    if(!window.ZXing)await new Promise((res,rej)=>{const s=document.createElement('script');s.src='https://cdn.jsdelivr.net/npm/@zxing/library@0.21.3/umd/index.min.js';s.onload=res;s.onerror=rej;document.head.append(s);});
    const Z=window.ZXing,hints=new Map();hints.set(Z.DecodeHintType.POSSIBLE_FORMATS,[Z.BarcodeFormat.EAN_13,Z.BarcodeFormat.EAN_8,Z.BarcodeFormat.UPC_A,Z.BarcodeFormat.UPC_E,Z.BarcodeFormat.CODE_128,Z.BarcodeFormat.CODE_39,Z.BarcodeFormat.CODE_93,Z.BarcodeFormat.ITF,Z.BarcodeFormat.CODABAR,Z.BarcodeFormat.QR_CODE]);hints.set(Z.DecodeHintType.TRY_HARDER,true);
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
  try{p=await findProduct(code);if(!p)throw 0;}
  catch{msg('<p>We couldn’t find <b>'+esc(code)+'</b>. You can scan again, or use <b>Enter it</b> to add it yourself.</p><div class="scan6-row"><button type="button" class="scan6-again">Scan again</button><button type="button" class="scan6-manual">Enter it</button></div>',true);wire();return;}
  const n=p.nutriments||{},sq=Number(p.serving_quantity)||0;
  const per=k=>Number(n[k+'_serving']);const p100=k=>Number(n[k+'_100g']);
  const hasServ=Number.isFinite(per('energy-kcal'))&&per('energy-kcal')>0;
  const base={kcal:hasServ?per('energy-kcal'):p100('energy-kcal')||(p100('energy')?p100('energy')/4.184:0),pro:hasServ?per('proteins'):p100('proteins'),carb:hasServ?per('carbohydrates'):p100('carbohydrates'),fat:hasServ?per('fat'):p100('fat'),fib:hasServ?per('fiber'):p100('fiber')};
  const unitLbl=hasServ?('serving'+(p.serving_size?' ('+p.serving_size+')':'')):'100 g';
  const name=[p.brands?.split(',')[0],p.product_name].filter(Boolean).join(' ').trim()||('Barcode '+code);
  const slot=(()=>{const h=new Date().getHours();return h<11?'Breakfast':h<16?'Lunch':h<22?'Dinner':'Snack';})();
  msg('<div class="scan6-prod">'+(p.image_front_small_url?'<img src="'+esc(p.image_front_small_url)+'" alt="">':'<div class="scan6-ph">'+ICON+'</div>')+'<div><b>'+esc(name)+'</b><small>Per '+esc(unitLbl)+': '+Math.round(base.kcal||0)+' kcal · '+(+(base.pro||0)).toFixed(1)+' g protein</small></div></div>'+
   '<div class="scan6-grid"><label>How many '+(hasServ?'servings':'× 100 g')+'<input type="number" class="scan6-q" min="0.25" step="0.25" value="'+(hasServ?1:(sq?Math.round(sq)/100:1))+'"></label><label>Meal<select class="scan6-t">'+['Breakfast','Lunch','Dinner','Snack'].map(t=>'<option'+(t===slot?' selected':'')+'>'+t+'</option>').join('')+'</select></label></div>'+
   '<p class="scan6-tot"></p><div class="scan6-row"><button type="button" class="scan6-list">＋ Add &amp; scan next</button><button type="button" class="scan6-add">'+(basket.length?'＋ Add all '+(basket.length+1)+' to diary':'＋ Add to diary')+'</button></div><button type="button" class="scan6-again scan6-skip">Skip this one</button><p class="scan6-src">Nutrition from Open Food Facts · check the label if it looks off.</p>',true);
  const d=$('scanSheet'),q=d.querySelector('.scan6-q'),tot=d.querySelector('.scan6-tot');
  const calc=()=>{const k=Math.max(0,Number(q.value)||0),r=v=>Number.isFinite(v)?v*k:0;return{kcal:Math.round(r(base.kcal)),pro:+r(base.pro).toFixed(1),carb:+r(base.carb).toFixed(1),fat:+r(base.fat).toFixed(1),fib:+r(base.fib).toFixed(1)};};
  const show=()=>{const c=calc();tot.textContent='Total: '+c.kcal+' kcal · '+c.pro+' g protein · '+c.carb+' g carbs · '+c.fat+' g fat';};q.oninput=show;show();
  const item=()=>{const c=calc(),k=Number(q.value)||1;return{name:name+(hasServ?(k!==1?' × '+k+' servings':''):' — '+Math.round(k*100)+' g'),slot:d.querySelector('.scan6-t').value,c};};
  d.querySelector('.scan6-list').onclick=()=>{basket.push(item());close();setTimeout(open,50);};
  if(basket.length)d.querySelector('.scan6-add').onclick=()=>{basket.push(item());saveAll();};else
  d.querySelector('.scan6-add').onclick=()=>{const c=calc();const set=(id,v)=>{const e=$(id);if(e)e.value=v;};
    set('mealDate',window.strideMealDay?.()||new Date().toISOString().slice(0,10));set('mealType',d.querySelector('.scan6-t').value);
    const k=Number(q.value)||1;set('food',name+(hasServ?(k!==1?' × '+k+' servings':''):' — '+Math.round(k*100)+' g'));
    set('calories',c.kcal);set('protein',c.pro);set('carbs',c.carb);set('fat',c.fat);set('fiber',c.fib);
    const f=$('mealForm'),before=(window.db?.meals||[]).length;
    if(f){f.requestSubmit?f.requestSubmit():f.dispatchEvent(new Event('submit',{cancelable:true}));}
    setTimeout(()=>{if((window.db?.meals||db?.meals||[]).length>before){msg('<p class="scan6-ok">✓ '+esc(name)+' added to your meals.</p><div class="scan6-row"><button type="button" class="scan6-again">Scan another</button><button type="button" class="scan6-done">Done</button></div>',true);wire();}else{msg('Couldn’t save that. Check the details under Enter it.');window.__v6mealMode?.('manual');}},350);};
  wire();
}
let basket=[];
const variants=c=>{c=String(c).replace(/\D/g,'');const v=[c];if(c.length===12)v.push('0'+c);if(c.length===13&&c[0]==='0')v.push(c.slice(1));if(c.length===8)v.push(c);return [...new Set(v)];};
async function findProduct(code){
  for(const v of variants(code)){try{const r=await fetch('https://world.openfoodfacts.org/api/v2/product/'+v+'.json?fields=product_name,brands,nutriments,serving_size,serving_quantity,image_front_small_url');const j=await r.json();if(j.status===1&&j.product&&(j.product.product_name||j.product.brands))return j.product;}catch{}}
  // Fallback: USDA branded foods (US packaged foods)
  try{const r=await fetch('https://api.nal.usda.gov/fdc/v1/foods/search?api_key=DEMO_KEY&dataType=Branded&pageSize=5&query='+variants(code).join('%20OR%20'));const j=await r.json();const f=(j.foods||[]).find(x=>variants(code).some(v=>String(x.gtinUpc||'').replace(/^0+/,'')===v.replace(/^0+/,'')))||null;
    if(f){const nut=id=>{const n=(f.foodNutrients||[]).find(x=>x.nutrientId===id||x.nutrientNumber===String(id));return n?Number(n.value):0;};const g=Number(f.servingSize)||0,k=f.servingSizeUnit&&/^g$/i.test(f.servingSizeUnit)&&g?g/100:1;
      return{product_name:(f.description||'').replace(/\b\w/g,m=>m).toLowerCase().replace(/(^|\s)\S/g,m=>m.toUpperCase()),brands:f.brandName||f.brandOwner||'',serving_size:g?g+' '+(f.servingSizeUnit||'').toLowerCase():'',serving_quantity:g,nutriments:{'energy-kcal_serving':nut(1008)*k,proteins_serving:nut(1003)*k,carbohydrates_serving:nut(1005)*k,fat_serving:nut(1004)*k,fiber_serving:nut(1079)*k}};}}catch{}
  return null;}
function saveOne(it){return new Promise(res=>{const set=(id,v)=>{const e=$(id);if(e)e.value=v;};set('mealDate',window.strideMealDay?.()||new Date().toISOString().slice(0,10));set('mealType',it.slot);set('food',it.name);set('calories',it.c.kcal);set('protein',it.c.pro);set('carbs',it.c.carb);set('fat',it.c.fat);set('fiber',it.c.fib);const f=$('mealForm'),n=(db.meals||[]).length;if(f){f.requestSubmit?f.requestSubmit():f.dispatchEvent(new Event('submit',{cancelable:true}));}setTimeout(()=>res((db.meals||[]).length>n),350);});}
async function saveAll(){const items=basket.slice();basket=[];stop();const d=sheet();d.querySelector('.scan6-cam').hidden=true;msg('Adding '+items.length+' items…');let ok=0;for(const it of items){if(await saveOne(it))ok++;}
  msg('<p class="scan6-ok">✓ '+ok+' of '+items.length+' items added to your meals.</p><div class="scan6-row"><button type="button" class="scan6-again">Scan more</button><button type="button" class="scan6-done">Done</button></div>',true);wire();bk();window.strideToast?.('✓ '+ok+' items logged');}
function bk(){const d=sheet();let b=d.querySelector('.scan6-bk');if(!b){b=document.createElement('div');b.className='scan6-bk';d.querySelector('.scan6-h').after(b);}
  if(!basket.length){b.hidden=true;return;}b.hidden=false;const kc=basket.reduce((a,x)=>a+x.c.kcal,0);
  b.innerHTML='<b>'+basket.length+' item'+(basket.length>1?'s':'')+' · '+kc+' kcal</b><ul>'+basket.map((x,i)=>'<li><span>'+esc(x.name)+' · '+x.c.kcal+' kcal</span><button type="button" data-i="'+i+'" aria-label="Remove">✕</button></li>').join('')+'</ul><button type="button" class="scan6-addall">＋ Add all to diary</button>';
  b.querySelectorAll('li button').forEach(x=>x.onclick=()=>{basket.splice(Number(x.dataset.i),1);bk();});b.querySelector('.scan6-addall').onclick=saveAll;}
function wire(){bk();const d=$('scanSheet');d.querySelector('.scan6-again')?.addEventListener('click',()=>{close();setTimeout(open,50);});d.querySelector('.scan6-manual')?.addEventListener('click',()=>{close();window.__v6mealMode?.('manual');});d.querySelector('.scan6-done')?.addEventListener('click',close);}
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
.scan6-bk{background:var(--card);border:1px solid var(--soft);border-radius:14px;padding:10px 12px;margin-bottom:10px}.scan6-bk ul{list-style:none;padding:0;margin:6px 0}.scan6-bk li{display:flex;justify-content:space-between;align-items:center;gap:8px;font-size:13px;padding:4px 0;border-bottom:1px solid var(--soft)}.scan6-bk li button{width:28px!important;height:28px!important;padding:0!important;margin:0!important;border-radius:50%!important;background:none!important;border:1px solid var(--soft)!important;color:var(--fg)!important;flex:none;min-height:0!important}.scan6-addall{width:100%;margin:6px 0 0!important;background:var(--accent)!important;color:var(--on-accent)!important;border:0!important}.scan6-skip{width:100%;margin-top:8px!important}.scan6-snap{width:100%;margin:10px 0 0!important;background:var(--card)!important;border:1px solid var(--soft)!important;color:var(--fg)!important;font-weight:700;font-size:13.5px!important}.scan6-src{font-size:11.5px;color:var(--muted);margin:8px 0 0}.scan6-ok{color:var(--accent);font-weight:700}`;
document.head.append(css);
window.strideOpenScanner=open;
// Barcodes in meal photos: if a photo you take or choose has a barcode, look the product up too.
async function quick(code){try{const p=await findProduct(code);if(!p)return null;const n=p.nutriments||{},sv=Number(n['energy-kcal_serving'])>0,g=k=>Number(n[k+(sv?'_serving':'_100g')])||0;const slot=(()=>{const h=new Date().getHours();return h<11?'Breakfast':h<16?'Lunch':h<22?'Dinner':'Snack';})();return{name:[p.brands?.split(',')[0],p.product_name].filter(Boolean).join(' ').trim()+(sv?'':' — 100 g'),slot,c:{kcal:Math.round(g('energy-kcal')),pro:+g('proteins').toFixed(1),carb:+g('carbohydrates').toFixed(1),fat:+g('fat').toFixed(1),fib:+g('fiber').toFixed(1)}};}catch{return null;}}
async function codeFromFile(f){try{const bmp=await createImageBitmap(f);
  if('BarcodeDetector' in window){try{const r=await new BarcodeDetector({formats:['ean_13','ean_8','upc_a','upc_e','code_128','code_39','code_93','itf','codabar','qr_code','data_matrix'].filter(f=>!BarcodeDetector.getSupportedFormats||true)}).detect(bmp);if(r&&r.length)return [...new Set(r.map(x=>x.rawValue).filter(Boolean))];}catch{}}
  if(!window.ZXing)await new Promise((ok,no)=>{const sc=document.createElement('script');sc.src='https://cdn.jsdelivr.net/npm/@zxing/library@0.21.3/umd/index.min.js';sc.onload=ok;sc.onerror=no;document.head.append(sc);});
  const c=document.createElement('canvas'),k=Math.min(1,2200/Math.max(bmp.width,bmp.height));c.width=bmp.width*k;c.height=bmp.height*k;c.getContext('2d').drawImage(bmp,0,0,c.width,c.height);
  const Z=window.ZXing,src=new Z.HTMLCanvasElementLuminanceSource(c),bb=new Z.BinaryBitmap(new Z.HybridBinarizer(src));const hints=new Map();hints.set(Z.DecodeHintType.TRY_HARDER,true);let out=[];try{const rr=new Z.GenericMultipleBarcodeReader((()=>{const r=new Z.MultiFormatReader();r.setHints(hints);return r;})()).decodeMultiple(bb,hints);out=rr.map(x=>x.getText());}catch{try{out=[new Z.MultiFormatReader().decode(bb,hints).getText()];}catch{try{const rc=document.createElement('canvas');rc.width=c.height;rc.height=c.width;const x=rc.getContext('2d');x.translate(rc.width/2,rc.height/2);x.rotate(Math.PI/2);x.drawImage(c,-c.width/2,-c.height/2);out=[new Z.MultiFormatReader().decode(new Z.BinaryBitmap(new Z.HybridBinarizer(new Z.HTMLCanvasElementLuminanceSource(rc))),hints).getText()];}catch{}}}return out.length?[...new Set(out)]:null;}catch{return null;}}
document.addEventListener('change',e=>{const i=e.target;if(!i||!['aiMealPhoto','mealCamera'].includes(i.id)||!i.files?.length)return;const f=i.files[0];codeFromFile(f).then(async codes=>{codes=(codes||[]).filter(c=>/^\d{6,14}$/.test(c));if(!codes.length)return;const d=sheet();d.querySelector('.scan6-cam').hidden=true;d.showModal?d.showModal():d.setAttribute('open','');if(codes.length===1){d.querySelector('.scan6-man input').value=codes[0];lookup(codes[0]);return;}msg('Found '+codes.length+' barcodes · looking them up…');for(const c of codes){const it=await quick(c);if(it)basket.push(it);}bk();msg(basket.length?'<p>Check the list above, remove anything you don’t want, then add them all.</p>':'Couldn’t find those products. Try scanning them one at a time.',!!basket.length);});},true);
const tick=()=>{try{addButton();}catch{}setTimeout(tick,1200);};tick();
})();
