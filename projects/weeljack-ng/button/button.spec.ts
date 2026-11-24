import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Component, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import type { MockInstance } from 'vitest';
import { userEvent } from 'vitest/browser';
import { provideWeeljack } from 'weeljack-ng';
import {
  WjButton,
  type WjButtonAriaHasPopup,
  type WjButtonPt,
  type WjButtonSeverity,
} from 'weeljack-ng/button';
import { WjButtonHarness } from 'weeljack-ng/button/testing';
import { WjIcon, wjIconSettings } from 'weeljack-ng/icon';
import { expectNoAxeViolations } from '../spec-support/axe';

const PAYLOAD = '<img src=x onerror="window.wjInjected = true">';
const ROOT = document.documentElement;
const CLEAR = 'rgba(0, 0, 0, 0)';
const SEVERITIES: WjButtonSeverity[] = [
  'primary',
  'secondary',
  'success',
  'info',
  'warn',
  'danger',
  'help',
  'contrast',
];

/** A consumer's template: a button inside a form, with the click handler on `wj-button`. */
@Component({
  selector: 'wj-button-host',
  imports: [WjButton, WjIcon],
  template: `
    <button type="button" id="before">Before</button>
    <form (submit)="onSubmit($event)">
      <div [style.width]="width()">
        <wj-button
          [label]="label()"
          [loading]="loading()"
          [disabled]="disabled()"
          [size]="size()"
          [variant]="variant()"
          [severity]="severity()"
          [type]="type()"
          [ariaLabel]="ariaLabel()"
          [ariaLabelledBy]="ariaLabelledBy()"
          [ariaDescribedBy]="ariaDescribedBy()"
          [ariaHasPopup]="ariaHasPopup()"
          [ariaExpanded]="ariaExpanded()"
          [pt]="pt()"
          (click)="clicks.update((count) => count + 1)"
        >
          @if (icon()) {
            <wj-icon [icon]="settings" />
          }
        </wj-button>
      </div>
    </form>
    <button type="button" id="after">After</button>
    <p id="name">Name</p>
    <p id="hint">Hint</p>
  `,
})
class Host {
  readonly label = signal<string | undefined>('Save');
  readonly loading = signal(false);
  readonly disabled = signal(false);
  readonly size = signal<'small' | 'large' | undefined>(undefined);
  readonly variant = signal<'outlined' | 'text' | undefined>(undefined);
  readonly severity = signal<WjButtonSeverity | undefined>(undefined);
  readonly type = signal<'button' | 'submit' | 'reset'>('button');
  readonly ariaLabel = signal<string | undefined>(undefined);
  readonly ariaLabelledBy = signal<string | undefined>(undefined);
  readonly ariaDescribedBy = signal<string | undefined>(undefined);
  readonly ariaHasPopup = signal<WjButtonAriaHasPopup | undefined>(undefined);
  readonly ariaExpanded = signal<boolean | undefined>(undefined);
  readonly pt = signal<WjButtonPt>(undefined);
  readonly icon = signal(false);
  readonly width = signal<string | undefined>(undefined);
  readonly clicks = signal(0);
  readonly submits = signal(0);
  protected readonly settings = wjIconSettings;

  protected onSubmit(event: Event): void {
    event.preventDefault();
    this.submits.update((count) => count + 1);
  }
}

/** A consumer who writes `aria-label` on the host instead of using the input. */
@Component({
  selector: 'wj-button-aria-host',
  imports: [WjButton],
  template: `<wj-button label="Save" aria-label="Save the form" />`,
})
class AriaOnHostHost {}

/** A consumer who uses the routed inputs only. */
@Component({
  selector: 'wj-button-routed-host',
  imports: [WjButton],
  template: `<wj-button ariaLabel="Close" ariaDescribedBy="hint" />`,
})
class RoutedHost {}

