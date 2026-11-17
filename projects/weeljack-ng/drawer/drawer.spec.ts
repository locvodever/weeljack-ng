/// <reference types="@vitest/browser-playwright" />
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Component, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import type { MockInstance } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { provideWeeljack } from 'weeljack-ng';
import { WjButton } from 'weeljack-ng/button';
import { WjButtonHarness } from 'weeljack-ng/button/testing';
import {
  WjDrawer,
  WjDrawerFooterSlot,
  type WjDrawerPosition,
  type WjDrawerPt,
} from 'weeljack-ng/drawer';
import { WjDrawerHarness } from 'weeljack-ng/drawer/testing';
import { WjSelect } from 'weeljack-ng/select';
import { WjSelectHarness } from 'weeljack-ng/select/testing';
import { expectNoAxeViolations } from '../spec-support/axe';

const PAYLOAD = '<img src=x onerror="window.wjInjected = true">';
const ROOT = document.documentElement;

/** A consumer's template: an opener, then one drawer with a body and, optionally, a footer. */
@Component({
  selector: 'wj-drawer-host',
  imports: [WjButton, WjDrawer, WjDrawerFooterSlot, WjSelect],
  template: `
    @if (withOpener()) {
      <wj-button id="opener" label="Open" (click)="visible.set(true)" />
    }
    <wj-drawer
      [(visible)]="visible"
      [header]="header()"
      [position]="position()"
      [closable]="closable()"
      [ariaDescribedBy]="describedBy()"
      [pt]="pt()"
      (opened)="opens.update(countUp)"
      (closed)="closes.update(countUp)"
    >
      <p id="body-text">{{ text() }}</p>
      @if (withInput()) {
        <input id="body-input" aria-label="Name" (keydown.escape)="escapes.update(countUp)" />
      }
      @if (withSelect()) {
        <wj-select ariaLabel="Fruit" [options]="fruit" />
      }
      @if (withFooter()) {
        <ng-template wjDrawerFooter>
          <wj-button label="Cancel" severity="secondary" variant="outlined" />
          <wj-button label="Apply" />
        </ng-template>
      }
    </wj-drawer>
  `,
})
class Host {
  readonly visible = signal(false);
  readonly header = signal('Filters');
  readonly position = signal<WjDrawerPosition>('left');
  readonly closable = signal(true);
  readonly describedBy = signal<string | undefined>('body-text');
  readonly pt = signal<WjDrawerPt>(undefined);
  readonly text = signal('Narrow the list down.');
  readonly withOpener = signal(true);
  readonly withInput = signal(false);
  readonly withSelect = signal(false);
  readonly withFooter = signal(true);
  readonly opens = signal(0);
  readonly closes = signal(0);
  readonly escapes = signal(0);
  readonly fruit = [
    { label: 'Apple', value: 'apple' },
    { label: 'Banana', value: 'banana' },
  ];
  readonly countUp = (count: number): number => count + 1;
}

/** A consumer who writes aria-* on the host. */
@Component({
  selector: 'wj-drawer-aria-on-host-host',
  imports: [WjDrawer],
  template: `<wj-drawer aria-label="Filters" header="Filters" />`,
})
class AriaOnHostHost {}

/** A drawer rendered without `provideWeeljack`. */
@Component({
  selector: 'wj-drawer-routed-host',
  imports: [WjDrawer],
  template: `<wj-drawer header="Filters" />`,
})
class RoutedHost {}

type Scheme = 'light' | 'dark';

interface Rendered {
  fixture: ComponentFixture<Host>;
  component: Host;
  element: HTMLElement;
}

/** The fixture currently on screen, so `afterEach` can close an overlay a spec left open. */
let current: Rendered | undefined;

const realMatchMedia = window.matchMedia.bind(window);

/**
 * Sets the reader's reduced-motion preference for this window only: Optimus's motion runner reads
 * `window.matchMedia`. A CDP emulation would change the whole shared browser page, and with it every
 * spec file running beside this one.
 */
function reduceMotion(reduce: boolean): void {
  vi.spyOn(window, 'matchMedia').mockImplementation((query) => {
    const list = realMatchMedia(query);
    return query.includes('prefers-reduced-motion')
      ? new Proxy(list, {
          get(target, key): unknown {
            const value: unknown = Reflect.get(target, key);
            return key === 'matches' ? reduce : value;
          },
        })
      : list;
  });
}

const drawerEl = (): HTMLElement | null => document.querySelector<HTMLElement>('[role="dialog"]');
const maskEl = (): HTMLElement | null => document.querySelector<HTMLElement>('.p-drawer-mask');
const scrollLocked = (): boolean => document.body.classList.contains('p-overflow-hidden');

function find<E extends Element>(element: ParentNode, selector: string, type: new () => E): E {
  const found = element.querySelector(selector);
  if (!(found instanceof type)) {
    throw new Error(`${selector} is missing`);
  }
  return found;
}

const closeButtonEl = (): HTMLElement =>
  find(document, '[role="dialog"] .p-drawer-close-button button', HTMLElement);

