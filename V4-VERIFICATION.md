# Stride & Strength V4

Based on repository main commit a309cf6aaaa54c7e7ac72217bdde16a307e12b99.

## Changes

- Achievements tab calculated from saved workouts, running distance, core categories, and meal records.
- Integrated Bed, Standing, Gym, Deep Core & Stability, and Post-Run routines with 5/8/15/20-minute options, checkboxes, partial completion, actual minutes, and history. Core sessions use the existing workouts table and retain source metadata.
- Dynamic run warm-up and post-run/legs and upper-body stretch routines with clear cues and durations.
- Separate camera input, meal photo preview, and remove-photo control feeding the existing authenticated AI estimate/review/save flow.
- Edit and confirmed Delete on meals, workouts, and weigh-ins. Edits preserve IDs; cloud deletions are scoped to user and record, stored until successful, and retried before refresh. Failed sync changes stay local until retry succeeds.
- Existing Supabase URL, public key, auth client, tables, meal function, Netlify function directory, and browser storage key retained. No schema migration or production-record mutation was performed during development.

## Verification completed

- `node --check v4.js`
- `git diff --check`
- `node meal-function.cjs`: passed original function tests for method/config/auth validation, authenticated text/photo requests, response rounding, invalid payloads and expired auth.
- `JSDOM_PATH=/tmp/stride-v4-test-deps/node_modules/jsdom node v4.dom.cjs`: passed five categories, 8-minute default, partial completion, achievements, AI review flow, camera wiring/preview, stable edit IDs, meal/workout/weight delete, user-scoped delete filters, cloud refresh, failed edit/delete retry, source preservation, kg conversion, stretches, and safe text rendering.

DOM integration tests mock Supabase, authentication, AI responses, image decoding and dialog methods. Function tests mock external requests. They do not confirm live credentials, database DELETE policies, a physical camera, visual layout, or real AI estimates.

## Remaining before production completion

The browser integration test is included in `v4.browser.cjs`, but could not run here: no Chromium executable was installed, and the browser download failed. Run with Playwright and Chromium installed. Check mobile layout, native camera/photo selection, live sign-in, real estimates, edit/delete and refresh using disposable test records on the deployment preview. Existing Supabase row-level policies must allow DELETE for records belonging to the authenticated user.

Use the connected GitHub repository to publish through the existing Netlify build, retaining the meal function and configured environment variables.
