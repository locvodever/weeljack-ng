/// <reference types="@vitest/browser-playwright" />
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ApplicationRef, Component, ErrorHandler, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import type { MockInstance } from 'vitest';
import { cdp, userEvent } from 'vitest/browser';
import { provideWeeljack } from 'weeljack-ng';
import { WjAnimateOnScroll } from 'weeljack-ng/animateonscroll';
import { WjAnimateOnScrollHarness } from 'weeljack-ng/animateonscroll/testing';
import { expectNoAxeViolations } from '../spec-support/axe';

const PAYLOAD = '<img src=x onerror="window.wjInjected = true">';
const ROOT = document.documentElement;

/**
 * A consumer's template: a button, a gap that puts the target past the fold and the target
 * (every input bound). The classes carry no animation, so they stay.
 */
@Component({
  selector: 'wj-animateonscroll-host',
  imports: [WjAnimateOnScroll],
  template: `
    <button type="button" id="before">Before</button>
    <div class="gap"></div>
    <div
      id="target"
      class="box"
      wjAnimateOnScroll
      [enterClass]="enterClass()"
      [leaveClass]="leaveClass()"
      [rootMargin]="rootMargin()"
      [threshold]="threshold()"
      [once]="once()"
    >
      Target
    </div>
    <div class="tail"></div>
  `,
  styles: `
    .gap {
      height: 150vh;
    }

    .box {
      height: 100px;
    }

    .tail {
      height: 100vh;
    }
  `,
})
class Host {
  readonly enterClass = signal<string | undefined>('spec-in');
  readonly leaveClass = signal<string | undefined>('spec-out');
  readonly rootMargin = signal<string | undefined>(undefined);
  readonly threshold = signal<number | string | undefined>(undefined);
  readonly once = signal(false);
}

/** A target and, above it, a small sentinel whose reveal shows the observers have reported. */
@Component({
  selector: 'wj-animateonscroll-rows-host',
  imports: [WjAnimateOnScroll],
  template: `
    <div class="gap"></div>
    <div
      id="sentinel"
      class="sentinel"
      wjAnimateOnScroll
      enterClass="spec-in"
      leaveClass="spec-out"
      [threshold]="0.1"
    >
      Sentinel
    </div>
    <div
      id="target"
      class="box"
      wjAnimateOnScroll
      enterClass="spec-in"
      leaveClass="spec-out"
      [threshold]="threshold()"
      [once]="once()"
    >
      Target
    </div>
    <div class="tail"></div>
  `,
  styles: `
    .gap {
      height: 150vh;
    }

    .sentinel {
      height: 20px;
    }

    .box {
      height: 200px;
    }

    .tail {
      height: 100vh;
    }
  `,
})
class RowsHost {
  readonly threshold = signal<number | string | undefined>(undefined);
  readonly once = signal(false);
}

/**
 * A target inside a scroll container, which is its `root`, with a control after it that has no
 * `rootMargin`, and a sentinel outside the container, in the window's viewport.
 */
@Component({
  selector: 'wj-animateonscroll-root-host',
  imports: [WjAnimateOnScroll],
  template: `
    <div #scroller id="scroller" class="scroller">
      <div class="inner-gap"></div>
      <div
        id="target"
        class="item"
        wjAnimateOnScroll
        enterClass="spec-in"
        [root]="scroller"
        [rootMargin]="rootMargin()"
      >
        Target
      </div>
      <div id="control" class="item" wjAnimateOnScroll enterClass="spec-in" [root]="scroller">
        Control
      </div>
    </div>
    <div id="sentinel" class="item" wjAnimateOnScroll enterClass="spec-in">Sentinel</div>
  `,
  styles: `
    .scroller {
      height: 100px;
      overflow: auto;
    }

    .inner-gap {
      height: 150px;
    }

    .item {
      height: 40px;
    }
  `,
})
class RootHost {
  readonly rootMargin = signal<string | undefined>(undefined);
}

