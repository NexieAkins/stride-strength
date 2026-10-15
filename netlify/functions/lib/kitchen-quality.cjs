'use strict';
// Narrow, deterministic backstops. General recipe judgment belongs to the review step.
module.exports=function qualityIssues(meal,input){
const issues=[],ingredients=meal.ingredients.map(i=>i.name).join(' ').toLowerCase(),text=[meal.name,meal.serving,...meal.steps].join(' ').toLowerCase();
const meat=/\b(beef|tripe|offal|chicken|turkey|pork|goat|lamb|mutton|fish|prawns?|shrimp)\b/.test(ingredients);
if(meat&&(/\b(shake|smoothie)\b/.test(meal.name.toLowerCase())||/\bprotein\s+(?:shake\s+)?powder\b/.test(ingredients)))issues.push('Meat/offal must not be turned into a protein shake or smoothie. Choose a separate recognizable savory dish.');
if(/\bgarri\b/.test(ingredients+' '+text)&&/\b(soak\w*|cold water)\b/.test(text)&&/\b(stew|soup|sauce|spinach)\b/.test(text))issues.push('Do not pair cold-soaked garri with savory soup/stew or spinach sauce. Choose a suitable preparation or leave the garri unused.');
if(/\b(assume|assuming)\b.{0,60}\b(pre[ -]?cooked|already cooked|cooked beforehand)\b/.test(text)&&!/\b(pre[ -]?cooked|already cooked|leftover|cooked)\b/i.test(input.ingredients))issues.push('Do not assume ingredients are already cooked to fit the time limit.');
if(/\bnigerian\b/i.test(input.cuisine||input.preference||'')&&/spinach.*egg.*stir[ -]?fry|egg.*spinach.*stir[ -]?fry/i.test(meal.name))issues.push('A generic spinach-and-egg stir-fry does not fulfill the requested Nigerian dish style. Choose a recognizable dish with its proper ingredients and preparation.');
const macroCalories=4*meal.protein_g+4*meal.carbs_g+9*meal.fat_g;
if(Math.abs(meal.calories-macroCalories)>Math.max(60,macroCalories*0.2))issues.push('Estimated calories do not reasonably agree with the supplied macronutrients. Recalculate portions and nutrition.');
return issues;
};
