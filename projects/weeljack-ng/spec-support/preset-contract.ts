import { Component } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { Optimus } from '@openng/optimus-ui/config';
import { userEvent } from 'vitest/browser';
import { provideWeeljack, type WjPreset } from 'weeljack-ng';
import { WjButton } from 'weeljack-ng/button';
import { WjCheckbox } from 'weeljack-ng/checkbox';
import { WjIcon, wjIconSettings } from 'weeljack-ng/icon';
import { WjInputText } from 'weeljack-ng/inputtext';
import { WjRadioButton } from 'weeljack-ng/radiobutton';
import { WjRating } from 'weeljack-ng/rating';
import { WjSelect, type WjSelectOption } from 'weeljack-ng/select';
import { WjSlider } from 'weeljack-ng/slider';
import { WjToggleButton } from 'weeljack-ng/togglebutton';
import { WjToggleSwitch } from 'weeljack-ng/toggleswitch';
import { expectNoAxeViolations } from './axe';

/*
 * The shared preset contract (ADR 0010, PRD FR-21): the guarantees every WeeljackNg preset holds
 * when it is actually rendered. Each preset entry's spec is one `describePresetContract` call.
 * Contrast and ring tokens are not re-checked here: they are `check:contrast`'s.
 *
 * It lives in `spec-support/`, which has no `ng-package.json` and is excluded from the library
 * build, so it is never part of a published entry.
 */

const ROOT = document.documentElement;
const SCHEMES = ['light', 'dark'] as const;
type Scheme = (typeof SCHEMES)[number];

const FRUIT: WjSelectOption<string>[] = [
  { label: 'Apple', value: 'apple' },
  { label: 'Pear', value: 'pear' },
];

/** One of every control the guarantees size, ring or box, side by side. */
@Component({
  selector: 'wj-preset-contract-host',
  imports: [
    WjButton,
    WjCheckbox,
    WjIcon,
    WjInputText,
    WjRadioButton,
    WjRating,
    WjSelect,
    WjSlider,
    WjToggleButton,
    WjToggleSwitch,
  ],
  template: `
    <wj-button label="Default" />
    <wj-button label="Small" size="small" />
    <wj-button label="Large" size="large" />
    <wj-button ariaLabel="Settings"><wj-icon [icon]="settings" /></wj-button>
    <input wjInputText aria-label="Name" value="Loc" />
    <wj-select ariaLabel="Fruit" [options]="fruit" />
    <wj-select ariaLabel="Fruit, small" size="small" [options]="fruit" />
    <wj-select ariaLabel="Fruit, large" size="large" [options]="fruit" />
    <wj-togglebutton ariaLabel="Receipt" onLabel="On" offLabel="Off" />
    <wj-togglebutton ariaLabel="Receipt, small" size="small" onLabel="On" offLabel="Off" />
    <wj-togglebutton ariaLabel="Receipt, large" size="large" onLabel="On" offLabel="Off" />
    <wj-checkbox ariaLabel="Agree" />
    <wj-radiobutton name="speed" option="standard" ariaLabel="Standard" />
    <wj-rating ariaLabel="Score" />
    <div class="wj-contract-slider"><wj-slider ariaLabel="Volume" /></div>
    <wj-toggleswitch ariaLabel="Notify" />
  `,
  styles: `
    .wj-contract-slider {
      width: 240px;
    }
  `,
})
class PresetContractHost {
  protected readonly settings = wjIconSettings;
  protected readonly fruit = FRUIT;
}

/** Renders the fixture under `preset` in `scheme`, and returns it with its settled root. */
async function renderPresetFixture(
  preset: WjPreset,
  scheme: Scheme,
): Promise<{ fixture: ComponentFixture<PresetContractHost>; root: HTMLElement }> {
  if (scheme === 'dark') {
    ROOT.classList.add('wj-dark');
  }
  TestBed.configureTestingModule({ providers: [provideWeeljack({ preset, darkMode: 'class' })] });
  const fixture = TestBed.createComponent(PresetContractHost);
  const root = fixture.nativeElement as HTMLElement;
  document.body.appendChild(root);
  await fixture.whenStable();
  return { fixture, root };
}

