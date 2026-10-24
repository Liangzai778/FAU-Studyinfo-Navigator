export type LocalStorageStatus = {
  supported: boolean;
  persisted: boolean;
  usage: number | null;
  quota: number | null;
};

const UNSUPPORTED: LocalStorageStatus = {
  supported: false,
  persisted: false,
  usage: null,
  quota: null,
};

/**
 * Whether the browser has granted "persistent" storage.
 *
 * IndexedDB is evictable by default: under storage pressure a browser may drop
 * the whole origin, which is how a saved plan "just disappears". Calling
 * `navigator.storage.persist()` asks the browser to keep this origin, and the
 * settings page shows the answer instead of promising something that was never
 * granted.
 */
export async function readLocalStorageStatus(): Promise<LocalStorageStatus> {
  if (typeof navigator === 'undefined' || !navigator.storage) return UNSUPPORTED;
  try {
    const persisted = await navigator.storage.persisted?.() ?? false;
    const estimate = await navigator.storage.estimate?.();
    return {
      supported: true,
      persisted,
      usage: estimate?.usage ?? null,
      quota: estimate?.quota ?? null,
    };
  } catch {
    return { ...UNSUPPORTED, supported: true };
  }
}

export async function requestPersistentLocalStorage(): Promise<boolean> {
  if (typeof navigator === 'undefined' || !navigator.storage?.persist) return false;
  try {
    return await navigator.storage.persist();
  } catch {
    return false;
  }
}

export function formatBytes(bytes: number | null): string {
  if (bytes === null || !Number.isFinite(bytes)) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
