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
