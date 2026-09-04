import { describe, expect, it } from 'vitest';

import {
  decodeSessionSnapshot,
  encodeSessionSnapshot,
  type BraveLineSessionSnapshot,
} from '../session-codec';

const snapshot: BraveLineSessionSnapshot = {
  version: 1,
  updatedAt: '2026-09-03T12:00:00.000Z',
  scenarioId: 'impossible-deadline',
  phase: 'review',
  activePhraseId: 'boundary',
  take: {
    id: 'take-1',
    uri: 'file:///cache/take-1.m4a',
    durationMs: 2_400,
    capturedAt: '2026-09-03T12:00:00.000Z',
    localOnly: true,
    provider: 'expo-audio-native',
  },
  preferences: {
    guideVolume: 0.2,
    guideRate: 0.9,
    captions: true,
    reducedMotion: false,
  },
  feedback: {
    source: 'deterministic-local',
    evidencePhraseId: 'boundary',
  },
};

describe('local session codec', () => {
  it('round-trips metadata without audio bytes', () => {
    const encoded = encodeSessionSnapshot(snapshot);
    const decoded = decodeSessionSnapshot(encoded);

    expect(decoded).toEqual({ ok: true, value: snapshot });
    expect(encoded).not.toContain('base64');
  });

  it('rejects embedded audio payloads', () => {
    const unsafe = JSON.stringify({
      ...snapshot,
      audioBytes: 'data:audio/mp4;base64,AAAA',
    });

    expect(decodeSessionSnapshot(unsafe)).toEqual({
      ok: false,
      reason: 'unsafe-payload',
    });
  });

  it('rejects unknown fields even when audio bytes are disguised', () => {
    const disguised = JSON.stringify({
      ...snapshot,
      samples: [0, 12, 255, 64],
    });

    expect(decodeSessionSnapshot(disguised)).toEqual({
      ok: false,
      reason: 'invalid-schema',
    });
  });

  it('rejects remote recording URIs', () => {
    const remote = JSON.stringify({
      ...snapshot,
      take: { ...snapshot.take, uri: 'https://uploads.example/take.m4a' },
    });

    expect(decodeSessionSnapshot(remote)).toEqual({
      ok: false,
      reason: 'invalid-schema',
    });
  });
});