/** Every size, fill and colour role side by side, so one render measures them all. */
@Component({
  selector: 'wj-button-gallery-host',
  imports: [WjButton],
  template: `
    <wj-button label="Small" size="small" />
    <wj-button label="Default" />
    <wj-button label="Large" size="large" />
    <wj-button label="Solid" />
    <wj-button label="Outlined" variant="outlined" />
    <wj-button label="Text" variant="text" />
    @for (severity of severities; track severity) {
      <wj-button [label]="severity" [severity]="severity" />
    }
  `,
})
class GalleryHost {
  protected readonly severities = SEVERITIES;
}

type Scheme = 'light' | 'dark';

interface Rendered {
  fixture: ComponentFixture<Host>;
  host: Host;
  button: WjButtonHarness;
  element: HTMLElement;
}

/** Renders the host with `provideWeeljack`, in the given colour scheme, after `setup` ran. */
async function render(
  scheme: Scheme = 'light',
  setup: (host: Host) => void = () => undefined,
): Promise<Rendered> {
  ROOT.classList.toggle('wj-dark', scheme === 'dark');
  document.body.style.backgroundColor = 'var(--wj-content-background)';
  TestBed.configureTestingModule({ providers: [provideWeeljack({ darkMode: 'class' })] });
  const fixture = TestBed.createComponent(Host);
  setup(fixture.componentInstance);
  await fixture.whenStable();
  const button = await harnessOf(fixture);
  // A render without Optimus's styles would pass axe for the wrong reason: fail loudly instead.
  expect(
    getComputedStyle(parts(fixture.nativeElement as HTMLElement).control).borderTopLeftRadius,
  ).toBe('8px');
  return {
    fixture,
    host: fixture.componentInstance,
    button,
    element: fixture.nativeElement as HTMLElement,
  };
}

/** The `wj-button` inside the fixture's template (not the fixture root itself). */
function harnessOf(fixture: ComponentFixture<unknown>): Promise<WjButtonHarness> {
  return TestbedHarnessEnvironment.loader(fixture).getHarness(WjButtonHarness);
}

/** The `wj-button` host element and the focusable element Optimus renders inside it. */
function parts(element: HTMLElement): { host: HTMLElement; control: HTMLButtonElement } {
  const host = element.querySelector('wj-button');
  const control = host?.querySelector('button');
  if (!(host instanceof HTMLElement) || !(control instanceof HTMLButtonElement)) {
    throw new Error('wj-button did not render its button');
  }
  return { host, control };
}

function byId(element: HTMLElement, id: string): HTMLElement {
  const found = element.querySelector(`#${id}`);
  if (!(found instanceof HTMLElement)) {
    throw new Error(`#${id} is missing`);
  }
  return found;
}

/** The documented states (default, severities, variants, sizes, disabled, loading, icon-only). */
const STATES: [string, (host: Host) => void][] = [
  ['default', () => undefined],
  ...SEVERITIES.map((severity): [string, (host: Host) => void] => [
    `severity ${severity}`,
    (host) => {
      host.severity.set(severity);
    },
  ]),
  [
    'outlined',
    (host) => {
      host.variant.set('outlined');
    },
  ],
  [
    'text',
    (host) => {
      host.variant.set('text');
    },
  ],
  [
    'small',
    (host) => {
      host.size.set('small');
    },
  ],
  [
    'large',
    (host) => {
      host.size.set('large');
    },
  ],
  [
    'disabled',
    (host) => {
      host.disabled.set(true);
    },
  ],
  [
    'loading',
    (host) => {
      host.loading.set(true);
    },
  ],
  [
    'icon only',
    (host) => {
      host.label.set(undefined);
      host.icon.set(true);
      host.ariaLabel.set('Close');
    },
  ],
  [
    'long label',
    (host) => {
      host.label.set('A label that is much longer than the room the layout gives it '.repeat(3));
      host.width.set('160px');
    },
  ],
];

