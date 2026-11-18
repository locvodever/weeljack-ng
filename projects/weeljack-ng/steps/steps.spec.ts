/// <reference types="@vitest/browser-playwright" />
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Component, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import type { MockInstance } from 'vitest';
import { userEvent } from 'vitest/browser';
import { provideWeeljack, type WjMenuItem, type WjMenuItemCommandEvent } from 'weeljack-ng';
import { WjSteps } from 'weeljack-ng/steps';
import { WjStepsHarness } from 'weeljack-ng/steps/testing';
import { expectNoAxeViolations } from '../spec-support/axe';

const PAYLOAD = '<img src=x onerror="window.wjInjected = true">';
const ROOT = document.documentElement;

/** The steps every spec starts from. */
const checkout = (): WjMenuItem[] => [
  { label: 'Cart' },
  { label: 'Shipping' },
  { label: 'Payment' },
  { label: 'Review' },
];

/** A consumer's template: a button before the steps, so Tab has somewhere to start. */
@Component({
  selector: 'wj-steps-host',
  imports: [WjSteps],
  template: `
    <button id="before" type="button">Before</button>
    <p id="neutral">Neutral</p>
    <div [style.width]="width()">
      <wj-steps
        [model]="model()"
        [activeIndex]="activeIndex()"
        (activeIndexChange)="changed($event)"
        [readonly]="readonly()"
      />
    </div>
    <button id="after" type="button">After</button>
  `,
})
class Host {
  readonly model = signal<WjMenuItem[]>(checkout());
  readonly activeIndex = signal(0);
  readonly readonly = signal(true);
  readonly width = signal<string | undefined>(undefined);
  /** Every index `activeIndexChange` reported, in order. */
  readonly reported = signal<number[]>([]);

  protected changed(next: number): void {
    this.activeIndex.set(next);
    this.reported.update((list) => [...list, next]);
  }
}

/** Two-way binding with `[(activeIndex)]`, and the bare attribute `readonly="false"`. */
@Component({
  selector: 'wj-steps-bare-host',
  imports: [WjSteps],
  template: `<wj-steps [model]="model" [(activeIndex)]="active" readonly="false" />`,
})
class BareHost {
  readonly model = checkout();
  readonly active = signal(1);
}

/** The bare attribute `readonly`, which is true, and an unbound `activeIndex`. */
@Component({
  selector: 'wj-steps-attribute-host',
  imports: [WjSteps],
  template: `<wj-steps [model]="model" readonly />`,
})
class AttributeHost {
  readonly model = checkout();
}

/** A consumer who writes aria-* on the host. */
@Component({
  selector: 'wj-steps-aria-on-host-host',
  imports: [WjSteps],
  template: `<wj-steps aria-label="Checkout" [model]="model" />`,
})
class AriaOnHostHost {
  readonly model = checkout();
}

/** Steps rendered without `provideWeeljack`. */
@Component({
  selector: 'wj-steps-unprovided-host',
  imports: [WjSteps],
  template: `<wj-steps [model]="model" />`,
})
class UnprovidedHost {
  readonly model = checkout();
}

type Scheme = 'light' | 'dark';

interface Rendered {
  fixture: ComponentFixture<Host>;
  component: Host;
  element: HTMLElement;
}

function find<E extends Element>(element: ParentNode, selector: string, type: new () => E): E {
  const found = element.querySelector(selector);
  if (!(found instanceof type)) {
    throw new Error(`${selector} is missing`);
  }
  return found;
}

const links = (): HTMLAnchorElement[] => [
  ...document.querySelectorAll<HTMLAnchorElement>('li[data-pc-section="menuitem"] > a'),
];
const items = (): HTMLElement[] => [
  ...document.querySelectorAll<HTMLElement>('li[data-pc-section="menuitem"]'),
];
const item = (index: number): HTMLElement => {
  const found = items()[index];
  if (found === undefined) {
    throw new Error(`step ${String(index)} is missing`);
  }
  return found;
};
const numberOf = (index: number): HTMLElement =>
  find(item(index), 'a > span:first-child', HTMLElement);
