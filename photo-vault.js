/* Private Vault: opt-in end-to-end encrypted progress photos.
   Keys, passcodes and recovery codes live only in memory (and the wrapped forms in public.photo_vaults). Never stored locally. */
(()=>{
'use strict';
const C=window.strideVaultCrypto,P=window.stridePhotos?.internal,main=document.getElementById('photoMain');
if(!C||!P||!main||!globalThis.crypto?.subtle)return;
const IDLE=10*60e3,BG=2*60e3;
const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined&&text!==null)n.textContent=text;if(cls)n.className=cls;return n};
const btn=(text,cls,fn)=>{const b=el('button',text,cls);b.type='button';if(fn)b.onclick=fn;return b};
let st='unknown',row=null,dek=null,loadedFor=null,loading=null,idleT=0,lastActive=Date.now(),hiddenAt=0,running=false,uid=0;
const client=()=>P.client(),owner=()=>P.owner();
const emit=()=>window.dispatchEvent(new Event('stride-vault-change'));
const toBuf=b=>b instanceof ArrayBuffer?Promise.resolve(b):b.arrayBuffer?b.arrayBuffer():new Promise((ok,no)=>{const r=new FileReader();r.onload=()=>ok(r.result);r.onerror=no;r.readAsArrayBuffer(b);});
const missing=e=>/42P01|PGRST205|PGRST200/.test(String(e?.code||''))||/does not exist|schema cache|could not find the table/i.test(String(e?.message||''));
/* ---------- state ---------- */
function setState(next){if(st===next)return;st=next;if(next!=='unlocked'){dek=null;clearTimeout(idleT);}emit();card();}
function lock(){if(st!=='unlocked'||running)return;setState('locked');if(dlg?.open&&screenSecret)dlg.close();}
function arm(){clearTimeout(idleT);if(st==='unlocked')idleT=setTimeout(()=>{if(Date.now()-lastActive>=IDLE-500)lock();else arm();},IDLE);}
function touch(){lastActive=Date.now();if(st==='unlocked'&&!armed){armed=true;setTimeout(()=>{armed=false;arm();},1000);}}
let armed=false;
for(const ev of ['pointerdown','keydown','touchstart','scroll','wheel'])addEventListener(ev,touch,{passive:true,capture:true});
document.addEventListener('visibilitychange',()=>{if(document.hidden){hiddenAt=Date.now();return;}const away=hiddenAt?Date.now()-hiddenAt:0;hiddenAt=0;if(st==='unlocked'&&(away>BG||Date.now()-lastActive>IDLE))lock();else touch();});
async function load(id,force){if(!id)return;if(!force&&loadedFor===id&&st!=='error'&&st!=='unknown')return;if(loading)return loading;
 loading=(async()=>{try{const {data,error}=await client().from('photo_vaults').select('*').eq('user_id',id).maybeSingle();if(id!==owner())return;if(error){if(missing(error)){row=null;loadedFor=id;setState('unavailable');}else{setState('error');}return;}
  loadedFor=id;if(!data){row=null;setState('none');}else{const same=row&&row.wrapped_key===data.wrapped_key;row=data;if(st==='unlocked'&&same){card();}else setState(st==='unlocked'?'unlocked':'locked');}}
  catch{if(id===owner())setState('error');}finally{loading=null;}})();return loading;}
function reset(){row=null;loadedFor=null;loading=null;uid++;if(dlg?.open)dlg.close();st='unknown';dek=null;clearTimeout(idleT);emit();card();}
/* ---------- sheet plumbing ---------- */
let dlg=null,screenSecret=false,onUnlockDone=null;
function ensureDlg(){if(dlg)return dlg;dlg=el('dialog',undefined,'v6-sheet');dlg.id='vault6';dlg.setAttribute('aria-label','Private Vault');document.body.append(dlg);
 dlg.addEventListener('cancel',e=>{if(running)e.preventDefault();});
 dlg.addEventListener('close',()=>{screenSecret=false;dlg.replaceChildren();const f=onUnlockDone;onUnlockDone=null;f?.(st==='unlocked');});return dlg;}
