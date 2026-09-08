# BraveLine — Next Gen final submission checklist

This checklist is a handoff aid, not a submission receipt. Official fields were read through the authenticated Devpost connection on 2026-09-08. Re-read them before final submission if they change.

Project: [BraveLine](https://devpost.com/software/braveline), ID `1419777`.

Event: [RevenueCat Shipaton 2026](https://revenuecat-shipaton-2026.devpost.com/).

## Verified delivery inputs

- Public source: https://github.com/acg0606/hackops-20260903-braveline — MIT; correction commit `91331a2` pushed successfully.
- Automated correction checks: 52 tests, TypeScript, and zero-warning ESLint passed.
- Icon source: `assets/images/icon.png`, 1024×1024. Official thumbnail upload returned HTTP 200; source accepted. This does not prove gallery screenshot persistence or anonymous CDN availability.
- Screenshot source: `docs/evidence/submission-assets/braveline-android-1179x2556.png`, 1179×2556, no device frame. Attachment persistence still requires portal verification.
- Entrant confirmed active enrollment and supplied an academic email privately. Do not put the address in public copy, Git, logs, or receipts. Organizer review is separate.

## Form mapping

| Field ID | Answer or gate |
| --- | --- |
| `27378` Includes App Icon | Confirm the accepted original icon is attached before setting `true`. |
| `27379` Includes screenshot | Set `true` only after the portal confirms the required screenshot attachment. |
| `27382` Platform | `["Android"]` |
| `27793` Next Gen repository | Public source URL above. |
| `27792` Academic email | The entrant-provided private academic address; no inference from the domain. |
| `28118` RevenueCat project ID | `0b5db614` |
| `28375` Minor entrant consent | Confirm the actual entrant declaration; do not infer from appearance or an email domain. |
| `27380` First store release | Do not assert a store release. Next Gen source/video exception applies. |
| Store URLs | Leave empty; no store listing is claimed. |
| `27791` Growth Fund | No opt-in requested; leave unselected. |

Next Gen entries are evaluated using the public open-source repository and demonstration video. The rules exempt them from a store listing and a free-trial/promo-code requirement. Additional prize-category claims are intentionally absent.

## Remaining gates

1. DONE locally: review actual app screen-recording footage. The final English demo is `docs/evidence/submission-assets/braveline-live-demo-20260908.mp4`, measured 65.5 seconds. Fresh native restore and correct paywall non-presentation are verified in `docs/evidence/native-demo-20260908-r2/receipt.md`. Do not use the historical screenshot montage as fresh restore proof.
2. Publish a demonstration under two minutes on YouTube or Vimeo and verify public playback. A GitHub MP4, local video, placeholder, or an upload attempt is not the required platform URL.
3. Verify the screenshot attachment, required form answers, entrant declaration, and the academic field privately.
4. Call the official submission operation only when all required inputs are true. Read the project back and require a non-null `submitted_at` for this event, then retain the actual receipt.
5. Publish the prepared X publicity only after the video and submission receipts exist. Reuse the existing social task and prevent duplicates.

The portfolio page being `published` is not submission to the hackathon. The latest authenticated readback has `video_url: null` and `submitted_at: null`.
