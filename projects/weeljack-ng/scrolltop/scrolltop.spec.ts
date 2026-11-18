import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Component, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import type { MockInstance } from 'vitest';
import { userEvent } from 'vitest/browser';
import { provideWeeljack, type WjTranslation } from 'weeljack-ng';
import { WjScrollTop, type WjScrollTopBehavior, type WjScrollTopPt } from 'weeljack-ng/scrolltop';
import { WjScrollTopHarness } from 'weeljack-ng/scrolltop/testing';
import { expectNoAxeViolations } from '../spec-support/axe';

const PAYLOAD = '<img src=x onerror="window.wjInjected = true">';
const ROOT = document.documentElement;

/** A consumer's template: a link, one scroll-top, and a page tall enough to scroll. */
@Component({
  selector: 'wj-scrolltop-host',
  imports: [WjScrollTop],
  template: `
    <!-- Fixed, so focusing it never scrolls the page back up and hides the button. -->
    <a id="link" href="https://example.com/" style="position: fixed; inset: 0 auto auto 0">Link</a>
    <wj-scrolltop
      [threshold]="threshold()"
      [behavior]="behavior()"
      [ariaLabel]="ariaLabel()"
      [ariaLabelledBy]="ariaLabelledBy()"
      [ariaDescribedBy]="ariaDescribedBy()"
      [pt]="pt()"
    />
    <p id="name">A name</p>
    <p id="description">A description</p>
    <div style="block-size: 4000px"></div>
  `,
})
class Host {
  readonly threshold = signal<number | string>(400);
  readonly behavior = signal<WjScrollTopBehavior>('smooth');
  readonly ariaLabel = signal<string | undefined>(undefined);
  readonly ariaLabelledBy = signal<string | undefined>(undefined);
  readonly ariaDescribedBy = signal<string | undefined>(undefined);
  readonly pt = signal<WjScrollTopPt>(undefined);
}

/** A consumer who writes aria-* on the host. */
@Component({
  selector: 'wj-scrolltop-aria-on-host-host',
  imports: [WjScrollTop],
  template: `<wj-scrolltop aria-label="Top" />`,
})
class AriaOnHostHost {}

type Scheme = 'light' | 'dark';

interface Rendered {
  fixture: ComponentFixture<Host>;
  component: Host;
  element: HTMLElement;
  scrolltop: WjScrollTopHarness;
}

/** Renders `Host` with `provideWeeljack` in the given scheme, after `setup` ran. */
async function render(
  setup: (host: Host) => void = () => undefined,
  scheme: Scheme = 'light',
  translation?: WjTranslation,
): Promise<Rendered> {
  ROOT.classList.toggle('wj-dark', scheme === 'dark');
  document.body.style.backgroundColor = 'var(--wj-content-background)';
  TestBed.configureTestingModule({
    providers: [
      provideWeeljack(translation ? { darkMode: 'class', translation } : { darkMode: 'class' }),
    ],
  });
  const fixture = TestBed.createComponent(Host);
  setup(fixture.componentInstance);
  await fixture.whenStable();
  return {
    fixture,
    component: fixture.componentInstance,
    element: fixture.nativeElement as HTMLElement,
    scrolltop: await TestbedHarnessEnvironment.loader(fixture).getHarness(WjScrollTopHarness),
  };
}

/** Scrolls the window at once, so the position never depends on a glide. */
function scrollTo(top: number): void {
  window.scrollTo({ top, behavior: 'instant' });
}

const button = (): HTMLButtonElement | null =>
  document.querySelector<HTMLButtonElement>('wj-scrolltop button');

function theButton(): HTMLButtonElement {
  const found = button();
  if (!found) {
    throw new Error('the scroll-top button is not shown');
  }
  return found;
}

function link(): HTMLElement {
  const found = document.getElementById('link');
  if (!found) {
    throw new Error('#link is missing');
  }
  return found;
}

/** Scrolls past the default threshold and waits for the button. */
async function showButton({ scrolltop }: Rendered, top = 600): Promise<HTMLButtonElement> {
  scrollTo(top);
  await expect.poll(() => scrolltop.isShown()).toBe(true);
  return theButton();
}

const realMatchMedia = window.matchMedia.bind(window);

interface Preference {
  /** Sets the preference and tells the listeners the wrapper added. */
  set(reduce: boolean): void;
  /** How many `change` listeners are on the query now. */
  listeners(): number;
}

