/* Set table (flag: STRIDE_FLAGS.newSetTable).
   Re-styles and re-arranges the EXISTING set rows of #sessionTracker into a clean fixed-column table:
   SET · PREVIOUS · LB/KG · REPS (or SECONDS) · ✓. Every original input, checkbox, timer and handler is kept,
   so saving, timers and the rest timer behave exactly as before. When the flag is off this file does nothing. */
(()=>{
'use strict';
if(!window.STRIDE_FLAGS||!window.STRIDE_FLAGS.newSetTable)return;
const T=()=>window.strideSessionTracker;
const KG=2.20462;
const num=v=>(v===null||v===undefined||v==='')?NaN:Number(v);
const key=n=>String(n||'').trim().toLowerCase();
const lbOf=(w,u)=>u==='kg'?w*KG:w;
const fmtN=n=>{const r=Math.round(n*100)/100;return String(r)};
const el=(tag,props={},kids=[])=>{const n=Object.assign(document.createElement(tag),props);for(const k of [].concat(kids))n.append(k);return n};

/* ---------- history lookups ---------- */
function history(){
  const ws=(typeof db!=='undefined'&&db.workouts||[]).map((w,i)=>({w,i})).filter(x=>x.w&&x.w.session&&Array.isArray(x.w.session.exercises));
  ws.sort((a,b)=>String(b.w.date||'').localeCompare(String(a.w.date||''))||b.i-a.i);
  return ws.map(x=>x.w);
}
function lastFor(hist,name,idx){
  const k=key(name);
  for(const w of hist){
    const e=w.session.exercises.find(x=>key(x.name)===k&&Array.isArray(x.sets)&&x.sets.some(t=>t&&t.done));
    if(!e)continue;
    const done=e.sets.map((t,i)=>({t,i})).filter(x=>x.t&&x.t.done);
    const pick=done.find(x=>x.i===idx)||done[done.length-1];
    return pick?pick.t:null;
  }
  return null;
}
function bestFor(hist,name){
  const k=key(name);let best=null;
  for(const w of hist)for(const e of w.session.exercises){
    if(key(e.name)!==k||!Array.isArray(e.sets))continue;
    for(const t of e.sets){
      if(!t||!t.done)continue;const wt=num(t.weight),r=num(t.reps);
      if(!(wt>0)||!(r>0))continue;const cand=[Math.round(lbOf(wt,t.weightUnit)*100)/100,r];
      if(!best||cand[0]>best[0]||(cand[0]===best[0]&&cand[1]>best[1]))best=cand;
    }
  }
  return best;
}
/* index of the done set in this exercise that beats history's best (heaviest first, then reps), or -1 */
function prIndex(ex,best){
  if(!best)return -1;let top=null,at=-1;
  ex.sets.forEach((t,i)=>{
    if(!t||!t.done)return;const wt=num(t.weight),r=num(t.reps);if(!(wt>0)||!(r>0))return;
    const cand=[Math.round(lbOf(wt,t.weightUnit)*100)/100,r];
    if(!top||cand[0]>top[0]||(cand[0]===top[0]&&cand[1]>top[1])){top=cand;at=i;}
  });
  if(!top)return -1;
  return(top[0]>best[0]||(top[0]===best[0]&&top[1]>best[1]))?at:-1;
}
function prevText(t,cur){
  const r=num(t.reps),w=num(t.weight),bw=t.weightUnit==='bodyweight'||!(w>0);
  if(!(r>0)&&!(w>0))return '';
  const timed=/second|minute/i.test(t.unit||'');
  if(timed&&bw)return fmtN(r)+(/minute/i.test(t.unit)?' min':' s');
  if(bw)return 'BW × '+fmtN(r);
  const u=t.weightUnit&&cur&&t.weightUnit!==cur?' '+t.weightUnit:'';
  return fmtN(w)+u+' × '+(r>0?fmtN(r):'—');
}

/* ---------- DOM helpers ---------- */
function fire(input,value){
  input.value=value;input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true}));
}
const labelOf=(row,re)=>[...row.children].find(c=>c.tagName==='LABEL'&&re.test(c.firstChild?.textContent||''));
const toast=m=>{try{window.strideToast?.(m);}catch(e){}};

const seen={sid:null,done:{},toasted:{}};
function toastCheck(s){
  if(seen.sid!==s.id){seen.sid=s.id;seen.done={};s.exercises.forEach((e,ei)=>e.sets.forEach((t,si)=>{seen.done[ei+':'+si]=!!t.done;}));return;}
}

