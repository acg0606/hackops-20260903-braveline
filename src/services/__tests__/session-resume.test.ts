import { describe, expect, it, vi } from 'vitest';

import type { BraveLineSessionSnapshot } from '../session-codec';
import { resolveBraveLineResume } from '../session-resume';
import type { BraveLineSessionStore } from '../session-storage';

const snapshot: BraveLineSessionSnapshot = {
  version: 1,
  updatedAt: '2026-09-04T12:00:00.000Z',
  scenarioId: 'impossible-deadline',
  phase: 'review',
  activePhraseId: 'offer-reliable-friday',
  take: {
    id: 'take-1',
    uri: 'file:///data/user/0/app/files/Audio/recording-aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee.m4a',
    durationMs: 2_000,
    capturedAt: '2026-09-04T12:00:00.000Z',
    localOnly: true,
    provider: 'expo-audio-native',
  },
  preferences: {
    guideVolume: 0.15,
    guideRate: 0.9,
    captions: true,
    reducedMotion: false,
  },
  feedback: null,
};

function createStore(
  loaded: Awaited<ReturnType<BraveLineSessionStore['load']>>,
): BraveLineSessionStore {
  return {
    load: vi.fn(async () => loaded),
    save: vi.fn(async () => ({ ok: true as const, value: undefined })),
    clear: vi.fn(async () => ({ ok: true as const, value: undefined })),
  };
}

describe('session resume', () => {
  it('returns a verified native take to Ready', async () => {
    const store = createStore({ ok: true, value: snapshot });

    const result = await resolveBraveLineResume({
      inspectFile: vi.fn(async () => 'valid' as const),
      platform: 'native',
      store,
    });

    expect(result).toEqual({ kind: 'ready', take: snapshot.take });
    expect(store.clear).not.toHaveBeenCalled();
  });

  it('clears a stale pointer when the native audio file is missing', async () => {
    const store = createStore({ ok: true, value: snapshot });

    const result = await resolveBraveLineResume({
      inspectFile: vi.fn(async () => 'missing' as const),
      platform: 'native',
      store,
    });

    expect(result).toEqual({ kind: 'prepare', reason: 'missing-file' });
    expect(store.clear).toHaveBeenCalledOnce();
  });

  it('does not claim deletion for an unsupported local reference', async () => {
    const store = createStore({ ok: true, value: snapshot });

    const result = await resolveBraveLineResume({
      inspectFile: vi.fn(async () => 'unsupported' as const),
      platform: 'native',
      store,
    });

    expect(result).toEqual({ kind: 'prepare', reason: 'unsupported-file' });
    expect(store.clear).not.toHaveBeenCalled();
  });

  it('clears an expired browser Blob pointer after reload', async () => {
    const store = createStore({ ok: true, value: snapshot });

    const result = await resolveBraveLineResume({
      inspectFile: vi.fn(async () => 'valid' as const),
      platform: 'web',
      store,
    });

    expect(result).toEqual({ kind: 'prepare', reason: 'web-take-expired' });
    expect(store.clear).toHaveBeenCalledOnce();
  });
});
