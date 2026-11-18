import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Component, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import type { MockInstance } from 'vitest';
import { userEvent } from 'vitest/browser';
import { provideWeeljack } from 'weeljack-ng';
import { WjAutoFocus } from 'weeljack-ng/autofocus';
import { WjAutoFocusHarness } from 'weeljack-ng/autofocus/testing';
import { WjField } from 'weeljack-ng/field';
import { WjInputMask } from 'weeljack-ng/inputmask';
import { WjInputNumber } from 'weeljack-ng/inputnumber';
import { WjInputText } from 'weeljack-ng/inputtext';
import { expectNoAxeViolations } from '../spec-support/axe';

const ROOT = document.documentElement;

/** A bare attribute on one native input, then a button to Tab to. */
@Component({
  selector: 'wj-autofocus-bare-host',
  imports: [WjAutoFocus],
  template: `
    <input wjAutoFocus aria-label="Value" />
    <button type="button">Next</button>
  `,
})
class BareHost {}

/**
 * Two off elements (one static, one bound), then a bare one: Optimus's timers run in the order
 * they were started, so once the last has focus any timer for the first two has run too.
 */
@Component({
  selector: 'wj-autofocus-off-host',
  imports: [WjAutoFocus],
  template: `
    <input wjAutoFocus="false" id="static-off" aria-label="Static off" />
    <input [wjAutoFocus]="false" id="bound-off" aria-label="Bound off" />
    <input wjAutoFocus id="sentinel" aria-label="Sentinel" />
  `,
})
class OffHost {}

/** One input whose `wjAutoFocus` is bound, so it can turn on after the first render. */
@Component({
  selector: 'wj-autofocus-bound-host',
  imports: [WjAutoFocus],
  template: `
    <input [wjAutoFocus]="on()" aria-label="Value" />
    <button type="button" id="elsewhere">Elsewhere</button>
    <p>{{ ticks() }}</p>
  `,
})
class BoundHost {
  readonly on = signal(true);
  readonly ticks = signal(0);
}

/** Content revealed on a click: a native input, or the styled kinds, or a container. */
@Component({
  selector: 'wj-autofocus-reveal-host',
  imports: [WjAutoFocus, WjInputText, WjInputMask, WjInputNumber],
  template: `
    <button type="button" id="trigger" (click)="open.set(!open())">Toggle</button>
    @if (open()) {
      @switch (kind()) {
        @case ('native') {
          <input wjAutoFocus aria-label="Note" />
        }
        @case ('text') {
          <input wjInputText wjAutoFocus aria-label="Note" />
        }
        @case ('mask') {
          <input wjInputMask="999-999" wjAutoFocus aria-label="Code" />
        }
        @case ('container') {
          <div wjAutoFocus>
            <input id="street" aria-label="Street" />
            <input id="city" aria-label="City" />
          </div>
        }
        @case ('wj-host') {
          <wj-inputnumber wjAutoFocus ariaLabel="Quantity" [showButtons]="true" [value]="1" />
        }
        @case ('empty-container') {
          <div wjAutoFocus tabindex="-1" id="empty">Nothing to type here</div>
        }
      }
    }
  `,
})
class RevealHost {
  readonly open = signal(false);
  readonly kind = signal<'native' | 'text' | 'mask' | 'container' | 'wj-host' | 'empty-container'>(
    'native',
  );
}

/** A labelled field, focused or not, for axe. */
@Component({
  selector: 'wj-autofocus-axe-host',
  imports: [WjField, WjInputText, WjAutoFocus],
  template: `
    <wj-field label="Search" hint="Press Enter to search.">
      <input wjInputText [wjAutoFocus]="on()" />
    </wj-field>
  `,
})
class AxeHost {
  readonly on = signal(true);
}

type Scheme = 'light' | 'dark';

interface Rendered<T> {
  fixture: ComponentFixture<T>;
  component: T;
  element: HTMLElement;
}

/** Renders `type` with `provideWeeljack` in the given scheme, after `setup` ran. */
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

function byId(element: HTMLElement, id: string): HTMLElement {
  const found = element.querySelector(`#${id}`);
  if (!(found instanceof HTMLElement)) {
    throw new Error(`#${id} is missing`);
  }
  return found;
}

function inputsOf(element: HTMLElement): HTMLInputElement[] {
  return Array.from(element.querySelectorAll('input'));
}

function inputOf(element: HTMLElement): HTMLInputElement {
  const [input] = inputsOf(element);
  if (!(input instanceof HTMLInputElement)) {
    throw new Error('the input is missing');
  }
  return input;
}

function harnessOf(fixture: ComponentFixture<unknown>): Promise<WjAutoFocusHarness> {
  return TestbedHarnessEnvironment.loader(fixture).getHarness(WjAutoFocusHarness);
}

