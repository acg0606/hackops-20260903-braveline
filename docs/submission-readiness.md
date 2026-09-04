# RevenueCat Shipaton 2026 readiness

## Local evidence complete

- Prepare, Rehearse, Ready-empty, and Plus-preview surfaces are implemented and captured.
- TypeScript, 42 tests, ESLint, Expo dependency compatibility, web export, and the exact installed Android API 36 debug APK are green.
- RevenueCat native packages and the `braveline_pro` entitlement boundary are present.
- The unconfigured build is fail-closed: Plus says preview only and cannot purchase.
- A clean API 36 run proved native recording, non-empty app-private storage, playback/pause, explicit deletion of both audio and metadata, retry navigation, and a final clean sandbox. See [`evidence/native-pass-20260904/receipt.md`](evidence/native-pass-20260904/receipt.md).
- A second clean API 36 run proved safe areas, truthful guide state, verified Ready recovery after force-stop, confirmed delete-before-retry, exact one-phrase focus, a replacement take with no orphaned predecessor, and final deletion. See [`evidence/native-pass-20260904-r2/receipt.md`](evidence/native-pass-20260904-r2/receipt.md).

## External gates still open

- **HOLD — release hardening:** implement and capture dark mode, 1.3 font scale, and expanded or landscape layouts.
- **HOLD — RevenueCat:** create or select the real project, offering, product, and public SDK key; verify purchase or restore. Never commit keys.
- **HOLD — store:** publish the first public Android version within the event window and retain its listing receipt.
- **HOLD — media:** capture a compliant 1179x2556 native screenshot and publish a public video of at most two minutes.
- **HOLD — Devpost:** recheck the logged-in registration, populate the entry, and submit only after every required receipt exists.

The current APK and screenshots are local debug evidence, not store, purchase, registration, or submission receipts.
