import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Component, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import type { MockInstance } from 'vitest';
import { userEvent } from 'vitest/browser';
import { provideWeeljack } from 'weeljack-ng';
import { WjBadge, type WjBadgePt, type WjBadgeSeverity, type WjBadgeSize } from 'weeljack-ng/badge';
import { WjBadgeHarness } from 'weeljack-ng/badge/testing';
import { expectNoAxeViolations } from '../spec-support/axe';

const PAYLOAD = '<img src=x onerror="window.wjInjected = true">';
const ROOT = document.documentElement;
const SEVERITIES: readonly WjBadgeSeverity[] = [
  'success',
  'info',
  'warn',
  'danger',
  'secondary',
  'contrast',
];

/** A consumer's template: one badge between two buttons. */
@Component({
  selector: 'wj-badge-host',
  imports: [WjBadge],
  template: `
    <button type="button" id="before">Before</button>
    <wj-badge [value]="value()" [severity]="severity()" [size]="size()" [pt]="pt()" />
    <button type="button" id="after">After</button>
  `,
})
class Host {
  readonly value = signal<string | number | undefined>('Messages');
  readonly severity = signal<WjBadgeSeverity | undefined>(undefined);
  readonly size = signal<WjBadgeSize | undefined>(undefined);
  readonly pt = signal<WjBadgePt>(undefined);
}

/** A badge with every input at its default. */
@Component({
  selector: 'wj-badge-bare-host',
  imports: [WjBadge],
  template: `<wj-badge />`,
})
class BareHost {}

/** A consumer who writes aria-* on the host: the badge has no ARIA inputs to route it to. */
@Component({
  selector: 'wj-badge-aria-on-host-host',
  imports: [WjBadge],
  template: `<wj-badge value="8" aria-label="Unread" />`,
})
class AriaOnHostHost {}

/** A badge rendered without `provideWeeljack`. */
@Component({
  selector: 'wj-badge-routed-host',
  imports: [WjBadge],
  template: `<wj-badge value="8" />`,
})
class RoutedHost {}

/** Two badges, told apart by value in a harness search. */
@Component({
  selector: 'wj-badge-pair-host',
  imports: [WjBadge],
  template: `
    <wj-badge value="12" />
    <wj-badge />
  `,
})
class PairHost {}

type Scheme = 'light' | 'dark';

interface Rendered {
  fixture: ComponentFixture<Host>;
  component: Host;
  badge: WjBadgeHarness;
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
  const badge = await TestbedHarnessEnvironment.loader(fixture).getHarness(WjBadgeHarness);
  // A render without Optimus's styles would pass axe for the wrong reason: fail loudly instead.
  expect(getComputedStyle(rootOf(element)).fontWeight).toBe('700');
  return { fixture, component: fixture.componentInstance, badge, element };
}

function find<E extends Element>(element: ParentNode, selector: string, type: new () => E): E {
  const found = element.querySelector(selector);
  if (!(found instanceof type)) {
    throw new Error(`${selector} is missing`);
  }
  return found;
}

const hostOf = (element: ParentNode): HTMLElement => find(element, 'wj-badge', HTMLElement);
const rootOf = (element: ParentNode): HTMLElement => find(element, 'p-badge', HTMLElement);
const sizeOf = (element: HTMLElement): { width: number; height: number } => {
  const { width, height } = rootOf(element).getBoundingClientRect();
  return { width, height };
};

const STATES: [string, (host: Host) => void][] = [
  ['unset', () => undefined],
  ...SEVERITIES.map((severity): [string, (host: Host) => void] => [
    severity,
    (host) => {
      host.severity.set(severity);
    },
  ]),
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
    'a two-digit value',
    (host) => {
      host.value.set(12);
    },
  ],
  [
    'a one-character value',
    (host) => {
      host.value.set(8);
    },
  ],
  [
    'the dot',
    (host) => {
      host.value.set(undefined);
    },
  ],
  [
    'a severity dot',
    (host) => {
      host.value.set(undefined);
      host.severity.set('danger');
    },
  ],
  [
    'a small severity with a two-digit value',
    (host) => {
      host.value.set(12);
      host.severity.set('success');
      host.size.set('small');
    },
  ],
  [
    'a large severity with a two-digit value',
    (host) => {
      host.value.set(12);
      host.severity.set('warn');
      host.size.set('large');
    },
  ],
];

