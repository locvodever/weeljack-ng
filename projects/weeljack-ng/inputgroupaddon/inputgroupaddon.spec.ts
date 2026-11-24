/// <reference types="@vitest/browser-playwright" />
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Component, signal, type Type } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import type { MockInstance } from 'vitest';
import { userEvent } from 'vitest/browser';
import { provideWeeljack } from 'weeljack-ng';
import { WjButton } from 'weeljack-ng/button';
import { WjButtonHarness } from 'weeljack-ng/button/testing';
import { WjInputGroup } from 'weeljack-ng/inputgroup';
import { WjInputGroupAddon, type WjInputGroupAddonPt } from 'weeljack-ng/inputgroupaddon';
import { WjInputGroupAddonHarness } from 'weeljack-ng/inputgroupaddon/testing';
import { WjInputText } from 'weeljack-ng/inputtext';
import { expectNoAxeViolations } from '../spec-support/axe';

const ROOT = document.documentElement;
const PAYLOAD = '<img src=x onerror="window.wjInjected = true">';

/** Optimus's form-field radius, `--wj-inputgroup-addon-border-radius` (8 px in the preset). */
const RADIUS = '8px';
/** `--wj-form-field-border-color` (zinc.500 in the Noir preset). */
const BORDER = 'rgb(113, 113, 122)';
/** `--wj-text-muted-color`: zinc.500 light, zinc.400 dark (ui-spec F6). */
const MUTED = { light: 'rgb(113, 113, 122)', dark: 'rgb(161, 161, 170)' };

/**
 * A consumer's template: text addons (C1) around a text input, in a 320 px group, with a button
 * before and after the group for the keyboard walk. Every addon has an id the input can name.
 */
@Component({
  selector: 'wj-inputgroupaddon-text-host',
  imports: [WjInputGroup, WjInputGroupAddon, WjInputText],
  template: `
    <button type="button" id="before">Before</button>
    <div id="scope" style="width: 320px">
      <wj-inputgroup>
        @if (first()) {
          <wj-inputgroupaddon id="unit-first" [pt]="pt()">{{ first() }}</wj-inputgroupaddon>
        }
        @if (second()) {
          <wj-inputgroupaddon id="unit-second">{{ second() }}</wj-inputgroupaddon>
        }
        <input wjInputText aria-label="Amount" aria-describedby="unit-first" />
        @if (last()) {
          <wj-inputgroupaddon id="unit-last">{{ last() }}</wj-inputgroupaddon>
        }
      </wj-inputgroup>
    </div>
    <button type="button" id="after">After</button>
  `,
})
class TextHost {
  readonly pt = signal<WjInputGroupAddonPt>(undefined);
  readonly first = signal<string | null>('$');
  readonly second = signal<string | null>(null);
  readonly last = signal<string | null>(null);
}

/** A button addon (C2): the `wj-button` in the addon after the input, or before it. */
@Component({
  selector: 'wj-inputgroupaddon-button-host',
  imports: [WjButton, WjInputGroup, WjInputGroupAddon, WjInputText],
  template: `
    <button type="button" id="before">Before</button>
    <div id="scope" style="width: 320px">
      <wj-inputgroup>
        @if (buttonFirst()) {
          <wj-inputgroupaddon>
            <wj-button label="Apply" (click)="clicks.update((count) => count + 1)" />
          </wj-inputgroupaddon>
        }
        <input wjInputText aria-label="Discount code" />
        @if (!buttonFirst()) {
          <wj-inputgroupaddon>
            <wj-button label="Apply" (click)="clicks.update((count) => count + 1)" />
          </wj-inputgroupaddon>
        }
      </wj-inputgroup>
    </div>
    <button type="button" id="after">After</button>
  `,
})
class ButtonHost {
  readonly buttonFirst = signal(false);
  readonly clicks = signal(0);
}

