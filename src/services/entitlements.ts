import { Platform } from 'react-native';

import {
  BRAVELINE_PRO_ENTITLEMENT,
  hasActiveEntitlement,
  validateRevenueCatPublicKey,
} from './entitlements-policy';

export type EntitlementMode = 'preview' | 'revenuecat-native' | 'blocked';
export type EntitlementStatus =
  | 'preview'
  | 'idle'
  | 'initializing'
  | 'ready'
  | 'unavailable'
  | 'error';

export interface EntitlementSnapshot {
  mode: EntitlementMode;
  status: EntitlementStatus;
  entitlementId: typeof BRAVELINE_PRO_ENTITLEMENT;
  isPro: boolean;
  disclosure: string;
}

export type EntitlementAction =
  | 'initialized'
  | 'paywall-closed'
  | 'entitlement-verified'
  | 'restored'
  | 'customer-center-opened';

export type EntitlementActionResult =
  | {
      ok: true;
      action: EntitlementAction;
      externalEffect: 'none' | 'user-mediated' | 'verified-entitlement';
      snapshot: EntitlementSnapshot;
    }
  | {
      ok: false;
      reason:
        | 'preview-only'
        | 'configuration-blocked'
        | 'native-unavailable'
        | 'operation-failed';
      externalEffect: 'none' | 'unknown';
      userMessage: string;
      snapshot: EntitlementSnapshot;
    };

export interface Entitlements {
  readonly snapshot: EntitlementSnapshot;
  readonly status: EntitlementStatus;
  readonly isPro: boolean;
  initialize(): Promise<EntitlementActionResult>;
  refresh(): Promise<EntitlementActionResult>;
  presentPaywall(): Promise<EntitlementActionResult>;
  restore(): Promise<EntitlementActionResult>;
  openCustomerCenter(): Promise<EntitlementActionResult>;
}

interface RevenueCatNativeModules {
  purchases: {
    configure(configuration: { apiKey: string }): void;
    getCustomerInfo(): Promise<unknown>;
    restorePurchases(): Promise<unknown>;
  };
  ui: {
    presentPaywallIfNeeded(input: {
      requiredEntitlementIdentifier: string;
      displayCloseButton: boolean;
    }): Promise<unknown>;
    presentCustomerCenter(): Promise<void>;
  };
}

export interface CreateEntitlementsOptions {
  apiKey?: string;
  isProduction: boolean;
  platform?: string;
  loadNativeModules?: () => Promise<RevenueCatNativeModules>;
}

export class RevenueCatConfigurationError extends Error {
  constructor(
    public readonly code: 'test-key-in-production' | 'secret-key-rejected',
  ) {
    super(code === 'test-key-in-production' ? 'TEST_KEY_IN_PRODUCTION' : 'SECRET_KEY_REJECTED');
    this.name = 'RevenueCatConfigurationError';
  }
}

export function assertRevenueCatReleaseKey(
  apiKey: string,
  isProduction: boolean,
): void {
  const result = validateRevenueCatPublicKey({ apiKey, isProduction });
  if (!result.ok && result.reason !== 'missing-key') {
    throw new RevenueCatConfigurationError(result.reason);
  }
}

export function createEntitlements(
  options: CreateEntitlementsOptions,
): Entitlements {
  const platform = options.platform ?? Platform.OS;
  const keyGuard = validateRevenueCatPublicKey(options);

  if (!keyGuard.ok && keyGuard.reason === 'missing-key') {
    return new PreviewEntitlements(
      'Plus preview only — RevenueCat is not configured, so no purchase can occur.',
    );
  }

  if (!keyGuard.ok) {
    return new BlockedEntitlements(
      keyGuard.reason === 'test-key-in-production'
        ? 'Release blocked: a RevenueCat Test Store key cannot be used in production.'
        : 'Release blocked: only a public RevenueCat SDK key may be used here.',
    );
  }

  if (platform !== 'android' && platform !== 'ios') {
    return new PreviewEntitlements(
      'Plus preview only — native RevenueCat purchasing is unavailable on this platform.',
    );
  }

  return new RevenueCatEntitlements(
    options.apiKey!.trim(),
    options.loadNativeModules ?? loadRevenueCatNativeModules,
  );
}

