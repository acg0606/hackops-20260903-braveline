import type { LocalAudioTake } from './audio';
import type { LocalRecordingFileStatus } from './recording-file-store';
import type { BraveLineSessionStore } from './session-storage';

export type SessionResumeDestination =
  | {
      kind: 'prepare';
      reason:
        | 'inspection-failed'
        | 'invalid-session'
        | 'missing-file'
        | 'no-session'
        | 'unsupported-file'
        | 'web-take-expired';
    }
  | { kind: 'ready'; take: LocalAudioTake };

export interface SessionResumeOptions {
  inspectFile: (uri: string) => Promise<LocalRecordingFileStatus>;
  platform: 'native' | 'web';
  store: BraveLineSessionStore;
}

export async function resolveBraveLineResume({
  inspectFile,
  platform,
  store,
}: SessionResumeOptions): Promise<SessionResumeDestination> {
  const loaded = await store.load();
  if (!loaded.ok) return { kind: 'prepare', reason: 'invalid-session' };

  const snapshot = loaded.value;
  if (!snapshot) return { kind: 'prepare', reason: 'no-session' };
  if (snapshot.phase !== 'review' || !snapshot.take) {
    return { kind: 'prepare', reason: 'invalid-session' };
  }

  if (platform === 'web') {
    // A Blob URL belongs to the previous browser document and cannot be
    // replayed after a reload. Clearing only the stale pointer is safe.
    await store.clear();
    return { kind: 'prepare', reason: 'web-take-expired' };
  }

  let status: LocalRecordingFileStatus;
  try {
    status = await inspectFile(snapshot.take.uri);
  } catch {
    return { kind: 'prepare', reason: 'inspection-failed' };
  }

  if (status === 'valid') {
    return { kind: 'ready', take: snapshot.take };
  }

  if (status === 'missing' || status === 'empty') {
    await store.clear();
    return { kind: 'prepare', reason: 'missing-file' };
  }

  // Preserve unknown local references rather than broadening BraveLine's
  // filesystem authority or claiming a deletion it could not verify.
  return { kind: 'prepare', reason: 'unsupported-file' };
}
