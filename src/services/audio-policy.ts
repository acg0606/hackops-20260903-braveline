export type AudioPlatform = 'android' | 'ios' | 'web' | 'other';

export type AudioProvider =
  | 'expo-audio-native'
  | 'expo-audio-web'
  | 'demo-safe-fallback';

export interface AudioCapability {
  provider: AudioProvider;
  canRecord: boolean;
  canPlayLocalAudio: boolean;
  disclosure: string;
}

export interface AudioRuntimeFacts {
  platform: AudioPlatform;
  expoAudioLoaded: boolean;
  hasWebMediaDevices?: boolean;
  hasWebMediaRecorder?: boolean;
  hasWebAudioPlayback?: boolean;
}

export type RecordingPermission =
  | 'granted'
  | 'denied'
  | 'undetermined'
  | 'unavailable';

export type RecordingStartBlock =
  | 'guide-active'
  | 'capability-unavailable'
  | 'permission-denied'
  | 'permission-required'
  | 'already-recording';

export type RecordingStartDecision =
  | { allowed: true }
  | { allowed: false; reason: RecordingStartBlock; userMessage: string };

export function evaluateAudioCapability(facts: AudioRuntimeFacts): AudioCapability {
  if (!facts.expoAudioLoaded) {
    return demoSafeCapability(
      'Audio is unavailable in this build. You can still rehearse from the script; no recording was made.',
    );
  }

  if (facts.platform === 'android' || facts.platform === 'ios') {
    return {
      provider: 'expo-audio-native',
      canRecord: true,
      canPlayLocalAudio: true,
      disclosure: 'Recording stays in this app on this device.',
    };
  }

  if (facts.platform === 'web') {
    const canRecord = Boolean(
      facts.hasWebMediaDevices && facts.hasWebMediaRecorder,
    );

    if (!canRecord) {
      return demoSafeCapability(
        'This browser cannot access a microphone. Script rehearsal is available, but no recording will be simulated.',
        Boolean(facts.hasWebAudioPlayback),
      );
    }

    return {
      provider: 'expo-audio-web',
      canRecord: true,
      canPlayLocalAudio: Boolean(facts.hasWebAudioPlayback),
      disclosure:
        'Browser recording is available only after permission. It is kept as a local temporary object URL.',
    };
  }

  return demoSafeCapability(
    'Recording is not supported on this platform. You can still rehearse from the script; no recording was made.',
  );
}

export function mapExpoPermission(permission: {
  granted: boolean;
  status?: string;
}): RecordingPermission {
  if (permission.granted || permission.status === 'granted') {
    return 'granted';
  }
  if (permission.status === 'denied') {
    return 'denied';
  }
  return 'undetermined';
}

export function evaluateRecordingStart(input: {
  capability: AudioCapability;
  permission: RecordingPermission;
  guideStopped: boolean;
  operationInFlight: boolean;
}): RecordingStartDecision {
  if (!input.guideStopped) {
    return {
      allowed: false,
      reason: 'guide-active',
      userMessage: 'Wait until the guide is silent before recording your take.',
    };
  }

  if (!input.capability.canRecord) {
    return {
      allowed: false,
      reason: 'capability-unavailable',
      userMessage: input.capability.disclosure,
    };
  }

  if (input.operationInFlight) {
    return {
      allowed: false,
      reason: 'already-recording',
      userMessage: 'A recording action is already in progress.',
    };
  }

  if (input.permission === 'denied') {
    return {
      allowed: false,
      reason: 'permission-denied',
      userMessage:
        'Microphone permission is off. Enable it to record, or keep practising from the script.',
    };
  }

  if (input.permission !== 'granted') {
    return {
      allowed: false,
      reason: 'permission-required',
      userMessage: 'Allow microphone access before starting a recording.',
    };
  }

  return { allowed: true };
}

export function isLocalAudioUri(uri: string): boolean {
  return /^(file|content|blob):/i.test(uri);
}

function demoSafeCapability(
  disclosure: string,
  canPlayLocalAudio = false,
): AudioCapability {
  return {
    provider: 'demo-safe-fallback',
    canRecord: false,
    canPlayLocalAudio,
    disclosure,
  };
}
