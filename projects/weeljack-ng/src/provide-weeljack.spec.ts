import { CSP_NONCE, Component, type Provider } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { Optimus } from '@openng/optimus-ui/config';
import { ButtonModule } from '@openng/optimus-ui/button';
import { InputTextModule } from '@openng/optimus-ui/inputtext';
import { provideWeeljack, type WjThemeOptions } from './public-api';

/** A consumer's template: one of each control the default look sizes. */
@Component({
  selector: 'wj-theme-host',
  imports: [ButtonModule, InputTextModule],
  template: `
    <p-button label="Default" />
    <p-button label="Small" size="small" />
    <p-button label="Large" size="large" />
    <p-button icon="pi pi-check" ariaLabel="Check" />
    <input pInputText aria-label="Name" value="Loc" />
  `,
})
class ThemeHost {}

/** quanoi's brand scales (`apps/owner/src/app/app.config.ts`), copied as fixtures. */
const QUANOI_PRIMARY = {
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
const QUANOI_SURFACE = {
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

const ROOT = document.documentElement;

async function render(
  options?: WjThemeOptions,
  extra: Provider[] = [],
): Promise<ComponentFixture<ThemeHost>> {
  TestBed.configureTestingModule({ providers: [provideWeeljack(options), ...extra] });
  const fixture = TestBed.createComponent(ThemeHost);
  document.body.appendChild(fixture.nativeElement as HTMLElement);
  await fixture.whenStable();
  return fixture;
}

function variable(name: string, element: Element = ROOT): string {
  return getComputedStyle(element).getPropertyValue(name).trim();
}

/** Every rule of every stylesheet, flattened through `@layer` / `@media` nesting. */
function allRules(): CSSRule[] {
  const rules: CSSRule[] = [];
  const visit = (list: CSSRuleList): void => {
    for (const rule of Array.from(list)) {
      rules.push(rule);
      if (rule instanceof CSSGroupingRule) {
        visit(rule.cssRules);
      }
    }
  };
  for (const sheet of Array.from(document.styleSheets)) {
    visit(sheet.cssRules);
  }
  return rules;
}

function mediaRules(condition: string): CSSMediaRule[] {
  return allRules().filter(
    (rule): rule is CSSMediaRule =>
      rule instanceof CSSMediaRule && rule.conditionText.includes(condition),
  );
}

function height(element: Element | undefined): number {
  return element?.getBoundingClientRect().height ?? Number.NaN;
}

describe('provideWeeljack', () => {
  afterEach(() => {
    ROOT.classList.remove('wj-dark');
    document.body.replaceChildren();
    document.head.querySelectorAll('style[data-optimus-style-id]').forEach((style) => {
      style.remove();
    });
  });

  describe('darkMode "off" (the default)', () => {
    it('resolves the light "Noir on zinc" values under the wj prefix', async () => {
      await render();

      expect(variable('--wj-primary-color')).toBe('#09090b');
      expect(variable('--wj-primary-contrast-color')).toBe('#ffffff');
      expect(variable('--wj-primary-hover-color')).toBe('#18181b');
      expect(variable('--wj-surface-50')).toBe('#fafafa');
      expect(variable('--wj-content-background')).toBe('#ffffff');
      expect(variable('--wj-form-field-border-color')).toBe('#71717a');
      expect(variable('--wj-form-field-invalid-border-color')).toBe('#dc2626');
      expect(variable('--wj-error-color')).toBe('#b91c1c');
      expect(variable('--wj-highlight-background')).toBe('#09090b');
    });

    it('shapes controls: one 2px focus ring, 8px controls, 12px content', async () => {
      await render();

      expect(variable('--wj-focus-ring-width')).toBe('2px');
      expect(variable('--wj-focus-ring-style')).toBe('solid');
      expect(variable('--wj-focus-ring-offset')).toBe('2px');
      expect(variable('--wj-form-field-focus-ring-width')).toBe('2px');
      expect(variable('--wj-form-field-border-radius')).toBe('8px');
      expect(variable('--wj-content-border-radius')).toBe('12px');
      expect(variable('--wj-transition-duration')).toBe('0.2s');
    });

    it('moves light severity fills to 700 with white text', async () => {
      const fixture = await render();
      const button = (fixture.nativeElement as HTMLElement).querySelector('button');

      expect(button).not.toBeNull();
      expect(variable('--wj-button-danger-background', button as Element)).toBe('#b91c1c');
      expect(variable('--wj-button-danger-color', button as Element)).toBe('#ffffff');
      expect(variable('--wj-button-success-background', button as Element)).toBe('#15803d');
      expect(variable('--wj-button-info-background', button as Element)).toBe('#0369a1');
      expect(variable('--wj-button-warn-background', button as Element)).toBe('#c2410c');
    });

    it('stays light whatever the page does: no dark output at all', async () => {
      await render();
      ROOT.classList.add('wj-dark');

      expect(variable('--wj-primary-color')).toBe('#09090b');
      expect(mediaRules('prefers-color-scheme')).toEqual([]);
      expect(allRules().some((rule) => rule.cssText.includes('.wj-dark'))).toBe(false);
    });

    it('emits every variable under --wj- and none under --p-', async () => {
      await render();
      const names = Array.from(getComputedStyle(ROOT)).filter((name) => name.startsWith('--'));

      expect(names.some((name) => name.startsWith('--wj-'))).toBe(true);
      expect(names.filter((name) => name.startsWith('--p-'))).toEqual([]);
    });
  });

  describe('brand colours', () => {
    it('turns a hex primary into a scale on 500 and keeps Aura mapping on top', async () => {
      await render({ primary: '#c2410c' });

      expect(variable('--wj-primary-500')).toBe('#c2410c');
      expect(variable('--wj-primary-50')).toBe('#fcf6f3');
      expect(variable('--wj-primary-100')).toBe('#f0d1c5');
      expect(variable('--wj-primary-400')).toBe('#ce653a');
      expect(variable('--wj-primary-600')).toBe('#a5370a');
      expect(variable('--wj-primary-950')).toBe('#311003');
      expect(variable('--wj-primary-color')).toBe('#c2410c');
      expect(variable('--wj-primary-contrast-color')).toBe('#ffffff');
      expect(variable('--wj-primary-hover-color')).toBe('#a5370a');
      expect(variable('--wj-highlight-background')).not.toBe('#09090b');
    });

    it('uses primary 400 in dark', async () => {
      await render({ primary: '#c2410c', darkMode: 'class' });
      ROOT.classList.add('wj-dark');

      expect(variable('--wj-primary-color')).toBe('#ce653a');
    });

    it('takes a full scale unchanged', async () => {
      await render({ primary: QUANOI_PRIMARY });

      expect(variable('--wj-primary-50')).toBe('#fff3ef');
      expect(variable('--wj-primary-400')).toBe('#f06030');
      expect(variable('--wj-primary-500')).toBe('#c2410c');
    });

    it('takes one surface for both schemes and keeps surface.0 white', async () => {
      await render({ surface: QUANOI_SURFACE });

      expect(variable('--wj-surface-0')).toBe('#ffffff');
      expect(variable('--wj-surface-500')).toBe('#9e948c');
      expect(variable('--wj-form-field-border-color')).toBe('#9e948c');
      expect(variable('--wj-primary-color')).toBe('#09090b');
    });

    it('lets a scale that sets 0 override the white', async () => {
      await render({ surface: { ...QUANOI_SURFACE, 0: '#fffdfa' } });

      expect(variable('--wj-surface-0')).toBe('#fffdfa');
    });

    it('reads each scheme from its own surface under { light, dark }', async () => {
      await render({
        surface: { light: QUANOI_SURFACE, dark: STONE_DARK },
        darkMode: 'class',
      });

      expect(variable('--wj-surface-500')).toBe('#9e948c');

      ROOT.classList.add('wj-dark');

      expect(variable('--wj-surface-500')).toBe('#78716c');
      expect(variable('--wj-surface-950')).toBe('#0c0a09');
    });

    it('keeps the always-on layer whatever the brand', async () => {
      const fixture = await render({ primary: QUANOI_PRIMARY, surface: QUANOI_SURFACE });
      const button = (fixture.nativeElement as HTMLElement).querySelector('button');

      expect(variable('--wj-focus-ring-width')).toBe('2px');
      expect(variable('--wj-focus-ring-color')).toBe('#c2410c');
      expect(variable('--wj-form-field-border-radius')).toBe('8px');
      expect(variable('--wj-button-danger-background', button as Element)).toBe('#b91c1c');
    });
  });

  describe('darkMode "class"', () => {
    it('is light until .wj-dark is on <html>, then resolves the dark values', async () => {
      await render({ darkMode: 'class' });

      expect(variable('--wj-primary-color')).toBe('#09090b');

      ROOT.classList.add('wj-dark');

      expect(variable('--wj-primary-color')).toBe('#fafafa');
      expect(variable('--wj-primary-contrast-color')).toBe('#09090b');
      expect(variable('--wj-primary-hover-color')).toBe('#f4f4f5');
      expect(variable('--wj-form-field-background')).toBe('#09090b');
      expect(variable('--wj-form-field-border-color')).toBe('#71717a');
      expect(variable('--wj-form-field-invalid-border-color')).toBe('#f87171');
      expect(variable('--wj-error-color')).toBe('#f87171');
      expect(variable('--wj-content-background')).toBe('#18181b');
    });
  });

  describe('darkMode "system"', () => {
    it('emits the dark values inside prefers-color-scheme: dark and not on a class', async () => {
      await render({ darkMode: 'system' });

      const dark = mediaRules('prefers-color-scheme: dark')
        .map((rule) => rule.cssText)
        .join('\n');

      expect(dark).toMatch(/--wj-primary-color:\s*var\(--wj-zinc-50\)/);
      expect(dark).toMatch(/--wj-primary-contrast-color:\s*var\(--wj-zinc-950\)/);
      expect(allRules().some((rule) => rule.cssText.includes('.wj-dark'))).toBe(false);

      ROOT.classList.add('wj-dark');

      expect(variable('--wj-primary-color')).toBe('#09090b');
    });
  });

  describe('@layer wj', () => {
    it('holds Optimus styles and the reduced-motion block', async () => {
      await render();

      const layers = allRules().filter((rule) => rule instanceof CSSLayerBlockRule);
      expect(layers.length).toBeGreaterThan(0);
      expect(layers.every((rule) => rule.name === 'wj')).toBe(true);

      const reduced = mediaRules('prefers-reduced-motion: reduce')
        .map((rule) => rule.cssText)
        .join('\n');
      expect(reduced).toContain('--wj-transition-duration: 0s');
      expect(reduced).toContain('.p-progressspinner-spin');
      expect(reduced).toMatch(/\.p-icon-spin \{ animation: [^;]*none[^;]*!important/);
      expect(reduced).toMatch(/\.p-ripple > \.p-ink \{ display: none/);
      expect(reduced).toMatch(
        /\.p-animateonscroll \{ opacity: 1 !important; animation: [^;]*none[^;]*!important; transition: none !important/,
      );
    });
  });

  describe('line-height rule', () => {
    it('gives the input, textarea, select label and button a 1.5 line height', async () => {
      await render();

      const rule = allRules().find(
        (r): r is CSSStyleRule => r instanceof CSSStyleRule && r.style.lineHeight === '1.5',
      );
      for (const selector of [
        '.p-inputtext',
        '.p-textarea',
        '.p-select-label',
        '.p-treeselect-label',
        '.p-button',
      ]) {
        expect(rule?.selectorText).toContain(selector);
      }
    });
  });

  describe('44px controls', () => {
    it('renders default 44px, small 36px, large 52px and a square icon-only button', async () => {
      const fixture = await render();
      const root = fixture.nativeElement as HTMLElement;
      const [normal, small, large, iconOnly] = Array.from(root.querySelectorAll('button'));

      expect(height(normal)).toBe(44);
      expect(height(small)).toBe(36);
      expect(height(large)).toBe(52);
      expect(height(root.querySelector('input') ?? undefined)).toBe(44);
      expect(height(iconOnly)).toBe(44);
      expect(iconOnly?.getBoundingClientRect().width).toBe(44);
    });
  });

  describe('csp.nonce', () => {
    it('forwards Angular CSP_NONCE to Optimus and its injected styles', async () => {
      await render(undefined, [{ provide: CSP_NONCE, useValue: 'wj-test-nonce' }]);

      expect(TestBed.inject(Optimus).csp().nonce).toBe('wj-test-nonce');
      const style = document.head.querySelector<HTMLStyleElement>(
        'style[data-optimus-style-id="semantic-variables"]',
      );
      expect(style?.nonce).toBe('wj-test-nonce');
    });

    it('sets no nonce when the app has none', async () => {
      await render();

      expect(TestBed.inject(Optimus).csp().nonce).toBeUndefined();
    });
  });
});
