/// <reference types="@vitest/browser-playwright" />
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Component, signal, type Type } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import type { MockInstance } from 'vitest';
import { userEvent } from 'vitest/browser';
import { provideWeeljack } from 'weeljack-ng';
import { WjField } from 'weeljack-ng/field';
import { WjFieldHarness } from 'weeljack-ng/field/testing';
import { WjIconField, type WjIconFieldPt } from 'weeljack-ng/iconfield';
import { WjIconFieldHarness } from 'weeljack-ng/iconfield/testing';
import { WjInputIcon } from 'weeljack-ng/inputicon';
import { WjInputText, type WjInputTextSize } from 'weeljack-ng/inputtext';
import { WjInputTextHarness } from 'weeljack-ng/inputtext/testing';
import { expectNoAxeViolations } from '../spec-support/axe';

const ROOT = document.documentElement;

/** Optimus's icon inset (the form field's 14 px padding) and its icon box (16 px). */
const INSET = 14;
const ICON = 16;
/** Where text may start once an icon sits at that side: 14 + 16 + 14. */
const PADDED = 2 * INSET + ICON;
/** The large input's own side padding. */
const LARGE_INSET = 16;

/** A consumer's template: a text input, with a sibling before it and/or after it. */
@Component({
  selector: 'wj-iconfield-host',
  imports: [WjIconField, WjInputIcon, WjInputText],
  template: `
    <button type="button" id="before">Before</button>
    <div id="scope" style="width: 320px">
      <wj-iconfield [pt]="pt()">
        @if (leading()) {
          <wj-inputicon
            ><svg
              id="lead"
              viewBox="0 0 24 24"
              width="1em"
              height="1em"
              aria-hidden="true"
              focusable="false"
            ></svg
          ></wj-inputicon>
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
          <wj-inputicon
            ><svg
              id="trail"
              viewBox="0 0 24 24"
              width="1em"
              height="1em"
              aria-hidden="true"
              focusable="false"
            ></svg
          ></wj-inputicon>
        }
      </wj-iconfield>
    </div>
    <button type="button" id="after">After</button>
  `,
})
class Host {
  readonly pt = signal<WjIconFieldPt>(undefined);
  readonly size = signal<WjInputTextSize | undefined>(undefined);
  readonly leading = signal(false);
  readonly trailing = signal(false);
  readonly invalid = signal(false);
  readonly disabled = signal(false);
}

/** An icon field inside a `wj-field`, with a hint and an error the test turns on. */
@Component({
  selector: 'wj-iconfield-field-host',
  imports: [WjField, WjIconField, WjInputIcon, WjInputText],
  template: `
    <div id="scope" style="width: 320px">
      <wj-field label="Search" [hint]="hint()" [error]="error()">
        <wj-iconfield>
          <wj-inputicon
            ><svg
              viewBox="0 0 24 24"
              width="1em"
              height="1em"
              aria-hidden="true"
              focusable="false"
            ></svg
          ></wj-inputicon>
          <input wjInputText id="field-search" type="search" />
        </wj-iconfield>
      </wj-field>
    </div>
  `,
})
class FieldHost {
  readonly hint = signal<string | undefined>('Search by name.');
  readonly error = signal<string | undefined>(undefined);
}

@Component({
  selector: 'wj-iconfield-icons-host',
  imports: [WjIconField, WjInputIcon, WjInputText],
  template: `
    <wj-iconfield id="leading"><wj-inputicon /><input wjInputText aria-label="A" /></wj-iconfield>
    <wj-iconfield id="trailing"><input wjInputText aria-label="B" /><wj-inputicon /></wj-iconfield>
    <wj-iconfield id="both">
      <wj-inputicon /><input wjInputText aria-label="C" /><wj-inputicon />
    </wj-iconfield>
    <wj-iconfield id="none"><input wjInputText aria-label="D" /></wj-iconfield>
  `,
})
class IconsHost {}

