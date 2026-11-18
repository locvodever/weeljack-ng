/// <reference types="@vitest/browser-playwright" />
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Component, signal, type Type } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import type { MockInstance } from 'vitest';
import { userEvent } from 'vitest/browser';
import { provideWeeljack } from 'weeljack-ng';
import { WjIconField } from 'weeljack-ng/iconfield';
import { WjIconFieldHarness } from 'weeljack-ng/iconfield/testing';
import { WjInputIcon, type WjInputIconPt } from 'weeljack-ng/inputicon';
import { WjInputIconHarness } from 'weeljack-ng/inputicon/testing';
import { WjInputText, type WjInputTextSize } from 'weeljack-ng/inputtext';
import { expectNoAxeViolations } from '../spec-support/axe';

const ROOT = document.documentElement;

/** Optimus's inset: the form field's 14 px padding, on the icon's own side only. */
const INSET = 14;
/**
 * The icon box, at every input size. Optimus's rule that would make it 14 / 18 px at small / large
 * keys on `.p-inputfield-sm` / `-lg`, which a text input never carries (it has `p-inputtext-sm` /
 * `-lg`), so the icon stays 16 px: a listed Optimus gap.
 */
const ICON = 16;
/** The input's own height at each size. */
const HEIGHT = new Map<WjInputTextSize | undefined, number>([
  [undefined, 44],
  ['small', 36],
  ['large', 52],
]);

/** A consumer's icon field: a text input, with an icon before it and/or after it. */
@Component({
  selector: 'wj-inputicon-host',
  imports: [WjIconField, WjInputIcon, WjInputText],
  template: `
    <button type="button" id="before">Before</button>
    <div id="scope" style="width: 320px">
      <wj-iconfield>
        @if (leading()) {
          <wj-inputicon [pt]="pt()">
            <svg id="lead" viewBox="0 0 24 24" width="1em" height="1em" aria-hidden="true"></svg>
          </wj-inputicon>
        }
        <input
          wjInputText
          type="search"
          aria-label="Search"
          [size]="size()"
          [invalid]="invalid()"
          [disabled]="disabled()"
        />
        @if (trailing()) {
          <wj-inputicon>
            <svg id="trail" viewBox="0 0 24 24" width="1em" height="1em" aria-hidden="true"></svg>
          </wj-inputicon>
        }
      </wj-iconfield>
    </div>
    <button type="button" id="after">After</button>
  `,
})
class Host {
  readonly pt = signal<WjInputIconPt>(undefined);
  readonly size = signal<WjInputTextSize | undefined>(undefined);
  readonly leading = signal(false);
  readonly trailing = signal(false);
  readonly invalid = signal(false);
  readonly disabled = signal(false);
}

/** An icon that is plain text, one that names itself, and one its host hides. */
@Component({
  selector: 'wj-inputicon-text-host',
  imports: [WjIconField, WjInputIcon, WjInputText],
  template: `
    <wj-iconfield>
      <wj-inputicon id="text">{{ glyph() }}</wj-inputicon>
      <input wjInputText aria-label="Search" />
    </wj-iconfield>
    <wj-iconfield>
      <wj-inputicon id="named">
        <svg viewBox="0 0 24 24" width="1em" height="1em" role="img" aria-label="Found"></svg>
      </wj-inputicon>
      <input wjInputText aria-label="Other" />
    </wj-iconfield>
    <wj-iconfield>
      <wj-inputicon id="hidden-host" aria-hidden="true">x</wj-inputicon>
      <input wjInputText aria-label="Third" />
    </wj-iconfield>
  `,
})
class TextHost {
  readonly glyph = signal('<b>x</b>');
}

/** An input icon on its own, outside an icon field. */
@Component({
  selector: 'wj-inputicon-bare-host',
  imports: [WjInputIcon],
  template: `<wj-inputicon />`,
})
class BareHost {}

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
  expect(getComputedStyle(find(element, 'p-iconfield')).position).toBe('relative');
  return { fixture, host: fixture.componentInstance, element };
}

function query(element: Element, selector: string): Element {
  const found = element.querySelector(selector);
  if (found === null) {
    throw new Error(`${selector} is missing`);
  }
  return found;
}

function find(element: Element, selector: string): HTMLElement {
  const found = query(element, selector);
  if (!(found instanceof HTMLElement)) {
    throw new Error(`${selector} is not an HTML element`);
  }
  return found;
}

function box(element: Element, selector: string): DOMRect {
  return query(element, selector).getBoundingClientRect();
}

function centre(rect: DOMRect): [number, number] {
  return [rect.left + rect.width / 2, rect.top + rect.height / 2];
}