function screen(title,nodes,secret){const d=ensureDlg();screenSecret=!!secret;const x=btn('✕','v6-sheetx',()=>{if(!running)d.close();});x.setAttribute('aria-label','Close');const h=el('div',undefined,'v6-sheethead');h.append(el('h2',title),x);d.replaceChildren(h,...nodes);if(!d.open)d.showModal();return d;}
const para=(t,cls)=>el('p',t,cls||'v6-sub');
function field(label,ac,ph){const id='vf'+Math.random().toString(36).slice(2,8),w=el('div'),l=el('label',label);l.htmlFor=id;const i=el('input');i.id=id;i.type='password';i.autocomplete=ac||'off';i.autocapitalize='off';i.spellcheck=false;if(ph)i.placeholder=ph;w.append(l,i);return{w,i};}
function strengthHint(input){const p=el('p',' ','pt-note v-hint');p.setAttribute('aria-live','polite');const up=()=>{const s=C.strength(input.value),t=['At least 6 characters.','Weak. Longer is stronger.','Okay. A few more characters would help.','Strong.'][s];p.textContent=input.value?t:'At least 6 characters. A short phrase is easy to remember and hard to guess.';p.style.color=['var(--muted)','#b42318','#9a6700','#1a7f37'][s];};input.addEventListener('input',up);up();return p;}
function errBox(){const e=el('p','','v-err');e.setAttribute('role','alert');return e;}
function pending(b,label,fn,err){return async()=>{if(b.disabled)return;const old=b.textContent;b.disabled=true;b.textContent=label;err&&(err.textContent='');try{await fn();}catch(e){if(err)err.textContent=e?.userMessage||'Something went wrong. Please try again.';}finally{b.disabled=false;b.textContent=old;}};}
const fail=m=>Object.assign(Error(m),{userMessage:m});
function newPassPair(){const a=field('New passcode','new-password'),b=field('Confirm new passcode','new-password'),h=strengthHint(a.i);
 const check=()=>{if(a.i.value.length<6)throw fail('Use at least 6 characters.');if(a.i.value!==b.i.value)throw fail('The two passcodes do not match.');return a.i.value;};return{nodes:[a.w,h,b.w],check,first:a.i};}
async function saveVaultFields(fields){const id=owner(),r=await client().from('photo_vaults').update({...fields,updated_at:new Date().toISOString()}).eq('user_id',id).select('user_id');if(r.error||!r.data?.length)throw fail('Could not save to your account. Check your connection and try again.');row={...row,...fields};}
const SENSITIVE_NOTE='Dates and front/side/back labels are not encrypted. Photos and notes are.';
/* ---------- setup ---------- */
function setupStart(){if(!owner()||st!=='none')return;const a=field('Passcode (6+ characters)','new-password'),b=field('Confirm passcode','new-password'),h=strengthHint(a.i),err=errBox(),go=btn('Continue','v6-start'),no=btn('Cancel','v6-ghost',()=>dlg.close());
 const sess=uid;go.onclick=pending(go,'Preparing…',async()=>{if(a.i.value.length<6)throw fail('Use at least 6 characters.');if(a.i.value!==b.i.value)throw fail('The two passcodes do not match.');const pass=a.i.value,k=await C.newDEK(),code=C.newRecoveryCode();if(sess!==uid)return;recoveryScreen({code,title:'Save your recovery code',doneLabel:'Done',intro:'If you forget your passcode, this code is the only other way back into your vault. We cannot recover it for you.',onDone:async()=>{const fields=await C.buildVault(k,pass,code),id=owner();if(sess!==uid||!id)return;const r=await client().from('photo_vaults').insert({user_id:id,...fields});if(r.error)throw fail('Could not turn on the vault. Check your connection and try again.');row={user_id:id,...fields};dek=await C.unwrapWithPasscode(row,pass,false);lastActive=Date.now();setState('unlocked');arm();afterSetup();}});},err);
 screen('Turn on Private Vault',[para('Photos you add are encrypted on this device before they are uploaded. Only your passcode (or recovery code) can open them. Not even we can see them.'),para(SENSITIVE_NOTE),para('If you forget your passcode AND lose your recovery code, your vault photos can’t be recovered by anyone.','pt-note v-warn'),a.w,h,b.w,err,go,no],true);a.i.focus();}
