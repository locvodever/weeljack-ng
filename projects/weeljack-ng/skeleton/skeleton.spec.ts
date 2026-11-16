/// <reference types="@vitest/browser-playwright" />
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Component, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import type { MockInstance } from 'vitest';
import { cdp, userEvent } from 'vitest/browser';
import { provideWeeljack } from 'weeljack-ng';
import { WjSkeleton, type WjSkeletonPt, type WjSkeletonShape } from 'weeljack-ng/skeleton';
import { WjSkeletonHarness } from 'weeljack-ng/skeleton/testing';
import { expectNoAxeViolations } from '../spec-support/axe';

const PAYLOAD = '<img src=x onerror="window.wjInjected = true">';
const ROOT = document.documentElement;

/** A consumer's template: one skeleton between two buttons, in a 400 px container. */
@Component({
  selector: 'wj-skeleton-host',
  imports: [WjSkeleton],
  template: `
    <button type="button" id="before">Before</button>
    <div id="container" [style.display]="layout()" style="width: 400px">
      <wj-skeleton
        [width]="width()"
        [height]="height()"
        [size]="size()"
        [shape]="shape()"
        [borderRadius]="borderRadius()"
        [pt]="pt()"
      />
    </div>
    <button type="button" id="after">After</button>
  `,
})
class Host {
  readonly width = signal('100%');
  readonly height = signal('1rem');
  readonly size = signal<string | undefined>(undefined);
  readonly shape = signal<WjSkeletonShape>('rectangle');
  readonly borderRadius = signal<string | undefined>(undefined);
  readonly pt = signal<WjSkeletonPt>(undefined);
  readonly layout = signal<'block' | 'flex'>('block');
}

/** The card composition of the docs: an avatar, two lines and a rounded block. */
@Component({
  selector: 'wj-skeleton-card-host',
  imports: [WjSkeleton],
  template: `
    <div style="display: flex; gap: 16px; width: 24rem; padding: 16px">
      <wj-skeleton size="48px" shape="circle" />
      <div style="flex: 1; display: flex; flex-direction: column; gap: 8px">
        <wj-skeleton />
        <wj-skeleton width="60%" />
      </div>
    </div>
    <wj-skeleton height="8rem" borderRadius="12px" />
  `,
})
class CardHost {}

/** A consumer who writes aria-* on the host: a skeleton has no focusable part to forward it to. */
@Component({
  selector: 'wj-skeleton-aria-on-host-host',
  imports: [WjSkeleton],
  template: `<wj-skeleton aria-label="Loading" aria-describedby="note" />`,
})
class AriaOnHostHost {}

