/* Stride & Strength — meal plan overrides.
   The built-in 7-day plan always stays. A generated week replaces all 7 days; a generated day replaces the
   day you are looking at in Menus. "Restore my 7-day plan" removes the changes. */
(() => {
  "use strict";
  const $ = id => document.getElementById(id);
  const owner=()=>window.cloudRecordOwner?.()||'browser';
  const OKEY=()=>"stride-menu-overrides-v1-"+owner();
  const OLD=()=>"stride-strength-active-menu-v4-"+owner();
  const DAYS=["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];
  const read=()=>{try{return JSON.parse(localStorage.getItem(OKEY())||'{}')||{};}catch{return {};}};
  const write=o=>{try{localStorage.setItem(OKEY(),JSON.stringify(o));}catch{}};
  const clean=t=>String(t||'').replace(/\*\*/g,'').replace(/^#{1,6}\s*/gm,'').replace(/^---+$/gm,'').trim();
  const SLOT=/^(breakfast|lunch|dinner|supper|snacks?|morning snack|afternoon snack|evening snack)\b/i;
  const slotName=s=>/breakfast/i.test(s)?'Breakfast':/lunch/i.test(s)?'Lunch':/dinner|supper/i.test(s)?'Dinner':'Snack';
  const num=(re,s)=>{const m=String(s).match(re);return m?Number(m[1]):0;};
  // Parse one day's text into meals [{slot,name,kcal,protein}]
  function parseDay(text){
    const meals=[];let cur=null;
    for(const raw of clean(text).split(/\n/)){
      const line=raw.replace(/^[-*•]\s*/,'').trim();if(!line||/^(daily )?totals?\b/i.test(line)||/^--+$/.test(line))continue;
      const m=line.match(/^([A-Za-z ]{3,20}?)\s*[:—–-]\s*(.*)$/);
      if(m&&SLOT.test(m[1].trim())){cur={slot:slotName(m[1]),items:[],kcal:0,protein:0};meals.push(cur);if(m[2])add(cur,m[2]);continue;}
      if(SLOT.test(line)&&line.length<30){cur={slot:slotName(line),items:[],kcal:0,protein:0};meals.push(cur);continue;}
      if(cur)add(cur,line);
    }
    function add(c,s){const k=num(/(\d+(?:\.\d+)?)\s*kcal/i,s),p=num(/(\d+(?:\.\d+)?)\s*g\s*(?:of\s*)?protein/i,s);c.kcal+=k;c.protein+=p;const nm=s.replace(/\s*[—–-]\s*\d.*$/,'').replace(/\s*\((?:approx\.?\s*)?[^)]*kcal[^)]*\)/i,'').replace(/,\s*(about|approx\.?)\s.*$/i,'').trim();if(nm&&!/^\d/.test(nm))c.items.push(nm);}
    return meals.filter(x=>x.items.length).map(x=>({slot:x.slot,name:x.items.join(' + ').slice(0,160),kcal:Math.round(x.kcal),protein:Math.round(x.protein)}));
  }
  function splitWeek(text){
    const content=clean(text);const pat=/(?:^|\n)\s*(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\b\s*[:—–-]?/gi;
    const ms=[...content.matchAll(pat)];const out={};
    ms.forEach((m,i)=>{const day=m[1][0].toUpperCase()+m[1].slice(1).toLowerCase();out[day]=content.slice(m.index+m[0].length,ms[i+1]?ms[i+1].index:content.length);});
    return out;
  }
  const toast=t=>{let el=$('toast6');if(!el){el=document.createElement('div');el.id='toast6';document.body.append(el);const st=document.createElement('style');st.textContent='#toast6{position:fixed;left:50%;bottom:calc(104px + env(safe-area-inset-bottom,0px));transform:translateX(-50%);z-index:80;background:var(--accent);color:var(--on-accent);font-weight:700;padding:12px 18px;border-radius:14px;box-shadow:0 10px 30px rgba(0,0,0,.4);max-width:88vw;text-align:center;transition:opacity .3s}#toast6[hidden]{display:block!important;opacity:0;pointer-events:none}';document.head.append(st);}el.textContent=t;el.hidden=false;clearTimeout(el._t);el._t=setTimeout(()=>el.hidden=true,2600);};
  window.strideToast=toast;
  function apply(text){
    const week=splitWeek(text),keys=Object.keys(week);const o=read();
    if(keys.length>=5){let n=0;keys.forEach(d=>{const meals=parseDay(week[d]);if(meals.length){o[d]=meals;n++;}});write(o);return n?('✓ Added '+n+' days to your meal plan'):null;}
    const meals=parseDay(text);if(!meals.length)return null;
    const day=window.strideMenuDay?.()||DAYS[(new Date().getDay()+6)%7];o[day]=meals;write(o);return '✓ Added to '+day+' in your meal plan';
  }
  window.strideMenuOverride=day=>read()[day]||null;
  window.strideMenuHasOverrides=()=>Object.keys(read()).length>0;
  window.strideMenuRestore=day=>{const o=read();if(day)delete o[day];else Object.keys(o).forEach(k=>delete o[k]);write(o);};
  // Migrate the old "active menu" (which replaced the whole plan) into a one-day change for today.
  try{const old=localStorage.getItem(OLD());if(old){apply(old);localStorage.removeItem(OLD());}}catch{}
  // Save menu → add to meal plan (and still keep it under "My saved menu").
  const save=$("menuSave");
  if(save){save.textContent='Add to my meal plan';save.addEventListener("click",()=>{const t=$("menuDraft")?.value||'';const msg=apply(t);setTimeout(()=>{const st=$('menuStatus');if(st)st.textContent=msg?msg+' · also saved under My saved menu.':'Saved under My saved menu. (Couldn’t read meals from it to add to your plan.)';toast(msg||'✓ Menu saved');window.__mv6refresh?.();},50);});}
  // Week option in the planner
  const act=$('menuAction');if(act&&![...act.options].some(o=>o.value==='week')){const op=document.createElement('option');op.value='week';op.textContent='Build my week (7 days)';act.prepend(op);act.value='week';}
  const old=document.querySelector('#menuResult ~ button, button');[...document.querySelectorAll('button')].forEach(b=>{if(/^Restore Default Meal Plan$/.test(b.textContent.trim()))b.remove();});
})();
