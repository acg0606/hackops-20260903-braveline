import type { LocalAudioTake } from './audio';

export const SESSION_SCHEMA_VERSION = 1 as const;
export const DEFAULT_SESSION_STORAGE_KEY = '@braveline/session/v1';
export const MAX_SESSION_BYTES = 64 * 1024;

export type PersistedPhase =
  | 'prepare'
  | 'guiding'
  | 'handoff'
  | 'recording'
  | 'review'
  | 'retry';

export interface BraveLinePreferences {
  guideVolume: number;
  guideRate: number;
  captions: boolean;
  reducedMotion: boolean;
}

export interface PersistedFeedbackReference {
  source: 'deterministic-local' | 'demo-safe-fallback' | 'on-device';
  evidencePhraseId: string | null;
}

export interface BraveLineSessionSnapshot {
  version: typeof SESSION_SCHEMA_VERSION;
  updatedAt: string;
  scenarioId: string;
  phase: PersistedPhase;
  activePhraseId: string | null;
  take: LocalAudioTake | null;
  preferences: BraveLinePreferences;
  feedback: PersistedFeedbackReference | null;
}

export type SessionDecodeResult =
  | { ok: true; value: BraveLineSessionSnapshot }
  | {
      ok: false;
      reason: 'invalid-json' | 'invalid-schema' | 'unsafe-payload' | 'too-large';
    };

export function encodeSessionSnapshot(snapshot: BraveLineSessionSnapshot): string {
  if (!isBraveLineSessionSnapshot(snapshot)) {
    throw new Error('SESSION_INVALID_SCHEMA');
  }
  if (containsUnsafePayload(snapshot)) {
    throw new Error('SESSION_UNSAFE_PAYLOAD');
  }

  const serialized = JSON.stringify(snapshot);
  if (utf8ByteLength(serialized) > MAX_SESSION_BYTES) {
    throw new Error('SESSION_TOO_LARGE');
  }
  return serialized;
}

export function decodeSessionSnapshot(serialized: string): SessionDecodeResult {
  if (utf8ByteLength(serialized) > MAX_SESSION_BYTES) {
    return { ok: false, reason: 'too-large' };
  }

  let value: unknown;
  try {
    value = JSON.parse(serialized);
  } catch {
    return { ok: false, reason: 'invalid-json' };
  }

  if (containsUnsafePayload(value)) {
    return { ok: false, reason: 'unsafe-payload' };
  }
  if (!isBraveLineSessionSnapshot(value)) {
    return { ok: false, reason: 'invalid-schema' };
  }
  return { ok: true, value };
}

export function isBraveLineSessionSnapshot(
  value: unknown,
): value is BraveLineSessionSnapshot {
  if (!isRecord(value)) return false;
  if (
    !hasOnlyKeys(value, [
      'version',
      'updatedAt',
      'scenarioId',
      'phase',
      'activePhraseId',
      'take',
      'preferences',
      'feedback',
    ])
  ) {
    return false;
  }
  if (value.version !== SESSION_SCHEMA_VERSION) return false;
  if (!isIsoDate(value.updatedAt)) return false;
  if (typeof value.scenarioId !== 'string' || value.scenarioId.length === 0) {
    return false;
  }
  if (!isPhase(value.phase)) return false;
  if (value.activePhraseId !== null && typeof value.activePhraseId !== 'string') {
    return false;
  }
  if (!isPreferences(value.preferences)) return false;
  if (!isTake(value.take)) return false;
  if (!isFeedback(value.feedback)) return false;
  return true;
}

function containsUnsafePayload(value: unknown, key = ''): boolean {
  const normalizedKey = key.toLowerCase();
  if (
    normalizedKey.includes('base64') ||
    normalizedKey.includes('audiobytes') ||
    normalizedKey === 'blob' ||
    normalizedKey === 'buffer'
  ) {
    return true;
  }
  if (typeof value === 'string') {
    return /^data:audio\//i.test(value);
  }
  if (Array.isArray(value)) {
    return value.some((entry) => containsUnsafePayload(entry, key));
  }
  if (isRecord(value)) {
    return Object.entries(value).some(([entryKey, entry]) =>
      containsUnsafePayload(entry, entryKey),
    );
  }
  return false;
}

function isTake(value: unknown): value is LocalAudioTake | null {
  if (value === null) return true;
  if (!isRecord(value)) return false;
  if (
    !hasOnlyKeys(value, [
      'id',
      'uri',
      'durationMs',
      'capturedAt',
      'localOnly',
      'provider',
    ])
  ) {
    return false;
  }
  return (
    typeof value.id === 'string' &&
    typeof value.uri === 'string' &&
    /^(file|content|blob):/i.test(value.uri) &&
    typeof value.durationMs === 'number' &&
    Number.isFinite(value.durationMs) &&
    value.durationMs >= 0 &&
    isIsoDate(value.capturedAt) &&
    value.localOnly === true &&
    (value.provider === 'expo-audio-native' ||
      value.provider === 'expo-audio-web')
  );
}

function isPreferences(value: unknown): value is BraveLinePreferences {
  if (!isRecord(value)) return false;
  if (
    !hasOnlyKeys(value, [
      'guideVolume',
      'guideRate',
      'captions',
      'reducedMotion',
    ])
  ) {
    return false;
  }
  return (
    typeof value.guideVolume === 'number' &&
    value.guideVolume >= 0 &&
    value.guideVolume <= 1 &&
    typeof value.guideRate === 'number' &&
    value.guideRate >= 0.5 &&
    value.guideRate <= 2 &&
    typeof value.captions === 'boolean' &&
    typeof value.reducedMotion === 'boolean'
  );
}

function isFeedback(value: unknown): value is PersistedFeedbackReference | null {
  if (value === null) return true;
  if (!isRecord(value)) return false;
  if (!hasOnlyKeys(value, ['source', 'evidencePhraseId'])) return false;
  return (
    (value.source === 'deterministic-local' ||
      value.source === 'demo-safe-fallback' ||
      value.source === 'on-device') &&
    (value.evidencePhraseId === null || typeof value.evidencePhraseId === 'string')
  );
}

function isPhase(value: unknown): value is PersistedPhase {
  return (
    value === 'prepare' ||
    value === 'guiding' ||
    value === 'handoff' ||
    value === 'recording' ||
    value === 'review' ||
    value === 'retry'
  );
}

function isIsoDate(value: unknown): value is string {
  if (typeof value !== 'string' || value.length === 0) return false;
  const parsed = Date.parse(value);
  return !Number.isNaN(parsed) && new Date(parsed).toISOString() === value;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function hasOnlyKeys(value: Record<string, unknown>, allowed: string[]): boolean {
  const allowedSet = new Set(allowed);
  return Object.keys(value).every((key) => allowedSet.has(key));
}

function utf8ByteLength(value: string): number {
  let bytes = 0;
  for (const character of value) {
    const point = character.codePointAt(0)!;
    if (point <= 0x7f) bytes += 1;
    else if (point <= 0x7ff) bytes += 2;
    else if (point <= 0xffff) bytes += 3;
    else bytes += 4;
  }
  return bytes;
}