export function createPreviewEntitlements(): Entitlements {
  return new PreviewEntitlements(
    'Plus preview only — no purchase or restore is performed in this build.',
  );
}

class PreviewEntitlements implements Entitlements {
  constructor(public readonly disclosure: string) {}

  get snapshot(): EntitlementSnapshot {
    return snapshot('preview', 'preview', false, this.disclosure);
  }

  get status(): EntitlementStatus {
    return this.snapshot.status;
  }

  get isPro(): boolean {
    return false;
  }

  initialize = async () => previewFailure(this.snapshot);
  refresh = async () => previewFailure(this.snapshot);
  presentPaywall = async () => previewFailure(this.snapshot);
  restore = async () => previewFailure(this.snapshot);
  openCustomerCenter = async () => previewFailure(this.snapshot);
}

class BlockedEntitlements implements Entitlements {
  constructor(public readonly disclosure: string) {}

  get snapshot(): EntitlementSnapshot {
    return snapshot('blocked', 'unavailable', false, this.disclosure);
  }

  get status(): EntitlementStatus {
    return this.snapshot.status;
  }

  get isPro(): boolean {
    return false;
  }

  initialize = async () => blockedFailure(this.snapshot);
  refresh = async () => blockedFailure(this.snapshot);
  presentPaywall = async () => blockedFailure(this.snapshot);
  restore = async () => blockedFailure(this.snapshot);
  openCustomerCenter = async () => blockedFailure(this.snapshot);
}

class RevenueCatEntitlements implements Entitlements {
  private modules: RevenueCatNativeModules | null = null;
  private state = snapshot(
    'revenuecat-native',
    'idle',
    false,
    'RevenueCat native boundary is ready to initialize.',
  );
  private initialization: Promise<EntitlementActionResult> | null = null;

  constructor(
    private readonly apiKey: string,
    private readonly loader: () => Promise<RevenueCatNativeModules>,
  ) {}

  get snapshot(): EntitlementSnapshot {
    return this.state;
  }

  get status(): EntitlementStatus {
    return this.state.status;
  }

  get isPro(): boolean {
    return this.state.isPro;
  }

  initialize(): Promise<EntitlementActionResult> {
    if (this.state.status === 'ready') {
      return Promise.resolve(success('initialized', 'none', this.state));
    }
    if (this.initialization) return this.initialization;

    this.state = snapshot(
      'revenuecat-native',
      'initializing',
      false,
      'Connecting the native entitlement boundary.',
    );
    this.initialization = this.initializeOnce();
    return this.initialization;
  }

  async refresh(): Promise<EntitlementActionResult> {
    const ready = await this.ensureReady();
    if (!ready.ok) return ready;
    return this.refreshFromCustomerInfo('initialized', 'none');
  }

  async presentPaywall(): Promise<EntitlementActionResult> {
    const ready = await this.ensureReady();
    if (!ready.ok) return ready;

    try {
      await this.modules!.ui.presentPaywallIfNeeded({
        requiredEntitlementIdentifier: BRAVELINE_PRO_ENTITLEMENT,
        displayCloseButton: true,
      });
      return this.refreshFromCustomerInfo('paywall-closed', 'user-mediated');
    } catch {
      return operationFailure(this.state);
    }
  }

  async restore(): Promise<EntitlementActionResult> {
    const ready = await this.ensureReady();
    if (!ready.ok) return ready;

    try {
      const info = await this.modules!.purchases.restorePurchases();
      const isPro = hasActiveEntitlement(info);
      this.state = readySnapshot(isPro);
      return success(
        isPro ? 'entitlement-verified' : 'restored',
        isPro ? 'verified-entitlement' : 'user-mediated',
        this.state,
      );
    } catch {
      return operationFailure(this.state);
    }
  }

