import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Component, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import type { MockInstance } from 'vitest';
import { userEvent } from 'vitest/browser';
import { provideWeeljack } from 'weeljack-ng';
import { WjButton } from 'weeljack-ng/button';
import { WjButtonHarness } from 'weeljack-ng/button/testing';
import {
  WjOverlayBadge,
  type WjOverlayBadgePt,
  type WjOverlayBadgeSeverity,
  type WjOverlayBadgeSize,
} from 'weeljack-ng/overlaybadge';
import { WjOverlayBadgeHarness } from 'weeljack-ng/overlaybadge/testing';
import { expectNoAxeViolations } from '../spec-support/axe';

const PAYLOAD = '<img src=x onerror="window.wjInjected = true">';
const ROOT = document.documentElement;
const SEVERITIES: readonly WjOverlayBadgeSeverity[] = [
  'success',
  'info',
  'warn',
  'danger',
  'secondary',
  'contrast',
];

/** A consumer's template: an icon-only button wrapped in an overlay badge, between two buttons. */
@Component({
  selector: 'wj-overlaybadge-host',
  imports: [WjOverlayBadge, WjButton],
  template: `
    <button type="button" id="before">Before</button>
    <wj-overlaybadge
      [value]="value()"
      [severity]="severity()"
      [size]="size()"
      [pt]="pt()"
      [attr.dir]="dir()"
    >
      <wj-button
        ariaLabel="Notifications, 4 unread"
        variant="outlined"
        severity="secondary"
        [pt]="iconOnly"
        (click)="clicks.set(clicks() + 1)"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
          <circle cx="8" cy="8" r="6" />
        </svg>
      </wj-button>
    </wj-overlaybadge>
    <button type="button" id="after">After</button>
  `,
})
class Host {
  readonly value = signal<string | number | undefined>(4);
  readonly severity = signal<WjOverlayBadgeSeverity | undefined>(undefined);
  readonly size = signal<WjOverlayBadgeSize | undefined>(undefined);
  readonly pt = signal<WjOverlayBadgePt>(undefined);
  readonly dir = signal<string | null>(null);
  readonly clicks = signal(0);
  /** A projected icon does not make Optimus's button "icon only": the class gives its 44 px square. */
  protected readonly iconOnly = { root: { class: 'p-button-icon-only' } };
}

/** An overlay badge with every input at its default. */
@Component({
  selector: 'wj-overlaybadge-bare-host',
  imports: [WjOverlayBadge],
  template: `<wj-overlaybadge><span>Content</span></wj-overlaybadge>`,
})
class BareHost {}

/** A consumer who writes aria-* on the host: there are no ARIA inputs to route it to. */
@Component({
  selector: 'wj-overlaybadge-aria-on-host-host',
  imports: [WjOverlayBadge],
  template: `<wj-overlaybadge value="8" aria-label="Unread"><span>Content</span></wj-overlaybadge>`,
})
class AriaOnHostHost {}

/** An overlay badge rendered without `provideWeeljack`. */
@Component({
  selector: 'wj-overlaybadge-routed-host',
  imports: [WjOverlayBadge],
  template: `<wj-overlaybadge value="8"><span>Content</span></wj-overlaybadge>`,
})
class RoutedHost {}

/** Two overlay badges, told apart by value in a harness search. */
@Component({
  selector: 'wj-overlaybadge-pair-host',
  imports: [WjOverlayBadge, WjButton],
  template: `
    <wj-overlaybadge value="12"><wj-button label="First" /></wj-overlaybadge>
    <wj-overlaybadge><wj-button label="Second" /></wj-overlaybadge>
  `,
})
class PairHost {}

type Scheme = 'light' | 'dark';

interface Rendered {
  fixture: ComponentFixture<Host>;
  component: Host;
  badge: WjOverlayBadgeHarness;
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
  const badge = await TestbedHarnessEnvironment.loader(fixture).getHarness(WjOverlayBadgeHarness);
  // A render without Optimus's styles would pass for the wrong reason: fail loudly instead.
  expect(getComputedStyle(badgeOf(element)).fontWeight).toBe('700');
  return { fixture, component: fixture.componentInstance, badge, element };
}

