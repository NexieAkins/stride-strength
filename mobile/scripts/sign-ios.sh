#!/bin/bash
set -euo pipefail
umask 077
SIGN_DIR="$RUNNER_TEMP/stride-signing"
mkdir -p "$SIGN_DIR"
for name in APPLE_DISTRIBUTION_P12_BASE64 APPLE_DISTRIBUTION_P12_PASSWORD APPLE_IOS_PROFILE_BASE64 APPLE_WATCH_PROFILE_BASE64 APP_STORE_CONNECT_KEY_ID APP_STORE_CONNECT_ISSUER_ID APP_STORE_CONNECT_PRIVATE_KEY; do
  if [ -z "${!name:-}" ]; then echo "Missing required secret: $name"; exit 1; fi
done
printf '%s' "$APPLE_DISTRIBUTION_P12_BASE64" | base64 --decode > "$SIGN_DIR/distribution.p12"
printf '%s' "$APPLE_IOS_PROFILE_BASE64" | base64 --decode > "$SIGN_DIR/ios.mobileprovision"
printf '%s' "$APPLE_WATCH_PROFILE_BASE64" | base64 --decode > "$SIGN_DIR/watch.mobileprovision"
printf '%s' "$APP_STORE_CONNECT_PRIVATE_KEY" > "$SIGN_DIR/AuthKey_${APP_STORE_CONNECT_KEY_ID}.p8"
KEYCHAIN_PASSWORD=$(openssl rand -hex 24)
security create-keychain -p "$KEYCHAIN_PASSWORD" "$SIGN_DIR/build.keychain-db"
security set-keychain-settings -lut 21600 "$SIGN_DIR/build.keychain-db"
security unlock-keychain -p "$KEYCHAIN_PASSWORD" "$SIGN_DIR/build.keychain-db"
security import "$SIGN_DIR/distribution.p12" -P "$APPLE_DISTRIBUTION_P12_PASSWORD" -A -t cert -f pkcs12 -k "$SIGN_DIR/build.keychain-db"
security list-keychains -d user -s "$SIGN_DIR/build.keychain-db" "$HOME/Library/Keychains/login.keychain-db"
security set-key-partition-list -S apple-tool:,apple:,codesign: -s -k "$KEYCHAIN_PASSWORD" "$SIGN_DIR/build.keychain-db" >/dev/null
security cms -D -i "$SIGN_DIR/ios.mobileprovision" > "$SIGN_DIR/ios.plist"
security cms -D -i "$SIGN_DIR/watch.mobileprovision" > "$SIGN_DIR/watch.plist"
python3 mobile/scripts/prepare-signing.py
(cd mobile/ios/App && xcodegen generate)
xcodebuild -project mobile/ios/App/App.xcodeproj -scheme App -configuration Release -destination 'generic/platform=iOS' -archivePath "$SIGN_DIR/Stride.xcarchive" CURRENT_PROJECT_VERSION="$GITHUB_RUN_NUMBER" archive
xcodebuild -exportArchive -archivePath "$SIGN_DIR/Stride.xcarchive" -exportOptionsPlist "$SIGN_DIR/ExportOptions.plist" -exportPath "$SIGN_DIR/export" -authenticationKeyPath "$SIGN_DIR/AuthKey_${APP_STORE_CONNECT_KEY_ID}.p8" -authenticationKeyID "$APP_STORE_CONNECT_KEY_ID" -authenticationKeyIssuerID "$APP_STORE_CONNECT_ISSUER_ID"
