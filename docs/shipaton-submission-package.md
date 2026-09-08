# BraveLine — RevenueCat Shipaton 2026 submission package

## Category

Next Gen Award — use only after the entrant confirms active-student status and a qualifying academic email in Devpost.

## Project name

BraveLine

## Tagline

Private rehearsal for difficult workplace conversations

## About the project

## Inspiration

Difficult workplace conversations often go badly before they even begin. New managers may know the boundary they need to set, yet still need a private place to hear the words, practise them aloud, and try one difficult moment again.

## What it does

BraveLine is a privacy-first Android rehearsal app for difficult workplace conversations. The current scenario helps a user set a boundary around an impossible deadline. A low-volume Quiet Coach models one natural phrase, fades completely before Solo, and then BraveLine records only the user's voice. The Ready screen supports local playback, explicit deletion, recovery after restart, and an exact-moment retry.

The complete boundary rehearsal remains free. BraveLine Plus demonstrates a future customization layer through RevenueCat. On the verified development build, RevenueCat's Test Store loads the published paywall, completes a simulated purchase, activates the `braveline_pro` entitlement, and restores it. The paywall and app both state that this is Test Store only and creates no real charge.

## How we built it

BraveLine uses React Native, Expo Router, TypeScript, Expo Audio, and RevenueCat's native React Native SDK and Paywalls UI. Rehearsal audio and metadata stay in app-private storage; there is no audio upload path. The entitlement boundary fails closed when no SDK key is configured, so an ordinary local build cannot pretend that purchases are available.

We verified the app on an Android API 36 emulator with strict TypeScript, ESLint, Expo dependency checks, 42 automated tests, native recording and playback, delete-before-retry behavior, restart recovery, light and dark themes, portrait and landscape layouts, and system font scale 1.3.

## Challenges

The most important challenge was preserving truthful state across audio lifecycle edges: guide playback must stop before recording, deleted takes must not reappear, and a retry must remove the old audio before opening the selected phrase. Windows path length and native C++ build memory also required a short-path, single-job Android build without weakening the source checks.

## Accomplishments that we are proud of

- A complete rehearsal remains usable without a paywall.
- Quiet Coach hands off to a guide-free Solo recording.
- Rehearsal audio stays private to the app sandbox and can be explicitly deleted.
- Ready state survives an app restart and an exact-moment retry cannot orphan the previous take.
- The RevenueCat Test Store purchase and restore are verified on device with clear no-charge disclosure.
- The repository includes reproducible tests and evidence receipts instead of unsupported store or traction claims.

## What we learned

Trust in a private coaching product comes from boundaries that are visible in both code and copy. RevenueCat works best here when the entitlement is a transparent capability boundary, not an interruption to the core rehearsal. Native evidence also matters: a passing test suite alone does not prove microphone lifecycle, storage cleanup, layout safety, or purchase UI behavior.

## What's next

Next we would add user-authored scenarios and counterpart styles behind BraveLine Plus, validate the experience with new managers, add accessible captions to the public demo, and replace the Test Store configuration with production store products only after a real store release is ready.

## Built with

`react-native`, `expo.io`, `typescript`, `revenuecat`

## Try it out / source

https://github.com/acg0606/hackops-20260903-braveline

## Public video metadata

Title: `BraveLine — RevenueCat Shipaton 2026 Next Gen Demo`

Description:

> BraveLine is a privacy-first Android rehearsal app for difficult workplace conversations. This 56-second device walkthrough covers Prepare, Quiet Coach, a guide-free Solo take, local Ready and retry, and the RevenueCat Test Store paywall with verified `braveline_pro` purchase and restore. Test Store only; no real charge or revenue. Built for the RevenueCat Shipaton 2026 Next Gen Award. Source: https://github.com/acg0606/hackops-20260903-braveline

Asset: `docs/evidence/submission-assets/braveline-shipaton-demo-20260908.mp4`

Duration: `00:00:56.00`

Resolution: `1080x2340`

SHA-256: `CB525D37787665D2BA41A17A5F5D6C99619232C6670F1EB7866ACA12B65556A9`

## X draft

> BraveLine helps new managers rehearse difficult workplace conversations privately on device. Built for RevenueCat Shipaton 2026 Next Gen with Expo + RevenueCat Test Store and verified purchase/restore — no real charge. Demo: VIDEO_URL Code: https://github.com/acg0606/hackops-20260903-braveline

Before publication, replace `VIDEO_URL`, verify the official company mention and event hashtag from primary sources, and run the duplicate check required by `docs/hackops-social-publication-v1.md`.