describe('WjBadge', () => {
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
    it('renders the ink dot with no inputs: no value, severity or size', async () => {
      TestBed.configureTestingModule({ providers: [provideWeeljack()] });
      const fixture = TestBed.createComponent(BareHost);
      await fixture.whenStable();
      const element = fixture.nativeElement as HTMLElement;
      const root = rootOf(element);
      const badge = await TestbedHarnessEnvironment.loader(fixture).getHarness(WjBadgeHarness);

      expect(await badge.isDot()).toBe(true);
      expect(root.classList.contains('p-badge-dot')).toBe(true);
      expect(root.className).not.toMatch(/p-badge-(sm|lg|xl|success|info|warn|danger)/);
      expect(sizeOf(element)).toEqual({ width: 8, height: 8 });
      expect(getComputedStyle(root).backgroundColor).toBe('rgb(9, 9, 11)');
    });
  });

  describe('value', () => {
    it('shows the text, and updates when it changes', async () => {
      const { fixture, component, badge } = await render();
      expect(await badge.getValue()).toBe('Messages');
      expect(await badge.isDot()).toBe(false);

      component.value.set('Overdue');
      await fixture.whenStable();

      expect(await badge.getValue()).toBe('Overdue');
    });

    it('shows a number, and shows 0 as "0" rather than a dot', async () => {
      const { fixture, component, badge, element } = await render((host) => {
        host.value.set(8);
      });
      expect(await badge.getValue()).toBe('8');

      component.value.set(0);
      await fixture.whenStable();

      expect(await badge.getValue()).toBe('0');
      expect(await badge.isDot()).toBe(false);
      expect(rootOf(element).classList.contains('p-badge-dot')).toBe(false);
    });

    it('is the dot when the value is unset or empty, and the badge again once it has one', async () => {
      const { fixture, component, badge, element } = await render((host) => {
        host.value.set(undefined);
      });
      expect(await badge.isDot()).toBe(true);
      expect(sizeOf(element)).toEqual({ width: 8, height: 8 });

      component.value.set('');
      await fixture.whenStable();
      expect(await badge.isDot()).toBe(true);
      expect(rootOf(element).classList.contains('p-badge-dot')).toBe(true);

      component.value.set('New');
      await fixture.whenStable();
      expect(await badge.getValue()).toBe('New');
      expect(rootOf(element).classList.contains('p-badge-dot')).toBe(false);
      expect(sizeOf(element).height).toBe(24);
    });

    it('is a 24 px circle for one character and a 24 px pill for more', async () => {
      const { fixture, component, element } = await render((host) => {
        host.value.set('8');
      });
      expect(sizeOf(element)).toEqual({ width: 24, height: 24 });
      expect(getComputedStyle(rootOf(element)).borderRadius).toBe('50%');

      component.value.set('12');
      await fixture.whenStable();

      expect(sizeOf(element).height).toBe(24);
      expect(sizeOf(element).width).toBeGreaterThan(24);
      expect(getComputedStyle(rootOf(element)).borderRadius).toBe('6px');
    });

    it('is found by its value', async () => {
      TestBed.configureTestingModule({ providers: [provideWeeljack()] });
      const fixture = TestBed.createComponent(PairHost);
      await fixture.whenStable();
      const loader = TestbedHarnessEnvironment.loader(fixture);

      expect(await loader.getAllHarnesses(WjBadgeHarness.with({ value: '12' }))).toHaveLength(1);
      expect(await loader.getAllHarnesses(WjBadgeHarness.with({ value: /^1/ }))).toHaveLength(1);
      expect(await loader.getAllHarnesses(WjBadgeHarness.with({ value: '' }))).toHaveLength(1);
      expect(await loader.getAllHarnesses(WjBadgeHarness.with({ value: '99' }))).toHaveLength(0);
      expect(await loader.getAllHarnesses(WjBadgeHarness)).toHaveLength(2);
    });

    it('keeps a long value on one line, in a pill that stays 24 px tall', async () => {
      const { element } = await render((host) => {
        host.value.set('A value far too long for a badge to hold');
      });
      const root = rootOf(element);

      expect(getComputedStyle(root).whiteSpace).toBe('nowrap');
      expect(sizeOf(element).height).toBe(24);
      expect(root.getClientRects()).toHaveLength(1);
      expect(sizeOf(element).width).toBeGreaterThan(100);
    });
  });

  describe('severity', () => {
    it.each(SEVERITIES)('%s reaches the Optimus root', async (severity) => {
      const { element } = await render((host) => {
        host.severity.set(severity);
      });

      expect(rootOf(element).classList.contains(`p-badge-${severity}`)).toBe(true);
    });

    it('takes the primary (ink) look when severity is unset', async () => {
      const { element } = await render();
      const style = getComputedStyle(rootOf(element));

      expect(rootOf(element).className).not.toMatch(/p-badge-(success|info|warn|danger)/);
      // The ink look: the primary token, zinc.950 (rgb(9, 9, 11)) with white text.
      expect(style.backgroundColor).toBe('rgb(9, 9, 11)');
      expect(style.color).toBe('rgb(255, 255, 255)');
    });

    it('changes when the severity changes, and back to ink when it is cleared', async () => {
      const { fixture, component, element } = await render((host) => {
        host.severity.set('danger');
      });
      expect(rootOf(element).classList.contains('p-badge-danger')).toBe(true);

      component.severity.set('success');
      await fixture.whenStable();
      expect(rootOf(element).classList.contains('p-badge-danger')).toBe(false);
      expect(rootOf(element).classList.contains('p-badge-success')).toBe(true);

      component.severity.set(undefined);
      await fixture.whenStable();
      expect(rootOf(element).className).not.toMatch(/p-badge-(success|danger)/);
    });

    // The default look's light fills: the 700 steps, white text (FR-9). Aura's 500s read 2.28 to 3.76.
    it.each([
      ['success', 'rgb(21, 128, 61)'],
      ['info', 'rgb(3, 105, 161)'],
      ['warn', 'rgb(194, 65, 12)'],
      ['danger', 'rgb(185, 28, 28)'],
    ] as const)(
      'paints %s on its 700 fill with white text in the light scheme',
      async (severity, fill) => {
        const { element } = await render((host) => {
          host.severity.set(severity);
        });
        const style = getComputedStyle(rootOf(element));

        expect(style.backgroundColor).toBe(fill);
        expect(style.color).toBe('rgb(255, 255, 255)');
      },
    );

    it('leaves the dark fills as Aura has them: the 400 steps with 950 text', async () => {
      const { element } = await render((host) => {
        host.severity.set('success');
      }, 'dark');
      const style = getComputedStyle(rootOf(element));

      expect(style.backgroundColor).toBe('rgb(74, 222, 128)');
      expect(style.color).toBe('rgb(5, 46, 22)');
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

      expect(rootOf(element).classList.contains(className)).toBe(true);
      expect(sizeOf(element).height).toBe(height);
    });

    it('is 24 px by default, and a one-character value is a circle at every size', async () => {
      const { fixture, component, element } = await render((host) => {
        host.value.set('12');
      });
      expect(sizeOf(element).height).toBe(24);
      expect(rootOf(element).className).not.toMatch(/p-badge-(sm|lg)/);

      component.value.set('8');
      for (const [size, side] of [
        ['small', 20],
        ['large', 28],
      ] as const) {
        component.size.set(size);
        await fixture.whenStable();
        expect(sizeOf(element)).toEqual({ width: side, height: side });
      }
    });

    it('returns to the default size when cleared', async () => {
      const { fixture, component, element } = await render((host) => {
        host.size.set('large');
        host.value.set('12');
      });
      expect(sizeOf(element).height).toBe(28);

      component.size.set(undefined);
      await fixture.whenStable();

      expect(sizeOf(element).height).toBe(24);
    });
  });

  describe('pt', () => {
    it('reaches the host and root parts as an object', async () => {
      const { element } = await render((host) => {
        host.pt.set({ host: { 'data-host': 'a' }, root: { 'data-root': 'b' } });
      });

      expect(rootOf(element).getAttribute('data-host')).toBe('a');
      expect(rootOf(element).getAttribute('data-root')).toBe('b');
    });

    it('reaches the root as a function', async () => {
      const { element } = await render((host) => {
        host.pt.set(() => ({ root: () => ({ 'data-probe': 'fn' }) }));
      });

      expect(rootOf(element).getAttribute('data-probe')).toBe('fn');
    });
  });

  describe('layout', () => {
    it('is an inline-flex host with no box of its own around the Optimus root', async () => {
      const { element } = await render();
      const host = hostOf(element);
      const root = rootOf(element).getBoundingClientRect();
      const style = getComputedStyle(host);

      expect(style.display).toBe('inline-flex');
      expect(host.getBoundingClientRect().height).toBe(root.height);
      expect(host.getBoundingClientRect().width).toBe(root.width);
      expect([style.paddingTop, style.borderTopWidth, style.marginTop]).toEqual([
        '0px',
        '0px',
        '0px',
      ]);
    });

    it('is never interactive: no tabindex, no role, no focusable descendant, no pointer cursor', async () => {
      const { element } = await render();
      const host = hostOf(element);

      expect(host.hasAttribute('tabindex')).toBe(false);
      expect(host.hasAttribute('role')).toBe(false);
      expect(host.querySelector('[tabindex], [role], button, a, input')).toBeNull();
      expect(getComputedStyle(rootOf(element)).cursor).not.toBe('pointer');
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
        'WJ0001: wj-badge: provideWeeljack() is missing from the application providers. ' +
          'Add provideWeeljack() to your application config. ' +
          'Find more at https://locvodever.github.io/weeljack-ng/errors/WJ0001',
      );
    });

    it('stays silent with provideWeeljack and no aria-* on the host', async () => {
      await render();

      expect(warn).not.toHaveBeenCalled();
    });

    it('warns WJ0003 once, with its own advice, when aria-* is on the host', async () => {
      TestBed.configureTestingModule({ providers: [provideWeeljack()] });
      const fixture = TestBed.createComponent(AriaOnHostHost);
      await fixture.whenStable();

      expect(warn).toHaveBeenCalledTimes(1);
      expect(warn).toHaveBeenCalledWith(
        'WJ0003: wj-badge: aria-label is set on the host, where it is not forwarded to the ' +
          'focusable element. A badge has no aria inputs: its text is its value, so say what it ' +
          'means in text beside it. ' +
          'Find more at https://locvodever.github.io/weeljack-ng/errors/WJ0003',
      );
    });
  });

  describe('accessibility', () => {
    describe.each<Scheme>(['light', 'dark'])('%s', (scheme) => {
      it.each(STATES)('has no axe violations: %s', async (_name, setup) => {
        const { element } = await render(setup, scheme);

        // The fixture's native Before/After buttons are not under test and fail `target-size`.
        await expectNoAxeViolations(hostOf(element));
      });
    });
  });

  describe('keyboard', () => {
    it('Tab moves from the button before the badge straight to the button after it', async () => {
      const { element } = await render();
      find(element, '#before', HTMLElement).focus();

      await userEvent.tab();
      expect(document.activeElement).toBe(find(element, '#after', HTMLElement));

      await userEvent.tab({ shift: true });
      expect(document.activeElement).toBe(find(element, '#before', HTMLElement));
    });
  });
});
