import { describe, expect, it, vi } from 'vitest';

import {
  createExpoRecordingFileStore,
  inspectExpoAudioRecordingFile,
  isOwnedExpoAudioRecordingUri,
} from '../recording-file-store';

describe('recording file store', () => {
  it('recognizes only Expo Audio-owned recording paths', () => {
    expect(
      isOwnedExpoAudioRecordingUri(
        'file:///data/user/0/app/cache/Audio/recording-0b4f6c24-ef10-4c19-a20d-bc1234abcd99.m4a',
      ),
    ).toBe(true);
    expect(
      isOwnedExpoAudioRecordingUri(
        'file:///var/mobile/app/Documents/ExpoAudio/recording-0b4f6c24-ef10-4c19-a20d-bc1234abcd99.m4a',
      ),
    ).toBe(true);
    expect(isOwnedExpoAudioRecordingUri('file:///documents/important.m4a')).toBe(
      false,
    );
    expect(
      isOwnedExpoAudioRecordingUri(
        'https://example.com/Audio/recording-0b4f6c24-ef10-4c19-a20d-bc1234abcd99.m4a',
      ),
    ).toBe(false);
  });

  it('deletes an owned file and verifies that it is gone', async () => {
    const remove = vi.fn();
    let exists = true;
    const store = createExpoRecordingFileStore(async () => ({
      File: class {
        get exists() {
          return exists;
        }

        delete() {
          remove();
          exists = false;
        }
      },
    }));

    const result = await store.removeLocalFile(
      'file:///cache/Audio/recording-aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee.m4a',
    );

    expect(result).toBe('deleted');
    expect(remove).toHaveBeenCalledOnce();
  });

  it('does not invoke filesystem code for an unrelated file', async () => {
    const loader = vi.fn();
    const store = createExpoRecordingFileStore(loader);

    expect(await store.removeLocalFile('file:///documents/photo.jpg')).toBe(
      'unsupported',
    );
    expect(loader).not.toHaveBeenCalled();
  });

  it('accepts only an existing non-empty Expo Audio file as a valid take', async () => {
    const uri =
      'file:///data/user/0/app/files/Audio/recording-aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee.m4a';

    expect(
      await inspectExpoAudioRecordingFile(uri, async () => ({
        File: class {
          exists = true;
          size = 2_048;
          delete() {}
        },
      })),
    ).toBe('valid');

    expect(
      await inspectExpoAudioRecordingFile(uri, async () => ({
        File: class {
          exists = true;
          size = 0;
          delete() {}
        },
      })),
    ).toBe('empty');

    expect(
      await inspectExpoAudioRecordingFile(uri, async () => ({
        File: class {
          exists = false;
          size = 0;
          delete() {}
        },
      })),
    ).toBe('missing');
  });
});