function find<E extends Element>(element: ParentNode, selector: string, type: new () => E): E {
  const found = element.querySelector(selector);
  if (!(found instanceof type)) {
    throw new Error(`${selector} is missing`);
  }
  return found;
}

const hostOf = (element: ParentNode): HTMLElement => find(element, 'wj-overlaybadge', HTMLElement);
const innerOf = (element: ParentNode): HTMLElement => find(element, 'p-overlaybadge', HTMLElement);
const rootOf = (element: ParentNode): HTMLElement => find(element, '.p-overlaybadge', HTMLElement);
const badgeOf = (element: ParentNode): HTMLElement => find(element, 'p-badge', HTMLElement);
/** The native button inside the wrapped `wj-button`: the control the badge sits on. */
const buttonOf = (element: ParentNode): HTMLElement =>
  find(element, 'wj-button button', HTMLElement);

const centreOf = (element: HTMLElement): { x: number; y: number } => {
  const { left, top, width, height } = element.getBoundingClientRect();
  return { x: left + width / 2, y: top + height / 2 };
};

const STATES: [string, (host: Host) => void][] = [
  ['a value', () => undefined],
  [
    'the dot',
    (host) => {
      host.value.set(undefined);
    },
  ],
  [
    'a severity',
    (host) => {
      host.severity.set('danger');
    },
  ],
  [
    'a severity dot',
    (host) => {
      host.value.set(undefined);
      host.severity.set('success');
    },
  ],
  [
    'a wide value',
    (host) => {
      host.value.set('99+');
    },
  ],
];

