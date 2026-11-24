import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Component, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import type { MockInstance } from 'vitest';
import { userEvent } from 'vitest/browser';
import { provideWeeljack } from 'weeljack-ng';
import { WjProgressSpinner, type WjProgressSpinnerPt } from 'weeljack-ng/progressspinner';
import { WjProgressSpinnerHarness } from 'weeljack-ng/progressspinner/testing';
import { expectNoAxeViolations } from '../spec-support/axe';

const PAYLOAD = '<img src=x onerror="window.wjInjected = true">';
const ROOT = document.documentElement;
const SPIN = 'p-progressspinner-rotate';
const WJ0160 =
  'WJ0160: wj-progressspinner: the indicator has no accessible name. Set ariaLabel, or ' +
  'ariaLabelledBy to the id of its visible label. ' +
  'Find more at https://locvodever.github.io/weeljack-ng/errors/WJ0160';

/** A consumer's template: one spinner between two buttons, with a visible label and hint to name it by. */
@Component({
  selector: 'wj-progressspinner-host',
  imports: [WjProgressSpinner],
  template: `
    <button type="button" id="before">Before</button>
    <div id="box">
      <span id="label">Loading orders…</span>
      <span id="hint">This takes a moment</span>
      <wj-progressspinner
        [ariaLabel]="ariaLabel()"
        [ariaLabelledBy]="labelledBy()"
        [ariaDescribedBy]="describedBy()"
        [pt]="pt()"
        [style.width]="size()"
        [style.height]="size()"
      />
    </div>
    <button type="button" id="after">After</button>
  `,
})
class Host {
  readonly ariaLabel = signal<string | undefined>(undefined);
  readonly labelledBy = signal<string | undefined>(undefined);
  readonly describedBy = signal<string | undefined>(undefined);
  readonly pt = signal<WjProgressSpinnerPt>(undefined);
  readonly size = signal<string | undefined>(undefined);
}

/** A consumer who sizes the spinner with a class. */
@Component({
  selector: 'wj-progressspinner-class-host',
  imports: [WjProgressSpinner],
  template: `<wj-progressspinner class="small" ariaLabel="Loading" />`,
  styles: `
    .small {
      width: 3rem;
      height: 3rem;
    }
  `,
})
class ClassHost {}

/** Two spinners with no name: a missing one and an empty one. */
@Component({
  selector: 'wj-progressspinner-unnamed-host',
  imports: [WjProgressSpinner],
  template: `
    <wj-progressspinner />
    <wj-progressspinner ariaLabel="" />
  `,
})
class UnnamedHost {}

/** One spinner named by `ariaLabel`, one by `ariaLabelledBy`. */
@Component({
  selector: 'wj-progressspinner-named-host',
  imports: [WjProgressSpinner],
  template: `
    <span id="named-by">Loading</span>
    <wj-progressspinner ariaLabel="Loading" />
    <wj-progressspinner ariaLabelledBy="named-by" />
  `,
})
class NamedHost {}

/** A consumer who writes `aria-label` on the host. */
@Component({
  selector: 'wj-progressspinner-aria-host',
  imports: [WjProgressSpinner],
  template: `<wj-progressspinner aria-label="Loading" ariaLabel="Loading" />`,
})
class AriaOnHostHost {}

type Scheme = 'light' | 'dark';

interface Rendered {
  fixture: ComponentFixture<Host>;
  host: Host;
  spinner: WjProgressSpinnerHarness;
  element: HTMLElement;
}

/** Renders the host with `provideWeeljack`, in the given colour scheme, after `setup` ran. */
async function render(
  scheme: Scheme = 'light',
  setup: (host: Host) => void = (host) => {
    host.ariaLabel.set('Loading');
  },
): Promise<Rendered> {
  ROOT.classList.toggle('wj-dark', scheme === 'dark');
  document.body.style.backgroundColor = 'var(--wj-content-background)';
  TestBed.configureTestingModule({ providers: [provideWeeljack({ darkMode: 'class' })] });
  const fixture = TestBed.createComponent(Host);
  setup(fixture.componentInstance);
  await fixture.whenStable();
  const element = fixture.nativeElement as HTMLElement;
  const spinner =
    await TestbedHarnessEnvironment.loader(fixture).getHarness(WjProgressSpinnerHarness);
  // A render without Optimus's styles would pass for the wrong reason: fail loudly instead.
  expect(getComputedStyle(parts(element).spin).position).toBe('absolute');
  return { fixture, host: fixture.componentInstance, spinner, element };
}

