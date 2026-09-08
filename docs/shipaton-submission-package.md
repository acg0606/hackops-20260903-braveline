# BraveLine — Shipaton Next Gen submission package

Prepared submission copy, not a submission receipt. The entry is intended for Next Gen only. Store links and first-store-release declarations are intentionally absent.

## Project name

BraveLine

## Tagline

Rehearse a difficult workplace conversation in English with a quiet guide, then speak on your own. Private, repeatable, and built for practice—not accent scores.

## Inspiration

Knowing what to say is different from being ready to say it out loud. For new managers working in English, a difficult deadline conversation can be especially hard to rehearse. BraveLine creates a private space to practice one boundary, lower the guide, and try the exact phrase again.

## What it does

Prepare presents a short, synthetic workplace scenario. Quiet Coach reads the script at a low guide level. The user can turn the guide off, move into Solo, and record a take without the guide playing over their voice. Ready lets the user listen, explicitly delete the recording, or consent to deleting it before retrying one focused phrase.

Recordings stay in app-private storage. A verified take can resume after the app restarts. The app does not upload rehearsal audio, transcribe it, or score pronunciation, accent, or emotion. Any feedback is explicitly deterministic practice guidance, not an AI assessment of the recording.

BraveLine Plus integrates RevenueCat offerings, entitlement checks, a published paywall, purchase, and restore. The demonstrated configuration is RevenueCat Test Store: the annual purchase and restored `braveline_pro` entitlement are simulated, with no real charge or revenue. An unconfigured checkout remains preview-only instead of pretending a payment succeeded.

## How we built it

Expo 57, React Native 0.86, TypeScript, Expo Router, Expo Audio, Expo Speech, Expo File System, and RevenueCat React Native Purchases. Audio lifecycle and entitlement decisions live behind testable service boundaries. Android API 36 emulator captures show the implemented product rather than a conceptual mockup.

Codex assisted with implementation, tests, native debugging, documentation, and assembly of the demo from retained emulator captures. The rehearsal logic is deterministic and Quiet Coach uses device text-to-speech. The scenario and original application assets are included in the MIT-licensed source.

## Challenges we ran into

Recording state must reflect a real, non-empty private file, not simply a successful button press. We added verified Ready recovery after restart and preserved metadata when deletion cannot be confirmed. Retry removes the previous take before opening the focused phrase. We also hardened Android safe areas, guide-to-recording handoff, dark mode, and landscape at an enlarged system font scale.

## Accomplishments

- 42 automated tests plus TypeScript, zero-warning ESLint, and Expo dependency checks passed in the verified baseline.
- Native Android evidence covers guide-off recording, local playback, deletion, restart recovery, and exact-phrase retry.
- Light and dark themes, portrait, and two-column landscape at font scale 1.3 were captured.
- RevenueCat Test Store purchase and restore were verified on Android with an active entitlement and no real charge.

## What we learned

A trustworthy rehearsal tool needs fewer claims and clearer transitions. Showing exactly when the guide stops, where a take lives, and what retry deletes matters more than an unvalidated speaking score.

## What's next

Add more workplace scenarios, test with consenting English learners, and validate usefulness before adding any optional assessment. A real store launch and paid products would require separate release work; neither is claimed in this Next Gen entry.

## Build and verify

See [README](../README.md) for setup and [native evidence](evidence-manifest.json). The repository contains the code and original assets. No private RevenueCat SDK key is distributed. Without configuration, the practice workflow remains usable and Plus is preview-only; judges can inspect the Test Store evidence without making a payment.

## Prepared private form choices

- Platform: Android.
- Next Gen: public source route; active enrollment confirmed by entrant.
- Academic email: enter only in the Devpost academic field, never in public copy.
- RevenueCat project ID: `0b5db614`.
- Icon: `assets/images/icon.png` (1024×1024).
- Screenshot: `docs/evidence/submission-assets/braveline-android-1179x2556.png`.
- Demo: 56-second English Android walkthrough; a public YouTube or Vimeo URL is required before final submission.
- No store date, store URL, growth-fund opt-in, real revenue, or final submission is asserted.
