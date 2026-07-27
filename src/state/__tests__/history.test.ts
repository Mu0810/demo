import { describe, it, expect, beforeEach } from 'vitest';
import {
  parsePath,
  viewToPath,
  pushView,
  replaceView,
  onPopState,
  type View,
} from '../history';

describe('parsePath', () => {
  it('parses the landing page', () => {
    expect(parsePath('/')).toEqual({ name: 'landing' });
  });

  it('parses a suite path', () => {
    expect(parsePath('/suites/aurelia')).toEqual({ name: 'suite', suiteId: 'aurelia' });
  });

  it('parses a reserve path', () => {
    expect(parsePath('/suites/aurelia/reserve')).toEqual({
      name: 'reserve',
      suiteId: 'aurelia',
    });
  });

  it('parses a confirmation path and upper-cases the code', () => {
    expect(parsePath('/reservation/mr-abc234')).toEqual({
      name: 'confirmation',
      code: 'MR-ABC234',
    });
  });

  it('falls back to landing for unknown paths', () => {
    expect(parsePath('/nonsense/deep/path')).toEqual({ name: 'landing' });
    expect(parsePath('/suites')).toEqual({ name: 'landing' });
    expect(parsePath('')).toEqual({ name: 'landing' });
  });

  it('tolerates a trailing slash', () => {
    expect(parsePath('/suites/aurelia/')).toEqual({ name: 'suite', suiteId: 'aurelia' });
  });
});

describe('viewToPath', () => {
  it('round-trips every view shape', () => {
    const views = [
      { name: 'landing' },
      { name: 'suite', suiteId: 'aurelia' },
      { name: 'reserve', suiteId: 'celeste' },
      { name: 'confirmation', code: 'MR-ABC234' },
    ] as const;

    for (const v of views) {
      expect(parsePath(viewToPath(v))).toEqual(v);
    }
  });

  it('maps landing to exactly the root path', () => {
    // The round-trip test cannot pin this: any unrecognised path also parses
    // back to landing, so '/home' would round-trip just as happily.
    expect(viewToPath({ name: 'landing' })).toBe('/');
  });

  it('only treats a literal /reserve segment as the reserve view', () => {
    expect(parsePath('/suites/aurelia/anything-else')).toEqual({ name: 'landing' });
    expect(parsePath('/suites/aurelia/reserve')).toEqual({
      name: 'reserve',
      suiteId: 'aurelia',
    });
  });
});

describe('browser history integration', () => {
  beforeEach(() => {
    window.history.replaceState({}, '', '/');
  });

  it('pushView adds a history entry and changes the path', () => {
    const before = window.history.length;
    pushView({ name: 'suite', suiteId: 'aurelia' });

    expect(window.location.pathname).toBe('/suites/aurelia');
    expect(window.history.length).toBeGreaterThan(before);
  });

  it('replaceView changes the path without adding an entry', () => {
    const before = window.history.length;
    replaceView({ name: 'suite', suiteId: 'celeste' });

    expect(window.location.pathname).toBe('/suites/celeste');
    expect(window.history.length).toBe(before);
  });

  it('onPopState reports the view parsed from the current path', () => {
    const seen: View[] = [];
    const unsubscribe = onPopState((v) => seen.push(v));

    window.history.replaceState({}, '', '/suites/meridian');
    window.dispatchEvent(new PopStateEvent('popstate'));

    expect(seen).toEqual([{ name: 'suite', suiteId: 'meridian' }]);
    unsubscribe();
  });

  it('onPopState stops reporting after unsubscribe', () => {
    const seen: View[] = [];
    const unsubscribe = onPopState((v) => seen.push(v));
    unsubscribe();

    window.history.replaceState({}, '', '/suites/aurelia');
    window.dispatchEvent(new PopStateEvent('popstate'));

    expect(seen).toEqual([]);
  });

  it('parses the pathname only, never the full href', () => {
    // Reading location.href here would split the origin into segments and every
    // back/forward would land on the landing view.
    window.history.replaceState({}, '', '/reservation/mr-abc234');
    const seen: View[] = [];
    const unsubscribe = onPopState((v) => seen.push(v));
    window.dispatchEvent(new PopStateEvent('popstate'));
    unsubscribe();

    expect(seen).toEqual([{ name: 'confirmation', code: 'MR-ABC234' }]);
  });
});