function find<E extends Element>(element: ParentNode, selector: string, type: new () => E): E {
  const found = element.querySelector(selector);
  if (!(found instanceof type)) {
    throw new Error(`${selector} is missing`);
  }
  return found;
}

/** The `wj-progressspinner` host, Optimus's `progressbar` element inside it, and its two parts. */
function parts(element: ParentNode): {
  host: HTMLElement;
  bar: HTMLElement;
  spin: SVGSVGElement;
  circle: SVGCircleElement;
} {
  const host = find(element, 'wj-progressspinner', HTMLElement);
  return {
    host,
    bar: find(host, 'p-progressspinner', HTMLElement),
    spin: find(host, '.p-progressspinner-spin', SVGSVGElement),
    circle: find(host, '.p-progressspinner-circle', SVGCircleElement),
  };
}

const attributeOf = (element: HTMLElement, name: string): string | null =>
  parts(element).bar.getAttribute(name);

const byId = (element: HTMLElement, id: string): HTMLElement =>
  find(element, `#${id}`, HTMLElement);

/** The reduced-motion media rule, in whichever sheet and layer carries the spinner's `animation: none`. */
function reducedMotionRule(): CSSMediaRule {
  const found: CSSMediaRule[] = [];
  const walk = (rules: CSSRuleList): void => {
    for (const rule of Array.from(rules)) {
      if (
        found.length === 0 &&
        rule instanceof CSSMediaRule &&
        rule.conditionText.includes('prefers-reduced-motion') &&
        Array.from(rule.cssRules).some(
          (inner) =>
            inner instanceof CSSStyleRule && inner.selectorText.includes('p-progressspinner-spin'),
        )
      ) {
        found.push(rule);
      }
      if (rule instanceof CSSGroupingRule) {
        walk(rule.cssRules);
      }
    }
  };
  for (const sheet of Array.from(document.styleSheets)) {
    walk(sheet.cssRules);
  }
  const [rule] = found;
  if (!rule) {
    throw new Error('the spinner reduced-motion rule is missing');
  }
  return rule;
}

/** The layer name chain `target` sits in, so the spec can say it is in `wj`. */
function layerOf(target: CSSRule): string[] {
  const chains: string[][] = [];
  const walk = (rules: CSSRuleList, path: string[]): void => {
    for (const rule of Array.from(rules)) {
      if (rule === target) {
        chains.push(path);
      }
      if (rule instanceof CSSGroupingRule) {
        walk(rule.cssRules, rule instanceof CSSLayerBlockRule ? [...path, rule.name] : path);
      }
    }
  };
  for (const sheet of Array.from(document.styleSheets)) {
    walk(sheet.cssRules, []);
  }
  return chains[0] ?? [];
}

/**
 * Runs `check` with the reader's reduced-motion rule switched on *in place*: the real media rule
 * that `provideWeeljack` put in the document keeps its position in the cascade, after the global
 * style and before Optimus's spinner style, exactly as shipped, and only its condition is widened
 * to `all`. That proves the rendered outcome of the real cascade without changing the shared
 * browser page the way a CDP media emulation would (it leaks into concurrent spec files). The
 * condition is put back in `finally`, and the style elements are removed after each test anyway.
 */
async function withReducedMotion(check: () => void | Promise<void>): Promise<void> {
  const { media } = reducedMotionRule();
  const original = media.mediaText;
  media.mediaText = 'all';
  try {
    await check();
  } finally {
    media.mediaText = original;
  }
}

type Spinner = ReturnType<typeof parts>;

const animationNames = (spinner: Spinner): [string, string] => [
  getComputedStyle(spinner.spin).animationName,
  getComputedStyle(spinner.circle).animationName,
];

