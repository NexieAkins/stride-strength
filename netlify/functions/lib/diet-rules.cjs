// Shared diet rules: the client sends keys; the server expands them into strict instructions.
const RULES={
  halal:'Halal: no pork or pork products (bacon, ham, lard, gelatin from pork), no alcohol in cooking; meat and poultry must be halal.',
  kosher:'Kosher: no pork or shellfish; never combine meat and dairy in the same meal; fish with fins and scales only.',
  vegetarian:'Vegetarian: no meat, poultry or fish; eggs and dairy are fine.',
  vegan:'Vegan: no meat, poultry, fish, eggs, dairy or honey.',
  pescatarian:'Pescatarian: no meat or poultry; fish, seafood, eggs and dairy are fine.',
  noPork:'No pork or pork products.',
  noBeef:'No beef.',
  glutenFree:'Gluten-free: no wheat, barley, rye or regular oats; use gluten-free bread, pasta and oats.',
  dairyFree:'Dairy-free: no milk, cheese, yogurt, butter or cream.',
  eggFree:'Egg-free: no eggs.',
  nutFree:'Nut-free: no peanuts or tree nuts, including nut butters and nut oils.',
  lowCarb:'Lower-carb: keep starches small; favour protein, vegetables and healthy fats.'
};
function sanitize(v){return Array.isArray(v)?[...new Set(v.filter(k=>Object.hasOwn(RULES,k)))]:[];}
function describe(v){return sanitize(v).map(k=>RULES[k]);}
module.exports={RULES,sanitize,describe};
