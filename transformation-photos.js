/* Private cloud photos. No image bytes or signed URLs enter localStorage/backups. */
(()=>{
'use strict';
const bucket='stride-transformation-private-v5',LIMIT=100,MAX_ORIGINAL=15*1024*1024,WINDOW=2;
const node=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined&&text!==null)n.textContent=text;if(cls)n.className=cls;return n};
const panel=node('div');panel.className='card';panel.id='myTransformation';
panel.innerHTML=`<h2>My Transformation</h2><p>Private to your account.</p>
<div id="photoGuest" class="hidden"><p>Create a free account to keep private progress photos.</p><button type="button" id="photoGuestBtn" class="v6-start">Create a free account</button></div>
<div id="photoMain">
<button type="button" id="photoPick" class="v6-start">📷 Add progress photo</button>
<p id="photoHint" class="pt-note">JPEG/HEIC/PNG photos up to 5 MB each — we shrink them for you.</p>
<p id="photoUsage" class="pt-note" aria-live="polite"></p>
<form id="photoForm" class="hidden"><input id="photoFile" type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif" multiple required hidden><p id="photoPicked" class="pt-note"></p><label for="photoDate">Photo date</label><input id="photoDate" type="date" required><label for="photoAngle">View</label><select id="photoAngle"><option>Front</option><option>Side</option><option>Back</option><option>Other</option></select><label for="photoNote">Note (optional)</label><textarea id="photoNote" maxlength="500" placeholder="How you felt, a milestone, or a reminder"></textarea><button id="photoUpload" class="v6-start">Save photo</button><button type="button" id="photoCancel" class="v6-ghost">Cancel</button></form>
<p id="photoStatus" role="status"></p>
<h3>My photo timeline</h3>
<div id="photoChips" class="pt-chips" role="group" aria-label="Filter photos by date"></div>
<p id="photoCount" class="pt-note" aria-live="polite"></p>
<div id="photoCarousel" class="pt-car" tabindex="0" aria-label="Photo timeline, swipe sideways"></div>
<div class="pt-actions"><button type="button" id="photoCompareBtn" class="v6-ghost">↔ Compare two dates</button><button type="button" id="photoRefresh" class="v6-ghost">Refresh photos</button></div>
</div>`;
$('progressStats').after(panel);$('photoDate').value=date();$('photoDate').max=date();
const style=node('style');style.textContent=`
.pt-note{font-size:13px;color:var(--muted);margin:6px 0}
.pt-chips{display:flex;flex-wrap:wrap;gap:6px;padding:2px 0 6px}
.pt-chip{flex:0 0 auto;width:auto!important;margin:0!important;padding:6px 12px!important;border-radius:999px!important;background:var(--soft)!important;color:var(--fg)!important;border:1px solid transparent!important;font-size:13px!important;line-height:1.2;display:inline-flex;align-items:center;gap:4px}
.pt-chip.on{background:var(--accent)!important;color:var(--on-accent)!important;font-weight:700}
.pt-chip input{font-size:13px!important;width:auto;margin:0;padding:0;border:0;background:transparent;color:inherit;font:inherit}
.pt-car{display:flex;gap:12px;overflow-x:auto;scroll-snap-type:x mandatory;padding:6px 10%;scroll-padding:0 10%;-webkit-overflow-scrolling:touch;scrollbar-width:none;overscroll-behavior-x:contain;margin:0 -16px}.pt-car::-webkit-scrollbar{display:none}
.pt-slide{flex:0 0 80%;scroll-snap-align:center;margin:0;min-width:0;cursor:pointer}
.pt-ph{position:relative;aspect-ratio:3/4;border-radius:16px;background:var(--soft);overflow:hidden;display:flex;align-items:center;justify-content:center;text-align:center;color:var(--muted);font-size:14px;padding:12px}
.pt-ph img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.pt-cap{font-size:13px;padding:8px 2px;overflow-wrap:anywhere}.pt-cap b{display:block;font-size:14px}
.pt-actions{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px}.pt-actions button{margin:0!important;width:100%}
#photoForm.hidden,#photoGuest.hidden,#photoMain.hidden{display:none}
dialog.pt-view{border:0;padding:0;margin:0;width:100vw;height:100vh;max-width:none;max-height:none;background:#000;color:#fff}
dialog.pt-view::backdrop{background:#000}
.pt-vbox{position:relative;display:flex;flex-direction:column;height:100%;padding:env(safe-area-inset-top) 0 env(safe-area-inset-bottom)}
.pt-vimg{flex:1;min-height:0;display:flex;align-items:center;justify-content:center;touch-action:pan-y}.pt-vimg img{max-width:100%;max-height:100%;object-fit:contain}
.pt-x{position:absolute;top:calc(10px + env(safe-area-inset-top));right:12px;z-index:2;width:44px!important;height:44px;border-radius:50%!important;background:rgba(255,255,255,.18)!important;color:#fff!important;font-size:20px!important;padding:0!important;margin:0!important}
.pt-nav{position:absolute;top:45%;z-index:2;width:44px!important;height:56px;padding:0!important;margin:0!important;font-size:26px!important;background:rgba(255,255,255,.16)!important;color:#fff!important;border-radius:12px!important}.pt-nav.l{left:6px}.pt-nav.r{right:6px}.pt-nav:disabled{opacity:.25}
.pt-info{padding:12px 16px 16px;background:#000}.pt-info p{margin:2px 0;color:#fff}.pt-info .pt-note{color:#b6c4d9}
.pt-btns{display:flex;gap:8px;flex-wrap:wrap}.pt-btns p{flex-basis:100%}.pt-info button{margin:8px 8px 0 0!important;width:auto!important}.pt-del{background:#b42318!important;color:#fff!important}
dialog.pt-cmp{width:min(560px,calc(100vw - 16px));max-height:92vh;overflow:auto;border:1px solid var(--soft);border-radius:22px;background:var(--bg);color:var(--fg);padding:16px}
dialog.pt-cmp::backdrop{background:rgba(0,0,0,.7)}
.pt-pair{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:10px 0}
.pt-pair label{font-weight:700;margin-top:0}.pt-pair select{width:100%}
`;document.head.append(style);
const owner=()=>window.cloudRecordOwner?.()||null;
const client=()=>window.strideCloudClient;
let photos=[],urls=new Map(),pending=new Set(),slides=new Map(),loadedOwner=null,requestId=0,loading=false,mutating=false,used=0,list=[],idx=0,filter=null,viewIdx=-1;
function status(text){$('photoStatus').textContent=text;}
function safePath(photo,id){return photo.user_id===id&&photo.storage_path===id+'/'+photo.id+'.jpg';}
function pretty(d){const [y,m,dd]=d.split('-').map(Number);return new Date(y,m-1,dd).toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'});}
function shift(d,days){const [y,m,dd]=d.split('-').map(Number),t=new Date(y,m-1,dd-days);return t.getFullYear()+'-'+String(t.getMonth()+1).padStart(2,'0')+'-'+String(t.getDate()).padStart(2,'0');}
function short(d){const [y,m,dd]=d.split('-').map(Number);return new Date(y,m-1,dd).toLocaleDateString(undefined,y===new Date().getFullYear()?{month:'short',day:'numeric'}:{month:'short',day:'numeric',year:'2-digit'});}
function label(p){return pretty(p.captured_on)+' · '+p.angle;}
function clear(){photos=[];urls.clear();pending.clear();slides.clear();list=[];idx=0;filter=null;used=0;$('photoCarousel').replaceChildren();$('photoChips').replaceChildren();$('photoCount').textContent='';$('photoFile').value='';$('photoNote').value='';$('photoForm').classList.add('hidden');usage();}
function usage(){const n=Math.max(used,photos.length),full=n>=LIMIT;$('photoUsage').textContent=n+' of '+LIMIT+' progress photos used'+(full?'. Delete older photos to add new ones.':'');$('photoPick').disabled=full||mutating;}
/* ---- lazy signed URLs ---- */
async function ensure(p){const c=urls.get(p.id);if(c&&Date.now()-c.t<240000)return c.url;if(pending.has(p.id))return null;const id=owner();if(!id||!client()?.storage||!safePath(p,id))return null;pending.add(p.id);try{const {data,error}=await client().storage.from(bucket).createSignedUrl(p.storage_path,300);if(id!==owner())return null;if(error||!data?.signedUrl)return null;urls.set(p.id,{url:data.signedUrl,t:Date.now()});paintImg(p.id);return data.signedUrl;}catch{return null;}finally{pending.delete(p.id);}}
function paintImg(id){const url=urls.get(id)?.url;if(!url)return;const s=slides.get(id);if(s&&!s.querySelector('img')){const img=node('img');img.alt=s.dataset.alt||'Progress photo';img.referrerPolicy='no-referrer';img.decoding='async';img.onerror=()=>{img.remove();urls.delete(id);s.querySelector('.pt-ph span').textContent='Photo link expired. Swipe to retry.';};img.src=url;s.querySelector('.pt-ph').append(img);}
 if(viewIdx>=0&&list[viewIdx]?.id===id)paintViewer();
 for(const f of document.querySelectorAll('.pt-cmpimg[data-pid="'+id+'"]')){if(!f.querySelector('img')){const img=node('img');img.src=url;img.alt='Progress photo';f.append(img);}}}
function prebuffer(center){for(let i=center-WINDOW;i<=center+WINDOW;i++){const p=list[i];if(p)ensure(p);}}
/* ---- filtering ---- */
function applyFilter(){const t=date();let f=photos;if(filter){if(filter.k==='today')f=photos.filter(p=>p.captured_on===t);else if(filter.k==='week')f=photos.filter(p=>p.captured_on>=shift(t,6));else if(filter.k==='month')f=photos.filter(p=>p.captured_on.slice(0,7)===t.slice(0,7));else if(filter.k==='date')f=photos.filter(p=>p.captured_on===filter.v);}
 list=f.slice().reverse();}
function chips(){const box=$('photoChips');box.replaceChildren();const defs=[['today','Today'],['week','This week'],['month','This month'],['all','All']];
 for(const [k,l] of defs){const b=node('button',l,'pt-chip'+(filter?.k===k?' on':''));b.type='button';b.onclick=()=>{filter={k};paint(true);};box.append(b);}
 const w=node('label',undefined,'pt-chip'+(filter?.k==='date'?' on':''));w.append(node('span','📅'));const inp=node('input');inp.type='date';inp.max=date();inp.value=filter?.k==='date'?filter.v:'';inp.setAttribute('aria-label','Pick a date');inp.onchange=()=>{if(inp.value){filter={k:'date',v:inp.value};paint(true);}};w.append(inp);box.append(w);}
function paint(reset){applyFilter();chips();usage();const car=$('photoCarousel');const keep=idx;car.replaceChildren();slides.clear();
 const total=photos.length;$('photoCount').textContent=list.length+' photo'+(list.length===1?'':'s')+(filter?.k!=='all'&&total!==list.length?' shown · '+total+' in total':'');
 $('photoCompareBtn').disabled=total<2;
 if(!list.length){car.style.padding='6px 16px';car.append(node('p',total?'No photos for this period. Try "All" or pick another date.':'Add your first photo to start your timeline.','pt-note'));return;}
 car.style.padding='';
 list.forEach((p,i)=>{const s=node('figure',undefined,'pt-slide');s.dataset.i=i;s.dataset.alt=label(p)+' progress photo';const ph=node('div',undefined,'pt-ph');ph.append(node('span',label(p)));s.append(ph);const cap=node('figcaption',undefined,'pt-cap');cap.append(node('b',pretty(p.captured_on)+' · '+p.angle));if(p.note)cap.append(node('span',p.note));s.append(cap);s.onclick=()=>openViewer(i);slides.set(p.id,s);car.append(s);});
 idx=reset?0:Math.min(keep,list.length-1);const s=car.children[idx];if(s)car.scrollLeft=s.offsetLeft-(car.clientWidth-s.offsetWidth)/2;prebuffer(idx);}
let raf=0;$('photoCarousel').addEventListener('scroll',()=>{if(raf)return;raf=requestAnimationFrame(()=>{raf=0;const car=$('photoCarousel'),mid=car.scrollLeft+car.clientWidth/2;let best=0,bd=1e9;[...car.children].forEach((c,i)=>{if(!c.dataset.i)return;const d=Math.abs(c.offsetLeft+c.offsetWidth/2-mid);if(d<bd){bd=d;best=i;}});if(best!==idx){idx=best;prebuffer(idx);}});},{passive:true});
/* ---- full-screen viewer ---- */
let viewer;
function buildViewer(){viewer=node('dialog',undefined,'pt-view');viewer.setAttribute('aria-label','Photo viewer');viewer.innerHTML='<div class="pt-vbox"><button type="button" class="pt-x" aria-label="Close">✕</button><button type="button" class="pt-nav l" aria-label="Previous photo">‹</button><button type="button" class="pt-nav r" aria-label="Next photo">›</button><div class="pt-vimg"><span class="pt-note"></span></div><div class="pt-info"><p class="pt-d"></p><p class="pt-n pt-note"></p><div class="pt-btns"><button type="button" class="pt-del v6-ghost">Delete photo</button></div></div></div>';document.body.append(viewer);
 viewer.querySelector('.pt-x').onclick=closeViewer;viewer.querySelector('.pt-nav.l').onclick=()=>step(1);viewer.querySelector('.pt-nav.r').onclick=()=>step(-1);
 viewer.addEventListener('close',()=>{viewIdx=-1;});viewer.addEventListener('keydown',e=>{if(e.key==='ArrowLeft')step(1);if(e.key==='ArrowRight')step(-1);});
 let x0=null;const vi=viewer.querySelector('.pt-vimg');vi.addEventListener('touchstart',e=>{x0=e.touches[0].clientX;},{passive:true});vi.addEventListener('touchend',e=>{if(x0===null)return;const dx=e.changedTouches[0].clientX-x0;x0=null;if(Math.abs(dx)>50)step(dx>0?1:-1);});
 viewer.querySelector('.pt-btns').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.a==='no'){paintViewer();}else if(b.dataset.a==='yes'){const p=list[viewIdx];if(p)deletePhoto(p);}else if(b.classList.contains('pt-del')){showConfirm();}});}
