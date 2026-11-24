import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Component, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import type { MockInstance } from 'vitest';
import { userEvent } from 'vitest/browser';
import { provideWeeljack } from 'weeljack-ng';
import { WjChip, type WjChipPt } from 'weeljack-ng/chip';
import { WjChipHarness } from 'weeljack-ng/chip/testing';
import { expectNoAxeViolations } from '../spec-support/axe';

const PAYLOAD = '<img src=x onerror="window.wjInjected = true">';
const URL_PAYLOADS = ['javascript:window.wjInjected=true', 'x" onerror="window.wjInjected=true'];
const ROOT = document.documentElement;

/** Local `data:` images only (no network): a flat portrait, a second one, and one that is broken. */
const PORTRAIT = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><rect width="64" height="64" fill="#7c9885"/><circle cx="32" cy="26" r="12" fill="#f4f1de"/><path d="M10 64a22 22 0 0 1 44 0z" fill="#f4f1de"/></svg>',
)}`;
const OTHER_PORTRAIT = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><rect width="64" height="64" fill="#3d5a80"/><circle cx="32" cy="26" r="12" fill="#e0fbfc"/></svg>',
)}`;
const BROKEN = 'data:image/png;base64,AAAA';

/** A consumer's template: one chip between two native buttons. */
@Component({
  selector: 'wj-chip-host',
  imports: [WjChip],
  template: `
    <button type="button" id="before">Before</button>
    <wj-chip
      [label]="label()"
      [image]="image()"
      [alt]="alt()"
      [disabled]="disabled()"
      [removable]="removable()"
      [pt]="pt()"
      (removed)="removedCount.update((count) => count + 1)"
      (imageError)="errors.push($event)"
    >
      @if (withIcon()) {
        <svg id="icon" width="1em" height="1em" viewBox="0 0 16 16" aria-hidden="true">
          <circle cx="8" cy="8" r="6" fill="currentColor" />
        </svg>
      }
    </wj-chip>
    <button type="button" id="after">After</button>
  `,
})
class Host {
  readonly label = signal<string | undefined>('In stock');
  readonly image = signal<string | undefined>(undefined);
  readonly alt = signal('');
  readonly disabled = signal(false);
  readonly removable = signal(false);
  readonly pt = signal<WjChipPt>(undefined);
  readonly withIcon = signal(false);
  readonly removedCount = signal(0);
  readonly errors: Event[] = [];
}

/** A consumer who writes aria-* on the host: it is not forwarded. */
@Component({
  selector: 'wj-chip-aria-on-host-host',
  imports: [WjChip],
  template: `<wj-chip label="In stock" aria-label="Other" />`,
})
class AriaOnHostHost {}

