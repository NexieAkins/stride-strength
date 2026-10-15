'use strict';
const assert=require('node:assert/strict'),guide=require('./netlify/functions/lib/kitchen-cuisine.cjs'),quality=require('./netlify/functions/lib/kitchen-quality.cjs'),{handler}=require('./netlify/functions/plan-kitchen');
const ingredients=['flattened rice','paneer','spinach','onion','tomato','cumin','mustard seeds','oil','rice','lentils'];
const input={ingredients:ingredients.join(', '),cuisine:'Indian',preference:'Vegetarian home cooking',count:4,minutes:60,mode:'available',calories:1900,protein:100};
const meal=(name,meal_type)=>({name,meal_type,serving:'1 portion',minutes:30,calories:300,protein_g:15,carbs_g:35,fat_g:11,fiber_g:4,ingredients:[{name:'rice',amount:'1 portion',from_kitchen:true}],steps:['Cook the listed ingredients.']});
const four=[meal('Poha','Breakfast'),meal('Dal with rice','Lunch'),meal('Palak paneer with rice','Dinner'),meal('Light poha','Snack')];
assert.match(guide(input),/flattened rice/);assert.match(guide({cuisine:'Nigerian'}),/egg sauce/);assert.doesNotMatch(guide({cuisine:'Indian'}),/eba/);assert.match(guide({cuisine:'Mexican'}),/unrelated generic dish/);assert.equal(guide({cuisine:'',preference:''}),'');
assert.ok(quality({...four[0],name:'Spinach and Egg Stir-fry'}, {...input,cuisine:'Nigerian'}).some(s=>s.includes('Nigerian dish style')));
const request={httpMethod:'POST',headers:{authorization:'Bearer test'},body:JSON.stringify(input)};
const plan=meals=>({title:'Home meals',note:'Use the listed pantry ingredients.',meals});
(async()=>{process.env.OPENAI_API_KEY='test';let calls=[];
global.fetch=async(url,options)=>{if(url.includes('/auth/v1/user'))return {ok:true,json:async()=>({id:'user'})};const payload=JSON.parse(options.body);calls.push(payload);return {ok:true,json:async()=>({choices:[{message:{content:JSON.stringify(plan(calls.length===1?four.slice(0,3):four))}}]})};};
let response=await handler(request),data=JSON.parse(response.body);assert.equal(response.statusCode,200);assert.equal(data.complete,true);assert.equal(data.meals.length,4);assert.equal(data.requested_meals,4);assert.deepEqual(data.missing_meal_slots,[]);assert.equal(data.cuisine,'Indian');assert.equal(calls.length,2);assert.match(calls[0].messages[1].content,/flattened rice/);assert.match(calls[1].messages[1].content,/missing_meal_slots.*Snack/);
// A review that still omits dinner cannot masquerade as a complete four-meal day.
let count=0;global.fetch=async url=>{if(url.includes('/auth/v1/user'))return {ok:true,json:async()=>({id:'user'})};count++;return {ok:true,json:async()=>({choices:[{message:{content:JSON.stringify(plan([four[0],four[1],four[3]]))}}]})};};
response=await handler(request);data=JSON.parse(response.body);assert.equal(count,3);assert.equal(data.complete,false);assert.equal(data.meals.length,3);assert.deepEqual(data.missing_meal_slots,['Dinner']);assert.match(data.note,/Still needed: Dinner/);assert.doesNotMatch(data.note,/Use the listed pantry ingredients/);assert.equal(response.headers['X-Kitchen-Planner-Version'],'4');
console.log('PASS: explicit cuisine flows to both stages, Indian/Nigerian grounding stays separate, missing fourth meal repaired, and unresolved shortages marked incomplete.');
})().catch(e=>{console.error(e);process.exit(1)});
