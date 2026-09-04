# BraveLine Android API 36 remediation receipt

Date: 2026-09-04

Scope: local development build only

Device: `StudyPebble_API_36`, Android API 36

Package: `com.braveline.rehearse`, version `0.1.0`, target SDK 36

## Result

The second native pass closed the four P1 findings from the first visual review without redesigning BraveLine:

1. The shared screens and Rehearse now respect the Android top and bottom safe areas.
2. Quiet Coach and recording states agree visually and through accessibility metadata.
3. `Retry this moment` opens only `I can deliver a reliable version by Friday.` as the primary phrase.
4. A valid take resumes after restart, while retry requires confirmation and deletes the current private file before a replacement can be recorded.

## Native lifecycle proof

- The first accepted take was `242,494` bytes; its private session JSON was `519` bytes.
- After `am force-stop`, the development client reconnected and the root route resolved directly to `BRAVELINE / READY` with `YOUR TAKE / LOCAL` and `Play my take`.
- `Replace this local take?` explained that the current audio would be permanently removed before the one-phrase retry.
- After `Delete & retry`, `files/Audio` contained no recording and `files/braveline-session-v1.json` was absent.
- The retry screen contained the configured Friday clause, `RETRY / QUIET COACH 15% → YOUR TURN`, and `ONE PHRASE / ONE CLEANER TAKE`; the former Thursday clause was not present.
- The retry created one new `34,997`-byte `.m4a` plus one `518`-byte session file.
- The final explicit delete reached `TAKE DELETED`; the audio directory was empty and session metadata was absent.
- A final test-only `pm clear com.braveline.rehearse` removed the temporary verification sandbox created while recapturing recording accessibility metadata.

## State and layout proof

- `01-prepare.xml`: header bounds begin at y=184, below the status area.
- `02-rehearse.xml`: the app frame is `[0,136][1080,2292]`, between system bars.
- `03-quiet-coach.xml`: `Stop Quiet Coach` and `Quiet Coach is playing at 15%. It stops before recording.` are present together.
- `04-recording.xml`: `GUIDE 0%`, `Guide off. Only your voice is recording.`, selected 0%, and disabled guide controls are present together.
- `08-retry-confirmation.xml`: replacement consent is explicit and remains above the gesture area.
- `13-plus-preview.xml`: the preview-only boundary remains disabled and the free continuation ends at y=2292, above the gesture area.
- None of the numbered XML captures contains the development-client `Tools` control.

## Evidence inventory

The numbered set contains 27 PNG/XML artifacts totaling `2,845,412` bytes. Four underscore-prefixed files are retained only as diagnostic bootstrap or pre-clean-capture evidence and are excluded from the numbered visual judgment.

Selected SHA-256 checksums:

- `01-prepare.png`: `4C27F7E8BB57D240A5BA0FA053F8AED65163A083AA52ABA2EC9D16027708FF21`
- `03-quiet-coach.xml`: `9EEF36FEB47B356A3E9CCE9EC93BA5F7B32A73E77B7180D0E6F5099E69C1E230`
- `04-recording.xml`: `58382A567AD2F61124AF05BBA0984FD5D1858831D98F135E33EA56B92E7494FB`
- `06-resumed-ready.xml`: `08BABBE67A992AC0A928AB234E1DF49D486835CCC4CA0BEF6A0C59B34BE7C79F`
- `08-retry-confirmation.xml`: `C14904EBC0396EAFB557C3316D548CC94278CFB965C90F32BA29A62F8F71EF90`
- `09-retry-focused.xml`: `08FD4D52AC86E136167024DE97CD34530E305CF61D88750AFB6FF0005A3F6AFD`
- `12-deleted.xml`: `25EE6E35EE78494BC08405153E708BA84ECA71AFAA9FFF1FEF0537D1E0C51A4B`
- `13-plus-preview.png`: `D56FFE540325552A1B41446C389625245076196897B5B98FC63DD5721FAF22A3`

The installed development APK remains `87,231,369` bytes with SHA-256 `C419B6426A80F07B0F9C0B0D533BE64F86FDF9013938167656356B0BE2A17186`. Metro served the current source through the APK-matched Expo 57 runtime.

## Diagnostics and boundaries

- `pnpm typecheck`: pass.
- `pnpm test`: 10 files, 42 tests passed.
- `pnpm exec eslint src --max-warnings=0`: pass.
- `pnpm exec expo install --check`: dependencies up to date.
- Android error-channel scan: zero `AndroidRuntime:E`, `ReactNativeJS:E`, and `Expo:E` lines; zero fatal exceptions.
- Ten non-fatal `StagefrightRecorder stop while neither recording nor paused` warnings accumulated across the repeated evidence takes. Every claimed take still reached Ready and all claimed delete checks succeeded.

This receipt does not claim a release build, RevenueCat purchase or restore, store publication, public video, Devpost registration, or Devpost submission.
