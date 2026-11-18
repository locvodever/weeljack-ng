import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Component, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import type { MockInstance } from 'vitest';
import { userEvent } from 'vitest/browser';
import { provideWeeljack } from 'weeljack-ng';
import {
  WjProgressBar,
  type WjProgressBarMode,
  type WjProgressBarPt,
} from 'weeljack-ng/progressbar';
import { WjProgressBarHarness } from 'weeljack-ng/progressbar/testing';
import { expectNoAxeViolations, runAxe } from '../spec-support/axe';

const PAYLOAD = '<img src=x onerror="window.wjInjected = true">';
const ROOT = document.documentElement;
const WJ0160 =
  'WJ0160: wj-progressbar: the indicator has no accessible name. Set ariaLabel, or ' +
  'ariaLabelledBy to the id of its visible label. ' +
  'Find more at https://locvodever.github.io/weeljack-ng/errors/WJ0160';

/** A consumer's template: one bar between two buttons, with visible text to name and describe it by. */
@Component({
  selector: 'wj-progressbar-host',
  imports: [WjProgressBar],
  template: `
    <button type="button" id="before">Before</button>
    <div id="box">
      <span id="label">Uploading report.pdf</span>
      <span id="hint">3 of 5 files uploaded</span>
      <wj-progressbar
        [value]="value()"
        [mode]="mode()"
        [showValue]="showValue()"
        [ariaLabel]="ariaLabel()"
        [ariaLabelledBy]="labelledBy()"
        [ariaDescribedBy]="describedBy()"
        [pt]="pt()"
      />
    </div>
    <button type="button" id="after">After</button>
  `,
})
class Host {
  readonly value = signal<number | string | undefined>(undefined);
  readonly mode = signal<WjProgressBarMode>('determinate');
  readonly showValue = signal(true);
  readonly ariaLabel = signal<string | undefined>(undefined);
  readonly labelledBy = signal<string | undefined>(undefined);
  readonly describedBy = signal<string | undefined>(undefined);
  readonly pt = signal<WjProgressBarPt>(undefined);
}

/** A bar with a name and nothing else: every other input is at its default. */
@Component({
  selector: 'wj-progressbar-bare-host',
  imports: [WjProgressBar],
  template: `<wj-progressbar ariaLabel="Uploading" />`,
})
class BareHost {}

/** Two bars with no name: a missing one and an empty one. */
@Component({
  selector: 'wj-progressbar-unnamed-host',
  imports: [WjProgressBar],
  template: `
    <wj-progressbar />
    <wj-progressbar ariaLabel="" />
  `,
})
class UnnamedHost {}

/** One bar named by `ariaLabel`, one by `ariaLabelledBy`. */
@Component({
  selector: 'wj-progressbar-named-host',
  imports: [WjProgressBar],
  template: `
    <span id="named-by">Uploading</span>
    <wj-progressbar ariaLabel="Uploading" />
    <wj-progressbar ariaLabelledBy="named-by" />
  `,
})
class NamedHost {}

/** A consumer who writes `aria-label` on the host. */
@Component({
  selector: 'wj-progressbar-aria-host',
  imports: [WjProgressBar],
  template: `<wj-progressbar aria-label="Uploading" ariaLabel="Uploading" />`,
})
class AriaOnHostHost {}

/** Two bars side by side in a harness search: told apart by name. */
@Component({
  selector: 'wj-progressbar-pair-host',
  imports: [WjProgressBar],
  template: `
    <span id="first-name">First upload</span>
    <wj-progressbar ariaLabelledBy="first-name" [value]="25" />
    <wj-progressbar ariaLabel="Second upload" mode="indeterminate" />
  `,
})
class PairHost {}

type Scheme = 'light' | 'dark';

interface Rendered {
  fixture: ComponentFixture<Host>;
  host: Host;
  bar: WjProgressBarHarness;
  element: HTMLElement;
}

