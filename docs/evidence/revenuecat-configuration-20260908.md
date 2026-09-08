# RevenueCat configuration receipt — 2026-09-08

## FACT

- Authenticated RevenueCat project: `BraveLine` (`0b5db614`).
- Test Store app configuration: `appa1ab228adc`.
- Offering: `default`.
- Packages and products: lifetime / `lifetime`, annual / `yearly`, and monthly / `monthly`.
- Entitlement: `BraveLine Pro` (`braveline_pro`), linked to all three products.
- Paywall: `BraveLine Plus` (`wfc1e1a89be5494283`), default locale English (US), linked to offering `default`.
- RevenueCat paywalls readback lists `BraveLine Plus` under `Published` with last edit Sep 8.
- The purchase CTA says `Continue with BraveLine Plus`; the disclosure says `TEST STORE · NO REAL CHARGE`.
- The app's Plus screen now initializes the native entitlement service, opens the RevenueCat paywall, restores purchases, and displays verified `braveline_pro` access when present.
- Verification after the integration change: strict TypeScript, 42 tests, ESLint, Expo dependency compatibility, and `git diff --check` passed.

Authenticated configuration URLs:

- Project: <https://app.revenuecat.com/projects/0b5db614/overview>
- Paywalls: <https://app.revenuecat.com/projects/0b5db614/paywalls>
- Paywall builder: <https://app.revenuecat.com/projects/0b5db614/paywalls/wfc1e1a89be5494283/builder>

## HOLD

- No RevenueCat SDK key is stored or printed in this repository.
- No Test Store purchase or restore is claimed until a development build exercises the paywall and retains an authenticated entitlement readback.
- No real store product, real charge, public store listing, or Shipaton submission is claimed by this receipt.

## UNKNOWN

- The final Google Play listing URL and first-public-version receipt.
- The public demo video URL.
- The final Devpost submission receipt.