describe('WjInputIcon', () => {
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
    it('projects the icon inside the Optimus root', async () => {
      const { host, fixture, element } = await render(Host);
      host.leading.set(true);
      await fixture.whenStable();
      const root = find(element, 'p-inputicon');
      expect(root.parentElement).toBe(find(element, 'wj-inputicon'));
      expect(Array.from(root.children).map((child) => child.localName)).toEqual(['svg']);
      expect(query(element, '#lead').parentElement).toBe(root);
    });

    it('renders an app string as text, never as markup', async () => {
      const { fixture, element } = await render(TextHost);
      const loader = TestbedHarnessEnvironment.loader(fixture);
      const [icon] = await loader.getAllHarnesses(WjInputIconHarness);
      expect(await icon?.getText()).toBe('<b>x</b>');
      expect(find(element, '#text').querySelector('b')).toBeNull();
    });
  });

  describe('pt', () => {
    it('reaches host and root, as an object', async () => {
      const { element } = await render(Host, 'light', (host) => {
        host.leading.set(true);
        host.pt.set({ root: { 'data-probe': 'root' }, host: { 'data-host': 'host' } });
      });
      const root = find(element, 'p-inputicon');
      await expect.poll(() => root.getAttribute('data-probe')).toBe('root');
      expect(root.getAttribute('data-host')).toBe('host');
    });

    it('reaches root, as a function', async () => {
      const { element } = await render(Host, 'light', (host) => {
        host.leading.set(true);
        host.pt.set(() => ({ root: { 'data-probe': 'fn' } }));
      });
      await expect.poll(() => find(element, 'p-inputicon').getAttribute('data-probe')).toBe('fn');
    });

    it('adds a class to the root and keeps the icon in it', async () => {
      const { element } = await render(Host, 'light', (host) => {
        host.leading.set(true);
        host.pt.set({ root: 'probe-class' });
      });
      const root = find(element, 'p-inputicon');
      await expect.poll(() => root.classList.contains('probe-class')).toBe(true);
      expect(root.children).toHaveLength(1);
    });
  });

  describe('side and inset', () => {
    // An icon takes the inset of its own side only, at Optimus's 14 px, at every input size. Inside
    // its host Optimus's root is both the first and the last child, so without the side fix it is
    // pinned to both edges and stretches across the input.
    it.each<[string, boolean, boolean]>([
      ['before the input', true, false],
      ['after the input', false, true],
      ['on each side', true, true],
    ])('%s', async (_name, leading, trailing) => {
      const { fixture, host, element } = await render(Host);
      for (const size of [undefined, 'small', 'large'] as const) {
        host.size.set(size);
        host.leading.set(leading);
        host.trailing.set(trailing);
        await fixture.whenStable();
        const label = `size ${String(size)}`;
        const field = box(element, 'p-iconfield');
        if (leading) {
          const icon = box(element, '#lead');
          expect(icon.left - field.left, label).toBe(INSET);
          expect(icon.width, label).toBe(ICON);
          expect(icon.height, label).toBe(ICON);
          const input = box(element, 'input');
          expect(icon.top + icon.height / 2, label).toBe(input.top + input.height / 2);
        }
        if (trailing) {
          const icon = box(element, '#trail');
          expect(field.right - icon.right, label).toBe(INSET);
          expect(icon.width, label).toBe(ICON);
          expect(icon.height, label).toBe(ICON);
          const input = box(element, 'input');
          expect(icon.top + icon.height / 2, label).toBe(input.top + input.height / 2);
        }
      }
    });

    it('sits inside the input’s start or end padding, centred on the input', async () => {
      const { fixture, host, element } = await render(Host);
      host.leading.set(true);
      host.trailing.set(true);
      await fixture.whenStable();
      const input = box(element, 'input');
      const style = getComputedStyle(find(element, 'input'));
      const startEdge = input.left + parseFloat(style.paddingLeft);
      const endEdge = input.right - parseFloat(style.paddingRight);
      const lead = box(element, '#lead');
      const trail = box(element, '#trail');
      expect(lead.left).toBeGreaterThanOrEqual(input.left);
      expect(lead.right).toBeLessThanOrEqual(startEdge);
      expect(trail.right).toBeLessThanOrEqual(input.right);
      expect(trail.left).toBeGreaterThanOrEqual(endEdge);
      expect(lead.top + lead.height / 2).toBe(input.top + input.height / 2);
      expect(trail.top + trail.height / 2).toBe(input.top + input.height / 2);
    });

    it('puts the icon at the logical start in a right-to-left page', async () => {
      const { fixture, host, element } = await render(Host);
      host.leading.set(true);
      await fixture.whenStable();
      find(element, '#scope').dir = 'rtl';
      await fixture.whenStable();
      expect(box(element, 'p-iconfield').right - box(element, '#lead').right).toBe(INSET);
    });
  });

  describe('click-through', () => {
    it('lets the input take the pointer at its centre and at each icon', async () => {
      const { fixture, host, element } = await render(Host);
      host.leading.set(true);
      host.trailing.set(true);
      await fixture.whenStable();
      const input = find(element, 'input');
      for (const rect of [box(element, 'input'), box(element, '#lead'), box(element, '#trail')]) {
        expect(document.elementFromPoint(...centre(rect))).toBe(input);
      }
    });

    it('focuses the input when a click lands on the icon', async () => {
      const { fixture, host, element } = await render(Host);
      host.leading.set(true);
      await fixture.whenStable();
      const target = document.elementFromPoint(...centre(box(element, '#lead')));
      expect(target).toBe(find(element, 'input'));
      await userEvent.click(find(element, 'input'), {
        position: { x: box(element, '#lead').left - box(element, 'input').left + 8, y: 20 },
      });
      expect(document.activeElement).toBe(find(element, 'input'));
    });
  });

  describe('host box', () => {
    it('adds no box: the icon field is as tall as the input at every size', async () => {
      const { fixture, host, element } = await render(Host);
      host.leading.set(true);
      host.trailing.set(true);
      for (const size of [undefined, 'small', 'large'] as const) {
        host.size.set(size);
        await fixture.whenStable();
        expect(box(element, 'input').height).toBe(HEIGHT.get(size));
        expect(box(element, 'wj-iconfield').height).toBe(HEIGHT.get(size));
      }
      for (const icon of Array.from(element.querySelectorAll('wj-inputicon'))) {
        const style = getComputedStyle(icon);
        // A grid item is blockified, so `display: inline` shows as `block`; what counts is no box.
        expect(style.display).toBe('block');
        expect(icon.getBoundingClientRect().height).toBe(0);
        expect(style.backgroundColor).toBe('rgba(0, 0, 0, 0)');
        expect(style.borderTopWidth).toBe('0px');
        expect(style.paddingTop).toBe('0px');
      }
    });

    it('keeps typed text clear of the icon at each end', async () => {
      const { fixture, host, element } = await render(Host);
      host.leading.set(true);
      host.trailing.set(true);
      await fixture.whenStable();
      const style = getComputedStyle(find(element, 'input'));
      expect(style.paddingLeft).toBe('44px');
      expect(style.paddingRight).toBe('44px');
    });
  });

  describe('harness', () => {
    it('reads whether the icon is hidden from assistive technology', async () => {
      const { fixture } = await render(TextHost);
      const loader = TestbedHarnessEnvironment.loader(fixture);
      const icons = await loader.getAllHarnesses(WjInputIconHarness);
      expect(await Promise.all(icons.map((icon) => icon.isHiddenFromAt()))).toEqual([
        false,
        false,
        true,
      ]);
      expect(await icons[2]?.getText()).toBe('x');
    });

    it('finds the icon inside an icon field; an SVG icon holds no text', async () => {
      const { fixture, host } = await render(Host);
      host.leading.set(true);
      await fixture.whenStable();
      const loader = TestbedHarnessEnvironment.loader(fixture);
      const iconField = await loader.getHarness(WjIconFieldHarness);
      const icon = await iconField.getHarness(WjInputIconHarness);
      expect(await icon.isHiddenFromAt()).toBe(true);
      expect(await icon.getText()).toBe('');
    });
  });

  describe('accessibility', () => {
    describe.each<Scheme>(['light', 'dark'])('%s', (scheme) => {
      it.each<[string, (host: Host) => void]>([
        [
          'a leading icon',
          (host) => {
            host.leading.set(true);
          },
        ],
        [
          'a trailing icon',
          (host) => {
            host.trailing.set(true);
          },
        ],
        [
          'an icon on each side',
          (host) => {
            host.leading.set(true);
            host.trailing.set(true);
          },
        ],
        [
          'an invalid input',
          (host) => {
            host.leading.set(true);
            host.invalid.set(true);
          },
        ],
        [
          'a disabled input',
          (host) => {
            host.trailing.set(true);
            host.disabled.set(true);
          },
        ],
      ])('has no axe violations: %s', async (_name, setup) => {
        const { fixture, element } = await render(Host, scheme, setup);
        await fixture.whenStable();
        await expectNoAxeViolations(find(element, '#scope'));
      });
    });

    it('adds no role and no tabindex of its own', async () => {
      const { host, fixture, element } = await render(Host);
      host.leading.set(true);
      await fixture.whenStable();
      for (const selector of ['wj-inputicon', 'p-inputicon']) {
        expect(find(element, selector).getAttribute('role')).toBeNull();
        expect(find(element, selector).tabIndex).toBe(-1);
      }
    });
  });

  describe('keyboard', () => {
    it('has none: Tab goes to the input and on, and Shift+Tab goes back', async () => {
      const { host, fixture, element } = await render(Host);
      host.leading.set(true);
      host.trailing.set(true);
      await fixture.whenStable();
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
  });

  describe('setup warning', () => {
    it('is silent when provideWeeljack is present', async () => {
      TestBed.configureTestingModule({ providers: [provideWeeljack()] });
      const fixture = TestBed.createComponent(BareHost);
      await fixture.whenStable();
      expect(warn).not.toHaveBeenCalled();
    });

    it('warns WJ0001 when provideWeeljack is missing', async () => {
      const fixture = TestBed.createComponent(BareHost);
      await fixture.whenStable();
      expect(warn).toHaveBeenCalledExactlyOnceWith(
        'WJ0001: wj-inputicon: provideWeeljack() is missing from the application providers. ' +
          'Add provideWeeljack() to your application config. ' +
          'Find more at https://locvodever.github.io/weeljack-ng/errors/WJ0001',
      );
    });
  });
});
