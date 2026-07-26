import { describe, it, expect } from 'vitest';
import { parsePath, viewToPath } from '../history';

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
});