// "left" = older (next in newest-first list); step(1)=older
function step(d){const n=viewIdx+d;if(n<0||n>=list.length)return;viewIdx=n;paintViewer();prebuffer(n);}
function openViewer(i){if(!viewer)buildViewer();viewIdx=i;paintViewer();prebuffer(i);if(!viewer.open)viewer.showModal();}
function closeViewer(){const i=viewIdx;viewer?.open&&viewer.close();viewIdx=-1;if(i>=0){const s=$('photoCarousel').children[i];s?.scrollIntoView({inline:'center',block:'nearest'});}}
function paintViewer(){const p=list[viewIdx];if(!p){return;}const box=viewer.querySelector('.pt-vimg');box.replaceChildren();const u=urls.get(p.id)?.url;if(u){const img=node('img');img.alt=label(p)+' progress photo';img.src=u;img.onerror=()=>{img.remove();urls.delete(p.id);box.append(node('span','Photo link expired. Close and reopen to retry.','pt-note'));};box.append(img);}else{box.append(node('span','Loading '+label(p)+'…','pt-note'));ensure(p);}
 viewer.querySelector('.pt-d').textContent=pretty(p.captured_on)+' · '+p.angle+' view';viewer.querySelector('.pt-n').textContent=(p.note?p.note+' — ':'')+(viewIdx+1)+' of '+list.length;
 viewer.querySelector('.pt-nav.l').disabled=viewIdx>=list.length-1;viewer.querySelector('.pt-nav.r').disabled=viewIdx<=0;
 const b=viewer.querySelector('.pt-btns');b.replaceChildren();const d=node('button','Delete photo','pt-del');d.type='button';d.disabled=mutating;b.append(d);}
