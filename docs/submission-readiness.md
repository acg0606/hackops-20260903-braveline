# RevenueCat Shipaton 2026 readiness

## Local evidence complete

- Prepare, Rehearse, Ready-empty, and Plus-preview surfaces are implemented and captured.
- TypeScript, 37 tests, ESLint, Expo dependency compatibility, web export, and an Android API 36 debug APK are green.
- RevenueCat native packages and the `braveline_pro` entitlement boundary are present.
- The unconfigured build is fail-closed: Plus says preview only and cannot purchase.

## External gates still open

- **HOLD — native privacy smoke:** record, play, retry, and delete on an API 36 emulator/device; also inspect dark mode and 1.3 font scale.
- **HOLD — RevenueCat:** create or select the real project, offering, product, and public SDK key; verify purchase or restore. Never commit keys.
- **HOLD — store:** publish the first public Android version within the event window and retain its listing receipt.
- **HOLD — media:** capture a compliant 1179x2556 native screenshot and publish a public video of at most two minutes.
- **HOLD — Devpost:** recheck the logged-in registration, populate the entry, and submit only after every required receipt exists.

The current APK and screenshots are local debug evidence, not store, purchase, registration, or submission receipts.
