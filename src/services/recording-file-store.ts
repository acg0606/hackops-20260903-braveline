import type { RecordingFileStore } from './audio';

interface LocalFileHandle {
  readonly exists: boolean;
  readonly size?: number;
  delete(): void;
}

interface LocalFileConstructor {
  new (uri: string): LocalFileHandle;
}

export type ExpoFileSystemLoader = () => Promise<{ File: LocalFileConstructor }>;

export type LocalRecordingFileStatus =
  | 'valid'
  | 'missing'
  | 'empty'
  | 'unsupported';

export function isOwnedExpoAudioRecordingUri(uri: string): boolean {
  if (!uri.toLowerCase().startsWith('file:')) return false;

  let decoded: string;
  try {
    decoded = decodeURIComponent(uri).replace(/\\/g, '/');
  } catch {
    return false;
  }

  return /\/(Audio|ExpoAudio)\/recording-[0-9a-f-]+\.(m4a|caf|3gp)$/i.test(
    decoded,
  );
}

export function createExpoRecordingFileStore(
  loader: ExpoFileSystemLoader = loadExpoFileSystem,
): RecordingFileStore {
  return {
    async removeLocalFile(uri) {
      // Limit deletion to Expo Audio's own UUID-named recording files. A caller
      // cannot turn this boundary into a general-purpose filesystem delete.
      if (!isOwnedExpoAudioRecordingUri(uri)) return 'unsupported';

      const { File } = await loader();
      const file = new File(uri);
      if (!file.exists) return 'missing';

      file.delete();
      return file.exists ? 'unsupported' : 'deleted';
    },
  };
}

export async function inspectExpoAudioRecordingFile(
  uri: string,
  loader: ExpoFileSystemLoader = loadExpoFileSystem,
): Promise<LocalRecordingFileStatus> {
  if (!isOwnedExpoAudioRecordingUri(uri)) return 'unsupported';

  const { File } = await loader();
  const file = new File(uri);
  if (!file.exists) return 'missing';
  return typeof file.size === 'number' && file.size > 0 ? 'valid' : 'empty';
}

export const expoRecordingFileStore = createExpoRecordingFileStore();

async function loadExpoFileSystem(): Promise<{ File: LocalFileConstructor }> {
  return import('expo-file-system');
}
