import {
  RecordingPresets,
  getRecordingPermissionsAsync,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioPlayer,
  useAudioPlayerStatus,
  useAudioRecorder,
  useAudioRecorderState,
  type RecordingOptions,
  type RecordingStatus,
} from 'expo-audio';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Platform } from 'react-native';

import {
  evaluateAudioCapability,
  evaluateRecordingStart,
  isLocalAudioUri,
  mapExpoPermission,
  type AudioCapability,
  type AudioPlatform,
  type RecordingPermission,
  type RecordingStartBlock,
} from './audio-policy';
import {
  expoRecordingFileStore,
  inspectExpoAudioRecordingFile,
} from './recording-file-store';

export interface LocalAudioTake {
  id: string;
  uri: string;
  durationMs: number;
  capturedAt: string;
  localOnly: true;
  provider: 'expo-audio-native' | 'expo-audio-web';
}

export interface RecordingFileStore {
  removeLocalFile(uri: string): Promise<'deleted' | 'missing' | 'unsupported'>;
}

export type AudioFailureReason =
  | RecordingStartBlock
  | 'not-recording'
  | 'recording-failed'
  | 'invalid-recording'
  | 'playback-unavailable'
  | 'non-local-uri'
  | 'playback-failed'
  | 'delete-unavailable'
  | 'delete-failed';

export type AudioActionResult<T> =
  | { ok: true; value: T }
  | { ok: false; reason: AudioFailureReason; userMessage: string };

export interface BraveLineAudioSession {
  capability: AudioCapability;
  permission: RecordingPermission;
  isRecording: boolean;
  recordingDurationMs: number;
  isPlaying: boolean;
  playbackPositionMs: number;
  take: LocalAudioTake | null;
  refreshPermission(): Promise<RecordingPermission>;
  requestPermission(): Promise<RecordingPermission>;
  startRecording(input: { guideStopped: boolean }): Promise<AudioActionResult<void>>;
  stopRecording(): Promise<AudioActionResult<LocalAudioTake>>;
  playTake(take?: LocalAudioTake): Promise<AudioActionResult<void>>;
  pausePlayback(): AudioActionResult<void>;
  deleteTake(take?: LocalAudioTake): Promise<AudioActionResult<void>>;
}

export interface UseBraveLineAudioOptions {
  fileStore?: RecordingFileStore;
  now?: () => Date;
}

const BRAVELINE_RECORDING_OPTIONS: RecordingOptions = {
  ...RecordingPresets.HIGH_QUALITY,
  directory: 'document',
  numberOfChannels: 1,
  bitRate: 96_000,
  android: {
    ...RecordingPresets.HIGH_QUALITY.android,
    extension: '.m4a',
    outputFormat: 'mpeg4',
    audioEncoder: 'aac',
  },
  web: {
    mimeType: 'audio/webm',
    bitsPerSecond: 96_000,
  },
};