/**
 * Sets the reader's reduced-motion preference for this window only: Optimus's motion runner and
 * the wrapper both read `window.matchMedia`. A CDP emulation would change the whole shared browser
 * page, and with it every spec file running beside this one.
 */
function reduceMotion(initial: boolean): Preference {
  let reduce = initial;
  const registered = new Set<EventListener>();
  vi.spyOn(window, 'matchMedia').mockImplementation((query) => {
    const list = realMatchMedia(query);
    if (!query.includes('prefers-reduced-motion')) {
      return list;
    }
    return new Proxy(list, {
      get(target, key): unknown {
        if (key === 'matches') {
          return reduce;
        }
        if (key === 'addEventListener') {
          return (type: string, listener: EventListener): void => {
            if (type === 'change') {
              registered.add(listener);
            }
          };
        }
        if (key === 'removeEventListener') {
          return (type: string, listener: EventListener): void => {
            if (type === 'change') {
              registered.delete(listener);
            }
          };
        }
        return Reflect.get(target, key);
      },
    });
  });
  return {
    set(next) {
      reduce = next;
      for (const listener of registered) {
        listener(new Event('change'));
      }
    },
    listeners: () => registered.size,
  };
}

/** Records every class Optimus's motion puts on the button's host from now on. */
function recordMotion(): () => string[] {
  const seen = new Set<string>();
  const read = (): void => {
    document.querySelectorAll('wj-scrolltop *').forEach((element) => {
      element.classList.forEach((name) => {
        if (/^p-scrolltop-(enter|leave)/.test(name)) {
          seen.add(name);
        }
      });
    });
  };
  const observer = new MutationObserver(read);
  observer.observe(document.body, { attributes: true, subtree: true, childList: true });
  return () => {
    read();
    observer.disconnect();
    return [...seen];
  };
}