/** Renders the host with `provideWeeljack`, in the given colour scheme, after `setup` ran. */
async function render(
  scheme: Scheme = 'light',
  setup: (host: Host) => void = (host) => {
    host.labelledBy.set('label');
  },
): Promise<Rendered> {
  ROOT.classList.toggle('wj-dark', scheme === 'dark');
  document.body.style.backgroundColor = 'var(--wj-content-background)';
  TestBed.configureTestingModule({ providers: [provideWeeljack({ darkMode: 'class' })] });
  const fixture = TestBed.createComponent(Host);
  setup(fixture.componentInstance);
  await fixture.whenStable();
  const element = fixture.nativeElement as HTMLElement;
  const bar = await TestbedHarnessEnvironment.loader(fixture).getHarness(WjProgressBarHarness);
  // A render without Optimus's styles would pass for the wrong reason: fail loudly instead.
  expect(getComputedStyle(parts(element).bar).position).toBe('relative');
  return { fixture, host: fixture.componentInstance, bar, element };
}

function find<E extends Element>(element: ParentNode, selector: string, type: new () => E): E {
  const found = element.querySelector(selector);
  if (!(found instanceof type)) {
    throw new Error(`${selector} is missing`);
  }
  return found;
}

/** The `wj-progressbar` host, Optimus's `progressbar` element inside it, and its fill. */
function parts(element: ParentNode): { host: HTMLElement; bar: HTMLElement; fill: HTMLElement } {
  const host = find(element, 'wj-progressbar', HTMLElement);
  return {
    host,
    bar: find(host, 'p-progressbar', HTMLElement),
    fill: find(host, '.p-progressbar-value', HTMLElement),
  };
}

const attributeOf = (element: HTMLElement, name: string): string | null =>
  parts(element).bar.getAttribute(name);

const byId = (element: HTMLElement, id: string): HTMLElement =>
  find(element, `#${id}`, HTMLElement);

/** The reduced-motion media rule that carries the fill's transition reset. */
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
            inner instanceof CSSStyleRule && inner.selectorText.includes('p-progressbar-value'),
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
    throw new Error('the progress bar reduced-motion rule is missing');
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
 * that the component's stylesheet put in the document keeps its position in the cascade, in
 * `@layer wj` before Optimus's own style, exactly as shipped, and only its condition is widened to
 * `all`. So the rendered outcome is the real cascade's, and the shared browser page is untouched
 * (a CDP media emulation would leak into concurrent spec files). The condition is put back in
 * `finally`.
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

/** `variable` (a `--wj-*` custom property) as the computed colour a painted box would show. */
function colourOf(variable: string): string {
  const probe = document.body.appendChild(document.createElement('i'));
  probe.style.backgroundColor = `var(${variable})`;
  const colour = getComputedStyle(probe).backgroundColor;
  probe.remove();
  return colour;
}

const transitionDuration = (element: HTMLElement): string =>
  getComputedStyle(parts(element).fill).transitionDuration;

