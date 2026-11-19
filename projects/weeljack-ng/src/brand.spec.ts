import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type { ColorScale } from '@openng/optimus-ui-themes';
import type { MockInstance } from 'vitest';
import { WjButton } from 'weeljack-ng/button';
import { provideWeeljack, type WjColorScale, type WjThemeOptions } from './public-api';

@Component({
  selector: 'wj-brand-host',
  imports: [WjButton],
  template: '<wj-button label="Save" />',
})
class BrandHost {}

/** An app's primary and light surface, as fixtures. */
const APP_BRAND: WjThemeOptions = {
  primary: {
    50: '#fff3ef',
    100: '#ffd9c7',
    200: '#ffb59f',
    300: '#ff8c6e',
    400: '#f06030',
    500: '#c2410c',
    600: '#a53409',
    700: '#862a07',
    800: '#6a2005',
    900: '#4d1803',
    950: '#310f01',
  },
  surface: {
    0: '#ffffff',
    50: '#f6f4f1',
    100: '#ede9e4',
    200: '#e4dfd9',
    300: '#d0c9c2',
    400: '#b8afa8',
    500: '#9e948c',
    600: '#6b625c',
    700: '#4a3f3a',
    800: '#302622',
    900: '#1f1a17',
    950: '#0f0c0a',
  },
  darkMode: 'off',
};

async function bootstrap(options?: WjThemeOptions): Promise<HTMLElement> {
  TestBed.configureTestingModule({ providers: [provideWeeljack(options)] });
  const fixture = TestBed.createComponent(BrandHost);
  await fixture.whenStable();
  return fixture.nativeElement as HTMLElement;
}

function warnings(spy: MockInstance<Console['warn']>): string[] {
  return spy.mock.calls.map((call) => String(call[0]));
}

describe('WjColorScale', () => {
  it('is assignable to Optimus ColorScale in its object form', () => {
    const scale: Extract<WjColorScale, object> = {
      50: '#fff3ef',
      100: '#ffd9c7',
      200: '#ffb59f',
      300: '#ff8c6e',
      400: '#f06030',
      500: '#c2410c',
      600: '#a53409',
      700: '#862a07',
      800: '#6a2005',
      900: '#4d1803',
      950: '#310f01',
    };
    const optimus: ColorScale = scale;
    expectTypeOf<Extract<WjColorScale, object>>().toExtend<ColorScale>();

    expect(optimus[500]).toBe('#c2410c');
  });
});

