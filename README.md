# BraveLine

BraveLine is a private English rehearsal app for difficult workplace conversations. A short synthetic scenario moves through **Prepare**, **Quiet Coach**, a guide-free **Solo** take, and **Ready** for local playback, deletion, or an exact-moment retry.

## What is implemented

- Expo 57 / React Native 0.86 Android application with strict TypeScript.
- Quiet Coach at 15% or 25% volume, followed by a guide-off handoff before recording.
- Microphone-only local recording with file validation before a take is accepted.
- Local playback, verified restart recovery, and deletion with explicit failure states; no audio upload path exists.
- Confirmed delete-before-retry semantics prevent an earlier private take from becoming an invisible orphan.
- Deterministic, provenance-labelled feedback that does not score accent, emotion, or pronunciation.
- RevenueCat native paywall, observed simulated Test Store purchase, verified `braveline_pro` entitlement, and freshly verified native Test Store restore.
- Honest Plus preview when RevenueCat is not configured, plus a release guard that rejects Test Store keys in production.
- Automatic light/dark themes and a two-column landscape rehearsal, verified at system font scale 1.3.

Custom scenarios, counterpart styles, and rehearsal history are planned Plus features. The current Test Store demonstration does not provide those features or a trial.

## Run locally

Prerequisites: Node.js, pnpm, Android SDK, JDK 17, and an Android emulator or device.

```powershell
pnpm install --frozen-lockfile
pnpm verify
pnpm android
```

For an already-built development client, start Metro with:

```powershell
pnpm start --dev-client
```

The Android package is `com.braveline.rehearse`. Microphone permission is requested only when the user starts a solo take.

## Verification

```powershell
pnpm typecheck
pnpm test
pnpm lint
pnpm exec expo install --check
```

The verified 2026-09-04 local baseline is recorded in [`docs/evidence-manifest.json`](docs/evidence-manifest.json). It includes 42 passing tests, a zero-warning lint pass, an Expo compatibility check, two Android API 36 privacy runs, portable native captures, and the hash of the exact installed debug APK. On Windows, the native build was staged under a short path because CMake/Ninja object paths can exceed the host path limit when this checkout lives under OneDrive; that staging copy is not source of record.

On 2026-09-08, the receipt-handling correction passed **52 tests**, TypeScript, and ESLint with zero warnings. Purchase, restore, cancellation, and an already-active entitlement are now distinct outcomes. A [fresh native run](docs/evidence/native-demo-20260908-r2/receipt.md) subsequently verified successful Test Store restore and the correct `PAYWALL NOT PRESENTED` result for existing access, with no new purchase claimed.

The completed native receipt in [`docs/evidence/native-pass-20260904/receipt.md`](docs/evidence/native-pass-20260904/receipt.md) covers:

1. Prepare -> Start Quiet Coach.
2. Quiet Coach -> guide level 0% -> Solo.
3. Record for at least two seconds -> stop -> Ready.
4. Play the verified local file.
5. Delete the take and confirm that the private file is gone.

The remediation receipt in [`docs/evidence/native-pass-20260904-r2/receipt.md`](docs/evidence/native-pass-20260904-r2/receipt.md) additionally proves Android safe areas, truthful Quiet Coach/recording states, app-restart recovery, confirmed removal before retry, the exact one-phrase retry, a second successful take, and final deletion. The follow-up UI-hardening evidence proves automatic light/dark theming, portrait rendering, and a two-column landscape rehearsal at system font scale 1.3.

## Evidence boundaries

- A passing local build or emulator run proves only local technical behavior.
- A RevenueCat Test Store project, offering, products, entitlement, and published paywall are configured externally; no SDK key is stored in this repository.
- The default local checkout remains preview-only until `EXPO_PUBLIC_REVENUECAT_API_KEY` is supplied at runtime. The [historical device receipt](docs/evidence/revenuecat-test-store-20260908/receipt.md) records an observed simulated annual purchase and active entitlement. The [corrected native receipt](docs/evidence/native-demo-20260908-r2/receipt.md) separately verifies successful restore. Both use Test Store only, with no real charge or revenue; the historical UI receipt correction remains documented.
- No store release or completed Shipaton submission is claimed by this codebase. Consult [submission readiness](docs/submission-readiness.md) for current delivery status.
- Release/submission status requires separate receipts from the relevant external services.

## Privacy model

The audio service accepts only device-local URIs, writes recordings into app-private storage, verifies that the native file exists and is non-empty, and keeps metadata if deletion cannot be confirmed. A verified take resumes in Ready after restart; stale missing-file metadata is cleared. Retry requires explicit consent and removes the current file before opening the focused phrase. The guide is stopped before recording begins. BraveLine has no network code path for rehearsal audio.

## AI and Codex use

Codex assisted with implementation, test authoring, native debugging, documentation, and demo preparation. The earlier 56-second screenshot montage is retained as historical material. Five new [native source clips](docs/evidence/native-demo-20260908-r2/manifest.json) were captured directly with Android screen recording in separate passes, including corrected restore feedback. The finished [65.5-second local demo](docs/evidence/submission-assets/braveline-live-demo-20260908.mp4) uses that actual footage with English captions and edits for brevity. The demonstration deliberately used silent input with microphone privacy enabled; the final video has no audio stream. The local edit was visually reviewed, but no public YouTube or Vimeo URL is verified yet. The app's rehearsal and feedback logic is deterministic: it does not send recordings to a model, transcribe them, or score accent, emotion, or pronunciation. Quiet Coach uses device text-to-speech. The current workplace scenario is synthetic.

## License

See [LICENSE](LICENSE).
