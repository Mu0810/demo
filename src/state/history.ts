export type View =
  | { name: 'landing' }
  | { name: 'suite'; suiteId: string }
  | { name: 'reserve'; suiteId: string }
  | { name: 'confirmation'; code: string };

const LANDING: View = { name: 'landing' };

/**
 * Never throws. A hand-edited or stale URL must degrade to the landing page
 * rather than break the app, since there is no router to catch it.
 */
export function parsePath(path: string): View {
  const parts = path.split('/').filter(Boolean);

  if (parts.length === 0) return LANDING;

  if (parts[0] === 'suites' && parts.length === 2) {
    return { name: 'suite', suiteId: parts[1] };
  }
  if (parts[0] === 'suites' && parts.length === 3 && parts[2] === 'reserve') {
    return { name: 'reserve', suiteId: parts[1] };
  }
  if (parts[0] === 'reservation' && parts.length === 2) {
    return { name: 'confirmation', code: parts[1].toUpperCase() };
  }
  return LANDING;
}

export function viewToPath(view: View): string {
  switch (view.name) {
    case 'landing':
      return '/';
    case 'suite':
      return `/suites/${view.suiteId}`;
    case 'reserve':
      return `/suites/${view.suiteId}/reserve`;
    case 'confirmation':
      return `/reservation/${view.code}`;
  }
}

export function pushView(view: View): void {
  window.history.pushState({ view }, '', viewToPath(view));
}

export function replaceView(view: View): void {
  window.history.replaceState({ view }, '', viewToPath(view));
}

export function onPopState(cb: (view: View) => void): () => void {
  const handler = () => cb(parsePath(window.location.pathname));
  window.addEventListener('popstate', handler);
  return () => window.removeEventListener('popstate', handler);
}