/** A chip rendered without `provideWeeljack`. */
@Component({
  selector: 'wj-chip-routed-host',
  imports: [WjChip],
  template: `<wj-chip label="In stock" />`,
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
  translation?: Parameters<typeof provideWeeljack>[0],
): Promise<Rendered> {
  ROOT.classList.toggle('wj-dark', scheme === 'dark');
  document.body.style.backgroundColor = 'var(--wj-content-background)';
  TestBed.configureTestingModule({
    providers: [provideWeeljack({ darkMode: 'class', ...translation })],
  });
  const fixture = TestBed.createComponent(Host);
  setup(fixture.componentInstance);
  await fixture.whenStable();
  const element = fixture.nativeElement as HTMLElement;
  // A render without Optimus's styles would pass axe for the wrong reason: fail loudly instead.
  expect(find(element, 'p-chip', HTMLElement).getBoundingClientRect().height).toBeGreaterThan(0);
  return { fixture, component: fixture.componentInstance, element };
}

function find<E extends Element>(element: HTMLElement, selector: string, type: new () => E): E {
  const found = element.querySelector(selector);
  if (!(found instanceof type)) {
    throw new Error(`${selector} is missing`);
  }
  return found;
}

const hostOf = (element: HTMLElement): HTMLElement => find(element, 'wj-chip', HTMLElement);
const rootOf = (element: HTMLElement): HTMLElement => find(element, 'p-chip', HTMLElement);
const photoOf = (element: HTMLElement): HTMLImageElement => find(element, 'img', HTMLImageElement);
const buttonOf = (element: HTMLElement): HTMLButtonElement =>
  find(element, 'wj-chip button', HTMLButtonElement);
const glyphOf = (element: HTMLElement): SVGElement =>
  find(element, 'wj-chip button svg', SVGElement);
const spanOf = (element: HTMLElement): HTMLElement =>
  find(element, '.p-chip-remove-icon', HTMLElement);
const labelOf = (element: HTMLElement): HTMLElement =>
  find(element, '[data-pc-section="label"]', HTMLElement);

function harnessOf(fixture: ComponentFixture<unknown>): Promise<WjChipHarness> {
  return TestbedHarnessEnvironment.loader(fixture).getHarness(WjChipHarness);
}

/** Polls until the photo has loaded (or failed), so a spec never reads a half-rendered box. */
async function photoSettled(element: HTMLElement): Promise<void> {
  await expect.poll(() => photoOf(element).complete).toBe(true);
}

/** What a keyboard user can reach inside the chip: its Tab stops, in DOM order. */
function tabStops(element: HTMLElement): Element[] {
  return Array.from(
    hostOf(element).querySelectorAll(
      'button:not([disabled]), [tabindex]:not([tabindex="-1"]), a[href], input, select, textarea',
    ),
  );
}

/** The colour a CSS value (a `--wj-*` variable, say) resolves to, through a probe element. */
function resolvedColor(value: string): string {
  const probe = document.createElement('span');
  probe.style.color = value;
  document.body.append(probe);
  const color = getComputedStyle(probe).color;
  probe.remove();
  return color;
}

/**
 * The FR-28 invariants, true in every state: the Optimus span around the button is neither a
 * `role="button"`, nor a Tab stop, nor named; the one button is native; the chip is still there.
 */
function expectOnlyNativeButton(
  element: HTMLElement,
  state: { removable: boolean; disabled?: boolean },
): void {
  const chip = hostOf(element);
  expect(chip.querySelectorAll('[role="button"]')).toHaveLength(0);
  expect(chip.querySelectorAll('button')).toHaveLength(state.removable ? 1 : 0);
  const span = chip.querySelector('.p-chip-remove-icon');
  if (state.removable) {
    expect(span).not.toBeNull();
    expect(span?.getAttribute('role')).toBeNull();
    expect(span?.getAttribute('tabindex')).toBeNull();
    expect(span?.getAttribute('aria-label')).toBeNull();
  } else {
    expect(span).toBeNull();
  }
  expect(tabStops(element)).toHaveLength(state.removable && !state.disabled ? 1 : 0);
  expect(getComputedStyle(rootOf(element)).display).not.toBe('none');
  expect(rootOf(element).getBoundingClientRect().height).toBeGreaterThan(0);
}

const STATES: [string, (host: Host) => void][] = [
  ['default', () => undefined],
  [
    'with image',
    (host) => {
      host.image.set(PORTRAIT);
      host.label.set('Ana Lima');
    },
  ],
  [
    'removable',
    (host) => {
      host.removable.set(true);
    },
  ],
  [
    'removable and disabled',
    (host) => {
      host.removable.set(true);
      host.disabled.set(true);
    },
  ],
  [
    'removable with image',
    (host) => {
      host.removable.set(true);
      host.image.set(PORTRAIT);
      host.label.set('Ana Lima');
    },
  ],
];

describe('WjChip', () => {
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

  describe('inputs', () => {
    it('shows the label, and updates when it changes', async () => {
      const { fixture, component } = await render();
      const chip = await harnessOf(fixture);
      expect(await chip.getLabel()).toBe('In stock');
      expect(await chip.getImageUrl()).toBeNull();
      expect(await chip.getAlt()).toBeNull();

      component.label.set('On sale');
      await fixture.whenStable();

      expect(await chip.getLabel()).toBe('On sale');
    });

    it('is found by its label', async () => {
      const { fixture } = await render();
      const loader = TestbedHarnessEnvironment.loader(fixture);

      expect(await loader.getAllHarnesses(WjChipHarness.with({ label: 'In stock' }))).toHaveLength(
        1,
      );
      expect(await loader.getAllHarnesses(WjChipHarness.with({ label: /^In/ }))).toHaveLength(1);
      expect(await loader.getAllHarnesses(WjChipHarness.with({ label: 'Free' }))).toHaveLength(0);
    });

    it('shows the photo with an empty alt by default, and updates when the URL changes', async () => {
      const { fixture, component, element } = await render((host) => {
        host.image.set(PORTRAIT);
      });
      const chip = await harnessOf(fixture);
      expect(await chip.getImageUrl()).toBe(PORTRAIT);
      expect(await chip.getAlt()).toBe('');
      expect(await chip.getLabel()).toBe('In stock');

      component.image.set(OTHER_PORTRAIT);
      await fixture.whenStable();

      expect(await chip.getImageUrl()).toBe(OTHER_PORTRAIT);
      expect(await chip.getAlt()).toBe('');
      expect(element.querySelectorAll('img')).toHaveLength(1);
    });

    it('alt reaches the photo, and a later change updates it', async () => {
      const { fixture, component } = await render((host) => {
        host.image.set(PORTRAIT);
        host.alt.set('Ana Lima');
      });
      const chip = await harnessOf(fixture);
      expect(await chip.getAlt()).toBe('Ana Lima');

      component.alt.set('Bao Tran');
      await fixture.whenStable();

      expect(await chip.getAlt()).toBe('Bao Tran');
    });

    it('emits imageError once for a photo that fails to load, with the browser event', async () => {
      const { component } = await render((host) => {
        host.image.set(BROKEN);
      });

      await expect.poll(() => component.errors.length).toBe(1);
      expect(component.errors[0]?.type).toBe('error');
    });

    it('has no remove button unless removable, and gains and loses it with the input', async () => {
      const { fixture, component, element } = await render();
      const chip = await harnessOf(fixture);
      expect(await chip.isRemovable()).toBe(false);
      expectOnlyNativeButton(element, { removable: false });

      component.removable.set(true);
      await fixture.whenStable();
      expect(await chip.isRemovable()).toBe(true);
      expectOnlyNativeButton(element, { removable: true });

      component.removable.set(false);
      await fixture.whenStable();
      expect(await chip.isRemovable()).toBe(false);
      expectOnlyNativeButton(element, { removable: false });
    });

    it('disabled disables the button, and a later change re-enables it', async () => {
      const { fixture, component, element } = await render((host) => {
        host.removable.set(true);
      });
      const chip = await harnessOf(fixture);
      expect(await chip.isDisabled()).toBe(false);

      component.disabled.set(true);
      await fixture.whenStable();
      expect(await chip.isDisabled()).toBe(true);
      expect(buttonOf(element).disabled).toBe(true);
      expectOnlyNativeButton(element, { removable: true, disabled: true });

      component.disabled.set(false);
      await fixture.whenStable();
      expect(await chip.isDisabled()).toBe(false);
      expect(buttonOf(element).disabled).toBe(false);
      expectOnlyNativeButton(element, { removable: true });
    });

    it('renders projected content before the label', async () => {
      const { element } = await render((host) => {
        host.withIcon.set(true);
      });

      expect(rootOf(element).firstElementChild).toBe(find(element, '#icon', SVGElement));
    });
  });

  describe('the remove button (FR-28)', () => {
    it('is the chip’s last child, a native button of type button, with no role', async () => {
      const { element } = await render((host) => {
        host.removable.set(true);
        host.image.set(PORTRAIT);
      });
      const button = buttonOf(element);

      expect(button.type).toBe('button');
      expect(button.hasAttribute('role')).toBe(false);
      expect(rootOf(element).lastElementChild).toBe(spanOf(element));
      expect(spanOf(element).contains(button)).toBe(true);
      expect(button.getBoundingClientRect().right).toBeGreaterThan(
        labelOf(element).getBoundingClientRect().right,
      );
      expectOnlyNativeButton(element, { removable: true });
    });

    it('is named from the translation, English by default', async () => {
      const { element } = await render((host) => {
        host.removable.set(true);
      });

      expect(buttonOf(element).getAttribute('aria-label')).toBe('Remove');
    });

    it('follows the translation: a changed aria.removeLabel renames it', async () => {
      const { element } = await render(
        (host) => {
          host.removable.set(true);
        },
        'light',
        { translation: { aria: { removeLabel: 'Xoá' } } },
      );

      expect(buttonOf(element).getAttribute('aria-label')).toBe('Xoá');
    });

    it('is described by the label element, whose id is the chip’s own', async () => {
      const { fixture, component, element } = await render((host) => {
        host.removable.set(true);
      });
      const describedBy = buttonOf(element).getAttribute('aria-describedby');

      expect(describedBy).toMatch(/^wj-chip-label-\d+$/);
      expect(labelOf(element).id).toBe(describedBy);
      expect(document.getElementById(describedBy ?? '')?.textContent.trim()).toBe('In stock');

      component.label.set(undefined);
      await fixture.whenStable();
      expect(buttonOf(element).hasAttribute('aria-describedby')).toBe(false);

      component.label.set('On sale');
      await fixture.whenStable();
      expect(buttonOf(element).getAttribute('aria-describedby')).toBe(describedBy);
      expect(labelOf(element).id).toBe(describedBy);
    });

    it('gives two chips two different label ids', async () => {
      const { element } = await render((host) => {
        host.removable.set(true);
      });
      const second = TestBed.createComponent(Host);
      second.componentInstance.removable.set(true);
      await second.whenStable();

      expect(labelOf(element).id).not.toBe(labelOf(second.nativeElement as HTMLElement).id);
    });

    it('has a hit box of at least 24 x 24 px, centred on a 16 px glyph', async () => {
      const { element } = await render((host) => {
        host.removable.set(true);
      });
      const box = buttonOf(element).getBoundingClientRect();
      const glyph = glyphOf(element).getBoundingClientRect();

      expect([box.width, box.height]).toEqual([24, 24]);
      expect([glyph.width, glyph.height]).toEqual([16, 16]);
      expect(box.left + box.width / 2).toBeCloseTo(glyph.left + glyph.width / 2, 1);
      expect(box.top + box.height / 2).toBeCloseTo(glyph.top + glyph.height / 2, 1);
      expect(glyphOf(element).getAttribute('aria-hidden')).toBe('true');
    });

    it('keeps Optimus’s glyph position and the chip’s height', async () => {
      const { fixture, component, element } = await render();
      const plain = rootOf(element).getBoundingClientRect();

      component.removable.set(true);
      await fixture.whenStable();
      const removable = rootOf(element).getBoundingClientRect();
      const glyph = glyphOf(element).getBoundingClientRect();
      const label = labelOf(element).getBoundingClientRect();

      expect(removable.height).toBe(plain.height);
      expect(glyph.left - label.right).toBe(8);
      expect(removable.right - glyph.right).toBe(8);
    });

    it('is transparent and borderless, with a pointer cursor and no hover fill', async () => {
      const { element } = await render((host) => {
        host.removable.set(true);
      });
      const button = buttonOf(element);
      await userEvent.hover(button);
      const style = getComputedStyle(button);

      expect(style.backgroundColor).toBe('rgba(0, 0, 0, 0)');
      expect(style.borderTopWidth).toBe('0px');
      expect(style.cursor).toBe('pointer');
      expect(style.borderRadius).toBe('50%');
      await userEvent.unhover(button);
    });

    it.each<Scheme>(['light', 'dark'])(
      'takes the glyph colour from the chip in the %s scheme',
      async (scheme) => {
        const { element } = await render((host) => {
          host.removable.set(true);
        }, scheme);

        expect(getComputedStyle(glyphOf(element)).color).toBe(
          resolvedColor('var(--wj-chip-remove-icon-color)'),
        );
      },
    );

    it('shows the preset focus ring around the button, at offset 0', async () => {
      const { element } = await render((host) => {
        host.removable.set(true);
      });
      find(element, '#before', HTMLElement).focus();
      await userEvent.tab();
      expect(document.activeElement).toBe(buttonOf(element));
      const style = getComputedStyle(buttonOf(element));

      expect(style.outlineWidth).toBe('2px');
      expect(style.outlineStyle).toBe('solid');
      expect(style.outlineOffset).toBe('0px');
      expect(style.outlineColor).toBe(resolvedColor('var(--wj-focus-ring-color)'));
    });

    it('while disabled: the glyph is faded, the cursor is the default, the body unchanged', async () => {
      const { fixture, component, element } = await render((host) => {
        host.removable.set(true);
      });
      const background = getComputedStyle(rootOf(element)).backgroundColor;
      const color = getComputedStyle(labelOf(element)).color;
      expect(getComputedStyle(glyphOf(element)).opacity).toBe('1');

      component.disabled.set(true);
      await fixture.whenStable();

      expect(getComputedStyle(glyphOf(element)).opacity).toBe('0.6');
      expect(getComputedStyle(buttonOf(element)).cursor).toBe('default');
      expect(getComputedStyle(rootOf(element)).backgroundColor).toBe(background);
      expect(getComputedStyle(labelOf(element)).color).toBe(color);
      expect(getComputedStyle(rootOf(element)).opacity).toBe('1');
    });
  });

  describe('removal: one emission per activation, and the chip never hides itself', () => {
    it('a click through the harness emits removed once, and the chip stays', async () => {
      const { fixture, component, element } = await render((host) => {
        host.removable.set(true);
      });
      await (await harnessOf(fixture)).remove();

      expect(component.removedCount()).toBe(1);
      expectOnlyNativeButton(element, { removable: true });
    });

    it('a pointer click on the glyph emits removed once, and the chip stays', async () => {
      const { component, element } = await render((host) => {
        host.removable.set(true);
      });
      await userEvent.click(glyphOf(element));

      expect(component.removedCount()).toBe(1);
      expectOnlyNativeButton(element, { removable: true });
    });

    it.each([
      ['Enter', '{Enter}'],
      ['Space', ' '],
      ['Backspace', '{Backspace}'],
    ])('%s on the focused button emits removed once, and the chip stays', async (_name, key) => {
      const { fixture, component, element } = await render((host) => {
        host.removable.set(true);
      });
      await (await harnessOf(fixture)).focusRemoveButton();
      expect(document.activeElement).toBe(buttonOf(element));

      await userEvent.keyboard(key);

      expect(component.removedCount()).toBe(1);
      expectOnlyNativeButton(element, { removable: true });
      expect(document.activeElement).toBe(buttonOf(element));
    });

    it('does not emit for a key the button does not handle', async () => {
      const { fixture, component, element } = await render((host) => {
        host.removable.set(true);
      });
      await (await harnessOf(fixture)).focusRemoveButton();

      await userEvent.keyboard('{Delete}{Escape}a');

      expect(component.removedCount()).toBe(0);
      expectOnlyNativeButton(element, { removable: true });
    });

    it('lets a key other than Enter and Backspace reach the app', async () => {
      const { fixture, element } = await render((host) => {
        host.removable.set(true);
      });
      const seen: string[] = [];
      const listener = (event: KeyboardEvent): void => {
        seen.push(event.key);
      };
      element.addEventListener('keydown', listener);
      await (await harnessOf(fixture)).focusRemoveButton();

      await userEvent.keyboard('{Escape}{Enter}{Backspace}');
      element.removeEventListener('keydown', listener);

      expect(seen).toEqual(['Escape']);
    });

    it('emits nothing while disabled, for a click on the button or on its glyph', async () => {
      const { component, element } = await render((host) => {
        host.removable.set(true);
        host.disabled.set(true);
      });
      const glyph = glyphOf(element);

      buttonOf(element).click();
      glyph.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      const box = glyph.getBoundingClientRect();
      document
        .elementFromPoint(box.left + 8, box.top + 8)
        ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

      expect(component.removedCount()).toBe(0);
      expectOnlyNativeButton(element, { removable: true, disabled: true });
    });

    it('emits once per activation after the state has changed under it', async () => {
      const { fixture, component, element } = await render();
      const chip = await harnessOf(fixture);

      component.removable.set(true);
      component.disabled.set(true);
      await fixture.whenStable();
      expectOnlyNativeButton(element, { removable: true, disabled: true });
      component.disabled.set(false);
      await fixture.whenStable();
      expectOnlyNativeButton(element, { removable: true });
      component.label.set('On sale');
      component.image.set(PORTRAIT);
      await fixture.whenStable();
      expectOnlyNativeButton(element, { removable: true });
      component.pt.set({ root: { 'data-x': 'y' } });
      await fixture.whenStable();
      expectOnlyNativeButton(element, { removable: true });

      await chip.remove();
      await chip.focusRemoveButton();
      await userEvent.keyboard('{Enter}');
      await userEvent.keyboard('{Backspace}');
      await userEvent.keyboard(' ');

      expect(component.removedCount()).toBe(4);
      expectOnlyNativeButton(element, { removable: true });
    });
  });

  describe('pt', () => {
    it('reaches root, image, label and removeIcon as an object, keeping consumer keys', async () => {
      const { element } = await render((host) => {
        host.removable.set(true);
        host.image.set(PORTRAIT);
        host.pt.set({
          root: { 'data-root': 'a' },
          image: { 'data-image': 'b' },
          label: { 'data-label': 'c' },
          removeIcon: { 'data-remove': 'd' },
        });
      });

      expect(rootOf(element).getAttribute('data-root')).toBe('a');
      expect(photoOf(element).getAttribute('data-image')).toBe('b');
      expect(labelOf(element).getAttribute('data-label')).toBe('c');
      expect(labelOf(element).id).toMatch(/^wj-chip-label-\d+$/);
      expect(spanOf(element).getAttribute('data-remove')).toBe('d');
      expectOnlyNativeButton(element, { removable: true });
    });

    it('reaches the parts as a function too', async () => {
      const { element } = await render((host) => {
        host.removable.set(true);
        host.image.set(PORTRAIT);
        host.pt.set(() => ({
          root: () => ({ 'data-probe': 'fn' }),
          image: () => ({ 'data-probe-image': 'fn' }),
          label: () => ({ 'data-probe-label': 'fn' }),
          removeIcon: () => ({ 'data-probe-remove': 'fn' }),
        }));
      });

      expect(rootOf(element).getAttribute('data-probe')).toBe('fn');
      expect(photoOf(element).getAttribute('data-probe-image')).toBe('fn');
      expect(labelOf(element).getAttribute('data-probe-label')).toBe('fn');
      expect(spanOf(element).getAttribute('data-probe-remove')).toBe('fn');
      expect(labelOf(element).id).toMatch(/^wj-chip-label-\d+$/);
      expectOnlyNativeButton(element, { removable: true });
    });

    it('lets the routed label id win over a consumer one', async () => {
      const { element } = await render((host) => {
        host.removable.set(true);
        host.pt.set({ label: { id: 'mine' } });
      });

      expect(labelOf(element).id).toMatch(/^wj-chip-label-\d+$/);
      expect(buttonOf(element).getAttribute('aria-describedby')).toBe(labelOf(element).id);
    });

    it('keeps the span inert when the pt changes, and when it is replaced', async () => {
      const { fixture, component, element } = await render((host) => {
        host.removable.set(true);
      });

      component.pt.set({ removeIcon: { 'data-a': '1' } });
      await fixture.whenStable();
      expectOnlyNativeButton(element, { removable: true });
      component.pt.set(undefined);
      await fixture.whenStable();
      expectOnlyNativeButton(element, { removable: true });
      component.pt.set(() => ({ root: { 'data-b': '2' } }));
      await fixture.whenStable();
      expectOnlyNativeButton(element, { removable: true });
    });
  });

  describe('host and look', () => {
    it('is an inline-flex host with no box of its own around the Optimus root', async () => {
      const { element } = await render((host) => {
        host.removable.set(true);
      });
      const host = hostOf(element);
      const root = rootOf(element).getBoundingClientRect();

      expect(getComputedStyle(host).display).toBe('inline-flex');
      expect(host.getBoundingClientRect().height).toBe(root.height);
      expect(host.getBoundingClientRect().width).toBe(root.width);
    });

    it('fills the 32 px photo circle, cropping a photo, never stretching it', async () => {
      const { element } = await render((host) => {
        host.image.set(PORTRAIT);
      });
      await photoSettled(element);
      const photo = photoOf(element);

      expect(getComputedStyle(photo).objectFit).toBe('cover');
      expect(getComputedStyle(photo).borderRadius).toBe('50%');
      const box = photo.getBoundingClientRect();
      expect([box.width, box.height]).toEqual([32, 32]);
    });

    it('wraps a long label at spaces, never truncating it', async () => {
      const { fixture, element } = await render((host) => {
        host.label.set('A label long enough to need several lines inside a narrow box');
        host.removable.set(true);
      });
      hostOf(element).style.width = '12rem';
      await fixture.whenStable();

      expect(getComputedStyle(labelOf(element)).textOverflow).not.toBe('ellipsis');
      expect(labelOf(element).scrollWidth).toBeLessThanOrEqual(labelOf(element).clientWidth);
      expect(labelOf(element).getBoundingClientRect().height).toBeGreaterThan(30);
      const box = buttonOf(element).getBoundingClientRect();
      const chip = rootOf(element).getBoundingClientRect();
      expect(box.top + box.height / 2).toBeCloseTo(chip.top + chip.height / 2, 0);
    });
  });

  describe('safety', () => {
    it('renders an HTML payload in label as text, creating no element and running nothing', async () => {
      const { fixture, element } = await render((host) => {
        host.label.set(PAYLOAD);
        host.removable.set(true);
      });

      expect(await (await harnessOf(fixture)).getLabel()).toBe(PAYLOAD);
      expect(element.querySelector('img, script')).toBeNull();
      expect(Reflect.get(window, 'wjInjected')).toBeUndefined();
    });

    it('keeps an HTML payload in alt inside the attribute value', async () => {
      const { fixture, element } = await render((host) => {
        host.image.set(PORTRAIT);
        host.alt.set(PAYLOAD);
      });

      expect(await (await harnessOf(fixture)).getAlt()).toBe(PAYLOAD);
      expect(element.querySelectorAll('img')).toHaveLength(1);
      expect(element.querySelector('script')).toBeNull();
      expect(Reflect.get(window, 'wjInjected')).toBeUndefined();
    });

    it.each([PAYLOAD, ...URL_PAYLOADS])(
      'lands the image payload %s verbatim as the one img src, and runs nothing',
      async (payload) => {
        const { fixture, element } = await render((host) => {
          host.image.set(payload);
        });

        const images = element.querySelectorAll('img');
        expect(images).toHaveLength(1);
        expect(images[0]?.getAttribute('src')).toBe(payload);
        expect(images[0]?.hasAttribute('onerror')).toBe(false);
        expect(await (await harnessOf(fixture)).getImageUrl()).toBe(payload);
        expect(element.querySelector('script')).toBeNull();
        // Let a failing load (the payloads are not images) run its error event, then check.
        await photoSettled(element);
        expect(Reflect.get(window, 'wjInjected')).toBeUndefined();
      },
    );
  });

  describe('setup and ARIA checks', () => {
    it('warns WJ0001 when provideWeeljack is missing', async () => {
      const fixture = TestBed.createComponent(RoutedHost);
      await fixture.whenStable();

      expect(warn).toHaveBeenCalledTimes(1);
      expect(warn).toHaveBeenCalledWith(
        'WJ0001: wj-chip: provideWeeljack() is missing from the application providers. ' +
          'Add provideWeeljack() to your application config. ' +
          'Find more at https://locvodever.github.io/weeljack-ng/errors/WJ0001',
      );
    });

    it('warns WJ0003 for aria-* on the host and forwards nothing', async () => {
      TestBed.configureTestingModule({ providers: [provideWeeljack()] });
      const fixture = TestBed.createComponent(AriaOnHostHost);
      await fixture.whenStable();

      expect(warn).toHaveBeenCalledTimes(1);
      expect(warn).toHaveBeenCalledWith(
        'WJ0003: wj-chip: aria-label is set on the host, where it is not forwarded to the ' +
          'focusable element. Remove it: the chip is named by its label, and its remove button by ' +
          'the translation. Find more at https://locvodever.github.io/weeljack-ng/errors/WJ0003',
      );
    });

    it('stays silent for a removable chip', async () => {
      await render((host) => {
        host.removable.set(true);
      });

      expect(warn).not.toHaveBeenCalled();
    });
  });

  describe('accessibility', () => {
    describe.each<Scheme>(['light', 'dark'])('%s', (scheme) => {
      it.each(STATES)('has no axe violations: %s', async (_name, setup) => {
        const { element } = await render(setup, scheme);
        if (element.querySelector('img')) {
          await photoSettled(element);
        }

        // The fixture's native Before/After buttons are not under test and fail `target-size`.
        await expectNoAxeViolations(hostOf(element));
      });
    });
  });

  describe('keyboard', () => {
    it('Tab stops once on the remove button, between the buttons around the chip', async () => {
      const { element } = await render((host) => {
        host.removable.set(true);
      });
      find(element, '#before', HTMLElement).focus();

      await userEvent.tab();
      expect(document.activeElement).toBe(buttonOf(element));
      await userEvent.tab();
      expect(document.activeElement).toBe(find(element, '#after', HTMLElement));
      await userEvent.tab({ shift: true });
      expect(document.activeElement).toBe(buttonOf(element));
      await userEvent.tab({ shift: true });
      expect(document.activeElement).toBe(find(element, '#before', HTMLElement));
    });

    it.each<[string, (host: Host) => void]>([
      [
        'a disabled remove button',
        (host) => {
          host.removable.set(true);
          host.disabled.set(true);
        },
      ],
      ['a plain chip', () => undefined],
    ])('%s is not in the Tab order', async (_name, setup) => {
      const { element } = await render(setup);
      find(element, '#before', HTMLElement).focus();

      await userEvent.tab();

      expect(document.activeElement).toBe(find(element, '#after', HTMLElement));
    });

    it('Enter, Space and Backspace each remove once, after Tab reached the button', async () => {
      const { component, element } = await render((host) => {
        host.removable.set(true);
      });
      find(element, '#before', HTMLElement).focus();
      await userEvent.tab();

      await userEvent.keyboard('{Enter}');
      expect(component.removedCount()).toBe(1);
      await userEvent.keyboard(' ');
      expect(component.removedCount()).toBe(2);
      await userEvent.keyboard('{Backspace}');
      expect(component.removedCount()).toBe(3);
      expectOnlyNativeButton(element, { removable: true });
    });
  });
});
