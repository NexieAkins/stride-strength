# Native release preparation

This folder is an isolated Capacitor 8 mobile project. The production website is unchanged. Web assets are bundled into the app; backend functions remain at the existing Netlify origin until the confirmed domain is connected. No private signing material belongs in this repository.

## Build

Node 22+:

    npm ci
    npm run sync

Android: JDK 21 and Android SDK, then `cd android && ./gradlew assembleDebug`. For Play Store, configure secure upload signing and build a signed release AAB; a debug APK is not a store release.

iOS/watch: on a Mac with supported Xcode, install XcodeGen, then `cd ios/App && xcodegen generate`. Open App.xcodeproj, select the owner's development team for both targets, enable the watch target's HealthKit capability, and build on a paired iPhone/Apple Watch. Bundle identifiers are provisional until the owner's store records are checked.

## Apple Watch first implementation

Open the watch app so WatchConnectivity is reachable, then use the iPhone app's Apple Watch workout section. The watch requests HealthKit workout/heart-rate/distance authorization and owns the workout session. The phone receives session-scoped measurements, and the user reviews a finished run before logging it.

This is source implementation, not a verified wearable release. Current limitations: no recovery of the website's selected watch session after the phone process is killed; no automatic HealthKit historical-workout import; no Android/Wear OS integration. These are release blockers where store marketing would imply support. A watch workout already running must be stopped on the watch if the app account changes.

`release/STORE-LISTING.md` contains draft listing text and the remaining account, privacy and testing requirements.

The unsigned GitHub workflow builds iOS/watch simulator targets and Android debug. It neither signs nor publishes applications.
