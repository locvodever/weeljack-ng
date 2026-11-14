import { Component, type EnvironmentProviders, type Provider } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import aura from '@openng/optimus-ui-themes/aura';
import { provideOptimus } from '@openng/optimus-ui/config';
import { checkWeeljackSetup } from './dev-warnings';
import { provideWeeljack } from './public-api';

/** Stands in for the first `wj-*` component: it runs the setup check the way a wrapper will. */
@Component({ selector: 'wj-probe', template: 'probe' })
class Probe {
  constructor() {
    checkWeeljackSetup('wj-probe');
  }
}

@Component({ selector: 'wj-probe-host', imports: [Probe], template: '<wj-probe /><wj-probe />' })
class ProbeHost {}

async function render(providers: (Provider | EnvironmentProviders)[]): Promise<void> {
  TestBed.configureTestingModule({ providers });
  const fixture = TestBed.createComponent(ProbeHost);
  await fixture.whenStable();
}

describe('dev-mode setup warnings', () => {
  afterEach(() => {
    document.head.querySelectorAll('style[data-optimus-style-id]').forEach((style) => {
      style.remove();
    });
  });

  it('warns WJ0001 once when provideWeeljack is missing', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    await render([]);

    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn).toHaveBeenCalledWith(
      'WJ0001: wj-probe: provideWeeljack() is missing from the application providers. ' +
        'Add provideWeeljack() to your application config. ' +
        'Find more at https://locvodever.github.io/weeljack-ng/errors/WJ0001',
    );
  });

  it('warns WJ0002 when a second provideOptimus replaced the wj prefix', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    await render([
      provideWeeljack(),
      provideOptimus({ theme: { preset: aura, options: { prefix: 'p' } } }),
    ]);

    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn).toHaveBeenCalledWith(
      "WJ0002: wj-probe: the Optimus theme lost the 'wj' prefix after bootstrap because a second " +
        'provideOptimus() ran. Remove the provideOptimus() call and configure the theme through ' +
        'provideWeeljack() only. Find more at https://locvodever.github.io/weeljack-ng/errors/WJ0002',
    );
  });

  it('stays silent when provideWeeljack is the only configuration', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    await render([provideWeeljack({ darkMode: 'class' })]);

    expect(warn).not.toHaveBeenCalled();
  });
});
