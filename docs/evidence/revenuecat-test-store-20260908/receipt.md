# RevenueCat Test Store device receipt — 2026-09-08

## FACT

- BraveLine commit `882ba6f3e19a7a7d7ad49a6d5a4c3e45b2db506c` was exported to the short Windows staging path `C:\blrcbuild` and assembled as an x86_64 Android API 36 development build.
- The debug APK was installed on the `StudyPebble_API_36` emulator. APK size: `87,231,377` bytes. SHA-256: `BAE3046568A637231D9633F7BB0D887022322D5E6F06A20F7FAF9A8D20B943E4`.
- The RevenueCat public Test Store SDK key was injected only into the Metro process environment. It was not written to the repository or this receipt.
- The native SDK initialized and changed the in-app status from `REVENUECAT IDLE` to `REVENUECAT READY`.
- The published paywall loaded on device with annual and monthly packages and the disclosure `TEST STORE · NO REAL CHARGE`.
- The RevenueCat Test Store confirmation identified product `yearly` and explicitly described the operation as a test purchase for development.
- `TEST VALID PURCHASE` completed without a real store or real charge. BraveLine then read back the active `braveline_pro` entitlement and displayed `PLUS VERIFIED — REVENUECAT`.
- After `Restore purchases` was selected on the same development build, the UI retained the active entitlement and displayed `Restore completed. BraveLine Plus is active and verified by RevenueCat.` together with `LAST REVENUECAT ACTION · RESTORE`. A subsequent code review found that this UI message did not establish successful completion of the restore operation; see the correction below.

## Evidence

- `01-plus-ready.png` — initialized native SDK with no entitlement yet.
- `02-test-store-paywall.png` — RevenueCat paywall rendered on device.
- `03-purchase-verified.png` — active entitlement immediately after the simulated valid purchase.
- `04-restore-verified.png` — retained screenshot of the previous UI restore-success message and active entitlement. The historical filename is preserved; it does not independently prove successful restore.

## Historical correction — superseded by fresh native restore verification

The earlier UI set its restore-success message from `snapshot.isPro` without checking the operation's `ok` result. A failed restore could preserve an already-active entitlement and display the same message. That finding required a fresh device run with corrected receipt handling before successful restore could be claimed. It does not invalidate the separately observed `TEST VALID PURCHASE` confirmation and subsequent active entitlement.

That follow-up requirement was met on 2026-09-08. The [corrected native receipt](../native-demo-20260908-r2/receipt.md) records a successful Test Store restore with `RESTORE VERIFIED` in `12-restore-result.xml/png`. Its `13-paywall-outcome.xml/png` separately verifies that existing access correctly reports `PAYWALL NOT PRESENTED` and no new purchase or restore. These fresh checkpoints supersede the earlier restore-verification hold; they do not retroactively make `04-restore-verified.png` proof of successful restore.

## Boundary

This historical receipt records an observed simulated annual RevenueCat Test Store purchase and active entitlement on an Android API 36 emulator. Successful restore is separately verified by the corrected native receipt linked above. Neither receipt proves a Google Play transaction, real revenue, public store release, public video, Next Gen eligibility, or Devpost submission.