  async openCustomerCenter(): Promise<EntitlementActionResult> {
    const ready = await this.ensureReady();
    if (!ready.ok) return ready;

    try {
      await this.modules!.ui.presentCustomerCenter();
      return success('customer-center-opened', 'user-mediated', this.state);
    } catch {
      return operationFailure(this.state);
    }
  }

  private async initializeOnce(): Promise<EntitlementActionResult> {
    try {
      this.modules = await this.loader();
      this.modules.purchases.configure({ apiKey: this.apiKey });
      return this.refreshFromCustomerInfo('initialized', 'none');
    } catch {
      this.state = snapshot(
        'revenuecat-native',
        'unavailable',
        false,
        'RevenueCat native services are unavailable. The free rehearsal remains available.',
      );
      return {
        ok: false,
        reason: 'native-unavailable',
        externalEffect: 'none',
        userMessage: this.state.disclosure,
        snapshot: this.state,
      };
    } finally {
      this.initialization = null;
    }
  }

  private async ensureReady(): Promise<EntitlementActionResult> {
    if (this.state.status === 'ready' && this.modules) {
      return success('initialized', 'none', this.state);
    }
    return this.initialize();
  }

  private async refreshFromCustomerInfo(
    fallbackAction: EntitlementAction,
    fallbackEffect: 'none' | 'user-mediated',
  ): Promise<EntitlementActionResult> {
    try {
      const info = await this.modules!.purchases.getCustomerInfo();
      const isPro = hasActiveEntitlement(info);
      this.state = readySnapshot(isPro);
      return success(
        isPro ? 'entitlement-verified' : fallbackAction,
        isPro ? 'verified-entitlement' : fallbackEffect,
        this.state,
      );
    } catch {
      this.state = snapshot(
        'revenuecat-native',
        'error',
        false,
        'Entitlement status could not be verified. Pro access is not being claimed.',
      );
      return operationFailure(this.state);
    }
  }
}

async function loadRevenueCatNativeModules(): Promise<RevenueCatNativeModules> {
  const [purchasesModule, uiModule] = await Promise.all([
    import('react-native-purchases'),
    import('react-native-purchases-ui'),
  ]);
  return {
    purchases: purchasesModule.default,
    ui: uiModule.default,
  };
}

function snapshot(
  mode: EntitlementMode,
  status: EntitlementStatus,
  isPro: boolean,
  disclosure: string,
): EntitlementSnapshot {
  return {
    mode,
    status,
    entitlementId: BRAVELINE_PRO_ENTITLEMENT,
    isPro,
    disclosure,
  };
}

function readySnapshot(isPro: boolean): EntitlementSnapshot {
  return snapshot(
    'revenuecat-native',
    'ready',
    isPro,
    isPro
      ? 'BraveLine Plus is verified through the active RevenueCat entitlement.'
      : 'No active BraveLine Plus entitlement is verified.',
  );
}

function success(
  action: EntitlementAction,
  externalEffect: 'none' | 'user-mediated' | 'verified-entitlement',
  current: EntitlementSnapshot,
): EntitlementActionResult {
  return { ok: true, action, externalEffect, snapshot: current };
}

function previewFailure(current: EntitlementSnapshot): EntitlementActionResult {
  return {
    ok: false,
    reason: 'preview-only',
    externalEffect: 'none',
    userMessage: current.disclosure,
    snapshot: current,
  };
}

function blockedFailure(current: EntitlementSnapshot): EntitlementActionResult {
  return {
    ok: false,
    reason: 'configuration-blocked',
    externalEffect: 'none',
    userMessage: current.disclosure,
    snapshot: current,
  };
}

function operationFailure(current: EntitlementSnapshot): EntitlementActionResult {
  return {
    ok: false,
    reason: 'operation-failed',
    externalEffect: 'unknown',
    userMessage:
      'The RevenueCat operation could not be verified. No purchase or entitlement is being claimed.',
    snapshot: current,
  };
}