/** Renders `Host` with `provideWeeljack` in the given scheme, after `setup` ran. */
async function render(
  setup: (host: Host) => void = () => undefined,
  scheme: Scheme = 'light',
  translation?: Parameters<typeof provideWeeljack>[0],
): Promise<Rendered> {
  ROOT.classList.toggle('wj-dark', scheme === 'dark');
  document.body.style.backgroundColor = 'var(--wj-content-background)';
  TestBed.configureTestingModule({
    providers: [provideWeeljack({ darkMode: 'class', ...translation })],
  });
  const fixture = TestBed.createComponent(Host);
  setup(fixture.componentInstance);
  await fixture.whenStable();
  current = {
    fixture,
    component: fixture.componentInstance,
    element: fixture.nativeElement as HTMLElement,
  };
  return current;
}

/** Opens the drawer from the app and waits until it has finished entering (`opened` emitted). */
async function open({ fixture, component }: Rendered): Promise<void> {
  const before = component.opens();
  component.visible.set(true);
  await fixture.whenStable();
  await expect.poll(() => component.opens()).toBe(before + 1);
}

/** Waits until the drawer has left and nothing of it, its backdrop or its scroll lock remains. */
async function gone(): Promise<void> {
  await expect.poll(() => drawerEl()).toBeNull();
  await expect.poll(() => maskEl()).toBeNull();
  await expect.poll(scrollLocked).toBe(false);
}

/** Closes the drawer from the app and waits for the leave to end. */
async function close({ fixture, component }: Rendered): Promise<void> {
  component.visible.set(false);
  await fixture.whenStable();
  await gone();
}

const harnessOf = (fixture: ComponentFixture<unknown>): Promise<WjDrawerHarness> =>
  TestbedHarnessEnvironment.loader(fixture).getHarness(WjDrawerHarness);

/** The name of the element that has focus: its `aria-label`, else its text. */
const focusedName = (): string => {
  const active = document.activeElement;
  return active?.getAttribute('aria-label') ?? active?.textContent.trim() ?? '';
};

/** Records every class list the drawer panel has from now on, to tell whether its motion ran. */
function recordClasses(): () => string[] {
  const seen = new Set<string>();
  const read = (): void => {
    for (const element of document.querySelectorAll('.p-drawer')) {
      seen.add(element.className);
    }
  };
  const observer = new MutationObserver(read);
  observer.observe(document.body, { attributes: true, subtree: true, childList: true });
  return () => {
    read();
    observer.disconnect();
    return [...seen];
  };
}

const motionClasses = (classes: string[]): string[] =>
  classes.filter((name) => /p-drawer-(enter|leave)-(left|right|top|bottom)/.test(name));

