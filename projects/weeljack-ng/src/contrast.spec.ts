import { TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import aura from '@openng/optimus-ui-themes/aura';
import { WjSlider } from 'weeljack-ng/slider';
import { tokenValue, tokensFor } from './contrast';
import type { WjPreset } from './preset';
import { provideWeeljack } from './provide-weeljack';
import { _wjThemePreset } from './theme-runtime';

/*
 * Optimus 2.0.2 writes each tier's `colorScheme.light` before its base, in one rule that applies in
 * both schemes, then the dark rule. `tokensFor` reads in that order. Plain preset objects, no
 * rendering; every value is distinct so a wrong winner is visible.
 */
describe('tokensFor reads in the order Optimus emits', () => {
  it('the base wins over colorScheme.light in light', () => {
    const preset = {
      semantic: {
        textColor: '#111111',
        colorScheme: { light: { textColor: '#aaaaaa' } },
      },
      components: {
        card: {
          root: { background: '#222222' },
          colorScheme: { light: { root: { background: '#bbbbbb' } } },
        },
      },
    };

    const tokens = tokensFor(preset, 'light');

    expect(tokens.get('text.color')).toBe('#111111');
    expect(tokens.get('card.background')).toBe('#222222');
  });

  it('a light-only token is present in dark, with its light value', () => {
    const preset = {
      semantic: {
        colorScheme: { light: { borderColor: '#333333' } },
      },
      components: {
        card: {
          colorScheme: { light: { root: { shadow: '#444444' } } },
        },
      },
    };

    const tokens = tokensFor(preset, 'dark');

    expect(tokens.get('border.color')).toBe('#333333');
    expect(tokens.get('card.shadow')).toBe('#444444');
  });

  it('colorScheme.dark wins over the base and light in dark', () => {
    const preset = {
      semantic: {
        textColor: '#111111',
        colorScheme: {
          light: { textColor: '#aaaaaa' },
          dark: { textColor: '#eeeeee' },
        },
      },
      components: {
        card: {
          root: { background: '#222222' },
          colorScheme: {
            light: { root: { background: '#bbbbbb' } },
            dark: { root: { background: '#dddddd' } },
          },
        },
      },
    };

    const tokens = tokensFor(preset, 'dark');

    expect(tokens.get('text.color')).toBe('#eeeeee');
    expect(tokens.get('card.background')).toBe('#dddddd');
  });
});

/** A preset whose look sets one semantic and one component token, base and light apart. */
const RENDERED_FAKE: WjPreset = {
  _base: aura,
  _look: {
    semantic: {
      formField: { hoverBorderColor: '#112233' },
      colorScheme: { light: { formField: { hoverBorderColor: '#445566' } } },
    },
    components: {
      slider: {
        range: { background: '#778899' },
        colorScheme: { light: { range: { background: '#99aabb' } } },
      },
    },
  },
};

/** The two tokens: the dotted path the reader takes, and the `--wj-*` variable Optimus writes. */
const RENDERED_TOKENS = [
  ['form.field.hover.border.color', '--wj-form-field-hover-border-color'],
  ['slider.range.background', '--wj-slider-range-background'],
] as const;

@Component({
  selector: 'wj-contrast-rendered-host',
  imports: [WjSlider],
  template: `<wj-slider ariaLabel="Volume" />`,
})
class RenderedHost {}

/*
 * The real-browser check of the reader: the colour `tokensFor` reports for a token is the colour
 * Optimus actually writes to the page, in light and in dark. A mismatch means `contrast.ts`'s emit
 * order has drifted from Optimus's, which makes every contrast gate read the wrong colour.
 */
describe('tokensFor matches what Optimus renders', () => {
  afterEach(() => {
    document.documentElement.classList.remove('wj-dark');
    document.body.replaceChildren();
    document.head.querySelectorAll('style[data-optimus-style-id]').forEach((style) => {
      style.remove();
    });
    TestBed.resetTestingModule();
  });

  it.each(['light', 'dark'] as const)('in %s', async (scheme) => {
    if (scheme === 'dark') {
      document.documentElement.classList.add('wj-dark');
    }
    TestBed.configureTestingModule({
      providers: [provideWeeljack({ preset: RENDERED_FAKE, darkMode: 'class' })],
    });
    const fixture = TestBed.createComponent(RenderedHost);
    document.body.appendChild(fixture.nativeElement as HTMLElement);
    await fixture.whenStable();

    const resolved = _wjThemePreset(undefined, undefined, RENDERED_FAKE).brand;
    const tokens = tokensFor(resolved, scheme);

    for (const [path, variable] of RENDERED_TOKENS) {
      const rendered = getComputedStyle(document.documentElement)
        .getPropertyValue(variable)
        .trim()
        .toLowerCase();

      expect([path, rendered]).toEqual([path, tokenValue(tokens, path).toLowerCase()]);
    }
  });
});
