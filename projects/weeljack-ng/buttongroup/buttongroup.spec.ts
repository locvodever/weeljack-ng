import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Component, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import type { MockInstance } from 'vitest';
import { userEvent } from 'vitest/browser';
import { provideWeeljack } from 'weeljack-ng';
import { WjButton } from 'weeljack-ng/button';
import { WjButtonHarness } from 'weeljack-ng/button/testing';
import { WjButtonGroup } from 'weeljack-ng/buttongroup';
import { WjButtonGroupHarness } from 'weeljack-ng/buttongroup/testing';
import { expectNoAxeViolations } from '../spec-support/axe';

const PAYLOAD = '<img src=x onerror="window.wjInjected = true">';
const ROOT = document.documentElement;

interface Item {
  label: string;
  disabled?: boolean;
}

const ITEMS: Item[] = [{ label: 'Previous' }, { label: 'Today' }, { label: 'Next' }];

/** A consumer's template: a group of buttons between two native buttons. */
@Component({
  selector: 'wj-buttongroup-host',
  imports: [WjButtonGroup, WjButton],
  template: `
    <div [attr.dir]="dir()" [style.inline-size]="width()">
      <button type="button" id="before">Before</button>
      <wj-buttongroup [ariaLabel]="ariaLabel()" [ariaLabelledBy]="ariaLabelledBy()">
        @for (item of items(); track item.label) {
          <wj-button
            [label]="item.label"
            [disabled]="item.disabled ?? false"
            severity="secondary"
            variant="outlined"
            (click)="clicked.update((all) => [...all, item.label])"
          />
        }
      </wj-buttongroup>
      <button type="button" id="after">After</button>
      <span id="heading">Date navigation</span>
    </div>
  `,
})
class Host {
  readonly items = signal<Item[]>(ITEMS);
  readonly ariaLabel = signal<string | undefined>('Date navigation');
  readonly ariaLabelledBy = signal<string | undefined>(undefined);
  readonly dir = signal<'ltr' | 'rtl'>('ltr');
  readonly width = signal<string | undefined>(undefined);
  readonly clicked = signal<string[]>([]);
}

/** A consumer who writes aria-* on the host: it is not forwarded. */
@Component({
  selector: 'wj-buttongroup-aria-on-host-host',
  imports: [WjButtonGroup, WjButton],
  template: `<wj-buttongroup aria-label="Nav"><wj-button label="One" /></wj-buttongroup>`,
})
class AriaOnHostHost {}

/** A group rendered without `provideWeeljack`. */
@Component({
  selector: 'wj-buttongroup-routed-host',
  imports: [WjButtonGroup, WjButton],
  template: `<wj-buttongroup><wj-button label="One" /></wj-buttongroup>`,
})
class RoutedHost {}

type Scheme = 'light' | 'dark';

interface Rendered {
  fixture: ComponentFixture<Host>;
  component: Host;
  element: HTMLElement;
}

/** Renders `Host` with `provideWeeljack` in the given scheme, after `setup` ran. */
async function render(
  setup: (host: Host) => void = () => undefined,
  scheme: Scheme = 'light',
): Promise<Rendered> {
  ROOT.classList.toggle('wj-dark', scheme === 'dark');
  document.body.style.backgroundColor = 'var(--wj-content-background)';
  TestBed.configureTestingModule({ providers: [provideWeeljack({ darkMode: 'class' })] });
  const fixture = TestBed.createComponent(Host);
  setup(fixture.componentInstance);
  await fixture.whenStable();
  const element = fixture.nativeElement as HTMLElement;
  // A render without Optimus's styles would pass for the wrong reason: fail loudly instead.
  if (fixture.componentInstance.items().length > 0) {
    expect(find(element, 'p-button', HTMLElement).getBoundingClientRect().height).toBeGreaterThan(
      0,
    );
  }
  // Keep the pointer off every button: a hovered button restyles its border.
  await userEvent.hover(find(element, '#heading', HTMLElement));
  return { fixture, component: fixture.componentInstance, element };
}

function find<E extends Element>(element: HTMLElement, selector: string, type: new () => E): E {
  const found = element.querySelector(selector);
  if (!(found instanceof type)) {
    throw new Error(`${selector} is missing`);
  }
  return found;
}

const groupOf = (element: HTMLElement): HTMLElement => find(element, 'wj-buttongroup', HTMLElement);

/** Optimus's element that carries `role="group"`. */
const spanOf = (element: HTMLElement): HTMLElement => find(element, '[role="group"]', HTMLElement);

const hostsOf = (element: HTMLElement): HTMLElement[] =>
  Array.from(element.querySelectorAll('wj-button')).filter(
    (found): found is HTMLElement => found instanceof HTMLElement,
  );

