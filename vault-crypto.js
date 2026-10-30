/* Private Vault crypto primitives (WebCrypto only, no libraries, no storage of secrets).
   DEK: random AES-GCM-256 data key. Passcode and recovery code each derive a KEK with PBKDF2-SHA256
   that wraps the same DEK. Photo blob = 'SSV1' || iv(12) || AES-GCM ciphertext. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.strideVaultCrypto=api;})(typeof self!=='undefined'?self:this,function(){
'use strict';
const ITER=600000,MIN_ITER=100000,MAX_ITER=5000000,ALPHABET='0123456789ABCDEFGHJKMNPQRSTVWXYZ',MAGIC=[0x53,0x53,0x56,0x31];
const subtle=()=>{const c=globalThis.crypto;if(!c?.subtle||!c.getRandomValues)throw Error('Encryption is not available on this device.');return c.subtle;};
const rand=n=>globalThis.crypto.getRandomValues(new Uint8Array(n));
const enc=s=>new TextEncoder().encode(s);
function b64(bytes){bytes=bytes instanceof Uint8Array?bytes:new Uint8Array(bytes);let s='';for(let i=0;i<bytes.length;i+=0x8000)s+=String.fromCharCode.apply(null,bytes.subarray(i,i+0x8000));return btoa(s);}
function unb64(s){const bin=atob(String(s||''));const out=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)out[i]=bin.charCodeAt(i);return out;}
const concat=(...a)=>{const out=new Uint8Array(a.reduce((n,x)=>n+x.length,0));let o=0;for(const x of a){out.set(x,o);o+=x.length;}return out;};
function normalizeRecovery(s){return String(s||'').toUpperCase().replace(/[\s-]+/g,'').replace(/O/g,'0').replace(/[IL]/g,'1');}
function validRecovery(s){const n=normalizeRecovery(s);return n.length===24&&[...n].every(c=>ALPHABET.includes(c));}
function newRecoveryCode(){const r=rand(24);let s='';for(let i=0;i<24;i++)s+=ALPHABET[r[i]&31];return s;} // 256 % 32 == 0: no bias
function formatRecovery(s){return normalizeRecovery(s).match(/.{1,4}/g).join('-');}
const secretBytes=(secret,recovery)=>enc(recovery?normalizeRecovery(secret):String(secret).normalize('NFKC'));
async function deriveKEK(secret,salt,iterations,recovery){if(!(iterations>=MIN_ITER&&iterations<=MAX_ITER))throw Error('Vault settings look invalid.');const s=subtle();const base=await s.importKey('raw',secretBytes(secret,recovery),'PBKDF2',false,['deriveKey']);return s.deriveKey({name:'PBKDF2',hash:'SHA-256',salt,iterations},base,{name:'AES-GCM',length:256},false,['wrapKey','unwrapKey']);}
const newDEK=()=>subtle().generateKey({name:'AES-GCM',length:256},true,['encrypt','decrypt']);
async function wrapDEK(dek,kek){const iv=rand(12);const w=await subtle().wrapKey('raw',dek,kek,{name:'AES-GCM',iv});return b64(concat(iv,new Uint8Array(w)));}
function unwrapDEK(wrapped,kek,extractable){const b=unb64(wrapped);if(b.length<12+32)return Promise.reject(Error('bad wrapped key'));return subtle().unwrapKey('raw',b.subarray(12),kek,{name:'AES-GCM',iv:b.subarray(0,12)},{name:'AES-GCM',length:256},!!extractable,['encrypt','decrypt']);}
/* Build the stored vault fields from a DEK + passcode + recovery code. */
async function buildVault(dek,passcode,recoveryCode,iterations=ITER){const ks=rand(16),rs=rand(16);const [pk,rk]=await Promise.all([deriveKEK(passcode,ks,iterations,false),deriveKEK(recoveryCode,rs,iterations,true)]);return{version:1,kdf_salt:b64(ks),kdf_iterations:iterations,wrapped_key:await wrapDEK(dek,pk),recovery_salt:b64(rs),recovery_wrapped_key:await wrapDEK(dek,rk)};}
async function passcodeFields(dek,passcode,iterations=ITER){const ks=rand(16);const k=await deriveKEK(passcode,ks,iterations,false);return{kdf_salt:b64(ks),kdf_iterations:iterations,wrapped_key:await wrapDEK(dek,k)};}
async function recoveryFields(dek,recoveryCode,iterations){const rs=rand(16);const k=await deriveKEK(recoveryCode,rs,iterations,true);return{recovery_salt:b64(rs),recovery_wrapped_key:await wrapDEK(dek,k)};}
async function unwrapWithPasscode(row,passcode,extractable){return unwrapDEK(row.wrapped_key,await deriveKEK(passcode,unb64(row.kdf_salt),row.kdf_iterations,false),extractable);}
async function unwrapWithRecovery(row,code,extractable){return unwrapDEK(row.recovery_wrapped_key,await deriveKEK(code,unb64(row.recovery_salt),row.kdf_iterations,true),extractable);}
async function seal(dek,bytes){const iv=rand(12);const ct=new Uint8Array(await subtle().encrypt({name:'AES-GCM',iv},dek,bytes));return concat(iv,ct);}
async function open(dek,bytes){if(bytes.length<12+16)throw Error('bad data');return new Uint8Array(await subtle().decrypt({name:'AES-GCM',iv:bytes.subarray(0,12)},dek,bytes.subarray(12)));}
async function encryptPhoto(dek,data){const bytes=new Uint8Array(data);return concat(Uint8Array.from(MAGIC),await seal(dek,bytes));}
const isVaultBytes=d=>{const b=d instanceof Uint8Array?d:new Uint8Array(d);return b.length>=4&&MAGIC.every((m,i)=>b[i]===m);};
async function decryptPhoto(dek,data){const bytes=new Uint8Array(data);if(!isVaultBytes(bytes))throw Error('not a vault photo');return open(dek,bytes.subarray(4));}
async function encryptNote(dek,text){return 'enc1:'+b64(await seal(dek,enc(text)));}
async function decryptNote(dek,stored){if(!String(stored).startsWith('enc1:'))return String(stored||'');return new TextDecoder().decode(await open(dek,unb64(stored.slice(5))));}
function strength(p){p=String(p||'');let s=0;if(p.length>=6)s++;if(p.length>=10)s++;if(p.length>=14)s++;if(/[a-z]/.test(p)&&/[A-Z]/.test(p))s++;if(/\d/.test(p))s++;if(/[^A-Za-z0-9]/.test(p))s++;if(/^(.)\1+$/.test(p)||/^(0123|1234|abcd|password|qwerty)/i.test(p))s=Math.min(s,1);return p.length<6?0:s<=2?1:s<=4?2:3;}
return{ITER,ALPHABET,MAGIC,b64,unb64,normalizeRecovery,validRecovery,newRecoveryCode,formatRecovery,deriveKEK,newDEK,wrapDEK,unwrapDEK,buildVault,passcodeFields,recoveryFields,unwrapWithPasscode,unwrapWithRecovery,encryptPhoto,decryptPhoto,isVaultBytes,encryptNote,decryptNote,strength};
});
