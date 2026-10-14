# Stride & Strength AI Meal Logger

## Deployment

Copy **all files and directories** into the root of your GitHub repository (not only index.html):
- `index.html`
- `netlify.toml`
- `netlify/functions/analyze-meal.js`

In Netlify, Site configuration → Environment variables, add `OPENAI_API_KEY` with your own OpenAI API key. Mark it secret/sensitive if available. Never paste the key into GitHub or HTML. Trigger a fresh deploy. The API is billed separately by OpenAI.

Sign in to Supabase in the app. Under Meals, describe a meal and/or select a photo, click Estimate, review and edit the results, then click Use estimate and **Save meal**. The existing Supabase sync code writes the record to the `meals` table.

## Important

This version requires Netlify Functions and a valid OpenAI API key. Netlify's static-only deployment or copying only index.html will not enable AI analysis. Estimates are not precise nutrition facts. Keep your previous backup before replacing files.

This endpoint verifies Supabase authentication before using OpenAI. For a public/multi-user deployment, add per-user rate limiting, quotas, monitoring and spending limits before launch.

## V4

V4 adds Achievements, an integrated five-category Core Workout Library with an 8-minute option, guided stretches, meal camera capture/preview, and Edit/Delete for meal, workout and weight history. Include `v4.js` alongside `index.html` when deploying. The original `netlify/functions/analyze-meal.js` and `netlify.toml` remain required. Deploy to the existing Netlify site to retain its configured environment variables.

Core completion uses the existing `workouts` table. Editing upserts the original record ID; deleting sends a user-scoped delete to the existing table and retries on sync failure. No new tables or credentials are required. See `V4-VERIFICATION.md` for test evidence and remaining live checks.

### Tests

Install `jsdom` and `playwright` in a separate test environment, then run:

```sh
node meal-function.cjs
node v4.dom.cjs
node v4.browser.cjs
```

Browser tests require `playwright install chromium`. Tests use fake records and mocked cloud/AI services; they never write to production Supabase.
