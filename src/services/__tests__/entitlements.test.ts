import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  assertRevenueCatReleaseKey,
  createEntitlements,
  createPreviewEntitlements,
} from '../entitlements';

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
});