function recoveryScreen({code,title,intro,doneLabel,onDone}){const parts=formatted(code).split('-'),box=el('div',undefined,'v-code');box.setAttribute('aria-label','Recovery code');box.append(el('div',parts.slice(0,3).join('-')),el('div',parts.slice(3).join('-')));const copy=btn('Copy code','v6-ghost'),cs=el('span','','pt-note');copy.onclick=async()=>{let ok=false;try{await navigator.clipboard.writeText(formatted(code));ok=true;}catch{try{const r=document.createRange();r.selectNodeContents(box);const s=getSelection();s.removeAllRanges();s.addRange(r);ok=document.execCommand('copy');s.removeAllRanges();}catch{}}cs.textContent=ok?'Copied.':'Could not copy. Select the code and copy it by hand.';};
 const lab=el('label',undefined,'v-check'),cb=el('input');cb.type='checkbox';lab.append(cb,el('span','I’ve saved my recovery code somewhere safe'));const err=errBox(),done=btn(doneLabel||'Done','v6-start');done.disabled=true;cb.onchange=()=>{done.disabled=!cb.checked;};
 done.onclick=pending(done,'Saving…',async()=>{if(!cb.checked)return;await onDone();},err);
 screen(title,[para(intro),para('Write it down or store it in a password manager. Anyone with this code and access to your account could open your vault, so keep it private.','pt-note'),box,el('div',undefined,'v-row'),lab,err,done],true);const r=dlg.querySelector('.v-row');r.append(copy,cs);}
function formatted(code){return C.formatRecovery(code);}
function afterSetup(){const n=plainPhotos().length;const nodes=[para('Your Private Vault is on. New photos you add will be encrypted automatically.')];if(n){nodes.push(para('You have '+n+' existing photo'+(n===1?'':'s')+' that '+(n===1?'isn’t':'aren’t')+' in the vault yet.'),btn('Move my existing '+n+' photo'+(n===1?'':'s')+' into the vault','v6-start',startMove),btn('Not now','v6-ghost',()=>dlg.close()));}else nodes.push(btn('Done','v6-start',()=>dlg.close()));screen('Vault is on',nodes,false);}
/* ---------- unlock / recovery ---------- */
function promptUnlock(){if(st==='unlocked')return Promise.resolve(true);if(st!=='locked'||!row)return Promise.resolve(false);const done=new Promise(r=>{onUnlockDone=r;});unlockScreen();return done;}
async function tryUnlock(pass,extractable){try{return await C.unwrapWithPasscode(row,pass,extractable);}catch{const old=row?.wrapped_key;await load(owner(),true);if(row?.wrapped_key&&row.wrapped_key!==old){try{return await C.unwrapWithPasscode(row,pass,extractable);}catch{}}throw fail('That passcode isn’t right.');}}
function unlockScreen(){const a=field('Passcode','current-password'),err=errBox(),go=btn('Unlock','v6-start'),fg=btn('Forgot passcode? Use recovery code','v-link',recoverScreen);
 a.i.addEventListener('keydown',e=>{if(e.key==='Enter')go.click();});
 go.onclick=pending(go,'Unlocking…',async()=>{if(!a.i.value)throw fail('Enter your passcode.');const k=await tryUnlock(a.i.value,false);dek=k;lastActive=Date.now();a.i.value='';setState('unlocked');arm();dlg.close();},err);
 screen('Unlock your vault',[para('Enter your Private Vault passcode to view or add photos.'),a.w,err,go,fg],true);a.i.focus();}
function recoverScreen(){const rc=field('Recovery code','off','XXXX-XXXX-XXXX-XXXX-XXXX-XXXX');rc.i.type='text';rc.i.autocapitalize='characters';rc.i.style.fontFamily='ui-monospace,Menlo,monospace';const np=newPassPair(),err=errBox(),go=btn('Reset passcode','v6-start'),back=btn('Back to passcode','v6-ghost',unlockScreen);
 go.onclick=pending(go,'Working…',async()=>{if(!C.validRecovery(rc.i.value))throw fail('That recovery code doesn’t look right. It has 24 letters and numbers.');const pass=np.check();let k;try{k=await C.unwrapWithRecovery(row,rc.i.value,true);}catch{throw fail('That recovery code isn’t right.');}
  const f=await C.passcodeFields(k,pass);await saveVaultFields(f);dek=await C.unwrapWithPasscode(row,pass,false);rc.i.value='';lastActive=Date.now();setState('unlocked');arm();
  screen('Passcode reset',[para('Your vault is unlocked and your new passcode is set. Your existing recovery code still works. You can create a new one anytime from the vault settings.'),btn('Done','v6-start',()=>dlg.close())],false);},err);
 screen('Use your recovery code',[para('Enter the recovery code you saved, then choose a new passcode.'),rc.w,...np.nodes,err,go,back],true);rc.i.focus();}