function unitName(ex){
  const first=ex.sets.find(t=>t.weightUnit!=='bodyweight');
  return first?first.weightUnit:'bodyweight';
}
function cycleUnit(ex,card){
  const order=['lb','kg','bodyweight'];const cur=unitName(ex)==='bodyweight'&&ex.sets.every(t=>t.weightUnit==='bodyweight')?'bodyweight':unitName(ex);
  const next=order[(order.indexOf(cur)+1)%order.length];
  card.querySelectorAll(':scope > fieldset select[data-bw7],:scope > fieldset select').forEach(sl=>{
    if(![...sl.options].some(o=>o.value==='bodyweight'))return;if(sl.value===next)return;sl.value=next;sl.dispatchEvent(new Event('change',{bubbles:true}));
  });
}

function processCard(card,s,hist){
  const ei=Number(card.dataset.exerciseIndex);const ex=s.exercises[ei];if(!ex)return;
  const rows=[...card.querySelectorAll(':scope > fieldset.v6-set')];
  if(!rows.length||rows.length!==ex.sets.length)return;
  card.classList.add('st8-ex');
  const best=bestFor(hist,ex.name),pr=prIndex(ex,best);
  const timedEx=rows.some(r=>r.classList.contains('ts6-row'))||ex.sets.some(t=>/second|minute/i.test(t.unit||''));
  const repsHead=timedEx?(ex.sets.some(t=>/minute/i.test(t.unit||''))?'MINUTES':'SECONDS'):'REPS';
  const unit=unitName(ex);
  const allBw=ex.sets.every(t=>t.weightUnit==='bodyweight');
  /* header (once per exercise) */
  let head=card.querySelector(':scope > .st8-head');
  if(!head){
    head=el('div',{className:'st8-head'});
    head.append(el('span',{textContent:'SET'}),el('span',{className:'st8-hp',textContent:'PREVIOUS'}),
      Object.assign(el('button',{type:'button',className:'st8-hu'}),{}),el('span',{className:'st8-hr'}),el('span',{className:'st8-hc',textContent:'✓'}));
    head.children[2].onclick=()=>cycleUnit(ex,card);
    head.children[2].setAttribute('aria-label','Change load unit');
    rows[0].before(head);
  }
  const unitLabel=allBw?'LOAD':unit.toUpperCase();
  if(head.children[2].textContent!==unitLabel+' ⇅')head.children[2].textContent=unitLabel+' ⇅';
  if(head.children[3].textContent!==repsHead)head.children[3].textContent=repsHead;
  /* rows */
  rows.forEach((row,si)=>{
    const t=ex.sets[si];
    if(!row.classList.contains('st8')){
      row.classList.add('st8');
      const no=row.querySelector('.v6-setno');
      const nb=el('button',{type:'button',className:'st8-no',textContent:no?no.textContent:String(si+1)});
      nb.setAttribute('aria-label','Set '+(si+1)+' options');nb.setAttribute('aria-expanded','false');
      nb.onclick=()=>{const o=row.classList.toggle('st8-open');nb.setAttribute('aria-expanded',String(o));};
      const prev=el('button',{type:'button',className:'st8-prev'});
      row.prepend(nb,prev);
      const reps=labelOf(row,/^Actual/),load=labelOf(row,/^Weight/),unitL=labelOf(row,/^Load unit/),ck=row.querySelector('label.v6-ck');
      reps?.classList.add('st8-reps');load?.classList.add('st8-load');unitL?.classList.add('st8-unit');ck?.classList.add('st8-ck');
      reps?.querySelector('input')?.setAttribute('inputmode',timedEx?'numeric':'numeric');
      load?.querySelector('input')?.setAttribute('inputmode','decimal');
      /* remove-set moves into a compact row menu (the original button and its handler are kept) */
      const rm=row.querySelector('button.v6-rm');
      const menu=el('div',{className:'st8-menu'});
      const mb=el('button',{type:'button',className:'st8-rmbtn',textContent:'Remove set '+(si+1)});
      mb.onclick=()=>{if(rm&&!rm.disabled)rm.click();};
      menu.append(mb);row.append(menu);
      /* bodyweight tag shown in the load column */
      const bwb=el('button',{type:'button',className:'st8-bw',textContent:'BW'});bwb.setAttribute('aria-label','Bodyweight set. Tap to add a load');
      bwb.onclick=()=>{const sl=row.querySelector('select');if(sl){sl.value='lb';sl.dispatchEvent(new Event('change',{bubbles:true}));}};
      row.append(bwb);
    }
    /* live bits */
    /* timer buttons sit on their own line under the row (they may be added after the row is first seen) */
    const tm=[...row.querySelectorAll(':scope > button.tmr6')];
    if(tm.length){let w=row.querySelector(':scope > .st8-tmr');if(!w){w=el('div',{className:'st8-tmr'});row.append(w);}tm.forEach(b=>w.append(b));}
    const bw=t.weightUnit==='bodyweight';
    row.classList.toggle('st8-isbw',bw);
    row.classList.toggle('st8-done',!!t.done);
    row.classList.toggle('st8-timed',timedEx);
    const rmb=row.querySelector('button.v6-rm'),mb=row.querySelector('.st8-rmbtn');
    if(mb)mb.disabled=!rmb||rmb.disabled;
    const prev=row.querySelector('.st8-prev');
    const last=lastFor(hist,ex.name,si),txt=last?prevText(last,t.weightUnit):'';
    const want=txt||'—';
    if(prev.textContent!==want){prev.textContent=want;}
    prev.disabled=!txt;prev.setAttribute('aria-label',txt?'Previous '+txt+'. Tap to copy into this set':'No previous result');
    prev.onclick=()=>{
      if(!last)return;const r=num(last.reps),w=num(last.weight);
      const ri=row.querySelector('.st8-reps input'),li=row.querySelector('.st8-load input');
      if(r>=0&&ri)fire(ri,String(r));
      if(w>0&&li&&last.weightUnit!=='bodyweight')fire(li,String(w));
      if(w>0&&last.weightUnit&&last.weightUnit!==t.weightUnit&&last.weightUnit!=='bodyweight'){const sl=row.querySelector('select');if(sl){sl.value=last.weightUnit;sl.dispatchEvent(new Event('change',{bubbles:true}));}}
    };
    /* PR pill */
    let pill=row.querySelector('.st8-pr');
    if(si===pr){if(!pill){pill=el('span',{className:'st8-pr',textContent:'🏆 New PR'});row.append(pill);}}
    else pill?.remove();
    /* one-time toast when a set is newly ticked and is the PR */
    const k=ei+':'+si,was=seen.done[k];
    if(t.done&&!was&&si===pr){
      const tk=s.id+':'+ei+':'+si+':'+t.weight+':'+t.reps;
      if(!seen.toasted[tk]){seen.toasted[tk]=1;toast('New personal record: '+ex.name+' '+fmtN(num(t.weight))+' '+t.weightUnit+' × '+fmtN(num(t.reps)));}
    }
    seen.done[k]=!!t.done;
  });
  /* Add set + Copy last set in one tidy row */
  const add=[...card.querySelectorAll(':scope > button')].find(b=>/^add set$/i.test(b.textContent.trim()));
  const dup=card.querySelector(':scope > button.dup7');
  let bar=card.querySelector(':scope > .st8-actions');
  if(add&&dup&&!bar){bar=el('div',{className:'st8-actions'});add.before(bar);bar.append(add,dup);}
  else if(add&&dup&&bar&&(add.parentElement!==bar||dup.parentElement!==bar)){bar.append(add,dup);}
}

