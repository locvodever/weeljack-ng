/// <reference types="@vitest/browser-playwright" />
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Component, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { cdp, userEvent } from 'vitest/browser';
import { provideWeeljack } from 'weeljack-ng';
import { WjIcon, wjIconDef, wjIconPlus, type WjIconDef } from 'weeljack-ng/icon';
import { WjIconHarness } from 'weeljack-ng/icon/testing';
import { expectNoAxeViolations } from '../spec-support/axe';

const PAYLOAD = '<img src=x onerror="window.wjInjected = true">';
const ROOT = document.documentElement;
type Scheme = 'light' | 'dark';

/** One def that uses all seven tags, each with the attributes its type allows. */
const ALL_TAGS: WjIconDef = wjIconDef('all-tags', '0 0 24 24', [
  ['path', { d: 'M1 1h2', fill: 'none', stroke: 'red' }],
  ['circle', { cx: 5, cy: 6, r: 2 }],
  ['ellipse', { cx: 9, cy: 9, rx: 3, ry: 2 }],
  ['rect', { x: 1, y: 2, width: 4, height: 5, rx: 1, ry: 1 }],
  ['line', { x1: 1, y1: 2, x2: 3, y2: 4 }],
  ['polyline', { points: '1,2 3,4 5,2' }],
  ['polygon', { points: '1,1 4,1 2,4' }],
]);

/** A filled glyph: its node paints itself as a solid shape. */
const FILLED: WjIconDef = wjIconDef('filled', '0 0 24 24', [
  ['path', { d: 'M4 4h16v16H4z', fill: 'currentColor', stroke: 'none' }],
]);

/** A consumer's template: every input bound, between two buttons, in a span with its own font. */
@Component({
  selector: 'wj-icon-host',
  imports: [WjIcon],
  template: `
    <button type="button" id="before">Before</button>
    <span id="box" [style.font-size.px]="fontSize()" [style.color]="color()">
      <wj-icon [icon]="icon()" [label]="label()" [spin]="spin()" />
    </span>
    <button type="button" id="after">After</button>
  `,
})
class Host {
  readonly icon = signal<WjIconDef>(wjIconPlus);
  readonly label = signal<string | undefined>(undefined);
  readonly spin = signal(false);
  readonly fontSize = signal(16);
  readonly color = signal('rgb(10, 20, 30)');
}

/** A labelled icon inside a button-like host, the way an icon-only button uses it. */
@Component({
  selector: 'wj-icon-button-host',
  imports: [WjIcon],
  template: ` <button type="button"><wj-icon [icon]="icon" label="Delete" /></button> `,
})
class ButtonHost {
  readonly icon = wjIconPlus;
}

interface Rendered {
  fixture: ComponentFixture<Host>;
  host: Host;
  icon: WjIconHarness;
  element: HTMLElement;
}

/** Sets the colour scheme and the theme before a component renders. */
function prepare(scheme: Scheme): void {
  ROOT.classList.toggle('wj-dark', scheme === 'dark');
  document.body.style.backgroundColor = 'var(--wj-content-background)';
  TestBed.configureTestingModule({ providers: [provideWeeljack({ darkMode: 'class' })] });
}

/** Renders `Host` with `provideWeeljack` in the given scheme, after `setup` ran. */
async function render(
  setup: (host: Host) => void = () => undefined,
  scheme: Scheme = 'light',
): Promise<Rendered> {
  prepare(scheme);
  const fixture = TestBed.createComponent(Host);
  setup(fixture.componentInstance);
  await fixture.whenStable();
  // A render without the theme's variables would pass axe for the wrong reason: fail loudly.
  expect(getComputedStyle(ROOT).getPropertyValue('--wj-text-color')).not.toBe('');
  return {
    fixture,
    host: fixture.componentInstance,
    icon: await TestbedHarnessEnvironment.loader(fixture).getHarness(WjIconHarness),
    element: fixture.nativeElement as HTMLElement,
  };
}

function query<T extends Element>(element: Element, selector: string, type: new () => T): T {
  const found = element.querySelector(selector);
  if (!(found instanceof type)) {
    throw new Error(`${selector} is missing`);
  }
  return found;
}

const svgOf = (element: HTMLElement): SVGSVGElement => query(element, 'svg', SVGSVGElement);
const hostOf = (element: HTMLElement): HTMLElement => query(element, 'wj-icon', HTMLElement);

/** Emulates the user's reduced-motion preference, or clears it. */
async function emulateReducedMotion(reduce: boolean): Promise<void> {
  await cdp().send('Emulation.setEmulatedMedia', {
    features: [{ name: 'prefers-reduced-motion', value: reduce ? 'reduce' : 'no-preference' }],
  });
}

