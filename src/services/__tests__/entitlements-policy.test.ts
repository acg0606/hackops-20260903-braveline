import { describe, expect, it } from 'vitest';

import {
  BRAVELINE_PRO_ENTITLEMENT,
  hasActiveEntitlement,
  validateRevenueCatPublicKey,
} from '../entitlements-policy';

describe('RevenueCat policy', () => {
  it('rejects Test Store keys for production without exposing the key', () => {
    const result = validateRevenueCatPublicKey({
      apiKey: 'test_private-value-must-not-leak',
      isProduction: true,
    });

    expect(result).toEqual({ ok: false, reason: 'test-key-in-production' });
    expect(JSON.stringify(result)).not.toContain('private-value');
  });

  it('allows a Test Store key only outside production', () => {
    expect(
      validateRevenueCatPublicKey({ apiKey: 'test_example', isProduction: false }),
    ).toEqual({ ok: true });
  });

  it('derives Pro only from the named active entitlement', () => {
    const info = {
      entitlements: {
        active: { [BRAVELINE_PRO_ENTITLEMENT]: { identifier: 'verified' } },
      },
    };

    expect(hasActiveEntitlement(info)).toBe(true);
    expect(hasActiveEntitlement({ entitlements: { active: {} } })).toBe(false);
  });
});
