#!/usr/bin/env node
'use strict';
/* Stride & Strength regression "safety check". See tests/README-safety.md. */
const { chromium } = require('/opt/npm-tools/node_modules/playwright-core');
const http = require('node:http'), fs = require('node:fs'), path = require('node:path');
const { execFileSync } = require('node:child_process');

const ROOT = path.resolve(__dirname, '..');
const DIST = path.join(ROOT, 'dist');
const FIX = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', 'real-account.json'), 'utf8'));
const UID = '00000000-0000-4000-8000-000000000001';
const TODAY = '2026-10-31';
const NOW = new Date(2026, 9, 31, 12, 0, 0); // local noon

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml' };
function serve() {
  return new Promise(res => {
    const s = http.createServer((req, rsp) => {
      let p = decodeURIComponent(req.url.split('?')[0]); if (p === '/') p = '/index.html';
      const f = path.join(DIST, path.normalize(p));
      if (!f.startsWith(DIST)) { rsp.statusCode = 403; return rsp.end(); }
      fs.readFile(f, (e, b) => {
        if (e) { rsp.statusCode = 404; return rsp.end('nf'); }
        rsp.setHeader('Content-Type', MIME[path.extname(f)] || 'application/octet-stream'); rsp.end(b);
      });
    });
    s.listen(0, '127.0.0.1', () => res(s));
  });
}

// Fake supabase UMD client: returns fixture rows for select queries, signed in as UID.
function fakeSupabase() {
  const fix = JSON.stringify(FIX), uid = UID;
  return `(function(){
const F=${fix};
const tables={
 workouts:()=>F.workouts, meals:()=>F.meals, weigh_ins:()=>F.weigh_ins, water_logs:()=>F.water,
 goals:()=>F.goals.map(g=>({user_id:'${uid}',daily_calorie_goal:g.cal,daily_protein_goal:g.pro})), profiles:()=>[]
};
const user={id:'${uid}',email:'safety@test.invalid'};
const session={access_token:'t',user};
function q(t){const o={_t:t,select(){return o},eq(){return o},limit(){return o},
 delete(){return o},upsert(){return o},insert(){return o},update(){return o},
 then(ok,bad){return Promise.resolve({data:(tables[t]?tables[t]():[]).map(x=>Object.assign({},x)),error:null}).then(ok,bad)}};return o}
window.supabase={createClient:()=>({
 auth:{getSession:async()=>({data:{session},error:null}),
  onAuthStateChange(cb){setTimeout(()=>cb('SIGNED_IN',session),0);return {data:{subscription:{unsubscribe(){}}}}},
  signOut:async()=>({error:null}),signInWithPassword:async()=>({data:{session},error:null}),getUser:async()=>({data:{user},error:null})},
 from:q, rpc:async()=>({data:null,error:null}),
 storage:{from:()=>({remove:async()=>({error:null}),upload:async()=>({error:null}),download:async()=>({data:null,error:{message:'x'}}),createSignedUrl:async()=>({data:null,error:{message:'x'}})})},
 functions:{invoke:async()=>({data:null,error:{message:'x'}})}
})};
})();`;
}

const results = []; // {n,name,ok,detail}
let page, base, pageErrors = [], consoleErrors = [];
const ok = (c, msg) => { if (!c) throw new Error(msg); };
const eq = (a, b, msg) => { if (a !== b) throw new Error(`${msg}: expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`); };
async function check(n, name, fn) {
  const t = Date.now();
  try { await fn(); results.push({ n, name, ok: true, ms: Date.now() - t }); console.log(`PASS ${String(n).padStart(2)}  ${name}`); }
  catch (e) { const d = String(e && e.message || e).split('\n')[0]; results.push({ n, name, ok: false, detail: d, ms: Date.now() - t }); console.log(`FAIL ${String(n).padStart(2)}  ${name}\n       -> ${d}`); }
}

let browser, ctx;
async function fresh(opts = {}) {
  if (ctx) await ctx.close().catch(() => {});
  pageErrors = []; consoleErrors = [];
  ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await ctx.addInitScript(() => {
    try {
      localStorage.setItem('stride-tour-v1-done', '1');
      for (const k of ['meals', 'progress', 'train', 'home', 'log']) localStorage.setItem('stride-tip-' + k, '1');
    } catch (e) {}
  });
  if (opts.init) await ctx.addInitScript(opts.init);
  page = await ctx.newPage();
  await page.clock.install({ time: NOW });
  await page.route(/unsplash|openfoodfacts|supabase\.co/, r => r.abort('failed'));
  await page.route(/supabase-js/, r => r.fulfill({ contentType: 'text/javascript', body: fakeSupabase() }));
  page.on('pageerror', e => pageErrors.push(String(e && e.message || e)));
  page.on('console', m => { if (m.type() === 'error') consoleErrors.push(m.text()); });
  await load();
  return page;
}
// Poll from node: page.waitForFunction relies on page timers, which the frozen clock controls.
async function until(fn, arg, timeout = 8000, what) {
  const t = Date.now();
  for (;;) {
    if (await page.evaluate(fn, arg).catch(() => false)) return;
    if (Date.now() - t > timeout) throw new Error('timed out waiting for ' + (what || String(fn).slice(0, 90)));
    await new Promise(r => setTimeout(r, 100));
  }
}
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function load() {
  await page.goto(base + '/', { waitUntil: 'load' });
  await until(n => typeof db !== 'undefined' && db.meals.length === n && !document.querySelector('main').inert, FIX.meals.length, 20000, 'cloud load (fixture rows in db)');
  await sleep(400);
}
const go = async v => { await page.evaluate(v => show(v), v); await sleep(300); };
const ev = (fn, arg) => page.evaluate(fn, arg);
const num = t => Number(String(t).replace(/[^\d.\-]/g, ''));
// Log a meal through the real manual form.
async function logMeal(food, cal, pro, date = TODAY) {
  await go('meals');
  await ev(({ food, cal, pro, date }) => {
    for (let e = document.getElementById('mealForm'); e && e !== document.body; e = e.parentElement) { if (e.tagName === 'DETAILS') e.open = true; e.hidden = false; e.classList.remove('hidden'); }
    const set = (id, v) => { const i = document.getElementById(id); i.value = v; i.dispatchEvent(new Event('input', { bubbles: true })); };
    set('mealDate', date); set('food', food); set('calories', cal); set('protein', pro);
    document.querySelector('#mealForm button:not([type])').click();
  }, { food, cal, pro, date });
  await sleep(500);
}
const todayEaten = () => ev(() => { const m = document.getElementById('meals').innerText.match(/goal\s*[−-]\s*([\d,]+)\s*eaten/); return m ? Number(m[1].replace(/,/g, '')) : null; });
const sumFix = (key, date) => FIX.meals.filter(m => m.meal_date === date).reduce((n, m) => n + (Number(m[key]) || 0), 0);
const openPast = () => ev(() => { const d = document.getElementById('pastDays'); if (d) d.open = true; });

