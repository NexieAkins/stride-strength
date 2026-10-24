const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),out=path.join(root,'dist');
const files=['index.html','privacy.html','app-polish.css','v4.js','train-planner.js','session-tracker.js','starting-weights.js','daily-nutrition-achievements.js','menu-builder.js','meal-finish.js','clean-layout.js','kitchen.js','transformation-photos.js','v5-ui.js','train-layout.js','progressions.js','meal-layout.js','onboarding.js','nutrition-targets.js','workout-checkin.js','workout-utils.js','training-loads.js','energy-estimate.js','run-tracking-utils.js','run-tracker.js','photo-input.js','equipment-photo.js','workout-history.js','running-plan-utils.js','running-plan.js','training-context.js','run-log.js','tidy.js','ux-feedback.js','photo-multi.js','redesign.js','redesign-train.js','redesign-rest.js','pictures.js','barcode.js','scenes.js','exercise-help.js','native-feel.js','train-extras.js','favicon.png','apple-touch-icon.png','icon-512.png','exercise-index.json'];
fs.mkdirSync(out,{recursive:true});
for(const file of files)fs.copyFileSync(path.join(root,file),path.join(out,file));
console.log('Built '+files.length+' application files.');