/** The element that has focus now: the one Optimus moved focus to, or `body`. */
function active(): Element | null {
  return document.activeElement;
}

describe('WjAutoFocus', () => {
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
    vi.useRealTimers();
    document.getElementById('wj-spec-no-motion')?.remove();
    ROOT.classList.remove('wj-dark');
    document.body.style.backgroundColor = '';
    document.head.querySelectorAll('style[data-optimus-style-id]').forEach((style) => {
      style.remove();
    });
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  });

  describe('a bare attribute', () => {
    it('is on before Optimus reads it for the first time', () => {
      TestBed.configureTestingModule({ providers: [provideWeeljack({ darkMode: 'class' })] });
      const fixture = TestBed.createComponent(BareHost);

      // One synchronous pass: Optimus sets the native attribute in its first content check only
      // when it already sees `true`, so the coercion has landed before that check.
      fixture.detectChanges();

      expect(inputOf(fixture.nativeElement as HTMLElement).hasAttribute('autofocus')).toBe(true);
    });

    it('focuses the element on first render', async () => {
      const { fixture } = await renderAs(BareHost);
      const autoFocus = await harnessOf(fixture);

      await expect.poll(() => autoFocus.isFocused()).toBe(true);
    });

    it('focuses once and leaves the element alone afterwards', async () => {
      const { fixture, element } = await renderAs(BareHost);
      const autoFocus = await harnessOf(fixture);
      await expect.poll(() => autoFocus.isFocused()).toBe(true);

      element.querySelector('button')?.focus();

      expect(await autoFocus.isFocused()).toBe(false);
    });
  });

  describe('off', () => {
    it('does not focus with a static "false" or a bound false, and sets no native attribute', async () => {
      const { fixture, element } = await renderAs(OffHost);
      const sentinel = await TestbedHarnessEnvironment.loader(fixture).getHarness(
        WjAutoFocusHarness.with({ selector: '#sentinel' }),
      );

      await expect.poll(() => sentinel.isFocused()).toBe(true);

      expect(active()).toBe(byId(element, 'sentinel'));
      expect(byId(element, 'static-off').hasAttribute('autofocus')).toBe(false);
      expect(byId(element, 'bound-off').hasAttribute('autofocus')).toBe(false);
      expect(byId(element, 'sentinel').hasAttribute('autofocus')).toBe(true);
    });

    it('focuses when a bound value turns on after the first render', async () => {
      const { fixture, component } = await renderAs(BoundHost, (host) => {
        host.on.set(false);
      });
      const autoFocus = await harnessOf(fixture);
      expect(await autoFocus.isFocused()).toBe(false);

      component.on.set(true);
      await fixture.whenStable();

      await expect.poll(() => autoFocus.isFocused()).toBe(true);
    });

    it('stops setting the native attribute when it turns off', async () => {
      const { fixture, component, element } = await renderAs(BoundHost);
      expect(inputOf(element).hasAttribute('autofocus')).toBe(true);

      component.on.set(false);
      await fixture.whenStable();

      expect(inputOf(element).hasAttribute('autofocus')).toBe(false);
    });
  });

  describe('where it works', () => {
    const open = async (
      kind: 'native' | 'text' | 'mask' | 'container' | 'wj-host' | 'empty-container',
    ): Promise<Rendered<RevealHost>> => {
      const rendered = await renderAs(RevealHost, (host) => {
        host.kind.set(kind);
      });
      byId(rendered.element, 'trigger').focus();
      expect(active()).toBe(byId(rendered.element, 'trigger'));
      rendered.component.open.set(true);
      await rendered.fixture.whenStable();
      return rendered;
    };

    it.each([
      ['a native input', 'native'],
      ['a wjInputText', 'text'],
      ['a wjInputMask', 'mask'],
    ] as const)('focuses %s when it appears', async (_name, kind) => {
      const { fixture, element } = await open(kind);
      const autoFocus = await harnessOf(fixture);

      await expect.poll(() => autoFocus.isFocused()).toBe(true);

      expect(active()).toBe(inputOf(element));
    });

    it('focuses the first focusable descendant of a container', async () => {
      const { fixture, element } = await open('container');
      const autoFocus = await harnessOf(fixture);

      await expect.poll(() => autoFocus.isFocused()).toBe(true);

      expect(active()).toBe(byId(element, 'street'));
    });

    it('focuses the input inside a wj-* host, not a spin button', async () => {
      const { fixture, element } = await open('wj-host');
      const autoFocus = await harnessOf(fixture);

      await expect.poll(() => autoFocus.isFocused()).toBe(true);

      const input = element.querySelector('wj-inputnumber input');
      expect(active()).toBe(input);
      expect(active()?.tagName).toBe('INPUT');
    });

    it('focuses the element itself when nothing inside is focusable', async () => {
      const { fixture, element } = await open('empty-container');
      const autoFocus = await harnessOf(fixture);

      await expect.poll(() => autoFocus.isFocused()).toBe(true);

      expect(active()).toBe(byId(element, 'empty'));
    });

    it('focuses a new element each time it appears', async () => {
      const { fixture, component, element } = await open('native');
      const autoFocus = await harnessOf(fixture);
      await expect.poll(() => autoFocus.isFocused()).toBe(true);

      byId(element, 'trigger').focus();
      component.open.set(false);
      await fixture.whenStable();
      expect(active()).toBe(byId(element, 'trigger'));

      component.open.set(true);
      await fixture.whenStable();

      await expect.poll(() => active() === element.querySelector('input')).toBe(true);
    });

    it('finds each element through the harness filters', async () => {
      const { fixture } = await renderAs(OffHost);
      const loader = TestbedHarnessEnvironment.loader(fixture);

      expect(await loader.getAllHarnesses(WjAutoFocusHarness)).toHaveLength(3);
      expect(
        await loader.getAllHarnesses(WjAutoFocusHarness.with({ selector: '#static-off' })),
      ).toHaveLength(1);
    });
  });

  describe('keyboard', () => {
    it('gives the focused element the typing at once', async () => {
      const { fixture, element } = await renderAs(BareHost);
      const autoFocus = await harnessOf(fixture);
      await expect.poll(() => autoFocus.isFocused()).toBe(true);

      await userEvent.keyboard('hello');

      expect(inputOf(element).value).toBe('hello');
    });

    it('continues Tab from the focused element in document order', async () => {
      const { fixture, element } = await renderAs(BareHost);
      const autoFocus = await harnessOf(fixture);
      await expect.poll(() => autoFocus.isFocused()).toBe(true);

      await userEvent.tab();

      expect(active()).toBe(element.querySelector('button'));
    });

    it('does not take focus back after the user moved it', async () => {
      TestBed.configureTestingModule({ providers: [provideWeeljack({ darkMode: 'class' })] });
      const fixture = TestBed.createComponent(BoundHost);
      const element = fixture.nativeElement as HTMLElement;
      await fixture.whenStable();
      const autoFocus = await harnessOf(fixture);
      await expect.poll(() => autoFocus.isFocused()).toBe(true);
      byId(element, 'elsewhere').focus();

      // spec-timing: Optimus focuses in its own setTimeout, so a fake clock proves a later change detection starts none
      vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
      fixture.componentInstance.ticks.update((ticks) => ticks + 1);
      fixture.detectChanges();
      fixture.componentInstance.on.set(false);
      fixture.detectChanges();
      fixture.componentInstance.on.set(true);
      fixture.detectChanges();
      vi.advanceTimersByTime(1000);
      vi.useRealTimers();

      expect(active()).toBe(byId(element, 'elsewhere'));
    });
  });

  describe('setup checks', () => {
    it('warns WJ0001 when provideWeeljack is missing', async () => {
      const fixture = TestBed.createComponent(BareHost);
      await fixture.whenStable();

      expect(warn).toHaveBeenCalledTimes(1);
      expect(warn).toHaveBeenCalledWith(
        'WJ0001: [wjAutoFocus]: provideWeeljack() is missing from the application providers. ' +
          'Add provideWeeljack() to your application config. ' +
          'Find more at https://locvodever.github.io/weeljack-ng/errors/WJ0001',
      );
    });

    it('warns nothing when set up, and has no ARIA input or host warning', async () => {
      const { element } = await renderAs(BareHost);

      expect(warn).not.toHaveBeenCalled();
      expect(inputOf(element).getAttribute('aria-label')).toBe('Value');
    });
  });

  describe('accessibility', () => {
    describe.each<Scheme>(['light', 'dark'])('%s', (scheme) => {
      it('has no axe violations on the focused input', async () => {
        const { fixture, element } = await renderAs(AxeHost, undefined, scheme);
        const autoFocus = await harnessOf(fixture);
        await expect.poll(() => autoFocus.isFocused()).toBe(true);
        // A render without Optimus's styles would pass axe for the wrong reason: fail loudly.
        expect(getComputedStyle(inputOf(element)).borderTopLeftRadius).toBe('8px');

        await expectNoAxeViolations(element.querySelector('wj-field') ?? element);
      });

      it('has no axe violations in the off state', async () => {
        const { element } = await renderAs(
          AxeHost,
          (host) => {
            host.on.set(false);
          },
          scheme,
        );
        expect(getComputedStyle(inputOf(element)).borderTopLeftRadius).toBe('8px');

        await expectNoAxeViolations(element.querySelector('wj-field') ?? element);
      });
    });
  });
});
