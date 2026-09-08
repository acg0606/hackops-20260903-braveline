# BraveLine — Shipaton Next Gen submission package

Next Gen submission verified on September 8, 2026. [Devpost entry](https://devpost.com/software/braveline) · [Public demo](https://www.youtube.com/watch?v=B37Pk8UeUXw) · [External delivery receipt](delivery-receipt-20260908.md). Store links and first-store-release declarations are intentionally absent.

## Project name

BraveLine

## Tagline

Private rehearsal for difficult workplace conversations

## Inspiration

Knowing what to say is different from being ready to say it out loud. For new managers working in English, a difficult deadline conversation can be especially hard to rehearse. BraveLine creates a private space to practice one boundary, lower the guide, and try the exact phrase again.

## What it does

Prepare presents a short, synthetic workplace scenario. Quiet Coach reads the script at a low guide level. The user can turn the guide off, move into Solo, and record a take without the guide playing over their voice. Ready lets the user listen, explicitly delete the recording, or consent to deleting it before retrying one focused phrase.

Recordings stay in app-private storage. A verified take can resume after the app restarts. The app does not upload rehearsal audio, transcribe it, or score pronunciation, accent, or emotion. Any feedback is explicitly deterministic practice guidance, not an AI assessment of the recording.

BraveLine Plus integrates RevenueCat offerings, entitlement checks, a published paywall, purchase, and restore. An annual RevenueCat Test Store purchase and active `braveline_pro` entitlement were observed on Android, with no real charge or revenue. A fresh native run subsequently verified successful restore with corrected receipt handling. It also verified that opening the paywall with an already-active entitlement reports no new purchase or restore. An unconfigured checkout remains preview-only. Custom scenarios, counterpart styles, and rehearsal history are planned Plus features; the current Test Store demonstration does not provide those features or a trial.

## How we built it

Expo 57, React Native 0.86, TypeScript, Expo Router, Expo Audio, Expo Speech, Expo File System, and RevenueCat React Native Purchases. Audio lifecycle and entitlement decisions live behind testable service boundaries. Android API 36 emulator captures show the implemented product rather than a conceptual mockup.

Codex assisted with implementation, tests, native debugging, documentation, and demo preparation. The finished 65.5-second English-captioned local demo uses actual Android screen recordings captured in separate passes and edited for brevity; the earlier 56-second screenshot montage remains historical evidence. The new recording exercise deliberately used silent input with microphone privacy enabled, and the final video has no audio stream. The rehearsal logic is deterministic and Quiet Coach uses device text-to-speech. The scenario and original application assets are included in the MIT-licensed source.

## Challenges we ran into

Recording state must reflect a real, non-empty private file, not simply a successful button press. We added verified Ready recovery after restart and preserved metadata when deletion cannot be confirmed. Retry removes the previous take before opening the focused phrase. We also hardened Android safe areas, guide-to-recording handoff, dark mode, and landscape at an enlarged system font scale.

## Accomplishments

- The historical 42-test baseline includes Expo dependency checks; the latest receipt-handling correction passed 52 automated tests, TypeScript, and zero-warning ESLint.
- Native Android evidence covers guide-off recording, local playback, deletion, restart recovery, and exact-phrase retry.
- Light and dark themes, portrait, and two-column landscape at font scale 1.3 were captured.
- A simulated annual RevenueCat Test Store purchase and active entitlement were observed on Android with no real charge. Fresh native verification separately confirmed successful restore and accurate handling of an already-active entitlement.

## What we learned

A trustworthy rehearsal tool needs fewer claims and clearer transitions. Showing exactly when the guide stops, where a take lives, and what retry deletes matters more than an unvalidated speaking score.

## What's next

Add more workplace scenarios, test with consenting English learners, and validate usefulness before adding any optional assessment. A real store launch and paid products would require separate release work; neither is claimed in this Next Gen entry.

## Build and verify

See [README](../README.md) for setup and [native evidence](evidence-manifest.json). The repository contains the code and original assets. No private RevenueCat SDK key is distributed. Without configuration, the practice workflow remains usable and Plus is preview-only; judges can inspect the Test Store evidence without making a payment.

## Submitted form choices

- Platform: Android.
- Next Gen: public source route; active enrollment confirmed by entrant.
- Academic email: saved only in the private Devpost academic field, never in public copy.
- RevenueCat project ID: `0b5db614`.
- Icon: `assets/images/icon.png` (1024×1024).
- Screenshot: `docs/evidence/submission-assets/braveline-android-1179x2556.png`.
- Media: the finished, visually reviewed `docs/evidence/submission-assets/braveline-live-demo-20260908.mp4` is 65.5 seconds, 1080×2340, 24 fps, H.264, and has no audio stream. It is an English-captioned edit of actual native recordings from separate passes, with silent-input disclosure. SHA-256: `6B0371CB484D78AC1F06CFD2356C7105B88FF93BDEF8B39CF33D3D8BDAF4FD0F`. The earlier 56-second screenshot montage is historical. The [public YouTube URL](https://www.youtube.com/watch?v=B37Pk8UeUXw) was saved in the final submission.
- No store date, store URL, growth-fund opt-in, or real revenue is asserted. The Next Gen submission itself is confirmed by receipt `1173574`.
