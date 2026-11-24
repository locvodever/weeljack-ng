import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Component, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import type { MockInstance } from 'vitest';
import { userEvent } from 'vitest/browser';
import { provideWeeljack } from 'weeljack-ng';
import { WjTag, type WjTagPt, type WjTagSeverity } from 'weeljack-ng/tag';
import { WjTagHarness } from 'weeljack-ng/tag/testing';
import { expectNoAxeViolations } from '../spec-support/axe';

const PAYLOAD = '<img src=x onerror="window.wjInjected = true">';
const ROOT = document.documentElement;
const SEVERITIES: readonly WjTagSeverity[] = [
  'success',
  'info',
  'warn',
  'danger',
  'secondary',
  'contrast',
];

/** A consumer's template: one tag, optionally with a projected decorative icon. */
@Component({
  selector: 'wj-tag-host',
  imports: [WjTag],
  template: `
    <button type="button" id="before">Before</button>
    <wj-tag [value]="value()" [severity]="severity()" [pt]="pt()">
      @if (withIcon()) {
        <svg
          id="icon"
          width="1em"
          height="1em"
          viewBox="0 0 16 16"
          fill="currentColor"
          aria-hidden="true"
          focusable="false"
        >
          <circle cx="8" cy="8" r="6" />
        </svg>
      }
    </wj-tag>
    <button type="button" id="after">After</button>
  `,
})
class Host {
  readonly value = signal<string | undefined>('Paid');
  readonly severity = signal<WjTagSeverity | undefined>(undefined);
  readonly pt = signal<WjTagPt>(undefined);
  readonly withIcon = signal(false);
}

/** A consumer who writes aria-* on the host: the tag has no focusable part to forward it to. */
@Component({
  selector: 'wj-tag-aria-on-host-host',
  imports: [WjTag],
  template: `<wj-tag value="Paid" aria-label="Status" aria-describedby="note" />`,
})
class AriaOnHostHost {}