const labelOf = (index: number): HTMLElement =>
  find(item(index), 'a > span:last-child', HTMLElement);
const linkOf = (index: number): HTMLAnchorElement => find(item(index), 'a', HTMLAnchorElement);

/** The text of the focused step, or an empty string when focus is not on a step. */
const focused = (): string => {
  const link = document.activeElement;
  return link instanceof HTMLAnchorElement && link.closest('li[data-pc-section="menuitem"]')
    ? (link.querySelector('span:last-child')?.textContent.trim() ?? '')
    : '';
};

/** The computed `colour` or `background-color` a custom-property colour paints, read off a probe. */
function painted(property: 'color' | 'backgroundColor', variable: string): string {
  const probe = document.createElement('i');
  probe.style[property] = `var(${variable})`;
  document.body.append(probe);
  const value = getComputedStyle(probe)[property];
  probe.remove();
  return value;
}

/** Renders `Host` with the router and `provideWeeljack` in the given scheme, after `setup` ran. */
async function render(
  setup: (host: Host) => void = () => undefined,
  scheme: Scheme = 'light',
): Promise<Rendered> {
  ROOT.classList.toggle('wj-dark', scheme === 'dark');
  document.body.style.backgroundColor = 'var(--wj-content-background)';
  TestBed.configureTestingModule({
    providers: [
      provideRouter([
        { path: 'a', children: [] },
        { path: 'b', children: [] },
      ]),
      provideWeeljack({ darkMode: 'class' }),
    ],
  });
  const fixture = TestBed.createComponent(Host);
  setup(fixture.componentInstance);
  await fixture.whenStable();
  return {
    fixture,
    component: fixture.componentInstance,
    element: fixture.nativeElement as HTMLElement,
  };
}

const harnessOf = (fixture: ComponentFixture<unknown>): Promise<WjStepsHarness> =>
  TestbedHarnessEnvironment.loader(fixture).getHarness(WjStepsHarness);

