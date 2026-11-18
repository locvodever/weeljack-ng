import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideOptimus } from '@openng/optimus-ui/config';
import { _checkNotInField } from './in-field-label';
import { _WJ_FIELD_CONTEXT, type _WjFieldContext } from './field-context';

const FIELD: _WjFieldContext = {
  labelId: 'label',
  hintId: signal(undefined),
  errorId: signal(undefined),
  invalid: signal(false),
  register: () => () => undefined,
};

const MESSAGE =
  'WJ0100: wj-floatlabel: it sits inside a wj-field, so its control gets two labels. ' +
  'Use the wj-field label or the in-field label, not both. ' +
  'Find more at https://locvodever.github.io/weeljack-ng/errors/WJ0100';

describe('_checkNotInField', () => {
  function configure(withField: boolean): void {
    TestBed.configureTestingModule({
      providers: [
        provideOptimus({}),
        ...(withField ? [{ provide: _WJ_FIELD_CONTEXT, useValue: FIELD }] : []),
      ],
    });
  }

  it('warns WJ0100 in the 21 Q8 shape when it sits inside a field', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    configure(true);

    TestBed.runInInjectionContext(() => {
      _checkNotInField('wj-floatlabel');
    });

    expect(warn).toHaveBeenCalledExactlyOnceWith(MESSAGE);
  });

  it('is silent outside a field', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    configure(false);

    TestBed.runInInjectionContext(() => {
      _checkNotInField('wj-floatlabel');
    });

    expect(warn).not.toHaveBeenCalled();
  });

  it('warns once per application, however many labels sit in a field', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    configure(true);

    TestBed.runInInjectionContext(() => {
      _checkNotInField('wj-floatlabel');
      _checkNotInField('wj-floatlabel');
      _checkNotInField('wj-iftalabel');
    });

    expect(warn).toHaveBeenCalledTimes(1);
  });

  it('never throws and warns nothing in production mode', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    vi.stubGlobal('ngDevMode', false);
    configure(true);

    expect(() => {
      TestBed.runInInjectionContext(() => {
        _checkNotInField('wj-floatlabel');
      });
    }).not.toThrow();

    expect(warn).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });
});
