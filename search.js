/* Search + filter for logged meals and logged workouts. Only toggles visibility (.srch-hide); never removes, reorders or re-renders cards. */
(()=>{
'use strict';
const $=id=>document.getElementById(id);
const MONTHS=['january','february','march','april','may','june','july','august','september','october','november','december'];
const SHORT=MONTHS.map(m=>m.slice(0,3));
const norm=s=>String(s==null?'':s).toLowerCase().replace(/\s+/g,' ').trim();
function dateText(iso){
  const m=/^(\d{4})-(\d{2})-(\d{2})/.exec(iso||'');if(!m)return norm(iso);
  const y=+m[1],mo=+m[2]-1,d=+m[3],dt=new Date(y,mo,d,12),wd=['sunday','monday','tuesday','wednesday','thursday','friday','saturday'][dt.getDay()];
  return [iso,MONTHS[mo]+' '+d,SHORT[mo]+' '+d,MONTHS[mo]+' '+d+' '+y,SHORT[mo]+' '+d+' '+y,MONTHS[mo]+' '+d+', '+y,SHORT[mo]+' '+d+', '+y,wd,wd.slice(0,3),String(y)].join(' | ').toLowerCase();
}
/* Split a query into AND-terms; "oct 21" / "october 21" becomes one date phrase so it can't match "Food 21" on another day. */
function terms(q){
  const words=norm(q).replace(/[,]+/g,' ').split(' ').filter(Boolean),out=[];
  for(let i=0;i<words.length;i++){
    const w=words[i].replace(/\.$/,''),mi=SHORT.indexOf(w.slice(0,3));
    const isMonth=mi>=0&&MONTHS[mi].startsWith(w)&&w.length>=3;
    if(isMonth&&/^\d{1,2}$/.test(words[i+1]||'')){out.push({date:true,re:new RegExp('(^|\\| )'+w+'[a-z]* '+(+words[i+1])+'( |,|\\||$)')});i++;}
    else out.push({text:words[i]});
  }
  return out;
}
function matches(ts,hay,dates){
  return ts.every(t=>t.date?t.re.test(dates):(hay.includes(t.text)||dates.includes(t.text)));
}
const CSS=`.srch{margin:2px 0 12px}.srch-row{position:relative;display:flex;align-items:center}
.srch-ico{position:absolute;left:12px;width:18px;height:18px;color:var(--muted);pointer-events:none}
.srch input[type=search]{width:100%;box-sizing:border-box;margin:0;padding:11px 40px 11px 38px;min-height:44px;border-radius:14px;border:1px solid var(--soft);background:var(--card);color:var(--fg);font-size:16px;-webkit-appearance:none;appearance:none}
.srch input[type=search]::-webkit-search-cancel-button,.srch input[type=search]::-webkit-search-decoration{-webkit-appearance:none;display:none}
.srch input[type=search]:focus{outline:2px solid var(--accent);outline-offset:1px}
.srch-clear{position:absolute;right:6px;width:32px;height:32px;display:grid;place-items:center;margin:0!important;padding:0!important;border-radius:50%!important;border:0!important;background:var(--soft)!important;color:var(--fg)!important;font-size:14px;line-height:1;cursor:pointer}
.srch-clear[hidden]{display:none!important}
.srch .v6-chips{margin:10px 0 4px;gap:5px}
.srch .v6-chips button{padding:6px 9px!important;font-size:13px;border-radius:999px!important;min-height:34px}
.srch-count{margin:8px 2px 0;font-size:13px;color:var(--muted)}
.srch-empty{margin:10px 0 0;padding:16px;border:1px dashed var(--soft);border-radius:14px;text-align:center;color:var(--muted);font-size:14px;overflow-wrap:anywhere}
.srch-empty[hidden],.srch-count[hidden]{display:none!important}
.srch-hide{display:none!important}`;
const st=document.createElement('style');st.textContent=CSS;document.head.append(st);

const SVG='<svg class="srch-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>';

/* Open the element's own <details> and every <details> around it so results are actually visible. */
function openUp(el){for(let d=el&&(el.tagName==='DETAILS'?el:el.closest('details'));d;d=d.parentElement&&d.parentElement.closest('details'))d.open=true;}

function make(cfg){
  const S={q:'',chip:'All',timer:0,raf:0,root:null,input:null};
  function build(){
    const root=document.createElement('div');root.className='srch';root.id=cfg.id;root.setAttribute('role','search');
    root.innerHTML='<div class="srch-row">'+SVG+'<input type="search" autocomplete="off" autocapitalize="off" spellcheck="false" enterkeyhint="search"><button type="button" class="srch-clear" hidden aria-label="Clear search">✕</button></div><div class="v6-chips" role="group"></div><p class="srch-count" role="status" aria-live="polite" hidden></p><p class="srch-empty" hidden></p>';
    const input=root.querySelector('input');input.placeholder=cfg.placeholder;input.setAttribute('aria-label',cfg.label);
    const chips=root.querySelector('.v6-chips');chips.setAttribute('aria-label',cfg.label+' type');
    cfg.chips.forEach(c=>{const b=document.createElement('button');b.type='button';b.textContent=c;b.dataset.chip=c;b.setAttribute('aria-pressed',c==='All');if(c==='All')b.classList.add('on');chips.append(b);});
    const clear=root.querySelector('.srch-clear');
    input.addEventListener('input',()=>{clearTimeout(S.timer);clear.hidden=!input.value;S.timer=setTimeout(()=>{const was=active();S.q=input.value;changed(was);},120);});
    input.addEventListener('keydown',e=>{if(e.key==='Escape'&&input.value){e.preventDefault();doClear();}});
    clear.addEventListener('click',()=>{doClear();input.focus();});
    chips.addEventListener('click',e=>{const b=e.target.closest('button[data-chip]');if(!b)return;const was=active();S.chip=b.dataset.chip;changed(was);});
    function doClear(){clearTimeout(S.timer);input.value='';clear.hidden=true;const was=active();S.q='';changed(was);}
    S.root=root;S.input=input;S.clear=clear;S.chipsEl=chips;S.count=root.querySelector('.srch-count');S.empty=root.querySelector('.srch-empty');
    return root;
  }
  const active=()=>!!(S.q.trim()||S.chip!=='All');
  function changed(was){
    S.chipsEl.querySelectorAll('button').forEach(b=>{const on=b.dataset.chip===S.chip;b.classList.toggle('on',on);b.setAttribute('aria-pressed',on);});
    if(active()&&!was)cfg.open();
    apply();
  }
  function ensure(){
    const host=cfg.host();if(!host)return false;
    if(!S.root)build();
    const anchor=cfg.anchor(host);
    if(S.root.parentNode!==anchor.parent||S.root.nextSibling!==anchor.before)anchor.parent.insertBefore(S.root,anchor.before);
    return true;
  }
  function apply(){
    if(!ensure())return;
    const cards=cfg.cards(),ts=terms(S.q),on=active();let n=0;
    cards.forEach(c=>{
      let show=true;
      if(on){const info=cfg.info(c);show=(S.chip==='All'||info.chip===S.chip)&&matches(ts,info.hay,info.dates);}
      c.classList.toggle('srch-hide',!show);if(show)n++;
    });
    if(cfg.after)cfg.after(on);
    S.count.hidden=!on||n===0;S.empty.hidden=!on||n>0;
    if(on&&n>0)S.count.textContent=n+' '+(n===1?cfg.noun:cfg.nouns)+' found';
    if(on&&n===0){const q=S.q.trim();S.empty.textContent=q?'No '+cfg.nouns+' match ‘'+q+'’':'No '+S.chip+' '+cfg.nouns+' logged yet';}
  }
  function schedule(){if(S.raf)return;S.raf=requestAnimationFrame(()=>{S.raf=0;apply();});}
  return {S,apply,schedule,ensure};
}

/* ---------- Meals ---------- */
const meals=make({
  id:'srchMeals',noun:'meal',nouns:'meals',label:'Search meals',placeholder:'Search meals… e.g. jollof, oranges',chips:['All','Breakfast','Lunch','Dinner','Snack'],
  host:()=>$('pastDays'),
  anchor:h=>({parent:h,before:$('pastMeals')}),
  open:()=>openUp($('pastDays')),
  cards:()=>[...document.querySelectorAll('#mealHistory .meal-diary-entry,#pastMeals .meal-diary-entry')],
  info:c=>{const food=norm(c.querySelector('h3')?.textContent),kind=(c.querySelector('.workout-history-kind')?.textContent||'').trim();return {chip:kind,hay:food+' '+norm(kind),dates:dateText(c.dataset.date)};},
  after:on=>{
    const list=$('pastMeals');if(!list)return;let head=null,any=false;
    const flush=()=>{if(head)head.classList.toggle('srch-hide',on&&!any);};
    [...list.children].forEach(ch=>{
      if(ch.classList.contains('past-day')){flush();head=ch;any=false;}
      else if(ch.classList.contains('meal-diary-entry')&&!ch.classList.contains('srch-hide'))any=true;
    });flush();
  }
});

/* ---------- Workouts ---------- */
function workoutChip(kind,title){
  const t=norm(title),k=norm(kind);
  if(/walk/.test(t))return 'Walk';
  if(/run|jog/.test(t)||k==='running')return 'Run';
  if(/upper|lower|core|strength|standing|push|pull|leg|full body|weights?/.test(t)||k==='strength')return 'Strength';
  return 'Other';
}
const workouts=make({
  id:'srchWorkouts',noun:'workout',nouns:'workouts',label:'Search workouts',placeholder:'Search workouts… e.g. plank, upper, walk',chips:['All','Strength','Run','Walk','Other'],
  host:()=>$('workoutHistory'),
  anchor:h=>({parent:h.parentNode,before:h}),
  open:()=>openUp($('workoutHistory')),
  cards:()=>[...($('workoutHistory')?.children||[])].filter(n=>n.classList.contains('card')),
  info:c=>{const kind=c.querySelector('.workout-history-kind')?.textContent||'',title=c.querySelector('h3')?.textContent||'',iso=c.querySelector('time')?.getAttribute('datetime')||'';
    return {chip:workoutChip(kind,title),hay:norm([kind,title,...[...c.querySelectorAll('h4,.workout-history-notes,.workout-history-badge')].map(x=>x.textContent)].join(' ')),dates:dateText(iso)};}
});

const all=[meals,workouts];
function refresh(){all.forEach(x=>x.schedule());}
function watch(id){const el=$(id);if(!el||el.dataset.srchWatch)return;el.dataset.srchWatch='1';new MutationObserver(refresh).observe(el,{childList:true,subtree:true});}
function init(){['mealHistory','pastMeals','workoutHistory'].forEach(watch);all.forEach(x=>x.ensure());}
try{
  if(typeof render==='function'){const p=render;render=function(){const r=p.apply(this,arguments);try{init();refresh();}catch(e){console.warn('search',e);}return r;};}
}catch(e){}
init();
window.strideLogSearch={refresh,meals:meals.S,workouts:workouts.S};
})();