function showConfirm(){const b=viewer.querySelector('.pt-btns');b.replaceChildren();const q=node('p','Delete this photo permanently?');const y=node('button','Yes, delete','pt-del');y.type='button';y.dataset.a='yes';const n=node('button','Cancel','v6-ghost');n.type='button';n.dataset.a='no';b.append(q,y,n);}
/* ---- compare mode ---- */
let cmp;
function openCompare(){if(photos.length<2)return;if(!cmp){cmp=node('dialog',undefined,'pt-cmp');cmp.innerHTML='<h3 style="margin-top:0">Compare your progress</h3><p class="pt-note">Pick a before and an after photo to see them side by side.</p><div class="pt-pair"><div><label for="cmpA">Before</label><select id="cmpA"></select></div><div><label for="cmpB">After</label><select id="cmpB"></select></div></div><div class="pt-pair" id="cmpOut"></div><button type="button" class="v6-ghost" id="cmpClose">Close</button>';document.body.append(cmp);cmp.querySelector('#cmpClose').onclick=()=>cmp.close();cmp.querySelector('#cmpA').onchange=cmpDraw;cmp.querySelector('#cmpB').onchange=cmpDraw;}
 for(const id of ['cmpA','cmpB']){const s=cmp.querySelector('#'+id);s.replaceChildren();photos.forEach(p=>{const o=node('option',short(p.captured_on)+' · '+p.angle);o.value=p.id;s.append(o);});}
 cmp.querySelector('#cmpA').value=photos[0].id;cmp.querySelector('#cmpB').value=photos.at(-1).id;cmpDraw();if(!cmp.open)cmp.showModal();}
