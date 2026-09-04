import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { describe, expect, it, vi } from 'vitest';

import {
  useBraveLineAudio,
  type BraveLineAudioSession,
  type LocalAudioTake,
} from '../audio';

const native = vi.hoisted(() => ({
  player: {
    pause: vi.fn(),
    replace: vi.fn(),
    seekTo: vi.fn(async () => undefined),
    play: vi.fn(),
  },
  recorder: {
    uri: null as string | null,
    stop: vi.fn(async () => undefined),
    prepareToRecordAsync: vi.fn(async () => undefined),
    record: vi.fn(),
  },
}));

vi.mock('react-native', () => ({
  Platform: { OS: 'android' },
}));

vi.mock('expo-audio', () => ({
  RecordingPresets: {
    HIGH_QUALITY: { android: {}, ios: {}, web: {} },
  },
  getRecordingPermissionsAsync: vi.fn(),
  requestRecordingPermissionsAsync: vi.fn(),
  setAudioModeAsync: vi.fn(async () => undefined),
  useAudioPlayer: () => native.player,
  useAudioPlayerStatus: () => ({ playing: false, currentTime: 0 }),
  useAudioRecorder: () => native.recorder,
  useAudioRecorderState: () => ({
    isRecording: false,
    durationMillis: 0,
  }),
}));

describe('audio take deletion', () => {
  it('deletes a native file without calling replace(null)', async () => {
    const removeLocalFile = vi.fn(async () => 'deleted' as const);
    const take: LocalAudioTake = {
      id: 'take-1',
      uri: 'file:///data/user/0/app/files/Audio/recording-aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee.m4a',
      durationMs: 2_000,
      capturedAt: '2026-09-04T12:00:00.000Z',
      localOnly: true,
      provider: 'expo-audio-native',
    };

    native.player.replace.mockImplementation((source: unknown) => {
      if (source === null) throw new Error('native replace(null) rejected');
    });

    let session!: BraveLineAudioSession;
    let renderer!: ReactTestRenderer;
    let result:
      | Awaited<ReturnType<BraveLineAudioSession['deleteTake']>>
      | undefined;

    function Harness() {
      session = useBraveLineAudio({ fileStore: { removeLocalFile } });
      return null;
    }

    await act(async () => {
      renderer = create(<Harness />);
    });

    await act(async () => {
      result = await session.deleteTake(take);
    });

    expect(result).toEqual({ ok: true, value: undefined });
    expect(removeLocalFile).toHaveBeenCalledOnce();
    expect(removeLocalFile).toHaveBeenCalledWith(take.uri);
    expect(native.player.replace).not.toHaveBeenCalledWith(null);

    act(() => renderer.unmount());
  });
});
