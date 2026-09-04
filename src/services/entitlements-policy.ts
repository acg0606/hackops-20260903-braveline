export const BRAVELINE_PRO_ENTITLEMENT = 'braveline_pro' as const;

export type RevenueCatKeyGuardResult =
  | { ok: true }
  | {
      ok: false;
      reason: 'missing-key' | 'test-key-in-production' | 'secret-key-rejected';
    };

export function validateRevenueCatPublicKey(input: {
  apiKey?: string;
  isProduction: boolean;
}): RevenueCatKeyGuardResult {
  const key = input.apiKey?.trim();
  if (!key) return { ok: false, reason: 'missing-key' };

  const normalized = key.toLowerCase();
  if (input.isProduction && normalized.startsWith('test_')) {
    return { ok: false, reason: 'test-key-in-production' };
  }
  if (
    normalized.startsWith('sk_') ||
    normalized.startsWith('secret_') ||
    normalized.startsWith('bearer ')
  ) {
    return { ok: false, reason: 'secret-key-rejected' };
  }
  return { ok: true };
}

export function hasActiveEntitlement(
  customerInfo: unknown,
  entitlementId = BRAVELINE_PRO_ENTITLEMENT,
): boolean {
  if (!isRecord(customerInfo)) return false;
  const entitlements = customerInfo.entitlements;
  if (!isRecord(entitlements)) return false;
  const active = entitlements.active;
  if (!isRecord(active)) return false;
  return Boolean(active[entitlementId]);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
