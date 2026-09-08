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

- **FACT — RevenueCat configuration:** project `0b5db614`, offering `default`, Test Store products `lifetime`, `yearly`, and `monthly`, entitlement `braveline_pro`, and paywall `wfc1e1a89be5494283` are configured. The paywall is published and explicitly says `TEST STORE · NO REAL CHARGE`. See [`evidence/revenuecat-configuration-20260908.md`](evidence/revenuecat-configuration-20260908.md).
- **FACT — RevenueCat device receipt:** an Android API 36 development build loaded the published paywall, completed a simulated annual Test Store purchase, read back the active `braveline_pro` entitlement, and completed restore. No real store or charge was used. See [`evidence/revenuecat-test-store-20260908/receipt.md`](evidence/revenuecat-test-store-20260908/receipt.md).
- **FACT — Next Gen route:** the [official rules](https://revenuecat-shipaton-2026.devpost.com/rules) allow an eligible active student to submit a public open-source repository and public English demo video instead of a store listing. This route avoids creating a paid Google Play developer account.
- **FACT — Next Gen eligibility evidence:** on 2026-09-08 the entrant confirmed active enrollment at Fundação FAT and supplied an academic email. The academic domain is listed in [JetBrains/swot](https://raw.githubusercontent.com/JetBrains/swot/master/lib/domains/br/org/fatcursos.txt). The full address is restricted to the Devpost academic field; final eligibility review belongs to the organizers.
- **IN PROGRESS — public repository:** publication of the existing MIT-licensed repository is authorized. Seven commits and 145 tracked files were scanned before publication; no high-confidence secrets or tracked credential files were found. Generic matches were synthetic unit-test fixtures. Anonymous access must be verified separately.
- **HOLD — media:** publish the verified 56-second English device walkthrough to a public YouTube or Vimeo URL and retain an anonymous readback.
- **HOLD — Devpost:** recheck the logged-in registration, populate the entry, and submit only after every required receipt exists.

The APKs and screenshots are local emulator evidence, not a Play Store transaction, public store, eligibility, public-video, or submission receipt. The RevenueCat Test Store receipt proves only a simulated purchase and restore. The UI-hardening APK is an x86_64 test build signed with the repository's current release signing configuration; it is not a Play Store artifact.
