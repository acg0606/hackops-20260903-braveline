# BraveLine

BraveLine is a private English rehearsal app for difficult workplace conversations. A short synthetic scenario moves through **Prepare**, **Quiet Coach**, a guide-free **Solo** take, and **Ready** for local playback, deletion, or an exact-moment retry.

## What is implemented

- Expo 57 / React Native 0.86 Android application with strict TypeScript.
- Quiet Coach at 15% or 25% volume, followed by a guide-off handoff before recording.
- Microphone-only local recording with file validation before a take is accepted.
- Local playback, verified restart recovery, and deletion with explicit failure states; no audio upload path exists.
- Confirmed delete-before-retry semantics prevent an earlier private take from becoming an invisible orphan.
- Deterministic, provenance-labelled feedback that does not score accent, emotion, or pronunciation.
- RevenueCat native integration boundary for the `braveline_pro` entitlement.
- Honest Plus preview when RevenueCat is not configured, plus a release guard that rejects Test Store keys in production.

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

The completed native receipt in [`docs/evidence/native-pass-20260904/receipt.md`](docs/evidence/native-pass-20260904/receipt.md) covers:

1. Prepare -> Start Quiet Coach.
2. Quiet Coach -> guide level 0% -> Solo.
3. Record for at least two seconds -> stop -> Ready.
4. Play the verified local file.
5. Delete the take and confirm that the private file is gone.

The remediation receipt in [`docs/evidence/native-pass-20260904-r2/receipt.md`](docs/evidence/native-pass-20260904-r2/receipt.md) additionally proves Android safe areas, truthful Quiet Coach/recording states, app-restart recovery, confirmed removal before retry, the exact one-phrase retry, a second successful take, and final deletion. Dark mode and 1.3 font-scale layout remain release-hardening work.

## Evidence boundaries

- A passing local build or emulator run proves only local technical behavior.
- The RevenueCat Test Store is not configured in this repository, and no purchase is claimed.
- No public repository, store release, Devpost entry, or Shipaton submission is claimed by this codebase.
- Release/submission status requires separate receipts from the relevant external services.

## Privacy model

The audio service accepts only device-local URIs, writes recordings into app-private storage, verifies that the native file exists and is non-empty, and keeps metadata if deletion cannot be confirmed. A verified take resumes in Ready after restart; stale missing-file metadata is cleared. Retry requires explicit consent and removes the current file before opening the focused phrase. The guide is stopped before recording begins. BraveLine has no network code path for rehearsal audio.

## License

See [LICENSE](LICENSE).