/** An icon field with nothing inside it. */
@Component({
  selector: 'wj-iconfield-empty-host',
  imports: [WjIconField],
  template: `<wj-iconfield />`,
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
  expect(getComputedStyle(find(element, 'p-iconfield')).position).toBe('relative');
  return { fixture, host: fixture.componentInstance, element };
}

function find(element: Element, selector: string): HTMLElement {
  const found = element.querySelector(selector);
  if (!(found instanceof HTMLElement)) {
    throw new Error(`${selector} is missing`);
  }
  return found;
}

function box(element: Element, selector: string): DOMRect {
  const found = element.querySelector(selector);
  if (found === null) {
    throw new Error(`${selector} is missing`);
  }
  return found.getBoundingClientRect();
}

/** The input's start and end padding, in px. */
function padding(element: Element): { start: number; end: number } {
  const style = getComputedStyle(find(element, 'input'));
  return { start: parseFloat(style.paddingLeft), end: parseFloat(style.paddingRight) };
}

describe('WjIconField', () => {
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
    it('projects the input inside the Optimus root', async () => {
      const { fixture, element } = await render(Host);
      const root = find(element, 'p-iconfield');
      const loader = TestbedHarnessEnvironment.loader(fixture);
      const iconField = await loader.getHarness(WjIconFieldHarness);

      expect(Array.from(root.children).map((child) => child.localName)).toEqual(['input']);
      expect(await (await iconField.getHarness(WjInputTextHarness)).getValue()).toBe('');
    });

    it('keeps the input a plain text input: its own type, name and value', async () => {
      const { fixture, element } = await render(Host);
      const loader = TestbedHarnessEnvironment.loader(fixture);
      const input = await (
        await loader.getHarness(WjIconFieldHarness)
      ).getHarness(WjInputTextHarness);
      await input.setValue('<b>x</b>');

      expect(find(element, 'input').getAttribute('type')).toBe('search');
      expect(await input.getValue()).toBe('<b>x</b>');
      expect(find(element, 'p-iconfield').querySelector('b')).toBeNull();
    });
  });

  describe('the input fills the box', () => {
    it('is as wide as the icon field the app sized, whatever the size', async () => {
      const { fixture, host, element } = await render(Host);

      for (const size of [undefined, 'small', 'large'] as const) {
        host.size.set(size);
        await fixture.whenStable();

        expect(box(element, 'wj-iconfield').width).toBe(320);
        expect(box(element, 'input').width).toBe(320);
      }
    });

    it('follows a narrower icon field', async () => {
      const { fixture, element } = await render(Host);
      find(element, '#scope').style.width = '200px';
      await fixture.whenStable();

      expect(box(element, 'input').width).toBe(200);
    });

    it('lets an explicit width win', async () => {
      const { fixture, element } = await render(Host);
      find(element, 'input').style.width = '200px';
      await fixture.whenStable();

      expect(box(element, 'input').width).toBe(200);
    });

    it('puts a trailing sibling at the input’s end, not at the far end of a wider box', async () => {
      const { fixture, host, element } = await render(Host);
      host.trailing.set(true);
      await fixture.whenStable();

      expect(box(element, '#trail').right).toBe(box(element, 'input').right - INSET);
    });
  });

  describe('start and end padding', () => {
    // The side with a sibling is 44 px at every size; the bare side is the input's own padding.
    it.each<[string, boolean, boolean]>([
      ['no sibling', false, false],
      ['one before the input', true, false],
      ['one after the input', false, true],
      ['one on each side', true, true],
    ])('%s', async (_name, leading, trailing) => {
      const { fixture, host, element } = await render(Host);

      for (const [size, bare] of [
        [undefined, INSET],
        ['small', 12],
        ['large', LARGE_INSET],
      ] as const) {
        host.size.set(size);
        host.leading.set(leading);
        host.trailing.set(trailing);
        await fixture.whenStable();

        expect(padding(element), `size ${String(size)}`).toEqual({
          start: leading ? PADDED : bare,
          end: trailing ? PADDED : bare,
        });
      }
    });

    it('keeps typed text clear of the sibling at each end', async () => {
      const { fixture, host, element } = await render(Host);
      host.leading.set(true);
      host.trailing.set(true);
      await fixture.whenStable();
      const input = box(element, 'input');
      const border = parseFloat(getComputedStyle(find(element, 'input')).borderLeftWidth);

      expect(input.left + border + padding(element).start).toBeGreaterThanOrEqual(
        box(element, '#lead').right,
      );
      expect(input.right - border - padding(element).end).toBeLessThanOrEqual(
        box(element, '#trail').left,
      );
    });
  });

  describe('icon colour', () => {
    it('is Optimus’s icon colour, and the input’s invalid and disabled states leave it alone', async () => {
      const { fixture, host, element } = await render(Host);
      host.leading.set(true);
      host.trailing.set(true);
      await fixture.whenStable();
      const colour = getComputedStyle(find(element, 'p-inputicon')).color;
      for (const state of [host.invalid, host.disabled]) {
        state.set(true);
        await fixture.whenStable();
        expect(getComputedStyle(find(element, 'p-inputicon')).color).toBe(colour);
        state.set(false);
      }
    });
  });

  describe('host box', () => {
    it('takes the block display of the root it wraps, never contents', async () => {
      const { element } = await render(Host);
      const host = find(element, 'wj-iconfield');
      const root = find(element, 'p-iconfield');

      expect(getComputedStyle(host).display).toBe('block');
      expect(getComputedStyle(root).display).toBe('grid');
      expect(host.getBoundingClientRect().toJSON()).toEqual(root.getBoundingClientRect().toJSON());
    });

    it('is exactly as tall as the input at every size, and draws nothing of its own', async () => {
      const { fixture, host, element } = await render(Host);
      host.leading.set(true);
      host.trailing.set(true);

      for (const [size, height] of [
        [undefined, 44],
        ['small', 36],
        ['large', 52],
      ] as const) {
        host.size.set(size);
        await fixture.whenStable();

        expect(box(element, 'input').height).toBe(height);
        expect(box(element, 'wj-iconfield').height).toBe(height);
      }
      const style = getComputedStyle(find(element, 'wj-iconfield'));
      expect(style.backgroundColor).toBe('rgba(0, 0, 0, 0)');
      expect(style.borderTopWidth).toBe('0px');
      expect(style.paddingTop).toBe('0px');
      expect(style.marginTop).toBe('0px');
    });

    it('has no height with nothing inside it', async () => {
      TestBed.configureTestingModule({ providers: [provideWeeljack()] });
      const fixture = TestBed.createComponent(EmptyHost);
      await fixture.whenStable();

      expect(
        find(fixture.nativeElement as HTMLElement, 'wj-iconfield').getBoundingClientRect().height,
      ).toBe(0);
    });
  });

  describe('pt', () => {
    it('reaches host and root, as an object', async () => {
      const { element } = await render(Host, 'light', (host) => {
        host.pt.set({ root: { 'data-probe': 'root' }, host: { 'data-host': 'host' } });
      });
      const root = find(element, 'p-iconfield');

      await expect.poll(() => root.getAttribute('data-probe')).toBe('root');
      expect(root.getAttribute('data-host')).toBe('host');
    });

    it('reaches root, as a function', async () => {
      const { element } = await render(Host, 'light', (host) => {
        host.pt.set(() => ({ root: { 'data-probe': 'fn' } }));
      });

      await expect.poll(() => find(element, 'p-iconfield').getAttribute('data-probe')).toBe('fn');
    });

    it('keeps the projected input in place and filling', async () => {
      const { element } = await render(Host, 'light', (host) => {
        host.pt.set({ root: 'probe-class' });
      });
      const root = find(element, 'p-iconfield');

      await expect.poll(() => root.classList.contains('probe-class')).toBe(true);
      expect(root.children).toHaveLength(1);
      expect(box(element, 'input').width).toBe(320);
    });
  });

  describe('inside a wj-field', () => {
    it('is named by the field’s label through <label for>', async () => {
      const { fixture, element } = await render(FieldHost);
      const loader = TestbedHarnessEnvironment.loader(fixture);
      const field = await loader.getHarness(WjFieldHarness.with({ label: 'Search' }));
      const input = find(element, 'input');
      const label = find(element, 'label.wj-field-label');

      expect(await field.isGroup()).toBe(false);
      expect(label.getAttribute('for')).toBe('field-search');
      expect(input).toHaveProperty('labels.0', label);
      expect(await (await field.getHarness(WjInputTextHarness)).getId()).toBe('field-search');
    });

    it('describes the input by the hint, then by the error too', async () => {
      const { fixture, host, element } = await render(FieldHost);
      const input = find(element, 'input');
      const hintId = find(element, '.wj-field-hint').id;

      expect(input.getAttribute('aria-describedby')).toBe(hintId);

      host.error.set('Enter a name.');
      await fixture.whenStable();

      await expect
        .poll(() => input.getAttribute('aria-describedby'))
        .toBe(`${hintId} ${find(element, '.wj-field-error').id}`);
    });

    it('is invalid exactly while the field shows an error', async () => {
      const { fixture, host, element } = await render(FieldHost);
      const input = find(element, 'input');
      expect(input.hasAttribute('aria-invalid')).toBe(false);

      host.error.set('Enter a name.');
      await fixture.whenStable();
      await expect.poll(() => input.getAttribute('aria-invalid')).toBe('true');

      host.error.set(undefined);
      await fixture.whenStable();
      await expect.poll(() => input.hasAttribute('aria-invalid')).toBe(false);
    });

    it('fills the field’s width, with the start padding for the sibling', async () => {
      const { element } = await render(FieldHost);

      expect(box(element, 'wj-iconfield').width).toBe(box(element, '.wj-field-box').width);
      expect(box(element, 'input').width).toBe(box(element, 'wj-iconfield').width);
      expect(padding(element)).toEqual({ start: PADDED, end: INSET });
    });
  });

  describe('harness', () => {
    it('reads each side from the order of the icons', async () => {
      const { fixture } = await render(IconsHost);
      const loader = TestbedHarnessEnvironment.loader(fixture);
      const sides = await Promise.all(
        (await loader.getAllHarnesses(WjIconFieldHarness)).map(
          async (iconField) =>
            [await iconField.hasLeadingIcon(), await iconField.hasTrailingIcon()] as const,
        ),
      );

      expect(sides).toEqual([
        [true, false],
        [false, true],
        [true, true],
        [false, false],
      ]);
    });

    it('reports no icon on either side for a bare input', async () => {
      const { fixture } = await render(Host);
      const iconField =
        await TestbedHarnessEnvironment.loader(fixture).getHarness(WjIconFieldHarness);

      expect(await iconField.hasLeadingIcon()).toBe(false);
      expect(await iconField.hasTrailingIcon()).toBe(false);
    });
  });

  describe('accessibility', () => {
    describe.each<Scheme>(['light', 'dark'])('%s', (scheme) => {
      it.each<[string, (host: Host) => void]>([
        ['an input with no icon', () => undefined],
        [
          'an input with a sibling at each end',
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

      it('has no axe violations: in a field, with a hint and then an error', async () => {
        const { fixture, host, element } = await render(FieldHost, scheme);
        await expectNoAxeViolations(find(element, '#scope'));

        host.error.set('Enter a name.');
        await fixture.whenStable();
        await expectNoAxeViolations(find(element, '#scope'));
      });
    });

    it('adds no role and no tabindex of its own', async () => {
      const { element } = await render(Host);

      for (const selector of ['wj-iconfield', 'p-iconfield']) {
        expect(find(element, selector).getAttribute('role')).toBeNull();
        expect(find(element, selector).tabIndex).toBe(-1);
      }
    });
  });

  describe('keyboard', () => {
    it('Tab goes to the input and on: the icon field is no stop; Shift+Tab goes back', async () => {
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
      const fixture = TestBed.createComponent(EmptyHost);
      await fixture.whenStable();

      expect(warn).not.toHaveBeenCalled();
    });

    it('warns WJ0001 when provideWeeljack is missing', async () => {
      const fixture = TestBed.createComponent(EmptyHost);
      await fixture.whenStable();

      expect(warn).toHaveBeenCalledExactlyOnceWith(
        'WJ0001: wj-iconfield: provideWeeljack() is missing from the application providers. ' +
          'Add provideWeeljack() to your application config. ' +
          'Find more at https://locvodever.github.io/weeljack-ng/errors/WJ0001',
      );
    });
  });
});