describe('WjButton', () => {
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
    it('label renders the visible text', async () => {
      const { button } = await render();

      expect(await button.getLabel()).toBe('Save');
    });

    it('loading shows the spinner beside the label and makes the button inert', async () => {
      const { button, element } = await render('light', (host) => {
        host.loading.set(true);
      });

      expect(await button.isLoading()).toBe(true);
      expect(await button.isDisabled()).toBe(true);
      expect(await button.getLabel()).toBe('Save');
      expect(parts(element).control.querySelector('svg[aria-hidden="true"]')).not.toBeNull();
    });

    it('loading sets aria-busy on the button and removes it when loading ends', async () => {
      const { fixture, host, element } = await render('light', (setup) => {
        setup.loading.set(true);
      });
      expect(parts(element).control.getAttribute('aria-busy')).toBe('true');

      host.loading.set(false);
      await fixture.whenStable();

      expect(parts(element).control.hasAttribute('aria-busy')).toBe(false);
    });

    it('disabled makes the button inert without showing the spinner', async () => {
      const { button, element } = await render('light', (host) => {
        host.disabled.set(true);
      });

      expect(await button.isDisabled()).toBe(true);
      expect(await button.isLoading()).toBe(false);
      expect(parts(element).control.querySelector('svg')).toBeNull();
    });

    it('reads a bare disabled or loading attribute as true', async () => {
      @Component({
        selector: 'wj-button-bare-host',
        imports: [WjButton],
        template: `<wj-button label="Save" disabled /><wj-button label="Wait" loading />`,
      })
      class BareHost {}
      TestBed.configureTestingModule({ providers: [provideWeeljack()] });
      const fixture = TestBed.createComponent(BareHost);
      await fixture.whenStable();
      const buttons =
        await TestbedHarnessEnvironment.loader(fixture).getAllHarnesses(WjButtonHarness);

      expect(await Promise.all(buttons.map((button) => button.isDisabled()))).toEqual([true, true]);
      expect(await Promise.all(buttons.map((button) => button.isLoading()))).toEqual([false, true]);
    });

    describe('in the gallery', () => {
      let wjButtons: HTMLElement[];

      beforeEach(async () => {
        TestBed.configureTestingModule({ providers: [provideWeeljack()] });
        const fixture = TestBed.createComponent(GalleryHost);
        await fixture.whenStable();
        wjButtons = Array.from(
          (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLElement>('wj-button'),
        );
      });

      function control(label: string): HTMLButtonElement {
        const inner = wjButtons
          .find((wjButton) => wjButton.textContent.trim() === label)
          ?.querySelector('button');
        if (!(inner instanceof HTMLButtonElement)) {
          throw new Error(`no wj-button labelled ${label}`);
        }
        return inner;
      }

      it('size steps the height: 36 px small, 44 px default, 52 px large', () => {
        const heights = ['Small', 'Default', 'Large'].map((label) => {
          const wjButton = wjButtons.find((candidate) => candidate.textContent.trim() === label);
          return wjButton?.getBoundingClientRect().height;
        });

        expect(heights).toEqual([36, 44, 52]);
      });

      it('variant draws an outlined or text button instead of a solid one', () => {
        const solid = getComputedStyle(control('Solid'));
        const outlined = getComputedStyle(control('Outlined'));
        const text = getComputedStyle(control('Text'));

        expect(solid.backgroundColor).not.toBe(CLEAR);
        expect(outlined.backgroundColor).toBe(CLEAR);
        expect(outlined.borderTopColor).not.toBe(CLEAR);
        expect(text.backgroundColor).toBe(CLEAR);
        expect(text.borderTopColor).toBe(CLEAR);
      });

      it('severity gives the colour roles different fills', () => {
        const fills = SEVERITIES.map(
          (severity) => getComputedStyle(control(severity)).backgroundColor,
        );

        expect(fills[0]).not.toBe(CLEAR);
        expect(new Set(fills).size).toBeGreaterThanOrEqual(7);
      });
    });

    it('type defaults to button, and submit submits the enclosing form', async () => {
      const { host, button } = await render();
      await button.click();
      expect(host.submits()).toBe(0);

      host.type.set('submit');
      await button.click();

      expect(host.submits()).toBe(1);
    });
  });

  describe('click', () => {
    it('reaches a (click) on the host once per click', async () => {
      const { host, button } = await render();

      await button.click();
      await button.click();

      expect(host.clicks()).toBe(2);
    });

    it.each([
      [
        'disabled',
        (host: Host) => {
          host.disabled.set(true);
        },
      ],
      [
        'loading',
        (host: Host) => {
          host.loading.set(true);
        },
      ],
    ])('emits nothing to the consumer while %s', async (_state, setup) => {
      const { host, button, element } = await render('light', setup);
      const { host: wjButton, control } = parts(element);

      await button.click();
      control.click();
      wjButton.click();
      wjButton.dispatchEvent(new MouseEvent('click', { bubbles: true }));

      expect(host.clicks()).toBe(0);
      expect(host.submits()).toBe(0);
    });

    it('emits again once it is enabled', async () => {
      const { host, button } = await render('light', (initial) => {
        initial.disabled.set(true);
      });
      await button.click();
      host.disabled.set(false);
      await button.click();

      expect(host.clicks()).toBe(1);
    });
  });

  describe('pt', () => {
    it('reaches the inner parts, as an object', async () => {
      const { element } = await render('light', (host) => {
        host.pt.set({ root: { 'data-probe': 'root' }, label: { 'data-probe': 'label' } });
      });

      const { control } = parts(element);
      expect(control.getAttribute('data-probe')).toBe('root');
      expect(control.querySelector('[data-probe="label"]')?.textContent).toBe('Save');
    });

    it('reaches the inner parts, as a function with a function part', async () => {
      const { element } = await render('light', (host) => {
        host.pt.set(() => ({ root: () => ({ 'data-probe': 'fn' }) }));
      });

      expect(parts(element).control.getAttribute('data-probe')).toBe('fn');
    });

    it('accepts a class string for a part', async () => {
      const { element } = await render('light', (host) => {
        host.pt.set({ root: 'probe-class' });
      });

      expect(parts(element).control.classList.contains('probe-class')).toBe(true);
    });

    it('keeps the routed ARIA attributes beside a pt root', async () => {
      const { button } = await render('light', (host) => {
        host.pt.set({ root: { 'data-probe': 'root' } });
        host.ariaLabelledBy.set('name');
      });

      expect(await button.getAriaAttributes()).toEqual({
        label: null,
        labelledBy: 'name',
        describedBy: null,
      });
    });
  });

  describe('ARIA', () => {
    it('routes ariaLabel, ariaLabelledBy and ariaDescribedBy to the focusable element', async () => {
      const { button, element } = await render('light', (host) => {
        host.ariaLabel.set('Save the form');
        host.ariaLabelledBy.set('name');
        host.ariaDescribedBy.set('hint');
      });

      expect(await button.getAriaAttributes()).toEqual({
        label: 'Save the form',
        labelledBy: 'name',
        describedBy: 'hint',
      });
      const { host } = parts(element);
      expect(host.getAttributeNames().filter((name) => name.startsWith('aria-'))).toEqual([]);
      expect(warn).not.toHaveBeenCalled();
    });

    it('sets neither aria-haspopup nor aria-expanded until asked', async () => {
      const { element } = await render();

      const { control } = parts(element);
      expect(control.hasAttribute('aria-haspopup')).toBe(false);
      expect(control.hasAttribute('aria-expanded')).toBe(false);
    });

    it('routes ariaHasPopup and ariaExpanded to the focusable element, and follows their changes', async () => {
      const { element, host, fixture } = await render('light', (h) => {
        h.ariaHasPopup.set('menu');
        h.ariaExpanded.set(false);
      });
      const { control, host: wjHost } = parts(element);

      expect(control.getAttribute('aria-haspopup')).toBe('menu');
      expect(control.getAttribute('aria-expanded')).toBe('false');

      host.ariaExpanded.set(true);
      host.ariaHasPopup.set('dialog');
      await fixture.whenStable();
      expect(control.getAttribute('aria-haspopup')).toBe('dialog');
      expect(control.getAttribute('aria-expanded')).toBe('true');
      expect(wjHost.getAttributeNames().filter((name) => name.startsWith('aria-'))).toEqual([]);

      host.ariaHasPopup.set(undefined);
      host.ariaExpanded.set(undefined);
      await fixture.whenStable();
      expect(control.hasAttribute('aria-haspopup')).toBe(false);
      expect(control.hasAttribute('aria-expanded')).toBe(false);
      expect(warn).not.toHaveBeenCalled();
    });

    it.each<WjButtonAriaHasPopup>(['menu', 'listbox', 'tree', 'grid', 'dialog'])(
      'ariaHasPopup %s is written as the token itself',
      async (popup) => {
        const { element } = await render('light', (host) => {
          host.ariaHasPopup.set(popup);
        });

        expect(parts(element).control.getAttribute('aria-haspopup')).toBe(popup);
      },
    );

    it('wins over a pt root value for the same attribute and keeps its other keys', async () => {
      const { element, host, fixture } = await render('light', (h) => {
        h.pt.set({
          root: { 'aria-haspopup': 'tree', 'aria-expanded': 'true', 'data-probe': 'root' },
        });
        h.ariaHasPopup.set('menu');
        h.ariaExpanded.set(false);
      });
      const { control } = parts(element);

      expect(control.getAttribute('aria-haspopup')).toBe('menu');
      expect(control.getAttribute('aria-expanded')).toBe('false');
      expect(control.getAttribute('data-probe')).toBe('root');

      // Unset, the consumer's own pt value is the one that stays.
      host.ariaHasPopup.set(undefined);
      host.ariaExpanded.set(undefined);
      await fixture.whenStable();
      expect(control.getAttribute('aria-haspopup')).toBe('tree');
      expect(control.getAttribute('aria-expanded')).toBe('true');
    });

    it('warns WJ0003 once and forwards nothing when aria-* is written on the host', async () => {
      TestBed.configureTestingModule({ providers: [provideWeeljack()] });
      const fixture = TestBed.createComponent(AriaOnHostHost);
      await fixture.whenStable();
      const button = await harnessOf(fixture);

      expect(await button.getAriaAttributes()).toEqual({
        label: null,
        labelledBy: null,
        describedBy: null,
      });
      expect(warn).toHaveBeenCalledTimes(1);
      expect(warn).toHaveBeenCalledWith(
        'WJ0003: wj-button: aria-label is set on the host, where it is not forwarded to the ' +
          'focusable element. Use the ariaLabel, ariaLabelledBy or ariaDescribedBy input instead. ' +
          'Find more at https://locvodever.github.io/weeljack-ng/errors/WJ0003',
      );
    });

    it('stays silent when only the routed inputs are used', async () => {
      TestBed.configureTestingModule({ providers: [provideWeeljack()] });
      const fixture = TestBed.createComponent(RoutedHost);
      await fixture.whenStable();

      expect(warn).not.toHaveBeenCalled();
    });

    it('warns WJ0001 when provideWeeljack is missing', async () => {
      const fixture = TestBed.createComponent(RoutedHost);
      await fixture.whenStable();

      expect(warn).toHaveBeenCalledTimes(1);
      expect(warn).toHaveBeenCalledWith(
        'WJ0001: wj-button: provideWeeljack() is missing from the application providers. ' +
          'Add provideWeeljack() to your application config. ' +
          'Find more at https://locvodever.github.io/weeljack-ng/errors/WJ0001',
      );
    });

    it('names an icon-only button through ariaLabel', async () => {
      const { element } = await render('light', (host) => {
        host.label.set(undefined);
        host.icon.set(true);
        host.ariaLabel.set('Close');
      });

      expect(parts(element).control.getAttribute('aria-label')).toBe('Close');
    });
  });

  describe('HTML payloads', () => {
    it('renders the label as text', async () => {
      const { button, element } = await render('light', (host) => {
        host.label.set(PAYLOAD);
      });

      expect(await button.getLabel()).toBe(PAYLOAD);
      expect(element.querySelector('wj-button img')).toBeNull();
      expect(Reflect.get(window, 'wjInjected')).toBeUndefined();
    });

    it('keeps ariaLabel, ariaLabelledBy and ariaDescribedBy as attribute text', async () => {
      const { button, element } = await render('light', (host) => {
        host.ariaLabel.set(PAYLOAD);
        host.ariaLabelledBy.set(PAYLOAD);
        host.ariaDescribedBy.set(PAYLOAD);
      });

      expect(await button.getAriaAttributes()).toEqual({
        label: PAYLOAD,
        labelledBy: PAYLOAD,
        describedBy: PAYLOAD,
      });
      expect(element.querySelector('wj-button img')).toBeNull();
      expect(Reflect.get(window, 'wjInjected')).toBeUndefined();
    });
  });

  describe('layout', () => {
    it('takes the inline-flex display of the button it wraps, never contents', async () => {
      const { element } = await render();
      const { host, control } = parts(element);

      expect(getComputedStyle(host).display).toBe('inline-flex');
      expect(host.getBoundingClientRect().height).toBe(control.getBoundingClientRect().height);
      expect(host.getBoundingClientRect().height).toBe(44);
    });

    it('wraps a long label and grows from 44 px instead of truncating it', async () => {
      const { element, button } = await render('light', (host) => {
        host.label.set('A label that is much longer than the room the layout gives it '.repeat(3));
        host.width.set('160px');
      });
      const { host, control } = parts(element);

      expect(host.getBoundingClientRect().height).toBeGreaterThan(44);
      expect(control.scrollWidth).toBeLessThanOrEqual(control.clientWidth);
      expect(getComputedStyle(control).textOverflow).not.toBe('ellipsis');
      expect(await button.getLabel()).toContain('longer than the room');
    });

    describe.each<[string, 'small' | 'large' | undefined, number]>([
      ['small', 'small', 36],
      ['default', undefined, 44],
      ['large', 'large', 52],
    ])('with only an icon, %s', (_name, size, side) => {
      async function renderIconOnly(): Promise<Rendered> {
        const rendered = await render('light', (host) => {
          host.label.set(undefined);
          host.icon.set(true);
          host.ariaLabel.set('Settings');
          host.size.set(size);
        });
        await rendered.fixture.whenStable();
        return rendered;
      }

      it('is square: 44 px, 36 px small, 52 px large', async () => {
        const { element } = await renderIconOnly();
        const { host, control } = parts(element);
        const sizeOf = (target: HTMLElement): number[] => {
          const rect = target.getBoundingClientRect();
          return [rect.width, rect.height];
        };

        expect(sizeOf(host)).toEqual([side, side]);
        expect(sizeOf(control)).toEqual([side, side]);
      });

      it('centres the icon in the button', async () => {
        const { element } = await renderIconOnly();
        const { control } = parts(element);
        const svg = element.querySelector('wj-button wj-icon svg');
        if (svg === null) {
          throw new Error('the wj-icon rendered no svg');
        }
        const icon = svg.getBoundingClientRect();
        const rect = control.getBoundingClientRect();

        expect(icon.left + icon.width / 2).toBeCloseTo(rect.left + rect.width / 2, 0);
        expect(icon.top + icon.height / 2).toBeCloseTo(rect.top + rect.height / 2, 0);
      });
    });

    it('keeps a labelled button with an icon as it was', async () => {
      const { element } = await render('light', (host) => {
        host.icon.set(true);
      });
      const { control } = parts(element);
      const svg = element.querySelector('wj-button wj-icon svg');
      const label = control.querySelector('.p-button-label');
      if (svg === null || label === null) {
        throw new Error('the icon or the label did not render');
      }

      expect(control.classList.contains('p-button-icon-only')).toBe(false);
      expect(control.getBoundingClientRect().height).toBe(44);
      expect(getComputedStyle(control).paddingInlineStart).toBe('14px');
      expect(label.getBoundingClientRect().left - svg.getBoundingClientRect().right).toBe(8);
    });

    it('does not mark a labelled button without an icon as icon-only', async () => {
      const { element } = await render();

      expect(parts(element).control.classList.contains('p-button-icon-only')).toBe(false);
    });

    // The rule, pinned on purpose: text belongs in `label`. Projected content is for a `wj-icon`, so
    // a button without `label` is icon-only whatever it projects, and projected text gets the square.
    it('makes a button with projected text and no label the icon-only square', async () => {
      @Component({
        selector: 'wj-button-projected-text-host',
        imports: [WjButton],
        template: `<wj-button ariaLabel="Save">Save</wj-button>`,
      })
      class ProjectedTextHost {}
      TestBed.configureTestingModule({ providers: [provideWeeljack()] });
      const fixture = TestBed.createComponent(ProjectedTextHost);
      await fixture.whenStable();
      const { host, control } = parts(fixture.nativeElement as HTMLElement);
      const sizeOf = (target: HTMLElement): number[] => {
        const rect = target.getBoundingClientRect();
        return [rect.width, rect.height];
      };

      expect(control.classList.contains('p-button-icon-only')).toBe(true);
      expect(getComputedStyle(control).paddingInlineStart).toBe('0px');
      expect(sizeOf(host)).toEqual([44, 44]);
      expect(sizeOf(control)).toEqual([44, 44]);
    });
  });

  describe('autofocus', () => {
    it('carries no autofocus attribute and does not take focus on load', async () => {
      const { element, button } = await render();
      const { host, control } = parts(element);

      expect(control.hasAttribute('autofocus')).toBe(false);
      expect(host.hasAttribute('autofocus')).toBe(false);
      expect(document.activeElement).not.toBe(control);
      expect(await button.isFocused()).toBe(false);
    });
  });

  describe('accessibility', () => {
    describe.each<Scheme>(['light', 'dark'])('%s', (scheme) => {
      it.each(STATES)('has no axe violations: %s', async (_name, setup) => {
        const { element } = await render(scheme, setup);

        const form = element.querySelector('form');
        await expectNoAxeViolations(form ?? element);
      });
    });
  });

  describe('keyboard', () => {
    it('Tab moves focus onto the button and past it, Shift+Tab back', async () => {
      const { button, element } = await render();
      byId(element, 'before').focus();

      await userEvent.tab();
      expect(await button.isFocused()).toBe(true);

      await userEvent.tab();
      expect(document.activeElement).toBe(byId(element, 'after'));

      await userEvent.tab({ shift: true });
      expect(await button.isFocused()).toBe(true);
    });

    it('Enter and Space each activate the focused button once', async () => {
      const { host, button } = await render();
      await button.focus();

      await userEvent.keyboard('{Enter}');
      expect(host.clicks()).toBe(1);

      await userEvent.keyboard(' ');
      expect(host.clicks()).toBe(2);
    });

    it('Enter submits a form only for a submit button', async () => {
      const { host, button } = await render('light', (initial) => {
        initial.type.set('submit');
      });
      await button.focus();

      await userEvent.keyboard('{Enter}');

      expect(host.submits()).toBe(1);
    });

    it.each([
      [
        'disabled',
        (host: Host) => {
          host.disabled.set(true);
        },
      ],
      [
        'loading',
        (host: Host) => {
          host.loading.set(true);
        },
      ],
    ])('skips a %s button on Tab, and Enter and Space emit nothing', async (_state, setup) => {
      const { host, button, element } = await render('light', setup);
      byId(element, 'before').focus();

      await userEvent.tab();
      expect(await button.isFocused()).toBe(false);
      expect(document.activeElement).toBe(byId(element, 'after'));

      await button.focus();
      await userEvent.keyboard('{Enter}');
      await userEvent.keyboard(' ');
      expect(host.clicks()).toBe(0);
    });
  });
});
