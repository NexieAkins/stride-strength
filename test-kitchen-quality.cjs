'use strict';
const assert=require('node:assert/strict');
const quality=require('./netlify/functions/lib/kitchen-quality.cjs');
const {handler}=require('./netlify/functions/plan-kitchen');
const ingredient=name=>({name,amount:'1 portion',from_kitchen:true});
const garri={name:'Garri with Spinach and Egg Stew',meal_type:'Dinner',serving:'1 bowl',minutes:30,calories:600,protein_g:28,carbs_g:70,fat_g:8,fiber_g:6,ingredients:['Garri','Spinach','Eggs','Tomato','Habanero pepper'].map(ingredient),steps:['Pour cold water over garri and soak.','Cook spinach and eggs in tomato sauce.','Serve the stew alongside soaked garri.']};
const shake={...garri,name:'Beef and Tripe Protein Shake with Oatmeal',meal_type:'Breakfast',minutes:15,calories:620,protein_g:45,carbs_g:50,fat_g:12,fiber_g:4,ingredients:['Protein shake powder','Oatmeal','Beef','Tripe'].map(ingredient),steps:['Cook beef and tripe until tender; allow 45–60 minutes; assume pre-cooked here.','Blend protein shake powder with water.','Mix beef and tripe with oatmeal and consume with the shake.']};
const input={ingredients:'Garri, spinach, eggs, tomato, habanero pepper, protein shake powder, oatmeal, beef, tripe',avoid:'',preference:'',count:3,minutes:30,mode:'available',calories:1900,protein:110};
assert.ok(quality(garri,input).some(s=>s.includes('cold-soaked')));assert.ok(quality(shake,input).some(s=>s.includes('Meat/offal')));assert.ok(quality(shake,input).some(s=>s.includes('already cooked')));assert.ok(quality(shake,input).some(s=>s.includes('macronutrients')));
const renamed={...shake,name:'Breakfast oatmeal bowl',calories:488};assert.ok(quality(renamed,input).some(s=>s.includes('Meat/offal')));
const good={name:'Tomato and spinach omelette',meal_type:'Breakfast',serving:'1 omelette',minutes:15,calories:280,protein_g:20,carbs_g:5,fat_g:20,fiber_g:2,ingredients:['Eggs','Spinach','Tomato'].map(ingredient),steps:['Cook the tomato and spinach in a nonstick pan with a splash of water.','Add beaten eggs and cook through.']};
assert.deepEqual(quality(good,input),[]);
const eba={...garri,name:'Eba with spinach soup',calories:602,carbs_g:100,fat_g:10,steps:['Bring water to a boil. Stir garri into the hot water until a smooth dough forms.','Prepare spinach soup with eggs and tomato; serve separately with eba.']};assert.deepEqual(quality(eba,input),[]);
const event={httpMethod:'POST',headers:{authorization:'Bearer test'},body:JSON.stringify(input)};
const plan=meals=>({title:'Kitchen plan',note:'Leave ingredients unused when they do not fit.',meals});
(async()=>{
process.env.OPENAI_API_KEY='test';let requests=[];
global.fetch=async(url,options)=>{if(url.includes('/auth/v1/user'))return {ok:true,json:async()=>({id:'user'})};requests.push(JSON.parse(options.body));return {ok:true,json:async()=>({choices:[{message:{content:JSON.stringify(requests.length===1?plan([garri,shake]):plan([good]))}}]})};};
let response=await handler(event);assert.equal(response.statusCode,200);assert.equal(requests.length,3);let output=JSON.parse(response.body);assert.deepEqual(output.meals.map(m=>m.name),[good.name]);assert.equal(output.planner_version,4);assert.equal(response.headers['X-Kitchen-Planner-Version'],'4');assert.match(requests[1].messages[1].content,/cold-soaked/);assert.match(requests[1].messages[1].content,/Meat\/offal/);
// Even if the second model repeats both mistakes, neither recipe can reach the user.
global.fetch=async url=>url.includes('/auth/v1/user')?{ok:true,json:async()=>({id:'user'})}:{ok:true,json:async()=>({choices:[{message:{content:JSON.stringify(plan([garri,shake,good]))}}]})};
response=await handler(event);assert.equal(response.statusCode,200);output=JSON.parse(response.body);assert.deepEqual(output.meals.map(m=>m.name),[good.name]);
// Keep an otherwise sensible dish when the only defect is calorie arithmetic.
global.fetch=async url=>url.includes('/auth/v1/user')?{ok:true,json:async()=>({id:'user'})}:{ok:true,json:async()=>({choices:[{message:{content:JSON.stringify({title:'Three meals',note:'This plan includes three meals.',meals:[{...good,calories:900}]})}}]})};
response=await handler(event);output=JSON.parse(response.body);assert.equal(output.meals.length,1);assert.equal(output.meals[0].calories,280);assert.doesNotMatch(output.note,/includes three meals/);assert.match(output.note,/Still needed: Lunch, Dinner/);
// A failed review must never fall back to the unchecked first draft.
let count=0;global.fetch=async url=>{if(url.includes('/auth/v1/user'))return {ok:true,json:async()=>({id:'user'})};return ++count===1?{ok:true,json:async()=>({choices:[{message:{content:JSON.stringify(plan([good]))}}]})}:{ok:false};};assert.equal((await handler(event)).statusCode,502);
console.log('PASS: screenshot regressions, renamed meat/powder dishes, assumed prep, calorie consistency, legitimate eba, independent repair, fail-closed review and final deterministic filtering.');
})().catch(e=>{console.error(e);process.exit(1)});
