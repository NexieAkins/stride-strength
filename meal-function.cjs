const assert=require('node:assert/strict');
const {handler}=require('./netlify/functions/analyze-meal');
(async()=>{
 assert.equal((await handler({httpMethod:'GET',headers:{}})).statusCode,405);
 const original=process.env.OPENAI_API_KEY;delete process.env.OPENAI_API_KEY;
 assert.equal((await handler({httpMethod:'POST',headers:{}})).statusCode,503);
 process.env.OPENAI_API_KEY='test-only';
 assert.equal((await handler({httpMethod:'POST',headers:{}})).statusCode,401);
 let calls=[];global.fetch=async(url,options)=>{calls.push({url,options});return url.includes('/auth/v1/user')?{ok:true,json:async()=>({id:'test-user'})}:{ok:true,json:async()=>({choices:[{message:{content:JSON.stringify({food_name:'Toast',calories:220.4,protein_g:7.18,notes:'Approximate'})}}]})}};
 const event={httpMethod:'POST',headers:{authorization:'Bearer test-only'},body:JSON.stringify({description:'Toast',photo:'data:image/jpeg;base64,AA=='})};
 const result=await handler(event);assert.equal(result.statusCode,200);assert.deepEqual(JSON.parse(result.body),{food_name:'Toast',calories:220,protein_g:7.2,notes:'Approximate'});assert.equal(calls.length,2);assert.equal(JSON.parse(calls[1].options.body).messages[1].content[1].type,'image_url');
 assert.equal((await handler({...event,body:'{}'})).statusCode,400);
 assert.equal((await handler({...event,body:JSON.stringify({photo:'bad'})})).statusCode,400);
 global.fetch=async()=>({ok:false});assert.equal((await handler(event)).statusCode,401);
 if(original===undefined)delete process.env.OPENAI_API_KEY;else process.env.OPENAI_API_KEY=original;
 console.log('PASS: original AI function method, missing config/auth, verified token, text+photo payload, nutrition response, invalid input and expired auth. External services mocked.');
})().catch(e=>{console.error(e);process.exit(1)});