/** An addon alone in a group, and one outside any group. */
@Component({
  selector: 'wj-inputgroupaddon-lone-host',
  imports: [WjInputGroup, WjInputGroupAddon],
  template: `
    <div id="scope" style="width: 320px">
      <wj-inputgroup id="lone"><wj-inputgroupaddon>kg</wj-inputgroupaddon></wj-inputgroup>
      <wj-inputgroupaddon id="outside">kg</wj-inputgroupaddon>
    </div>
  `,
})
class LoneHost {}

/** An addon whose text is app data: the payload must render as text. */
@Component({
  selector: 'wj-inputgroupaddon-payload-host',
  imports: [WjInputGroup, WjInputGroupAddon, WjInputText],
  template: `
    <wj-inputgroup>
      <wj-inputgroupaddon>{{ payload }}</wj-inputgroupaddon>
      <input wjInputText aria-label="Amount" />
    </wj-inputgroup>
  `,
})
class PayloadHost {
  readonly payload = PAYLOAD;
}

/** An addon with nothing in a group, for the setup warning. */
@Component({
  selector: 'wj-inputgroupaddon-empty-host',
  imports: [WjInputGroupAddon],
  template: `<wj-inputgroupaddon />`,
})
class EmptyHost {}

type Scheme = 'light' | 'dark';

interface Rendered<T> {
  fixture: ComponentFixture<T>;
  host: T;
  element: HTMLElement;
}

/** Renders `type` with `provideWeeljack` in the given scheme, after `setup` ran. */
async function render<T extends object>(
  type: Type<T>,
  scheme: Scheme = 'light',
  setup: (host: T) => void = () => undefined,
): Promise<Rendered<T>> {
  ROOT.classList.toggle('wj-dark', scheme === 'dark');
  document.body.style.backgroundColor = 'var(--wj-content-background)';
  TestBed.configureTestingModule({ providers: [provideWeeljack({ darkMode: 'class' })] });
  const fixture = TestBed.createComponent(type);
  setup(fixture.componentInstance);
  await fixture.whenStable();
  const element = fixture.nativeElement as HTMLElement;
  // A render without Optimus's styles would pass for the wrong reason: fail loudly instead.
  expect(getComputedStyle(find(element, 'p-inputgroup-addon')).display).toBe('flex');
  return { fixture, host: fixture.componentInstance, element };
}

function find(element: Element, selector: string): HTMLElement {
  const found = element.querySelector(selector);
  if (!(found instanceof HTMLElement)) {
    throw new Error(`${selector} is missing`);
  }
  return found;
}

/** The first two matches of `selector`, in document order. */
function findTwo(element: Element, selector: string): [HTMLElement, HTMLElement] {
  const [one, two] = Array.from(element.querySelectorAll<HTMLElement>(selector));
  if (one === undefined || two === undefined) {
    throw new Error(`${selector} needs two matches`);
  }
  return [one, two];
}

function box(element: Element, selector: string): DOMRect {
  return find(element, selector).getBoundingClientRect();
}

/** The four corner radii, `top-left / top-right / bottom-right / bottom-left`. */
function radii(element: HTMLElement): string {
  const style = getComputedStyle(element);
  return [
    style.borderTopLeftRadius,
    style.borderTopRightRadius,
    style.borderBottomRightRadius,
    style.borderBottomLeftRadius,
  ].join(' / ');
}

/** The four border widths, `top / right / bottom / left`. */
function borders(element: HTMLElement): string {
  const style = getComputedStyle(element);
  return [
    style.borderTopWidth,
    style.borderRightWidth,
    style.borderBottomWidth,
    style.borderLeftWidth,
  ].join(' / ');
}

/** Whether `element` starts a stacking context of its own, so a z-index inside it stays inside. */
function startsStackingContext(element: Element): boolean {
  const style = getComputedStyle(element);
  return (
    style.zIndex !== 'auto' ||
    style.opacity !== '1' ||
    style.transform !== 'none' ||
    style.filter !== 'none' ||
    style.isolation === 'isolate'
  );
}

