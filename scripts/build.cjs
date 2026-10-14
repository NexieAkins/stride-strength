const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),out=path.join(root,'dist');
const files=['index.html','app-polish.css','v4.js','train-planner.js','session-tracker.js','daily-nutrition-achievements.js','menu-builder.js','meal-finish.js','clean-layout.js','kitchen.js','transformation-photos.js','v5-ui.js'];
fs.mkdirSync(out,{recursive:true});
for(const file of files)fs.copyFileSync(path.join(root,file),path.join(out,file));
console.log('Built '+files.length+' application files.');