describe('WjDrawer', () => {
  let warn: MockInstance<typeof console.warn>;
  const viewport = { width: window.innerWidth, height: window.innerHeight };

  beforeEach(() => {
    warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    // Motion is off unless a spec turns it on: an open or a close then ends at once.
    reduceMotion(true);
  });

  afterEach(async () => {
    // An overlay left open at teardown would reach the next spec: close it and wait for the leave,
    // for the backdrop to leave the body and for the scroll lock to clear.
    if (current && (drawerEl() || maskEl())) {
      await close(current);
    }
    current = undefined;
    ROOT.classList.remove('wj-dark');
    ROOT.style.removeProperty('--wj-mask-transition-duration');
    document.body.style.backgroundColor = '';
    document.head.querySelectorAll('style[data-optimus-style-id]').forEach((style) => {
      style.remove();
    });
    Reflect.deleteProperty(window, 'wjInjected');
    await page.viewport(viewport.width, viewport.height);
  });

  describe('inputs', () => {
    it('renders nothing while closed, in a host that is a block with no height', async () => {
      const { fixture, element } = await render();
      const host = find(element, 'wj-drawer', HTMLElement);

      expect(drawerEl()).toBeNull();
      expect(maskEl()).toBeNull();
      expect(getComputedStyle(host).display).toBe('block');
      expect(host.getBoundingClientRect().height).toBe(0);
      expect(await (await harnessOf(fixture)).isOpen()).toBe(false);
    });

    it('visible is two-way: the app opens and closes it, and the close button writes it back', async () => {
      const rendered = await render();
      const { fixture, component } = rendered;
      const drawer = await harnessOf(fixture);

      await open(rendered);
      expect(await drawer.isOpen()).toBe(true);
      expect(component.visible()).toBe(true);

      await drawer.close();
      await fixture.whenStable();
      expect(component.visible()).toBe(false);
      await gone();
      expect(await drawer.isOpen()).toBe(false);

      await open(rendered);
      await close(rendered);
      expect(await drawer.isOpen()).toBe(false);
    });

    it('header is the title, names the drawer, and follows the bound value', async () => {
      const rendered = await render();
      await open(rendered);
      const drawer = await harnessOf(rendered.fixture);

      expect(await drawer.getTitle()).toBe('Filters');
      const title = find(document, '[data-pc-section="title"]', HTMLElement);
      expect(title.id).toMatch(/^wj-drawer-title-\d+$/);
      expect(drawerEl()?.getAttribute('aria-labelledby')).toBe(title.id);

      rendered.component.header.set('Sort');
      await rendered.fixture.whenStable();
      expect(await drawer.getTitle()).toBe('Sort');
    });

    it('is a modal dialog, not a complementary landmark, with the body between header and footer', async () => {
      const rendered = await render();
      await open(rendered);
      const drawer = await harnessOf(rendered.fixture);

      expect(await drawer.getRole()).toBe('dialog');
      expect(await drawer.isModal()).toBe(true);
      const content = find(document, '[data-pc-section="content"]', HTMLElement);
      expect(content.textContent).toContain('Narrow the list down.');
    });

    it.each<WjDrawerPosition>(['left', 'right', 'top', 'bottom'])(
      'position %s opens it from that edge',
      async (position) => {
        const rendered = await render((host) => {
          host.position.set(position);
        });
        await open(rendered);
        const drawer = await harnessOf(rendered.fixture);
        const box = drawerEl()?.getBoundingClientRect();

        expect(await drawer.getPosition()).toBe(position);
        expect(box?.[position]).toBe(
          position === 'right' ? window.innerWidth : position === 'bottom' ? window.innerHeight : 0,
        );
      },
    );

    it('position defaults to left, and follows the bound value', async () => {
      const rendered = await render();
      await open(rendered);
      const drawer = await harnessOf(rendered.fixture);
      expect(await drawer.getPosition()).toBe('left');

      rendered.component.position.set('right');
      await rendered.fixture.whenStable();
      expect(await drawer.getPosition()).toBe('right');
    });

    it('closable shows the close button and turns it off at once, also while open', async () => {
      const rendered = await render();
      await open(rendered);
      const drawer = await harnessOf(rendered.fixture);
      expect(await drawer.hasCloseButton()).toBe(true);

      rendered.component.closable.set(false);
      await rendered.fixture.whenStable();
      expect(await drawer.hasCloseButton()).toBe(false);

      rendered.component.closable.set(true);
      await rendered.fixture.whenStable();
      expect(await drawer.hasCloseButton()).toBe(true);
    });

    it('opened emits once per open', async () => {
      const rendered = await render();
      await open(rendered);
      await rendered.fixture.whenStable();
      expect(rendered.component.opens()).toBe(1);

      await close(rendered);
      await open(rendered);
      expect(rendered.component.opens()).toBe(2);
    });

    it('closed emits once, after the drawer is gone, when the close button closes it', async () => {
      const rendered = await render();
      await open(rendered);
      const drawer = await harnessOf(rendered.fixture);

      await drawer.close();
      await expect.poll(() => rendered.component.closes()).toBe(1);
      expect(drawerEl()).toBeNull();
      await rendered.fixture.whenStable();
      expect(rendered.component.closes()).toBe(1);
    });

    it('closed emits once when Escape closes it', async () => {
      const rendered = await render();
      await open(rendered);
      const drawer = await harnessOf(rendered.fixture);

      await drawer.closeWithEscape();
      await expect.poll(() => rendered.component.closes()).toBe(1);
      await rendered.fixture.whenStable();
      expect(rendered.component.closes()).toBe(1);
      expect(rendered.component.visible()).toBe(false);
    });

    it('closed emits once when a click on the backdrop closes it', async () => {
      const rendered = await render();
      await open(rendered);
      const drawer = await harnessOf(rendered.fixture);

      await drawer.clickBackdrop();
      await expect.poll(() => rendered.component.closes()).toBe(1);
      await gone();
      await rendered.fixture.whenStable();
      expect(rendered.component.closes()).toBe(1);
      expect(rendered.component.visible()).toBe(false);
    });

    it('closed emits once when the app sets visible to false, which Optimus onHide never reports', async () => {
      const rendered = await render();
      await open(rendered);

      await close(rendered);
      expect(rendered.component.closes()).toBe(1);
      await rendered.fixture.whenStable();
      expect(rendered.component.closes()).toBe(1);

      await open(rendered);
      await close(rendered);
      expect(rendered.component.closes()).toBe(2);
    });

    it('does not emit closed for a drawer that never opened', async () => {
      const rendered = await render();
      rendered.component.visible.set(true);
      rendered.component.visible.set(false);
      await rendered.fixture.whenStable();

      expect(rendered.component.opens()).toBe(0);
      expect(rendered.component.closes()).toBe(0);
    });

    it('the footer slot renders the consumer template below the body, and a drawer without it has no footer', async () => {
      const rendered = await render();
      await open(rendered);
      const drawer = await harnessOf(rendered.fixture);

      const buttons = await drawer.getAllHarnesses(WjButtonHarness);
      expect(await Promise.all(buttons.map((button) => button.getLabel()))).toEqual([
        'Cancel',
        'Apply',
      ]);
      const footer = find(document, '[data-pc-section="footer"]', HTMLElement);
      expect(footer.contains(find(footer, 'wj-button', HTMLElement))).toBe(true);

      rendered.component.withFooter.set(false);
      await rendered.fixture.whenStable();
      await expect.poll(() => document.querySelector('[data-pc-section="footer"]')).toBeNull();
    });

    it('a drawer opened without a footer slot has no footer region, and gets one when the slot appears', async () => {
      const rendered = await render((host) => {
        host.withFooter.set(false);
      });
      await open(rendered);
      expect(document.querySelector('[data-pc-section="footer"]')).toBeNull();

      rendered.component.withFooter.set(true);
      await rendered.fixture.whenStable();
      await expect.poll(() => document.querySelector('[data-pc-section="footer"]')).not.toBeNull();
    });

    it('ariaDescribedBy describes the drawer element, and a harness reads the description', async () => {
      const rendered = await render();
      await open(rendered);
      const drawer = await harnessOf(rendered.fixture);

      expect(drawerEl()?.getAttribute('aria-describedby')).toBe('body-text');
      expect(await drawer.getDescription()).toBe('Narrow the list down.');

      rendered.component.describedBy.set(undefined);
      await rendered.fixture.whenStable();
      expect(drawerEl()?.hasAttribute('aria-describedby')).toBe(false);
      expect(await drawer.getDescription()).toBeNull();
    });

    it('pt reaches the parts, and the routed role, name and description survive it', async () => {
      const rendered = await render((host) => {
        host.pt.set({
          root: {
            'data-root': 'r',
            role: 'region',
            'aria-modal': 'false',
            'aria-labelledby': 'nothing',
            'aria-describedby': 'ignored',
          },
          header: { 'data-header': 'h' },
          title: { 'data-title': 't', id: 'ignored-id' },
          pcCloseButton: { root: { 'data-close': 'c' } },
          content: { 'data-content': 'b' },
          footer: { 'data-footer': 'f' },
        });
      });
      await open(rendered);
      const title = find(document, '[data-title]', HTMLElement);

      expect(drawerEl()?.getAttribute('data-root')).toBe('r');
      expect(drawerEl()?.getAttribute('role')).toBe('dialog');
      expect(drawerEl()?.getAttribute('aria-modal')).toBe('true');
      expect(drawerEl()?.getAttribute('aria-describedby')).toBe('body-text');
      expect(drawerEl()?.getAttribute('aria-labelledby')).toBe(title.id);
      expect(title.id).not.toBe('ignored-id');
      expect(document.querySelector('[data-header]')?.getAttribute('data-header')).toBe('h');
      expect(document.querySelector('[data-content]')?.getAttribute('data-content')).toBe('b');
      expect(document.querySelector('[data-footer]')?.getAttribute('data-footer')).toBe('f');
      expect(closeButtonEl().getAttribute('data-close')).toBe('c');
    });

    it('pt works as a function, and clears nothing the wrapper routes', async () => {
      const rendered = await render((host) => {
        host.pt.set(() => ({ root: { 'data-root': 'fn' } }));
      });
      await open(rendered);

      expect(drawerEl()?.getAttribute('data-root')).toBe('fn');
      expect(drawerEl()?.getAttribute('role')).toBe('dialog');
      expect(drawerEl()?.getAttribute('aria-describedby')).toBe('body-text');
    });

    it('never puts autofocus on the close button, with or without a pt for it', async () => {
      const rendered = await render();
      await open(rendered);
      expect(closeButtonEl().hasAttribute('autofocus')).toBe(false);

      await close(rendered);
      rendered.component.pt.set({ pcCloseButton: { root: { 'data-close': 'c' } } });
      await open(rendered);
      expect(closeButtonEl().hasAttribute('autofocus')).toBe(false);
    });

    it('is always modal: the backdrop is on the page and the page behind does not scroll', async () => {
      const rendered = await render();
      await open(rendered);

      expect(maskEl()?.parentElement).toBe(document.body);
      expect(scrollLocked()).toBe(true);
      expect(await (await harnessOf(rendered.fixture)).hasBackdrop()).toBe(true);
    });
  });

  describe('close paths', () => {
    it('Escape closes the drawer while it is closable', async () => {
      const rendered = await render();
      await open(rendered);

      await userEvent.keyboard('{Escape}');

      await expect.poll(() => rendered.component.visible()).toBe(false);
      await gone();
    });

    it('a click on the backdrop closes the drawer while it is closable', async () => {
      const rendered = await render();
      await open(rendered);

      await (await harnessOf(rendered.fixture)).clickBackdrop();

      await expect.poll(() => rendered.component.visible()).toBe(false);
      await gone();
    });

    it('closable set to false before opening removes the close button, Escape and the backdrop', async () => {
      const rendered = await render((host) => {
        host.closable.set(false);
      });
      await open(rendered);
      const drawer = await harnessOf(rendered.fixture);

      expect(await drawer.hasCloseButton()).toBe(false);
      await userEvent.keyboard('{Escape}');
      await drawer.clickBackdrop();
      await rendered.fixture.whenStable();
      expect(rendered.component.visible()).toBe(true);
      expect(drawerEl()).not.toBeNull();
      expect(maskEl()).not.toBeNull();
      expect(scrollLocked()).toBe(true);
    });

    it('closable turning false while open stops Escape, and turning true brings it back', async () => {
      const rendered = await render();
      await open(rendered);

      rendered.component.closable.set(false);
      await rendered.fixture.whenStable();
      await userEvent.keyboard('{Escape}');
      await rendered.fixture.whenStable();
      expect(rendered.component.visible()).toBe(true);
      expect(rendered.component.closes()).toBe(0);
      expect(maskEl()).not.toBeNull();
      expect(scrollLocked()).toBe(true);

      rendered.component.closable.set(true);
      await rendered.fixture.whenStable();
      await userEvent.keyboard('{Escape}');
      await expect.poll(() => rendered.component.visible()).toBe(false);
      await gone();
      expect(rendered.component.closes()).toBe(1);
    });

    it('closable turning false while open stops the backdrop, and turning true brings it back', async () => {
      const rendered = await render();
      await open(rendered);
      const drawer = await harnessOf(rendered.fixture);

      rendered.component.closable.set(false);
      await rendered.fixture.whenStable();
      await drawer.clickBackdrop();
      await rendered.fixture.whenStable();
      expect(rendered.component.visible()).toBe(true);
      expect(maskEl()).not.toBeNull();

      rendered.component.closable.set(true);
      await rendered.fixture.whenStable();
      await drawer.clickBackdrop();
      await expect.poll(() => rendered.component.visible()).toBe(false);
      await gone();
      expect(rendered.component.closes()).toBe(1);
    });

    it('closable turning true while open, after opening without it, brings Escape and the backdrop back', async () => {
      const rendered = await render((host) => {
        host.closable.set(false);
      });
      await open(rendered);
      rendered.component.closable.set(true);
      await rendered.fixture.whenStable();

      await userEvent.keyboard('{Escape}');
      await expect.poll(() => rendered.component.visible()).toBe(false);
      await gone();

      rendered.component.closable.set(false);
      await open(rendered);
      rendered.component.closable.set(true);
      await rendered.fixture.whenStable();
      await (await harnessOf(rendered.fixture)).clickBackdrop();
      await expect.poll(() => rendered.component.visible()).toBe(false);
      await gone();
      expect(rendered.component.closes()).toBe(2);
    });

    it('Escape pressed with focus on the page, not in the drawer, still follows closable', async () => {
      const rendered = await render();
      await open(rendered);
      rendered.component.closable.set(false);
      await rendered.fixture.whenStable();
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
      expect(document.activeElement).toBe(document.body);

      await userEvent.keyboard('{Escape}');
      await rendered.fixture.whenStable();
      expect(rendered.component.visible()).toBe(true);
      expect(maskEl()).not.toBeNull();

      rendered.component.closable.set(true);
      await rendered.fixture.whenStable();
      await userEvent.keyboard('{Escape}');
      await expect.poll(() => rendered.component.visible()).toBe(false);
      await gone();
    });

    it('Escape inside the body of a non-closable drawer keeps the backdrop and the scroll lock', async () => {
      const rendered = await render((host) => {
        host.withInput.set(true);
        host.closable.set(false);
      });
      await open(rendered);
      await expect.poll(() => document.activeElement?.id).toBe('body-input');

      await userEvent.keyboard('{Escape}');
      await rendered.fixture.whenStable();
      // Optimus's own handler adds the backdrop's leave class on the keydown itself.
      expect(rendered.component.escapes()).toBe(1);
      expect(rendered.component.visible()).toBe(true);
      expect(maskEl()).not.toBeNull();
      expect(maskEl()?.classList.contains('p-overlay-mask-leave-active')).toBe(false);
      expect(scrollLocked()).toBe(true);
    });

    it('Escape on the drawer element or a footer action of a non-closable drawer keeps the backdrop too', async () => {
      const rendered = await render((host) => {
        host.closable.set(false);
      });
      await open(rendered);

      expect(focusedName()).toBe('Cancel');
      await userEvent.keyboard('{Escape}');
      drawerEl()?.focus();
      await userEvent.keyboard('{Escape}');
      await rendered.fixture.whenStable();

      expect(rendered.component.visible()).toBe(true);
      expect(maskEl()?.classList.contains('p-overlay-mask-leave-active')).toBe(false);
      expect(scrollLocked()).toBe(true);
    });

    it('Escape closes an open select in the body first, and the drawer stays while it is not closable', async () => {
      const rendered = await render((host) => {
        host.withSelect.set(true);
      });
      await open(rendered);
      rendered.component.closable.set(false);
      await rendered.fixture.whenStable();
      const select = await TestbedHarnessEnvironment.loader(rendered.fixture).getHarness(
        WjSelectHarness,
      );
      await select.open();
      expect(await select.isOpen()).toBe(true);

      await select.close();
      await expect.poll(() => select.isOpen()).toBe(false);
      expect(rendered.component.visible()).toBe(true);
      expect(drawerEl()).not.toBeNull();
      expect(maskEl()).not.toBeNull();
      expect(scrollLocked()).toBe(true);
    });
  });

  describe('focus', () => {
    it('moves to the first control of the body when it opens', async () => {
      const rendered = await render((host) => {
        host.withInput.set(true);
      });
      await open(rendered);

      expect(document.activeElement?.id).toBe('body-input');
      expect(await (await harnessOf(rendered.fixture)).containsFocus()).toBe(true);
    });

    it('moves to the first action of the footer when the body has no control', async () => {
      const rendered = await render();
      await open(rendered);

      expect(focusedName()).toBe('Cancel');
    });

    it('moves to the close button when only the header has a control', async () => {
      const rendered = await render((host) => {
        host.withFooter.set(false);
      });
      await open(rendered);

      expect(focusedName()).toBe('Close');
    });

    it('moves to the drawer itself when nothing inside can take focus', async () => {
      const rendered = await render((host) => {
        host.withFooter.set(false);
        host.closable.set(false);
      });
      await open(rendered);

      expect(document.activeElement).toBe(drawerEl());
      expect(drawerEl()?.getAttribute('tabindex')).toBe('-1');
    });

    it('Tab and Shift+Tab cycle inside the drawer', async () => {
      const rendered = await render((host) => {
        host.withInput.set(true);
      });
      await open(rendered);
      expect(document.activeElement?.id).toBe('body-input');

      const forward: string[] = [];
      for (let step = 0; step < 4; step += 1) {
        await userEvent.tab();
        forward.push(focusedName());
      }
      expect(forward).toEqual(['Cancel', 'Apply', 'Close', 'Name']);

      const backward: string[] = [];
      for (let step = 0; step < 3; step += 1) {
        await userEvent.tab({ shift: true });
        backward.push(focusedName());
      }
      expect(backward).toEqual(['Close', 'Apply', 'Cancel']);
    });

    it.each([
      ['Enter', '{Enter}'],
      ['Space', ' '],
    ])('%s on the close button closes the drawer', async (_name, key) => {
      const rendered = await render((host) => {
        host.withFooter.set(false);
      });
      await open(rendered);
      expect(focusedName()).toBe('Close');

      await userEvent.keyboard(key);
      await expect.poll(() => rendered.component.visible()).toBe(false);
      await gone();
    });

    it('returns to the opener when it closes, whatever closed it', async () => {
      const rendered = await render();
      const opener = (): HTMLElement => find(rendered.element, '#opener button', HTMLElement);

      await userEvent.click(opener());
      await expect.poll(() => rendered.component.opens()).toBe(1);
      await userEvent.keyboard('{Escape}');
      await gone();
      expect(document.activeElement).toBe(opener());

      await userEvent.click(opener());
      await expect.poll(() => rendered.component.opens()).toBe(2);
      await (await harnessOf(rendered.fixture)).close();
      await gone();
      expect(document.activeElement).toBe(opener());

      await userEvent.click(opener());
      await expect.poll(() => rendered.component.opens()).toBe(3);
      await (await harnessOf(rendered.fixture)).clickBackdrop();
      await gone();
      expect(document.activeElement).toBe(opener());

      await userEvent.click(opener());
      await expect.poll(() => rendered.component.opens()).toBe(4);
      rendered.component.visible.set(false);
      await gone();
      expect(document.activeElement).toBe(opener());
    });

    it('does not fail when the opener is gone, and leaves focus to the closed handler', async () => {
      const rendered = await render();
      await userEvent.click(find(rendered.element, '#opener button', HTMLElement));
      await expect.poll(() => rendered.component.opens()).toBe(1);

      rendered.component.withOpener.set(false);
      await rendered.fixture.whenStable();
      await close(rendered);

      expect(rendered.component.closes()).toBe(1);
      expect(document.activeElement).toBe(document.body);
    });
  });

  describe('motion', () => {
    it('plays no enter or leave motion under reduced motion, and still emits opened and closed', async () => {
      const rendered = await render();
      const read = recordClasses();

      await open(rendered);
      await close(rendered);

      expect(motionClasses(read())).toEqual([]);
      expect(rendered.component.opens()).toBe(1);
      expect(rendered.component.closes()).toBe(1);
    });

    it('the backdrop still leaves the body under reduced motion, where its animation lasts 0s', async () => {
      // The theme's reduced-motion block sets this variable; matchMedia is mocked, so set it here.
      ROOT.style.setProperty('--wj-mask-transition-duration', '0s');
      const rendered = await render();
      await open(rendered);
      expect(
        getComputedStyle(find(document, '.p-drawer-mask', HTMLElement)).animationDuration,
      ).toBe('0s');

      await close(rendered);

      expect(maskEl()).toBeNull();
      expect(scrollLocked()).toBe(false);
      expect(rendered.component.closes()).toBe(1);
    });

    it('pt.motion cannot switch safe off', async () => {
      const rendered = await render((host) => {
        host.pt.set({ motion: { safe: false } });
      });
      const read = recordClasses();

      await open(rendered);
      await close(rendered);

      expect(motionClasses(read())).toEqual([]);
    });

    it('plays the motion when the reader has not asked for less, so the recorder sees it', async () => {
      reduceMotion(false);
      const rendered = await render();
      const read = recordClasses();

      await open(rendered);
      await close(rendered);

      expect(motionClasses(read()).length).toBeGreaterThan(0);
      expect(rendered.component.closes()).toBe(1);
    });
  });

  describe('the close button', () => {
    it('is named Close by default', async () => {
      const rendered = await render();
      await open(rendered);

      expect(await (await harnessOf(rendered.fixture)).getCloseLabel()).toBe('Close');
      expect(closeButtonEl().getAttribute('aria-label')).toBe('Close');
    });

    it('follows the translation: a changed aria.close renames it', async () => {
      const rendered = await render(undefined, 'light', {
        translation: { aria: { close: 'Đóng' } },
      });
      await open(rendered);

      expect(await (await harnessOf(rendered.fixture)).getCloseLabel()).toBe('Đóng');
    });

    it('has a box of at least 24 x 24 px, 44 x 44 by the default look', async () => {
      const rendered = await render();
      await open(rendered);
      const box = closeButtonEl().getBoundingClientRect();

      expect(box.width).toBeGreaterThanOrEqual(24);
      expect(box.height).toBeGreaterThanOrEqual(24);
      expect(box.width).toBe(44);
      expect(box.height).toBe(44);
    });
  });

  describe('layout', () => {
    it('keeps the 44px header row when there is no close button, so the body does not move', async () => {
      const rendered = await render();
      await open(rendered);
      const content = find(document, '[data-pc-section="content"]', HTMLElement);
      const withButton =
        content.getBoundingClientRect().top - (drawerEl()?.getBoundingClientRect().top ?? 0);

      rendered.component.closable.set(false);
      await rendered.fixture.whenStable();
      const without =
        content.getBoundingClientRect().top - (drawerEl()?.getBoundingClientRect().top ?? 0);

      expect(without).toBe(withButton);
      expect(find(document, '[data-pc-section="header"]', HTMLElement).offsetHeight).toBe(64);
    });

    it('draws the title at 1.25rem, like the dialog, and a footer padded 0 20px 20px', async () => {
      const rendered = await render();
      await open(rendered);
      const title = find(document, '[data-pc-section="title"]', HTMLElement);
      const footer = find(document, '[data-pc-section="footer"]', HTMLElement);

      expect(getComputedStyle(title).fontSize).toBe('20px');
      expect(getComputedStyle(footer).padding).toBe('0px 20px 20px');
      expect(getComputedStyle(footer).justifyContent).toMatch(/flex-end|end/);
    });

    it('wraps a long title and holds the close button in the top corner', async () => {
      const rendered = await render((host) => {
        host.header.set(`${'A very long title '.repeat(12)}${'x'.repeat(80)}`);
      });
      await open(rendered);
      const title = find(document, '[data-pc-section="title"]', HTMLElement);
      const header = find(document, '[data-pc-section="header"]', HTMLElement);

      expect(title.getBoundingClientRect().height).toBeGreaterThan(60);
      expect(closeButtonEl().getBoundingClientRect().top - header.getBoundingClientRect().top).toBe(
        12,
      );
      expect(drawerEl()?.getBoundingClientRect().right).toBeLessThanOrEqual(window.innerWidth);
    });

    it('is 20rem wide on the sides, and keeps 3rem of backdrop at a 320px viewport', async () => {
      const rendered = await render();
      await open(rendered);
      expect(drawerEl()?.getBoundingClientRect().width).toBe(320);
      await close(rendered);

      await page.viewport(320, 640);
      await open(rendered);
      const box = drawerEl()?.getBoundingClientRect();

      expect(box?.width).toBe(320 - 48);
      expect(320 - (box?.right ?? 0)).toBe(48);
    });

    it.each<WjDrawerPosition>(['top', 'bottom'])(
      'a %s drawer is as tall as its content, not a fixed 10rem, and as wide as the page',
      async (position) => {
        const rendered = await render((host) => {
          host.position.set(position);
          host.withFooter.set(false);
        });
        await open(rendered);
        const box = drawerEl()?.getBoundingClientRect();
        const header = find(document, '[data-pc-section="header"]', HTMLElement);
        const content = find(document, '[data-pc-section="content"]', HTMLElement);

        expect(box?.width).toBe(window.innerWidth);
        const fit = header.offsetHeight + content.offsetHeight;
        // Content plus the panel's border: a fixed 10rem (160px) would be well above it.
        expect(box?.height).toBeGreaterThanOrEqual(fit);
        expect(box?.height).toBeLessThanOrEqual(fit + 6);
        expect(fit).toBeLessThan(150);
      },
    );

    it.each<WjDrawerPosition>(['top', 'bottom'])(
      'a %s drawer never grows past 90dvh, and its body scrolls',
      async (position) => {
        const rendered = await render((host) => {
          host.position.set(position);
          host.text.set('Long body text. '.repeat(2000));
        });
        await open(rendered);
        const box = drawerEl()?.getBoundingClientRect();
        const content = find(document, '[data-pc-section="content"]', HTMLElement);

        expect(box?.height).toBeCloseTo(window.innerHeight * 0.9, 0);
        expect(content.scrollHeight).toBeGreaterThan(content.clientHeight);
        expect(getComputedStyle(content).overflowY).toBe('auto');
      },
    );

    it('rounds the open edge of a top and a bottom drawer by 12px, and squares the sides', async () => {
      const radius = async (position: WjDrawerPosition): Promise<string[]> => {
        const rendered = await render((host) => {
          host.position.set(position);
        });
        await open(rendered);
        const style = getComputedStyle(drawerEl() ?? document.body);
        const corners = [
          style.borderTopLeftRadius,
          style.borderTopRightRadius,
          style.borderBottomRightRadius,
          style.borderBottomLeftRadius,
        ];
        await close(rendered);
        rendered.fixture.destroy();
        TestBed.resetTestingModule();
        return corners;
      };

      expect(await radius('bottom')).toEqual(['12px', '12px', '0px', '0px']);
      expect(await radius('top')).toEqual(['0px', '0px', '12px', '12px']);
      expect(await radius('left')).toEqual(['0px', '0px', '0px', '0px']);
      expect(await radius('right')).toEqual(['0px', '0px', '0px', '0px']);
    });

    it('lets a crowded footer wrap instead of overflowing', async () => {
      await page.viewport(320, 640);
      const rendered = await render();
      await open(rendered);
      const footer = find(document, '[data-pc-section="footer"]', HTMLElement);
      for (let index = 0; index < 5; index += 1) {
        const extra = document.createElement('button');
        extra.textContent = `Extra action number ${String(index)}`;
        footer.append(extra);
      }

      expect(footer.scrollWidth).toBeLessThanOrEqual(footer.clientWidth);
      expect(getComputedStyle(footer).flexWrap).toBe('wrap');
    });
  });

  describe('safety', () => {
    it('renders an HTML payload in header as text', async () => {
      const rendered = await render((host) => {
        host.header.set(PAYLOAD);
      });
      await open(rendered);

      expect(await (await harnessOf(rendered.fixture)).getTitle()).toBe(PAYLOAD);
      expect(rendered.element.querySelector('img, script')).toBeNull();
      expect(document.querySelector('[role="dialog"] img, [role="dialog"] script')).toBeNull();
      expect(Reflect.get(window, 'wjInjected')).toBeUndefined();
    });

    it('renders an HTML payload in ariaDescribedBy as attribute text', async () => {
      const rendered = await render((host) => {
        host.describedBy.set(PAYLOAD);
      });
      await open(rendered);

      expect(drawerEl()?.getAttribute('aria-describedby')).toBe(PAYLOAD);
      expect(rendered.element.querySelector('img, script')).toBeNull();
      expect(Reflect.get(window, 'wjInjected')).toBeUndefined();
    });
  });

  describe('setup and ARIA checks', () => {
    it('warns WJ0001 when provideWeeljack is missing', async () => {
      const fixture = TestBed.createComponent(RoutedHost);
      await fixture.whenStable();

      expect(warn).toHaveBeenCalledTimes(1);
      expect(warn).toHaveBeenCalledWith(
        'WJ0001: wj-drawer: provideWeeljack() is missing from the application providers. ' +
          'Add provideWeeljack() to your application config. ' +
          'Find more at https://locvodever.github.io/weeljack-ng/errors/WJ0001',
      );
    });

    it('stays silent with provideWeeljack', async () => {
      const rendered = await render();
      await open(rendered);
      expect(warn).not.toHaveBeenCalled();
    });

    it('warns WJ0003 once when aria-* is written on the host, and says what to use', async () => {
      TestBed.configureTestingModule({ providers: [provideWeeljack()] });
      const fixture = TestBed.createComponent(AriaOnHostHost);
      await fixture.whenStable();

      expect(warn).toHaveBeenCalledTimes(1);
      expect(warn).toHaveBeenCalledWith(
        'WJ0003: wj-drawer: aria-label is set on the host, where it is not forwarded to the focusable element. ' +
          'Use the ariaDescribedBy input; the header names the drawer. ' +
          'Find more at https://locvodever.github.io/weeljack-ng/errors/WJ0003',
      );
    });
  });

  describe('accessibility', () => {
    for (const scheme of ['light', 'dark'] as const) {
      describe(`axe, ${scheme}`, () => {
        it('finds no violation while closed', async () => {
          const { element } = await render(undefined, scheme);
          await expectNoAxeViolations(element);
        });

        it('finds no violation while open on the left', async () => {
          const rendered = await render((host) => {
            host.withFooter.set(false);
          }, scheme);
          await open(rendered);
          await expectNoAxeViolations(rendered.element);
        });

        it('finds no violation while open at the bottom', async () => {
          const rendered = await render((host) => {
            host.position.set('bottom');
            host.withFooter.set(false);
          }, scheme);
          await open(rendered);
          await expectNoAxeViolations(rendered.element);
        });

        it('finds no violation while open with a footer', async () => {
          const rendered = await render((host) => {
            host.position.set('right');
          }, scheme);
          await open(rendered);
          await expectNoAxeViolations(rendered.element);
        });

        it('finds no violation while open with closable false', async () => {
          const rendered = await render((host) => {
            host.closable.set(false);
          }, scheme);
          await open(rendered);
          await expectNoAxeViolations(rendered.element);
        });
      });
    }
  });
});
