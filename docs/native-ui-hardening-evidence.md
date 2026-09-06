# Native UI hardening evidence — 2026-09-06

## Result

BraveLine rendered successfully on the `StudyPebble_API_36` Android API 36 emulator in all targeted UI-hardening states:

- light portrait at font scale 1.0;
- dark portrait at font scale 1.0;
- dark landscape at font scale 1.3, using the expanded two-column rehearsal layout.

The landscape accessibility capture keeps the primary phrase, Quiet Coach controls, `START MY TAKE`, and the device-local privacy message visible without clipping.

## Captures

- [`evidence/native-pass-20260906-ui-light-portrait.png`](evidence/native-pass-20260906-ui-light-portrait.png)
- [`evidence/native-pass-20260906-ui-dark-portrait.png`](evidence/native-pass-20260906-ui-dark-portrait.png)
- [`evidence/native-pass-20260906-ui-dark-landscape-font130.png`](evidence/native-pass-20260906-ui-dark-landscape-font130.png)

## Test artifact

- Build: `:app:assembleRelease -PreactNativeArchitectures=x86_64`
- Result: `BUILD SUCCESSFUL`
- APK: `C:\b\android\app\build\outputs\apk\release\app-release.apk`
- Bytes: `60103098`
- SHA-256: `5854DDD3CA94409BF82790FF84BE35BD1F74F24522F20B1551F19CEBD766BC6C`
- Installed package: `com.braveline.rehearse`

This APK is an emulator-only x86_64 test artifact and is not a store-ready or published binary. No purchase, restore, upload, publication, registration, or submission was attempted during this pass.
