/**
 * Small helpers to keep UI selections in the query string so a view can be
 * shared as a link (e.g. ?endpoint=post-api-v1-ted). Browser-only: callers
 * render inside <BrowserOnly>, so reading on the first render is safe.
 */

/** value of `key` in the current URL, or null */
export function readQuery(key: string): string | null {
  if (typeof window === 'undefined') return null;
  return new URLSearchParams(window.location.search).get(key);
}

/** `key` from the URL when `isValid` accepts it, otherwise `fallback` */
export function readQueryOr<T extends string>(
  key: string,
  isValid: (v: string) => boolean,
  fallback: T,
): T {
  const v = readQuery(key);
  return v !== null && isValid(v) ? (v as T) : fallback;
}

/**
 * sets/removes query params without adding a history entry. null (or a
 * value equal to its default, decided by the caller) removes the key, so
 * the default view keeps a clean URL. Other params and the hash are kept.
 */
export function writeQuery(updates: Record<string, string | null>) {
  if (typeof window === 'undefined') return;
  const url = new URL(window.location.href);
  Object.entries(updates).forEach(([k, v]) => {
    if (v === null) url.searchParams.delete(k);
    else url.searchParams.set(k, v);
  });
  if (url.href === window.location.href) return;
  window.history.replaceState(window.history.state, '', url.href);
}