/** The native button inside a `wj-button` host. */
const controlOf = (host: HTMLElement): HTMLButtonElement => find(host, 'button', HTMLButtonElement);

const controlsOf = (element: HTMLElement): HTMLButtonElement[] => hostsOf(element).map(controlOf);

/** The item at `index`; a spec that expects one fails loudly instead of reading `undefined`. */
function at<T>(items: readonly T[], index: number): T {
  const item = items[index];
  if (item === undefined) {
    throw new Error(`no item at ${String(index)}`);
  }
  return item;
}

/** The four physical corner radii of a button. */
function corners(button: HTMLElement): { tl: string; tr: string; br: string; bl: string } {
  const style = getComputedStyle(button);
  return {
    tl: style.borderTopLeftRadius,
    tr: style.borderTopRightRadius,
    br: style.borderBottomRightRadius,
    bl: style.borderBottomLeftRadius,
  };
}

/** The `[start, end]` border widths of a button on its inline axis, as the browser reports them. */
function inlineBorders(button: HTMLElement, dir: 'ltr' | 'rtl'): [string, string] {
  const style = getComputedStyle(button);
  return dir === 'ltr'
    ? [style.borderLeftWidth, style.borderRightWidth]
    : [style.borderRightWidth, style.borderLeftWidth];
}

/** The radius a lone button in the group keeps on every corner: the reference for the outer ones. */
async function fullRadius({ fixture, component, element }: Rendered): Promise<string> {
  const before = component.items();
  component.items.set([{ label: 'Only' }]);
  await fixture.whenStable();
  const radius = corners(at(controlsOf(element), 0)).tl;
  component.items.set(before);
  await fixture.whenStable();
  return radius;
}

function harnessOf(fixture: ComponentFixture<unknown>): Promise<WjButtonGroupHarness> {
  return TestbedHarnessEnvironment.loader(fixture).getHarness(WjButtonGroupHarness);
}