const colours = (spinner: Spinner): string[] =>
  ['one', 'two', 'three', 'four'].map((name) =>
    getComputedStyle(spinner.spin)
      .getPropertyValue(`--wj-progressspinner-color-${name}`)
      .trim()
      .toLowerCase(),
  );

describe('WjProgressSpinner', () => {
  let warn: MockInstance<typeof console.warn>;

  beforeEach(() => {
    warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    ROOT.classList.remove('wj-dark');
    document.body.style.backgroundColor = '';
    document.head.querySelectorAll('style[data-optimus-style-id]').forEach((style) => {
      style.remove();
    });
    Reflect.deleteProperty(window, 'wjInjected');
  });

  describe('defaults', () => {
    it('with no inputs but a name it is a 100 x 100 px indeterminate spinner that turns', async () => {
      const { element } = await render();
      const { host, bar, spin, circle } = parts(element);

      expect(getComputedStyle(host).display).toBe('inline-block');
      for (const box of [host, bar, spin]) {
        expect(box.getBoundingClientRect().width).toBe(100);
        expect(box.getBoundingClientRect().height).toBe(100);
      }
      expect(bar.getAttribute('role')).toBe('progressbar');
      expect(bar.getAttribute('aria-busy')).toBe('true');
      expect(circle.getAttribute('stroke-width')).toBe('2');
      expect(circle.getAttribute('fill')).toBe('none');
      expect(getComputedStyle(circle).strokeLinecap).toBe('round');
      expect(getComputedStyle(spin).animationName).toBe(SPIN);
      expect(getComputedStyle(spin).animationDuration).toBe('2s');
    });

    it('draws Optimus’s four colours in light: red, blue, then the corrected green and yellow', async () => {
      const { element } = await render('light');

      expect(colours(parts(element))).toEqual(['#ef4444', '#3b82f6', '#16a34a', '#a16207']);
    });

    it('keeps Aura’s 400 steps in dark', async () => {
      const { element } = await render('dark');

      expect(colours(parts(element))).toEqual(['#f87171', '#60a5fa', '#4ade80', '#facc15']);
    });
  });

  describe('name and description', () => {
    it('ariaLabel lands on the progressbar element, and clears with it', async () => {
      const { host, element } = await render('light', (initial) => {
        initial.ariaLabel.set('Loading orders');
      });
      expect(attributeOf(element, 'aria-label')).toBe('Loading orders');

      host.ariaLabel.set(undefined);

      await expect.poll(() => attributeOf(element, 'aria-label')).toBeNull();
    });

    it('ariaLabelledBy and ariaDescribedBy land on the progressbar element', async () => {
      const { element } = await render('light', (host) => {
        host.labelledBy.set('label');
        host.describedBy.set('hint');
      });

      expect(attributeOf(element, 'aria-labelledby')).toBe('label');
      expect(attributeOf(element, 'aria-describedby')).toBe('hint');
      expect(attributeOf(element, 'role')).toBe('progressbar');
    });

    it('clears a routed id once the input goes, after several updates', async () => {
      const { host, element } = await render('light', (initial) => {
        initial.labelledBy.set('label');
        initial.describedBy.set('hint');
      });

      host.labelledBy.set('hint');
      await expect.poll(() => attributeOf(element, 'aria-labelledby')).toBe('hint');
      host.labelledBy.set(undefined);
      await expect.poll(() => attributeOf(element, 'aria-labelledby')).toBeNull();
      host.describedBy.set(undefined);
      await expect.poll(() => attributeOf(element, 'aria-describedby')).toBeNull();
      host.labelledBy.set('label');
      host.describedBy.set('label');
      await expect.poll(() => attributeOf(element, 'aria-labelledby')).toBe('label');
      expect(attributeOf(element, 'aria-describedby')).toBe('label');
    });

    it('puts no role and no aria-* on the wj-progressspinner host itself', async () => {
      const { element } = await render('light', (host) => {
        host.ariaLabel.set('Loading');
        host.labelledBy.set('label');
      });
      const { host } = parts(element);

      expect(host.hasAttribute('role')).toBe(false);
      expect(host.getAttributeNames().filter((name) => name.startsWith('aria-'))).toEqual([]);
      expect(warn).not.toHaveBeenCalled();
    });

    it('names the spinner by its visible label', async () => {
      const { element } = await render('light', (host) => {
        host.labelledBy.set('label');
      });

      expect(byId(element, 'label').textContent).toBe('Loading orders…');
      expect(attributeOf(element, 'aria-labelledby')).toBe('label');
      expect(attributeOf(element, 'aria-label')).toBeNull();
    });
  });

  describe('pt', () => {
    it('reaches the inner parts, as an object', async () => {
      const { element } = await render('light', (host) => {
        host.ariaLabel.set('Loading');
        host.pt.set({ spin: { 'data-probe': 'spin' }, circle: { 'data-probe': 'circle' } });
      });

      expect(find(element, '[data-probe="spin"]', Element).tagName.toLowerCase()).toBe('svg');
      expect(find(element, '[data-probe="circle"]', Element).tagName.toLowerCase()).toBe('circle');
    });

    it('reaches the inner parts, as a function with a function part', async () => {
      const { element } = await render('light', (host) => {
        host.ariaLabel.set('Loading');
        host.pt.set(() => ({ circle: () => ({ 'data-probe': 'fn' }) }));
      });

      expect(find(element, '[data-probe="fn"]', Element).tagName.toLowerCase()).toBe('circle');
    });

    it('keeps the consumer host keys beside the routed ids', async () => {
      const { element } = await render('light', (host) => {
        host.ariaLabel.set('Loading');
        host.labelledBy.set('label');
        host.pt.set({ host: { 'data-probe': 'host', title: 'Orders' } });
      });

      expect(attributeOf(element, 'data-probe')).toBe('host');
      expect(attributeOf(element, 'title')).toBe('Orders');
      expect(attributeOf(element, 'aria-labelledby')).toBe('label');
    });

    it('keeps the consumer host keys of a function pt beside the routed ones', async () => {
      const { element } = await render('light', (host) => {
        host.describedBy.set('hint');
        host.pt.set(() => ({ host: { 'data-probe': 'fn-host' } }));
      });

      expect(attributeOf(element, 'data-probe')).toBe('fn-host');
      expect(attributeOf(element, 'aria-describedby')).toBe('hint');
    });

    it('lets the routed id win over a consumer key of the same name', async () => {
      const { element } = await render('light', (host) => {
        host.labelledBy.set('label');
        host.pt.set({ host: { 'aria-labelledby': 'other' } });
      });

      expect(attributeOf(element, 'aria-labelledby')).toBe('label');
    });

    it('keeps the consumer keys of the host part when a routed id changes', async () => {
      const { host, element } = await render('light', (initial) => {
        initial.labelledBy.set('label');
        initial.pt.set({ host: { 'data-probe': 'kept' } });
      });

      host.labelledBy.set('hint');
      await expect.poll(() => attributeOf(element, 'aria-labelledby')).toBe('hint');

      expect(attributeOf(element, 'data-probe')).toBe('kept');
    });
  });

  describe('WJ0160', () => {
    it('warns once, with its own text, when neither ariaLabel nor ariaLabelledBy is set', async () => {
      TestBed.configureTestingModule({ providers: [provideWeeljack()] });
      const fixture = TestBed.createComponent(UnnamedHost);
      await fixture.whenStable();

      await expect.poll(() => warn.mock.calls.length).toBe(1);
      expect(warn).toHaveBeenCalledWith(WJ0160);
    });

    it('stays silent when the spinner is named by ariaLabel or by ariaLabelledBy', async () => {
      TestBed.configureTestingModule({ providers: [provideWeeljack()] });
      const named = TestBed.createComponent(NamedHost);
      await named.whenStable();
      expect(warn).not.toHaveBeenCalled();

      // The same application, so the render hooks of the first fixture have run: an unnamed one
      // still warns.
      TestBed.createComponent(UnnamedHost);
      await expect.poll(() => warn.mock.calls.length).toBe(1);
      expect(warn).toHaveBeenCalledWith(WJ0160);
    });

    it('treats a description alone as no name', async () => {
      await render('light', (host) => {
        host.describedBy.set('hint');
      });

      await expect.poll(() => warn.mock.calls.length).toBe(1);
      expect(warn).toHaveBeenCalledWith(WJ0160);
    });

    it('does not warn when the name is removed after the first render', async () => {
      const { host, fixture } = await render('light', (initial) => {
        initial.ariaLabel.set('Loading');
      });
      host.ariaLabel.set(undefined);
      await fixture.whenStable();

      expect(warn).not.toHaveBeenCalled();
    });
  });

  describe('ARIA', () => {
    it('warns WJ0003 once, and forwards nothing, when aria-* is on the host', async () => {
      TestBed.configureTestingModule({ providers: [provideWeeljack()] });
      const fixture = TestBed.createComponent(AriaOnHostHost);
      await fixture.whenStable();

      await expect.poll(() => warn.mock.calls.length).toBe(1);
      expect(warn).toHaveBeenCalledWith(
        'WJ0003: wj-progressspinner: aria-label is set on the host, where it is not forwarded to ' +
          'the focusable element. Use the ariaLabel, ariaLabelledBy or ariaDescribedBy input ' +
          'instead. Find more at https://locvodever.github.io/weeljack-ng/errors/WJ0003',
      );
    });

    it('warns WJ0001 when provideWeeljack is missing', async () => {
      const fixture = TestBed.createComponent(NamedHost);
      await fixture.whenStable();

      expect(warn).toHaveBeenCalledTimes(1);
      expect(warn).toHaveBeenCalledWith(
        'WJ0001: wj-progressspinner: provideWeeljack() is missing from the application providers. ' +
          'Add provideWeeljack() to your application config. ' +
          'Find more at https://locvodever.github.io/weeljack-ng/errors/WJ0001',
      );
    });

    it('reports the name, the description ids and the busy state through the harness', async () => {
      const { spinner, host } = await render('light', (initial) => {
        initial.ariaLabel.set('Loading orders');
        initial.describedBy.set('hint');
      });

      expect(await spinner.getAriaAttributes()).toEqual({
        label: 'Loading orders',
        labelledBy: null,
        describedBy: 'hint',
      });
      expect(await spinner.isBusy()).toBe(true);

      host.ariaLabel.set(undefined);
      host.labelledBy.set('label');
      host.describedBy.set(undefined);

      await expect
        .poll(() => spinner.getAriaAttributes())
        .toEqual({ label: null, labelledBy: 'label', describedBy: null });
    });
  });

  describe('HTML payloads', () => {
    it('keeps a payload in ariaLabel, ariaLabelledBy and ariaDescribedBy as attribute text', async () => {
      const { element } = await render('light', (host) => {
        host.ariaLabel.set(PAYLOAD);
        host.labelledBy.set(PAYLOAD);
        host.describedBy.set(PAYLOAD);
      });

      expect(attributeOf(element, 'aria-label')).toBe(PAYLOAD);
      expect(attributeOf(element, 'aria-labelledby')).toBe(PAYLOAD);
      expect(attributeOf(element, 'aria-describedby')).toBe(PAYLOAD);
      expect(element.querySelector('wj-progressspinner img')).toBeNull();
      expect(document.querySelector('img[src="x"]')).toBeNull();
      expect(Reflect.get(window, 'wjInjected')).toBeUndefined();
    });
  });

  describe('layout', () => {
    it('is sized by a style on the host: the Optimus element and the arc fill it', async () => {
      const { element } = await render('light', (host) => {
        host.ariaLabel.set('Loading');
        host.size.set('2rem');
      });
      const { host, bar, spin } = parts(element);

      for (const box of [host, bar, spin]) {
        expect(box.getBoundingClientRect().width).toBe(32);
        expect(box.getBoundingClientRect().height).toBe(32);
      }
    });

    it('is sized by a class on the host too', async () => {
      TestBed.configureTestingModule({ providers: [provideWeeljack()] });
      const fixture = TestBed.createComponent(ClassHost);
      await fixture.whenStable();
      const { host, bar, spin } = parts(fixture.nativeElement as HTMLElement);

      for (const box of [host, bar, spin]) {
        expect(box.getBoundingClientRect().width).toBe(48);
        expect(box.getBoundingClientRect().height).toBe(48);
      }
    });

    it('adds no box of its own: no padding, border or background on the host', async () => {
      const { element } = await render();
      const own = getComputedStyle(parts(element).host);

      for (const property of ['padding', 'borderTopWidth', 'backgroundColor'] as const) {
        expect(own[property]).toMatch(/^(0px|rgba\(0, 0, 0, 0\))$/);
      }
    });
  });

  describe('reduced motion (FR-21)', () => {
    it('turns, dashes and cycles colour without the preference', async () => {
      const { element } = await render();

      const [spin, circle] = animationNames(parts(element));

      expect(spin).toBe(SPIN);
      expect(circle).toBe('p-progressspinner-dash, p-progressspinner-color');
      expect(element.getAnimations({ subtree: true }).length).toBeGreaterThanOrEqual(3);
    });

    it('holds the root rule in the wj layer, inside the reduced-motion media block', async () => {
      await render();

      const rule = reducedMotionRule();

      expect(layerOf(rule)).toEqual(['wj']);
      expect(rule.conditionText).toContain('prefers-reduced-motion: reduce');
    });

    it('stops the rotation, the dash and the colour cycle on a rendered spinner', async () => {
      const { element } = await render();
      const spinner = parts(element);

      await withReducedMotion(async () => {
        expect(animationNames(spinner)).toEqual(['none', 'none']);
        await expect.poll(() => element.getAnimations({ subtree: true }).length).toBe(0);
      });

      // The condition is back: the spinner turns again, so nothing leaked past the proof.
      expect(animationNames(spinner)[0]).toBe(SPIN);
    });

    it.each([
      ['light', 'rgb(239, 68, 68)'],
      ['dark', 'rgb(248, 113, 113)'],
    ] as const)(
      'leaves a still arc of 89 in 200 dash units in the first colour in %s',
      async (scheme, first) => {
        const { element } = await render(scheme);
        const { circle } = parts(element);

        await withReducedMotion(() => {
          const style = getComputedStyle(circle);
          expect(style.stroke).toBe(first);
          expect(style.strokeDasharray.replaceAll('px', '')).toBe('89, 200');
          expect(style.strokeDashoffset).toMatch(/^0(px)?$/);
        });
      },
    );
  });

  describe('accessibility', () => {
    const states: [string, (host: Host) => void][] = [
      [
        'named with ariaLabel',
        (host) => {
          host.ariaLabel.set('Loading orders');
        },
      ],
      [
        'named with ariaLabelledBy',
        (host) => {
          host.labelledBy.set('label');
        },
      ],
      [
        'named and described',
        (host) => {
          host.ariaLabel.set('Loading orders');
          host.describedBy.set('hint');
        },
      ],
      [
        'sized to 2rem',
        (host) => {
          host.labelledBy.set('label');
          host.size.set('2rem');
        },
      ],
    ];

    describe.each<Scheme>(['light', 'dark'])('%s', (scheme) => {
      it.each(states)('has no axe violations: %s', async (_name, setup) => {
        const { element } = await render(scheme, setup);

        await expectNoAxeViolations(byId(element, 'box'));
      });

      it('has no axe violations with the reduced-motion rule applied', async () => {
        const { element } = await render(scheme);

        await withReducedMotion(async () => {
          await expectNoAxeViolations(byId(element, 'box'));
        });
      });
    });
  });

  describe('keyboard', () => {
    it('is not focusable: Tab passes from the button before it to the one after it', async () => {
      const { element } = await render();
      byId(element, 'before').focus();

      await userEvent.tab();

      expect(document.activeElement).toBe(byId(element, 'after'));
      expect(parts(element).host.querySelectorAll('[tabindex]')).toHaveLength(0);
    });

    it('Shift+Tab passes back over it too', async () => {
      const { element } = await render();
      byId(element, 'after').focus();

      await userEvent.tab({ shift: true });

      expect(document.activeElement).toBe(byId(element, 'before'));
    });
  });
});