describe('WjOverlayBadge', () => {
  let warn: MockInstance<typeof console.warn>;

  beforeEach(() => {
    // Optimus injects its styles after the first render. Measure the end state, not a transition.
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

  describe('defaults', () => {
    it('renders the ink dot on the projected content with no inputs', async () => {
      TestBed.configureTestingModule({ providers: [provideWeeljack()] });
      const fixture = TestBed.createComponent(BareHost);
      await fixture.whenStable();
      const element = fixture.nativeElement as HTMLElement;
      const badge = badgeOf(element);
      const harness =
        await TestbedHarnessEnvironment.loader(fixture).getHarness(WjOverlayBadgeHarness);

      expect(await harness.isDot()).toBe(true);
      expect(badge.classList.contains('p-badge-dot')).toBe(true);
      expect(badge.className).not.toMatch(/p-badge-(sm|lg|xl|success|info|warn|danger)/);
      expect(badge.getBoundingClientRect().width).toBe(8);
      expect(badge.getBoundingClientRect().height).toBe(8);
      expect(getComputedStyle(badge).backgroundColor).toBe('rgb(9, 9, 11)');
      expect(element.textContent).toContain('Content');
    });
  });

  describe('value', () => {
    it('shows the text, and updates when it changes', async () => {
      const { fixture, component, badge } = await render();
      expect(await badge.getValue()).toBe('4');
      expect(await badge.isDot()).toBe(false);

      component.value.set('Overdue');
      await fixture.whenStable();

      expect(await badge.getValue()).toBe('Overdue');
    });

    it('shows 0 as "0" rather than a dot', async () => {
      const { fixture, component, badge, element } = await render();

      component.value.set(0);
      await fixture.whenStable();

      expect(await badge.getValue()).toBe('0');
      expect(await badge.isDot()).toBe(false);
      expect(badgeOf(element).classList.contains('p-badge-dot')).toBe(false);
    });

    it('is the dot when the value is unset or empty, and the badge again once it has one', async () => {
      const { fixture, component, badge, element } = await render((host) => {
        host.value.set(undefined);
      });
      expect(await badge.isDot()).toBe(true);
      expect(badgeOf(element).getBoundingClientRect().width).toBe(8);

      component.value.set('');
      await fixture.whenStable();
      expect(await badge.isDot()).toBe(true);

      component.value.set('New');
      await fixture.whenStable();
      expect(await badge.getValue()).toBe('New');
      expect(badgeOf(element).classList.contains('p-badge-dot')).toBe(false);
      expect(badgeOf(element).getBoundingClientRect().height).toBe(24);
    });

    it('keeps a value wider than the control on one line, in a pill that stays 24 px tall', async () => {
      const { element } = await render((host) => {
        host.value.set('100+ unread messages');
      });
      const badge = badgeOf(element);

      expect(getComputedStyle(badge).whiteSpace).toBe('nowrap');
      expect(badge.getClientRects()).toHaveLength(1);
      expect(badge.getBoundingClientRect().height).toBe(24);
      expect(badge.getBoundingClientRect().width).toBeGreaterThan(
        buttonOf(element).getBoundingClientRect().width,
      );
    });

    it('is found by its value, and a harness reaches the wrapped control', async () => {
      TestBed.configureTestingModule({ providers: [provideWeeljack()] });
      const fixture = TestBed.createComponent(PairHost);
      await fixture.whenStable();
      const loader = TestbedHarnessEnvironment.loader(fixture);

      expect(
        await loader.getAllHarnesses(WjOverlayBadgeHarness.with({ value: '12' })),
      ).toHaveLength(1);
      expect(
        await loader.getAllHarnesses(WjOverlayBadgeHarness.with({ value: /^1/ })),
      ).toHaveLength(1);
      expect(await loader.getAllHarnesses(WjOverlayBadgeHarness.with({ value: '' }))).toHaveLength(
        1,
      );
      expect(await loader.getAllHarnesses(WjOverlayBadgeHarness)).toHaveLength(2);

      const twelve = await loader.getHarness(WjOverlayBadgeHarness.with({ value: '12' }));
      const button = await twelve.getHarness(WjButtonHarness);
      expect(await button.getLabel()).toBe('First');
      expect(await twelve.getHarnessOrNull(WjButtonHarness.with({ label: 'Second' }))).toBeNull();
    });
  });

  describe('severity', () => {
    it.each(SEVERITIES)('%s reaches the badge', async (severity) => {
      const { element } = await render((host) => {
        host.severity.set(severity);
      });

      expect(badgeOf(element).classList.contains(`p-badge-${severity}`)).toBe(true);
    });

    it('takes the primary (ink) look when severity is unset, and changes when it changes', async () => {
      const { fixture, component, element } = await render();
      const style = getComputedStyle(badgeOf(element));
      expect(badgeOf(element).className).not.toMatch(/p-badge-(success|info|warn|danger)/);
      expect(style.backgroundColor).toBe('rgb(9, 9, 11)');
      expect(style.color).toBe('rgb(255, 255, 255)');

      component.severity.set('danger');
      await fixture.whenStable();
      expect(badgeOf(element).classList.contains('p-badge-danger')).toBe(true);
      // Phase 4's corrected light fill: red.700 with white text.
      expect(getComputedStyle(badgeOf(element)).backgroundColor).toBe('rgb(185, 28, 28)');

      component.severity.set(undefined);
      await fixture.whenStable();
      expect(badgeOf(element).className).not.toMatch(/p-badge-danger/);
    });
  });

  describe('size', () => {
    it.each([
      ['small', 20, 'p-badge-sm'],
      ['large', 28, 'p-badge-lg'],
    ] as const)('%s is %s px tall, through badgeSize', async (size, height, className) => {
      const { element } = await render((host) => {
        host.size.set(size);
        host.value.set('12');
      });

      expect(badgeOf(element).classList.contains(className)).toBe(true);
      expect(badgeOf(element).getBoundingClientRect().height).toBe(height);
    });

    it('is 24 px by default and returns to it when cleared', async () => {
      const { fixture, component, element } = await render((host) => {
        host.size.set('large');
      });
      expect(badgeOf(element).getBoundingClientRect().height).toBe(28);

      component.size.set(undefined);
      await fixture.whenStable();

      expect(badgeOf(element).getBoundingClientRect().height).toBe(24);
    });
  });

  describe('pt', () => {
    it('reaches host, root and pcBadge as an object', async () => {
      const { element } = await render((host) => {
        host.pt.set({
          host: { 'data-host': 'a' },
          root: { 'data-root': 'b' },
          pcBadge: { root: { 'data-badge': 'c' } },
        });
      });

      expect(innerOf(element).getAttribute('data-host')).toBe('a');
      expect(rootOf(element).getAttribute('data-root')).toBe('b');
      expect(badgeOf(element).getAttribute('data-badge')).toBe('c');
    });

    it('reaches root and pcBadge as a function', async () => {
      const { element } = await render((host) => {
        host.pt.set(() => ({
          root: () => ({ 'data-probe': 'root-fn' }),
          pcBadge: { root: () => ({ 'data-probe': 'badge-fn' }) },
        }));
      });

      expect(rootOf(element).getAttribute('data-probe')).toBe('root-fn');
      expect(badgeOf(element).getAttribute('data-probe')).toBe('badge-fn');
    });
  });

  describe('layout', () => {
    it('makes the host inline-flex and the boxes inside it flex, all hugging the control', async () => {
      const { element } = await render();
      const button = buttonOf(element).getBoundingClientRect();

      // The inline-flex host makes the two boxes inside it flex items, and a flex item is blockified.
      expect(getComputedStyle(hostOf(element)).display).toBe('inline-flex');
      expect(getComputedStyle(innerOf(element)).display).toBe('flex');
      expect(getComputedStyle(rootOf(element)).display).toBe('flex');
      for (const box of [hostOf(element), innerOf(element), rootOf(element)]) {
        expect(box.getBoundingClientRect().width).toBe(button.width);
        expect(box.getBoundingClientRect().height).toBe(button.height);
      }
      expect(getComputedStyle(rootOf(element)).position).toBe('relative');
    });

    it('keeps the host on a line with its neighbours instead of spanning the row', async () => {
      const { element } = await render();
      const before = find(element, '#before', HTMLElement).getBoundingClientRect();
      const host = hostOf(element).getBoundingClientRect();
      const after = find(element, '#after', HTMLElement).getBoundingClientRect();

      expect(host.top).toBeLessThan(before.bottom);
      expect(after.top).toBeLessThan(host.bottom);
      expect(host.width).toBeLessThan(80);
    });

    it.each([
      [
        'a value',
        (host: Host) => {
          host.value.set(4);
        },
      ],
      [
        'a wide value',
        (host: Host) => {
          host.value.set('100+');
        },
      ],
      [
        'the dot',
        (host: Host) => {
          host.value.set(undefined);
        },
      ],
      [
        'a small badge',
        (host: Host) => {
          host.size.set('small');
        },
      ],
      [
        'a large badge',
        (host: Host) => {
          host.size.set('large');
        },
      ],
    ])('centres the badge on the 44 px button’s top-right corner: %s', async (_name, setup) => {
      const { element } = await render(setup);
      const rect = buttonOf(element).getBoundingClientRect();
      const centre = centreOf(badgeOf(element));

      expect(rect.height).toBe(44);
      expect(Math.abs(centre.x - rect.right)).toBeLessThanOrEqual(1);
      expect(Math.abs(centre.y - rect.top)).toBeLessThanOrEqual(1);
    });

    it('moves the badge to the top-start corner in a right-to-left context', async () => {
      const { element } = await render((host) => {
        host.dir.set('rtl');
      });
      const rect = buttonOf(element).getBoundingClientRect();
      const centre = centreOf(badgeOf(element));

      expect(Math.abs(centre.x - rect.left)).toBeLessThanOrEqual(1);
      expect(Math.abs(centre.y - rect.top)).toBeLessThanOrEqual(1);
    });

    it('draws a 2 px ring in the surface colour around the badge', async () => {
      const { element } = await render();
      const style = getComputedStyle(badgeOf(element));
      const surface = getComputedStyle(document.body).backgroundColor;

      expect(style.outlineWidth).toBe('2px');
      expect(style.outlineStyle).toBe('solid');
      expect(style.outlineColor).toBe(surface);
    });

    it('passes the pointer through the badge to the control under it', async () => {
      const { element, component } = await render();
      const rect = buttonOf(element).getBoundingClientRect();
      const x = rect.right - 4;
      const y = rect.top + 4;

      expect(getComputedStyle(badgeOf(element)).pointerEvents).toBe('none');
      expect(badgeOf(element).getBoundingClientRect().left).toBeLessThan(x);
      expect(buttonOf(element).contains(document.elementFromPoint(x, y))).toBe(true);

      await userEvent.click(buttonOf(element));
      expect(component.clicks()).toBe(1);
    });
  });

  describe('safety', () => {
    it('renders an HTML payload in value as text, creating no element and running nothing', async () => {
      const { fixture, component, badge, element } = await render((host) => {
        host.value.set(PAYLOAD);
      });

      expect(await badge.getValue()).toBe(PAYLOAD);
      expect(element.querySelector('img')).toBeNull();
      expect(Reflect.get(window, 'wjInjected')).toBeUndefined();

      component.value.set(`${PAYLOAD}<script>window.wjInjected = true</script>`);
      await fixture.whenStable();
      expect(element.querySelector('img, script')).toBeNull();
      expect(Reflect.get(window, 'wjInjected')).toBeUndefined();
    });
  });

  describe('setup and ARIA checks', () => {
    it('warns WJ0001 when provideWeeljack is missing', async () => {
      const fixture = TestBed.createComponent(RoutedHost);
      await fixture.whenStable();

      expect(warn).toHaveBeenCalledTimes(1);
      expect(warn).toHaveBeenCalledWith(
        'WJ0001: wj-overlaybadge: provideWeeljack() is missing from the application providers. ' +
          'Add provideWeeljack() to your application config. ' +
          'Find more at https://locvodever.github.io/weeljack-ng/errors/WJ0001',
      );
    });

    it('stays silent with provideWeeljack and no aria-* on the host', async () => {
      await render();

      expect(warn).not.toHaveBeenCalled();
    });

    it('adds no role of its own', async () => {
      const { element } = await render();

      expect(hostOf(element).hasAttribute('role')).toBe(false);
      expect(rootOf(element).hasAttribute('role')).toBe(false);
      expect(badgeOf(element).hasAttribute('role')).toBe(false);
    });

    it('warns WJ0003 once, with its own advice, when aria-* is on the host', async () => {
      TestBed.configureTestingModule({ providers: [provideWeeljack()] });
      const fixture = TestBed.createComponent(AriaOnHostHost);
      await fixture.whenStable();

      expect(warn).toHaveBeenCalledTimes(1);
      expect(warn).toHaveBeenCalledWith(
        'WJ0003: wj-overlaybadge: aria-label is set on the host, where it is not forwarded to the ' +
          'focusable element. An overlay badge has no aria inputs: name the wrapped control with ' +
          'the badge’s meaning instead. ' +
          'Find more at https://locvodever.github.io/weeljack-ng/errors/WJ0003',
      );
    });
  });

  describe('accessibility', () => {
    describe.each<Scheme>(['light', 'dark'])('%s', (scheme) => {
      it.each(STATES)(
        'has no axe violations around an icon-only button: %s',
        async (_name, setup) => {
          const { element } = await render(setup, scheme);

          // The fixture's native Before/After buttons are not under test and fail `target-size`.
          await expectNoAxeViolations(hostOf(element));
        },
      );
    });
  });

  describe('keyboard', () => {
    it('keeps the wrapped control’s Tab stop and adds none of its own', async () => {
      const { element } = await render();
      const tabbable = [...element.querySelectorAll<HTMLElement>('[tabindex], button, a, input')];
      expect(tabbable.map((node) => node.id || node.tagName.toLowerCase())).toEqual([
        'before',
        'button',
        'after',
      ]);
      expect(hostOf(element).hasAttribute('tabindex')).toBe(false);
      expect(badgeOf(element).querySelector('[tabindex], button, a, input')).toBeNull();

      find(element, '#before', HTMLElement).focus();
      await userEvent.tab();
      expect(document.activeElement).toBe(buttonOf(element));

      await userEvent.tab();
      expect(document.activeElement).toBe(find(element, '#after', HTMLElement));

      await userEvent.tab({ shift: true });
      expect(document.activeElement).toBe(buttonOf(element));
    });

    it('lets the wrapped control keep its own keys', async () => {
      const { element, component } = await render();
      buttonOf(element).focus();

      await userEvent.keyboard('{Enter}');
      await userEvent.keyboard(' ');

      expect(component.clicks()).toBe(2);
    });
  });
});
