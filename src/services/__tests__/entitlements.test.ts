import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  assertRevenueCatReleaseKey,
  createEntitlements,
  createPreviewEntitlements,
} from '../entitlements';
import { entitlementFeedback } from '../entitlement-feedback';

vi.mock('react-native', () => ({ Platform: { OS: 'android' } }));

describe('entitlement boundary', () => {
  beforeEach(() => vi.clearAllMocks());

  it('keeps preview actions non-transactional', async () => {
    const entitlements = createPreviewEntitlements();
    const result = await entitlements.presentPaywall();

    expect(entitlements.status).toBe('preview');
    expect(entitlements.isPro).toBe(false);
    expect(result).toMatchObject({
      ok: false,
      reason: 'preview-only',
      externalEffect: 'none',
    });
  });

  it('blocks a production Test Store key before native modules load', async () => {
    const loader = vi.fn();
    const entitlements = createEntitlements({
      apiKey: 'test_example-only',
      isProduction: true,
      platform: 'android',
      loadNativeModules: loader,
    });

    const result = await entitlements.initialize();
    expect(entitlements.status).toBe('unavailable');
    expect(result).toMatchObject({
      ok: false,
      reason: 'configuration-blocked',
      externalEffect: 'none',
    });
    expect(loader).not.toHaveBeenCalled();
  });

  it('throws the explicit release guard for a production Test Store key', () => {
    expect(() => assertRevenueCatReleaseKey('test_example-only', true)).toThrow(
      'TEST_KEY_IN_PRODUCTION',
    );
  });

  it('marks Pro only after CustomerInfo proves the active entitlement', async () => {
    const configure = vi.fn();
    const entitlements = createEntitlements({
      apiKey: 'test_example-only',
      isProduction: false,
      platform: 'android',
      loadNativeModules: async () => ({
        purchases: {
          configure,
          getCustomerInfo: async () => ({
            entitlements: { active: { braveline_pro: { identifier: 'active' } } },
          }),
          restorePurchases: async () => ({ entitlements: { active: {} } }),
        },
        ui: {
          presentPaywallIfNeeded: async () => 'NOT_PRESENTED',
          presentCustomerCenter: async () => undefined,
        },
      }),
    });

    const result = await entitlements.initialize();
    expect(configure).toHaveBeenCalledWith({ apiKey: 'test_example-only' });
    expect(entitlements.isPro).toBe(true);
    expect(result).toMatchObject({
      ok: true,
      action: 'entitlement-verified',
      externalEffect: 'verified-entitlement',
    });
  });

  const activeInfo = {
    entitlements: { active: { braveline_pro: { identifier: 'active' } } },
  };

  function nativeEntitlements(input: {
    paywallOutcome?: unknown;
    restoreFails?: boolean;
    activeAfterAction?: boolean;
  } = {}) {
    const getCustomerInfo = vi.fn()
      .mockResolvedValueOnce(activeInfo)
      .mockResolvedValue(input.activeAfterAction === false
        ? { entitlements: { active: {} } }
        : activeInfo);
    const entitlements = createEntitlements({
      apiKey: 'test_example-only',
      isProduction: false,
      platform: 'android',
      loadNativeModules: async () => ({
        purchases: {
          configure: vi.fn(),
          getCustomerInfo,
          restorePurchases: async () => {
            if (input.restoreFails) throw new Error('offline');
            return activeInfo;
          },
        },
        ui: {
          presentPaywallIfNeeded: async () => input.paywallOutcome,
          presentCustomerCenter: async () => undefined,
        },
      }),
    });
    return { entitlements, getCustomerInfo };
  }

  it('does not turn a failed restore into a receipt when access was already active', async () => {
    const { entitlements } = nativeEntitlements({ restoreFails: true });
    await entitlements.initialize();
    const result = await entitlements.restore();

    expect(result).toMatchObject({ ok: false, snapshot: { isPro: true } });
    expect(entitlementFeedback(result)).toMatchObject({
      label: 'FAILED',
      verifiedAction: null,
    });
    expect(entitlementFeedback(result).message).not.toContain('Restore completed');
  });

  it.each([
    ['CANCELLED', 'paywall-cancelled', 'CANCELLED'],
    ['NOT_PRESENTED', 'paywall-not-presented', 'PAYWALL NOT PRESENTED'],
  ])('does not label %s as a purchase when access was already active', async (outcome, action, label) => {
    const { entitlements, getCustomerInfo } = nativeEntitlements({ paywallOutcome: outcome });
    await entitlements.initialize();
    const result = await entitlements.presentPaywall();

    expect(result).toMatchObject({ ok: true, action, externalEffect: 'none', snapshot: { isPro: true } });
    expect(entitlementFeedback(result)).toMatchObject({ label, verifiedAction: null });
    expect(getCustomerInfo).toHaveBeenCalledTimes(1);
  });

  it.each(['ERROR', 'unrecognized', undefined])('fails closed for native paywall result %s', async (outcome) => {
    const { entitlements } = nativeEntitlements({ paywallOutcome: outcome });
    await entitlements.initialize();
    const result = await entitlements.presentPaywall();

    expect(result).toMatchObject({ ok: false, reason: 'operation-failed', snapshot: { isPro: true } });
    expect(entitlementFeedback(result).verifiedAction).toBeNull();
  });

  it.each([
    ['PURCHASED', 'purchased', 'purchase'],
    ['RESTORED', 'restored', 'restore'],
  ])('preserves %s as its own operation after verifying access', async (outcome, action, verifiedAction) => {
    const { entitlements } = nativeEntitlements({ paywallOutcome: outcome });
    await entitlements.initialize();
    const result = await entitlements.presentPaywall();

    expect(result).toMatchObject({ ok: true, action, externalEffect: 'verified-entitlement' });
    expect(entitlementFeedback(result).verifiedAction).toBe(verifiedAction);
  });

  it('does not claim verified purchase access without the named entitlement', async () => {
    const { entitlements } = nativeEntitlements({
      paywallOutcome: 'PURCHASED',
      activeAfterAction: false,
    });
    await entitlements.initialize();
    const result = await entitlements.presentPaywall();

    expect(result).toMatchObject({ ok: true, action: 'purchased', snapshot: { isPro: false } });
    expect(entitlementFeedback(result).verifiedAction).toBeNull();
  });

  it('reports a successful explicit restore with its own receipt', async () => {
    const { entitlements } = nativeEntitlements();
    await entitlements.initialize();
    const result = await entitlements.restore();

    expect(result).toMatchObject({ ok: true, action: 'restored', snapshot: { isPro: true } });
    expect(entitlementFeedback(result)).toMatchObject({
      label: 'RESTORE VERIFIED',
      verifiedAction: 'restore',
    });
  });
});
