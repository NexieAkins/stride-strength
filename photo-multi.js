/* Multiple photos: tap the camera again to add more, or pick several from the library. */
(()=>{
'use strict';
const MAX=4;
async function shrink(file,dim=1600,q=.8){
  const isHeic=/hei[cf]/i.test(file?.type||'')||/\.(heic|heif)$/i.test(file?.name||'');
  if(!file||!(file.type?.startsWith('image/')||isHeic||/\.(jpe?g|png|webp|gif|bmp)$/i.test(file.name||'')))throw Error('Choose an image file.');
  if(file.size>25*1024*1024)throw Error('Choose an image under 25 MB.');
  let bmp;try{bmp=await createImageBitmap(file);}catch{
    try{if(!window.heic2any)await new Promise((ok,no)=>{const sc=document.createElement('script');sc.src='https://cdn.jsdelivr.net/npm/heic2any@0.0.4/dist/heic2any.min.js';sc.onload=ok;sc.onerror=no;document.head.append(sc);});
      const out=await window.heic2any({blob:file,toType:'image/jpeg',quality:.85});bmp=await createImageBitmap(Array.isArray(out)?out[0]:out);}
    catch{throw Error('This photo couldn’t be opened. Try taking it again, or change your camera to save as JPEG.');}}
  try{const r=Math.min(1,dim/Math.max(bmp.width,bmp.height)),c=document.createElement('canvas');c.width=Math.max(1,Math.round(bmp.width*r));c.height=Math.max(1,Math.round(bmp.height*r));c.getContext('2d').drawImage(bmp,0,0,c.width,c.height);return c.toDataURL('image/jpeg',q);}finally{bmp.close?.();}
}
// inputs: file inputs (camera + library). after: element to place thumbnails after. onChange(list, error)
function attach({inputs,after,onChange}){
  let list=[];const strip=document.createElement('div');strip.className='photo-strip';(after||inputs[inputs.length-1]).after(strip);
  inputs.forEach(i=>{if(!i.hasAttribute('capture'))i.multiple=true;
    i.addEventListener('change',async e=>{e.stopImmediatePropagation();const files=[...(i.files||[])];i.value='';let err='';
      for(const f of files){if(list.length>=MAX){err='Up to '+MAX+' photos.';break;}try{list.push(await shrink(f));}catch(x){err=x.message;}}
      draw();onChange?.(list,err);},true);});
  function draw(){strip.replaceChildren();list.forEach((src,k)=>{const w=document.createElement('span');w.className='photo-thumb';const im=document.createElement('img');im.src=src;im.alt='Photo '+(k+1);const x=document.createElement('button');x.type='button';x.textContent='✕';x.setAttribute('aria-label','Remove photo '+(k+1));x.onclick=()=>{list.splice(k,1);draw();onChange?.(list,'');};w.append(im,x);strip.append(w);});
    if(list.length&&list.length<MAX){const n=document.createElement('p');n.className='photo-more';n.textContent=list.length+' photo'+(list.length>1?'s':'')+' · tap the camera or choose again to add more (up to '+MAX+')';strip.append(n);}}
  return {list:()=>list.slice(),clear(){list=[];draw();}};
}
window.strideMultiPhoto={attach,shrink,MAX};
const css=document.createElement('style');css.textContent='.photo-strip{display:flex;flex-wrap:wrap;gap:8px;margin:8px 0}.photo-strip:empty{display:none}.photo-thumb{position:relative;width:76px;height:76px}.photo-thumb img{width:100%;height:100%;object-fit:cover;border-radius:10px;border:1px solid var(--soft)}.photo-thumb button{position:absolute;top:-6px;right:-6px;width:24px;height:24px;padding:0!important;margin:0!important;border-radius:50%!important;font-size:12px;line-height:1}.photo-more{flex-basis:100%;margin:2px 0 0;font-size:13px;color:var(--muted)}#mealPreview{display:none!important}';document.head.append(css);
// Meals: the estimate uses every photo added.
const cam=document.getElementById('mealCamera'),lib=document.getElementById('aiMealPhoto');
if(cam&&lib){const m=attach({inputs:[lib,cam],after:cam,onChange:(l,err)=>{const st=document.getElementById('aiMealStatus');if(st)st.textContent=err||(l.length?l.length+' photo'+(l.length>1?'s':'')+' ready.':'');document.getElementById('aiMealResults')?.classList.add('hidden');}});window.strideMealPhotos=m;}
})();