describe('WjScrollTop', () => {
  let warn: MockInstance<typeof console.warn>;

  beforeEach(() => {
    warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    // The button hides at once under reduced motion, so a spec never waits on the motion to end.
    // The motion specs turn the preference off themselves.
    reduceMotion(true);
  });

  afterEach(() => {
    scrollTo(0);
    ROOT.classList.remove('wj-dark');
    document.body.style.backgroundColor = '';
    document.head.querySelectorAll('style[data-optimus-style-id]').forEach((style) => {
      style.remove();
    });
    Reflect.deleteProperty(window, 'wjInjected');
  });

  describe('inputs', () => {
    it('is absent at the top of the page and shows once past the default threshold of 400', async () => {
      const { scrolltop } = await render();
      expect(await scrolltop.isShown()).toBe(false);

      scrollTo(300);
      scrollTo(600);
      await expect.poll(() => scrolltop.isShown()).toBe(true);

      scrollTo(0);
      await expect.poll(() => scrolltop.isShown()).toBe(false);
    });

    it('does not show at exactly the threshold, only past it', async () => {
      const { scrolltop } = await render((host) => {
        host.threshold.set(300);
      });

      scrollTo(300);
      // A scroll to a position past it, then back, proves the listener ran before the assertion.
      scrollTo(301);
      await expect.poll(() => scrolltop.isShown()).toBe(true);
      scrollTo(300);
      await expect.poll(() => scrolltop.isShown()).toBe(false);
    });

    it('reads threshold as a number attribute', async () => {
      const { scrolltop } = await render((host) => {
        host.threshold.set('200');
      });

      scrollTo(250);
      await expect.poll(() => scrolltop.isShown()).toBe(true);
    });

    it('glides by default and jumps with behavior="auto"', async () => {
      reduceMotion(false);
      const scroll = vi.spyOn(window, 'scroll').mockImplementation(() => undefined);
      const rendered = await render();
      await showButton(rendered);

      await rendered.scrolltop.activate();
      expect(scroll).toHaveBeenLastCalledWith({ top: 0, behavior: 'smooth' });

      rendered.component.behavior.set('auto');
      await rendered.fixture.whenStable();
      await rendered.scrolltop.activate();
      expect(scroll).toHaveBeenLastCalledWith({ top: 0, behavior: 'auto' });
    });

    it('names the button from ariaLabel', async () => {
      const rendered = await render((host) => {
        host.ariaLabel.set('Back to top of results');
      });
      await showButton(rendered);

      expect(await rendered.scrolltop.getLabel()).toBe('Back to top of results');
      expect(theButton().getAttribute('aria-label')).toBe('Back to top of results');
    });

    it('routes ariaLabelledBy and ariaDescribedBy to the button, not the host', async () => {
      const rendered = await render((host) => {
        host.ariaLabelledBy.set('name');
        host.ariaDescribedBy.set('description');
      });
      const target = await showButton(rendered);

      expect(target.getAttribute('aria-labelledby')).toBe('name');
      expect(target.getAttribute('aria-describedby')).toBe('description');
      const host = rendered.element.querySelector('wj-scrolltop');
      expect(host?.hasAttribute('aria-labelledby')).toBe(false);
      expect(host?.hasAttribute('aria-describedby')).toBe(false);
    });
  });

  describe('the name (FR-32)', () => {
    it('is "Scroll Top" under provideWeeljack()', async () => {
      const rendered = await render();
      const target = await showButton(rendered);

      expect(await rendered.scrolltop.getLabel()).toBe('Scroll Top');
      // Named on the real button, never on the p-button host (a generic element).
      expect(target.getAttribute('aria-label')).toBe('Scroll Top');
      expect(target.parentElement?.hasAttribute('aria-label')).toBe(false);
    });

    it('follows the translation', async () => {
      const rendered = await render(undefined, 'light', {
        aria: { scrollTop: 'Cuộn lên đầu' },
      });
      await showButton(rendered);

      expect(await rendered.scrolltop.getLabel()).toBe('Cuộn lên đầu');
    });

    it('puts no autofocus on the button, and keeps focus on the link as it appears', async () => {
      const rendered = await render();
      link().focus();
      expect(document.activeElement).toBe(link());

      const target = await showButton(rendered);

      expect(target.hasAttribute('autofocus')).toBe(false);
      expect(document.activeElement).toBe(link());
    });

    it('is at least 24 x 24 px, and 44 x 44 in the default look', async () => {
      const rendered = await render();
      const box = (await showButton(rendered)).getBoundingClientRect();

      expect(box.width).toBeGreaterThanOrEqual(24);
      expect(box.height).toBeGreaterThanOrEqual(24);
      expect(box.width).toBe(44);
      expect(box.height).toBe(44);
    });

    it('is fixed 20px from the window corner and takes no room in the flow', async () => {
      const rendered = await render();
      const box = (await showButton(rendered)).getBoundingClientRect();

      expect(window.innerHeight - box.bottom).toBe(20);
      expect(document.documentElement.clientWidth - box.right).toBe(20);
      expect(getComputedStyle(theButton()).position).toBe('fixed');
      const host = rendered.element.querySelector('wj-scrolltop');
      expect(host?.getBoundingClientRect().height).toBe(0);
    });
  });

  describe('motion (FR-30, FR-31)', () => {
    it('runs Optimus motion without the preference, with p-scrolltop enter and leave classes', async () => {
      reduceMotion(false);
      const rendered = await render();
      const stop = recordMotion();

      await showButton(rendered);
      scrollTo(0);
      await expect.poll(() => rendered.scrolltop.isShown(), { timeout: 5000 }).toBe(false);

      const names = stop().join(' ');
      expect(names).toMatch(/p-scrolltop-enter-/);
      expect(names).toMatch(/p-scrolltop-leave-/);
    });

    it('runs none of it under reduced motion: no enter or leave class, and it comes and goes at once', async () => {
      reduceMotion(true);
      const rendered = await render();
      const stop = recordMotion();

      await showButton(rendered);
      scrollTo(0);
      await expect.poll(() => rendered.scrolltop.isShown()).toBe(false);

      expect(stop()).toEqual([]);
    });

    it('keeps safe motion when the consumer pt.motion tries to switch it off', async () => {
      reduceMotion(true);
      const rendered = await render((host) => {
        host.pt.set({ motion: { safe: false } });
      });
      const stop = recordMotion();

      await showButton(rendered);
      scrollTo(0);
      await expect.poll(() => rendered.scrolltop.isShown()).toBe(false);

      expect(stop()).toEqual([]);
    });

    it('scrolls to { top: 0, behavior: "auto" } under reduced motion, whatever behavior says', async () => {
      reduceMotion(true);
      const scroll = vi.spyOn(window, 'scroll').mockImplementation(() => undefined);
      const rendered = await render();
      await showButton(rendered);

      await rendered.scrolltop.activate();

      expect(scroll).toHaveBeenCalledWith({ top: 0, behavior: 'auto' });
    });

    it('follows the preference as it changes, and stops listening on destroy', async () => {
      const preference = reduceMotion(false);
      const scroll = vi.spyOn(window, 'scroll').mockImplementation(() => undefined);
      const rendered = await render();
      await showButton(rendered);
      expect(preference.listeners()).toBe(1);

      preference.set(true);
      await rendered.fixture.whenStable();
      await rendered.scrolltop.activate();
      expect(scroll).toHaveBeenLastCalledWith({ top: 0, behavior: 'auto' });

      preference.set(false);
      await rendered.fixture.whenStable();
      await rendered.scrolltop.activate();
      expect(scroll).toHaveBeenLastCalledWith({ top: 0, behavior: 'smooth' });

      rendered.fixture.destroy();
      expect(preference.listeners()).toBe(0);
    });
  });

  describe('pt (the pcButton.root trap)', () => {
    it('reaches the button as an object, and keeps the routed ARIA attributes', async () => {
      const rendered = await render((host) => {
        host.ariaLabelledBy.set('name');
        host.pt.set({ pcButton: { root: { 'data-spec': 'object' } } });
      });
      const target = await showButton(rendered);

      expect(target.getAttribute('data-spec')).toBe('object');
      expect(target.getAttribute('aria-labelledby')).toBe('name');
    });

    it('reaches the button as a function', async () => {
      const rendered = await render((host) => {
        host.ariaDescribedBy.set('description');
        host.pt.set(() => ({ pcButton: { root: { 'data-spec': 'function' } } }));
      });
      const target = await showButton(rendered);

      expect(target.getAttribute('data-spec')).toBe('function');
      expect(target.getAttribute('aria-describedby')).toBe('description');
    });

    it('lands the pt and the routed attributes again after the button hides and shows', async () => {
      const rendered = await render((host) => {
        host.ariaLabelledBy.set('name');
        host.ariaDescribedBy.set('description');
        host.pt.set({ pcButton: { root: { 'data-spec': 'again' } } });
      });
      await showButton(rendered);

      scrollTo(0);
      await expect.poll(() => rendered.scrolltop.isShown()).toBe(false);
      const target = await showButton(rendered);

      expect(target.getAttribute('data-spec')).toBe('again');
      expect(target.getAttribute('aria-labelledby')).toBe('name');
      expect(target.getAttribute('aria-describedby')).toBe('description');
    });

    it('follows a changed pt and ARIA input while the button is shown', async () => {
      const rendered = await render((host) => {
        host.pt.set({ pcButton: { root: { 'data-spec': 'one' } } });
      });
      const target = await showButton(rendered);
      expect(target.getAttribute('data-spec')).toBe('one');

      rendered.component.pt.set({ pcButton: { root: { 'data-spec': 'two' } } });
      rendered.component.ariaLabelledBy.set('name');
      await rendered.fixture.whenStable();

      await expect.poll(() => theButton().getAttribute('data-spec')).toBe('two');
      await expect.poll(() => theButton().getAttribute('aria-labelledby')).toBe('name');
    });

    it('lets a consumer pt keep a routed attribute the wrapper clears', async () => {
      const rendered = await render((host) => {
        host.pt.set({ pcButton: { root: { 'aria-describedby': 'description' } } });
      });
      const target = await showButton(rendered);

      expect(target.getAttribute('aria-describedby')).toBe('description');
    });

    it('reaches the host and root parts on the Optimus element', async () => {
      const rendered = await render((host) => {
        host.pt.set({ host: { 'data-spec-host': 'h' }, root: { 'data-spec-root': 'r' } });
      });
      await showButton(rendered);

      const optimus = rendered.element.querySelector('p-scrolltop, p-scrollTop');
      expect(optimus?.getAttribute('data-spec-host')).toBe('h');
      expect(optimus?.getAttribute('data-spec-root')).toBe('r');
    });
  });

  describe('rendering safety (FR-34)', () => {
    it('lands an HTML payload in the three ARIA inputs as attribute values, never as markup', async () => {
      const rendered = await render((host) => {
        host.ariaLabel.set(PAYLOAD);
        host.ariaLabelledBy.set(PAYLOAD);
        host.ariaDescribedBy.set(PAYLOAD);
      });
      const target = await showButton(rendered);

      expect(target.getAttribute('aria-label')).toBe(PAYLOAD);
      expect(target.getAttribute('aria-labelledby')).toBe(PAYLOAD);
      expect(target.getAttribute('aria-describedby')).toBe(PAYLOAD);
      expect(rendered.element.querySelector('img')).toBeNull();
      expect('wjInjected' in window).toBe(false);
    });
  });

  describe('accessibility', () => {
    describe.each<Scheme>(['light', 'dark'])('%s', (scheme) => {
      beforeEach(() => {
        // Optimus injects its styles after the first render, and every colour then transitions for
        // 0.2s from the browser default. Measure the end state, not the animation. The button comes
        // and goes at once under the reduced motion these specs emulate.
        const noMotion = document.createElement('style');
        noMotion.id = 'wj-spec-no-motion';
        noMotion.textContent = '*, *::before, *::after { transition: none !important; }';
        document.head.append(noMotion);
      });

      afterEach(() => {
        document.getElementById('wj-spec-no-motion')?.remove();
      });

      it('has no axe violations before the threshold', async () => {
        const { element } = await render(undefined, scheme);

        await expectNoAxeViolations(element.querySelector('wj-scrolltop') ?? element);
      });

      it('has no axe violations while shown', async () => {
        const rendered = await render(undefined, scheme);
        const target = await showButton(rendered);
        // A render without Optimus's styles would pass axe for the wrong reason: fail loudly.
        expect(getComputedStyle(target).width).toBe('44px');

        await expectNoAxeViolations(rendered.element.querySelector('wj-scrolltop') ?? document);
      });

      it('has no axe violations shown with an own label and both ARIA references', async () => {
        const rendered = await render((host) => {
          host.ariaLabel.set('Back to top of results');
          host.ariaDescribedBy.set('description');
        }, scheme);
        await showButton(rendered);

        await expectNoAxeViolations(rendered.element.querySelector('wj-scrolltop') ?? document);
      });
    });
  });

  describe('keyboard', () => {
    it('Tab reaches the button once it shows, and Shift+Tab goes back to the link', async () => {
      const rendered = await render();
      const target = await showButton(rendered);
      link().focus();

      await userEvent.tab();
      await expect.poll(() => document.activeElement).toBe(target);

      await userEvent.tab({ shift: true });
      await expect.poll(() => document.activeElement).toBe(link());
    });

    it('Enter scrolls to the top', async () => {
      const rendered = await render();
      const target = await showButton(rendered);
      link().focus();
      await userEvent.tab();
      await expect.poll(() => document.activeElement).toBe(target);

      await userEvent.keyboard('{Enter}');

      await expect.poll(() => window.scrollY).toBe(0);
      await expect.poll(() => rendered.scrolltop.isShown()).toBe(false);
    });

    it('Space scrolls to the top', async () => {
      const rendered = await render();
      const target = await showButton(rendered);
      link().focus();
      await userEvent.tab();
      await expect.poll(() => document.activeElement).toBe(target);

      await userEvent.keyboard(' ');

      await expect.poll(() => window.scrollY).toBe(0);
      await expect.poll(() => rendered.scrolltop.isShown()).toBe(false);
    });

    it('leaves focus where it was while the button comes and goes', async () => {
      const rendered = await render();
      link().focus();

      await showButton(rendered);
      expect(document.activeElement).toBe(link());

      scrollTo(0);
      await expect.poll(() => rendered.scrolltop.isShown()).toBe(false);
      expect(document.activeElement).toBe(link());
    });
  });

  describe('dev warnings', () => {
    it('warns WJ0003 once when aria-* is written on the host', async () => {
      TestBed.configureTestingModule({ providers: [provideWeeljack()] });
      const fixture = TestBed.createComponent(AriaOnHostHost);
      await fixture.whenStable();

      expect(warn).toHaveBeenCalledTimes(1);
      expect(warn).toHaveBeenCalledWith(
        'WJ0003: wj-scrolltop: aria-label is set on the host, where it is not forwarded to the ' +
          'focusable element. Use the ariaLabel, ariaLabelledBy or ariaDescribedBy input instead. ' +
          'Find more at https://locvodever.github.io/weeljack-ng/errors/WJ0003',
      );
    });

    it('stays silent with provideWeeljack and no aria-* on the host', async () => {
      const rendered = await render();
      await showButton(rendered);

      expect(warn).not.toHaveBeenCalled();
    });
  });
});
