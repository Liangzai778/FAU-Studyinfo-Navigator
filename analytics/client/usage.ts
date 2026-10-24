/**
 * Optional client for the self-hosted counter in `../worker`.
 *
 * This file is intentionally outside `src/`: the public site keeps its
 * "no analytics, no background requests" promise until the maintainer decides
 * to enable measurement. To enable it, copy this file to
 * `src/analytics/usage.ts`, set `VITE_ANALYTICS_URL`, update the CSP and the
 * legal notice, and adjust the tests described in `../README.md`.
 *
 * No cookie, no visitor ID, no IP is sent by this code. It sends a path or a
 * fixed event name and nothing else.
 */

const endpoint = import.meta.env.VITE_ANALYTICS_URL as string | undefined;

function send(payload: { path?: string; event?: string }): void {
  if (!endpoint) return;
  const url = `${endpoint.replace(/\/+$/, '')}/collect`;
  const body = JSON.stringify(payload);

  try {
    if (typeof navigator.sendBeacon === 'function') {
      const blob = new Blob([body], { type: 'text/plain;charset=UTF-8' });
      if (navigator.sendBeacon(url, blob)) return;
    }
  } catch {
    // Fall through to fetch; a failed measurement must never break the app.
  }

  void fetch(url, {
    method: 'POST',
    body,
    headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
    credentials: 'omit',
    keepalive: true,
  }).catch(() => {
    // Ignore network errors: the app is local-first.
  });
}

export function trackPageView(path: string): void {
  send({ path });
}

/**
 * Only use the names listed in ../README.md so the dashboard stays readable.
 * Never pass user-entered text, course names, PO ids or anything personal.
 */
export function trackEvent(event: string): void {
  send({ event });
}
