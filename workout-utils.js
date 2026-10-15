(function(root){
'use strict';
function formatDuration(minutes){const n=Math.max(0,Math.round((Number(minutes)||0)*60)),h=Math.floor(n/3600),m=Math.floor(n%3600/60),s=n%60;return [h?h+' h':'',m?m+' min':'',s?s+' sec':''].filter(Boolean).join(' ')||'0 min';}
function pace(seconds){const n=Math.round(seconds);return Math.floor(n/60)+':'+String(n%60).padStart(2,'0');}
function planDistance(notes){let total=0,count=0;for(const line of (notes||'').split('\n')){const repeat=line.match(/^\s*(\d+)\s*[x×]\s*(\d+(?:\.\d+)?)\s*(?:miles?|mi)\b/i),single=line.match(/^\s*(\d+(?:\.\d+)?)\s*(?:(?:miles?|mi)\s*)?(?:conversational|easy|run\b|hard\b|warm|cool|recovery|tempo)/i);if(repeat){total+=Number(repeat[1])*Number(repeat[2]);count++;}else if(single){total+=Number(single[1]);count++;}}return count?total:null;}
function feedback(w,history=[]){const miles=Number(w.miles)||0,minutes=Number(w.minutes)||0,lines=[];
lines.push('You logged '+miles.toFixed(2)+' miles in '+formatDuration(minutes)+'.');
if(miles>0&&minutes>0){const seconds=minutes*60/miles;lines.push('Average pace: '+pace(seconds)+' per mile · '+(miles*60/minutes).toFixed(1)+' mph.');if(/quality|interval|tempo/i.test(w.type||''))lines.push('This is the whole-session average, including any easy or recovery blocks—not the pace of the faster work alone.');
const previous=history.filter(x=>x.id!==w.id&&x.date<=w.date&&x.type===w.type&&Number(x.miles)>0&&Number(x.minutes)>0&&Math.abs(x.miles-miles)<=miles*.2&&x.session?.status!=='partial').sort((a,b)=>b.date.localeCompare(a.date)).at(0);if(previous){const delta=seconds-previous.minutes*60/previous.miles;lines.push('Compared with your '+previous.date+' '+Number(previous.miles).toFixed(2)+'-mile '+previous.type.toLowerCase()+': '+(Math.abs(delta)<1?'about the same average pace':Math.round(Math.abs(delta))+' sec/mile '+(delta<0?'faster':'slower'))+'. Route, recovery and intended effort can differ.');}}
else lines.push('Add both completed distance and duration to calculate your average pace.');
const planned=planDistance(w.notes);if(planned!==null){lines.push('The distance blocks written in your notes total '+planned.toFixed(2)+' miles.');if(miles&&Math.abs(planned-miles)>.02)lines.push('That differs from the logged distance by '+Math.abs(miles-planned).toFixed(2)+' miles. Check whether the notes include every warm-up, recovery and cool-down block.');}
if(w.energy)lines.push('Reported energy: '+w.energy+'/10.');
if(w.soreness)lines.push('Reported soreness: '+w.soreness+'.');
if(/quality|interval|tempo/i.test(w.type||'')&&!/\bmph\b|\d+:\d{2}\s*(?:\/|per)\s*(?:mi|km)/i.test(w.notes||''))lines.push('For feedback on the faster blocks, include their actual pace or effort. A plan photo can supply targets, but targets do not prove how fast you ran.');
return lines;
}
root.strideWorkoutUtils={formatDuration,pace,planDistance,feedback};if(typeof module==='object')module.exports=root.strideWorkoutUtils;
})(typeof window==='object'?window:globalThis);