// The element that draws the addon's border, radius and fill: Optimus's root inside the host.
const ADDON = 'p-inputgroup-addon';

describe('WjInputGroupAddon', () => {
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
  });

  describe('content', () => {
    it('projects its content into the Optimus root, as text', async () => {
      const { element } = await render(TextHost);

      expect(find(element, ADDON).textContent.trim()).toBe('$');
      expect(find(element, 'wj-inputgroupaddon').children).toHaveLength(1);
    });

    it('renders an HTML payload as text, never as markup', async () => {
      const { element } = await render(PayloadHost);

      expect(find(element, ADDON).textContent.trim()).toBe(PAYLOAD);
      expect(element.querySelector('img')).toBeNull();
      expect(Reflect.get(window, 'wjInjected')).toBeUndefined();
    });
  });

  describe('text addon (C1)', () => {
    // Optimus's own result with native `p-inputgroup-addon` children, measured in a 320 px group
    // (the build proved each value equal): the first addon's start corners and the last addon's
    // end corners are 8 px, every inner corner is square, and the line between an addon and a
    // control is the control's own.
    it('before the input: draws its top, bottom and outer edge, with its start corners rounded', async () => {
      const { element } = await render(TextHost);

      expect(borders(find(element, ADDON))).toBe('1px / 0px / 1px / 1px');
      expect(radii(find(element, ADDON))).toBe(`${RADIUS} / 0px / 0px / ${RADIUS}`);
      expect(getComputedStyle(find(element, ADDON)).borderLeftColor).toBe(BORDER);
      expect(borders(find(element, 'input'))).toBe('1px / 1px / 1px / 1px');
      expect(radii(find(element, 'input'))).toBe(`0px / ${RADIUS} / ${RADIUS} / 0px`);
    });

    it('after the input: draws its top, bottom and outer edge, with its end corners rounded', async () => {
      const { element } = await render(TextHost, 'light', (host) => {
        host.first.set(null);
        host.last.set('.00');
      });

      expect(borders(find(element, ADDON))).toBe('1px / 1px / 1px / 0px');
      expect(radii(find(element, ADDON))).toBe(`0px / ${RADIUS} / ${RADIUS} / 0px`);
      expect(radii(find(element, 'input'))).toBe(`${RADIUS} / 0px / 0px / ${RADIUS}`);
    });

    it('on both sides: each draws its outer edge, the input is square, nothing is doubled', async () => {
      const { element } = await render(TextHost, 'light', (host) => {
        host.last.set('.00');
      });
      const [first, last] = findTwo(element, ADDON);

      expect(borders(first)).toBe('1px / 0px / 1px / 1px');
      expect(radii(first)).toBe(`${RADIUS} / 0px / 0px / ${RADIUS}`);
      expect(borders(last)).toBe('1px / 1px / 1px / 0px');
      expect(radii(last)).toBe(`0px / ${RADIUS} / ${RADIUS} / 0px`);
      expect(radii(find(element, 'input'))).toBe('0px / 0px / 0px / 0px');
      // 320 px: two 40 px addons and the input between them, no gap and no overlap.
      expect(box(element, 'input').width).toBe(240);
      expect(box(element, 'input').left).toBe(first.getBoundingClientRect().right);
      expect(last.getBoundingClientRect().left).toBe(box(element, 'input').right);
    });

    it('two addons side by side: one line between them, the outer corners on the outer two', async () => {
      const { element } = await render(TextHost, 'light', (host) => {
        host.second.set('#');
      });
      const [first, second] = findTwo(element, ADDON);

      expect(borders(first)).toBe('1px / 0px / 1px / 1px');
      expect(radii(first)).toBe(`${RADIUS} / 0px / 0px / ${RADIUS}`);
      expect(borders(second)).toBe('1px / 0px / 1px / 1px');
      expect(radii(second)).toBe('0px / 0px / 0px / 0px');
      expect(second.getBoundingClientRect().left).toBe(first.getBoundingClientRect().right);
      // 320 px: two 40 px addons, so the input keeps 240.
      expect(box(element, 'input').width).toBe(240);
      expect(radii(find(element, 'input'))).toBe(`0px / ${RADIUS} / ${RADIUS} / 0px`);
    });

    it('stretches to the input at every height and keeps its content centred', async () => {
      const { element } = await render(TextHost);
      const addon = find(element, ADDON);
      const style = getComputedStyle(addon);

      expect(addon.getBoundingClientRect().height).toBe(44);
      expect(box(element, 'wj-inputgroupaddon').height).toBe(44);
      expect(style.display).toBe('flex');
      expect(style.alignItems).toBe('center');
      expect(style.justifyContent).toBe('center');
      expect(style.paddingTop).toBe('8px');
      expect(style.paddingLeft).toBe('8px');
    });

    it('keeps its width: at least 40 px, and a longer text widens it', async () => {
      const { fixture, host, element } = await render(TextHost);
      expect(box(element, ADDON).width).toBe(40);

      host.first.set('https://');
      await fixture.whenStable();

      expect(box(element, ADDON).width).toBeGreaterThan(40);
      expect(box(element, ADDON).width + box(element, 'input').width).toBeCloseTo(320, 1);
    });

    it('follows the writing direction: start is the right side in rtl', async () => {
      const { fixture, element } = await render(TextHost);
      find(element, '#scope').dir = 'rtl';
      await fixture.whenStable();

      expect(radii(find(element, ADDON))).toBe(`0px / ${RADIUS} / ${RADIUS} / 0px`);
      expect(borders(find(element, ADDON))).toBe('1px / 1px / 1px / 0px');
      expect(box(element, ADDON).left).toBe(box(element, 'input').right);
    });

    it.each<Scheme>(['light', 'dark'])(
      'takes the muted text colour, not Optimus’s icon colour: %s',
      async (scheme) => {
        const { element } = await render(TextHost, scheme);

        expect(getComputedStyle(find(element, ADDON)).color).toBe(MUTED[scheme]);
      },
    );
  });

  describe('button addon (C2)', () => {
    it('after the input: the addon has no padding and no clip, its end corners rounded', async () => {
      const { element } = await render(ButtonHost);
      const addon = find(element, ADDON);
      const style = getComputedStyle(addon);

      expect(borders(addon)).toBe('1px / 1px / 1px / 0px');
      expect(radii(addon)).toBe(`0px / ${RADIUS} / ${RADIUS} / 0px`);
      expect(style.padding).toBe('0px');
      expect(style.overflow).toBe('visible');
      // Optimus's native result: the addon is the button's 44 px plus its 1 px lines, so the row is 46.
      expect(addon.getBoundingClientRect().height).toBe(46);
      expect(box(element, 'wj-inputgroup').height).toBe(46);
      expect(box(element, 'input').height).toBe(46);
    });

    it('the button carries the outer corners: square at the input, 8 px at the group’s end', async () => {
      const { element } = await render(ButtonHost);

      expect(radii(find(element, 'button.p-button'))).toBe(`0px / ${RADIUS} / ${RADIUS} / 0px`);
      expect(radii(find(element, 'input'))).toBe(`${RADIUS} / 0px / 0px / ${RADIUS}`);
    });

    it('mirrors when the button addon comes first', async () => {
      const { element } = await render(ButtonHost, 'light', (host) => {
        host.buttonFirst.set(true);
      });

      expect(radii(find(element, 'button.p-button'))).toBe(`${RADIUS} / 0px / 0px / ${RADIUS}`);
      expect(borders(find(element, ADDON))).toBe('1px / 0px / 1px / 1px');
      expect(radii(find(element, ADDON))).toBe(`${RADIUS} / 0px / 0px / ${RADIUS}`);
      expect(radii(find(element, 'input'))).toBe(`0px / ${RADIUS} / ${RADIUS} / 0px`);
    });

    it('follows the writing direction: the button’s rounded corners go to the left in rtl', async () => {
      const { fixture, element } = await render(ButtonHost);
      find(element, '#scope').dir = 'rtl';
      await fixture.whenStable();

      expect(radii(find(element, 'button.p-button'))).toBe(`${RADIUS} / 0px / 0px / ${RADIUS}`);
    });

    it('keeps the button 44 px tall and fills the addon’s width', async () => {
      const { element } = await render(ButtonHost);
      const button = box(element, 'button.p-button');

      expect(button.height).toBe(44);
      expect(button.width).toBeCloseTo(box(element, ADDON).width - 1, 0);
      expect(box(element, ADDON).right).toBe(box(element, 'input').right + button.width + 1);
    });

    it('lifts the focused button, and nothing around it clips its ring', async () => {
      const { fixture, element } = await render(ButtonHost);
      const button = find(element, 'button.p-button');
      // The ring is Optimus's `.p-button:focus-visible`, which a programmatic `focus()` matches
      // only when the page's last input was a key; the page is shared across spec files, so
      // reach the button with a real Tab from the input before reading it.
      find(element, 'input').focus();
      await userEvent.tab();
      await expect.poll(() => document.activeElement).toBe(button);
      await fixture.whenStable();
      const lifted = getComputedStyle(button);

      expect(button.matches(':focus-visible')).toBe(true);
      expect(lifted.zIndex).toBe('1');
      expect(lifted.outlineStyle).toBe('solid');
      expect(lifted.outlineWidth).toBe('2px');
      expect(lifted.outlineOffset).toBe('2px');
      expect(getComputedStyle(find(element, 'input')).zIndex).toBe('auto');
      // The ring sits 2 to 4 px outside the button: no ancestor up to the group may clip or
      // trap it, or the lift and the ring are cut off.
      let parent = button.parentElement;
      while (parent !== null && parent.localName !== 'p-inputgroup') {
        const style = getComputedStyle(parent);
        expect(style.overflow, `${parent.localName} overflow`).toBe('visible');
        expect(style.clipPath, `${parent.localName} clip-path`).toBe('none');
        expect(startsStackingContext(parent), `${parent.localName} stacking`).toBe(false);
        parent = parent.parentElement;
      }
    });

    it('clicks and activates from the keyboard like any wj-button', async () => {
      const { host, element } = await render(ButtonHost);

      await userEvent.click(find(element, 'button.p-button'));
      find(element, 'button.p-button').focus();
      await userEvent.keyboard('{Enter}');
      await userEvent.keyboard(' ');

      expect(host.clicks()).toBe(3);
    });
  });

  describe('alone and outside a group', () => {
    it('an addon alone in a group is first and last: its four corners and four edges', async () => {
      const { element } = await render(LoneHost);
      const addon = find(element, '#lone p-inputgroup-addon');

      expect(borders(addon)).toBe('1px / 1px / 1px / 1px');
      expect(radii(addon)).toBe(`${RADIUS} / ${RADIUS} / ${RADIUS} / ${RADIUS}`);
    });

    it('outside a group it keeps Optimus’s standalone look: a full border, rounded corners', async () => {
      const { element } = await render(LoneHost);
      const addon = find(element, '#outside p-inputgroup-addon');

      expect(borders(addon)).toBe('1px / 1px / 1px / 1px');
      expect(radii(addon)).toBe(`${RADIUS} / ${RADIUS} / ${RADIUS} / ${RADIUS}`);
      expect(getComputedStyle(addon).borderTopColor).toBe(BORDER);
    });
  });

  describe('host box', () => {
    it('is a flex box the size of the Optimus root it wraps, never contents', async () => {
      const { element } = await render(TextHost);
      const host = find(element, 'wj-inputgroupaddon');
      const root = find(element, ADDON);

      expect(getComputedStyle(host).display).toBe('flex');
      expect(getComputedStyle(root).display).toBe('flex');
      expect(host.getBoundingClientRect().toJSON()).toEqual(root.getBoundingClientRect().toJSON());
    });

    it('draws nothing of its own: no background, border, padding or margin', async () => {
      const { element } = await render(TextHost);
      const style = getComputedStyle(find(element, 'wj-inputgroupaddon'));

      expect(style.backgroundColor).toBe('rgba(0, 0, 0, 0)');
      expect(style.borderTopWidth).toBe('0px');
      expect(style.paddingTop).toBe('0px');
      expect(style.marginTop).toBe('0px');
    });
  });

  describe('pt', () => {
    it('reaches root, as an object', async () => {
      const { element } = await render(TextHost, 'light', (host) => {
        host.pt.set({ root: { 'data-probe': 'root' } });
      });

      await expect.poll(() => find(element, ADDON).getAttribute('data-probe')).toBe('root');
    });

    it('reaches root, as a function', async () => {
      const { element } = await render(TextHost, 'light', (host) => {
        host.pt.set(() => ({ root: { 'data-probe': 'fn' } }));
      });

      await expect.poll(() => find(element, ADDON).getAttribute('data-probe')).toBe('fn');
    });

    it('keeps the group’s corners and the input’s width when it is set', async () => {
      const { element } = await render(TextHost, 'light', (host) => {
        host.pt.set({ root: 'probe-class' });
      });

      await expect.poll(() => find(element, ADDON).classList.contains('probe-class')).toBe(true);
      expect(radii(find(element, ADDON))).toBe(`${RADIUS} / 0px / 0px / ${RADIUS}`);
      expect(box(element, 'input').width).toBe(280);
    });
  });

  describe('host attributes', () => {
    it('keeps its id and adds no role, name or tab stop of its own', async () => {
      const { element } = await render(TextHost);
      const host = find(element, 'wj-inputgroupaddon');

      expect(host.id).toBe('unit-first');
      expect(host.getAttribute('role')).toBeNull();
      expect(find(element, ADDON).getAttribute('role')).toBeNull();
      expect(host.tabIndex).toBe(-1);
      expect(find(element, ADDON).tabIndex).toBe(-1);
    });

    it('describes the input when the input names its id (the documented recipe)', async () => {
      const { element } = await render(TextHost);
      const input = find(element, 'input');
      const id = input.getAttribute('aria-describedby');

      expect(id).toBe('unit-first');
      expect(document.getElementById(id ?? '')?.textContent.trim()).toBe('$');
    });
  });

  describe('harness', () => {
    it('reads the addon’s text and finds an addon by it', async () => {
      const { fixture } = await render(TextHost, 'light', (host) => {
        host.last.set('.00');
      });
      const loader = TestbedHarnessEnvironment.loader(fixture);

      const all = await loader.getAllHarnesses(WjInputGroupAddonHarness);
      expect(await Promise.all(all.map((addon) => addon.getText()))).toEqual(['$', '.00']);
      const found = await loader.getHarness(WjInputGroupAddonHarness.with({ text: '.00' }));
      expect(await found.getText()).toBe('.00');
      expect(
        await loader.getAllHarnesses(WjInputGroupAddonHarness.with({ text: /^\$/ })),
      ).toHaveLength(1);
      expect(
        await loader.getAllHarnesses(WjInputGroupAddonHarness.with({ text: 'kg' })),
      ).toHaveLength(0);
    });

    it('reaches the wj-button inside a button addon', async () => {
      const { fixture, host } = await render(ButtonHost);
      const addon =
        await TestbedHarnessEnvironment.loader(fixture).getHarness(WjInputGroupAddonHarness);
      const button = await addon.getHarness(WjButtonHarness.with({ label: 'Apply' }));

      expect(await addon.getText()).toBe('Apply');
      await button.click();
      expect(host.clicks()).toBe(1);
    });
  });

  describe('accessibility', () => {
    describe.each<Scheme>(['light', 'dark'])('%s', (scheme) => {
      it.each<[string, (host: TextHost) => void]>([
        ['a text addon before the input', () => undefined],
        [
          'text addons on both sides',
          (host) => {
            host.last.set('.00');
          },
        ],
        [
          'two text addons side by side',
          (host) => {
            host.second.set('#');
          },
        ],
      ])('has no axe violations: %s', async (_name, setup) => {
        const { element } = await render(TextHost, scheme, setup);

        await expectNoAxeViolations(find(element, '#scope'));
      });

      it.each<[string, boolean]>([
        ['a button addon after the input', false],
        ['a button addon before the input', true],
      ])('has no axe violations: %s', async (_name, buttonFirst) => {
        const { element } = await render(ButtonHost, scheme, (host) => {
          host.buttonFirst.set(buttonFirst);
        });

        await expectNoAxeViolations(find(element, '#scope'));
      });

      it('has no axe violations: a focused button addon', async () => {
        const { fixture, element } = await render(ButtonHost, scheme);
        find(element, 'button.p-button').focus();
        await fixture.whenStable();

        await expectNoAxeViolations(find(element, '#scope'));
      });
    });
  });

  describe('keyboard', () => {
    it('a text addon is no stop: Tab goes input, then on', async () => {
      const { element } = await render(TextHost, 'light', (host) => {
        host.last.set('.00');
      });
      find(element, '#before').focus();

      await userEvent.tab();
      expect(document.activeElement).toBe(find(element, 'input'));
      await userEvent.tab();
      expect(document.activeElement).toBe(find(element, '#after'));

      await userEvent.tab({ shift: true });
      expect(document.activeElement).toBe(find(element, 'input'));
      await userEvent.tab({ shift: true });
      expect(document.activeElement).toBe(find(element, '#before'));
    });

    it('a wj-button in an addon is one stop, in place, 44 px tall', async () => {
      const { element } = await render(ButtonHost);
      find(element, '#before').focus();

      await userEvent.tab();
      expect(document.activeElement).toBe(find(element, 'input'));
      await userEvent.tab();
      expect(document.activeElement).toBe(find(element, 'button.p-button'));
      expect(box(element, 'button.p-button').height).toBe(44);
      await userEvent.tab();
      expect(document.activeElement).toBe(find(element, '#after'));
    });

    it('follows the order of the children: the button first, then the input', async () => {
      const { element } = await render(ButtonHost, 'light', (host) => {
        host.buttonFirst.set(true);
      });
      find(element, '#before').focus();

      await userEvent.tab();
      expect(document.activeElement).toBe(find(element, 'button.p-button'));
      await userEvent.tab();
      expect(document.activeElement).toBe(find(element, 'input'));
    });
  });

  describe('setup warning', () => {
    it('is silent when provideWeeljack is present', async () => {
      TestBed.configureTestingModule({ providers: [provideWeeljack()] });
      const fixture = TestBed.createComponent(EmptyHost);
      await fixture.whenStable();

      expect(warn).not.toHaveBeenCalled();
    });

    it('warns WJ0001 when provideWeeljack is missing', async () => {
      const fixture = TestBed.createComponent(EmptyHost);
      await fixture.whenStable();

      expect(warn).toHaveBeenCalledExactlyOnceWith(
        'WJ0001: wj-inputgroupaddon: provideWeeljack() is missing from the application providers. ' +
          'Add provideWeeljack() to your application config. ' +
          'Find more at https://locvodever.github.io/weeljack-ng/errors/WJ0001',
      );
    });
  });
});
