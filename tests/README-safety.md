# Safety check (browser regression suite)

`tests/safety-check.cjs` loads the real built app in headless Chromium (390x844), signs in as a fixed test user
against a fake Supabase client that serves `tests/fixtures/real-account.json`, so the real `loadCloud` path runs.
The clock is frozen at 2026-10-31 12:00 local, so "today" is deterministic. Network (unsplash, openfoodfacts,
supabase.co) is blocked.

## Run

```
npm run safety          # or: node tests/safety-check.cjs
```

It runs `node scripts/build.cjs`, serves `dist/` on a free port, prints PASS/FAIL per check and a summary table,
and exits 1 if any check fails (all checks always run). Needs Playwright at `/opt/npm-tools/node_modules/playwright-core`.
Takes about 45 seconds. Each check gets a fresh browser context (empty localStorage), so checks do not affect each other.

## Add a check when a bug is fixed

1. Open `tests/safety-check.cjs`, go to `runChecks()` and append a `await check(N, 'Area: what must stay true', async () => { ... })`.
2. Start with `await fresh()` (new page, data loaded from the fixture), then `await go('meals')` etc. (`go` = `show(view)`).
3. Assert with `ok(cond, msg)` / `eq(actual, expected, msg)`; throw = FAIL. Prefer ids, classes and aria-labels over visible text.
   Helpers: `ev` (page.evaluate), `logMeal(food, cal, protein)` (real manual form), `sleep`, `until`, `FIX` (fixture), `TODAY`.
4. Do not use `page.waitForFunction` (the frozen clock stalls page timers); use `until(fn, arg)` which polls from Node.
   Inputs the app saves on `change` need `dispatchEvent('change')` after `fill`.
5. Make sure the check FAILS on the old (buggy) code, then passes on the fix. If you need other data, add rows to the
   fixture (cloud row shapes) or set state with `ev(() => { db...; save(); render(); })`.
6. For debugging, `SAFETY_PROBE=/path/to/script.cjs node tests/safety-check.cjs` runs `module.exports = async (page, helpers) => {}` on a loaded page instead of the checks.

## Known real app bugs this suite reports (checks stay red until fixed)

- Check 12 (Copy last set): `train-extras.js` keeps a reference to the exercise `<details>` and, after "Add set" re-renders the tracker,
  queries the detached element, so the new set is added empty instead of copying reps/weight.
- Check 15 (console errors): `index.html` base `render()` does `$('weightGraph').replaceChildren()`, but the redesign removes that node,
  so every render logs `render TypeError: Cannot read properties of null (reading 'replaceChildren')` (caught in `v4.js`).