async function runChecks() {
  const pastCards = `#pastMeals .meal-diary-entry`;

  await check(1, 'Meals: past days newest-first, each date once', async () => {
    await fresh(); await go('meals'); await openPast();
    const heads = await ev(() => [...document.getElementById('pastMeals').children].reduce((acc, el) => {
      if (el.classList.contains('meal-diary-entry')) { const h = acc[acc.length - 1]; if (h) h.dates.push(el.dataset.date); else acc.push({ text: '(none)', dates: [el.dataset.date] }); }
      else if (el.tagName === 'P' || /past-day|diary-day/.test(el.className)) acc.push({ text: el.textContent.trim(), dates: [] });
      return acc;
    }, []));
    const expected = [...new Set(FIX.meals.map(m => m.meal_date))].filter(d => d !== TODAY).sort().reverse();
    ok(heads.length > 0, 'no past-day headings found');
    eq(heads.length, expected.length, 'number of past day headings');
    const order = heads.map(h => h.dates[0]);
    eq(JSON.stringify(order), JSON.stringify(expected), 'heading dates order (newest first)');
    ok(new Set(heads.map(h => h.text)).size === heads.length, 'duplicate heading text: ' + heads.map(h => h.text).join(' | '));
    for (const h of heads) ok(h.dates.length && h.dates.every(d => d === h.dates[0]), 'heading "' + h.text + '" groups entries from several dates');
  });

  await check(2, 'Meals: Edit/Delete labels match card (date + name)', async () => {
    await fresh(); await go('meals');
    const bad = await ev(() => {
      const out = [];
      document.querySelectorAll('.meal-diary-entry').forEach(c => {
        const name = c.querySelector('h3')?.textContent, date = c.dataset.date;
        const del = [...c.querySelectorAll('button')].find(b => /^Delete\b/.test(b.getAttribute('aria-label') || '') || b.textContent.trim() === 'Delete');
        const edit = [...c.querySelectorAll('button')].find(b => b.textContent.trim() === 'Edit');
        if (!del) out.push('no Delete: ' + name); else if (del.getAttribute('aria-label') !== 'Delete ' + date + ' ' + name) out.push('Delete label "' + del.getAttribute('aria-label') + '" != "Delete ' + date + ' ' + name + '"');
        if (!edit) out.push('no Edit: ' + name); else if (edit.getAttribute('aria-label') && edit.getAttribute('aria-label') !== 'Edit ' + date + ' ' + name) out.push('Edit label "' + edit.getAttribute('aria-label') + '" != "Edit ' + date + ' ' + name + '"');
      });
      return out;
    });
    eq(bad.length, 0, bad.slice(0, 3).join(' ; ') + ' (' + bad.length + ' problems)');
  });

  await check(3, 'Meals: total meal cards == fixture meals', async () => {
    await fresh(); await go('meals');
    eq(await ev(() => document.querySelectorAll('.meal-diary-entry').length), FIX.meals.length, 'meal cards');
    const today = await ev(t => document.querySelectorAll('#yourMeals > .meal-diary-entry, #yourMeals .meal-diary-entry[data-date="' + t + '"]').length, TODAY);
    eq(today, FIX.meals.filter(m => m.meal_date === TODAY).length, 'cards dated today');
  });

  await check(4, "Meals: today's totals match fixture sum", async () => {
    await fresh(); await go('meals');
    const txt = await ev(() => document.getElementById('meals').innerText);
    const goal = FIX.goals[0].cal, eaten = sumFix('calories', TODAY);
    eq(await todayEaten(), eaten, 'calories eaten shown');
    const left = txt.match(/([\d,]+)\s*kcal left/);
    ok(left, 'no "kcal left" text'); eq(num(left[1]), goal - eaten, 'kcal left');
    const pro = txt.match(/Protein\s*\n\s*([\d.,]+)\s*\/\s*([\d.,]+)\s*g/);
    ok(pro, 'no protein line'); eq(num(pro[1]), sumFix('protein_g', TODAY), 'protein eaten'); eq(num(pro[2]), FIX.goals[0].pro, 'protein goal');
  });

  await check(5, 'Meals: ＋1 serving doubles & renames " × 2"; −1 restores', async () => {
    await fresh(); await go('meals'); await openPast();
    const m = await ev(() => { const c = document.querySelector('#pastMeals .meal-diary-entry'); const id = db.meals.find(x => x.date === c.dataset.date && x.food === c.querySelector('h3').textContent); return { date: c.dataset.date, food: id.food, cal: id.calories, pro: id.protein }; });
    const card = (food) => ev(({ date, food }) => { const c = [...document.querySelectorAll('.meal-diary-entry')].find(x => x.dataset.date === date && x.querySelector('h3').textContent === food); return c ? { cal: Number(c.querySelector('.meal-diary-metrics strong').textContent.replace(/[^\d.]/g, '')) } : null; }, { date: m.date, food });
    const click = (food, label) => ev(({ date, food, label }) => { const c = [...document.querySelectorAll('.meal-diary-entry')].find(x => x.dataset.date === date && x.querySelector('h3').textContent === food); const b = [...c.querySelectorAll('button.serv7')].find(b => b.getAttribute('aria-label').startsWith(label)); b.click(); }, { date: m.date, food, label });
    await click(m.food, 'Add one serving'); await sleep(400);
    const doubled = await card(m.food + ' × 2');
    ok(doubled, 'card not renamed to "' + m.food + ' × 2"'); eq(doubled.cal, m.cal * 2, 'doubled calories');
    await click(m.food + ' × 2', 'Remove one serving'); await sleep(400);
    const back = await card(m.food);
    ok(back, 'card not restored to original name "' + m.food + '"'); eq(back.cal, m.cal, 'restored calories');
  });

  await check(6, 'Meals: search filters to matching cards; clearing restores', async () => {
    await fresh(); await go('meals'); await openPast();
    const foods = FIX.meals.map(m => m.food_name.toLowerCase());
    const word = [...new Set(foods.join(' ').match(/[a-z]{5,}/g))].find(w => foods.filter(f => f.includes(w)).length === 1);
    ok(word, 'fixture has no word unique to one food');
    const input = page.locator('#srchMeals input[type=search]'); await input.fill(word); await sleep(700);
    const vis = () => ev(() => [...document.querySelectorAll('.meal-diary-entry')].filter(c => !c.classList.contains('srch-hide') && getComputedStyle(c).display !== 'none').map(c => c.textContent.toLowerCase()));
    const v = await vis();
    eq(v.length, 1, 'visible cards for "' + word + '"'); ok(v[0].includes(word), 'visible card does not contain "' + word + '"');
    await input.fill(''); await sleep(700);
    eq((await vis()).length, FIX.meals.length, 'visible cards after clearing');
  });

  await check(7, 'Meals: manual form adds exactly one card for today', async () => {
    await fresh();
    await logMeal('Safety check oats', 300, 12);
    eq(await ev(() => document.querySelectorAll('.meal-diary-entry').length), FIX.meals.length + 1, 'total cards');
    eq(await ev(t => [...document.querySelectorAll('.meal-diary-entry')].filter(c => c.dataset.date === t).length, TODAY), 1, 'cards today');
    eq(await todayEaten(), 300, 'today eaten after logging');
  });

  await check(8, 'Progress: nutrition history badges (past complete, today In progress)', async () => {
    await fresh();
    await logMeal('Safety check oats', 300, 12);
    await go('progress');
    const read = () => ev(() => { document.querySelectorAll('#progress details').forEach(d => d.open = true); return [...document.querySelectorAll('#nutritionHistory .nutrition-day-card')].map(c => ({ date: c.querySelector('time')?.getAttribute('datetime'), badge: c.querySelector('.nutrition-day-badge')?.textContent.trim() })); });
    let cards = await read();
    ok(cards.length > 1, 'expected several day cards, got ' + cards.length);
    const past = cards.filter(c => c.date < TODAY);
    ok(past.length > 0, 'no past day cards');
    for (const c of past) ok(/^(Day complete|Logging complete)$/.test(c.badge), c.date + ' badge is "' + c.badge + '"');
    const t = cards.find(c => c.date === TODAY); ok(t, 'no card for today'); eq(t.badge, 'In progress', "today's badge");
    await go('meals'); await ev(() => document.getElementById('nutritionComplete').click()); await sleep(300);
    await go('progress'); cards = await read();
    eq(cards.find(c => c.date === TODAY).badge, 'Logging complete', "today's badge after ticking");
  });

  await check(9, 'Workouts: history cards == completed fixture workouts, labels match', async () => {
    await fresh(); await go('progress');
    const cards = await ev(() => { document.querySelectorAll('#progress details').forEach(d => d.open = true); return [...document.querySelectorAll('#workoutHistory .workout-history-card')].map(c => {
      const b = [...c.querySelectorAll('.actions button')]; const g = t => b.find(x => x.textContent.trim() === t)?.getAttribute('aria-label') || null;
      return { date: c.querySelector('time')?.getAttribute('datetime'), name: c.querySelector('h3')?.textContent, edit: g('Edit'), del: g('Delete') }; }); });
    const isDraft = w => { if (!(w.notes || '').startsWith('STRIDE_SESSION_V1:')) return false; try { return JSON.parse(w.notes.slice(18)).status === 'draft'; } catch (e) { return false; } };
    const done = FIX.workouts.filter(w => !isDraft(w));
    eq(cards.length, done.length, 'workout history cards');
    // labels are built from the record (date + type); the card heading may show a session title instead
    const labels = k => cards.map(c => c[k]).sort().join('\n'), want = k => done.map(w => k + ' ' + w.workout_date + ' ' + w.workout_type).sort().join('\n');
    eq(labels('del'), want('Delete'), 'Delete labels vs fixture records'); eq(labels('edit'), want('Edit'), 'Edit labels vs fixture records');
  });

  await check(10, 'Workouts: plan session start -> tick -> plank controls -> finish & log', async () => {
    await fresh(); await go('train');
    await ev(() => strideSessionTracker.start({ title: 'Safety plan', exercises: [
      { name: 'Goblet squat', sets: 2, reps: '8-12 reps', load: 'Light', starting_weight: 20, weight_unit: 'lb', cue: 'x' },
      { name: 'Plank', sets: 2, reps: '30-45 seconds', load: 'Bodyweight', cue: 'x' }] }, { focus: 'core', checkinApproved: true }, 'Plan'));
    await sleep(500);
    ok(await ev(() => strideSessionTracker.isActive()), 'session not active after start');
    ok(await page.locator('#sessionTracker').isVisible(), 'tracker not visible');
    await ev(() => document.querySelectorAll('#sessionTracker details.exercise').forEach(d => d.open = true));
    const first = page.locator('#sessionTracker details.exercise').first().locator('input[type=checkbox]').first();
    await first.check(); await sleep(300);
    ok(await first.isChecked(), 'set tick did not stick');
    const sum = await ev(() => document.querySelector('#sessionTracker details.exercise summary').textContent);
    ok(/1\s*\/\s*2/.test(sum), 'exercise summary does not show 1/2 sets: ' + sum);
    const plank = await ev(() => { const ex = [...document.querySelectorAll('#sessionTracker details.exercise')].find(d => /Plank/.test(d.querySelector('summary').textContent)); const row = ex.querySelector('fieldset');
      return { timer: [...row.querySelectorAll('button')].some(b => b.textContent.trim().startsWith('⏱')), max: [...row.querySelectorAll('button')].some(b => b.textContent.includes('∞ Max hold')), ph: [...row.querySelectorAll('input[type=number]')].some(i => i.placeholder === 'Seconds') }; });
    ok(plank.timer, 'plank row has no ⏱ timer button'); ok(plank.max, 'plank row has no "∞ Max hold" button'); ok(plank.ph, 'plank input placeholder is not "Seconds"');
    ok(await ev(() => [...document.querySelectorAll('#sessionTracker button')].some(b => b.textContent.trim() === 'Pause — finish later')), "no 'Pause — finish later' button");
    await go('home'); await sleep(1500);
    ok(await ev(() => { const b = document.getElementById('resume6'); return !!b && !b.hidden; }), '#resume6 not shown on Home while a session is active');
    await go('train');
    const before = await ev(() => db.workouts.length);
    const fin = page.locator('#finishSession'); ok((await fin.textContent()).includes('Finish & log workout'), 'finish button text: ' + await fin.textContent());
    await fin.click(); await sleep(800);
    // a confirmation dialog may appear (e.g. calories / distance); accept defaults
    for (let i = 0; i < 3; i++) { const dlg = page.locator('dialog[open] button.v6-start, dialog[open] button[type=submit]').first(); if (await dlg.count()) { await dlg.click().catch(() => {}); await sleep(500); } }
    eq(await ev(() => db.workouts.length), before + 1, 'workouts after finishing');
    eq(await ev(t => db.workouts.filter(w => w.date === t).length, TODAY), 1, 'workouts dated today');
    ok(!(await ev(() => strideSessionTracker.isActive())), 'session still active after finishing');
    eq(await ev(() => (db.trainingSessions || []).filter(s => s.status === 'draft').length), 0, 'draft sessions left');
    await go('home'); await sleep(1500);
    ok(await ev(() => { const b = document.getElementById('resume6'); return !b || b.hidden; }), '#resume6 still visible after finishing');
  });

  await check(11, 'Workouts: stale draft shows "Unfinished workout"; Log it saves to original date', async () => {
    await fresh();
    await ev(uid => { db.trainingSessions.push({ id: crypto.randomUUID(), owner: uid, status: 'draft', date: '2026-10-30', title: 'Stale safety plan', type: 'Core', source: 'Plan', elapsedSeconds: 600, runningSince: null,
      exercises: [{ name: 'Plank', target: '30 seconds', load: 'Bodyweight', sets: [{ reps: 30, unit: 'seconds', weight: null, weightUnit: 'bodyweight', done: true }] }] }); save(); show('home'); }, UID);
    await until(() => !!document.getElementById('stale7'), null, 6000, '#stale7 card');
    ok(/Unfinished workout/.test(await ev(() => document.getElementById('stale7').textContent)), 'card text lacks "Unfinished workout"');
    const before = await ev(() => db.workouts.length);
    await page.locator('#stale7 .st7-log').click(); await sleep(1500);
    for (let i = 0; i < 3; i++) { const dlg = page.locator('dialog[open] button.v6-start, dialog[open] button[type=submit]').first(); if (await dlg.count()) { await dlg.click().catch(() => {}); await sleep(500); } }
    eq(await ev(() => db.workouts.length), before + 1, 'workouts after Log it');
    const w = await ev(() => db.workouts.find(x => x.session && x.session.title === 'Stale safety plan'));
    ok(w, 'logged workout not found'); eq(w.date, '2026-10-30', 'logged workout date');
    ok(!(await ev(() => !!document.getElementById('stale7'))), '#stale7 card still present');
  });

  await check(12, 'Workouts: Copy last set duplicates values', async () => {
    await fresh(); await go('train');
    await ev(() => strideSessionTracker.start({ title: 'Copy plan', exercises: [{ name: 'Goblet squat', sets: 1, reps: '8-12 reps', load: 'Light', starting_weight: 20, weight_unit: 'lb', cue: 'x' }] }, { focus: 'lower', checkinApproved: true }, 'Plan'));
    await sleep(500);
    const ex = page.locator('#sessionTracker details.exercise').first();
    await ev(() => document.querySelectorAll('#sessionTracker details.exercise').forEach(d => d.open = true));
    const nums = ex.locator('fieldset').first().locator('input[type=number]');
    for (const [i, v] of [[0, '11'], [1, '27.5']]) { await nums.nth(i).fill(v); await nums.nth(i).dispatchEvent('change'); await sleep(150); } // the app saves on 'change'
    await ex.locator('button.dup7').click(); await sleep(400);
    const vals = await ev(() => [...document.querySelectorAll('#sessionTracker details.exercise fieldset')].map(f => [...f.querySelectorAll('input[type=number]')].map(i => i.value).filter(Boolean).join('/')));
    eq(vals.length, 2, 'set rows after copy'); eq(vals[1], vals[0], 'copied set values'); ok(vals[0].includes('11') && vals[0].includes('27.5'), 'original values lost: ' + vals[0]);
  });

  await check(13, 'Home: 7 week rings; calories-left == goal - eaten', async () => {
    await fresh();
    await logMeal('Safety check oats', 450, 12);
    await go('home');
    eq(await ev(() => document.querySelectorAll('#home svg.ring6').length), 7, 'week rings');
    const t = await ev(() => document.getElementById('home').innerText);
    const left = t.match(/(-?[\d,]+)\s*kcal (?:left|over)/), eaten = t.match(/goal\s*[−-]\s*([\d,]+)\s*eaten/);
    ok(left && eaten, 'calories-left text not found on Home');
    const goal = await ev(d => strideGoalFor(d), TODAY);
    eq(num(eaten[1]), 450, 'eaten on Home'); eq(num(left[1]) * (/over/.test(left[0]) ? -1 : 1), goal - 450, 'calories left');
  });

  await check(14, 'Goals: weekend flex off by default (every day == goal)', async () => {
    await fresh();
    const r = await ev(() => { const g = db.goals.calories, out = []; for (let i = 0; i < 28; i++) { const d = new Date(2026, 9, 1 + i, 12); const k = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); const v = strideGoalFor(k); if (v !== g) out.push(k + '=' + v); } return { g, out }; });
    eq(r.g, FIX.goals[0].cal, 'db.goals.calories'); eq(r.out.length, 0, 'days whose goal differs: ' + r.out.slice(0, 4).join(','));
  });

  await check(15, 'No uncaught page errors / console errors across Home, Train, Meals, Progress, Log', async () => {
    await fresh();
    for (const v of ['home', 'train', 'meals', 'progress', 'log', 'home']) { await go(v); await sleep(900); }
    const real = consoleErrors.filter(e => !/ERR_FAILED|ERR_BLOCKED/.test(e));
    eq(pageErrors.length, 0, 'pageerror: ' + [...new Set(pageErrors)].slice(0, 3).join(' ; '));
    const uniq = [...new Set(real.map(e => e.split('\n')[0]))];
    eq(uniq.length, 0, 'console.error x' + real.length + ': ' + uniq.slice(0, 3).join(' ; '));
  });

  await check(16, "Theme: first paint background == chosen skin's --bg after reload", async () => {
    await fresh({ init: () => { window.__firstBg = null; const grab = () => { const v = document.documentElement && document.documentElement.style.getPropertyValue('--bg'); if (v && !window.__firstBg) window.__firstBg = v.trim(); };
      // <html> does not exist yet when init scripts run, so observe the document and record the first --bg ever set on <html>
      new MutationObserver(grab).observe(document, { attributes: true, subtree: true, attributeFilter: ['style'] }); grab(); } });
    await go('home');
    await ev(() => document.querySelector('.v5-skins button[data-skin="Daylight"]').click()); await sleep(300);
    const want = await ev(() => document.documentElement.style.getPropertyValue('--bg').trim());
    ok(want, 'skin did not set --bg'); ok(want.toLowerCase() !== '#0d1430', 'Daylight skin did not change --bg: ' + want);
    await page.reload({ waitUntil: 'load' }); await until(() => typeof db !== 'undefined' && db.meals.length > 0, null, 15000, 'reload'); await sleep(300);
    eq((await ev(() => window.__firstBg)).toLowerCase(), want.toLowerCase(), 'first --bg set on <html> during reload');
    const bg = await ev(() => getComputedStyle(document.body).backgroundColor);
    const rgb = await ev(c => { const e = document.createElement('i'); e.style.color = c; document.body.append(e); const v = getComputedStyle(e).color; e.remove(); return v; }, want);
    eq(bg, rgb, 'body background after reload');
  });

  /* ---------- Workout UI rebuild checks (set table, floating bar, log form) ---------- */
  const finishDialogs = async () => { for (let i = 0; i < 3; i++) { const dlg = page.locator('dialog[open] button.v6-start, dialog[open] button[type=submit]').first(); if (await dlg.count()) { await dlg.click().catch(() => {}); await sleep(500); } } };
  const startPlan = async (title, exercises) => {
    await go('train');
    await ev(a => strideSessionTracker.start({ title: a.title, exercises: a.exercises }, { focus: 'lower', checkinApproved: true }, 'Plan'), { title, exercises });
    await sleep(1500);
    await ev(() => { document.querySelectorAll('dialog[open]').forEach(d => d.close()); document.querySelectorAll('#sessionTracker details.exercise').forEach(d => d.open = true); });
    await sleep(700);
  };
  const exLoc = name => page.locator('#sessionTracker details.exercise').filter({ has: page.locator('summary', { hasText: name }) }).first();
  const setRow = (name, i) => exLoc(name).locator('fieldset.st8').nth(i);
  const fillRow = async (name, i, w, r) => {
    const row = setRow(name, i);
    const li = row.locator('.st8-load input'), ri = row.locator('.st8-reps input');
    await li.fill(String(w)); await li.dispatchEvent('change'); await ri.fill(String(r)); await ri.dispatchEvent('change'); await sleep(150);
  };
  const clearOverlays = () => ev(() => { document.querySelectorAll('dialog[open]').forEach(d => d.close()); document.querySelector('#restTimer [data-d=skip]')?.click(); }); // first-run sheets / rest timer can sit over the rows
  const tickRow = async (name, i) => { await clearOverlays(); await setRow(name, i).locator('input[type=checkbox]').check(); await sleep(500); };
  const LEG = { name: 'Leg Press Machine', sets: 3, reps: '8-12 reps', load: 'Moderate', starting_weight: 100, weight_unit: 'lb', cue: 'x' };

  await check(17, 'Set table: header once + one row per set; columns SET/PREVIOUS/LB/REPS/check', async () => {
    await fresh(); await startPlan('Table plan', [LEG]);
    const r = await ev(() => { const c = document.querySelector('#sessionTracker details.exercise'); return { heads: c.querySelectorAll('.st8-head').length, rows: c.querySelectorAll('fieldset.st8').length, head: c.querySelector('.st8-head').textContent.replace(/\s+/g, ' ').trim(), inputs: [...c.querySelectorAll('fieldset.st8 input[type=number]')].map(i => i.inputMode) }; });
    eq(r.heads, 1, 'header rows'); eq(r.rows, 3, 'set rows');
    ok(/SET\s*PREVIOUS\s*LB.*REPS\s*✓/.test(r.head), 'header text: ' + r.head);
    ok(r.inputs.every(m => m === 'decimal' || m === 'numeric'), 'inputmode: ' + r.inputs.join(','));
    const w = await ev(() => document.documentElement.scrollWidth); ok(w <= 390, 'horizontal overflow: ' + w);
    const over = await ev(() => [...document.querySelectorAll('#sessionTracker details.exercise fieldset.st8 *')].filter(e => e.getBoundingClientRect().width && e.getBoundingClientRect().right > 390).length); eq(over, 0, 'elements past 390px');
  });

  await check(18, 'Set table: PREVIOUS shows last session values (fallback to last set); tapping copies', async () => {
    await fresh(); await startPlan('Prev plan', [{ ...LEG, sets: 4 }]);
    const prev = await ev(() => [...document.querySelectorAll('#sessionTracker fieldset.st8 .st8-prev')].map(b => b.textContent.trim()));
    eq(JSON.stringify(prev), JSON.stringify(['180 × 15', '200 × 12', '220 × 12', '220 × 12']), 'PREVIOUS texts');
    await setRow('Leg Press Machine', 1).locator('.st8-prev').click(); await sleep(400);
    const v = await ev(() => { const r = document.querySelectorAll('#sessionTracker fieldset.st8')[1]; const s = strideSessionTracker.session().exercises[0].sets[1]; return { w: r.querySelector('.st8-load input').value, r: r.querySelector('.st8-reps input').value, sw: s.weight, sr: s.reps }; });
    eq(v.w, '200', 'copied weight input'); eq(v.r, '12', 'copied reps input'); eq(v.sw, 200, 'saved weight'); eq(v.sr, 12, 'saved reps');
  });

  await check(19, 'Set table: ticking a heavier set shows the PR pill exactly once (+ one toast)', async () => {
    await fresh(); await startPlan('PR plan', [LEG]);
    await ev(() => { window.__toasts = []; const o = window.strideToast; window.strideToast = m => { window.__toasts.push(String(m)); try { return o && o(m); } catch (e) {} }; });
    await fillRow('Leg Press Machine', 0, 200, 10); await tickRow('Leg Press Machine', 0);
    eq(await page.locator('#sessionTracker .st8-pr').count(), 0, 'pill after a lighter set');
    await fillRow('Leg Press Machine', 1, 240, 10); await tickRow('Leg Press Machine', 1); await sleep(700);
    eq(await page.locator('#sessionTracker .st8-pr').count(), 1, 'PR pills after heavier set');
    ok(/New PR/.test(await setRow('Leg Press Machine', 1).locator('.st8-pr').textContent()), 'pill text');
    const t = await ev(() => window.__toasts.filter(m => /New personal record: Leg Press Machine 240 lb × 10/.test(m)).length); eq(t, 1, 'PR toasts');
    await sleep(1000); eq(await page.locator('#sessionTracker .st8-pr').count(), 1, 'PR pills still one later');
    eq(await ev(() => window.__toasts.filter(m => /New personal record/.test(m)).length), 1, 'toasts after waiting');
  });

  await check(20, 'Set table: bodyweight row shows BW and no visible load input', async () => {
    await fresh(); await startPlan('BW plan', [{ name: 'Push-up', sets: 2, reps: '8 reps', load: 'Bodyweight', cue: 'x' }]);
    const r = await ev(() => { const row = document.querySelector('#sessionTracker fieldset.st8'); const vis = e => !!e && e.getBoundingClientRect().width > 0 && getComputedStyle(e).display !== 'none'; return { bw: vis(row.querySelector('.st8-bw')) && row.querySelector('.st8-bw').textContent.trim(), loadInput: [...row.querySelectorAll('input[type=number]')].filter(vis).length, reps: vis(row.querySelector('.st8-reps input')) }; });
    eq(r.bw, 'BW', 'BW label'); eq(r.loadInput, 1, 'visible number inputs in BW row (reps only)'); ok(r.reps, 'reps input visible');
  });

  await check(21, 'Set table: plank row shows SECONDS + both timer buttons, nothing overlaps', async () => {
    await fresh(); await startPlan('Plank plan', [{ name: 'Plank', sets: 2, reps: '30-45 seconds', load: 'Bodyweight', cue: 'x' }]);
    const r = await ev(() => { const c = document.querySelector('#sessionTracker details.exercise'); const row = c.querySelector('fieldset.st8'); const vis = e => { const b = e.getBoundingClientRect(); return b.width > 0 && b.height > 0 && getComputedStyle(e).display !== 'none'; };
      const parts = [...row.querySelectorAll('.st8-no, .st8-prev, .st8-bw, .st8-reps input, label.st8-ck, button.tmr6')].filter(vis);
      const boxes = parts.map(e => ({ n: e.className || e.tagName, b: e.getBoundingClientRect() })); const hits = [];
      for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) { const a = boxes[i].b, b = boxes[j].b; if (a.left < b.right - .5 && b.left < a.right - .5 && a.top < b.bottom - .5 && b.top < a.bottom - .5) hits.push(boxes[i].n + ' x ' + boxes[j].n); }
      return { head: c.querySelector('.st8-head').textContent, timer: [...row.querySelectorAll('button.tmr6')].some(b => vis(b) && b.textContent.trim().startsWith('⏱')), max: [...row.querySelectorAll('button.tmr6')].some(b => vis(b) && b.textContent.includes('∞ Max hold')), hits, n: parts.length, right: Math.max(...boxes.map(x => x.b.right)) }; });
    ok(/SECONDS/.test(r.head), 'header lacks SECONDS: ' + r.head); ok(r.timer, 'no visible ⏱ button'); ok(r.max, 'no visible ∞ Max hold button');
    eq(r.hits.length, 0, 'overlapping boxes: ' + r.hits.join(' | ')); ok(r.n >= 6, 'parts found: ' + r.n); ok(r.right <= 390, 'row exceeds viewport: ' + r.right);
  });

  await check(22, 'Floating bar: hidden with no session; shown with title on Home; clear of tab bar; hidden after finish', async () => {
    await fresh(); await go('home'); await sleep(1500);
    ok(await ev(() => { const b = document.getElementById('resume6'); return !b || b.hidden || b.getBoundingClientRect().height === 0; }), 'bar visible with no session');
    await startPlan('Bar plan', [LEG]);
    await tickRow('Leg Press Machine', 0);
    await go('home'); await sleep(1800);
    await ev(() => { document.querySelectorAll('dialog[open]').forEach(d => d.close()); const r = document.getElementById('restTimer'); if (r) r.hidden = true; });
    const r = await ev(() => { const b = document.getElementById('resume6'), n = document.querySelector('nav'); const bb = b.getBoundingClientRect(), nb = n.getBoundingClientRect(); return { vis: !b.hidden && bb.height > 0, title: b.querySelector('b').textContent, btn: b.querySelector('.r6-go').textContent, time: /\d+:\d\d/.test(b.querySelector('small').textContent), barBottom: bb.bottom, navTop: nb.top, barH: bb.height, pad: parseFloat(getComputedStyle(document.body).paddingBottom) }; });
    ok(r.vis, 'bar not visible during session'); eq(r.title, 'Bar plan', 'bar title'); ok(/Open/.test(r.btn), 'button: ' + r.btn); ok(r.time, 'no elapsed time');
    ok(r.barBottom <= r.navTop, 'bar overlaps tab bar: bar bottom ' + r.barBottom + ' vs nav top ' + r.navTop);
    ok(r.pad >= 120 + r.barH, 'page bottom padding ' + r.pad + ' < nav 120 + bar ' + r.barH);
    await go('train'); await sleep(600);
    const c = await ev(() => { const c = document.getElementById('workoutControls'); const b = c.getBoundingClientRect(); return { vis: !c.hidden && b.height > 0, h: b.height, title: c.querySelector('strong').textContent, dot: getComputedStyle(c, '::before').backgroundColor, btn: document.getElementById('workoutPauseResume').textContent }; });
    ok(c.vis && c.h < 90, 'in-session controls not a compact bar: ' + c.h); eq(c.title, 'Bar plan', 'controls title'); ok(/Pause/.test(c.btn), 'controls button: ' + c.btn);
    await ev(() => document.getElementById('workoutPauseResume').click()); await sleep(700);
    const p = await ev(() => { const c = document.getElementById('workoutControls'); return { st: c.dataset.st, btn: document.getElementById('workoutPauseResume').textContent }; }); eq(p.st, 'paused', 'paused state'); ok(/Resume/.test(p.btn), 'paused button: ' + p.btn);
    await ev(() => document.getElementById('workoutPauseResume').click()); await sleep(500);
    const fin = page.locator('#finishSession'); await fin.click(); await sleep(800); await finishDialogs();
    ok(!(await ev(() => strideSessionTracker.isActive())), 'session still active');
    await go('home'); await sleep(1500);
    ok(await ev(() => { const b = document.getElementById('resume6'); return !b || b.hidden || b.getBoundingClientRect().height === 0; }), 'bar still visible after finish');
    ok(await ev(() => { const c = document.getElementById('workoutControls'); return !c || c.hidden || c.offsetParent === null; }), 'controls still visible after finish');
    ok(await ev(() => !document.body.classList.contains('fb8-vis')), 'bar padding class left on after finish');
  });

  await check(23, 'Log form: saving a run with distance adds one workout with right miles/minutes', async () => {
    await fresh(); await go('log'); await sleep(500);
    const before = await ev(() => db.workouts.length);
    await ev(() => { const t = document.getElementById('workoutType'); t.value = 'Long Run'; t.dispatchEvent(new Event('change', { bubbles: true })); }); await sleep(700);
    ok(await page.locator('#distance').isVisible(), 'distance not shown for a run');
    const set = async (id, v) => { const l = page.locator('#' + id); await l.fill(String(v)); await l.dispatchEvent('input'); await l.dispatchEvent('change'); };
    await set('distance', '3.1'); await set('durationHours', '0'); await set('durationMinutes', '30'); await set('durationSeconds', '0'); await sleep(300);
    const lay = await ev(() => { const g = id => document.getElementById(id).getBoundingClientRect(); const h = g('durationHours'), m = g('durationMinutes'), s = g('durationSeconds'); const sv = document.querySelector('#workoutForm .v6-start').getBoundingClientRect(), f = document.getElementById('workoutForm').getBoundingClientRect(); return { oneRow: Math.abs(h.top - m.top) < 2 && Math.abs(m.top - s.top) < 2, full: sv.width > f.width * 0.9 }; });
    ok(lay.oneRow, 'h/m/s not on one row'); ok(lay.full, 'Save button not full width');
    await page.locator('#workoutForm .v6-start').click(); await sleep(800); await finishDialogs(); await sleep(500);
    eq(await ev(() => db.workouts.length), before + 1, 'workouts after saving the run');
    const w = await ev(() => db.workouts[db.workouts.length - 1]); eq(w.miles, 3.1, 'miles'); eq(w.minutes, 30, 'minutes'); eq(w.type, 'Long Run', 'type');
    await go('log'); await ev(() => { const t = document.getElementById('workoutType'); t.value = 'Core'; t.dispatchEvent(new Event('change', { bubbles: true })); }); await sleep(700);
    ok(!(await page.locator('#distance').isVisible()), 'distance still shown for Core');
  });

  await check(24, 'Flag off (newSetTable=false): old set UI renders, no set-table header, old flow works', async () => {
    await fresh({ init: () => { window.STRIDE_FLAGS = { newSetTable: false }; } });
    eq(await ev(() => window.STRIDE_FLAGS.newSetTable), false, 'flag value');
    await startPlan('Flag off plan', [LEG, { name: 'Plank', sets: 1, reps: '30 seconds', load: 'Bodyweight', cue: 'x' }]);
    const r = await ev(() => ({ head: document.querySelectorAll('.st8-head').length, st8: document.querySelectorAll('fieldset.st8').length, old: document.querySelectorAll('#sessionTracker fieldset.v6-set .v6-rm').length, dup: document.querySelectorAll('#sessionTracker .dup7').length, wrap: document.querySelectorAll('.st8-actions').length, prev: document.querySelectorAll('.st8-prev').length }));
    eq(r.head, 0, 'set-table headers'); eq(r.st8, 0, 'set-table rows'); eq(r.prev, 0, 'PREVIOUS buttons'); eq(r.wrap, 0, 'wrapped action rows'); eq(r.old, 4, 'old remove buttons'); ok(r.dup >= 1, 'Copy last set button');
    const cb = page.locator('#sessionTracker details.exercise').first().locator('input[type=checkbox]').first(); await cb.check(); await sleep(300); ok(await cb.isChecked(), 'tick did not stick');
    ok(await ev(() => [...document.querySelectorAll('#sessionTracker button')].some(b => b.textContent.includes('∞ Max hold'))), 'old plank Max hold button missing');
  });
}

async function main() {
  const t0 = Date.now();
  console.log('Building...');
  execFileSync('node', ['scripts/build.cjs'], { cwd: ROOT, stdio: 'inherit' });
  const server = await serve(); base = 'http://127.0.0.1:' + server.address().port;
  browser = await chromium.launch();
  try {
    if (process.env.SAFETY_PROBE) { await fresh(); await require(path.resolve(process.env.SAFETY_PROBE))(page, { go, FIX, logMeal, ev, sleep }); }
    else await runChecks();
  } catch (e) { console.error('SETUP FAILURE', e); results.push({ n: 0, name: 'setup', ok: false, detail: String(e.message) }); }
  await browser.close(); server.close();
  const failed = results.filter(r => !r.ok);
  console.log('\n#   Result  Check');
  for (const r of results) console.log(`${String(r.n).padStart(2)}  ${r.ok ? 'PASS  ' : 'FAIL  '}  ${r.name}${r.ok ? '' : '  -- ' + r.detail}`);
  console.log(`\n${results.length - failed.length}/${results.length} passed in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
  process.exit(failed.length ? 1 : 0);
}
main();
