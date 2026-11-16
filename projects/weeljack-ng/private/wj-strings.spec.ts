import { TestBed } from '@angular/core/testing';
import { Optimus, provideOptimus } from '@openng/optimus-ui/config';
import { _WJ_EN } from './translation-en';
import { _wjStrings } from './wj-strings';

/**
 * A translation the way `provideWeeljack` builds it: the English default with `wj` replaced.
 * Optimus's `Translation` type does not know the group, and a variable is not an excess-property
 * check, so it passes where a literal would not.
 */
const translation = (wj?: Partial<typeof _WJ_EN.wj>) => ({ ..._WJ_EN, wj });

describe('_wjStrings', () => {
  it('reads the English default when the group carries no override', () => {
    TestBed.configureTestingModule({ providers: [provideOptimus({ translation: _WJ_EN })] });

    const wj = TestBed.runInInjectionContext(_wjStrings);

    expect(wj('showPassword')).toBe('Show Password');
    expect(wj('hidePassword')).toBe('Hide Password');
  });

  it('reads an override of the group, key by key', () => {
    const override = translation({ ..._WJ_EN.wj, showPassword: 'Hiện mật khẩu' });
    TestBed.configureTestingModule({ providers: [provideOptimus({ translation: override })] });

    const wj = TestBed.runInInjectionContext(_wjStrings);

    expect(wj('showPassword')).toBe('Hiện mật khẩu');
    expect(wj('hidePassword')).toBe('Hide Password');
  });

  it('falls back to English for a key the group lacks, and when there is no group at all', () => {
    const partial = translation({ showPassword: 'Show it' });
    TestBed.configureTestingModule({ providers: [provideOptimus({ translation: partial })] });

    const some = TestBed.runInInjectionContext(_wjStrings);
    expect(some('showPassword')).toBe('Show it');
    expect(some('hidePassword')).toBe('Hide Password');

    TestBed.inject(Optimus).setTranslation(translation());
    const none = TestBed.runInInjectionContext(_wjStrings);
    expect(none('showPassword')).toBe('Show Password');
  });

  it('follows a language switch for the next read', () => {
    TestBed.configureTestingModule({ providers: [provideOptimus({ translation: _WJ_EN })] });
    expect(TestBed.runInInjectionContext(_wjStrings)('hidePassword')).toBe('Hide Password');

    TestBed.inject(Optimus).setTranslation(translation({ hidePassword: 'Ẩn mật khẩu' }));

    expect(TestBed.runInInjectionContext(_wjStrings)('hidePassword')).toBe('Ẩn mật khẩu');
  });
});
