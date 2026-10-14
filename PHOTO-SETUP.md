# Private transformation photo setup

This setup was applied to the live stride-strength project on October 14, 2026. Its ownership rules passed SQL tests; no temporary test records remain. The steps below document the setup for reference.

1. Open the app's Supabase project, `gwagccrxnqicorqmcrma`.
2. In SQL Editor, run `supabase/transformation-photos.sql` once. It creates the private bucket, photo metadata table, and policies that allow authenticated users to access only their own photos.
3. Deploy the application only after verifying this setup with signed-in test accounts. Existing workout and meal data do not need migration.
4. Under Progress → My Transformation, add a photo, reload, compare two photos, and delete a test photo. In another signed-in account, confirm those photos do not appear and requests for another owner's photo fail.

The bucket is `stride-transformation-private-v5`; do not make it public. Views use short-lived signed URLs. Uploads are re-encoded as JPEG with a maximum long edge of 1,600 px, removing the original file's EXIF metadata. Image bytes and signed URLs are excluded from the app's JSON backup. Authentication and row-level policies control access; there is no public sharing feature.

Photos require network access. An upload is not reported as successful until both Storage and the metadata insert succeed. If the metadata insert fails, the app attempts to remove the uploaded object. Any failed cleanup is reported explicitly.