/* ---------- settings actions ---------- */
function askPasscode(title,intro,cta,run){const a=field('Current passcode','current-password'),err=errBox(),go=btn(cta,'v6-start');a.i.addEventListener('keydown',e=>{if(e.key==='Enter')go.click();});go.onclick=pending(go,'Working…',async()=>{if(!a.i.value)throw fail('Enter your passcode.');const k=await tryUnlock(a.i.value,true);await run(k,a.i.value,err);},err);screen(title,[para(intro),a.w,err,go,btn('Cancel','v6-ghost',()=>dlg.close())],true);a.i.focus();}
function changePasscode(){const cur=field('Current passcode','current-password'),np=newPassPair(),err=errBox(),go=btn('Change passcode','v6-start');go.onclick=pending(go,'Working…',async()=>{if(!cur.i.value)throw fail('Enter your current passcode.');const pass=np.check();const k=await tryUnlock(cur.i.value,true);await saveVaultFields(await C.passcodeFields(k,pass));dek=await C.unwrapWithPasscode(row,pass,false);screen('Passcode changed',[para('Your new passcode is set. Your recovery code did not change.'),btn('Done','v6-start',()=>dlg.close())],false);},err);
 screen('Change passcode',[cur.w,...np.nodes,err,go,btn('Cancel','v6-ghost',()=>dlg.close())],true);cur.i.focus();}
function newRecovery(){askPasscode('Show new recovery code','Enter your passcode to create a new recovery code. Your old recovery code will stop working once you finish.','Continue',async(k)=>{const code=C.newRecoveryCode();recoveryScreen({code,title:'Your new recovery code',intro:'This replaces your old recovery code.',doneLabel:'Done',onDone:async()=>{await saveVaultFields(await C.recoveryFields(k,code,row.kdf_iterations));dlg.close();}});});}
/* ---------- bulk conversion (move in / turn off) ---------- */
const plainPhotos=()=>P.photos().filter(p=>!p.encrypted),vaultPhotos=()=>P.photos().filter(p=>p.encrypted);
async function convertOne(p,toEnc){const c=client(),id=owner(),b=P.bucket,d=await c.storage.from(b).download(p.storage_path);if(d.error||!d.data)throw Error('download');const buf=await toBuf(d.data);let out,note;
 if(toEnc){const u=new Uint8Array(buf,0,2);if(!(u[0]===0xff&&u[1]===0xd8))throw Error('not a jpeg');out=await api.encryptBlob(buf);note=p.note?await api.encryptNote(p.note):'';}
 else{out=await api.decryptPhoto(buf);note=p.note?await api.decryptNote(p.note):'';}
 const nid=crypto.randomUUID(),np=id+'/'+nid+'.jpg',up=await c.storage.from(b).upload(np,out,{contentType:'image/jpeg',upsert:false,cacheControl:'300'});if(up.error)throw Error('upload');
 const ins=await c.from('transformation_photos').insert({id:nid,user_id:id,captured_on:p.captured_on,angle:p.angle,note,storage_path:np,created_at:p.created_at,encrypted:!!toEnc});
 if(ins.error){await c.storage.from(b).remove([np]);throw Error('row');}
 const del=await c.from('transformation_photos').delete().eq('id',p.id).eq('user_id',id);
 if(del.error){await c.from('transformation_photos').delete().eq('id',nid).eq('user_id',id);await c.storage.from(b).remove([np]);throw Error('swap');}
 const rm=await c.storage.from(b).remove([p.storage_path]);return !rm.error;}