/** `provide-weeljack.spec.ts`'s cleanup: the dark class, the fixtures and Optimus's style sheets. */
function cleanUpPresetFixture(): void {
  ROOT.classList.remove('wj-dark');
  document.body.replaceChildren();
  document.head.querySelectorAll('style[data-optimus-style-id]').forEach((style) => {
    style.remove();
  });
  TestBed.resetTestingModule();
}

function all(root: ParentNode, selector: string): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(selector));
}

function one(root: ParentNode, selector: string): HTMLElement {
  const [first] = all(root, selector);
  if (first === undefined) {
    throw new Error(`the fixture rendered nothing for '${selector}'`);
  }
  return first;
}

/** Resolves once `element` has no running transition or animation, so a style read is final. */
async function settled(element: Element): Promise<void> {
  await expect.poll(() => element.getAnimations().length).toBe(0);
}

function box(element: Element): DOMRect {
  return element.getBoundingClientRect();
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

/** A control the keyboard reaches, and the element that paints its focus ring. */
interface TabStop {
  readonly name: string;
  /** What Tab lands on, in document order. */
  readonly targets: (root: HTMLElement) => HTMLElement[];
  /** The element whose outline is the ring, as the wrapper's own spec reads it. */
  readonly ring: (target: HTMLElement) => Element;
}

const self = (target: HTMLElement): Element => target;
const within =
  (host: string, part: string) =>
  (target: HTMLElement): Element => {
    const found = target.closest(host)?.querySelector(part);
    if (!found) {
      throw new Error(`no '${part}' inside '${host}'`);
    }
    return found;
  };

const TAB_STOPS: readonly TabStop[] = [
  { name: 'button', targets: (root) => all(root, 'wj-button button'), ring: self },
  { name: 'input', targets: (root) => all(root, 'input[wjInputText]'), ring: self },
  {
    name: 'select',
    targets: (root) => all(root, 'p-select [role="combobox"]'),
    // The p-select element is itself the .p-select root.
    ring: (target) => target.closest('p-select') ?? target,
  },
  {
    name: 'togglebutton',
    targets: (root) => all(root, 'wj-togglebutton [role="button"]'),
    ring: self,
  },
  {
    name: 'checkbox',
    targets: (root) => all(root, 'wj-checkbox input'),
    ring: within('wj-checkbox', '.p-checkbox-box'),
  },
  {
    name: 'radiobutton',
    targets: (root) => all(root, 'wj-radiobutton input'),
    ring: within('wj-radiobutton', '.p-radiobutton-box'),
  },
  {
    // The group is one tab stop, at its first star.
    name: 'rating',
    targets: (root) => all(root, 'wj-rating input').slice(0, 1),
    ring: (target) => target.closest('.p-rating-option') ?? target,
  },
  { name: 'slider', targets: (root) => all(root, '[role="slider"]'), ring: self },
  {
    name: 'toggleswitch',
    targets: (root) => all(root, 'wj-toggleswitch input'),
    ring: within('wj-toggleswitch', '.p-toggleswitch-slider'),
  },
];

/**
 * The contract every WeeljackNg preset holds when rendered, in light and in dark (PRD FR-21, 14 Q4):
 * 44/36/52 px controls, one 2 px focus ring, 24 px hit boxes, `@layer wj` with reduced motion, and
 * no axe violation. `name` is the preset's export, for the report.
 */
export function describePresetContract(name: string, preset: WjPreset): void {
  describe(`preset contract: ${name}`, () => {
    afterEach(cleanUpPresetFixture);

    describe.each(SCHEMES)('%s', (scheme) => {
      describe('heights', () => {
        it('renders buttons at 44/36/52 px and an icon-only button at 44 x 44', async () => {
          const { root } = await renderPresetFixture(preset, scheme);
          const [normal, small, large, iconOnly] = all(root, 'wj-button button');

          expect(normal && box(normal).height).toBe(44);
          expect(small && box(small).height).toBe(36);
          expect(large && box(large).height).toBe(52);
          expect(iconOnly && box(iconOnly).height).toBe(44);
          expect(iconOnly && box(iconOnly).width).toBe(44);
        });

        it('renders a text input at 44 px, outlined and filled', async () => {
          const { fixture, root } = await renderPresetFixture(preset, scheme);
          const input = one(root, 'input[wjInputText]');

          expect(box(input).height).toBe(44);

          TestBed.inject(Optimus).inputVariant.set('filled');
          await fixture.whenStable();

          expect(box(input).height).toBe(44);
        });

        it('renders a select at 44/36/52 px', async () => {
          const { root } = await renderPresetFixture(preset, scheme);

          expect(all(root, 'p-select').map((select) => box(select).height)).toEqual([44, 36, 52]);
        });

        it('renders a toggle button at 44/36/52 px', async () => {
          const { root } = await renderPresetFixture(preset, scheme);

          expect(
            all(root, 'wj-togglebutton [role="button"]').map((button) => box(button).height),
          ).toEqual([44, 36, 52]);
        });
      });

      describe('one focus ring', () => {
        it('draws a 2 px solid outline and no box-shadow on every control Tab reaches', async () => {
          const { root } = await renderPresetFixture(preset, scheme);

          let reached = 0;
          for (const stop of TAB_STOPS) {
            for (const target of stop.targets(root)) {
              await userEvent.tab();
              await expect.poll(() => document.activeElement, { message: stop.name }).toBe(target);
              // Colours and shadows transition when focus lands: read once they have settled.
              const painter = stop.ring(target);
              await settled(painter);
              reached += 1;

              const ring = getComputedStyle(painter);
              expect([stop.name, ring.outlineStyle, ring.outlineWidth, ring.boxShadow]).toEqual([
                stop.name,
                'solid',
                '2px',
                'none',
              ]);
            }
          }

          expect(reached).toBe(16);
        });
      });

      describe('hit boxes', () => {
        it('gives the checkbox, radio, star, handle and switch at least 24 x 24 px', async () => {
          const { root } = await renderPresetFixture(preset, scheme);
          const parts: Record<string, HTMLElement> = {
            checkbox: one(root, '.p-checkbox-box'),
            radiobutton: one(root, '.p-radiobutton-box'),
            'rating star': one(root, '.p-rating-option'),
            'slider handle': one(root, '[role="slider"]'),
            toggleswitch: one(root, '.p-toggleswitch-slider'),
          };

          for (const [part, element] of Object.entries(parts)) {
            expect([part, box(element).width >= 24, box(element).height >= 24]).toEqual([
              part,
              true,
              true,
            ]);
          }
        });
      });

      describe('@layer wj and reduced motion', () => {
        it('puts every layer block in wj and zeroes the transition under reduced motion', async () => {
          await renderPresetFixture(preset, scheme);

          const layers = allRules().filter((rule) => rule instanceof CSSLayerBlockRule);
          expect(layers.length).toBeGreaterThan(0);
          expect(layers.map((rule) => rule.name).filter((layer) => layer !== 'wj')).toEqual([]);

          // Read as text, never by emulating the media query: emulation leaks across specs.
          const reduced = mediaRules('prefers-reduced-motion: reduce')
            .map((rule) => rule.cssText)
            .join('\n');
          expect(reduced).toContain('--wj-transition-duration: 0s');
        });
      });

      describe('axe', () => {
        it('has no violation on the fixture', async () => {
          const { root } = await renderPresetFixture(preset, scheme);

          await expectNoAxeViolations(root);
        });
      });
    });
  });
}
