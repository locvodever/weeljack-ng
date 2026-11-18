/// <reference types="@vitest/browser-playwright" />
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Component, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { Optimus } from '@openng/optimus-ui/config';
import type { MockInstance } from 'vitest';
import { cdp, userEvent } from 'vitest/browser';
import { provideWeeljack } from 'weeljack-ng';
import { WjButton } from 'weeljack-ng/button';
import { WjButtonHarness } from 'weeljack-ng/button/testing';
import { WjRipple } from 'weeljack-ng/ripple';
import { WjRippleHarness } from 'weeljack-ng/ripple/testing';
import { expectNoAxeViolations } from '../spec-support/axe';

const ROOT = document.documentElement;

/** A consumer's template: one tile with the directive, and a `wj-button` beside it. */
@Component({
  selector: 'wj-ripple-host',
  imports: [WjRipple, WjButton],
  template: `
    <button
      type="button"
      id="tile"
      class="tile"
      wjRipple
      [wjRippleDisabled]="disabled()"
      (click)="clicks.set(clicks() + 1)"
    >
      Open the file
    </button>
    <wj-button label="Plain" />
  `,
  styles: `
    .tile {
      min-width: 12rem;
      min-height: 3rem;
    }
  `,
})
class Host {
  readonly disabled = signal(false);
  readonly clicks = signal(0);
}

/** A tile that a consumer can take out of the page. */
@Component({
  selector: 'wj-ripple-toggle-host',
  imports: [WjRipple],
  template: `
    @if (shown()) {
      <button type="button" id="tile" wjRipple>Open the file</button>
    }
  `,
})
class ToggleHost {
  readonly shown = signal(true);
}

type Scheme = 'light' | 'dark';

interface Rendered<T> {
  fixture: ComponentFixture<T>;
  component: T;
  element: HTMLElement;
}

/** Renders `type` with only `provideWeeljack` in the given scheme, after `setup` ran. */
async function renderAs<T>(
  type: new () => T,
  setup: (component: T) => void = () => undefined,
  scheme: Scheme = 'light',
): Promise<Rendered<T>> {
  ROOT.classList.toggle('wj-dark', scheme === 'dark');
  document.body.style.backgroundColor = 'var(--wj-content-background)';
  TestBed.configureTestingModule({ providers: [provideWeeljack({ darkMode: 'class' })] });
  const fixture = TestBed.createComponent(type);
  setup(fixture.componentInstance);
  await fixture.whenStable();
  return {
    fixture,
    component: fixture.componentInstance,
    element: fixture.nativeElement as HTMLElement,
  };
}

function tileOf(element: HTMLElement): HTMLButtonElement {
  const tile = element.querySelector('#tile');
  if (!(tile instanceof HTMLButtonElement)) {
    throw new Error('#tile is missing');
  }
  return tile;
}

function plainButtonOf(element: HTMLElement): HTMLButtonElement {
  const button = element.querySelector('wj-button button');
  if (!(button instanceof HTMLButtonElement)) {
    throw new Error('the wj-button is missing');
  }
  return button;
}

const inksOf = (element: HTMLElement): NodeListOf<HTMLElement> =>
  element.querySelectorAll<HTMLElement>('.p-ink');

function rippleOf(fixture: ComponentFixture<unknown>): Promise<WjRippleHarness> {
  return TestbedHarnessEnvironment.loader(fixture).getHarness(WjRippleHarness);
}

/** Emulates the user's reduced-motion preference, or clears it. */
async function emulateReducedMotion(reduce: boolean): Promise<void> {
  await cdp().send('Emulation.setEmulatedMedia', {
    features: [{ name: 'prefers-reduced-motion', value: reduce ? 'reduce' : 'no-preference' }],
  });
}

