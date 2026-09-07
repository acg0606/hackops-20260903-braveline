# RevenueCat Shipaton 2026 readiness

## Local evidence complete

- Prepare, Rehearse, Ready-empty, and Plus-preview surfaces are implemented and captured.
- TypeScript, 42 tests, ESLint, Expo dependency compatibility, web export, and the exact installed Android API 36 debug APK are green.
- RevenueCat native packages and the `braveline_pro` entitlement boundary are present.
- The unconfigured build is fail-closed: Plus says preview only and cannot purchase.
- A clean API 36 run proved native recording, non-empty app-private storage, playback/pause, explicit deletion of both audio and metadata, retry navigation, and a final clean sandbox. See [`evidence/native-pass-20260904/receipt.md`](evidence/native-pass-20260904/receipt.md).
- A second clean API 36 run proved safe areas, truthful guide state, verified Ready recovery after force-stop, confirmed delete-before-retry, exact one-phrase focus, a replacement take with no orphaned predecessor, and final deletion. See [`evidence/native-pass-20260904-r2/receipt.md`](evidence/native-pass-20260904-r2/receipt.md).
- Release UI hardening is implemented and captured on Android API 36: automatic light/dark theming, portrait rendering, and a two-column landscape rehearsal at system font scale 1.3. See [`native-ui-hardening-evidence.md`](native-ui-hardening-evidence.md).
- The configured app icon at `assets/images/icon.png` is 1024×1024.
- A native Android API 36 emulator capture at the required 1179×2556 pixel dimensions is preserved at `docs/evidence/submission-assets/braveline-android-1179x2556.png`. It has no device frame and is local emulator evidence, not a store-listing receipt.

## External gates still open

- **HOLD — RevenueCat:** create or select the real project, offering, product, and public SDK key; verify purchase or restore. Never commit keys.
- **HOLD — store:** publish the first public Android version within the event window and retain its listing receipt.
- **HOLD — media:** select the final 1179×2556 capture after the store build is fixed, then publish a public YouTube or Vimeo video of at most two minutes.
- **HOLD — Devpost:** recheck the logged-in registration, populate the entry, and submit only after every required receipt exists.

The APKs and screenshots are local emulator evidence, not store, purchase, registration, or submission receipts. The UI-hardening APK is an x86_64 test build signed with the repository's current release signing configuration; it is not a Play Store artifact.
