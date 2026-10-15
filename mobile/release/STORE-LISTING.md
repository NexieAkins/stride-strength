# Stride & Strength — draft store listing

Status: preparation only. No App Store or Play Store submission has been made.

Name: Stride & Strength
Subtitle: Run, lift and fuel your goals
Category: Health & Fitness
Android short description: Plan workouts, track runs, log meals and see your progress.

Build a routine that fits your life. Stride & Strength brings running, strength training, meal planning and progress tracking together.

- Choose a weekly schedule and create workouts for your experience, available equipment and time.
- Record individual sets, repetitions and weights, with pause, resume and session summaries.
- Build a running-goal roadmap and review a starting week matched to your current training.
- Log completed runs and review pace, notes and personal feedback.
- Plan practical meals from your kitchen ingredients and food preferences, with your training week as context.
- Keep a private progress photo log and see workout and nutrition history in clear daily cards.

Workout energy and nutrition figures are estimates. The app does not provide diagnosis or medical treatment.

Do not advertise live Apple Watch support until unsigned build checks, signed paired-device tests and background/reconnection tests pass. Android watch integration is not implemented.

## Store fields requiring the owner/account

- Confirm the final bundle/package IDs before registering or uploading. Current development identifiers: com.strideandstrength.app and com.strideandstrength.app.watchkitapp.
- Developer legal entity and public support contact.
- Confirmed primary domain, support URL and published privacy-policy URL.
- App Store Team ID and signing through Xcode/App Store Connect; Google Play app record and secure Android upload signing.
- Accurate App Privacy and Google Play Data Safety responses based on the final binary and services.
- Age rating, export-compliance answers, countries, availability and pricing.
- Real device screenshots and a review account with working features. No fabricated screenshots.

## Submission blockers

- Native builds and paired-device verification.
- Functional in-app account-deletion initiation and the required external deletion route for Google Play. Existing record deletion is not account deletion.
- Published privacy policy and support details approved by the operator. It must cover Supabase account/fitness/photo storage and model-provider processing of submitted photos/text.
- Explicit health-data consent and accurate HealthKit disclosures. Health data is not for advertising.
- Verify camera/library permissions, location denial, auth restoration, offline failures, safe-area layout, file uploads and native network requests.
- Verify watch workout survives phone backgrounding, permission denial, dropped connection and app relaunch; prevent duplicate logs.
- Signed TestFlight/internal-track builds before production submission.

Release blocker: replace Capacitor template app icons and splash branding with approved Stride & Strength assets before submission.
