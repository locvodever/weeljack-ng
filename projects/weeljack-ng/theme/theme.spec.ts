import { Component, PLATFORM_ID, signal, type Provider } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { ButtonModule } from '@openng/optimus-ui/button';
import { Checkbox } from '@openng/optimus-ui/checkbox';
import { InputTextModule } from '@openng/optimus-ui/inputtext';
import { Tag } from '@openng/optimus-ui/tag';
import { ToggleSwitch } from '@openng/optimus-ui/toggleswitch';
import type { MockInstance } from 'vitest';
import { provideWeeljack, type WjThemeOptions } from 'weeljack-ng';
import { WjTheme } from './public-api';

/** Real Optimus parts whose tokens the Noir layer and the always-on layer touch. */
@Component({
  selector: 'wj-theme-host',
  imports: [ButtonModule, InputTextModule, Tag, ToggleSwitch, Checkbox],
  template: `
    <p-button label="Default" />
    <input pInputText aria-label="Name" value="Loc" />
    @if (showTag()) {
      <p-tag value="New" />
    }
    <p-toggleswitch ariaLabel="Notifications" />
    <p-checkbox [binary]="true" ariaLabel="Agree" />
  `,
})
class ThemeHost {
  readonly showTag = signal(true);
}

@Component({ selector: 'wj-empty-host', template: '' })
class EmptyHost {}

