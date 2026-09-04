import { describe, expect, it } from 'vitest';

import {
  evaluateAudioCapability,
  evaluateRecordingStart,
  isLocalAudioUri,
} from '../audio-policy';

describe('audio capability policy', () => {
  it('never presents an unavailable browser microphone as recording', () => {
    const capability = evaluateAudioCapability({
      platform: 'web',
      expoAudioLoaded: true,
      hasWebMediaDevices: false,
      hasWebMediaRecorder: false,
      hasWebAudioPlayback: true,
    });

    expect(capability.provider).toBe('demo-safe-fallback');
    expect(capability.canRecord).toBe(false);
    expect(capability.disclosure).toContain('no recording will be simulated');
  });

  it('blocks the microphone until the guide is silent', () => {
    const capability = evaluateAudioCapability({
      platform: 'android',
      expoAudioLoaded: true,
    });
    const decision = evaluateRecordingStart({
      capability,
      permission: 'granted',
      guideStopped: false,
      operationInFlight: false,
    });

    expect(decision).toMatchObject({ allowed: false, reason: 'guide-active' });
  });

  it('accepts only device-local audio references', () => {
    expect(isLocalAudioUri('file:///cache/take.m4a')).toBe(true);
    expect(isLocalAudioUri('content://local/take')).toBe(true);
    expect(isLocalAudioUri('blob:https://localhost/id')).toBe(true);
    expect(isLocalAudioUri('https://uploads.example/take.m4a')).toBe(false);
    expect(isLocalAudioUri('data:audio/mp4;base64,AAAA')).toBe(false);
  });
});