function cmpDraw(){const a=photos.find(p=>p.id===cmp.querySelector('#cmpA').value),b=photos.find(p=>p.id===cmp.querySelector('#cmpB').value),out=cmp.querySelector('#cmpOut');out.replaceChildren();if(!a||!b)return;if(a.id===b.id){out.append(node('p','Choose two different photos.','pt-note'));return;}
 for(const [t,p] of [['Before',a],['After',b]]){const f=node('figure');f.style.margin='0';const ph=node('div',undefined,'pt-ph pt-cmpimg');ph.dataset.pid=p.id;ph.append(node('span',label(p)));f.append(ph,node('figcaption',t+' · '+pretty(p.captured_on),'pt-cap'));out.append(f);ensure(p).then(()=>paintImg(p.id));if(urls.get(p.id))paintImg(p.id);}}
/* ---- data ---- */
async function countUsed(id){try{const {data,error}=await client().storage.from(bucket).list(id,{limit:1000});if(!error&&Array.isArray(data))return data.filter(o=>o.name&&o.name!=='.emptyFolderPlaceholder').length;}catch{}return photos.length;}
async function refresh(quiet){const id=owner();if(!id){clear();status('Sign in to view your private photos.');return;}if(!client()?.storage||!client()?.from){status('Private photo storage is not ready yet.');return;}const request=++requestId;loading=true;if(!quiet)status('Loading your private photos…');try{const {data,error}=await client().from('transformation_photos').select('*').eq('user_id',id).order('captured_on',{ascending:true}).order('created_at',{ascending:true}).limit(200);if(request!==requestId||id!==owner())return;if(error)throw error;const next=(data||[]).filter(p=>safePath(p,id)),sig=a=>a.map(p=>p.id).join();const same=sig(next)===sig(photos)&&photos.length>0;photos=next;used=await countUsed(id);if(request!==requestId||id!==owner())return;if(!same||!filter){const latest=photos.at(-1)?.captured_on;if(!filter||!same)filter=filter&&filter.k!=='date'?filter:(latest?{k:'date',v:filter?.k==='date'&&photos.some(p=>p.captured_on===filter.v)?filter.v:latest}:{k:'all'});paint(false);}else usage();status(photos.length?photos.length+' private photo'+(photos.length===1?'':'s'):'Your private photo timeline is ready.');}catch(error){if(request===requestId&&id===owner()){clear();status('Could not load private photos. Photo storage may still need setup.');}}finally{if(request===requestId)loading=false;}}
async function prepare(file){const heic=/hei[cf]/i.test(file?.type||'')||/\.(heic|heif)$/i.test(file?.name||'');if(!file||!(file.type?.startsWith('image/')||heic))throw Error('Choose a JPEG, HEIC or PNG photo.');if(file.size>MAX_ORIGINAL)throw Error('That photo is over 15 MB. Choose a smaller one.');let source,w,h,close=()=>{};try{const bmp=await createImageBitmap(file);source=bmp;w=bmp.width;h=bmp.height;close=()=>bmp.close?.();}catch{const url=URL.createObjectURL(file);try{const image=new Image();await new Promise((ok,no)=>{image.onload=ok;image.onerror=()=>no(Error('This photo could not be opened. Try a JPEG or PNG, or set your camera to save as JPEG.'));image.src=url;});source=image;w=image.naturalWidth;h=image.naturalHeight;}finally{URL.revokeObjectURL(url);}}
 try{if(!w||!h||w*h>40000000)throw Error('Choose a photo with a smaller image size.');for(const [dim,q] of [[1600,.85],[1400,.7],[1000,.6]]){const scale=Math.min(1,dim/Math.max(w,h)),canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(w*scale));canvas.height=Math.max(1,Math.round(h*scale));const context=canvas.getContext('2d');if(!context)throw Error('This device cannot prepare photos.');context.fillStyle='#ffffff';context.fillRect(0,0,canvas.width,canvas.height);context.drawImage(source,0,0,canvas.width,canvas.height);const blob=await new Promise(r=>canvas.toBlob(r,'image/jpeg',q));if(blob&&blob.size<=5*1024*1024)return blob;}throw Error('This photo is too large after resizing. Choose a smaller photo.');}finally{close();}}
