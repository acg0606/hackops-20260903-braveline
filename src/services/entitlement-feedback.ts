import type { EntitlementActionResult } from './entitlements';

export interface EntitlementFeedback {
  label: string;
  message: string;
  verifiedAction: 'purchase' | 'restore' | null;
}

/** An active entitlement alone never proves that the last operation succeeded. */
export function entitlementFeedback(result: EntitlementActionResult): EntitlementFeedback {
  if (!result.ok) {
    return { label: 'FAILED', message: result.userMessage, verifiedAction: null };
  }

  switch (result.action) {
    case 'purchased':
      return result.snapshot.isPro
        ? {
            label: 'PURCHASE VERIFIED',
            message: 'Purchase completed. BraveLine Plus is active and verified by RevenueCat.',
            verifiedAction: 'purchase',
          }
        : {
            label: 'PURCHASE — ACCESS UNVERIFIED',
            message: 'The store reported a purchase, but no active BraveLine Plus entitlement was verified.',
            verifiedAction: null,
          };
    case 'restored':
      return result.snapshot.isPro
        ? {
            label: 'RESTORE VERIFIED',
            message: 'Restore completed. BraveLine Plus is active and verified by RevenueCat.',
            verifiedAction: 'restore',
          }
        : {
            label: 'RESTORE — NO ACTIVE ACCESS',
            message: 'Restore completed. No active BraveLine Plus entitlement was found.',
            verifiedAction: null,
          };
    case 'paywall-cancelled':
      return {
        label: 'CANCELLED',
        message: 'Paywall closed without a completed purchase or restore.',
        verifiedAction: null,
      };
    case 'paywall-not-presented':
      return {
        label: 'PAYWALL NOT PRESENTED',
        message: 'No paywall was shown. No new purchase or restore was performed.',
        verifiedAction: null,
      };
    default:
      return {
        label: 'ACCESS CHECK',
        message: result.snapshot.disclosure,
        verifiedAction: null,
      };
  }
}
