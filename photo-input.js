(()=>{
'use strict';
async function encode(file){if(!file?.type.startsWith('image/'))throw Error('Choose an image file.');if(file.size>12*1024*1024)throw Error('Choose an image under 12 MB.');let bitmap;try{bitmap=await createImageBitmap(file);}catch{throw Error('This image could not be opened. Try a JPG, PNG, or screenshot.');}try{const ratio=Math.min(1,2400/Math.max(bitmap.width,bitmap.height)),canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(bitmap.width*ratio));canvas.height=Math.max(1,Math.round(bitmap.height*ratio));canvas.getContext('2d').drawImage(bitmap,0,0,canvas.width,canvas.height);const data=canvas.toDataURL('image/jpeg',.85);if(data.length>3400000)throw Error('Choose a smaller photo or crop it to the relevant details.');return data;}finally{bitmap.close?.();}}
window.stridePhotoInput={encode};
})();