function tick(){
  const tr=document.getElementById('sessionTracker');if(!tr)return;
  const t=T();const s=t&&t.session&&t.session();
  tr.classList.toggle('st8-on',!!s);
  if(!s)return;
  toastCheck(s);
  const hist=history();
  tr.querySelectorAll('details.exercise').forEach(c=>{try{processCard(c,s,hist);}catch(e){}});
}
setInterval(tick,300);
window.addEventListener('change',()=>setTimeout(tick,30),true);

const css=`
#sessionTracker.st8-on details.st8-ex{--st8-g:#3fc495}
#sessionTracker .st8-head{display:grid;grid-template-columns:24px minmax(0,1fr) 58px 58px 44px;gap:4px;align-items:center;padding:10px 4px 4px 0;font-size:11px;font-weight:800;letter-spacing:.06em;color:var(--muted);text-align:center}
#sessionTracker .st8-head>span:first-child{text-align:center}
#sessionTracker .st8-head .st8-hp{text-align:left;padding-left:2px}
#sessionTracker .st8-head button.st8-hu{margin:0!important;padding:4px 0!important;min-height:0!important;width:100%!important;background:transparent!important;border:0!important;border-radius:8px!important;color:var(--accent)!important;font-size:11px!important;font-weight:800;letter-spacing:.06em;box-shadow:none!important;white-space:nowrap}
#sessionTracker details.exercise fieldset.v6-set.st8{grid-template-columns:24px minmax(0,1fr) 58px 58px 44px!important;gap:4px!important;align-items:center;padding:6px 4px 6px 0!important;margin:2px 0!important;border-radius:12px!important;border-bottom:1px solid color-mix(in srgb,var(--soft) 70%,transparent)!important;min-width:0}
#sessionTracker details.exercise fieldset.v6-set.st8.st8-done{background:color-mix(in srgb,var(--st8-g,#3fc495) 20%,transparent)!important;box-shadow:inset 3px 0 0 var(--st8-g,#3fc495)}
#sessionTracker fieldset.st8 .v6-setno,#sessionTracker fieldset.st8 .v6-rm{display:none!important}
#sessionTracker fieldset.st8>.st8-no{grid-column:1;grid-row:1;margin:0!important;padding:0!important;width:24px!important;height:36px;min-height:0!important;background:transparent!important;border:0!important;box-shadow:none!important;color:var(--muted)!important;font-weight:800;font-size:15px;border-radius:8px!important}
#sessionTracker fieldset.st8.st8-open>.st8-no{background:var(--soft)!important;color:var(--fg)!important}
#sessionTracker fieldset.st8>.st8-prev{grid-column:2;grid-row:1;margin:0!important;width:100%!important;min-height:40px!important;padding:0 4px!important;background:transparent!important;border:0!important;box-shadow:none!important;color:var(--muted)!important;font-size:13px!important;font-weight:600;text-align:left;font-variant-numeric:tabular-nums;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;border-radius:8px!important}
#sessionTracker fieldset.st8>.st8-prev:not(:disabled){text-decoration:underline dotted;text-underline-offset:3px;cursor:pointer}
#sessionTracker fieldset.st8>.st8-prev:disabled{opacity:.55}
#sessionTracker fieldset.st8>label.st8-load{grid-column:3;grid-row:1;display:block!important}
#sessionTracker fieldset.st8>label.st8-reps{grid-column:4;grid-row:1}
#sessionTracker fieldset.st8>label.st8-ck{grid-column:5;grid-row:1;width:44px;height:44px;display:grid!important;place-items:center;cursor:pointer}
#sessionTracker fieldset.st8>label.st8-unit{display:none!important}
#sessionTracker fieldset.st8 label.st8-load input,#sessionTracker fieldset.st8 label.st8-reps input{text-align:center;padding:10px 2px!important;min-height:40px;font-variant-numeric:tabular-nums;box-sizing:border-box}
#sessionTracker fieldset.st8 label.st8-reps input::placeholder{font-size:11px}
#sessionTracker fieldset.st8 label.st8-load input,#sessionTracker fieldset.st8 label.st8-reps input{-moz-appearance:textfield;appearance:textfield}
#sessionTracker fieldset.st8 label input::-webkit-outer-spin-button,#sessionTracker fieldset.st8 label input::-webkit-inner-spin-button{-webkit-appearance:none;margin:0}
#sessionTracker fieldset.st8>label.st8-ck input{width:30px!important;height:30px!important;margin:0!important;cursor:pointer}
#sessionTracker fieldset.st8>.st8-bw{display:none;grid-column:3;grid-row:1;margin:0!important;width:100%!important;min-height:40px!important;padding:0!important;background:transparent!important;border:1px dashed var(--soft)!important;border-radius:10px!important;color:var(--muted)!important;font-weight:800;font-size:13px!important;letter-spacing:.05em;box-shadow:none!important}
#sessionTracker fieldset.st8.st8-isbw>.st8-bw{display:block}
#sessionTracker fieldset.st8.st8-isbw>label.st8-load{display:none!important}
#sessionTracker fieldset.st8>.st8-pr{grid-column:2/-1;justify-self:start;font-size:12px;font-weight:800;padding:3px 10px;border-radius:999px;background:color-mix(in srgb,#f0b45a 22%,transparent);color:#f0b45a;border:1px solid color-mix(in srgb,#f0b45a 55%,transparent)}
#sessionTracker fieldset.st8>.st8-tmr{grid-column:1/-1;display:flex;gap:8px}
#sessionTracker fieldset.st8>.st8-tmr>button.tmr6{flex:1 1 0;min-width:0;width:auto!important;max-width:none!important;margin:0!important;grid-column:auto!important;order:0!important;min-height:40px!important;border-radius:12px!important;padding:6px 8px!important;font-size:13px!important;white-space:nowrap}
#sessionTracker fieldset.st8>.st8-menu{display:none;grid-column:1/-1}
#sessionTracker fieldset.st8.st8-open>.st8-menu{display:flex;justify-content:flex-end}
#sessionTracker fieldset.st8 .st8-rmbtn{width:auto!important;margin:0!important;min-height:38px!important;padding:6px 14px!important;font-size:13px!important;border-radius:10px!important;background:transparent!important;color:#f08a8a!important;border:1px solid color-mix(in srgb,#f08a8a 50%,transparent)!important}
#sessionTracker fieldset.st8 .st8-rmbtn:disabled{opacity:.4}
#sessionTracker .st8-actions{display:flex;gap:10px;margin:12px 0 4px}
#sessionTracker .st8-actions>button{flex:1 1 0;min-width:0;width:auto!important;margin:0!important;min-height:44px;white-space:nowrap}
`;
document.head.append(el('style',{textContent:css}));
tick();
})();