describe('WJ0010 brand contrast warning', () => {
  afterEach(() => {
    document.body.replaceChildren();
    document.head.querySelectorAll('style[data-optimus-style-id]').forEach((style) => {
      style.remove();
    });
    vi.unstubAllGlobals();
  });

  it("names exactly the two surface pairs on an app's values", async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    await bootstrap(APP_BRAND);

    const messages = warnings(warn).filter((message) => message.startsWith('WJ0010'));
    expect(messages).toHaveLength(1);
    const [message = ''] = messages;
    expect(message).toContain('--wj-form-field-border-color (light) is 2.97:1, needs 3:1');
    expect(message).toContain('--wj-form-field-placeholder-color (light) is 2.97:1, needs 4.5:1');
    expect(message).not.toContain('--wj-button-primary-color');
    expect(message).not.toContain('--wj-focus-ring-color');
    expect(message).not.toContain('(dark)');
    expect(message).toContain(
      'Find more at https://locvodever.github.io/weeljack-ng/errors/WJ0010',
    );
  });

  it('names primary text and the focus ring for a pale primary', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    await bootstrap({ primary: '#10b981' });

    const [message = ''] = warnings(warn).filter((m) => m.startsWith('WJ0010'));
    expect(message).toContain('--wj-button-primary-color (light) is 2.54:1, needs 4.5:1');
    expect(message).toContain('--wj-focus-ring-color (light) is 2.54:1, needs 3:1');
    expect(message).not.toContain('--wj-form-field-border-color');
  });

  it('evaluates the dark pairs when dark mode is on, and names the scheme', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    await bootstrap({ primary: '#1e3a8a', darkMode: 'class' });

    const [message = ''] = warnings(warn).filter((m) => m.startsWith('WJ0010'));
    expect(message).toContain('--wj-button-primary-color (dark) is');
    expect(message).toContain('--wj-focus-ring-color (dark) is');
    expect(message).not.toContain('(light)');
  });

  it('evaluates both schemes under dark mode: a passing dark side leaves only light named', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    await bootstrap({ primary: '#10b981', darkMode: 'system' });

    const [message = ''] = warnings(warn).filter((m) => m.startsWith('WJ0010'));
    expect(message).toContain('(light)');
    expect(message).not.toContain('(dark)');
  });

  it('stays silent when both schemes pass', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    await bootstrap({ primary: '#c2410c', darkMode: 'class' });

    expect(warnings(warn).filter((m) => m.startsWith('WJ0010'))).toEqual([]);
  });

  it('stays silent with no brand', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    await bootstrap({ darkMode: 'class' });

    expect(warnings(warn).filter((m) => m.startsWith('WJ0010'))).toEqual([]);
  });

  it('still bootstraps and renders a wj-button when the brand fails', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    const root = await bootstrap({ primary: '#10b981' });

    expect(root.querySelector('button')?.textContent).toContain('Save');
  });

  it('does nothing outside dev mode', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    vi.stubGlobal('ngDevMode', false);

    await bootstrap(APP_BRAND);

    expect(warnings(warn).filter((m) => m.startsWith('WJ0010'))).toEqual([]);
  });
});

describe('WJ0200 brand colour validation', () => {
  afterEach(() => {
    document.body.replaceChildren();
    document.head.querySelectorAll('style[data-optimus-style-id]').forEach((style) => {
      style.remove();
    });
    vi.unstubAllGlobals();
  });

  const primaryVariable = () =>
    getComputedStyle(document.documentElement).getPropertyValue('--wj-primary-500');

  it("ignores primary 'red', warns once, and keeps the noir primary", async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    await bootstrap({});
    const noir = primaryVariable();
    TestBed.resetTestingModule();
    document.head.querySelectorAll('style[data-optimus-style-id]').forEach((style) => {
      style.remove();
    });

    await bootstrap({ primary: 'red' });

    const messages = warnings(warn).filter((m) => m.startsWith('WJ0200'));
    expect(messages).toHaveLength(1);
    expect(messages[0]).toContain("provideWeeljack: not a colour: primary 'red'");
    expect(messages[0]).toContain(
      'Find more at https://locvodever.github.io/weeljack-ng/errors/WJ0200',
    );
    expect(primaryVariable()).toBe(noir);
  });

  it.each(['#abc', '#C2410C', '{indigo}'])('accepts %s', async (primary) => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    await bootstrap({ primary });

    expect(warnings(warn).filter((m) => m.startsWith('WJ0200'))).toEqual([]);
  });

  it('names surface.light only and keeps the valid dark scale', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    await bootstrap({ surface: { light: 'nope', dark: '#1f1a17' }, darkMode: 'class' });

    const messages = warnings(warn).filter((m) => m.startsWith('WJ0200'));
    expect(messages).toHaveLength(1);
    expect(messages[0]).toContain("not a colour: surface.light 'nope'.");
    expect(messages[0]).not.toContain('surface.dark');
    const css = document.head.textContent;
    expect(css).toContain('#1f1a17');
  });

  it('does not warn outside dev mode, and the fallback still applies', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    await bootstrap({});
    const noir = primaryVariable();
    TestBed.resetTestingModule();
    document.head.querySelectorAll('style[data-optimus-style-id]').forEach((style) => {
      style.remove();
    });
    vi.stubGlobal('ngDevMode', false);

    await bootstrap({ primary: 'red' });

    expect(warnings(warn).filter((m) => m.startsWith('WJ0200'))).toEqual([]);
    expect(primaryVariable()).toBe(noir);
  });
});
