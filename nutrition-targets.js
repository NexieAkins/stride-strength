// Mifflin–St Jeor resting-energy estimate, with editable activity and goal adjustments.
// Equation: https://pubmed.ncbi.nlm.nih.gov/2305711/
// Protein range: https://pmc.ncbi.nlm.nih.gov/articles/PMC5477153/
(function(root){
'use strict';
function estimate(profile,weightLb){
const age=Number(profile.age_years),height=Number(profile.height_cm),weight=Number(weightLb||profile.starting_weight_lb),factor={sedentary:1.2,light:1.375,moderate:1.55,high:1.725}[profile.activity_level];
if(['pregnant','breastfeeding','manual'].includes(profile.nutrition_context)||profile.nutrition_mode!=='auto'||!['female','male'].includes(profile.calorie_equation)||!factor||!Number.isFinite(age)||age<18||age>100||!Number.isFinite(height)||height<50||height>260||!Number.isFinite(weight)||weight<30||weight>700||!['consistency','strength','endurance','weight_loss','maintenance'].includes(profile.fitness_goal))return null;
const kg=weight/2.20462262,resting=10*kg+6.25*height-5*age+(profile.calorie_equation==='male'?5:-161),maintenance=resting*factor;
const adjusted=maintenance-(profile.fitness_goal==='weight_loss'?300:0);
const calories=Math.round(Math.max(1500,resting,adjusted)/10)*10;
const protein=Math.round(kg*(['strength','weight_loss'].includes(profile.fitness_goal)?1.6:profile.fitness_goal==='endurance'?1.4:1.2));
return {calories,protein,maintenance:Math.round(maintenance),weightLb:weight};
}
root.strideNutritionEstimate=estimate;if(typeof module==='object')module.exports=estimate;
})(typeof window==='object'?window:globalThis);
