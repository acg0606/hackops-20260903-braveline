# BraveLine native pass receipt — 2026-09-04

## Scope

This receipt covers one clean local-debug Android run of the BraveLine MVP. It proves native rehearsal, recording, local playback, the preview-only Plus boundary, explicit deletion, and retry navigation. It does not prove a RevenueCat purchase, store release, public video, Devpost registration, or Devpost submission.

## Environment

- Host time window: 2026-09-04, approximately 16:00–16:18 America/Sao_Paulo.
- AVD: `StudyPebble_API_36`.
- Android API: `36`.
- Package: `com.braveline.rehearse`.
- Version: `0.1.0`; target SDK `36`; debug build.
- JavaScript/native match: Expo `57.0.19`, Expo Router `57.0.18`, Expo Audio `57.0.4`, React Native `0.86.3`.
- Tested APK: `artifacts/native/braveline-debug-api36-20260904.apk`.
- APK size: `87,231,369` bytes.
- APK SHA-256: `C419B6426A80F07B0F9C0B0D533BE64F86FDF9013938167656356B0BE2A17186`.
- The installed `base.apk` returned the same SHA-256.

## Automated checks

- TypeScript: pass.
- Vitest: 9 files, 38/38 tests pass.
- ESLint `src`: pass with no warnings or errors.
- Expo dependency compatibility: pass.

## Native journey

1. `01-prepare.*`: Prepare rendered and exposed `Start Quiet Coach`.
2. `02-rehearse.*`: Rehearse exposed `Hear Quiet Coach` and `Start my take`.
3. `03-quiet-coach.*`: guide speech was active and exposed `Stop Quiet Coach`; it completed naturally and returned to `Hear Quiet Coach`.
4. `04-recording.*`: native recording stayed active for more than five seconds and exposed `Stop and review my take`.
5. `05-ready.*`: recording completion reached `BRAVELINE / READY` and exposed `Play my take`.
6. Before deletion, `files/Audio/recording-94b4d941-2766-4807-8b78-53b3dfcc2393.m4a` existed in app-private storage with `1,037,153` bytes. `files/braveline-session-v1.json` existed with `519` bytes.
7. `06-playback.*` exposed `Pause my take`; `06-paused.xml` returned to `Play my take`.
8. `07-plus-preview.*` exposed `Preview only. No purchase is available on this screen.` The trial control was disabled. No purchase was attempted.
9. `08-delete-confirmation.*` exposed `Permanently delete my local take`.
10. `09-deleted.*` reached `TAKE DELETED`. The private audio directory returned `total 0`, and the session JSON returned `No such file or directory`.
11. A separate take reached Ready in `11-retry-ready.*`. `Retry this moment` returned to the configured clause `I can deliver a reliable version by Friday.` with `Start my take` available in `12-retry-return.*`.
12. The retry take and its metadata were removed by a final test-only app-sandbox reset. Post-reset checks found neither the Audio directory nor the session JSON.

## Runtime diagnostics

- `AndroidRuntime:E`: no entries.
- `ReactNativeJS:E`: no entries.
- `Expo:E`: no entries.
- Four non-fatal `StagefrightRecorder` stop-state warnings were present. Both recordings still completed and produced valid Ready states, so these are recorded as warnings rather than hidden or promoted to crashes.
- None of the 01–12 XML receipts contains an uncaught rejection, fatal exception, RedBox, or native argument-conversion error.

## Evidence integrity

- 26 portable PNG/XML artifacts are stored beside this receipt.
- Total size: `2,690,165` bytes.
- Key SHA-256 values:
  - `05-ready.xml`: `083795E14C948358EC18238BBFC063F702480C4B3FD567EFC4CFA3D0B74D246D`
  - `06-playback.xml`: `20981C67F40DD1B026A6F543C255789CD27F26CD7EDE3043A2EF5DFD7EE23C01`
  - `07-plus-preview.xml`: `2C7EB159AB5258257B31246ABAB08A9A6F2B940A9CD65D8683C44B37C53E4852`
  - `08-delete-confirmation.xml`: `9F6E12007C9A74BD67E52980E8A706530A0E8ED13AAC2EB6F2345204B94D58FF`
  - `09-deleted.xml`: `4FFE75112018EE756AEE71F0337EC76D98BAF0F4F6AD6A2F289FCC49922A8BBD`
  - `12-retry-return.xml`: `A244997D8997C38A3E70F433EF370C4597B0FDD3E778BE352250BB4D9E119FB2`

## Remaining engineering boundary

The current product contract treats Retry as a logical reset and Delete as the explicit physical-removal action. A later successful replacement take can overwrite the single metadata pointer while leaving the earlier file unreferenced. Before repeated retry sessions are called lifecycle-complete, the product must choose and implement one explicit policy: transactional replacement with a cleanup-pending record, or confirmed delete-and-retry. Dark mode and 1.3 font-scale validation also remain open.