describe('WjButtonGroup', () => {
  let warn: MockInstance<typeof console.warn>;

  beforeEach(() => {
    // Optimus injects its styles after the first render, and every colour then transitions for
    // 0.2s from the browser default. Measure the end state, not the animation.
    const noMotion = document.createElement('style');
    noMotion.id = 'wj-spec-no-motion';
    noMotion.textContent = '*, *::before, *::after { transition: none !important; }';
    document.head.append(noMotion);
    warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    document.getElementById('wj-spec-no-motion')?.remove();
    ROOT.classList.remove('wj-dark');
    document.body.style.backgroundColor = '';
    document.head.querySelectorAll('style[data-optimus-style-id]').forEach((style) => {
      style.remove();
    });
    Reflect.deleteProperty(window, 'wjInjected');
  });

  describe('the joined look (FR-31)', () => {
    describe.each(['ltr', 'rtl'] as const)('%s', (dir) => {
      // The corners that touch a neighbour, by physical side: the end side of a button in LTR is
      // its right, in RTL its left.
      const endSide = dir === 'ltr' ? (['tr', 'br'] as const) : (['tl', 'bl'] as const);
      const startSide = dir === 'ltr' ? (['tl', 'bl'] as const) : (['tr', 'br'] as const);

      it('squares the end corners of the first button and keeps its start corners', async () => {
        const rendered = await render((host) => {
          host.dir.set(dir);
        });
        const full = await fullRadius(rendered);
        const first = corners(at(controlsOf(rendered.element), 0));

        expect(parseFloat(full)).toBeGreaterThan(0);
        for (const side of endSide) {
          expect(first[side]).toBe('0px');
        }
        for (const side of startSide) {
          expect(first[side]).toBe(full);
        }
      });

      it('squares all four corners of a middle button', async () => {
        const { element } = await render((host) => {
          host.dir.set(dir);
        });

        expect(corners(at(controlsOf(element), 1))).toEqual({
          tl: '0px',
          tr: '0px',
          br: '0px',
          bl: '0px',
        });
      });

      it('squares the start corners of the last button and keeps its end corners', async () => {
        const rendered = await render((host) => {
          host.dir.set(dir);
        });
        const full = await fullRadius(rendered);
        const last = corners(at(controlsOf(rendered.element), 2));

        for (const side of startSide) {
          expect(last[side]).toBe('0px');
        }
        for (const side of endSide) {
          expect(last[side]).toBe(full);
        }
      });

      it('shares one 1px seam between neighbours: no end border but on the last button', async () => {
        const { element } = await render((host) => {
          host.dir.set(dir);
        });
        const controls = controlsOf(element);

        expect(controls.map((control) => inlineBorders(control, dir))).toEqual([
          ['1px', '0px'],
          ['1px', '0px'],
          ['1px', '1px'],
        ]);
        // No gap and no overlap: each button starts where the one before it ends.
        const boxes = controls.map((control) => control.getBoundingClientRect());
        boxes.slice(1).forEach((box, index) => {
          const before = at(boxes, index);
          expect(dir === 'ltr' ? box.left : box.right).toBe(
            dir === 'ltr' ? before.right : before.left,
          );
          expect(box.top).toBe(before.top);
        });
        // The seam order follows the direction.
        const [first, last] = [at(boxes, 0), at(boxes, 2)];
        expect(dir === 'ltr' ? first.left < last.left : first.left > last.left).toBe(true);
      });

      it('keeps all four corners and the full border on a one-button group', async () => {
        const { element } = await render((host) => {
          host.dir.set(dir);
          host.items.set([{ label: 'Only' }]);
        });
        const only = at(controlsOf(element), 0);
        const style = corners(only);

        expect(parseFloat(style.tl)).toBeGreaterThan(0);
        expect(new Set(Object.values(style)).size).toBe(1);
        expect(inlineBorders(only, dir)).toEqual(['1px', '1px']);
      });

      it('puts the focused button on top of its neighbours', async () => {
        const { element } = await render((host) => {
          host.dir.set(dir);
        });
        const controls = controlsOf(element);
        at(controls, 1).focus();

        await expect.poll(() => getComputedStyle(at(controls, 1)).zIndex).toBe('1');
        expect(getComputedStyle(at(controls, 1)).position).toBe('relative');
        expect(getComputedStyle(at(controls, 0)).zIndex).toBe('auto');
        expect(getComputedStyle(at(controls, 2)).zIndex).toBe('auto');
      });
    });

    it('keeps the join when a button is disabled', async () => {
      const { element } = await render((host) => {
        host.items.set([{ label: 'Cut' }, { label: 'Copy' }, { label: 'Paste', disabled: true }]);
      });
      const controls = controlsOf(element);

      expect(corners(at(controls, 1))).toEqual({ tl: '0px', tr: '0px', br: '0px', bl: '0px' });
      expect(corners(at(controls, 2)).tl).toBe('0px');
      expect(inlineBorders(at(controls, 1), 'ltr')).toEqual(['1px', '0px']);
    });

    it('updates the join when buttons come and go', async () => {
      const { fixture, component, element } = await render((host) => {
        host.items.set(ITEMS.slice(0, 1));
      });
      const full = corners(at(controlsOf(element), 0)).tl;

      component.items.set(ITEMS);
      await fixture.whenStable();
      expect(corners(at(controlsOf(element), 0)).tr).toBe('0px');
      expect(corners(at(controlsOf(element), 1)).tl).toBe('0px');

      component.items.set(ITEMS.slice(0, 1));
      await fixture.whenStable();
      expect(corners(at(controlsOf(element), 0)).tr).toBe(full);
    });

    it('is an inline-flex host that is exactly as tall as its buttons', async () => {
      const { element } = await render();
      const group = groupOf(element).getBoundingClientRect();
      const button = at(controlsOf(element), 0).getBoundingClientRect();

      expect(getComputedStyle(groupOf(element)).display).toBe('inline-flex');
      expect(group.height).toBe(button.height);
    });

    it('never wraps or squashes the buttons, and overflows a narrow container unclipped', async () => {
      const { fixture, component, element } = await render();
      const widths = controlsOf(element).map((control) => control.getBoundingClientRect().width);
      component.width.set('60px');
      await fixture.whenStable();
      const boxes = controlsOf(element).map((control) => control.getBoundingClientRect());

      expect(boxes.map((box) => box.width)).toEqual(widths);
      expect(new Set(boxes.map((box) => box.top)).size).toBe(1);
      expect(new Set(boxes.map((box) => box.height)).size).toBe(1);
      expect(at(boxes, 2).right).toBeGreaterThan(
        find(element, 'div', HTMLElement).getBoundingClientRect().right,
      );
      expect(getComputedStyle(groupOf(element)).overflow).toBe('visible');
    });

    it('renders nothing visible and no Tab stop with no buttons', async () => {
      const { element } = await render((host) => {
        host.items.set([]);
      });
      const group = groupOf(element);

      expect(group.getBoundingClientRect().width).toBe(0);
      expect(group.querySelector('[tabindex], button, a, input')).toBeNull();
      // A named empty group is still announced; the docs say to render a group once it has buttons.
      expect(spanOf(element).getAttribute('aria-label')).toBe('Date navigation');
    });
  });

  describe('the name (FR-32)', () => {
    it('sets aria-label on the role="group" element and nowhere else', async () => {
      const { element } = await render();

      expect(spanOf(element).getAttribute('aria-label')).toBe('Date navigation');
      expect(spanOf(element).hasAttribute('aria-labelledby')).toBe(false);
      expect(groupOf(element).hasAttribute('aria-label')).toBe(false);
      expect(find(element, 'p-buttongroup', HTMLElement).hasAttribute('aria-label')).toBe(false);
      expect(find(element, 'p-buttongroup', HTMLElement).hasAttribute('role')).toBe(false);
      expect(warn).not.toHaveBeenCalled();
    });

    it('sets aria-labelledby on the role="group" element', async () => {
      const { element } = await render((host) => {
        host.ariaLabel.set(undefined);
        host.ariaLabelledBy.set('heading');
      });

      expect(spanOf(element).getAttribute('aria-labelledby')).toBe('heading');
      expect(spanOf(element).hasAttribute('aria-label')).toBe(false);
      expect(groupOf(element).hasAttribute('aria-labelledby')).toBe(false);
    });

    it('changes the name, and clears it when the input clears', async () => {
      const { fixture, component, element } = await render();

      component.ariaLabel.set('Paging');
      await fixture.whenStable();
      expect(spanOf(element).getAttribute('aria-label')).toBe('Paging');

      component.ariaLabel.set(undefined);
      await fixture.whenStable();
      expect(spanOf(element).hasAttribute('aria-label')).toBe(false);

      component.ariaLabelledBy.set('heading');
      await fixture.whenStable();
      expect(spanOf(element).getAttribute('aria-labelledby')).toBe('heading');

      component.ariaLabelledBy.set(undefined);
      await fixture.whenStable();
      expect(spanOf(element).hasAttribute('aria-labelledby')).toBe(false);
      expect(spanOf(element).getAttribute('role')).toBe('group');
    });

    it('names a group that starts unnamed once the input is set', async () => {
      const { fixture, component, element } = await render((host) => {
        host.ariaLabel.set(undefined);
      });
      expect(spanOf(element).hasAttribute('aria-label')).toBe(false);

      component.ariaLabel.set('Late name');
      await fixture.whenStable();

      expect(spanOf(element).getAttribute('aria-label')).toBe('Late name');
    });

    it('keeps the name when buttons are added or removed', async () => {
      const { fixture, component, element } = await render();

      component.items.set(ITEMS.slice(0, 1));
      await fixture.whenStable();
      component.items.set(ITEMS);
      await fixture.whenStable();

      expect(spanOf(element).getAttribute('aria-label')).toBe('Date navigation');
    });
  });

  describe('harness (FR-32)', () => {
    it('returns the buttons as WjButtonHarnesses, in order, imported by package name', async () => {
      const { fixture } = await render();
      const buttons = await (await harnessOf(fixture)).getButtons();

      expect(buttons).toHaveLength(3);
      for (const button of buttons) {
        expect(button).toBeInstanceOf(WjButtonHarness);
      }
      expect(await Promise.all(buttons.map((button) => button.getLabel()))).toEqual([
        'Previous',
        'Today',
        'Next',
      ]);
    });

    it('narrows the buttons by WjButtonHarnessFilters', async () => {
      const { fixture } = await render();
      const group = await harnessOf(fixture);

      expect(await group.getButtons({ label: 'Today' })).toHaveLength(1);
      expect(await group.getButtons({ label: /^N/ })).toHaveLength(1);
      expect(await group.getButtons({ label: 'Nope' })).toHaveLength(0);
    });

    it('drives a button it found', async () => {
      const { fixture, component } = await render();
      const [first] = await (await harnessOf(fixture)).getButtons({ label: 'Next' });
      await first?.click();

      expect(component.clicked()).toEqual(['Next']);
    });

    it('reads the name, and sees a disabled button', async () => {
      const { fixture, component } = await render((host) => {
        host.items.set([{ label: 'Cut' }, { label: 'Paste', disabled: true }]);
      });
      const group = await harnessOf(fixture);
      const [cut, paste] = await group.getButtons();

      expect(await group.getAriaLabel()).toBe('Date navigation');
      expect(await group.getAriaLabelledBy()).toBeNull();
      expect(await cut?.isDisabled()).toBe(false);
      expect(await paste?.isDisabled()).toBe(true);

      component.ariaLabel.set(undefined);
      component.ariaLabelledBy.set('heading');
      await fixture.whenStable();
      expect(await group.getAriaLabel()).toBeNull();
      expect(await group.getAriaLabelledBy()).toBe('heading');
    });
  });

  describe('safety (FR-8)', () => {
    it('renders an HTML payload in ariaLabel and in a button label as text', async () => {
      const { fixture, element } = await render((host) => {
        host.ariaLabel.set(PAYLOAD);
        host.items.set([{ label: PAYLOAD }]);
      });
      const group = await harnessOf(fixture);
      const [button] = await group.getButtons();

      expect(spanOf(element).getAttribute('aria-label')).toBe(PAYLOAD);
      expect(await group.getAriaLabel()).toBe(PAYLOAD);
      expect(await button?.getLabel()).toBe(PAYLOAD);
      expect(element.querySelector('img, script')).toBeNull();
      expect(Reflect.get(window, 'wjInjected')).toBeUndefined();
    });
  });

  describe('setup and ARIA checks', () => {
    it('warns WJ0001 when provideWeeljack is missing', async () => {
      const fixture = TestBed.createComponent(RoutedHost);
      await fixture.whenStable();

      expect(warn).toHaveBeenCalledWith(
        'WJ0001: wj-buttongroup: provideWeeljack() is missing from the application providers. ' +
          'Add provideWeeljack() to your application config. ' +
          'Find more at https://locvodever.github.io/weeljack-ng/errors/WJ0001',
      );
    });

    it('warns WJ0003 for aria-* on the host and forwards nothing', async () => {
      TestBed.configureTestingModule({ providers: [provideWeeljack()] });
      const fixture = TestBed.createComponent(AriaOnHostHost);
      await fixture.whenStable();
      const element = fixture.nativeElement as HTMLElement;

      expect(warn).toHaveBeenCalledTimes(1);
      expect(warn).toHaveBeenCalledWith(
        'WJ0003: wj-buttongroup: aria-label is set on the host, where it is not forwarded to the ' +
          'focusable element. Use the ariaLabel or ariaLabelledBy input instead. ' +
          'Find more at https://locvodever.github.io/weeljack-ng/errors/WJ0003',
      );
      expect(spanOf(element).hasAttribute('aria-label')).toBe(false);
    });
  });

  describe('accessibility', () => {
    const STATES: [string, (host: Host) => void][] = [
      ['default', () => undefined],
      [
        'with a disabled button',
        (host) => {
          host.items.set([{ label: 'Cut' }, { label: 'Copy' }, { label: 'Paste', disabled: true }]);
        },
      ],
      [
        'one button',
        (host) => {
          host.items.set([{ label: 'Only' }]);
        },
      ],
    ];

    describe.each<Scheme>(['light', 'dark'])('%s', (scheme) => {
      it.each(STATES)('has no axe violations: %s', async (_name, setup) => {
        const { element } = await render(setup, scheme);

        // The fixture's native Before/After buttons are not under test and fail `target-size`.
        await expectNoAxeViolations(groupOf(element));
      });
    });
  });

  describe('keyboard', () => {
    it('Tab and Shift+Tab move through the buttons in order', async () => {
      const { element } = await render();
      const controls = controlsOf(element);
      find(element, '#before', HTMLElement).focus();

      for (const control of controls) {
        await userEvent.tab();
        expect(document.activeElement).toBe(control);
      }
      await userEvent.tab();
      expect(document.activeElement).toBe(find(element, '#after', HTMLElement));

      await userEvent.tab({ shift: true });
      expect(document.activeElement).toBe(at(controls, 2));
      await userEvent.tab({ shift: true });
      expect(document.activeElement).toBe(at(controls, 1));
      await userEvent.tab({ shift: true });
      expect(document.activeElement).toBe(at(controls, 0));
    });

    it('Enter and Space each activate the focused button once', async () => {
      const { component, element } = await render();
      at(controlsOf(element), 1).focus();

      await userEvent.keyboard('{Enter}');
      expect(component.clicked()).toEqual(['Today']);

      await userEvent.keyboard(' ');
      expect(component.clicked()).toEqual(['Today', 'Today']);
    });

    it('skips a disabled button', async () => {
      const { component, element } = await render((host) => {
        host.items.set([{ label: 'Cut' }, { label: 'Copy' }, { label: 'Paste', disabled: true }]);
      });
      const controls = controlsOf(element);
      find(element, '#before', HTMLElement).focus();

      await userEvent.tab();
      expect(document.activeElement).toBe(at(controls, 0));
      await userEvent.tab();
      expect(document.activeElement).toBe(at(controls, 1));
      await userEvent.tab();
      expect(document.activeElement).toBe(find(element, '#after', HTMLElement));
      expect(component.clicked()).toEqual([]);
    });
  });
});
