import '@testing-library/jest-dom/vitest';

/**
 * jsdom's `localStorage` is a proxy-backed platform object with a named-property
 * setter, so `Object.defineProperty(localStorage, 'setItem', ...)` is routed to
 * that setter: it stores an ITEM under the key "setItem" and leaves the real
 * method untouched. `vi.spyOn(window.localStorage, 'setItem')` therefore reports
 * success while doing nothing, and a test cannot simulate the write failure
 * Safari private browsing produces — the exact case the storage fallback exists
 * for. Swapping in a plain object of the same shape lets spies attach normally.
 */
const localStorageBacking = new Map<string, string>();
const localStorageShim = {
  get length(): number {
    return localStorageBacking.size;
  },
  key(index: number): string | null {
    return Array.from(localStorageBacking.keys())[index] ?? null;
  },
  getItem(key: string): string | null {
    const k = String(key);
    return localStorageBacking.has(k) ? (localStorageBacking.get(k) as string) : null;
  },
  setItem(key: string, value: string): void {
    localStorageBacking.set(String(key), String(value));
  },
  removeItem(key: string): void {
    localStorageBacking.delete(String(key));
  },
  clear(): void {
    localStorageBacking.clear();
  },
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageShim as unknown as Storage,
  configurable: true,
  writable: true,
});

// jsdom does not implement matchMedia; Motion and useReducedMotion both need it.
if (!window.matchMedia) {
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
}