/** An app's brand scales, as in provide-weeljack.spec.ts. */
const APP_PRIMARY = {
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
const APP_SURFACE = {
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
};
const STONE_DARK = {
  50: '#fafaf9',
  100: '#f5f5f4',
  200: '#e7e5e4',
  300: '#d6d3d1',
  400: '#a8a29e',
  500: '#78716c',
  600: '#57534e',
  700: '#44403c',
  800: '#292524',
  900: '#1c1917',
  950: '#0c0a09',
};
const THIRD_SURFACE = { light: APP_SURFACE, dark: STONE_DARK };

const ROOT = document.documentElement;
const SHEETS = 'style[data-optimus-style-id]';

interface Snapshot {
  light: Record<string, string>;
  dark: Record<string, string>;
}

/** What `render` mounts: the host, whether it shows the tag, and extra providers. */
interface RenderOptions {
  extra?: Provider[];
  tag?: boolean;
  empty?: boolean;
}

async function render(
  options: WjThemeOptions = {},
  { extra = [], tag = true, empty = false }: RenderOptions = {},
): Promise<ComponentFixture<ThemeHost | EmptyHost>> {
  TestBed.configureTestingModule({
    providers: [provideWeeljack({ darkMode: 'class', ...options }), ...extra],
  });
  const fixture: ComponentFixture<ThemeHost | EmptyHost> = empty
    ? TestBed.createComponent(EmptyHost)
    : TestBed.createComponent(ThemeHost);
  if (fixture.componentInstance instanceof ThemeHost) {
    fixture.componentInstance.showTag.set(tag);
  }
  document.body.appendChild(fixture.nativeElement as HTMLElement);
  await fixture.whenStable();
  return fixture;
}

/** Drops the page and the Optimus sheets, so one bootstrap cannot see the previous one. */
function clearPage(): void {
  ROOT.classList.remove('wj-dark');
  document.body.replaceChildren();
  document.head.querySelectorAll(SHEETS).forEach((style) => {
    style.remove();
  });
}

function resetApp(): void {
  TestBed.resetTestingModule();
  clearPage();
}

/** Every `--wj-*` name declared in a rule, walking `@layer` and `@media`. */
function declaredNames(list: CSSRuleList, names: Set<string>): void {
  for (const rule of Array.from(list)) {
    if (rule instanceof CSSStyleRule) {
      for (const name of Array.from(rule.style)) {
        if (name.startsWith('--wj-')) {
          names.add(name);
        }
      }
    }
    if (rule instanceof CSSGroupingRule) {
      declaredNames(rule.cssRules, names);
    }
  }
}

function resolved(names: readonly string[]): Record<string, string> {
  const style = getComputedStyle(ROOT);
  return Object.fromEntries(names.map((name) => [name, style.getPropertyValue(name).trim()]));
}

/** Every `--wj-*` variable the Optimus sheets declare, as `<html>` resolves it, light and dark. */
function snapshot(): Snapshot {
  const names = new Set<string>();
  document.head.querySelectorAll<HTMLStyleElement>(SHEETS).forEach((style) => {
    if (style.sheet) {
      declaredNames(style.sheet.cssRules, names);
    }
  });
  const sorted = Array.from(names).sort();
  const light = resolved(sorted);
  ROOT.classList.add('wj-dark');
  const dark = resolved(sorted);
  ROOT.classList.remove('wj-dark');
  return { light, dark };
}

/** The names whose value differs, or that only one side declares. */
function differences(a: Record<string, string>, b: Record<string, string>): string[] {
  return Array.from(new Set([...Object.keys(a), ...Object.keys(b)]))
    .filter((name) => a[name] !== b[name])
    .map((name) => `${name}: ${a[name] ?? '(absent)'} vs ${b[name] ?? '(absent)'}`);
}

function expectEqual(actual: Snapshot, expected: Snapshot): void {
  expect(Object.keys(actual.light).length).toBeGreaterThan(100);
  expect(differences(actual.light, expected.light)).toEqual([]);
  expect(differences(actual.dark, expected.dark)).toEqual([]);
}

/** A bootstrap of `options`, mounted and read, then torn down. */
async function fresh(options: WjThemeOptions, mount: RenderOptions = {}): Promise<Snapshot> {
  await render(options, mount);
  const result = snapshot();
  resetApp();
  return result;
}

/** A bootstrap of `options`, then `act` on its `WjTheme`, read, then torn down. */
async function switched(
  options: WjThemeOptions,
  act: (theme: WjTheme) => void,
  mount: RenderOptions = {},
): Promise<Snapshot> {
  const fixture = await render(options, mount);
  act(TestBed.inject(WjTheme));
  await fixture.whenStable();
  const result = snapshot();
  resetApp();
  return result;
}

function calls(warn: { mock: { calls: unknown[][] } }, code: string): string[] {
  return warn.mock.calls
    .map((call) => String(call[0]))
    .filter((message) => message.startsWith(`${code}:`));
}

describe('WjTheme', () => {
  let warn: MockInstance<Console['warn']>;

  beforeEach(() => {
    warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    clearPage();
  });

  describe('equals a fresh bootstrap', () => {
    it('for a hex primary', async () => {
      const done = await switched({}, (theme) => {
        theme.setPrimary('#0f766e');
      });

      expect(done.light['--wj-primary-color']).toBe('#0f766e');
      expectEqual(done, await fresh({ primary: '#0f766e' }));
    });

    it('for palette names', async () => {
      const done = await switched({}, (theme) => {
        theme.setPrimary('{blue}');
        theme.setSurface('{slate}');
      });

      expect(done.light['--wj-primary-color']).not.toBe('#09090b');
      expectEqual(done, await fresh({ primary: '{blue}', surface: '{slate}' }));
    });

    it('for full scales and a surface per scheme', async () => {
      const done = await switched({}, (theme) => {
        theme.setPrimary(APP_PRIMARY);
        theme.setSurface(THIRD_SURFACE);
      });

      expect(done.light['--wj-surface-500']).toBe('#9e948c');
      expect(done.dark['--wj-surface-500']).toBe('#78716c');
      expectEqual(done, await fresh({ primary: APP_PRIMARY, surface: THIRD_SURFACE }));
    });
  });

  describe('reset', () => {
    it('returns a default bootstrap from a switched one', async () => {
      const done = await switched({}, (theme) => {
        theme.setPrimary(APP_PRIMARY);
        theme.setSurface(THIRD_SURFACE);
        theme.reset();
      });

      expect(done.light['--wj-primary-color']).toBe('#09090b');
      expectEqual(done, await fresh({}));
    });

    it('returns what provideWeeljack was given', async () => {
      const boot: WjThemeOptions = { primary: '#c2410c', surface: '{stone}' };
      const expected = await fresh(boot);

      expectEqual(
        await switched(boot, (theme) => {
          theme.setPrimary('{blue}');
          theme.setSurface('{slate}');
          theme.reset();
        }),
        expected,
      );
    });

    it('takes the bootstrap value for no argument', async () => {
      const boot: WjThemeOptions = { primary: '#c2410c', surface: '{stone}' };
      const expected = await fresh(boot);

      expectEqual(
        await switched(boot, (theme) => {
          theme.setPrimary('{blue}');
          theme.setSurface('{slate}');
          theme.setPrimary();
          theme.setSurface();
        }),
        expected,
      );
    });
  });

  it('keeps the layer styles', async () => {
    const fixture = await render();
    TestBed.inject(WjTheme).setPrimary('#0f766e');
    await fixture.whenStable();

    const global = document.head.querySelector<HTMLStyleElement>(
      'style[data-optimus-style-id="global-style"]',
    );
    const layers = Array.from(global?.sheet?.cssRules ?? []).filter(
      (rule): rule is CSSLayerBlockRule => rule instanceof CSSLayerBlockRule,
    );
    const lineHeight = layers
      .flatMap((layer) => Array.from(layer.cssRules))
      .find(
        (rule): rule is CSSStyleRule =>
          rule instanceof CSSStyleRule && rule.style.lineHeight === '1.5',
      );

    expect(layers.map((layer) => layer.name)).toEqual(['wj']);
    expect(lineHeight?.selectorText).toContain('.p-button');
  });

  it('writes the common sheets when no component is mounted', async () => {
    await render({}, { empty: true });
    TestBed.inject(WjTheme).setPrimary('#0f766e');

    expect(getComputedStyle(ROOT).getPropertyValue('--wj-primary-color').trim()).toBe('#0f766e');
  });

  describe('component token sheets', () => {
    it('drops the sheet of an unmounted component and writes it again on mount', async () => {
      const fixture = await render({}, { tag: true });
      const host = fixture.componentInstance as ThemeHost;
      const tagSheet = 'style[data-optimus-style-id="tag-variables"]';
      expect(document.head.querySelector(tagSheet)).not.toBeNull();

      host.showTag.set(false);
      fixture.detectChanges();
      TestBed.inject(WjTheme).setPrimary('#0f766e');
      await fixture.whenStable();

      expect(document.head.querySelector(tagSheet)).toBeNull();
      const without = snapshot();

      host.showTag.set(true);
      fixture.detectChanges();
      await fixture.whenStable();
      const remounted = snapshot();
      resetApp();

      expectEqual(without, await fresh({ primary: '#0f766e' }, { tag: false }));
      expectEqual(remounted, await fresh({ primary: '#0f766e' }, { tag: true }));
    });
  });

  describe('signals', () => {
    it('start at the bootstrap values, follow accepted calls and ignore rejected ones', async () => {
      await render({ primary: '#c2410c', surface: '{stone}' });
      const theme = TestBed.inject(WjTheme);

      expect(theme.primary()).toBe('#c2410c');
      expect(theme.surface()).toBe('{stone}');

      theme.setPrimary('{blue}');
      theme.setSurface(THIRD_SURFACE);
      expect(theme.primary()).toBe('{blue}');
      expect(theme.surface()).toBe(THIRD_SURFACE);

      theme.setPrimary('teal-ish');
      theme.setSurface('nope');
      expect(theme.primary()).toBe('{blue}');
      expect(theme.surface()).toBe(THIRD_SURFACE);

      theme.setPrimary();
      expect(theme.primary()).toBe('#c2410c');

      theme.setPrimary('{blue}');
      theme.reset();
      expect(theme.primary()).toBe('#c2410c');
      expect(theme.surface()).toBe('{stone}');
    });

    it('are undefined for a default bootstrap', async () => {
      await render();
      const theme = TestBed.inject(WjTheme);

      expect(theme.primary()).toBeUndefined();
      expect(theme.surface()).toBeUndefined();
    });
  });

  describe('invalid strings', () => {
    it('log WJ0200 once per distinct message and change nothing', async () => {
      const fixture = await render();
      const theme = TestBed.inject(WjTheme);
      const before = snapshot();

      theme.setPrimary('teal-ish');
      theme.setSurface('nope');
      theme.setSurface({ light: '#fff', dark: 'nope' });
      await fixture.whenStable();

      const first = calls(warn, 'WJ0200');
      expect(first).toHaveLength(3);
      expect(first[0]).toContain("WjTheme: not a colour: primary 'teal-ish'");
      expect(first[1]).toContain("surface.light 'nope', surface.dark 'nope'");
      expect(first[2]).toContain("not a colour: surface.dark 'nope'");
      expect(first[2]).not.toContain('surface.light');
      expectEqual(snapshot(), before);
      expect(theme.primary()).toBeUndefined();
      expect(theme.surface()).toBeUndefined();

      theme.setPrimary('teal-ish');
      expect(calls(warn, 'WJ0200')).toHaveLength(3);

      theme.setPrimary('other');
      expect(calls(warn, 'WJ0200')).toHaveLength(4);
    });

    it('are rejected without ngDevMode too', async () => {
      const fixture = await render();
      const theme = TestBed.inject(WjTheme);
      const before = snapshot();

      vi.stubGlobal('ngDevMode', false);
      try {
        theme.setPrimary('teal-ish');
        theme.setSurface('nope');
      } finally {
        vi.unstubAllGlobals();
      }
      await fixture.whenStable();

      expectEqual(snapshot(), before);
      expect(theme.primary()).toBeUndefined();
      expect(theme.surface()).toBeUndefined();
    });
  });

  describe('contrast', () => {
    it('applies a palette under AA and logs WJ0010 once per distinct palette', async () => {
      const done = await switched({}, (theme) => {
        theme.setPrimary('{indigo}');
      });
      const first = calls(warn, 'WJ0010');

      expect(first).toHaveLength(1);
      expect(first[0]).toContain('WjTheme: the brand colours fail WCAG AA contrast');
      expect(first[0]).toContain('--wj-button-primary-color (light) is 4.47:1');
      expectEqual(done, await fresh({ primary: '{indigo}' }));
    });

    it('warns again for another palette, and not for a repeat', async () => {
      await render();
      const theme = TestBed.inject(WjTheme);

      theme.setPrimary('{indigo}');
      expect(calls(warn, 'WJ0010')).toHaveLength(1);

      theme.setPrimary('{violet}');
      expect(calls(warn, 'WJ0010')).toHaveLength(2);

      theme.setPrimary('{indigo}');
      expect(calls(warn, 'WJ0010')).toHaveLength(2);
    });

    it('checks both schemes when dark mode is on and light only when it is off', async () => {
      // Near-black passes in light and fails in dark, where the scale's 400 is the primary.
      await render({ darkMode: 'class' });
      TestBed.inject(WjTheme).setPrimary('#1a1a1a');
      const both = calls(warn, 'WJ0010');
      resetApp();
      warn.mockClear();

      await render({ darkMode: 'off' });
      TestBed.inject(WjTheme).setPrimary('#1a1a1a');

      expect(both.join()).toContain('(dark)');
      expect(calls(warn, 'WJ0010').join()).not.toContain('(dark)');
    });
  });

  describe('on the server', () => {
    it('does nothing', async () => {
      const fixture = await render({}, { extra: [{ provide: PLATFORM_ID, useValue: 'server' }] });
      const theme = TestBed.inject(WjTheme);
      const sheets = (): (string | null)[] =>
        Array.from(document.head.querySelectorAll(SHEETS)).map((style) => style.textContent);
      const before = sheets();
      warn.mockClear();

      theme.setPrimary('#0f766e');
      theme.setSurface('{slate}');
      theme.setPrimary('teal-ish');
      theme.reset();
      await fixture.whenStable();

      expect(sheets()).toEqual(before);
      expect(theme.primary()).toBeUndefined();
      expect(theme.surface()).toBeUndefined();
      expect(warn).not.toHaveBeenCalled();
    });
  });

  describe('without provideWeeljack', () => {
    it('logs WJ0001 once and does nothing', () => {
      const theme = TestBed.inject(WjTheme);

      theme.setPrimary('#0f766e');
      theme.setSurface('teal-ish');
      theme.reset();

      expect(calls(warn, 'WJ0001')).toHaveLength(1);
      expect(calls(warn, 'WJ0001')[0]).toContain('WjTheme');
      expect(calls(warn, 'WJ0200')).toHaveLength(0);
      expect(theme.primary()).toBeUndefined();
      expect(theme.surface()).toBeUndefined();
      expect(document.head.querySelectorAll(SHEETS)).toHaveLength(0);
    });
  });
});