function busy(value){mutating=value;$('photoUpload').disabled=value;$('photoRefresh').disabled=value;usage();}
$('photoPick').onclick=()=>{if(!owner()){window.strideNeedAccount?.('Progress photos');return;}$('photoFile').click();};
$('photoFile').onchange=()=>{const files=[...$('photoFile').files];if(!files.length){$('photoForm').classList.add('hidden');return;}const big=files.find(f=>f.size>MAX_ORIGINAL);if(big){$('photoFile').value='';$('photoForm').classList.add('hidden');status('That photo is over 15 MB. Choose a smaller one, or lower your camera’s photo size.');return;}const room=LIMIT-Math.max(used,photos.length);if(files.length>room){$('photoFile').value='';$('photoForm').classList.add('hidden');status(room<=0?'Delete older photos to add new ones.':'You can add '+room+' more photo'+(room===1?'':'s')+'. Choose fewer photos.');return;}status('');$('photoPicked').textContent=files.length+' photo'+(files.length===1?'':'s')+' selected';$('photoForm').classList.remove('hidden');};
$('photoCancel').onclick=()=>{$('photoFile').value='';$('photoForm').classList.add('hidden');};
$('photoGuestBtn').onclick=()=>window.strideNeedAccount?.('Progress photos');
$('photoForm').onsubmit=async event=>{event.preventDefault();if(mutating||!$('photoForm').reportValidity())return;const id=owner(),captured=$('photoDate').value,note=$('photoNote').value.trim(),angle=$('photoAngle').value;if(!id||!client()?.storage){status('Sign in and set up private photo storage first.');return;}if(captured>date()){status('Choose today or an earlier photo date.');return;}if(Math.max(used,photos.length)>=LIMIT){status('Delete older photos to add new ones.');return;}const photoId=crypto.randomUUID(),path=id+'/'+photoId+'.jpg';let uploaded=false;busy(true);status('Preparing your photo…');try{const blob=await prepare($('photoFile').files[0]);if(id!==owner())return;status('Saving your private photo…');const {error}=await client().storage.from(bucket).upload(path,blob,{contentType:'image/jpeg',upsert:false,cacheControl:'300'});if(error)throw error;uploaded=true;if(id!==owner())return;const result=await client().from('transformation_photos').insert({id:photoId,user_id:id,captured_on:captured,angle,note,storage_path:path});if(result.error)throw result.error;if(id!==owner())return;$('photoFile').value='';$('photoNote').value='';$('photoForm').classList.add('hidden');filter={k:'date',v:captured};await refresh(true);if(id===owner())status('Private photo saved.');}catch(error){let cleanupFailed=false;if(uploaded&&id===owner()){try{const cleanup=await client().storage.from(bucket).remove([path]);cleanupFailed=!!cleanup.error;}catch{cleanupFailed=true;}}if(id===owner())status(cleanupFailed?'Photo details could not be saved. The private upload could not be removed; contact support before uploading it again.':'Could not save this photo. Check private photo storage and try again.');}finally{if(id===owner())busy(false);}};
async function deletePhoto(photo){const id=owner();if(mutating||!safePath(photo,id))return;const before=photos.slice(),at=viewIdx;
 // optimistic: remove everywhere right away
 photos=photos.filter(p=>p.id!==photo.id);urls.delete(photo.id);used=Math.max(0,used-1);
 if(filter?.k==='date'&&!photos.some(p=>p.captured_on===filter.v))filter={k:'all'};
 paint(false);if(viewer?.open){applyFilter();if(!list.length)closeViewer();else{viewIdx=Math.min(at,list.length-1);paintViewer();prebuffer(viewIdx);}}
 mutating=true;status('Deleting photo…');
 try{const stored=await client().storage.from(bucket).remove([photo.storage_path]);if(id!==owner())return;if(stored.error)throw stored.error;const row=await client().from('transformation_photos').delete().eq('id',photo.id).eq('user_id',id);if(row.error)throw row.error;if(id===owner())status('Photo deleted.');}
 catch{if(id===owner()){photos=before;status('Could not finish deleting this photo. Refreshing…');await refresh(true);status('Could not finish deleting this photo. Try again.');}}
 finally{mutating=false;if(id===owner())usage();}}
