import { TestBed } from '@angular/core/testing';
import { provideOptimus } from '@openng/optimus-ui/config';
import { _warnOnce } from './dev-warnings';

describe('_warnOnce', () => {
  it('warns in the WJ message shape, once per code per application', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    TestBed.configureTestingModule({ providers: [provideOptimus({})] });

    TestBed.runInInjectionContext(() => {
      _warnOnce('WJ0190', 'wj-probe', 'it is broken', 'Fix it');
      _warnOnce('WJ0190', 'wj-probe', 'it is broken', 'Fix it');
      _warnOnce('WJ0191', 'wj-probe', 'other', 'Do that');
    });

    expect(warn).toHaveBeenCalledTimes(2);
    expect(warn).toHaveBeenNthCalledWith(
      1,
      'WJ0190: wj-probe: it is broken. Fix it. Find more at https://locvodever.github.io/weeljack-ng/errors/WJ0190',
    );
    expect(warn).toHaveBeenNthCalledWith(
      2,
      'WJ0191: wj-probe: other. Do that. Find more at https://locvodever.github.io/weeljack-ng/errors/WJ0191',
    );
  });
});