describe('WjProgressBar', () => {
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
    it('with no inputs but a name it is a determinate bar at 0, with the value shown', async () => {
      ROOT.classList.remove('wj-dark');
      TestBed.configureTestingModule({ providers: [provideWeeljack({ darkMode: 'class' })] });
      const fixture = TestBed.createComponent(BareHost);
      await fixture.whenStable();
      const element = fixture.nativeElement as HTMLElement;
      const bar = await TestbedHarnessEnvironment.loader(fixture).getHarness(WjProgressBarHarness);
      const { host, bar: root, fill } = parts(element);

      expect(getComputedStyle(host).display).toBe('block');
      expect(root.getAttribute('role')).toBe('progressbar');
      expect(root.getAttribute('aria-valuemin')).toBe('0');
      expect(root.getAttribute('aria-valuemax')).toBe('100');
      expect(root.getAttribute('aria-valuenow')).toBe('0');
      expect(root.classList.contains('p-progressbar-determinate')).toBe(true);
      expect(root.hasAttribute('aria-level')).toBe(false);
      expect(fill.style.width).toBe('0%');
      expect(await bar.getValue()).toBe(0);
      expect(await bar.getMode()).toBe('determinate');
      // The label is there (showValue defaults to true), but Optimus hides it at 0.
      expect(await bar.getDisplayedValue()).toBeNull();
      expect(find(host, '.p-progressbar-label', HTMLElement).textContent.trim()).toBe('0%');
    });

    it('shows the value by default: a bare bar at 40 reads "40%"', async () => {
      const { bar } = await render('light', (host) => {
        host.labelledBy.set('label');
        host.value.set(40);
      });

      expect(await bar.getDisplayedValue()).toBe('40%');
    });

    it('draws Optimus’s 20 px track with an ink fill, the host adding no box of its own', async () => {
      const { element } = await render('light', (host) => {
        host.labelledBy.set('label');
        host.value.set(40);
      });
      const { host, bar, fill } = parts(element);
      const own = getComputedStyle(host);

      expect(bar.getBoundingClientRect().height).toBe(20);
      expect(bar.getBoundingClientRect().width).toBe(host.getBoundingClientRect().width);
      expect(getComputedStyle(fill).backgroundColor).toBe(colourOf('--wj-primary-color'));
      expect(getComputedStyle(bar).backgroundColor).toBe(colourOf('--wj-content-border-color'));
      for (const property of ['padding', 'borderTopWidth', 'backgroundColor'] as const) {
        expect(own[property]).toMatch(/^(0px|rgba\(0, 0, 0, 0\))$/);
      }
    });
  });

  describe('value, mode and showValue', () => {
    it('shows "40%" inside the fill at value 40, and moves with it', async () => {
      const { host, bar, element } = await render('light', (initial) => {
        initial.labelledBy.set('label');
        initial.value.set(40);
      });

      expect(await bar.getDisplayedValue()).toBe('40%');
      expect(await bar.getValue()).toBe(40);
      expect(parts(element).fill.style.width).toBe('40%');

      host.value.set(75);

      await expect.poll(() => bar.getDisplayedValue()).toBe('75%');
      expect(await bar.getValue()).toBe(75);
      expect(parts(element).fill.style.width).toBe('75%');
    });

    it('reads a numeric string as a number, and nonsense as 0', async () => {
      const { host, bar } = await render('light', (initial) => {
        initial.labelledBy.set('label');
        initial.value.set('30');
      });
      expect(await bar.getValue()).toBe(30);

      host.value.set('lots');

      await expect.poll(() => bar.getValue()).toBe(0);
    });

    it('showValue off hides the "40%" and keeps the value for assistive technology', async () => {
      const { bar } = await render('light', (host) => {
        host.labelledBy.set('label');
        host.value.set(60);
        host.showValue.set(false);
      });

      expect(await bar.getDisplayedValue()).toBeNull();
      expect(await bar.getValue()).toBe(60);
    });

    it('indeterminate shows no value and no aria-valuenow, whatever value is set', async () => {
      const { element, bar } = await render('light', (host) => {
        host.labelledBy.set('label');
        host.mode.set('indeterminate');
        host.value.set(70);
      });
      const root = parts(element).bar;

      expect(root.classList.contains('p-progressbar-indeterminate')).toBe(true);
      expect(root.hasAttribute('aria-valuenow')).toBe(false);
      expect(root.getAttribute('aria-valuemin')).toBe('0');
      expect(root.getAttribute('aria-valuemax')).toBe('100');
      expect(root.hasAttribute('aria-valuetext')).toBe(false);
      expect(await bar.getValue()).toBeNull();
      expect(await bar.getMode()).toBe('indeterminate');
      expect(await bar.getDisplayedValue()).toBeNull();
    });
  });

  describe('aria-level (FR-24)', () => {
    /** The attributes Optimus's template could leave on the element, read together. */
    const snapshot = (element: HTMLElement): Record<string, string | null> => ({
      level: attributeOf(element, 'aria-level'),
      now: attributeOf(element, 'aria-valuenow'),
      text: attributeOf(element, 'aria-valuetext'),
    });

    it('is absent on first render, determinate and indeterminate', async () => {
      const determinate = await render('light', (host) => {
        host.labelledBy.set('label');
        host.value.set(40);
      });
      expect(determinate.element.querySelector('[aria-level]')).toBeNull();
      TestBed.resetTestingModule();

      const indeterminate = await render('light', (host) => {
        host.labelledBy.set('label');
        host.mode.set('indeterminate');
      });
      expect(indeterminate.element.querySelector('[aria-level]')).toBeNull();
    });

    it('stays absent after the value moves 10, 60, 100, to indeterminate and back', async () => {
      const { host, element, fixture } = await render('light', (initial) => {
        initial.labelledBy.set('label');
        initial.value.set(10);
      });
      expect(snapshot(element)).toEqual({ level: null, now: '10', text: '10%' });

      host.value.set(60);
      await expect.poll(() => snapshot(element)).toEqual({ level: null, now: '60', text: '60%' });

      host.value.set(100);
      await expect.poll(() => snapshot(element)).toEqual({ level: null, now: '100', text: '100%' });

      host.mode.set('indeterminate');
      await expect.poll(() => snapshot(element)).toEqual({ level: null, now: null, text: null });

      host.mode.set('determinate');
      host.value.set(40);
      await expect.poll(() => snapshot(element)).toEqual({ level: null, now: '40', text: '40%' });

      host.value.set(0);
      await expect.poll(() => snapshot(element)).toEqual({ level: null, now: '0', text: '0%' });

      // Once more after everything has settled: nothing re-added it late.
      await fixture.whenStable();
      expect(element.querySelector('[aria-level]')).toBeNull();
    });

    it('stays absent over many rapid value changes', async () => {
      const { host, element } = await render('light', (initial) => {
        initial.labelledBy.set('label');
        initial.value.set(1);
      });

      for (let value = 2; value <= 30; value += 1) {
        host.value.set(value);
        await expect
          .poll(() => snapshot(element))
          .toEqual({ level: null, now: String(value), text: `${String(value)}%` });
      }
    });

    it('stays absent when the host sets the value to the same number again', async () => {
      const { host, element, fixture } = await render('light', (initial) => {
        initial.labelledBy.set('label');
        initial.value.set(50);
      });

      host.value.set(50);
      host.value.set(51);
      host.value.set(50);
      await fixture.whenStable();

      expect(snapshot(element)).toEqual({ level: null, now: '50', text: '50%' });
    });

    it('is not axe-flagged (aria-allowed-attr) at each step of the sequence', async () => {
      const { host, element } = await render('light', (initial) => {
        initial.labelledBy.set('label');
        initial.value.set(10);
      });
      const steps: [string, () => void, string | null][] = [
        ['10', () => undefined, '10'],
        [
          '60',
          () => {
            host.value.set(60);
          },
          '60',
        ],
        [
          '100',
          () => {
            host.value.set(100);
          },
          '100',
        ],
        [
          'indeterminate',
          () => {
            host.mode.set('indeterminate');
          },
          null,
        ],
        [
          'back',
          () => {
            host.mode.set('determinate');
            host.value.set(40);
          },
          '40',
        ],
      ];

      for (const [, move, now] of steps) {
        move();
        await expect.poll(() => attributeOf(element, 'aria-valuenow')).toBe(now);
        const violations = await runAxe(byId(element, 'box'));
        expect(violations.map((violation) => violation.id)).toEqual([]);
      }
    });
  });

  describe('name and description', () => {
    it('ariaLabel lands on the progressbar element, and clears with it', async () => {
      const { host, element } = await render('light', (initial) => {
        initial.ariaLabel.set('Uploading report');
      });
      expect(attributeOf(element, 'aria-label')).toBe('Uploading report');

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

    it('clears a routed id once the input goes, after several value changes', async () => {
      const { host, element } = await render('light', (initial) => {
        initial.labelledBy.set('label');
        initial.describedBy.set('hint');
        initial.value.set(10);
      });

      host.value.set(20);
      host.labelledBy.set('hint');
      await expect.poll(() => attributeOf(element, 'aria-labelledby')).toBe('hint');
      host.labelledBy.set(undefined);
      await expect.poll(() => attributeOf(element, 'aria-labelledby')).toBeNull();
      host.describedBy.set(undefined);
      await expect.poll(() => attributeOf(element, 'aria-describedby')).toBeNull();
      host.value.set(90);
      host.labelledBy.set('label');
      host.describedBy.set('label');
      await expect.poll(() => attributeOf(element, 'aria-labelledby')).toBe('label');
      expect(attributeOf(element, 'aria-describedby')).toBe('label');
      expect(attributeOf(element, 'aria-valuenow')).toBe('90');
      expect(attributeOf(element, 'aria-level')).toBeNull();
    });

    it('puts no role and no aria-* on the wj-progressbar host itself', async () => {
      const { element } = await render('light', (host) => {
        host.labelledBy.set('label');
        host.describedBy.set('hint');
        host.value.set(40);
      });
      const { host } = parts(element);

      expect(host.hasAttribute('role')).toBe(false);
      expect(host.getAttributeNames().filter((name) => name.startsWith('aria-'))).toEqual([]);
      expect(warn).not.toHaveBeenCalled();
    });

    it('names the bar by its visible label', async () => {
      const { element, bar } = await render('light', (host) => {
        host.labelledBy.set('label');
      });

      expect(byId(element, 'label').textContent).toBe('Uploading report.pdf');
      expect(attributeOf(element, 'aria-label')).toBeNull();
      expect(await bar.getAccessibleName()).toBe('Uploading report.pdf');
    });
  });

  describe('pt', () => {
    it('reaches the inner parts, as an object', async () => {
      const { element } = await render('light', (host) => {
        host.labelledBy.set('label');
        host.value.set(40);
        host.pt.set({
          value: { 'data-probe': 'value' },
          label: { 'data-probe': 'label' },
        });
      });

      expect(find(element, '[data-probe="value"]', HTMLElement)).toBe(parts(element).fill);
      expect(find(element, '[data-probe="label"]', HTMLElement).className).toContain(
        'p-progressbar-label',
      );
    });

    it('reaches the inner parts, as a function with a function part', async () => {
      const { element } = await render('light', (host) => {
        host.labelledBy.set('label');
        host.pt.set(() => ({ value: () => ({ 'data-probe': 'fn' }) }));
      });

      expect(find(element, '[data-probe="fn"]', HTMLElement)).toBe(parts(element).fill);
    });

    it('keeps the consumer host keys beside the routed ones', async () => {
      const { element } = await render('light', (host) => {
        host.labelledBy.set('label');
        host.value.set(40);
        host.pt.set({ host: { 'data-probe': 'host', title: 'Upload' } });
      });

      expect(attributeOf(element, 'data-probe')).toBe('host');
      expect(attributeOf(element, 'title')).toBe('Upload');
      expect(attributeOf(element, 'aria-labelledby')).toBe('label');
      expect(attributeOf(element, 'aria-level')).toBeNull();
    });

    it('keeps the consumer host keys of a function pt, and across value changes', async () => {
      const { host, element } = await render('light', (initial) => {
        initial.describedBy.set('hint');
        initial.labelledBy.set('label');
        initial.pt.set(() => ({ host: { 'data-probe': 'fn-host' } }));
      });
      expect(attributeOf(element, 'data-probe')).toBe('fn-host');
      expect(attributeOf(element, 'aria-describedby')).toBe('hint');

      host.value.set(55);

      await expect.poll(() => attributeOf(element, 'aria-valuenow')).toBe('55');
      expect(attributeOf(element, 'data-probe')).toBe('fn-host');
      expect(attributeOf(element, 'aria-level')).toBeNull();
    });

    it('lets the routed id win over a consumer key of the same name', async () => {
      const { element } = await render('light', (host) => {
        host.labelledBy.set('label');
        host.pt.set({ host: { 'aria-labelledby': 'other' } });
      });

      expect(attributeOf(element, 'aria-labelledby')).toBe('label');
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

    it('stays silent when the bar is named by ariaLabel or by ariaLabelledBy', async () => {
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
        initial.ariaLabel.set('Uploading');
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
        'WJ0003: wj-progressbar: aria-label is set on the host, where it is not forwarded to ' +
          'the focusable element. Use the ariaLabel, ariaLabelledBy or ariaDescribedBy input ' +
          'instead. Find more at https://locvodever.github.io/weeljack-ng/errors/WJ0003',
      );
    });

    it('warns WJ0001 when provideWeeljack is missing', async () => {
      const fixture = TestBed.createComponent(NamedHost);
      await fixture.whenStable();

      expect(warn).toHaveBeenCalledTimes(1);
      expect(warn).toHaveBeenCalledWith(
        'WJ0001: wj-progressbar: provideWeeljack() is missing from the application providers. ' +
          'Add provideWeeljack() to your application config. ' +
          'Find more at https://locvodever.github.io/weeljack-ng/errors/WJ0001',
      );
    });

    it('reports the name, the description ids and the value through the harness', async () => {
      const { bar, host } = await render('light', (initial) => {
        initial.ariaLabel.set('Uploading report');
        initial.describedBy.set('hint');
        initial.value.set(40);
      });

      expect(await bar.getAriaAttributes()).toEqual({
        label: 'Uploading report',
        labelledBy: null,
        describedBy: 'hint',
      });
      expect(await bar.getAccessibleName()).toBe('Uploading report');

      host.ariaLabel.set(undefined);
      host.labelledBy.set('label');
      host.describedBy.set(undefined);

      await expect
        .poll(() => bar.getAriaAttributes())
        .toEqual({ label: null, labelledBy: 'label', describedBy: null });
    });

    it('finds a bar by its accessible name through the harness', async () => {
      TestBed.configureTestingModule({ providers: [provideWeeljack()] });
      const fixture = TestBed.createComponent(PairHost);
      const loader = TestbedHarnessEnvironment.loader(fixture);
      await fixture.whenStable();

      const first = await loader.getHarness(WjProgressBarHarness.with({ label: 'First upload' }));
      const second = await loader.getHarness(WjProgressBarHarness.with({ label: /^second/i }));

      expect(await first.getValue()).toBe(25);
      expect(await second.getMode()).toBe('indeterminate');
      expect(await loader.getAllHarnesses(WjProgressBarHarness)).toHaveLength(2);
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
      expect(element.querySelector('wj-progressbar img')).toBeNull();
      expect(document.querySelector('img[src="x"]')).toBeNull();
      expect(Reflect.get(window, 'wjInjected')).toBeUndefined();
    });
  });

  describe('reduced motion (FR-25)', () => {
    const settled = async (rendered: Rendered, value: number): Promise<void> => {
      rendered.host.value.set(value);
      await expect.poll(() => parts(rendered.element).fill.style.width).toBe(`${String(value)}%`);
    };

    it('eases the fill’s width over 1 s without the preference', async () => {
      const { element } = await render('light', (host) => {
        host.labelledBy.set('label');
        host.value.set(40);
      });

      expect(transitionDuration(element)).toBe('1s');
      expect(getComputedStyle(parts(element).fill).transitionProperty).toBe('width');
    });

    it('holds the rule in the wj layer, inside the reduced-motion media block', async () => {
      await render();

      const rule = reducedMotionRule();

      expect(layerOf(rule)).toEqual(['wj']);
      expect(rule.conditionText).toContain('prefers-reduced-motion: reduce');
    });

    it('drops the transition to 0s on a rendered bar, and the control run puts it back', async () => {
      const rendered = await render('light', (host) => {
        host.labelledBy.set('label');
        host.value.set(40);
      });

      await withReducedMotion(async () => {
        expect(transitionDuration(rendered.element)).toBe('0s');
        await settled(rendered, 90);
        // The fill is already at its new width, with no ease to wait for.
        expect(parts(rendered.element).fill.getBoundingClientRect().width).toBeCloseTo(
          parts(rendered.element).bar.getBoundingClientRect().width * 0.9,
          0,
        );
      });

      // The condition is back: the fill eases again, so nothing leaked past the proof.
      expect(transitionDuration(rendered.element)).toBe('1s');
    });

    it('keeps the indeterminate sweep running under reduced motion', async () => {
      const { element } = await render('light', (host) => {
        host.labelledBy.set('label');
        host.mode.set('indeterminate');
      });

      await withReducedMotion(async () => {
        const sweeps = getComputedStyle(parts(element).fill, '::before').animationName;
        expect(sweeps).toBe('p-progressbar-indeterminate-anim');
        await expect
          .poll(() => element.getAnimations({ subtree: true }).length)
          .toBeGreaterThanOrEqual(2);
      });
    });
  });

  describe('accessibility', () => {
    const states: [string, (host: Host) => void][] = [
      [
        'at 0',
        (host) => {
          host.labelledBy.set('label');
          host.value.set(0);
        },
      ],
      [
        'at 40',
        (host) => {
          host.labelledBy.set('label');
          host.value.set(40);
        },
      ],
      [
        'at 100',
        (host) => {
          host.labelledBy.set('label');
          host.value.set(100);
        },
      ],
      [
        'indeterminate',
        (host) => {
          host.labelledBy.set('label');
          host.mode.set('indeterminate');
        },
      ],
      [
        'showValue off',
        (host) => {
          host.labelledBy.set('label');
          host.value.set(60);
          host.showValue.set(false);
        },
      ],
      [
        'named with ariaLabel and described',
        (host) => {
          host.ariaLabel.set('Uploading report');
          host.describedBy.set('hint');
          host.value.set(40);
        },
      ],
    ];

    describe.each<Scheme>(['light', 'dark'])('%s', (scheme) => {
      it.each(states)('has no axe violations: %s', async (_name, setup) => {
        const { element } = await render(scheme, setup);

        await expectNoAxeViolations(byId(element, 'box'));
      });

      it('has no axe violations with the reduced-motion rule applied', async () => {
        const { element } = await render(scheme, (host) => {
          host.labelledBy.set('label');
          host.value.set(40);
        });

        await withReducedMotion(async () => {
          await expectNoAxeViolations(byId(element, 'box'));
        });
      });

      it('has no axe violations after the value has moved', async () => {
        const { host, element } = await render(scheme, (initial) => {
          initial.labelledBy.set('label');
          initial.value.set(10);
        });

        host.value.set(60);
        await expect.poll(() => attributeOf(element, 'aria-valuenow')).toBe('60');
        host.value.set(100);
        await expect.poll(() => attributeOf(element, 'aria-valuenow')).toBe('100');
        // Wait out the 1 s ease so the label is measured on its settled fill.
        await expect
          .poll(() => getComputedStyle(parts(element).fill).width, { timeout: 3000 })
          .toBe(`${String(parts(element).bar.getBoundingClientRect().width)}px`);

        await expectNoAxeViolations(byId(element, 'box'));
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