$('photoCompareBtn').onclick=openCompare;$('photoRefresh').onclick=()=>refresh();
function accountChanged(){if(loadedOwner===owner())return;loadedOwner=owner();requestId++;loading=false;mutating=false;clear();$('photoUpload').disabled=false;$('photoRefresh').disabled=false;const o=!!owner();$('photoMain').classList.toggle('hidden',!o);$('photoGuest').classList.toggle('hidden',o);viewer?.open&&viewer.close();cmp?.open&&cmp.close();status(o?'Open Progress to view your photos.':'');if(!$('progress').classList.contains('hidden')&&o)refresh();}
window.addEventListener('stride-account-change',accountChanged);
const previous=render;render=function(){previous();const changed=loadedOwner!==owner();accountChanged();if(!changed&&!loading&&!photos.length&&!$('progress').classList.contains('hidden')&&owner())refresh();};
setInterval(()=>{if(owner()&&!loading&&!mutating&&!viewer?.open&&!$('progress').classList.contains('hidden'))refresh(true);},240000);
window.stridePhotos={refresh};
// the guest state is decided by owner(); re-check shortly after load once auth settles
setTimeout(()=>{loadedOwner=undefined;accountChanged();},0);

// Several photos at once: save them one after another with the same date, angle and note.
{const f=$('photoForm'),one=f.onsubmit;f.onsubmit=async e=>{const files=[...($('photoFile').files||[])];if(files.length<=1)return one(e);e.preventDefault();const note=$('photoNote').value,date=$('photoDate').value,angle=$('photoAngle').value;let n=0;for(const file of files){const dt=new DataTransfer();dt.items.add(file);$('photoFile').files=dt.files;$('photoNote').value=note;$('photoDate').value=date;$('photoAngle').value=angle;await one(e);if(/saved/i.test($('photoStatus').textContent))n++;}$('photoForm').classList.add('hidden');status(n===files.length?n+' private photos saved.':n+' of '+files.length+' photos saved. Try the others again.');};}
})();