function progressScreen(title,total){const bar=el('progress'),txt=para('','pt-note'),stop=btn('Stop','v6-ghost'),s={bar,txt,stop,cancel:false};bar.max=total;bar.value=0;stop.onclick=()=>{s.cancel=true;stop.disabled=true;stop.textContent='Stopping…';};running=true;screen(title,[para('Keep this screen open until it finishes.'),bar,txt,stop],true);return s;}
async function bulk(toEnc){const items=(toEnc?plainPhotos():vaultPhotos());if(!items.length)return{done:0,failed:0,total:0};if(st!=='unlocked'){return null;}
 const s=progressScreen(toEnc?'Moving photos into your vault':'Moving photos out of your vault',items.length),sess=uid;P.setBusy(true);let done=0,failed=0,orphans=0;
 try{for(const p of items){if(s.cancel||sess!==uid||st!=='unlocked')break;s.txt.textContent='Photo '+(done+failed+1)+' of '+items.length+'…';touch();arm();try{const clean=await convertOne(p,toEnc);if(!clean)orphans++;done++;}catch{failed++;}s.bar.value=done+failed;}}
 finally{running=false;P.setBusy(false);}
 await window.stridePhotos.refresh(true);return{done,failed,orphans,total:items.length,cancelled:s.cancel};}
const summary=(r,verb)=>r.done+' of '+r.total+' photo'+(r.total===1?'':'s')+' moved '+verb+'.'+(r.failed?' '+r.failed+' could not be moved and '+(r.failed===1?'was':'were')+' left as they were. You can try again.':'')+(r.orphans?' '+r.orphans+' old file'+(r.orphans===1?'':'s')+' could not be cleaned up.':'');
function startMove(){if(st!=='unlocked')return;const n=plainPhotos().length;if(!n){screen('Nothing to move',[para('All your photos are already in the vault.'),btn('Done','v6-start',()=>dlg.close())]);return;}
 if(P.used()>=P.LIMIT){screen('Free up one photo slot',[para('You have '+P.LIMIT+' of '+P.LIMIT+' photos, so there is no room to make an encrypted copy. Delete one photo, then try again.'),btn('OK','v6-start',()=>dlg.close())]);return;}
 bulk(true).then(r=>{if(!r)return;screen('Move finished',[para(summary(r,'into the vault')),btn('Done','v6-start',()=>dlg.close())]);});}
function turnOff(){if(st!=='unlocked')return;const n=vaultPhotos().length;const go=btn('Decrypt photos and turn off','v6-start pt-del'),err=errBox();
 go.onclick=pending(go,'Working…',async()=>{if(P.used()>=P.LIMIT&&n)throw fail('You have '+P.LIMIT+' of '+P.LIMIT+' photos. Delete one photo first to make room.');await window.stridePhotos.refresh(true);const r=n?await bulk(false):{done:0,failed:0,total:0};if(!r)return;
  if(r.failed||r.cancelled||vaultPhotos().length){screen('Vault is still on',[para(n?summary(r,'out of the vault')+' The vault stays on until every photo is moved.':'Vault stays on.'),btn('Done','v6-start',()=>dlg.close())]);return;}
  const del=await client().from('photo_vaults').delete().eq('user_id',owner());if(del.error){screen('Vault is still on',[para('Photos were moved out, but the vault could not be removed. Try Turn off again.'),btn('Done','v6-start',()=>dlg.close())]);return;}
  row=null;setState('none');screen('Vault turned off',[para('Your photos are back to normal private photos. You can turn the vault on again anytime.'),btn('Done','v6-start',()=>dlg.close())]);},err);
 screen('Turn off Private Vault?',[para(n?'Your '+n+' vault photo'+(n===1?'':'s')+' will be decrypted and saved as normal private photos. They stay private to your account but are no longer end-to-end encrypted.':'You have no vault photos. Your passcode and recovery code will be deleted.'),err,go,btn('Keep vault on','v6-ghost',()=>dlg.close())],true);}
