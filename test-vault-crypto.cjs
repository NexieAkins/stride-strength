const assert=require('node:assert/strict');const C=require('./vault-crypto.js');
(async()=>{
const dek=await C.newDEK(),code=C.newRecoveryCode();assert.equal(code.length,24);assert.ok(C.validRecovery(code));
assert.equal(C.normalizeRecovery('abcd-efgh ijkl-oo'),'ABCDEFGH1JK100'.replace('1JK100','1JK100'));
assert.equal(C.formatRecovery(code).split('-').length,6);
const row=await C.buildVault(dek,'correct horse',C.formatRecovery(code),100000+500000);
assert.equal(row.kdf_iterations,600000);assert.equal(C.unb64(row.kdf_salt).length,16);
const a=await C.unwrapWithPasscode(row,'correct horse',false);assert.equal(a.extractable,false);
await assert.rejects(C.unwrapWithPasscode(row,'wrong',false));
const b=await C.unwrapWithRecovery(row,C.formatRecovery(code).toLowerCase().replace(/1/g,'i'),true);assert.equal(b.extractable,true);
await assert.rejects(C.unwrapWithRecovery(row,C.newRecoveryCode(),false));
const jpeg=Uint8Array.from([0xff,0xd8,0xff,0xe0,1,2,3,4,5]);const e=await C.encryptPhoto(a,jpeg);
assert.equal(Buffer.from(e.subarray(0,4)).toString(),'SSV1');assert.notEqual(e[4],undefined);assert.ok(!(e[0]===0xff&&e[1]===0xd8));
assert.deepEqual([...await C.decryptPhoto(b,e)],[...jpeg]);
const e2=await C.encryptPhoto(a,jpeg);assert.notDeepEqual([...e],[...e2]);
const bad=Uint8Array.from(e);bad[bad.length-1]^=1;await assert.rejects(C.decryptPhoto(a,bad));
await assert.rejects(C.decryptPhoto(a,jpeg));
const n=await C.encryptNote(a,'Felt strong 💪');assert.match(n,/^enc1:/);assert.equal(await C.decryptNote(b,n),'Felt strong 💪');
// rewrap with new passcode
const pf=await C.passcodeFields(b,'new passcode');const row2={...row,...pf};
await assert.rejects(C.unwrapWithPasscode(row2,'correct horse',false));
const c=await C.unwrapWithPasscode(row2,'new passcode',false);assert.deepEqual([...await C.decryptPhoto(c,e)],[...jpeg]);
await C.unwrapWithRecovery(row2,code,false);
assert.ok(C.strength('abc')===0&&C.strength('abcdef')<=1&&C.strength('Tr0ub4dor&3xyz')===3);
console.log('vault-crypto ok');})().catch(e=>{console.error(e);process.exit(1)});