describe('WjRipple', () => {
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

  afterEach(async () => {
    document.getElementById('wj-spec-no-motion')?.remove();
    ROOT.classList.remove('wj-dark');
    document.body.style.backgroundColor = '';
    document.head.querySelectorAll('style[data-optimus-style-id]').forEach((style) => {
      style.remove();
    });
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    await emulateReducedMotion(false);
  });

  describe('ink', () => {
    it('is drawn on a press with nothing but provideWeeljack', async () => {
      const { fixture, element } = await renderAs(Host);
      const ripple = await rippleOf(fixture);
      expect(inksOf(element).length).toBe(0);
      expect(await ripple.hasInk()).toBe(false);

      await ripple.press();

      expect(await ripple.hasInk()).toBe(true);
      const [ink] = inksOf(element);
      // Optimus's own class marks the animation: read here, never from the harness.
      expect(ink?.classList.contains('p-ink-active')).toBe(true);
      expect(ink?.parentElement).toBe(tileOf(element));
      expect(getComputedStyle(tileOf(element)).overflow).toBe('hidden');
    });

    it('is drawn on a second press too, from the one ink', async () => {
      const { fixture, element } = await renderAs(Host);
      const ripple = await rippleOf(fixture);

      await ripple.press();
      await expect.poll(() => inksOf(element)[0]?.classList.contains('p-ink-active')).toBe(false);
      await ripple.press();

      expect(inksOf(element).length).toBe(1);
      expect(inksOf(element)[0]?.classList.contains('p-ink-active')).toBe(true);
      expect(await ripple.hasInk()).toBe(true);
    });

    it('is drawn by a real pointer press', async () => {
      const { fixture, element } = await renderAs(Host);
      const ripple = await rippleOf(fixture);

      await userEvent.click(tileOf(element));

      expect(await ripple.hasInk()).toBe(true);
    });

    it('carries no app text and no role of its own, and hides from assistive tech', async () => {
      const { fixture, element } = await renderAs(Host);
      await (await rippleOf(fixture)).press();

      const [ink] = inksOf(element);
      expect(ink?.textContent).toBe('');
      expect(ink?.getAttribute('aria-hidden')).toBe('true');
      expect(ink?.getAttribute('role')).toBe('presentation');
      expect(tileOf(element).getAttribute('role')).toBeNull();
      expect(tileOf(element).getAttribute('aria-label')).toBeNull();
    });

    it('leaves Optimus’s global ripple switch off, and a wj-button inkless', async () => {
      const { fixture, element } = await renderAs(Host);
      expect(TestBed.inject(Optimus).ripple()).toBe(false);

      const button = await TestbedHarnessEnvironment.loader(fixture).getHarness(WjButtonHarness);
      await button.click();
      await userEvent.click(plainButtonOf(element));
      await (await rippleOf(fixture)).press();

      expect(element.querySelector('wj-button .p-ink')).toBeNull();
      expect(inksOf(element).length).toBe(1);
      expect(TestBed.inject(Optimus).ripple()).toBe(false);
    });
  });

  describe('wjRippleDisabled', () => {
    it('is off by default, and reflects as a hook the harness reads', async () => {
      const { fixture, component } = await renderAs(Host);
      const ripple = await rippleOf(fixture);
      expect(await ripple.isDisabled()).toBe(false);

      component.disabled.set(true);
      expect(await ripple.isDisabled()).toBe(true);
    });

    it('draws no ink while it is on, and draws it again when it turns off', async () => {
      const { fixture, element, component } = await renderAs(Host, (host) => {
        host.disabled.set(true);
      });
      const ripple = await rippleOf(fixture);

      await ripple.press();
      expect(inksOf(element).length).toBe(0);
      expect(await ripple.hasInk()).toBe(false);

      component.disabled.set(false);
      await ripple.press();
      expect(await ripple.hasInk()).toBe(true);
    });

    it('does not stop the host’s own click', async () => {
      const { fixture, component } = await renderAs(Host, (host) => {
        host.disabled.set(true);
      });
      await (await rippleOf(fixture)).press();
      await userEvent.click(tileOf(fixture.nativeElement as HTMLElement));

      expect(component.clicks()).toBe(1);
    });
  });

  describe('reduced motion', () => {
    it('draws no visible ink under prefers-reduced-motion: reduce', async () => {
      await emulateReducedMotion(true);
      const { fixture, element } = await renderAs(Host);
      const ripple = await rippleOf(fixture);

      await ripple.press();
      await ripple.press();

      expect(await ripple.hasInk()).toBe(false);
      for (const ink of Array.from(inksOf(element))) {
        expect(getComputedStyle(ink).display).toBe('none');
        expect(ink.classList.contains('p-ink-active')).toBe(false);
      }
    });

    it('draws it without the preference', async () => {
      await emulateReducedMotion(false);
      const { fixture } = await renderAs(Host);
      const ripple = await rippleOf(fixture);

      await ripple.press();

      expect(await ripple.hasInk()).toBe(true);
    });

    it('leaves the host’s own focus outline alone', async () => {
      await emulateReducedMotion(true);
      const { element } = await renderAs(Host);

      await userEvent.tab();
      expect(document.activeElement).toBe(tileOf(element));
      await expect.poll(() => getComputedStyle(tileOf(element)).outlineStyle).not.toBe('none');
    });
  });

  describe('keyboard', () => {
    it('reaches the tile with Tab, and Enter and Space click it without ink', async () => {
      const { fixture, element, component } = await renderAs(Host);
      const ripple = await rippleOf(fixture);

      await userEvent.tab();
      await expect.poll(() => document.activeElement).toBe(tileOf(element));

      await userEvent.keyboard('{Enter}');
      expect(component.clicks()).toBe(1);
      await userEvent.keyboard(' ');
      expect(component.clicks()).toBe(2);

      expect(inksOf(element).length).toBe(0);
      expect(await ripple.hasInk()).toBe(false);
    });

    it('adds no Tab stop of its own', async () => {
      const { element } = await renderAs(Host);

      expect(tileOf(element).hasAttribute('tabindex')).toBe(false);
      await userEvent.tab();
      await userEvent.tab();
      expect(document.activeElement).toBe(plainButtonOf(element));
    });
  });

  describe('teardown', () => {
    it('removes the ink and the listener when the host is destroyed', async () => {
      const { fixture, component, element } = await renderAs(ToggleHost);
      const tile = tileOf(element);
      await (await rippleOf(fixture)).press();
      expect(tile.querySelectorAll('.p-ink').length).toBe(1);

      component.shown.set(false);
      await fixture.whenStable();
      expect(tile.isConnected).toBe(false);
      expect(tile.querySelectorAll('.p-ink').length).toBe(0);

      tile.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
      expect(tile.querySelectorAll('.p-ink').length).toBe(0);
    });
  });

  describe('setup checks', () => {
    it('warns WJ0001 when provideWeeljack is missing', async () => {
      const fixture = TestBed.createComponent(Host);
      await fixture.whenStable();

      expect(warn).toHaveBeenCalledWith(
        'WJ0001: [wjRipple]: provideWeeljack() is missing from the application providers. ' +
          'Add provideWeeljack() to your application config. ' +
          'Find more at https://locvodever.github.io/weeljack-ng/errors/WJ0001',
      );
    });

    it('warns nothing when set up', async () => {
      await renderAs(Host);

      expect(warn).not.toHaveBeenCalled();
    });
  });

  describe('accessibility', () => {
    describe.each<Scheme>(['light', 'dark'])('%s', (scheme) => {
      it('has no axe violations at rest', async () => {
        const { element } = await renderAs(Host, undefined, scheme);

        await expectNoAxeViolations(tileOf(element));
      });

      it('has no axe violations right after a press', async () => {
        const { fixture, element } = await renderAs(Host, undefined, scheme);
        const ripple = await rippleOf(fixture);
        await ripple.press();
        expect(await ripple.hasInk()).toBe(true);

        await expectNoAxeViolations(tileOf(element));
      });

      it('has no axe violations with wjRippleDisabled', async () => {
        const { element } = await renderAs(
          Host,
          (host) => {
            host.disabled.set(true);
          },
          scheme,
        );

        await expectNoAxeViolations(tileOf(element));
      });
    });
  });
});
