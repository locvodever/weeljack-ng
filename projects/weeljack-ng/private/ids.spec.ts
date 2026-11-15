import { TestBed } from '@angular/core/testing';
import { _wjId } from './ids';

describe('_wjId', () => {
  it('returns wj-<prefix>-<n>, unique per call within an application', () => {
    const ids = TestBed.runInInjectionContext(() => [
      _wjId('field'),
      _wjId('field'),
      _wjId('select'),
    ]);

    expect(ids).toEqual(['wj-field-0', 'wj-field-1', 'wj-select-2']);
  });

  it('starts again in a new application', () => {
    TestBed.resetTestingModule();

    expect(TestBed.runInInjectionContext(() => _wjId('field'))).toBe('wj-field-0');
  });
});