/** A target whose `rootMargin` is an HTML payload, so Optimus's observer cannot be built. */
@Component({
  selector: 'wj-animateonscroll-invalid-host',
  imports: [WjAnimateOnScroll],
  template: `<div wjAnimateOnScroll enterClass="spec-in" [rootMargin]="margin">Target</div>`,
})
class InvalidHost {
  protected readonly margin = PAYLOAD;
}

/** A link inside a held element, with a focusable button before it. */
@Component({
  selector: 'wj-animateonscroll-link-host',
  imports: [WjAnimateOnScroll],
  template: `
    <button type="button" id="before">Before</button>
    <div class="gap"></div>
    <div id="target" wjAnimateOnScroll enterClass="spec-in">
      <a id="link" href="#details">Details</a>
    </div>
    <div class="tail"></div>
  `,
  styles: `
    .gap {
      height: 150vh;
    }

    .tail {
      height: 100vh;
    }
  `,
})
class LinkHost {}

/** A target whose class runs a real CSS animation, to prove what reduced motion switches off. */
@Component({
  selector: 'wj-animateonscroll-motion-host',
  imports: [WjAnimateOnScroll],
  template: `
    <div class="gap"></div>
    <div id="target" class="box" wjAnimateOnScroll enterClass="spec-anim">Target</div>
    <div class="tail"></div>
  `,
  styles: `
    .gap {
      height: 150vh;
    }

    .box {
      height: 100px;
    }

    .tail {
      height: 100vh;
    }

    /* motion: a fixture that proves the root reduced-motion rule stops an app's animation. */
    .spec-anim {
      animation: spec-fade 700ms ease-out;
    }

    @keyframes spec-fade {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }
  `,
})
class MotionHost {}

/** Four cards: three in view at the top, the fourth held below the fold. */
@Component({
  selector: 'wj-animateonscroll-cards-host',
  imports: [WjAnimateOnScroll],
  template: `
    <div class="card" wjAnimateOnScroll enterClass="spec-in">
      <h3>One</h3>
      <p>First</p>
    </div>
    <div class="card" wjAnimateOnScroll enterClass="spec-in">
      <h3>Two</h3>
      <p>Second</p>
    </div>
    <div class="card" wjAnimateOnScroll enterClass="spec-in">
      <h3>Three</h3>
      <p>Third</p>
    </div>
    <div class="gap"></div>
    <div id="held" class="card" wjAnimateOnScroll enterClass="spec-in">
      <h3>Four</h3>
      <p>Fourth</p>
    </div>
  `,
  styles: `
    .card {
      padding: 8px;
      margin-bottom: 8px;
      border: 1px solid var(--wj-content-border-color);
      background: var(--wj-content-background);
      color: var(--wj-text-color);
    }

    .gap {
      height: 100vh;
    }
  `,
})
class CardsHost {}

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

function elementOf(element: HTMLElement, id: string): HTMLElement {
  const found = element.querySelector<HTMLElement>(`#${id}`);
  if (!found) {
    throw new Error(`#${id} is missing`);
  }
  return found;
}

function harnessOf(
  fixture: ComponentFixture<unknown>,
  id: string,
): Promise<WjAnimateOnScrollHarness> {
  return TestbedHarnessEnvironment.loader(fixture).getHarness(
    WjAnimateOnScrollHarness.with({ selector: `#${id}` }),
  );
}

/**
 * Scrolls the window so that `fraction` of `target`'s height shows above the fold. A target that
 * comes up from below sits clear of the top edge, which Optimus needs (`top > 0`) to re-enter it:
 * `scrollIntoView()` would pin it to the top edge.
 */
function scrollFromBelow(target: HTMLElement, fraction: number): void {
  const rect = target.getBoundingClientRect();
  window.scrollTo(0, window.scrollY + rect.top - (window.innerHeight - fraction * rect.height));
}

/** Emulates the user's reduced-motion preference, or clears it. */
async function emulateReducedMotion(reduce: boolean): Promise<void> {
  await cdp().send('Emulation.setEmulatedMedia', {
    features: [{ name: 'prefers-reduced-motion', value: reduce ? 'reduce' : 'no-preference' }],
  });
}

