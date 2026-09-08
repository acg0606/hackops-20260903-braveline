# RevenueCat Test Store device receipt — 2026-09-08

## FACT

- BraveLine commit `882ba6f3e19a7a7d7ad49a6d5a4c3e45b2db506c` was exported to the short Windows staging path `C:\blrcbuild` and assembled as an x86_64 Android API 36 development build.
- The debug APK was installed on the `StudyPebble_API_36` emulator. APK size: `87,231,377` bytes. SHA-256: `BAE3046568A637231D9633F7BB0D887022322D5E6F06A20F7FAF9A8D20B943E4`.
- The RevenueCat public Test Store SDK key was injected only into the Metro process environment. It was not written to the repository or this receipt.
- The native SDK initialized and changed the in-app status from `REVENUECAT IDLE` to `REVENUECAT READY`.
- The published paywall loaded on device with annual and monthly packages and the disclosure `TEST STORE · NO REAL CHARGE`.
- The RevenueCat Test Store confirmation identified product `yearly` and explicitly described the operation as a test purchase for development.
- `TEST VALID PURCHASE` completed without a real store or real charge. BraveLine then read back the active `braveline_pro` entitlement and displayed `PLUS VERIFIED — REVENUECAT`.
- `Restore purchases` completed on the same development build. The UI retained the active entitlement and displayed `Restore completed. BraveLine Plus is active and verified by RevenueCat.` together with `LAST REVENUECAT ACTION · RESTORE`.

## Evidence

- `01-plus-ready.png` — initialized native SDK with no entitlement yet.
- `02-test-store-paywall.png` — RevenueCat paywall rendered on device.
- `03-purchase-verified.png` — active entitlement immediately after the simulated valid purchase.
- `04-restore-verified.png` — explicit restore receipt and entitlement readback.

## Boundary

This proves a simulated RevenueCat Test Store purchase and restore on an Android API 36 emulator. It does not prove a Google Play transaction, real revenue, public store release, public video, Next Gen eligibility, or Devpost submission.
