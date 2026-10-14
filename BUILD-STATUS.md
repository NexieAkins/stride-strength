# Stride & Strength V5 combined build

Based on the current GitHub V4 source, with the approved V5 preview's five themes. The private-photo migration has been applied to the live Supabase project; GitHub write access is now connected through NexieAkins, and frontend publication is in progress.

Implemented:
- One set-by-set tracker for AI, default, custom, and Core Library plans; individual reps/holds, weights and units; paused timing; save/resume drafts; end-of-session summaries.
- Drafts excluded from workout history; partial workouts excluded from completion awards and streaks.
- Adaptive core prescriptions: exercise count, sets, reps and hold times change with the selected duration.
- My Kitchen: ingredients and amounts, allergies/preferences, meal/day planning, cooking-time limit, available-only or small-shopping-list modes; estimated per-serving nutrition; review before logging.
- Account-scoped saved kitchen plans and menus on this device, with protection against responses from an earlier account appearing after a switch.
- My Transformation: private cloud uploads, dated timeline, optional notes, photo views, comparisons, deletion, resized JPEGs, and short-lived private views. The live storage setup was applied and SQL ownership checks passed; see PHOTO-SETUP.md.
- Midnight, Daylight, Sage, Rose and Ocean skins; account-scoped display name; dashboard nutrition from real logged records.
- Netlify build copies only application assets into dist. Tests and database setup files are excluded from the published site.

Validation:
- DOM tests passed for workout tracking, reload/resume, account changes, core adaptation, cloud serialization and mocked cloud reload.
- Mocked kitchen endpoint tests passed for auth gates, input/output validation, ingredient modes and error handling; DOM checks passed for ingredient saving, review-to-log flow, and stale-response rejection.
- Photo DOM tests passed for private views, comparison, resized upload, deletion, failed metadata cleanup, invalid formats, and account changes.
- Photo migration executed against local Postgres (PGlite). Own-account reads/writes/deletes succeeded; other-account reads/deletes/forged uploads were blocked; anonymous access was denied.
- Real Chromium tests passed for workout reload/resume, separate set values, partial and completed sessions, summary display, theme switching, and every page at 320 px, 390 px and 1440 px without horizontal overflow.
- All application JavaScript syntax checks passed.

Live database verification: photo RLS enabled, bucket private, three photo policies and three storage policies present, anonymous SELECT denied, authenticated UPDATE/TRUNCATE denied. A transaction verified own-account insert/read/delete, other-account read/delete blocking and forged-owner insert blocking; no test records remain. Authenticated Storage HTTP uploads and real AI provider responses still require a signed-in app check after frontend deployment.

Local commands: npm install, npm test, npm run build. For browser checks, install Chromium with npx playwright install chromium, then npm run test:browser. The test starts its own server. A serverless Chromium alternative was used in this environment because standard binary downloads were unavailable; that alternative is a test-only dependency installed outside the project.