describe('WjAnimateOnScroll', () => {
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
    window.scrollTo(0, 0);
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

  describe('held state', () => {
    it('holds a target below the fold at opacity 0 until it enters, and keeps its place', async () => {
      const { fixture, element } = await renderAs(Host);
      const target = elementOf(element, 'target');
      const harness = await harnessOf(fixture, 'target');
      const heldBox = target.getBoundingClientRect();

      expect(await harness.isHidden()).toBe(true);
      expect(await harness.hasClass('spec-in')).toBe(false);

      scrollFromBelow(target, 1);
      await expect.poll(() => harness.isHidden()).toBe(false);

      expect(await harness.hasClass('spec-in')).toBe(true);
      expect(target.style.opacity).toBe('');
      expect(heldBox.height).toBe(target.getBoundingClientRect().height);
    });

    it('adds the host class and no role, name or Tab stop of its own', async () => {
      const { element } = await renderAs(Host);
      const target = elementOf(element, 'target');

      expect(target.classList.contains('p-animateonscroll')).toBe(true);
      for (const attribute of ['role', 'tabindex', 'aria-label', 'aria-hidden']) {
        expect(target.hasAttribute(attribute)).toBe(false);
      }
    });

    it('holds nothing without an enterClass', async () => {
      const { fixture } = await renderAs(Host, (host) => {
        host.enterClass.set(undefined);
      });

      expect(await (await harnessOf(fixture, 'target')).isHidden()).toBe(false);
    });
  });

  describe('enterClass and leaveClass', () => {
    it('applies the enter class on the way in and the leave class on the way back up', async () => {
      const { fixture, element } = await renderAs(Host);
      const target = elementOf(element, 'target');
      const harness = await harnessOf(fixture, 'target');

      scrollFromBelow(target, 1);
      await expect.poll(() => harness.hasClass('spec-in')).toBe(true);
      expect(await harness.hasClass('spec-out')).toBe(false);

      window.scrollTo(0, 0);
      await expect.poll(() => harness.hasClass('spec-out')).toBe(true);
      expect(await harness.hasClass('spec-in')).toBe(false);
      expect(await harness.isHidden()).toBe(true);

      scrollFromBelow(target, 1);
      await expect.poll(() => harness.hasClass('spec-in')).toBe(true);
      expect(await harness.hasClass('spec-out')).toBe(false);
      expect(await harness.isHidden()).toBe(false);
    });

    it('lands an HTML payload as class tokens and creates nothing', async () => {
      const { fixture, element } = await renderAs(Host, (host) => {
        host.enterClass.set(PAYLOAD);
        host.leaveClass.set(PAYLOAD);
      });
      const target = elementOf(element, 'target');
      const harness = await harnessOf(fixture, 'target');

      scrollFromBelow(target, 1);
      await expect.poll(() => harness.isHidden()).toBe(false);

      expect(Array.from(target.classList)).toContain('src=x');
      expect(element.querySelector('img')).toBeNull();
      expect(target.textContent.trim()).toBe('Target');
      expect('wjInjected' in window).toBe(false);

      window.scrollTo(0, 0);
      await expect.poll(() => harness.isHidden()).toBe(true);
      expect(element.querySelector('img')).toBeNull();
      expect('wjInjected' in window).toBe(false);
    });
  });

  describe('root', () => {
    it('observes against a scroll container, not the window', async () => {
      const { fixture, element } = await renderAs(RootHost);
      const target = await harnessOf(fixture, 'target');
      const sentinel = await harnessOf(fixture, 'sentinel');

      // The target sits inside the window's viewport but is clipped by its root.
      await expect.poll(() => sentinel.isHidden()).toBe(false);
      expect(await target.isHidden()).toBe(true);

      elementOf(element, 'scroller').scrollTop = 150;
      await expect.poll(() => target.isHidden()).toBe(false);
      expect(await target.hasClass('spec-in')).toBe(true);
    });
  });

  describe('rootMargin', () => {
    it('widens the root, so a target just past its edge enters without scrolling', async () => {
      const { fixture } = await renderAs(RootHost, (host) => {
        host.rootMargin.set('0px 0px 100px 0px');
      });
      const sentinel = await harnessOf(fixture, 'sentinel');

      await expect.poll(() => sentinel.isHidden()).toBe(false);
      await expect.poll(async () => (await harnessOf(fixture, 'target')).isHidden()).toBe(false);
      // The control has the same root and place but no margin.
      expect(await (await harnessOf(fixture, 'control')).isHidden()).toBe(true);
    });

    it('lets an invalid value’s (here an HTML payload) SyntaxError reach the ErrorHandler unchanged', async () => {
      let native: unknown;
      try {
        new IntersectionObserver(() => undefined, { rootMargin: PAYLOAD });
      } catch (error) {
        native = error;
      }
      expect(native).toBeInstanceOf(DOMException);

      const handleError = vi.fn<(error: unknown) => void>();
      TestBed.configureTestingModule({
        rethrowApplicationErrors: false,
        providers: [provideWeeljack(), { provide: ErrorHandler, useValue: { handleError } }],
      });
      // Bootstrapped, so the first tick runs the way an app's does: through its ErrorHandler.
      const hostElement = document.body.appendChild(document.createElement('div'));
      const ref = TestBed.inject(ApplicationRef).bootstrap(InvalidHost, hostElement);
      try {
        await expect.poll(() => handleError.mock.calls.length).toBeGreaterThan(0);
        const [error] = handleError.mock.calls[0] ?? [];
        expect(error).toBeInstanceOf(DOMException);
        expect((error as DOMException).name).toBe('SyntaxError');
        expect((error as DOMException).message).toBe((native as DOMException).message);
        expect(hostElement.querySelector('img')).toBeNull();
        expect('wjInjected' in window).toBe(false);
      } finally {
        ref.destroy();
        hostElement.remove();
      }
    });
  });

  describe('threshold', () => {
    it('reveals at half the height by default', async () => {
      const { fixture, element } = await renderAs(RowsHost);
      const target = elementOf(element, 'target');
      const sentinel = await harnessOf(fixture, 'sentinel');
      const harness = await harnessOf(fixture, 'target');

      scrollFromBelow(target, 0.4);
      await expect.poll(() => sentinel.isHidden()).toBe(false);
      expect(await harness.isHidden()).toBe(true);

      scrollFromBelow(target, 0.6);
      await expect.poll(() => harness.isHidden()).toBe(false);
    });

    it('behaves as 0.5 when it is 0', async () => {
      const { fixture, element } = await renderAs(RowsHost, (host) => {
        host.threshold.set(0);
      });
      const target = elementOf(element, 'target');
      const sentinel = await harnessOf(fixture, 'sentinel');
      const harness = await harnessOf(fixture, 'target');

      scrollFromBelow(target, 0.4);
      await expect.poll(() => sentinel.isHidden()).toBe(false);
      expect(await harness.isHidden()).toBe(true);

      scrollFromBelow(target, 0.6);
      await expect.poll(() => harness.isHidden()).toBe(false);
    });

    it('is read as a number from an attribute string, and waits for it', async () => {
      const { fixture, element } = await renderAs(RowsHost, (host) => {
        host.threshold.set('0.9');
      });
      const target = elementOf(element, 'target');
      const sentinel = await harnessOf(fixture, 'sentinel');
      const harness = await harnessOf(fixture, 'target');

      scrollFromBelow(target, 0.6);
      await expect.poll(() => sentinel.isHidden()).toBe(false);
      expect(await harness.isHidden()).toBe(true);

      scrollFromBelow(target, 1);
      await expect.poll(() => harness.isHidden()).toBe(false);
    });
  });

  describe('once', () => {
    it('stops observing after the first enter, so the target stays revealed', async () => {
      const { fixture, element } = await renderAs(RowsHost, (host) => {
        host.once.set(true);
      });
      const target = elementOf(element, 'target');
      const sentinel = await harnessOf(fixture, 'sentinel');
      const harness = await harnessOf(fixture, 'target');

      scrollFromBelow(target, 1);
      await expect.poll(() => harness.hasClass('spec-in')).toBe(true);
      await expect.poll(() => sentinel.hasClass('spec-in')).toBe(true);

      window.scrollTo(0, 0);
      // The sentinel observes on, so its leave shows the observers have reported again.
      await expect.poll(() => sentinel.hasClass('spec-out')).toBe(true);
      expect(await harness.hasClass('spec-out')).toBe(false);
      expect(await harness.hasClass('spec-in')).toBe(true);
      expect(await harness.isHidden()).toBe(false);
    });

    it('keeps observing without it', async () => {
      const { fixture, element } = await renderAs(RowsHost);
      const target = elementOf(element, 'target');
      const harness = await harnessOf(fixture, 'target');

      scrollFromBelow(target, 1);
      await expect.poll(() => harness.hasClass('spec-in')).toBe(true);

      window.scrollTo(0, 0);
      await expect.poll(() => harness.hasClass('spec-out')).toBe(true);
      expect(await harness.isHidden()).toBe(true);
    });
  });

  describe('reduced motion', () => {
    it('holds nothing and runs no animation, before or after it scrolls into view', async () => {
      await emulateReducedMotion(true);
      const { fixture, element } = await renderAs(MotionHost);
      const target = elementOf(element, 'target');
      const harness = await harnessOf(fixture, 'target');

      await expect.poll(() => harness.isHidden()).toBe(false);
      expect(getComputedStyle(target).opacity).toBe('1');
      expect(getComputedStyle(target).animationName).toBe('none');

      scrollFromBelow(target, 1);
      // The app's class still lands, so its end-state styles apply.
      await expect.poll(() => harness.hasClass('spec-anim')).toBe(true);
      expect(getComputedStyle(target).opacity).toBe('1');
      expect(getComputedStyle(target).animationName).toBe('none');
      expect(getComputedStyle(target).transitionDuration).toBe('0s');
    });

    it('runs the app’s animation without the preference', async () => {
      await emulateReducedMotion(false);
      const { fixture, element } = await renderAs(MotionHost);
      const target = elementOf(element, 'target');
      const harness = await harnessOf(fixture, 'target');
      expect(await harness.isHidden()).toBe(true);

      scrollFromBelow(target, 1);
      await expect.poll(() => harness.hasClass('spec-anim')).toBe(true);

      expect(getComputedStyle(target).animationName).not.toBe('none');
    });
  });

  describe('keyboard', () => {
    it('reveals a held element when Tab reaches a link inside it', async () => {
      const { fixture, element } = await renderAs(LinkHost);
      const harness = await harnessOf(fixture, 'target');
      const link = elementOf(element, 'link');
      expect(await harness.isHidden()).toBe(true);

      await userEvent.tab();
      expect(document.activeElement).toBe(elementOf(element, 'before'));
      await userEvent.tab();

      await expect.poll(() => document.activeElement).toBe(link);
      await expect.poll(() => harness.isHidden()).toBe(false);
      expect(document.activeElement).toBe(link);
      expect(await harness.hasClass('spec-in')).toBe(true);
    });
  });

  describe('setup checks', () => {
    it('warns WJ0001 when provideWeeljack is missing', async () => {
      const fixture = TestBed.createComponent(Host);
      await fixture.whenStable();

      expect(warn).toHaveBeenCalledWith(
        'WJ0001: [wjAnimateOnScroll]: provideWeeljack() is missing from the application providers. ' +
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
      it('has no axe violations with three revealed cards and one held', async () => {
        const { fixture, element } = await renderAs(CardsHost, undefined, scheme);
        const revealed = TestbedHarnessEnvironment.loader(fixture);
        const cards = await revealed.getAllHarnesses(WjAnimateOnScrollHarness);
        expect(cards.length).toBe(4);
        await expect.poll(() => cards[0]?.isHidden()).toBe(false);
        await expect.poll(() => cards[2]?.isHidden()).toBe(false);
        expect(await (await harnessOf(fixture, 'held')).isHidden()).toBe(true);

        await expectNoAxeViolations(element);
      });
    });
  });
});