describe('WjIcon', () => {
  afterEach(async () => {
    await emulateReducedMotion(false);
    ROOT.classList.remove('wj-dark');
    document.body.style.backgroundColor = '';
    document.head.querySelectorAll('style[data-optimus-style-id]').forEach((style) => {
      style.remove();
    });
    Reflect.deleteProperty(window, 'wjInjected');
  });

  describe('decorative', () => {
    it('is hidden from assistive technology when no label is set', async () => {
      const { element, icon } = await render();
      const svg = svgOf(element);

      expect(svg.getAttribute('aria-hidden')).toBe('true');
      expect(svg.hasAttribute('role')).toBe(false);
      expect(svg.hasAttribute('aria-label')).toBe(false);
      expect(svg.hasAttribute('focusable')).toBe(false);
      expect(await icon.isDecorative()).toBe(true);
      expect(await icon.getLabel()).toBeNull();
    });

    it('is decorative for an empty label too', async () => {
      const { element } = await render((host) => {
        host.label.set('');
      });
      const svg = svgOf(element);

      expect(svg.getAttribute('aria-hidden')).toBe('true');
      expect(svg.hasAttribute('role')).toBe(false);
      expect(svg.hasAttribute('aria-label')).toBe(false);
    });

    it('is never focusable', async () => {
      const { element } = await render();

      expect(hostOf(element).hasAttribute('tabindex')).toBe(false);
      expect(svgOf(element).hasAttribute('tabindex')).toBe(false);
    });
  });

  describe('labelled', () => {
    it('is an image with the label as its name', async () => {
      const { element, icon } = await render((host) => {
        host.label.set('Warning');
      });
      const svg = svgOf(element);

      expect(svg.getAttribute('role')).toBe('img');
      expect(svg.getAttribute('aria-label')).toBe('Warning');
      expect(svg.hasAttribute('aria-hidden')).toBe(false);
      expect(await icon.getLabel()).toBe('Warning');
      expect(await icon.isDecorative()).toBe(false);
    });

    it('follows the label as it changes and clears', async () => {
      const { element, host, fixture } = await render((h) => {
        h.label.set('Warning');
      });

      host.label.set('Error');
      await fixture.whenStable();
      expect(svgOf(element).getAttribute('aria-label')).toBe('Error');

      host.label.set(undefined);
      await fixture.whenStable();
      const svg = svgOf(element);
      expect(svg.getAttribute('aria-hidden')).toBe('true');
      expect(svg.hasAttribute('role')).toBe(false);
      expect(svg.hasAttribute('aria-label')).toBe(false);
    });

    it('renders an HTML payload as text, never as markup', async () => {
      const { element } = await render((host) => {
        host.label.set(PAYLOAD);
      });

      expect(svgOf(element).getAttribute('aria-label')).toBe(PAYLOAD);
      expect(element.querySelector('img')).toBeNull();
      expect(Reflect.get(window, 'wjInjected')).toBeUndefined();
    });
  });

  describe('rendering', () => {
    it('draws an svg with the def, its viewBox and the default paint', async () => {
      const { element, icon } = await render();
      const svg = svgOf(element);

      expect(svg.getAttribute('width')).toBe('1em');
      expect(svg.getAttribute('height')).toBe('1em');
      expect(svg.getAttribute('viewBox')).toBe('0 0 24 24');
      expect(svg.getAttribute('stroke')).toBe('currentColor');
      expect(svg.getAttribute('fill')).toBe('none');
      expect(hostOf(element).getAttribute('data-icon')).toBe('plus');
      expect(await icon.getName()).toBe('plus');
      expect(await icon.getShapeCount()).toBe(2);
    });

    it('takes the viewBox of the def', async () => {
      const { element } = await render((host) => {
        host.icon.set(wjIconDef('wide', '0 0 48 24', [['path', { d: 'M0 0h48' }]]));
      });

      expect(svgOf(element).getAttribute('viewBox')).toBe('0 0 48 24');
    });

    for (const size of [16, 32]) {
      it(`is as tall and wide as the font at ${String(size)}px`, async () => {
        const { element } = await render((host) => {
          host.fontSize.set(size);
        });
        const box = svgOf(element).getBoundingClientRect();

        expect(box.width).toBe(size);
        expect(box.height).toBe(size);
      });
    }

    it('draws in the colour of its text', async () => {
      const { element, host, fixture } = await render();

      expect(getComputedStyle(svgOf(element)).stroke).toBe('rgb(10, 20, 30)');

      host.color.set('rgb(200, 0, 0)');
      await fixture.whenStable();
      expect(getComputedStyle(svgOf(element)).stroke).toBe('rgb(200, 0, 0)');
    });
  });

  describe('custom defs', () => {
    it('draws all seven tags with exactly the attributes the nodes set', async () => {
      const { element, icon } = await render((host) => {
        host.icon.set(ALL_TAGS);
      });
      const shapes = Array.from(svgOf(element).children);

      expect(await icon.getShapeCount()).toBe(7);
      expect(shapes.map((shape) => shape.tagName)).toEqual([
        'path',
        'circle',
        'ellipse',
        'rect',
        'line',
        'polyline',
        'polygon',
      ]);
      expect(shapes.every((shape) => shape instanceof SVGElement)).toBe(true);
      expect(
        shapes.map((shape) =>
          shape
            .getAttributeNames()
            .filter((name) => !name.startsWith('_ng'))
            .sort(),
        ),
      ).toEqual([
        ['d', 'fill', 'stroke'],
        ['cx', 'cy', 'r'],
        ['cx', 'cy', 'rx', 'ry'],
        ['height', 'rx', 'ry', 'width', 'x', 'y'],
        ['x1', 'x2', 'y1', 'y2'],
        ['points'],
        ['points'],
      ]);
      expect(shapes[0]?.getAttribute('stroke')).toBe('red');
      expect(shapes[3]?.getAttribute('width')).toBe('4');
      expect(shapes[5]?.getAttribute('points')).toBe('1,2 3,4 5,2');
    });

    it('draws a filled def with its paint attributes', async () => {
      const { element } = await render((host) => {
        host.icon.set(FILLED);
      });
      const path = query(element, 'svg > path', SVGPathElement);

      expect(path.getAttribute('fill')).toBe('currentColor');
      expect(path.getAttribute('stroke')).toBe('none');
    });

    it('swaps the drawing when the def changes', async () => {
      const { element, host, fixture, icon } = await render();

      host.icon.set(ALL_TAGS);
      await fixture.whenStable();

      expect(await icon.getName()).toBe('all-tags');
      expect(element.querySelectorAll('svg > *')).toHaveLength(7);
    });

    it('returns what wjIconDef was given', () => {
      const nodes = [['path', { d: 'M0 0' }]] as const;
      const def = wjIconDef('mine', '0 0 8 8', nodes);

      expect(def).toEqual({ name: 'mine', viewBox: '0 0 8 8', nodes });
      expect(def.nodes).toBe(nodes);
    });
  });

  describe('spin', () => {
    it('turns the host and sets its class', async () => {
      const { element, icon } = await render((host) => {
        host.spin.set(true);
      });

      expect(await icon.isSpinning()).toBe(true);
      expect(getComputedStyle(hostOf(element)).animationName).toBe('wj-icon-spin');
    });

    it('stands still under reduced motion', async () => {
      await emulateReducedMotion(true);
      const { element, icon } = await render((host) => {
        host.spin.set(true);
      });

      expect(await icon.isSpinning()).toBe(true);
      expect(getComputedStyle(hostOf(element)).animationName).toBe('none');
    });

    it('does not turn without spin', async () => {
      const { element, icon } = await render();

      expect(await icon.isSpinning()).toBe(false);
      expect(getComputedStyle(hostOf(element)).animationName).toBe('none');
    });

    it('does not turn without spin under reduced motion either', async () => {
      await emulateReducedMotion(true);
      const { element } = await render();

      expect(getComputedStyle(hostOf(element)).animationName).toBe('none');
    });
  });

  describe('keyboard', () => {
    it('is skipped by Tab: a button before it leads to the button after it', async () => {
      const { element } = await render();
      const before = query(element, '#before', HTMLButtonElement);
      before.focus();
      await expect.poll(() => document.activeElement).toBe(before);

      await userEvent.tab();

      await expect.poll(() => document.activeElement?.id).toBe('after');
      expect(document.activeElement).not.toBe(hostOf(element));
      expect(document.activeElement).not.toBe(svgOf(element));
    });
  });

  describe('accessibility (axe)', () => {
    const STATES: [string, (host: Host) => void][] = [
      ['decorative', () => undefined],
      [
        'labelled',
        (host) => {
          host.label.set('Warning');
        },
      ],
      [
        'spinning',
        (host) => {
          host.spin.set(true);
        },
      ],
      [
        'custom filled',
        (host) => {
          host.icon.set(FILLED);
          host.label.set('Filled square');
        },
      ],
    ];

    for (const scheme of ['light', 'dark'] as const) {
      for (const [name, setup] of STATES) {
        it(`${name} has no violations in ${scheme}`, async () => {
          const { element } = await render(setup, scheme);

          await expectNoAxeViolations(element);
        });
      }

      it(`inside a button-like host has no violations in ${scheme}`, async () => {
        prepare(scheme);
        const fixture = TestBed.createComponent(ButtonHost);
        await fixture.whenStable();

        await expectNoAxeViolations(fixture.nativeElement as HTMLElement);
      });
    }
  });
});