/** A skeleton rendered without `provideWeeljack`. */
@Component({
  selector: 'wj-skeleton-routed-host',
  imports: [WjSkeleton],
  template: `<wj-skeleton />`,
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
  expect(getComputedStyle(rootOf(element)).backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
  return { fixture, component: fixture.componentInstance, element };
}

function find<E extends Element>(element: HTMLElement, selector: string, type: new () => E): E {
  const found = element.querySelector(selector);
  if (!(found instanceof type)) {
    throw new Error(`${selector} is missing`);
  }
  return found;
}

const hostOf = (element: HTMLElement): HTMLElement => find(element, 'wj-skeleton', HTMLElement);
const rootOf = (element: HTMLElement): HTMLElement => find(element, 'p-skeleton', HTMLElement);

function harnessOf(fixture: ComponentFixture<unknown>): Promise<WjSkeletonHarness> {
  return TestbedHarnessEnvironment.loader(fixture).getHarness(WjSkeletonHarness);
}

/** Emulates the user's reduced-motion preference, or clears it. */
async function emulateReducedMotion(reduce: boolean): Promise<void> {
  await cdp().send('Emulation.setEmulatedMedia', {
    features: [{ name: 'prefers-reduced-motion', value: reduce ? 'reduce' : 'no-preference' }],
  });
}

const shimmer = (element: HTMLElement): string =>
  getComputedStyle(rootOf(element), '::after').animationName;

const STATES: [string, (host: Host) => void][] = [
  ['a text line', () => undefined],
  [
    'a circle',
    (host) => {
      host.size.set('48px');
      host.shape.set('circle');
    },
  ],
  [
    'a rounded block',
    (host) => {
      host.height.set('8rem');
      host.borderRadius.set('12px');
    },
  ],
];

describe('WjSkeleton', () => {
  let warn: MockInstance<typeof console.warn>;

  beforeEach(() => {
    warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(async () => {
    ROOT.classList.remove('wj-dark');
    document.body.style.backgroundColor = '';
    document.head.querySelectorAll('style[data-optimus-style-id]').forEach((style) => {
      style.remove();
    });
    Reflect.deleteProperty(window, 'wjInjected');
    await emulateReducedMotion(false);
  });

  describe('inputs', () => {
    it('defaults to a full-width, 1rem-tall rectangle', async () => {
      const { fixture } = await render();
      const skeleton = await harnessOf(fixture);
      const size = await skeleton.getSize();

      expect(size.width).toBe(400);
      expect(size.height).toBe(16);
      expect(await skeleton.isCircle()).toBe(false);
    });

    it('width reaches the box, and updates when it changes', async () => {
      const { fixture, component } = await render((host) => {
        host.width.set('120px');
      });
      const skeleton = await harnessOf(fixture);
      expect((await skeleton.getSize()).width).toBe(120);

      component.width.set('50%');
      await fixture.whenStable();
      expect((await skeleton.getSize()).width).toBe(200);
    });

    it('height reaches the box', async () => {
      const { fixture } = await render((host) => {
        host.height.set('3rem');
      });
      expect((await (await harnessOf(fixture)).getSize()).height).toBe(48);
    });

    it('size wins over width and height', async () => {
      const { fixture } = await render((host) => {
        host.width.set('300px');
        host.height.set('100px');
        host.size.set('48px');
      });
      expect(await (await harnessOf(fixture)).getSize()).toEqual({ width: 48, height: 48 });
    });

    it('shape circle gives a full radius, and rectangle the preset radius', async () => {
      const { fixture, component, element } = await render((host) => {
        host.size.set('48px');
        host.shape.set('circle');
      });
      const skeleton = await harnessOf(fixture);
      expect(await skeleton.isCircle()).toBe(true);
      expect(getComputedStyle(rootOf(element)).borderRadius).toBe('50%');

      component.shape.set('rectangle');
      await fixture.whenStable();
      expect(await skeleton.isCircle()).toBe(false);
      expect(getComputedStyle(rootOf(element)).borderRadius).not.toBe('50%');
    });

    it('borderRadius reaches the shape', async () => {
      const { element } = await render((host) => {
        host.borderRadius.set('12px');
      });
      expect(getComputedStyle(rootOf(element)).borderRadius).toBe('12px');
    });

    it('has the preset fill, no border and no text', async () => {
      const { element } = await render();
      const style = getComputedStyle(rootOf(element));

      expect(style.backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
      expect(style.borderTopWidth).toBe('0px');
      expect(rootOf(element).textContent).toBe('');
    });

    it('pt reaches the root as an object, next to the wrapper own attribute', async () => {
      const { element } = await render((host) => {
        host.pt.set({ root: { 'data-root': 'a' } });
      });
      expect(rootOf(element).getAttribute('data-root')).toBe('a');
      expect(rootOf(element).getAttribute('data-wj-shape')).toBe('rectangle');
    });

    it('pt reaches the root as a function', async () => {
      const { element } = await render((host) => {
        host.pt.set(() => ({ root: () => ({ 'data-probe': 'fn' }) }));
      });
      expect(rootOf(element).getAttribute('data-probe')).toBe('fn');
    });

    it('is a block host with no box of its own around the Optimus root', async () => {
      const { element } = await render();
      const host = hostOf(element).getBoundingClientRect();
      const root = rootOf(element).getBoundingClientRect();

      expect(getComputedStyle(hostOf(element)).display).toBe('block');
      expect(host.width).toBe(root.width);
      expect(host.height).toBe(root.height);
    });
  });

  describe('the host carries the size (FR-16)', () => {
    it('resolves a 40% width against a block parent', async () => {
      const { fixture } = await render((host) => {
        host.width.set('40%');
      });
      expect((await (await harnessOf(fixture)).getSize()).width).toBe(160);
    });

    it('resolves a 40% width against a flex row, as a bare p-skeleton does', async () => {
      const { fixture } = await render((host) => {
        host.width.set('40%');
        host.layout.set('flex');
      });
      expect((await (await harnessOf(fixture)).getSize()).width).toBe(160);
    });

    it('keeps a size circle square inside a flex row', async () => {
      const { fixture } = await render((host) => {
        host.size.set('48px');
        host.shape.set('circle');
        host.layout.set('flex');
      });
      expect(await (await harnessOf(fixture)).getSize()).toEqual({ width: 48, height: 48 });
    });
  });

  describe('reduced motion (FR-17)', () => {
    it('runs the shimmer when the reader has no preference', async () => {
      await emulateReducedMotion(false);
      const { element } = await render();

      expect(shimmer(element)).toBe('p-skeleton-animation');
    });

    it('stops the shimmer when the reader asks for reduced motion, keeping the shape', async () => {
      await emulateReducedMotion(true);
      const { fixture, element } = await render();

      expect(shimmer(element)).toBe('none');
      expect((await (await harnessOf(fixture)).getSize()).height).toBe(16);
      expect(getComputedStyle(rootOf(element)).backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
    });

    it('stops the shimmer of a circle too', async () => {
      await emulateReducedMotion(true);
      const { element } = await render((host) => {
        host.size.set('48px');
        host.shape.set('circle');
      });
      expect(shimmer(element)).toBe('none');
    });
  });

  describe('safety', () => {
    it('lands an HTML payload in width, height, size and borderRadius as style only', async () => {
      const { fixture, element } = await render((host) => {
        host.width.set(PAYLOAD);
        host.height.set(PAYLOAD);
        host.size.set(PAYLOAD);
        host.borderRadius.set(PAYLOAD);
      });
      await fixture.whenStable();

      expect(element.querySelector('img, script')).toBeNull();
      expect(element.innerHTML).not.toContain('<img');
      expect(Reflect.get(window, 'wjInjected')).toBeUndefined();
    });
  });

  describe('setup and ARIA checks', () => {
    it('warns WJ0001 when provideWeeljack is missing', async () => {
      const fixture = TestBed.createComponent(RoutedHost);
      await fixture.whenStable();

      expect(warn).toHaveBeenCalledTimes(1);
      expect(warn).toHaveBeenCalledWith(
        'WJ0001: wj-skeleton: provideWeeljack() is missing from the application providers. ' +
          'Add provideWeeljack() to your application config. ' +
          'Find more at https://locvodever.github.io/weeljack-ng/errors/WJ0001',
      );
    });

    it('stays silent with provideWeeljack', async () => {
      await render();
      expect(warn).not.toHaveBeenCalled();
    });

    it('has no ARIA inputs, and aria-* on the host raises no WJ0003', async () => {
      TestBed.configureTestingModule({ providers: [provideWeeljack()] });
      const fixture = TestBed.createComponent(AriaOnHostHost);
      await fixture.whenStable();

      expect(warn).not.toHaveBeenCalled();
    });

    it('keeps the Optimus aria-hidden on the shape', async () => {
      const { element } = await render();
      expect(rootOf(element).getAttribute('aria-hidden')).toBe('true');
    });
  });

  describe('accessibility', () => {
    describe.each<Scheme>(['light', 'dark'])('%s', (scheme) => {
      it.each(STATES)('has no axe violations: %s', async (_name, setup) => {
        const { element } = await render(setup, scheme);
        // The fixture's native Before/After buttons are not under test and fail `target-size`.
        await expectNoAxeViolations(hostOf(element));
      });

      it('has no axe violations: the card composition', async () => {
        ROOT.classList.toggle('wj-dark', scheme === 'dark');
        document.body.style.backgroundColor = 'var(--wj-content-background)';
        TestBed.configureTestingModule({ providers: [provideWeeljack({ darkMode: 'class' })] });
        const fixture = TestBed.createComponent(CardHost);
        await fixture.whenStable();

        await expectNoAxeViolations(fixture.nativeElement as HTMLElement);
      });
    });
  });

  describe('keyboard', () => {
    it('Tab moves from the button before the skeleton straight to the button after it', async () => {
      const { element } = await render();
      find(element, '#before', HTMLElement).focus();
      await userEvent.tab();
      expect(document.activeElement).toBe(find(element, '#after', HTMLElement));
      await userEvent.tab({ shift: true });
      expect(document.activeElement).toBe(find(element, '#before', HTMLElement));
    });
  });
});
