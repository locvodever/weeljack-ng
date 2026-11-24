import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ButtonModule } from '@openng/optimus-ui/button';
import aura from '@openng/optimus-ui-themes/aura';
import { BRAND_DIGESTS, NOIR_DIGEST, canonicalJson } from '../spec-support/noir-golden';
import { SHEETS } from '../spec-support/theme-snapshot';
import { brandPreset } from './brand';
import { tokensFor, tokenValue } from './contrast';
import { wjLayerStyles } from './layer-styles';
import { _wjNoir, wjNoirOnZinc } from './noir-on-zinc';
import type { WjPreset } from './preset';
import { provideWeeljack } from './public-api';
import { _wjThemePreset } from './theme-runtime';

const SURFACES = ['zinc', 'slate', 'gray', 'neutral', 'stone'];

/** Aura's primitive palettes with a `500` step, as `scripts/check-contrast.mjs` selects them. */
const PALETTES = Object.entries(aura.primitive as Record<string, unknown>)
  .filter(([, scale]) => typeof scale === 'object' && scale !== null && '500' in scale)
  .map(([name]) => name);

/** SHA-256 hex of the canonical JSON, the same text the golden's generator hashed in Node. */
async function digest(value: unknown): Promise<string> {
  const bytes = new TextEncoder().encode(canonicalJson(value));
  const hash = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(hash), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

/** The value at a dotted path of a resolved preset, or `undefined` when any step is missing. */
function at(value: unknown, path: string): unknown {
  return path
    .split('.')
    .reduce<unknown>(
      (node, key) =>
        typeof node === 'object' && node !== null
          ? (node as Record<string, unknown>)[key]
          : undefined,
      value,
    );
}

/*
 * The split proof (ADR 0010, FR-3): Noir and the brand branch over Noir resolve exactly as they did
 * on `dev` before the preset seam. The golden holds digests of sorted-key JSON, generated once on
 * the base commit and never regenerated.
 */
describe('the split proof: Noir and the brand branch over Noir are unchanged', () => {
  /** Each way into the builder that must give the golden's digests. */
  const PATHS: readonly (readonly [
    string,
    (primary: string | undefined, surface: string | undefined) => unknown,
  ])[] = [
    ['brandPreset(p, s)', (primary, surface) => brandPreset(primary, surface)],
    ['brandPreset(p, s, _wjNoir)', (primary, surface) => brandPreset(primary, surface, _wjNoir)],
    ['_wjThemePreset(p, s).brand', (primary, surface) => _wjThemePreset(primary, surface).brand],
  ];

  it('iterates the golden palettes and nothing else', () => {
    const expected = PALETTES.flatMap((name) => SURFACES.map((surface) => `${name}/${surface}`));

    expect(Object.keys(BRAND_DIGESTS).sort()).toEqual(expected.sort());
  });

  it('wjNoirOnZinc, the scripts-only composition, matches the Noir digest', async () => {
    expect(await digest(wjNoirOnZinc)).toBe(NOIR_DIGEST);
  });

  for (const [path, build] of PATHS) {
    it(`${path}: Noir (1 of 1)`, async () => {
      expect(await digest(build(undefined, undefined))).toBe(NOIR_DIGEST);
    });

    for (const name of PALETTES) {
      for (const surface of SURFACES) {
        it(`${path}: ${name}/${surface} over Noir`, async () => {
          expect(await digest(build(`{${name}}`, `{${surface}}`))).toBe(
            BRAND_DIGESTS[`${name}/${surface}`],
          );
        });
      }
    }
  }
});

/** An ink preset: its look sets a card corner and the ink sets a badge corner, nothing else. */
const INK_FAKE: WjPreset = {
  _base: aura,
  _look: { components: { card: { root: { borderRadius: '5px' } } } },
  _ink: { components: { badge: { root: { borderRadius: '99px' } } } },
};

/** A colour preset shaped as `wjAura`: Aura and its own emerald, no look. */
const COLOUR_FAKE: WjPreset = { _base: aura, _primary: '{emerald}' };

describe('the preset builder', () => {
  it('the default is Noir, for Noir, a named primary on slate and a hex primary', () => {
    for (const [primary, surface] of [
      [undefined, undefined],
      ['{blue}', '{slate}'],
      ['#1d4ed8', undefined],
    ] as const) {
      expect(_wjThemePreset(primary, surface)).toEqual(_wjThemePreset(primary, surface, _wjNoir));
    }
  });

  it('an app primary drops _ink and keeps _look', () => {
    const alone = brandPreset(undefined, undefined, INK_FAKE);
    const named = brandPreset('{blue}', undefined, INK_FAKE);

    expect(at(alone, 'components.badge.root.borderRadius')).toBe('99px');
    expect(at(named, 'components.badge.root.borderRadius')).not.toBe('99px');
    expect(at(alone, 'components.card.root.borderRadius')).toBe('5px');
    expect(at(named, 'components.card.root.borderRadius')).toBe('5px');
  });

  it('the focused float label takes the primary hover step in light, under wjAura and a named primary', () => {
    const label = 'form.field.float.label.focus.color';
    const hover = 'primary.hover.color';
    const forms = [
      brandPreset(undefined, undefined, COLOUR_FAKE),
      brandPreset('{pink}', undefined),
    ];

    for (const preset of forms) {
      const light = tokensFor(preset, 'light');
      expect(tokenValue(light, label)).toBe(tokenValue(light, hover));
    }
    expect(tokenValue(tokensFor(forms[1], 'light'), label).toLowerCase()).toBe('#be185d');
    // Dark keeps Aura's {primary.color}.
    const dark = tokensFor(forms[1], 'dark');
    expect(tokenValue(dark, label)).toBe(tokenValue(dark, 'primary.color'));
  });

  it('the colour form takes its AA step and the slider and knob arc (F5)', () => {
    const resolved = brandPreset(undefined, undefined, COLOUR_FAKE);

    expect(at(resolved, 'semantic.primary.500')).toBe('{emerald.500}');
    expect(at(resolved, 'semantic.colorScheme.light.primary.color')).toBe('{primary.700}');
    expect(at(resolved, 'semantic.colorScheme.light.primary.hoverColor')).toBe('{primary.800}');
    for (const [part, token] of [
      ['slider', 'range'],
      ['knob', 'value'],
    ] as const) {
      expect(at(resolved, `components.${part}.${token}.background`)).toBe('{surface.950}');
      expect(at(resolved, `components.${part}.colorScheme.dark.${token}.background`)).toBe(
        '{primary.200}',
      );
      expect(at(resolved, `components.${part}.colorScheme.light.${token}.background`)).toBe(
        at(aura, `components.${part}.colorScheme.light.${token}.background`),
      );
    }
  });

  it('an invalid app primary falls back to the preset colour, then to the ink', () => {
    const colour = brandPreset('teal-ish', undefined, COLOUR_FAKE);
    const ink = brandPreset('teal-ish', undefined);

    expect(colour).toEqual(brandPreset(undefined, undefined, COLOUR_FAKE));
    expect(at(colour, 'semantic.primary.500')).toBe('{emerald.500}');
    expect(ink).toEqual(brandPreset(undefined, undefined));
    expect(at(ink, 'semantic.colorScheme.light.primary.color')).toBe('{zinc.950}');
  });

  it('an app surface wins over the look, and the look wins over the base', () => {
    const look: WjPreset = {
      _base: aura,
      _look: {
        semantic: {
          colorScheme: {
            light: { surface: { 500: '#aaaaaa' } },
            dark: { surface: { 500: '#bbbbbb' } },
          },
        },
      },
    };
    const surface = 'semantic.colorScheme';

    const withApp = brandPreset(undefined, '{slate}', look);
    const noApp = brandPreset(undefined, undefined, look);
    const base = brandPreset(undefined, undefined, { _base: aura });

    expect(at(withApp, `${surface}.light.surface.500`)).toBe('{slate.500}');
    expect(at(withApp, `${surface}.dark.surface.500`)).toBe('{slate.500}');
    expect(at(noApp, `${surface}.light.surface.500`)).toBe('#aaaaaa');
    expect(at(noApp, `${surface}.dark.surface.500`)).toBe('#bbbbbb');
    expect(at(base, `${surface}.light.surface.500`)).toBe(at(aura, `${surface}.light.surface.500`));
    expect(at(base, `${surface}.dark.surface.500`)).toBe(at(aura, `${surface}.dark.surface.500`));
  });

  it('ink gets no F5: Noir alone leaves the slider range and knob value as Aura has them', () => {
    const resolved = brandPreset(undefined, undefined, _wjNoir);

    for (const path of ['components.slider.range', 'components.knob.value']) {
      expect(at(resolved, path)).toEqual(at(aura, path));
    }
  });

  it('the layer css is wjLayerStyles for every preset', () => {
    for (const preset of [_wjNoir, INK_FAKE, COLOUR_FAKE]) {
      expect(at(_wjThemePreset(undefined, undefined, preset).preset, 'css')).toBe(wjLayerStyles);
    }
  });

  describe('_brand', () => {
    /** A colour preset whose `_brand` records each name and sets a slider and a surface token. */
    function recording(): { readonly preset: WjPreset; readonly names: string[] } {
      const names: string[] = [];
      const preset: WjPreset = {
        _base: aura,
        _primary: '{emerald}',
        _brand: (name) => {
          names.push(name);
          return {
            semantic: { colorScheme: { light: { surface: { 500: '#abcdef' } } } },
            components: { slider: { range: { background: '#123456' } } },
          };
        },
      };
      return { preset, names };
    }
    const slider = 'components.slider.range.background';

    it('is called with the palette name of an app `{palette}`, and with "" for a hex or a scale', () => {
      const { preset, names } = recording();
      const scale = {
        50: '#f0f9ff',
        100: '#e0f2fe',
        200: '#bae6fd',
        300: '#7dd3fc',
        400: '#38bdf8',
        500: '#0ea5e9',
        600: '#0284c7',
        700: '#0369a1',
        800: '#075985',
        900: '#0c4a6e',
        950: '#082f49',
      };

      brandPreset('{blue}', undefined, preset);
      brandPreset('#1d4ed8', undefined, preset);
      brandPreset(scale, undefined, preset);

      expect(names).toEqual(['blue', '', '']);
    });

    it('is called with the name of the preset `_primary` when the app sets none', () => {
      const { preset, names } = recording();

      brandPreset(undefined, undefined, preset);

      expect(names).toEqual(['emerald']);
    });

    it('its layer wins over the brand layer and loses to an app surface', () => {
      const { preset } = recording();
      const surface = 'semantic.colorScheme.light.surface.500';

      const noApp = brandPreset('{blue}', undefined, preset);
      const withApp = brandPreset('{blue}', '{slate}', preset);

      expect(at(noApp, slider)).toBe('#123456');
      expect(at(noApp, surface)).toBe('#abcdef');
      expect(at(withApp, slider)).toBe('#123456');
      expect(at(withApp, surface)).toBe('{slate.500}');
      expect(at(brandPreset('{blue}', undefined, COLOUR_FAKE), slider)).toBe('{surface.950}');
    });

    it('a `_brand` that returns undefined, or no `_brand`, changes nothing', () => {
      const silent: WjPreset = { ...COLOUR_FAKE, _brand: () => undefined };

      for (const primary of [undefined, '{blue}', '#1d4ed8'] as const) {
        expect(brandPreset(primary, '{slate}', silent)).toEqual(
          brandPreset(primary, '{slate}', COLOUR_FAKE),
        );
      }
      expect(brandPreset(undefined, undefined, { ...INK_FAKE, _brand: () => undefined })).toEqual(
        brandPreset(undefined, undefined, INK_FAKE),
      );
    });
  });

  it('rejects a raw Optimus preset at the type level', () => {
    // @ts-expect-error a raw Optimus preset is not a WjPreset: it has no `_base`
    const raw: WjPreset = aura;

    expect(raw).toBe(aura);
  });
});

@Component({
  selector: 'wj-css-host',
  imports: [ButtonModule],
  template: `<p-button label="Go" />`,
})
class CssHost {}

describe('_css', () => {
  const CSS = '.wj-preset-css-probe{color:red}';

  afterEach(() => {
    TestBed.resetTestingModule();
    document.head.querySelectorAll(SHEETS).forEach((style) => {
      style.remove();
    });
  });

  it('the built root css is wjLayerStyles followed by the preset _css', () => {
    const preset: WjPreset = { _base: aura, _css: CSS };

    expect(at(_wjThemePreset(undefined, undefined, preset).preset, 'css')).toBe(
      wjLayerStyles + CSS,
    );
  });

  it('a preset without _css builds wjLayerStyles alone, deep-equal to before', () => {
    const none: WjPreset = { _base: aura };
    const empty: WjPreset = { _base: aura, _css: '' };

    expect(at(_wjThemePreset(undefined, undefined, none).preset, 'css')).toBe(wjLayerStyles);
    expect(_wjThemePreset(undefined, undefined, empty)).toEqual(
      _wjThemePreset(undefined, undefined, none),
    );
  });

  it('provideWeeljack writes both into global-style, inside @layer wj', async () => {
    TestBed.configureTestingModule({
      providers: [provideWeeljack({ preset: { _base: aura, _css: CSS } })],
    });
    const fixture = TestBed.createComponent(CssHost);
    await fixture.whenStable();

    const global = document.head.querySelector<HTMLStyleElement>(
      'style[data-optimus-style-id="global-style"]',
    );
    const layers = Array.from(global?.sheet?.cssRules ?? []).filter(
      (rule): rule is CSSLayerBlockRule => rule instanceof CSSLayerBlockRule,
    );
    const selectors = layers
      .flatMap((layer) => Array.from(layer.cssRules))
      .filter((rule): rule is CSSStyleRule => rule instanceof CSSStyleRule)
      .map((rule) => rule.selectorText);

    expect(layers.map((layer) => layer.name)).toEqual(['wj']);
    expect(selectors).toContain('.wj-preset-css-probe');
    expect(selectors.some((selector) => selector.includes('.p-button'))).toBe(true);
  });
});