describe('WjSteps', () => {
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
    history.replaceState(null, '', window.location.pathname + window.location.search);
  });

  describe('inputs', () => {
    it('model renders the steps numbered from 1, the first one current, read-only', async () => {
      const { fixture } = await render();
      const steps = await harnessOf(fixture);

      expect(await steps.getStepLabels()).toEqual(['Cart', 'Shipping', 'Payment', 'Review']);
      expect(await Promise.all((await steps.getSteps()).map((step) => step.getNumber()))).toEqual([
        1, 2, 3, 4,
      ]);
      expect(await steps.getActiveIndex()).toBe(0);
      expect(await steps.getActiveLabel()).toBe('Cart');
      expect(await steps.isReadonly()).toBe(true);
      expect(document.querySelectorAll('[aria-current="step"]')).toHaveLength(1);
      expect(document.querySelectorAll('nav')).toHaveLength(1);
    });

    it('follows a new array', async () => {
      const { fixture, component } = await render();
      const steps = await harnessOf(fixture);

      component.model.set([{ label: 'One' }, { label: 'Two' }]);
      await fixture.whenStable();

      expect(await steps.getStepLabels()).toEqual(['One', 'Two']);
    });

    it('leaves out a step with visible false: the numbers and activeIndex count the visible steps', async () => {
      const { fixture } = await render((host) => {
        host.model.set([
          { label: 'Cart' },
          { label: 'Hidden', visible: false },
          { label: 'Payment' },
        ]);
        host.activeIndex.set(1);
      });
      const steps = await harnessOf(fixture);

      expect(await steps.getStepLabels()).toEqual(['Cart', 'Payment']);
      expect(await Promise.all((await steps.getSteps()).map((step) => step.getNumber()))).toEqual([
        1, 2,
      ]);
      expect(await steps.getActiveLabel()).toBe('Payment');
    });

    it('draws nothing with no visible steps: no nav, no tab stop, and it needs no router', async () => {
      TestBed.configureTestingModule({ providers: [provideWeeljack()] });
      const fixture = TestBed.createComponent(Host);
      fixture.componentInstance.model.set([{ label: 'Hidden', visible: false }]);
      await fixture.whenStable();
      const element = fixture.nativeElement as HTMLElement;
      const steps = await harnessOf(fixture);

      expect(element.querySelector('p-steps')).toBeNull();
      expect(document.querySelector('nav')).toBeNull();
      expect(await steps.getSteps()).toEqual([]);
      expect(await steps.getActiveIndex()).toBe(-1);
      expect(await steps.getActiveLabel()).toBeNull();
      await expect(steps.isReadonly()).rejects.toThrow('no visible steps');
      expect(getComputedStyle(find(element, 'wj-steps', HTMLElement)).display).toBe('block');
    });

    it('is read-only by default, and the bare attribute readonly is true', async () => {
      TestBed.configureTestingModule({ providers: [provideRouter([]), provideWeeljack()] });
      const fixture = TestBed.createComponent(AttributeHost);
      await fixture.whenStable();

      expect(await (await harnessOf(fixture)).isReadonly()).toBe(true);
      expect(await (await harnessOf(fixture)).getActiveIndex()).toBe(0);
    });

    it('readonly false lets a step be selected, and follows a change', async () => {
      const { fixture, component } = await render((host) => {
        host.readonly.set(false);
      });
      const steps = await harnessOf(fixture);
      expect(await steps.isReadonly()).toBe(false);

      component.readonly.set(true);
      await fixture.whenStable();
      expect(await steps.isReadonly()).toBe(true);
    });

    it('activeIndex follows the app, and a selection sets it two-way', async () => {
      const { fixture, component } = await render((host) => {
        host.activeIndex.set(1);
      });
      const steps = await harnessOf(fixture);
      expect(await steps.getActiveLabel()).toBe('Shipping');

      component.activeIndex.set(3);
      await fixture.whenStable();
      expect(await steps.getActiveLabel()).toBe('Review');
      expect(await steps.getActiveIndex()).toBe(3);

      component.readonly.set(false);
      await fixture.whenStable();
      await steps.selectStep('Cart');

      expect(component.reported()).toEqual([0]);
      await expect.poll(() => steps.getActiveLabel()).toBe('Cart');
    });

    it('[(activeIndex)] and a bare readonly="false" select and write back', async () => {
      TestBed.configureTestingModule({ providers: [provideRouter([]), provideWeeljack()] });
      const fixture = TestBed.createComponent(BareHost);
      await fixture.whenStable();
      const steps = await harnessOf(fixture);
      expect(await steps.getActiveLabel()).toBe('Shipping');
      expect(await steps.isReadonly()).toBe(false);

      await steps.selectStep('Review');

      expect(fixture.componentInstance.active()).toBe(3);
      await expect.poll(() => steps.getActiveLabel()).toBe('Review');
    });

    it('marks only the current step with aria-current="step", and it moves with activeIndex', async () => {
      const { fixture, component } = await render();
      const steps = await harnessOf(fixture);
      expect(item(0).getAttribute('aria-current')).toBe('step');
      expect(item(1).hasAttribute('aria-current')).toBe(false);

      component.activeIndex.set(2);
      await fixture.whenStable();

      expect(item(2).getAttribute('aria-current')).toBe('step');
      expect(document.querySelectorAll('[aria-current="step"]')).toHaveLength(1);
      expect(await (await steps.getSteps({ label: 'Payment' }))[0]?.isActive()).toBe(true);
    });

    it('gap: an activeIndex past the last step leaves no step current and no Tab stop', async () => {
      await render((host) => {
        host.activeIndex.set(9);
      });

      expect(document.querySelector('[aria-current="step"]')).toBeNull();
      expect(links().every((link) => link.tabIndex === -1)).toBe(true);
    });

    it('gap: labels must be unique, because Optimus tracks the steps by label', async () => {
      const { fixture, component } = await render();
      expect(warn).not.toHaveBeenCalled();

      // Angular reports duplicated keys when a list already drawn is reconciled.
      component.model.set([{ label: 'Same' }, { label: 'Same' }]);
      await fixture.whenStable();

      expect(warn.mock.calls.some(([message]) => String(message).includes('NG0955'))).toBe(true);
    });
  });

  describe('items', () => {
    it('a read-only step other than the current one does nothing', async () => {
      const run = vi.fn<(event: WjMenuItemCommandEvent) => void>();
      const { fixture, component } = await render((host) => {
        host.model.set([{ label: 'Cart' }, { label: 'Shipping', command: run }]);
      });
      const steps = await harnessOf(fixture);
      const [cart, shipping] = await steps.getSteps();

      await shipping?.click();

      expect(run).not.toHaveBeenCalled();
      expect(component.reported()).toEqual([]);
      expect(await cart?.isDisabled()).toBe(false);
      expect(await shipping?.isDisabled()).toBe(true);
    });

    it('when not read-only a click selects the step and runs its command with { originalEvent, item } and no index', async () => {
      const received: WjMenuItemCommandEvent[] = [];
      const shipping: WjMenuItem = { label: 'Shipping', command: (e) => received.push(e) };
      const { fixture, component } = await render((host) => {
        host.model.set([{ label: 'Cart' }, shipping]);
        host.readonly.set(false);
      });

      await (await harnessOf(fixture)).selectStep('Shipping');

      expect(component.reported()).toEqual([1]);
      expect(received).toHaveLength(1);
      expect(Object.keys(received[0] ?? {}).sort()).toEqual(['item', 'originalEvent']);
      expect(received[0]?.item).toBe(shipping);
      expect(received[0]?.originalEvent).toBeInstanceOf(MouseEvent);
    });

    it('a disabled step does nothing, even when the steps are not read-only', async () => {
      const run = vi.fn<(event: WjMenuItemCommandEvent) => void>();
      const { fixture, component } = await render((host) => {
        host.model.set([{ label: 'Cart' }, { label: 'Shipping', disabled: true, command: run }]);
        host.readonly.set(false);
      });
      const [cart, shipping] = await (await harnessOf(fixture)).getSteps();

      await shipping?.click();

      expect(run).not.toHaveBeenCalled();
      expect(component.reported()).toEqual([]);
      expect(await shipping?.isDisabled()).toBe(true);
      expect(await cart?.isDisabled()).toBe(false);
    });

    it('selecting the current step again reports no change, and still runs its command', async () => {
      const run = vi.fn<(event: WjMenuItemCommandEvent) => void>();
      const { fixture, component } = await render((host) => {
        host.model.set([{ label: 'Cart', command: run }, { label: 'Shipping' }]);
        host.readonly.set(false);
      });

      await (await harnessOf(fixture)).selectStep('Cart');

      expect(component.reported()).toEqual([]);
      expect(run).toHaveBeenCalledTimes(1);
    });

    it('selectStep throws, naming the label, when there is no such step', async () => {
      const { fixture } = await render();

      await expect((await harnessOf(fixture)).selectStep('Nowhere')).rejects.toThrow(
        'no step with the label Nowhere',
      );
    });

    it('finds a step by a RegExp and exposes focus through the item harness', async () => {
      const { fixture } = await render();
      const [pay] = await (await harnessOf(fixture)).getSteps({ label: /^Pay/ });

      expect(await pay?.getLabel()).toBe('Payment');
      await pay?.focus();
      expect(await pay?.isFocused()).toBe(true);
    });

    it('router-linked steps, not read-only, are real links; the current one follows the URL, not activeIndex', async () => {
      const { fixture, component } = await render((host) => {
        host.model.set([
          { label: 'Cart', routerLink: '/a' },
          { label: 'Shipping', routerLink: ['/b'] },
        ]);
        host.readonly.set(false);
      });

      expect(links().map((link) => link.getAttribute('href'))).toEqual(['/a', '/b']);
      // Optimus asks the router: with the URL on neither step, none is current although
      // activeIndex is 0. The Tab stop is still the step activeIndex points at.
      expect(document.querySelector('[aria-current="step"]')).toBeNull();
      expect(linkOf(0).tabIndex).toBe(0);
      expect(linkOf(1).tabIndex).toBe(-1);

      await TestBed.inject(Router).navigateByUrl('/b');
      await fixture.whenStable();

      expect(item(1).getAttribute('aria-current')).toBe('step');
      expect(item(0).hasAttribute('aria-current')).toBe(false);
      expect(component.activeIndex()).toBe(0);
    });
  });

  describe('the router requirement', () => {
    it('without provideRouter creation throws NG0201 naming ActivatedRoute, and nothing catches it', async () => {
      TestBed.configureTestingModule({ providers: [provideWeeljack()] });

      await expect(
        (async () => {
          const fixture = TestBed.createComponent(Host);
          await fixture.whenStable();
        })(),
      ).rejects.toThrow(/NG0201[\s\S]*ActivatedRoute/);
    });
  });

  describe('the app’s objects', () => {
    it('never changes the model or its steps', async () => {
      const items: WjMenuItem[] = [
        { label: 'Cart', command: vi.fn() },
        { label: 'Shipping', command: vi.fn() },
        { label: 'Payment', disabled: true },
      ];
      const before = JSON.stringify(items);
      const { fixture } = await render((host) => {
        host.model.set(items);
        host.readonly.set(false);
      });
      const steps = await harnessOf(fixture);

      await steps.selectStep('Shipping');
      await userEvent.keyboard('{ArrowRight}{Enter}');
      await steps.selectStep('Payment');

      expect(JSON.stringify(items)).toBe(before);
      expect(items).toHaveLength(3);
      for (const step of items) {
        expect(step).not.toHaveProperty('escape');
        expect(step).not.toHaveProperty('id');
        expect(step).not.toHaveProperty('expanded');
      }
    });
  });

  describe('dev warnings', () => {
    it('warns WJ0003 once for aria-* on the host, with the steps’ own advice, and does not forward it', async () => {
      TestBed.configureTestingModule({ providers: [provideRouter([]), provideWeeljack()] });
      const fixture = TestBed.createComponent(AriaOnHostHost);
      await fixture.whenStable();

      expect(warn).toHaveBeenCalledTimes(1);
      expect(String(warn.mock.calls[0]?.[0])).toContain('WJ0003: wj-steps:');
      expect(String(warn.mock.calls[0]?.[0])).toContain(
        'wj-steps takes no ARIA input; each step is named by its label',
      );
      expect(
        find(fixture.nativeElement as HTMLElement, 'nav', HTMLElement).hasAttribute('aria-label'),
      ).toBe(false);
    });

    it('warns WJ0001 when provideWeeljack is missing', async () => {
      TestBed.configureTestingModule({ providers: [provideRouter([])] });
      const fixture = TestBed.createComponent(UnprovidedHost);
      await fixture.whenStable();

      expect(
        warn.mock.calls.some(([message]) => String(message).startsWith('WJ0001: wj-steps:')),
      ).toBe(true);
    });
  });

  describe('rendering safety', () => {
    const expectNoInjection = (): void => {
      expect(document.querySelector('img')).toBeNull();
      expect(Reflect.get(window, 'wjInjected')).toBeUndefined();
    };

    it('renders a step label as text', async () => {
      const { fixture } = await render((host) => {
        host.model.set([{ label: PAYLOAD }, { label: `${PAYLOAD} last` }]);
      });

      expect(await (await harnessOf(fixture)).getStepLabels()).toEqual([
        PAYLOAD,
        `${PAYLOAD} last`,
      ]);
      expect(document.body.textContent).toContain(PAYLOAD);
      expectNoInjection();
    });

    it('renders a router-linked step label as text', async () => {
      const { fixture } = await render((host) => {
        host.model.set([{ label: PAYLOAD, routerLink: '/a' }, { label: 'Last' }]);
        host.readonly.set(false);
      });

      expect((await (await harnessOf(fixture)).getStepLabels())[0]).toBe(PAYLOAD);
      expect(linkOf(0).getAttribute('href')).toBe('/a');
      expectNoInjection();
    });

    it('renders as text an object that also carries escape: false, styleClass, tooltipOptions and icon', async () => {
      const wider = {
        label: PAYLOAD,
        escape: false,
        styleClass: 'smuggled',
        tooltipOptions: { escape: false },
        icon: 'pi pi-smuggled',
      };
      const smuggled: WjMenuItem = wider;
      const { fixture } = await render((host) => {
        host.model.set([smuggled, { label: 'Last' }]);
      });

      expect((await (await harnessOf(fixture)).getStepLabels())[0]).toBe(PAYLOAD);
      expect(document.body.textContent).toContain(PAYLOAD);
      expect(document.querySelector('.smuggled, .pi-smuggled')).toBeNull();
      expectNoInjection();
    });

    it('shows no tooltip on hover or focus', async () => {
      const wider = { label: 'Cart', tooltipOptions: { tooltipLabel: 'Tip' } };
      const smuggled: WjMenuItem = wider;
      await render((host) => {
        host.model.set([smuggled, { label: 'Next' }]);
      });

      await userEvent.hover(linkOf(0));
      linkOf(0).focus();

      expect(document.querySelector('.p-tooltip, [role="tooltip"]')).toBeNull();
    });
  });

  describe('hit boxes and look', () => {
    it('every step link is at least 24 x 24 px, and the number is a 32 px circle', async () => {
      await render();

      const all = links();
      expect(all).toHaveLength(4);
      for (const link of all) {
        const { width, height } = link.getBoundingClientRect();
        expect(width).toBeGreaterThanOrEqual(24);
        expect(height).toBeGreaterThanOrEqual(24);
      }
      const circle = numberOf(0).getBoundingClientRect();
      expect(circle.width).toBeCloseTo(32, 0);
      expect(circle.height).toBeCloseTo(32, 0);
    });

    it('keeps Optimus’s row: a block host, the steps sharing the width', async () => {
      const { element } = await render();

      expect(getComputedStyle(find(element, 'wj-steps', HTMLElement)).display).toBe('block');
      expect(getComputedStyle(find(document, 'ul', HTMLElement)).display).toBe('flex');
      const row = find(document, 'ul', HTMLElement).getBoundingClientRect().width;
      const total = items().reduce((sum, step) => sum + step.getBoundingClientRect().width, 0);
      expect(row).toBeGreaterThan(300);
      expect(total).toBeCloseTo(row, 0);
    });

    describe.each<Scheme>(['light', 'dark'])('the filled current number, %s', (scheme) => {
      it('paints the current number with the primary colour and its digit with the contrast colour, the others unfilled', async () => {
        await render((host) => {
          host.activeIndex.set(1);
        }, scheme);

        const active = getComputedStyle(numberOf(1));
        expect(active.backgroundColor).toBe(painted('backgroundColor', '--wj-primary-color'));
        expect(active.borderTopColor).toBe(painted('backgroundColor', '--wj-primary-color'));
        expect(active.color).toBe(painted('color', '--wj-primary-contrast-color'));

        for (const index of [0, 2, 3]) {
          const inactive = getComputedStyle(numberOf(index));
          expect(inactive.backgroundColor).toBe(
            painted('backgroundColor', '--wj-content-background'),
          );
          expect(inactive.color).toBe(painted('color', '--wj-text-muted-color'));
        }
      });
    });

    it('wraps a long label at spaces, centred, never ellipsized or clipped', async () => {
      await render((host) => {
        host.model.set([
          { label: 'Billing and shipping address details' },
          { label: 'Payment' },
          { label: 'Confirmation' },
        ]);
        host.width.set('14rem');
      });

      const label = labelOf(0);
      const style = getComputedStyle(label);
      expect(style.whiteSpace).toBe('normal');
      expect(style.textOverflow).toBe('clip');
      expect(style.textAlign).toBe('center');
      expect(label.getBoundingClientRect().height).toBeGreaterThan(
        labelOf(1).getBoundingClientRect().height * 1.5,
      );
      for (const index of [0, 1, 2]) {
        expect(labelOf(index).scrollWidth).toBeLessThanOrEqual(labelOf(index).clientWidth);
      }
    });

    it('a step never narrows below its longest word', async () => {
      await render((host) => {
        host.model.set([
          { label: 'Unbelievably good' },
          { label: 'Extraordinary offer' },
          { label: 'Incomprehensibility itself' },
        ]);
        host.width.set('6rem');
      });

      for (const index of [0, 1, 2]) {
        const label = labelOf(index);
        // Two lines or more: the words wrap instead of the label being cut, and none is clipped.
        expect(label.getBoundingClientRect().height).toBeGreaterThan(
          Number.parseFloat(getComputedStyle(label).fontSize) * 1.5,
        );
        expect(label.scrollWidth).toBeLessThanOrEqual(
          Math.ceil(label.getBoundingClientRect().width),
        );
      }
    });

    it('pins the connector to the circles’ centre whatever the labels’ height', async () => {
      await render((host) => {
        host.model.set([
          { label: 'Billing and shipping address details' },
          { label: 'Pay' },
          { label: 'Billing and shipping address details again' },
        ]);
        host.width.set('14rem');
      });

      expect(labelOf(0).getBoundingClientRect().height).toBeGreaterThan(
        labelOf(1).getBoundingClientRect().height,
      );
      for (const index of [0, 1, 2]) {
        const connector = getComputedStyle(item(index), '::before');
        const line =
          Number.parseFloat(connector.top) +
          Number.parseFloat(connector.marginTop) +
          Number.parseFloat(connector.borderTopWidth) / 2;
        const circle = numberOf(index).getBoundingClientRect();
        const centre = circle.top + circle.height / 2 - item(index).getBoundingClientRect().top;
        expect(line).toBeCloseTo(16, 0);
        expect(centre).toBeCloseTo(line, 0);
      }
    });

    it('fades a disabled step only when the steps are not read-only', async () => {
      const { fixture, component } = await render((host) => {
        host.model.set([
          { label: 'Cart' },
          { label: 'Shipping' },
          { label: 'Review', disabled: true },
        ]);
      });

      // Read-only: Optimus keeps every step at full opacity, the disabled one included.
      expect(items().map((step) => getComputedStyle(step).opacity)).toEqual(['1', '1', '1']);

      component.readonly.set(false);
      await fixture.whenStable();
      const disabled = Number.parseFloat(getComputedStyle(item(2)).opacity);
      const expected = Number.parseFloat(
        getComputedStyle(ROOT).getPropertyValue('--wj-disabled-opacity'),
      );
      expect(expected).toBeGreaterThan(0);
      expect(expected).toBeLessThan(1);
      expect(disabled).toBeCloseTo(expected, 5);
      expect(getComputedStyle(item(0)).opacity).toBe('1');
      expect(getComputedStyle(item(1)).opacity).toBe('1');
    });

    it('shows the pointer cursor on a step only when the steps are not read-only', async () => {
      const { fixture, component } = await render();
      expect(getComputedStyle(item(1)).cursor).not.toBe('pointer');

      component.readonly.set(false);
      await fixture.whenStable();

      expect(getComputedStyle(item(1)).cursor).toBe('pointer');
    });
  });

  describe('keyboard', () => {
    async function tabFromBefore(): Promise<void> {
      find(document, '#before', HTMLElement).focus();
      await userEvent.tab();
    }

    it('Tab focuses the current step only, and the next Tab leaves the steps', async () => {
      await render((host) => {
        host.activeIndex.set(1);
      });
      await tabFromBefore();
      expect(focused()).toBe('Shipping');

      await userEvent.tab();

      expect(document.activeElement?.id).toBe('after');
      expect(links().filter((link) => link.tabIndex === 0)).toHaveLength(1);
    });

    it('Arrow Right and Arrow Left move focus to the next and the previous step', async () => {
      await render();
      await tabFromBefore();

      await userEvent.keyboard('{ArrowRight}');
      expect(focused()).toBe('Shipping');
      await userEvent.keyboard('{ArrowRight}');
      expect(focused()).toBe('Payment');
      await userEvent.keyboard('{ArrowLeft}');
      expect(focused()).toBe('Shipping');
    });

    it('Home and End go to the first and the last step', async () => {
      await render((host) => {
        host.activeIndex.set(1);
      });
      await tabFromBefore();

      await userEvent.keyboard('{End}');
      expect(focused()).toBe('Review');
      await userEvent.keyboard('{Home}');
      expect(focused()).toBe('Cart');
    });

    it('the arrows reach a step that is disabled or inert, and the keys run nothing there', async () => {
      const run = vi.fn<(event: WjMenuItemCommandEvent) => void>();
      const { component } = await render((host) => {
        host.model.set([{ label: 'Cart' }, { label: 'Shipping', command: run }]);
      });
      await tabFromBefore();

      await userEvent.keyboard('{ArrowRight}');
      expect(focused()).toBe('Shipping');
      await userEvent.keyboard('{Enter}');
      await userEvent.keyboard(' ');

      expect(run).not.toHaveBeenCalled();
      expect(component.reported()).toEqual([]);
    });

    it('Enter and Space select the focused step and run its command when not read-only', async () => {
      const run = vi.fn<(event: WjMenuItemCommandEvent) => void>();
      const { component } = await render((host) => {
        host.model.set([{ label: 'Cart' }, { label: 'Shipping', command: run }, { label: 'Pay' }]);
        host.readonly.set(false);
      });
      await tabFromBefore();

      await userEvent.keyboard('{ArrowRight}{Enter}');
      expect(component.reported()).toEqual([1]);
      expect(run).toHaveBeenCalledTimes(1);

      await userEvent.keyboard('{ArrowRight} ');
      expect(component.reported()).toEqual([1, 2]);
      await expect.poll(() => focused()).toBe('Pay');
      expect(run).toHaveBeenCalledTimes(1);
    });

    it('Tab leaves, and the Tab stop goes back to the current step', async () => {
      await render((host) => {
        host.activeIndex.set(1);
      });
      await tabFromBefore();
      await userEvent.keyboard('{ArrowRight}{ArrowRight}');
      expect(focused()).toBe('Review');

      await userEvent.tab();
      expect(document.activeElement?.id).toBe('after');
      await userEvent.tab({ shift: true });

      expect(focused()).toBe('Shipping');
    });

    it('shows the 2 px solid focus ring on the focused step', async () => {
      await render();
      await tabFromBefore();
      await userEvent.keyboard('{ArrowRight}');

      const link = document.activeElement;
      expect(link?.textContent.includes('Shipping')).toBe(true);
      await expect.poll(() => (link ? getComputedStyle(link).outlineWidth : '')).toBe('2px');
      expect(link ? getComputedStyle(link).outlineStyle : '').toBe('solid');
    });
  });

  describe('axe', () => {
    const states: { name: string; setup: (host: Host) => void }[] = [
      { name: 'read-only, the first step current', setup: () => undefined },
      {
        name: 'read-only, a middle step current',
        setup: (host) => {
          host.activeIndex.set(2);
        },
      },
      {
        name: 'interactive',
        setup: (host) => {
          host.readonly.set(false);
          host.activeIndex.set(1);
        },
      },
      {
        name: 'a disabled step',
        setup: (host) => {
          host.model.set([
            { label: 'Cart' },
            { label: 'Shipping' },
            { label: 'Payment' },
            { label: 'Review', disabled: true },
          ]);
          host.readonly.set(false);
          host.activeIndex.set(1);
        },
      },
      {
        name: 'router-linked steps, not read-only',
        setup: (host) => {
          host.model.set([
            { label: 'Cart', routerLink: '/a' },
            { label: 'Shipping', routerLink: ['/b'] },
          ]);
          host.readonly.set(false);
        },
      },
      {
        name: 'wrapped labels',
        setup: (host) => {
          host.model.set([{ label: 'Billing and shipping address details' }, { label: 'Payment' }]);
          host.width.set('16rem');
        },
      },
    ];

    for (const scheme of ['light', 'dark'] as const) {
      for (const { name, setup } of states) {
        it(`has no axe violations: ${name}, ${scheme}`, async () => {
          const { element } = await render(setup, scheme);

          await expectNoAxeViolations(find(element, 'wj-steps', HTMLElement));
        });
      }
    }
  });
});