/* ---------- card ---------- */
const cardEl=el('div',undefined,'card');cardEl.id='vaultCard';cardEl.hidden=true;main.insertBefore(cardEl,document.getElementById('photoPick'));
function card(){cardEl.replaceChildren();cardEl.hidden=!['none','locked','unlocked','error'].includes(st)||!owner();if(cardEl.hidden)return;
 const h=el('h3','🔐 Private Vault'),badge=el('span',st==='unlocked'?'Unlocked':st==='locked'?'Locked':st==='none'?'Off':'','v-badge'+(st==='unlocked'?' on':''));if(badge.textContent)h.append(' ',badge);cardEl.append(h);
 if(st==='error'){cardEl.append(para('Could not check your Private Vault right now.','pt-note'),btn('Try again','v6-ghost',()=>load(owner(),true)));return;}
 cardEl.append(para('End-to-end encrypted. Only you can see these photos; not even we can. If you forget your passcode AND lose your recovery code, your vault photos can’t be recovered by anyone.','pt-note v-copy'));
 if(st==='none'){cardEl.append(btn('Turn on Private Vault','v6-start',setupStart));return;}
 if(st==='locked'){cardEl.append(btn('Unlock vault','v6-start',()=>{promptUnlock();}));return;}
 const n=plainPhotos().length;if(n)cardEl.append(btn('Move my '+n+' existing photo'+(n===1?'':'s')+' into the vault','v6-start',startMove));
 const g=el('div',undefined,'v-grid');g.append(btn('Lock now','v6-ghost',lock),btn('Change passcode','v6-ghost',changePasscode),btn('Show new recovery code','v6-ghost',newRecovery),btn('Turn off vault','v6-ghost',turnOff));cardEl.append(g);}
const style=el('style');style.textContent=`#vaultCard{margin:10px 0}#vaultCard h3{margin:0 0 4px}.v-badge{font-size:12px;font-weight:700;padding:2px 8px;border-radius:999px;background:var(--soft);color:var(--muted);vertical-align:middle}.v-badge.on{background:var(--accent);color:var(--on-accent)}
.v-copy{line-height:1.45}.v-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px}.v-grid button{margin:0!important;width:100%;font-size:13.5px!important;padding:10px 6px!important}#vaultCard>button{width:100%}
#vault6 label{display:block;font-weight:700;margin:12px 0 4px}#vault6 input:not([type=checkbox]){width:100%;box-sizing:border-box}#vault6>button,#vault6>p+button{width:100%;margin-top:10px}#vault6 progress{width:100%;height:14px;margin:8px 0}
#vault6 p{margin:8px 0}.v-hint{margin:4px 0 0!important}.v-err{color:#b42318;font-weight:600;font-size:14px;margin:8px 0 0;min-height:0}.v-err:empty{display:none}.v-warn{border-left:3px solid #b42318;padding-left:10px;color:var(--fg)!important}
.v-code{font:700 20px/1.6 ui-monospace,Menlo,Consolas,monospace;letter-spacing:.06em;text-align:center;background:var(--soft);border-radius:14px;padding:16px 8px;margin:12px 0 8px;user-select:all;-webkit-user-select:all;overflow-wrap:anywhere}
.v-row{display:flex;align-items:center;gap:10px}.v-row button{width:auto!important;margin:0!important}.v-check{display:flex!important;gap:10px;align-items:flex-start;font-weight:600!important;margin:14px 0 4px!important}.v-check input{width:22px!important;height:22px;flex:none;margin:0}
.v-link{background:none!important;border:0!important;color:var(--accent)!important;text-decoration:underline;padding:12px 0!important;width:100%;font-size:14px!important}`;document.head.append(style);
/* ---------- public API ---------- */
const need=()=>{if(!dek)throw Error('vault locked');return dek;};
const api={load,unlocked:()=>st==='unlocked'&&!!dek,state:()=>st,lock,promptUnlock,
 uploadMode:()=>st==='unlocked'?'encrypt':st==='locked'?'locked':st==='none'||st==='unavailable'?'plain':'blocked',
 async encryptBlob(b){return new Blob([await C.encryptPhoto(need(),await toBuf(b))],{type:'image/jpeg'});},
 async decryptPhoto(buf){return new Blob([await C.decryptPhoto(need(),buf)],{type:'image/jpeg'});},
 encryptNote:t=>C.encryptNote(need(),t),decryptNote:t=>C.decryptNote(need(),t)};
window.strideVault=api;
window.addEventListener('stride-account-change',()=>{if(loadedFor!==owner())reset();});
window.addEventListener('stride-photos-loaded',card);
card();
})();