/** A tag rendered without `provideWeeljack`. */
@Component({
  selector: 'wj-tag-routed-host',
  imports: [WjTag],
  template: `<wj-tag value="Paid" />`,
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
  // A render without Optimus's styles would pass axe for the wrong reason: fail loudly instead.
  expect(find(element, 'p-tag', HTMLElement).getBoundingClientRect().height).toBeGreaterThan(0);
  return { fixture, component: fixture.componentInstance, element };
}

function find<E extends Element>(element: HTMLElement, selector: string, type: new () => E): E {
  const found = element.querySelector(selector);
  if (!(found instanceof type)) {
    throw new Error(`${selector} is missing`);
  }
  return found;
}

const hostOf = (element: HTMLElement): HTMLElement => find(element, 'wj-tag', HTMLElement);
const rootOf = (element: HTMLElement): HTMLElement => find(element, 'p-tag', HTMLElement);

function harnessOf(fixture: ComponentFixture<unknown>): Promise<WjTagHarness> {
  return TestbedHarnessEnvironment.loader(fixture).getHarness(WjTagHarness);
}

const STATES: [string, (host: Host) => void][] = [
  ['unset', () => undefined],
  ...SEVERITIES.map((severity): [string, (host: Host) => void] => [
    severity,
    (host) => {
      host.severity.set(severity);
    },
  ]),
  [
    'with a projected aria-hidden icon',
    (host) => {
      host.withIcon.set(true);
    },
  ],
  [
    'severity with a projected aria-hidden icon',
    (host) => {
      host.severity.set('danger');
      host.withIcon.set(true);
    },
  ],
];

describe('WjTag', () => {
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
    it('shows the value, and updates when it changes', async () => {
      const { fixture, component } = await render();
      const tag = await harnessOf(fixture);
      expect(await tag.getValue()).toBe('Paid');

      component.value.set('Overdue');
      await fixture.whenStable();

      expect(await tag.getValue()).toBe('Overdue');
    });

    it('is found by its value', async () => {
      const { fixture } = await render();
      const loader = TestbedHarnessEnvironment.loader(fixture);

      expect(await loader.getAllHarnesses(WjTagHarness.with({ value: 'Paid' }))).toHaveLength(1);
      expect(await loader.getAllHarnesses(WjTagHarness.with({ value: /^Pa/ }))).toHaveLength(1);
      expect(await loader.getAllHarnesses(WjTagHarness.with({ value: 'Other' }))).toHaveLength(0);
    });

    it.each(SEVERITIES)('severity %s reaches the Optimus root', async (severity) => {
      const { element } = await render((host) => {
        host.severity.set(severity);
      });

      expect(rootOf(element).classList.contains(`p-tag-${severity}`)).toBe(true);
    });

    it('takes the primary (ink) look when severity is unset', async () => {
      const { element } = await render();

      expect(rootOf(element).className).not.toMatch(/p-tag-(success|info|warn|danger)/);
      // The ink look: a near-black zinc fill (Aura's, rgb(24, 24, 27)) with white text.
      const style = getComputedStyle(rootOf(element));
      expect(style.backgroundColor).toBe('rgb(24, 24, 27)');
      expect(style.color).toBe('rgb(255, 255, 255)');
    });

    it('pt reaches the root and label parts as an object', async () => {
      const { element } = await render((host) => {
        host.pt.set({ root: { 'data-root': 'a' }, label: { 'data-label': 'b' } });
      });

      expect(rootOf(element).getAttribute('data-root')).toBe('a');
      expect(find(element, '.p-tag-label', HTMLElement).getAttribute('data-label')).toBe('b');
    });

    it('pt reaches the root as a function', async () => {
      const { element } = await render((host) => {
        host.pt.set(() => ({ root: () => ({ 'data-probe': 'fn' }) }));
      });

      expect(rootOf(element).getAttribute('data-probe')).toBe('fn');
    });

    it('is an inline-flex host with no box of its own around the Optimus root', async () => {
      const { element } = await render();
      const host = hostOf(element);
      const root = rootOf(element).getBoundingClientRect();

      expect(getComputedStyle(host).display).toBe('inline-flex');
      expect(host.getBoundingClientRect().height).toBe(root.height);
      expect(host.getBoundingClientRect().width).toBe(root.width);
    });

    it('is never interactive: no tabindex, no role, no focusable descendant', async () => {
      const { element } = await render();
      const host = hostOf(element);

      expect(host.hasAttribute('tabindex')).toBe(false);
      expect(host.querySelector('[tabindex], button, a, input')).toBeNull();
      expect(getComputedStyle(rootOf(element)).cursor).not.toBe('pointer');
    });
  });

  describe('projected content', () => {
    it('renders before the value', async () => {
      const { fixture, element } = await render((host) => {
        host.withIcon.set(true);
      });
      const icon = find(element, '#icon', SVGElement);
      const label = find(element, '.p-tag-label', HTMLElement);

      expect(icon.compareDocumentPosition(label) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
      expect(rootOf(element).firstElementChild).toBe(icon);
      expect(await (await harnessOf(fixture)).getValue()).toBe('Paid');
    });
  });

  describe('safety', () => {
    it('renders an HTML payload in value as text, creating no element and running nothing', async () => {
      const { fixture, component, element } = await render((host) => {
        host.value.set(PAYLOAD);
      });
      const tag = await harnessOf(fixture);

      expect(await tag.getValue()).toBe(PAYLOAD);
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
        'WJ0001: wj-tag: provideWeeljack() is missing from the application providers. ' +
          'Add provideWeeljack() to your application config. ' +
          'Find more at https://locvodever.github.io/weeljack-ng/errors/WJ0001',
      );
    });

    it('stays silent with provideWeeljack', async () => {
      await render();

      expect(warn).not.toHaveBeenCalled();
    });

    it('does not warn WJ0003 for aria-* on the host: a tag has no focusable part', async () => {
      TestBed.configureTestingModule({ providers: [provideWeeljack()] });
      const fixture = TestBed.createComponent(AriaOnHostHost);
      await fixture.whenStable();

      expect(warn).not.toHaveBeenCalled();
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
    it('Tab moves from the button before the tag straight to the button after it', async () => {
      const { element } = await render();
      find(element, '#before', HTMLElement).focus();

      await userEvent.tab();
      expect(document.activeElement).toBe(find(element, '#after', HTMLElement));

      await userEvent.tab({ shift: true });
      expect(document.activeElement).toBe(find(element, '#before', HTMLElement));
    });
  });
});
