export type SyncArea = 'planner' | 'calendar' | 'profile' | 'exams';

const CHANNEL_NAME = 'fau-study-navigator.sync';
const tabId = `${Date.now()}-${Math.random().toString(16).slice(2)}`;

type SyncMessage = {
  area: SyncArea;
  source: string;
};

let channel: BroadcastChannel | null = null;

function getChannel(): BroadcastChannel | null {
  if (typeof window === 'undefined' || typeof BroadcastChannel === 'undefined') return null;
  if (!channel) {
    try {
      channel = new BroadcastChannel(CHANNEL_NAME);
    } catch {
      return null;
    }
  }
  return channel;
}

/**
 * Tells other tabs that this tab wrote something.
 *
 * Tabs no longer rewrite the whole store, so two tabs adding different courses
 * both survive on disk. The broadcast is what makes the other tab *show* the
 * new row without a manual reload.
 */
export function broadcastSync(area: SyncArea): void {
  const current = getChannel();
  if (!current) return;
  try {
    current.postMessage({ area, source: tabId } satisfies SyncMessage);
  } catch {
    // A closed channel must not break a save that already succeeded.
  }
}

/** Subscribes to writes made by other tabs. Returns an unsubscribe function. */
export function subscribeSync(handler: (area: SyncArea) => void): () => void {
  const current = getChannel();
  if (!current) return () => {};
  const listener = (event: MessageEvent<SyncMessage>) => {
    const message = event.data;
    if (!message || message.source === tabId) return;
    handler(message.area);
  };
  current.addEventListener('message', listener);
  return () => current.removeEventListener('message', listener);
}