export function useBraveLineAudio(
  options: UseBraveLineAudioOptions = {},
): BraveLineAudioSession {
  const completionStatus = useRef<RecordingStatus | null>(null);
  const completionResolver = useRef<((status: RecordingStatus) => void) | null>(
    null,
  );
  const [recordingSessionActive, setRecordingSessionActive] = useState(false);
  const recorder = useAudioRecorder(BRAVELINE_RECORDING_OPTIONS, (status) => {
    if (!status.isFinished) return;
    completionStatus.current = status;
    completionResolver.current?.(status);
    completionResolver.current = null;
    setRecordingSessionActive(false);
  });
  const recorderState = useAudioRecorderState(recorder, 100);
  const player = useAudioPlayer(null, { updateInterval: 100 });
  const playerState = useAudioPlayerStatus(player);
  const [permission, setPermission] = useState<RecordingPermission>(
    'undetermined',
  );
  const [take, setTake] = useState<LocalAudioTake | null>(null);
  const operationInFlight = useRef(false);
  const recordingActive = useRef(false);
  const startedAtMs = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (!recordingActive.current) return;
      recordingActive.current = false;
      const candidateUri = recorder.uri;
      void recorder
        .stop()
        .catch(() => undefined)
        .then(async () => {
          if (candidateUri && isLocalAudioUri(candidateUri)) {
            await (options.fileStore ?? expoRecordingFileStore)
              .removeLocalFile(candidateUri)
              .catch(() => 'unsupported');
          }
          await setAudioModeAsync({ allowsRecording: false }).catch(() => undefined);
        });
    },
    [options.fileStore, recorder],
  );

  const capability = useMemo(
    () =>
      evaluateAudioCapability({
        platform: normalizePlatform(Platform.OS),
        expoAudioLoaded: true,
        hasWebMediaDevices:
          Platform.OS === 'web' &&
          typeof navigator !== 'undefined' &&
          Boolean(navigator.mediaDevices?.getUserMedia),
        hasWebMediaRecorder:
          Platform.OS === 'web' && typeof MediaRecorder !== 'undefined',
        hasWebAudioPlayback:
          Platform.OS === 'web' && typeof Audio !== 'undefined',
      }),
    [],
  );

  const refreshPermission = useCallback(async () => {
    if (!capability.canRecord) {
      setPermission('unavailable');
      return 'unavailable' as const;
    }

    try {
      const next = mapExpoPermission(await getRecordingPermissionsAsync());
      setPermission(next);
      return next;
    } catch {
      setPermission('unavailable');
      return 'unavailable' as const;
    }
  }, [capability.canRecord]);

  const requestPermission = useCallback(async () => {
    if (!capability.canRecord) {
      setPermission('unavailable');
      return 'unavailable' as const;
    }

    try {
      const next = mapExpoPermission(await requestRecordingPermissionsAsync());
      setPermission(next);
      return next;
    } catch {
      setPermission('unavailable');
      return 'unavailable' as const;
    }
  }, [capability.canRecord]);

  const startRecording = useCallback(
    async ({ guideStopped }: { guideStopped: boolean }) => {
      const knownPermission =
        permission === 'undetermined' ? await refreshPermission() : permission;
      const gate = evaluateRecordingStart({
        capability,
        permission: knownPermission,
        guideStopped,
        operationInFlight:
          operationInFlight.current || recordingActive.current || recorderState.isRecording,
      });

      if (!gate.allowed) {
        return {
          ok: false,
          reason: gate.reason,
          userMessage: gate.userMessage,
        } as const;
      }

      operationInFlight.current = true;
      completionStatus.current = null;
      completionResolver.current = null;
      try {
        await setAudioModeAsync({
          allowsRecording: true,
          playsInSilentMode: true,
          shouldPlayInBackground: false,
          allowsBackgroundRecording: false,
        });
        await recorder.prepareToRecordAsync(BRAVELINE_RECORDING_OPTIONS);
        recorder.record();
        recordingActive.current = true;
        setRecordingSessionActive(true);
        startedAtMs.current = Date.now();
        return { ok: true, value: undefined } as const;
      } catch {
        recordingActive.current = false;
        setRecordingSessionActive(false);
        startedAtMs.current = null;
        await setAudioModeAsync({ allowsRecording: false }).catch(() => undefined);
        return {
          ok: false,
          reason: 'recording-failed',
          userMessage:
            'The microphone could not start. No recording was created; you can retry or keep practising from the script.',
        } as const;
      } finally {
        operationInFlight.current = false;
      }
    }, [capability, permission, recorder, recorderState.isRecording, refreshPermission],
  );

  const stopRecording = useCallback(async () => {
    if (
      operationInFlight.current ||
      (!recordingActive.current && !recorderState.isRecording)
    ) {
      return {
        ok: false,
        reason: 'not-recording',
        userMessage: 'There is no active recording to stop.',
      } as const;
    }

    operationInFlight.current = true;
    const durationBeforeStop = recorderState.durationMillis;
    const completion = new Promise<RecordingStatus>((resolve) => {
      completionResolver.current = resolve;
    });

    try {
      await recorder.stop();
      await setAudioModeAsync({ allowsRecording: false });
      recordingActive.current = false;
      setRecordingSessionActive(false);
      startedAtMs.current = null;

      const status =
        completionStatus.current ??
        (await waitForRecordingCompletion(completion, 1_500));
      const completedUri = status?.url ?? null;

      if (
        !status ||
        status.hasError ||
        !status.isFinished ||
        !completedUri ||
        !isLocalAudioUri(completedUri) ||
        durationBeforeStop < 250
      ) {
        await discardRecordingCandidate(
          completedUri ?? recorder.uri,
          options.fileStore ?? expoRecordingFileStore,
        );
        return {
          ok: false,
          reason: 'invalid-recording',
          userMessage:
            'The recorder did not produce a valid local file. Nothing was saved.',
        } as const;
      }

      if (Platform.OS !== 'web') {
        const fileStatus = await inspectExpoAudioRecordingFile(completedUri);
        if (fileStatus !== 'valid') {
          await discardRecordingCandidate(
            completedUri,
            options.fileStore ?? expoRecordingFileStore,
          );
          return {
            ok: false,
            reason: 'invalid-recording',
            userMessage:
              'The recorder did not produce a playable local file. Nothing was saved.',
          } as const;
        }
      }

      const capturedAt = (options.now?.() ?? new Date()).toISOString();
      const nextTake: LocalAudioTake = {
        id: `take-${capturedAt.replace(/[^0-9]/g, '')}`,
        uri: completedUri,
        durationMs: Math.max(0, Math.round(durationBeforeStop)),
        capturedAt,
        localOnly: true,
        provider:
          capability.provider === 'expo-audio-web'
            ? 'expo-audio-web'
            : 'expo-audio-native',
      };
      setTake(nextTake);
      return { ok: true, value: nextTake } as const;
    } catch {
      recordingActive.current = false;
      setRecordingSessionActive(false);
      startedAtMs.current = null;
      await setAudioModeAsync({ allowsRecording: false }).catch(() => undefined);
      return {
        ok: false,
        reason: 'recording-failed',
        userMessage:
          'The recording could not be completed. No successful take is being claimed.',
      } as const;
    } finally {
      completionResolver.current = null;
      operationInFlight.current = false;
    }
  }, [capability.provider, options, recorder, recorderState]);

  const playTake = useCallback(
    async (requestedTake?: LocalAudioTake) => {
      const selected = requestedTake ?? take;
      if (!selected || !capability.canPlayLocalAudio) {
        return {
          ok: false,
          reason: 'playback-unavailable',
          userMessage: 'There is no playable local take on this device.',
        } as const;
      }
      if (!isLocalAudioUri(selected.uri)) {
        return {
          ok: false,
          reason: 'non-local-uri',
          userMessage: 'Only local recordings can be played in BraveLine.',
        } as const;
      }

      try {
        await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
        player.replace(selected.uri);
        await player.seekTo(0);
        player.play();
        return { ok: true, value: undefined } as const;
      } catch {
        return {
          ok: false,
          reason: 'playback-failed',
          userMessage: 'This local take could not be played. The file was not uploaded.',
        } as const;
      }
    },
    [capability.canPlayLocalAudio, player, take],
  );

  const pausePlayback = useCallback((): AudioActionResult<void> => {
    try {
      player.pause();
      return { ok: true, value: undefined };
    } catch {
      return {
        ok: false,
        reason: 'playback-failed',
        userMessage: 'Playback could not be paused.',
      };
    }
  }, [player]);

  const deleteTake = useCallback(
    async (requestedTake?: LocalAudioTake) => {
      const selected = requestedTake ?? take;
      if (!selected) {
        return { ok: true, value: undefined } as const;
      }
      if (!isLocalAudioUri(selected.uri)) {
        return {
          ok: false,
          reason: 'non-local-uri',
          userMessage: 'BraveLine refuses to delete a non-local URI.',
        } as const;
      }

      try {
        player.pause();

        // expo-audio 57.0.4 declares null as a valid AudioSource, but its
        // Android and iOS replace bridges require a non-null native record.
        // The web player does support null and uses it to detach the Blob
        // before URL revocation. Native files can be unlinked while paused.
        if (Platform.OS === 'web') {
          player.replace(null);
        }

        if (selected.uri.startsWith('blob:') && typeof URL !== 'undefined') {
          URL.revokeObjectURL(selected.uri);
        } else {
          const fileStore = options.fileStore ?? expoRecordingFileStore;
          const result = await fileStore.removeLocalFile(selected.uri);
          if (result === 'unsupported') {
            return deleteUnavailable();
          }
        }

        setTake((current) => (current?.id === selected.id ? null : current));
        return { ok: true, value: undefined } as const;
      } catch {
        return {
          ok: false,
          reason: 'delete-failed',
          userMessage:
            'The local file could not be deleted, so its metadata was kept for an honest retry.',
        } as const;
      }
    },
    [options.fileStore, player, take],
  );

  return {
    capability,
    permission,
    isRecording: recordingSessionActive || recorderState.isRecording,
    recordingDurationMs: recorderState.durationMillis,
    isPlaying: playerState.playing,
    playbackPositionMs: Math.round(playerState.currentTime * 1_000),
    take,
    refreshPermission,
    requestPermission,
    startRecording,
    stopRecording,
    playTake,
    pausePlayback,
    deleteTake,
  };
}

function waitForRecordingCompletion(
  completion: Promise<RecordingStatus>,
  timeoutMs: number,
): Promise<RecordingStatus | null> {
  return new Promise((resolve) => {
    const timeout = setTimeout(() => resolve(null), timeoutMs);
    void completion.then((status) => {
      clearTimeout(timeout);
      resolve(status);
    });
  });
}

async function discardRecordingCandidate(
  uri: string | null,
  fileStore: RecordingFileStore,
): Promise<void> {
  if (!uri || !isLocalAudioUri(uri)) return;
  if (uri.startsWith('blob:') && typeof URL !== 'undefined') {
    URL.revokeObjectURL(uri);
    return;
  }
  await fileStore.removeLocalFile(uri).catch(() => 'unsupported');
}

function normalizePlatform(platform: string): AudioPlatform {
  if (platform === 'android' || platform === 'ios' || platform === 'web') {
    return platform;
  }
  return 'other';
}

function deleteUnavailable(): AudioActionResult<void> {
  return {
    ok: false,
    reason: 'delete-unavailable',
    userMessage:
      'This build cannot yet remove the native audio file. Nothing was marked deleted.',
  };
}
