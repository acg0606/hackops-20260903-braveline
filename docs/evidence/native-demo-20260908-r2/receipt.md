# BraveLine corrected native verification and real demo footage

Date: 2026-09-08. Device: Android API 36 emulator `emulator-5554`, AVD `StudyPebble_API_36`. Package: `com.braveline.rehearse`.

## Verified observations

- The corrected source was loaded by the installed native development client through Metro at port 8081. The four source hashes below match the short staging checkout at `C:\blrcbuild` exactly.
- Quiet Coach displayed playback at 15%. Starting a solo take stopped the guide and displayed `SOLO TAKE / GUIDE 0% / RECORDING` with the Stop & Review action enabled.
- Android microphone privacy was enabled for the entire recording exercise. The system's unblock dialog was cancelled. The app then successfully recorded silence; no ambient voice recording was requested or enabled. The raw screen videos have no audio track added by this capture workflow.
- Stopping the take reached Ready. The app accurately disclosed that no transcript was available and did not assess wording, accent, emotion, or pronunciation.
- Retry displayed its destructive-action confirmation. The newly created silent test take was removed through the app's Delete & Retry action, and the app reached the single Friday phrase: `I can deliver a reliable version by Friday.`
- The native Restore purchases action completed successfully. The corrected feedback rendered `Restore completed. BraveLine Plus is active and verified by RevenueCat.` and `LAST REVENUECAT ACTION · RESTORE VERIFIED`.
- With the entitlement already active, opening the paywall rendered `No paywall was shown. No new purchase or restore was performed.` and `PAYWALL NOT PRESENTED`. Existing access was not mislabeled as a new purchase.
- Plus shows the unavailable custom-scenario, counterpart-profile, and rehearsal-history features as planned. It explicitly discloses Test Store simulation, no charge, and no paid trial.

Restore verification in this pass means the native SDK restore operation returned successfully with the named active entitlement. It does not claim a new purchase, a real payment, store publication, or a hackathon submission receipt.

## Actual native screen recordings

Each MP4 below was produced directly by Android `screenrecord`, then copied from the emulator. No sequence was constructed from screenshots. Durations were measured with FFmpeg 7.1. All five clips contain H.264 video at 720 x 1560 and no audio stream. Android's variable-frame-rate output can have a shorter measured duration than the requested capture limit. The delivery video's edit should report its own measured duration.

| File | Measured duration | Requested limit | Bytes | SHA-256 |
| --- | ---: | ---: | ---: | --- |
| `braveline-prepare-hero-r2.mp4` | 5.48 s | 10 s | 545104 | `1F7511AD79416584D9230C1E0D83D7C9F92E599A2A4AD0ED300AF6458DAF37DC` |
| `braveline-prepare-coach-r2.mp4` | 44.96 s | 48 s | 2073076 | `5EE3127B2FAD00327359072D327293C61865E7419B14A76AF29A290CE6AA9459` |
| `braveline-review-retry-r2.mp4` | 41.62 s | 42 s | 1792726 | `D1C2B6FCB911D949451F99BC583B9DF54638FCBD5E81B1881E96B8A56D7F2EF2` |
| `braveline-retry-transition-r2.mp4` | 8.43 s | 16 s | 533896 | `BA4FB52D888DA3FC153F8CC0860F3BECAEC1A99A35853B097D8E511E4217FEC9` |
| `braveline-restore-r2.mp4` | 23.83 s | 24 s | 131356 | `E60C2561ABFB07C6E90C5471BAAF09D270F482A052F56CF235E43FD05979DCAD` |

Capture size was 720 x 1560 with 280 dpi. This preserves the phone's logical layout while reducing emulator load. The clips were captured in separate passes and should be edited as a disclosed demo, not presented as one continuous uncut take. The microphone-privacy setup and navigation delays can be trimmed without changing outcomes.

## Authoritative UI checkpoints

- `03-quiet-coach.xml/png`: guide playback at 15%.
- `04c-mic-blocked.xml/png` and `08-live-recording.xml/png`: active solo recording after cancelling the microphone unblock prompt.
- `06-retry-confirm.xml/png`: explicit delete-and-retry confirmation.
- `07-retry.xml/png` and `09-retry-transition.xml/png`: successful one-phrase retry state.
- `10-plus.xml/png`: corrected planned-feature disclosure.
- `12-restore-result.xml/png`: successful corrected restore feedback.
- `13-paywall-outcome.xml/png`: correct not-presented outcome with existing active access.
- `14-prepare-hero.xml/png`: top Prepare state for the introduction.

Some earlier intermediate checkpoint filenames describe the attempted transition, not its completion: `02-rehearse.png` captured a loading screen, `04-recording` captured preparation, and `05-ready` captured the stop/save transition. They are retained as diagnostic context and must not replace the authoritative completion checkpoints above.

`ui-action.ps1` locates buttons using fresh UI text, accessibility labels, or test IDs, verifies visible enabled bounds, and derives tap/scroll coordinates from those observations. It rejects ambiguous targets and failed UI dumps.

## Synced source hashes

| Source | SHA-256 |
| --- | --- |
| `src/app/plus.tsx` | `62C82C9256127651A11903FDAAB3060C524AC8EA739D2A1C4D902BEE238B48AC` |
| `src/services/entitlements.ts` | `108D5D19CDA0F3CB6F9F951B05DD141586D0D9B2ACA17D198E1134204E8343C8` |
| `src/services/entitlement-feedback.ts` | `894C82A7624C3A7955A35833AA9AC48F23ACAFFCAED60B0D4BCA9CCE220D429B` |
| `src/services/index.ts` | `7F0BB849EB4B7732AF7DEA543AF2BFC6378B3E1EE8A4ECB13A775799F2F6854C` |

Before device verification, all 52 automated tests and TypeScript checking passed for this correction. New regressions cover failed restore after active access, cancelled/not-presented paywalls after active access, invalid native outcomes, and verified purchase/restore feedback.

## Environment notes

Initial cold-start ANRs were cleared before capture. The native app then completed the flows above. Emulator DNS initially failed but later resolved `api.revenuecat.com` and responded without changing Windows networking. No SDK key is included in this evidence directory.

At handoff, the emulator remained on Prepare with no screen recording active. Microphone privacy remained enabled. No browser, public repository, public video-hosting, Devpost submission, or X action was performed by this native QA task.
