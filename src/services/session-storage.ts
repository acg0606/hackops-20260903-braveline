import { File, Paths } from 'expo-file-system';
import { Platform } from 'react-native';

import {
  DEFAULT_SESSION_STORAGE_KEY,
  decodeSessionSnapshot,
  encodeSessionSnapshot,
  type BraveLineSessionSnapshot,
} from './session-codec';

export interface KeyValueStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

export type SessionStorageResult<T> =
  | { ok: true; value: T }
  | {
      ok: false;
      reason: 'read-failed' | 'write-failed' | 'delete-failed' | 'invalid-data';
      userMessage: string;
    };

export interface BraveLineSessionStore {
  load(): Promise<SessionStorageResult<BraveLineSessionSnapshot | null>>;
  save(snapshot: BraveLineSessionSnapshot): Promise<SessionStorageResult<void>>;
  clear(): Promise<SessionStorageResult<void>>;
}

const SESSION_FILE_NAME = 'braveline-session-v1.json';

function createWebStorage(): KeyValueStorage {
  return {
    async getItem(key) {
      return globalThis.localStorage?.getItem(key) ?? null;
    },
    async setItem(key, value) {
      if (!globalThis.localStorage) throw new Error('WEB_STORAGE_UNAVAILABLE');
      globalThis.localStorage.setItem(key, value);
    },
    async removeItem(key) {
      globalThis.localStorage?.removeItem(key);
    },
  };
}

function createPrivateFileStorage(): KeyValueStorage {
  const sessionFile = new File(Paths.document, SESSION_FILE_NAME);

  return {
    async getItem() {
      return sessionFile.exists ? sessionFile.text() : null;
    },
    async setItem(_key, value) {
      if (!sessionFile.exists) {
        sessionFile.create({ intermediates: true });
      }
      sessionFile.write(value);
    },
    async removeItem() {
      if (sessionFile.exists) sessionFile.delete();
    },
  };
}

function createDefaultStorage(): KeyValueStorage {
  return Platform.OS === 'web' ? createWebStorage() : createPrivateFileStorage();
}

export function createBraveLineSessionStore(
  storage: KeyValueStorage = createDefaultStorage(),
  key = DEFAULT_SESSION_STORAGE_KEY,
): BraveLineSessionStore {
  return {
    async load() {
      try {
        const serialized = await storage.getItem(key);
        if (serialized === null) return { ok: true, value: null };

        const decoded = decodeSessionSnapshot(serialized);
        if (!decoded.ok) {
          return {
            ok: false,
            reason: 'invalid-data',
            userMessage:
              'The saved rehearsal could not be verified. It was left untouched.',
          };
        }
        return { ok: true, value: decoded.value };
      } catch {
        return {
          ok: false,
          reason: 'read-failed',
          userMessage: 'The local rehearsal could not be loaded.',
        };
      }
    },

    async save(snapshot) {
      try {
        await storage.setItem(key, encodeSessionSnapshot(snapshot));
        return { ok: true, value: undefined };
      } catch {
        return {
          ok: false,
          reason: 'write-failed',
          userMessage:
            'This rehearsal could not be saved locally. No cloud backup was attempted.',
        };
      }
    },

    async clear() {
      try {
        await storage.removeItem(key);
        return { ok: true, value: undefined };
      } catch {
        return {
          ok: false,
          reason: 'delete-failed',
          userMessage: 'The saved local rehearsal could not be removed.',
        };
      }
    },
  };
}

export const braveLineSessionStore = createBraveLineSessionStore();
