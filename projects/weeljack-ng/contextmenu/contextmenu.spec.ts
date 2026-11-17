/// <reference types="@vitest/browser-playwright" />
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Component, signal, viewChild } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ContextMenuService } from '@openng/optimus-ui/api';
import type { MockInstance } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { provideWeeljack, type WjMenuItem, type WjMenuItemCommandEvent } from 'weeljack-ng';
import * as entry from 'weeljack-ng/contextmenu';
import {
  WjContextMenu,
  WjContextMenuItemSlot,
  type WjContextMenuPt,
} from 'weeljack-ng/contextmenu';
import { WjContextMenuHarness } from 'weeljack-ng/contextmenu/testing';
import { expectNoAxeViolations, runAxe } from '../spec-support/axe';

const PAYLOAD = '<img src=x onerror="window.wjInjected = true">';
const ROOT = document.documentElement;

const fileMenu = (): WjMenuItem[] => [
  { label: 'Open' },
  { label: 'Rename…' },
  { label: 'Duplicate' },
  { label: 'Share', items: [{ label: 'Copy link' }, { label: 'Email…' }] },
  { separator: true },
  { label: 'Delete' },
];

/** Every item of a model, parents before their children, as the slot sees them. */
const flatten = (items: readonly WjMenuItem[]): WjMenuItem[] =>
  items.flatMap((item) => [item, ...flatten(item.items ?? [])]);

/** A consumer's template: a focusable, named target, one other control and the menu. */
@Component({
  selector: 'wj-contextmenu-host',
  imports: [WjContextMenu, WjContextMenuItemSlot],
  styles: `
    .stage {
      min-block-size: 24rem;
      max-inline-size: 24rem;
    }

    .region {
      padding: 24px;
      border: 1px dashed currentColor;
    }
  `,
  template: `
    <div class="stage">
      <p id="caption">Files</p>
      <p id="notes">Right-click the file.</p>
      <div #region id="region" class="region" role="group" aria-label="report.pdf" tabindex="0">
        report.pdf
      </div>
      <button id="other" type="button">Other</button>
      <wj-contextmenu
        #menu
        [model]="model()"
        [target]="targeted() ? region : undefined"
        [global]="global()"
        [ariaLabel]="ariaLabel()"
        [ariaLabelledBy]="ariaLabelledBy()"
        [ariaDescribedBy]="ariaDescribedBy()"
        [pt]="pt()"
        (opened)="opens.update(countUp)"
        (closed)="closes.update(countUp)"
      >
        @if (withSlot()) {
          <ng-template wjContextMenuItem let-item>
            <span class="icon" aria-hidden="true"></span>
            <span class="text" [attr.data-index]="position(item)">{{ item.label }}</span>
          </ng-template>
        }
      </wj-contextmenu>
    </div>
  `,
})
class Host {
  readonly menu = viewChild.required(WjContextMenu);
  readonly model = signal<WjMenuItem[]>(fileMenu());
  readonly targeted = signal(true);
  readonly global = signal(false);
  readonly ariaLabel = signal<string | undefined>('File');
  readonly ariaLabelledBy = signal<string | undefined>(undefined);
  readonly ariaDescribedBy = signal<string | undefined>(undefined);
  readonly pt = signal<WjContextMenuPt>(undefined);
  readonly withSlot = signal(false);
  readonly opens = signal(0);
  readonly closes = signal(0);
  readonly countUp = (count: number): number => count + 1;
  readonly position = (item: WjMenuItem): number => flatten(this.model()).indexOf(item);
}

/** A consumer who writes aria-* on the host. */
@Component({
  selector: 'wj-contextmenu-aria-on-host-host',
  imports: [WjContextMenu],
  template: `<wj-contextmenu aria-label="File" [model]="model" />`,
})
class AriaOnHostHost {
  readonly model = fileMenu();
}

/** A menu rendered without `provideWeeljack`. */
@Component({
  selector: 'wj-contextmenu-routed-host',
  imports: [WjContextMenu],
  template: `<wj-contextmenu [model]="model" ariaLabel="File" />`,
})
class RoutedHost {
  readonly model = fileMenu();
}

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

function find<E extends Element>(element: ParentNode, selector: string, type: new () => E): E {
  const found = element.querySelector(selector);
  if (!(found instanceof type)) {
    throw new Error(`${selector} is missing`);
  }
  return found;
}

const listEl = (): HTMLElement | null => document.querySelector<HTMLElement>('[role="menu"]');
const region = (): HTMLElement => find(document, '#region', HTMLElement);
const other = (): HTMLElement => find(document, '#other', HTMLElement);
/** The item whose own text (not its submenu's) is `label`. */
const itemEl = (label: string): HTMLElement => {
  const found = [...document.querySelectorAll<HTMLElement>('[role="menuitem"]')].find(
    (item) => item.querySelector('[data-pc-section="itemcontent"]')?.textContent.trim() === label,
  );
  if (found === undefined) {
    throw new Error(`the item ${label} is not on the page`);
  }
  return found;
};

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
  current = {
    fixture,
    component: fixture.componentInstance,
    element: fixture.nativeElement as HTMLElement,
  };
  return current;
}

const globalMenu = (host: Host): void => {
  host.targeted.set(false);
  host.global.set(true);
};

const harnessOf = (fixture: ComponentFixture<unknown>): Promise<WjContextMenuHarness> =>
  TestbedHarnessEnvironment.loader(fixture).getHarness(WjContextMenuHarness);

/** The event the context-menu key, Shift+F10 and a right-click all fire. */
const contextEvent = (x = 40, y = 40): MouseEvent =>
  new MouseEvent('contextmenu', { bubbles: true, cancelable: true, clientX: x, clientY: y });

/** Opens the menu with a `contextmenu` event on `on` and waits until it has entered. */
async function openAt(
  { fixture, component }: Rendered,
  on: EventTarget = region(),
  event: MouseEvent = contextEvent(),
): Promise<MouseEvent> {
  const before = component.opens();
  on.dispatchEvent(event);
  await fixture.whenStable();
  await expect.poll(() => component.opens()).toBe(before + 1);
  await expect.poll(() => document.activeElement?.getAttribute('role')).toBe('menu');
  return event;
}

/** Closes the menu from the app and waits for the leave to end. */
async function closeMenu({ fixture }: Rendered, host: Host): Promise<void> {
  host.menu().hide();
  await fixture.whenStable();
  await expect.poll(() => listEl()).toBeNull();
}

/** The own text of the active item, which is where the keyboard is. */
const activeLabel = (): string =>
  document
    .querySelector('[role="menuitem"][data-p-focused="true"] > [data-pc-section="itemcontent"]')
    ?.textContent.trim() ?? '';

async function openSubmenu(fixture: ComponentFixture<unknown>, label: string): Promise<void> {
  const [item] = await (await harnessOf(fixture)).getItems({ label });
  await item?.openSubmenu();
  await expect.poll(async () => item?.isSubmenuOpen()).toBe(true);
}

/**
 * axe over a page with a submenu open. Optimus gap, listed on the docs page: the parent item keeps
 * `aria-label` = its own label while its visible text is longer (its open submenu is nested in
 * it), so axe reports `label-content-name-mismatch` on that parent. Nothing else may be reported,
 * and that one only on an expanded parent.
 */
async function expectOnlyTheParentNameGap(): Promise<void> {
  const violations = await runAxe();

  expect(violations.filter(({ id }) => id !== 'label-content-name-mismatch')).toEqual([]);
  for (const { nodes } of violations) {
    for (const { html } of nodes) {
      expect(html).toContain('aria-expanded="true"');
    }
  }
}

/**
 * Records every class list Optimus's menu root has from now on, so a spec can tell whether its
 * enter and leave motion ran. Call the returned function to stop and read them.
 */
function recordClasses(): () => string[] {
  const seen = new Set<string>();
  const read = (): void => {
    for (const element of document.querySelectorAll('[data-pc-section="root"], [role="menu"]')) {
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
  classes.filter((name) => /enter-active|leave-active/.test(name));

describe('WjContextMenu', () => {
  let warn: MockInstance<typeof console.warn>;
  const viewport = { width: window.innerWidth, height: window.innerHeight };

  beforeEach(() => {
    warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    // Motion is off unless a spec turns it on: an open or a close then ends at once.
    reduceMotion(true);
  });

  afterEach(async () => {
    // An overlay left open at teardown would reach the next spec: close it and wait for the leave.
    if (current && listEl()) {
      await closeMenu(current, current.component);
    }
    current = undefined;
    ROOT.classList.remove('wj-dark');
    document.body.style.backgroundColor = '';
    document.head.querySelectorAll('style[data-optimus-style-id]').forEach((style) => {
      style.remove();
    });
    Reflect.deleteProperty(window, 'wjInjected');
    await page.viewport(viewport.width, viewport.height);
  });

  describe('inputs', () => {
    it('renders nothing while closed, with a host that has no height', async () => {
      const { fixture, element } = await render();
      const menu = await harnessOf(fixture);
      const host = find(element, 'wj-contextmenu', HTMLElement);

      expect(listEl()).toBeNull();
      expect(getComputedStyle(host).display).toBe('block');
      expect(host.getBoundingClientRect().height).toBe(0);
      expect(await menu.isOpen()).toBe(false);
      expect(await menu.getName()).toBe('');
    });

    it('opens on a contextmenu event on the target, without the browser’s own menu', async () => {
      const rendered = await render();
      const menu = await harnessOf(rendered.fixture);

      const event = await openAt(rendered);

      expect(event.defaultPrevented).toBe(true);
      expect(await menu.isOpen()).toBe(true);
      expect(await menu.getItemLabels()).toEqual([
        'Open',
        'Rename…',
        'Duplicate',
        'Share',
        'Delete',
      ]);
      expect(await menu.getSeparatorCount()).toBe(1);
      expect(listEl()?.tagName).toBe('UL');
    });

    it('follows a new array the next time it opens', async () => {
      const rendered = await render();
      await openAt(rendered);
      await closeMenu(rendered, rendered.component);

      rendered.component.model.set([{ label: 'Undo' }, { label: 'Redo' }]);
      await rendered.fixture.whenStable();
      await openAt(rendered);

      expect(await (await harnessOf(rendered.fixture)).getItemLabels()).toEqual(['Undo', 'Redo']);
    });

    it('opens only for its target: a contextmenu event elsewhere is left to the browser', async () => {
      const rendered = await render();

      const event = contextEvent();
      other().dispatchEvent(event);
      await rendered.fixture.whenStable();

      expect(event.defaultPrevented).toBe(false);
      expect(rendered.component.opens()).toBe(0);
      expect(listEl()).toBeNull();
    });

    it('global opens on a contextmenu event anywhere on the page', async () => {
      const rendered = await render(globalMenu);

      const event = await openAt(rendered, other());

      expect(event.defaultPrevented).toBe(true);
      expect(await (await harnessOf(rendered.fixture)).isOpen()).toBe(true);
      await closeMenu(rendered, rendered.component);

      await openAt(rendered, document.body);
      expect(rendered.component.opens()).toBe(2);
    });

    it('with no items renders nothing and binds nothing: the browser’s own menu appears', async () => {
      const rendered = await render((host) => {
        host.model.set([]);
      });
      const { fixture, component, element } = rendered;

      const event = contextEvent();
      region().dispatchEvent(event);
      component.menu().show(contextEvent());
      await fixture.whenStable();

      expect(element.querySelector('p-contextmenu')).toBeNull();
      expect(event.defaultPrevented).toBe(false);
      expect(component.opens()).toBe(0);
      expect(listEl()).toBeNull();

      component.model.set(fileMenu());
      await fixture.whenStable();
      await openAt(rendered);
      expect(await (await harnessOf(fixture)).isOpen()).toBe(true);
    });

    it('show opens it at the position of the event, and hide closes it', async () => {
      const rendered = await render();
      const { fixture, component } = rendered;

      component.menu().show(contextEvent(120, 90));
      await fixture.whenStable();
      await expect.poll(() => component.opens()).toBe(1);

      const overlay = find(document, '[data-pc-section="root"]', HTMLElement);
      const box = overlay.getBoundingClientRect();
      expect(Math.abs(box.left - (120 + window.scrollX + 1))).toBeLessThanOrEqual(2);
      expect(Math.abs(box.top - (90 + window.scrollY + 1))).toBeLessThanOrEqual(2);

      component.menu().hide();
      await fixture.whenStable();
      await expect.poll(() => component.closes()).toBe(1);
      await expect.poll(() => listEl()).toBeNull();
    });

    it('moves to the pointer on a second right-click without opening again', async () => {
      const rendered = await render();
      await openAt(rendered, region(), contextEvent(40, 40));
      const overlay = find(document, '[data-pc-section="root"]', HTMLElement);
      const first = overlay.getBoundingClientRect().left;

      region().dispatchEvent(contextEvent(160, 40));
      await rendered.fixture.whenStable();

      await expect.poll(() => overlay.getBoundingClientRect().left).toBeGreaterThan(first + 80);
      expect(rendered.component.opens()).toBe(1);
    });

    it('always renders in body, outside the host', async () => {
      const rendered = await render();
      await openAt(rendered);

      expect(find(rendered.element, 'wj-contextmenu', HTMLElement).contains(listEl())).toBe(false);
      expect(document.body.contains(listEl())).toBe(true);
      expect(find(document, '[data-pc-section="root"]', HTMLElement).parentElement).toBe(
        document.body,
      );
    });

    it('emits opened and closed once each, however it is closed', async () => {
      const rendered = await render();
      const { component } = rendered;

      await openAt(rendered);
      expect(component.opens()).toBe(1);

      // An outside click, then a second hide while the leave is still ending: one closed.
      await userEvent.click(document.body);
      component.menu().hide();
      await expect.poll(() => component.closes()).toBe(1);
      await expect.poll(() => listEl()).toBeNull();

      component.menu().hide();
      expect(component.closes()).toBe(1);

      await openAt(rendered);
      await closeMenu(rendered, component);
      expect(component.opens()).toBe(2);
      expect(component.closes()).toBe(2);
    });

    it('running an item closes the menu', async () => {
      const run = vi.fn<(event: WjMenuItemCommandEvent) => void>();
      const rendered = await render((host) => {
        host.model.set([{ label: 'Edit', command: run }]);
      });
      await openAt(rendered);

      await (await harnessOf(rendered.fixture)).clickItem('Edit');

      expect(run).toHaveBeenCalledTimes(1);
      await expect.poll(() => rendered.component.closes()).toBe(1);
    });

    it('running an item in a submenu closes the whole menu', async () => {
      const run = vi.fn<(event: WjMenuItemCommandEvent) => void>();
      const rendered = await render((host) => {
        host.model.set([{ label: 'Share', items: [{ label: 'Copy link', command: run }] }]);
      });
      await openAt(rendered);
      await openSubmenu(rendered.fixture, 'Share');

      await (await harnessOf(rendered.fixture)).clickItem('Copy link');

      expect(run).toHaveBeenCalledTimes(1);
      await expect.poll(() => rendered.component.closes()).toBe(1);
      await expect.poll(() => listEl()).toBeNull();
    });

    it('opens a submenu beside its parent on a wide screen', async () => {
      await page.viewport(1280, 800);
      const rendered = await render();
      await openAt(rendered);
      await openSubmenu(rendered.fixture, 'Share');

      const parent = itemEl('Share').getBoundingClientRect();
      const submenu = find(itemEl('Share'), '[role="menu"]', HTMLElement).getBoundingClientRect();
      expect(submenu.left).toBeGreaterThanOrEqual(parent.right - 2);
      expect(Math.abs(submenu.top - parent.top)).toBeLessThan(16);
    });

    it('does not provide or export ContextMenuService', async () => {
      const { fixture } = await render();
      const { injector } = fixture.debugElement.query(By.directive(WjContextMenu));

      expect(() => injector.get(ContextMenuService)).toThrow();
      expect(Object.keys(entry).sort()).toEqual(['WjContextMenu', 'WjContextMenuItemSlot']);
    });
  });

  describe('ARIA', () => {
    it('ariaLabel names the role="menu" list, and the host has no aria attribute', async () => {
      const rendered = await render();
      await openAt(rendered);
      const menu = await harnessOf(rendered.fixture);

      expect(listEl()?.getAttribute('aria-label')).toBe('File');
      expect(await menu.getName()).toBe('File');
      const host = find(rendered.element, 'wj-contextmenu', HTMLElement);
      expect(host.getAttributeNames().filter((name) => name.startsWith('aria-'))).toEqual([]);
    });

    it('ariaLabelledBy names the list through another element', async () => {
      const rendered = await render((host) => {
        host.ariaLabel.set(undefined);
        host.ariaLabelledBy.set('caption');
      });
      await openAt(rendered);
      const menu = await harnessOf(rendered.fixture);

      expect(listEl()?.getAttribute('aria-labelledby')).toBe('caption');
      expect((await menu.getAriaAttributes()).labelledBy).toBe('caption');
      expect(await menu.getName()).toBe('Files');
    });

    it('ariaDescribedBy lands on the root list only, follows the input and clears when unset', async () => {
      const rendered = await render((host) => {
        host.ariaDescribedBy.set('notes');
      });
      const { fixture, component } = rendered;
      await openAt(rendered);
      const menu = await harnessOf(fixture);
      expect((await menu.getAriaAttributes()).describedBy).toBe('notes');

      await openSubmenu(fixture, 'Share');
      const lists = [...document.querySelectorAll('[role="menu"]')];
      expect(lists).toHaveLength(2);
      expect(lists.map((list) => list.getAttribute('aria-describedby'))).toEqual(['notes', null]);

      component.ariaDescribedBy.set('caption');
      await fixture.whenStable();
      expect((await menu.getAriaAttributes()).describedBy).toBe('caption');

      component.ariaDescribedBy.set(undefined);
      await fixture.whenStable();
      expect((await menu.getAriaAttributes()).describedBy).toBeNull();
    });

    it('warns WJ0003 once for aria-* on the host, and does not forward it', async () => {
      TestBed.configureTestingModule({ providers: [provideWeeljack()] });
      const fixture = TestBed.createComponent(AriaOnHostHost);
      await fixture.whenStable();

      expect(warn).toHaveBeenCalledTimes(1);
      expect(String(warn.mock.calls[0]?.[0])).toContain('WJ0003: wj-contextmenu:');
      expect(document.querySelector('[aria-label="File"][role="menu"]')).toBeNull();
    });

    it('warns WJ0001 when provideWeeljack is missing', async () => {
      const fixture = TestBed.createComponent(RoutedHost);
      await fixture.whenStable();

      expect(
        warn.mock.calls.some(([message]) => String(message).startsWith('WJ0001: wj-contextmenu:')),
      ).toBe(true);
    });
  });

  describe('pt', () => {
    it('reaches the inner parts, the submenu included', async () => {
      const rendered = await render((host) => {
        host.pt.set({
          root: { 'data-from-pt': 'root' },
          rootList: { 'data-from-pt': 'root-list' },
          submenu: { 'data-from-pt': 'submenu' },
          item: { 'data-from-pt': 'item' },
        });
      });
      await openAt(rendered);
      await openSubmenu(rendered.fixture, 'Share');

      expect(
        find(document, '[data-pc-section="root"]', HTMLElement).getAttribute('data-from-pt'),
      ).toBe('root');
      expect(listEl()?.getAttribute('data-from-pt')).toBe('root-list');
      expect(itemEl('Open').getAttribute('data-from-pt')).toBe('item');
      expect(find(itemEl('Share'), '[role="menu"]', HTMLElement).getAttribute('data-from-pt')).toBe(
        'submenu',
      );
    });

    it('keeps the routed aria-describedby over a pt value of the same name, and other pt keys', async () => {
      const rendered = await render((host) => {
        host.ariaDescribedBy.set('notes');
        host.pt.set({ rootList: { 'aria-describedby': 'caption', 'data-kept': 'yes' } });
      });
      await openAt(rendered);

      expect(listEl()?.getAttribute('aria-describedby')).toBe('notes');
      expect(listEl()?.getAttribute('data-kept')).toBe('yes');
    });

    it('lets a consumer pt value stay when nothing is routed', async () => {
      const rendered = await render((host) => {
        host.pt.set({ rootList: { 'aria-describedby': 'caption' } });
      });
      await openAt(rendered);

      expect(listEl()?.getAttribute('aria-describedby')).toBe('caption');
    });

    it('takes the function form', async () => {
      const rendered = await render((host) => {
        host.ariaDescribedBy.set('notes');
        host.pt.set(() => ({ rootList: { 'data-fn': 'yes' } }));
      });
      await openAt(rendered);

      expect(listEl()?.getAttribute('data-fn')).toBe('yes');
      expect(listEl()?.getAttribute('aria-describedby')).toBe('notes');
    });
  });

  describe('commands', () => {
    it('runs the command with the click event and the app’s own item object', async () => {
      const run = vi.fn<(event: WjMenuItemCommandEvent) => void>();
      const edit: WjMenuItem = { label: 'Edit', command: run };
      const rendered = await render((host) => {
        host.model.set([edit]);
      });
      await openAt(rendered);

      await (await harnessOf(rendered.fixture)).clickItem('Edit');

      expect(run).toHaveBeenCalledTimes(1);
      const [event] = run.mock.calls[0] ?? [];
      expect(event?.item).toBe(edit);
      expect(event?.originalEvent).toBeInstanceOf(Event);
    });

    it('hands a nested item its own object too', async () => {
      const run = vi.fn<(event: WjMenuItemCommandEvent) => void>();
      const child: WjMenuItem = { label: 'Copy link', command: run };
      const rendered = await render((host) => {
        host.model.set([{ label: 'Share', items: [child] }]);
      });
      await openAt(rendered);
      await openSubmenu(rendered.fixture, 'Share');

      await (await harnessOf(rendered.fixture)).clickItem('Copy link');

      expect(run.mock.calls[0]?.[0].item).toBe(child);
    });

    it('a disabled item reports it, runs nothing on a click and has aria-disabled', async () => {
      const run = vi.fn<(event: WjMenuItemCommandEvent) => void>();
      const rendered = await render((host) => {
        host.model.set([{ label: 'Paste', disabled: true, command: run }, { label: 'Cut' }]);
      });
      await openAt(rendered);
      const menu = await harnessOf(rendered.fixture);

      const [paste] = await menu.getItems({ label: 'Paste' });
      expect(await paste?.isDisabled()).toBe(true);
      expect(itemEl('Paste').getAttribute('aria-disabled')).toBe('true');
      await paste?.click();
      await rendered.fixture.whenStable();

      expect(run).not.toHaveBeenCalled();
    });

    it('never changes the app’s objects', async () => {
      const share: WjMenuItem = { label: 'Share', items: [{ label: 'Copy link' }] };
      const open: WjMenuItem = { label: 'Open', command: () => undefined };
      const model = [open, share];
      const snapshot = JSON.stringify(model, (_key, value: unknown) =>
        typeof value === 'function' ? 'fn' : value,
      );
      const rendered = await render((host) => {
        host.model.set(model);
      });
      await openAt(rendered);
      await openSubmenu(rendered.fixture, 'Share');
      await (await harnessOf(rendered.fixture)).clickItem('Open');

      expect(model).toEqual([open, share]);
      expect(
        JSON.stringify(model, (_key, value: unknown) =>
          typeof value === 'function' ? 'fn' : value,
        ),
      ).toBe(snapshot);
      expect(Object.keys(open)).toEqual(['label', 'command']);
    });
  });

  describe('slot', () => {
    it('renders the consumer’s template for every item, in place of the default label', async () => {
      const rendered = await render((host) => {
        host.withSlot.set(true);
        host.model.set([{ label: 'Open' }, { label: 'Rename…' }]);
      });
      await openAt(rendered);
      const menu = await harnessOf(rendered.fixture);

      expect(await menu.getItemLabels()).toEqual(['Open', 'Rename…']);
      expect(document.querySelectorAll('[role="menuitem"] .icon')).toHaveLength(2);
      expect(document.querySelector('[data-pc-section="itemlabel"]')).toBeNull();
    });

    it('renders it for the items of an open submenu too', async () => {
      const rendered = await render((host) => {
        host.withSlot.set(true);
      });
      await openAt(rendered);
      await openSubmenu(rendered.fixture, 'Share');

      expect(await (await harnessOf(rendered.fixture)).getItemLabels()).toEqual([
        'Open',
        'Rename…',
        'Duplicate',
        'Share',
        'Copy link',
        'Email…',
        'Delete',
      ]);
      expect(document.querySelectorAll('[role="menuitem"] .icon')).toHaveLength(7);
    });

    it('hands the app’s own item objects to the template, not copies', async () => {
      const rendered = await render((host) => {
        host.withSlot.set(true);
      });
      await openAt(rendered);
      await openSubmenu(rendered.fixture, 'Share');

      const positions = [...document.querySelectorAll('.text')].map((text) =>
        text.getAttribute('data-index'),
      );
      expect(positions).toEqual(['0', '1', '2', '3', '4', '5', '7']);
    });

    it('hands a slotted item’s command the app’s object too', async () => {
      const run = vi.fn<(event: WjMenuItemCommandEvent) => void>();
      const edit: WjMenuItem = { label: 'Edit', command: run };
      const rendered = await render((host) => {
        host.withSlot.set(true);
        host.model.set([edit]);
      });
      await openAt(rendered);

      await (await harnessOf(rendered.fixture)).clickItem('Edit');

      expect(run.mock.calls[0]?.[0].item).toBe(edit);
    });

    it('keeps Optimus’s own rendering when no slot is given', async () => {
      const rendered = await render();
      await openAt(rendered);

      expect(document.querySelectorAll('[data-pc-section="itemlabel"]').length).toBeGreaterThan(0);
      expect(document.querySelector('.icon')).toBeNull();
    });

    it('wraps each slotted item in one link box that keeps the item’s padding and size', async () => {
      const rendered = await render((host) => {
        host.withSlot.set(true);
      });
      await openAt(rendered);

      const link = find(document, '[role="menuitem"] a', HTMLAnchorElement);
      expect(link.classList.contains('p-contextmenu-item-link')).toBe(true);
      expect(link.getAttribute('data-pc-section')).toBe('itemlink');
      expect(link.getAttribute('tabindex')).toBe('-1');
      expect(link.hasAttribute('href')).toBe(false);
      expect(link.getBoundingClientRect().height).toBeGreaterThanOrEqual(32);
      expect(getComputedStyle(link).paddingLeft).toBe('12px');
      expect(getComputedStyle(link).paddingTop).toBe('8px');
    });

    it('gives a slotted url item an href and a target', async () => {
      const rendered = await render((host) => {
        host.withSlot.set(true);
        host.model.set([{ label: 'Docs', url: 'https://example.com/', target: '_blank' }]);
      });
      await openAt(rendered);

      const link = find(document, '[role="menuitem"] a', HTMLAnchorElement);
      expect(link.getAttribute('href')).toBe('https://example.com/');
      expect(link.getAttribute('target')).toBe('_blank');
    });

    it('wraps a long slotted label instead of cutting it off', async () => {
      const rendered = await render((host) => {
        host.withSlot.set(true);
        host.model.set([{ label: 'A very long label that keeps going and going '.repeat(6) }]);
      });
      await openAt(rendered);

      const text = find(document, '.text', HTMLElement);
      expect(text.scrollWidth).toBeLessThanOrEqual(text.clientWidth + 1);
      expect(text.getBoundingClientRect().height).toBeGreaterThan(20);
    });
  });

  describe('rendering safety', () => {
    const expectText = (payload: string): void => {
      expect(document.body.textContent).toContain(payload);
      expect(document.querySelector('img')).toBeNull();
      expect(Reflect.get(window, 'wjInjected')).toBeUndefined();
    };

    it('renders a root label as text', async () => {
      const rendered = await render((host) => {
        host.model.set([{ label: PAYLOAD }]);
      });
      await openAt(rendered);

      expectText(PAYLOAD);
    });

    it('renders a parent and a submenu label as text', async () => {
      const rendered = await render((host) => {
        host.model.set([
          { label: PAYLOAD, items: [{ label: `${PAYLOAD} child`, items: [{ label: PAYLOAD }] }] },
        ]);
      });
      await openAt(rendered);
      await openSubmenu(rendered.fixture, PAYLOAD);
      await openSubmenu(rendered.fixture, `${PAYLOAD} child`);

      expectText(PAYLOAD);
      expectText(`${PAYLOAD} child`);
      expect(await (await harnessOf(rendered.fixture)).getItemLabels()).toEqual([
        PAYLOAD,
        `${PAYLOAD} child`,
        PAYLOAD,
      ]);
    });

    it('renders ariaLabel, ariaLabelledBy and ariaDescribedBy as attribute text', async () => {
      const rendered = await render((host) => {
        host.ariaLabel.set(PAYLOAD);
        host.ariaLabelledBy.set(PAYLOAD);
        host.ariaDescribedBy.set(PAYLOAD);
      });
      await openAt(rendered);

      expect(listEl()?.getAttribute('aria-label')).toBe(PAYLOAD);
      expect(listEl()?.getAttribute('aria-labelledby')).toBe(PAYLOAD);
      expect(listEl()?.getAttribute('aria-describedby')).toBe(PAYLOAD);
      expect(document.querySelector('img')).toBeNull();
      expect(Reflect.get(window, 'wjInjected')).toBeUndefined();
    });

    it('renders as text an object that also carries escape: false, styleClass and tooltipOptions', async () => {
      const wider = {
        label: PAYLOAD,
        escape: false,
        styleClass: 'smuggled',
        tooltipOptions: { escape: false },
        items: [{ label: `${PAYLOAD} child`, escape: false, styleClass: 'smuggled' }],
      };
      const smuggled: WjMenuItem = wider;
      const rendered = await render((host) => {
        host.model.set([smuggled, { label: 'Other', escape: false, items: [wider] } as WjMenuItem]);
      });
      await openAt(rendered);
      await openSubmenu(rendered.fixture, PAYLOAD);
      expectText(`${PAYLOAD} child`);
      await openSubmenu(rendered.fixture, 'Other');

      expectText(PAYLOAD);
      expect(document.querySelector('.smuggled')).toBeNull();
    });
  });

  describe('keyboard', () => {
    it('opens with the list focused and no item active, and Arrow Down activates the first one', async () => {
      const rendered = await render();
      await openAt(rendered);

      expect(await (await harnessOf(rendered.fixture)).isFocused()).toBe(true);
      expect(activeLabel()).toBe('');
      await userEvent.keyboard('{ArrowDown}');
      await expect.poll(activeLabel).toBe('Open');
    });

    it('Arrow Down and Arrow Up move the active item, Home and End jump', async () => {
      const rendered = await render();
      await openAt(rendered);

      await userEvent.keyboard('{ArrowDown}{ArrowDown}');
      await expect.poll(activeLabel).toBe('Rename…');
      await userEvent.keyboard('{ArrowUp}');
      await expect.poll(activeLabel).toBe('Open');
      await userEvent.keyboard('{End}');
      await expect.poll(activeLabel).toBe('Delete');
      await userEvent.keyboard('{Home}');
      await expect.poll(activeLabel).toBe('Open');
    });

    it('skips a disabled item with the arrow keys', async () => {
      const rendered = await render((host) => {
        host.model.set([{ label: 'Cut' }, { label: 'Paste', disabled: true }, { label: 'Select' }]);
      });
      await openAt(rendered);

      await userEvent.keyboard('{ArrowDown}{ArrowDown}');

      await expect.poll(activeLabel).toBe('Select');
    });

    it('Enter and Space run the active item and close the menu', async () => {
      const run = vi.fn<(event: WjMenuItemCommandEvent) => void>();
      const rendered = await render((host) => {
        host.model.set([{ label: 'Edit', command: run }]);
      });
      await openAt(rendered);
      await userEvent.keyboard('{ArrowDown}');
      await expect.poll(activeLabel).toBe('Edit');
      await userEvent.keyboard('{Enter}');

      expect(run).toHaveBeenCalledTimes(1);
      await expect.poll(() => rendered.component.closes()).toBe(1);

      await openAt(rendered);
      await userEvent.keyboard('{ArrowDown}');
      await expect.poll(activeLabel).toBe('Edit');
      await userEvent.keyboard(' ');

      await expect.poll(() => run.mock.calls.length).toBe(2);
      await expect.poll(() => rendered.component.closes()).toBe(2);
    });

    it('Arrow Right opens the submenu and moves into it, Arrow Left closes it and moves back', async () => {
      const rendered = await render();
      await openAt(rendered);
      await userEvent.keyboard('{End}{ArrowUp}');
      await expect.poll(activeLabel).toBe('Share');

      await userEvent.keyboard('{ArrowRight}');
      await expect.poll(activeLabel).toBe('Copy link');
      expect(await (await harnessOf(rendered.fixture)).getItemLabels()).toContain('Email…');

      await userEvent.keyboard('{ArrowLeft}');
      await expect.poll(activeLabel).toBe('Share');
      await expect
        .poll(async () => (await harnessOf(rendered.fixture)).getItemLabels())
        .not.toContain('Email…');
    });

    it('Enter on a parent opens its submenu, and Enter on a child runs it', async () => {
      const run = vi.fn<(event: WjMenuItemCommandEvent) => void>();
      const rendered = await render((host) => {
        host.model.set([{ label: 'Share', items: [{ label: 'Copy link', command: run }] }]);
      });
      await openAt(rendered);
      await userEvent.keyboard('{ArrowDown}{Enter}');
      await expect.poll(activeLabel).toBe('Share');
      expect(run).not.toHaveBeenCalled();
      await userEvent.keyboard('{ArrowRight}');
      await expect.poll(activeLabel).toBe('Copy link');
      await userEvent.keyboard('{Enter}');

      expect(run).toHaveBeenCalledTimes(1);
      await expect.poll(() => rendered.component.closes()).toBe(1);
    });

    it('Enter runs a slotted item exactly as a plain one', async () => {
      const run = vi.fn<(event: WjMenuItemCommandEvent) => void>();
      const rendered = await render((host) => {
        host.withSlot.set(true);
        host.model.set([{ label: 'Edit', command: run }]);
      });
      await openAt(rendered);

      await userEvent.keyboard('{ArrowDown}{Enter}');

      expect(run).toHaveBeenCalledTimes(1);
      await expect.poll(() => rendered.component.closes()).toBe(1);
    });

    it('Escape closes the menu and returns focus to the target', async () => {
      const rendered = await render();
      region().focus();
      await openAt(rendered);
      await userEvent.keyboard('{ArrowDown}');
      await expect.poll(activeLabel).toBe('Open');

      await userEvent.keyboard('{Escape}');

      await expect.poll(() => rendered.component.closes()).toBe(1);
      expect(document.activeElement).toBe(region());
      await expect.poll(() => listEl()).toBeNull();
    });

    it('Enter on an item runs it, closes the menu and returns focus to the target', async () => {
      const run = vi.fn<(event: WjMenuItemCommandEvent) => void>();
      const rendered = await render((host) => {
        host.model.set([{ label: 'Edit', command: run }]);
      });
      region().focus();
      await openAt(rendered);

      await userEvent.keyboard('{ArrowDown}{Enter}');

      expect(run).toHaveBeenCalledTimes(1);
      await expect.poll(() => rendered.component.closes()).toBe(1);
      expect(document.activeElement).toBe(region());
    });

    it('a click on an item returns focus to the target', async () => {
      const rendered = await render();
      region().focus();
      await openAt(rendered);

      await (await harnessOf(rendered.fixture)).clickItem('Open');

      await expect.poll(() => rendered.component.closes()).toBe(1);
      expect(document.activeElement).toBe(region());
    });

    it('Tab closes the menu and focus lands on a tab stop, never on body', async () => {
      const rendered = await render();
      region().focus();
      await openAt(rendered);

      await userEvent.keyboard('{Tab}');

      await expect.poll(() => rendered.component.closes()).toBe(1);
      await expect.poll(() => document.activeElement).not.toBe(document.body);
      expect([region(), other()]).toContain(document.activeElement);
      await expect.poll(() => listEl()).toBeNull();
    });

    it('leaves focus alone when an item’s command moved it elsewhere', async () => {
      const rendered = await render((host) => {
        host.model.set([
          {
            label: 'Edit',
            command: () => {
              other().focus();
            },
          },
        ]);
      });
      region().focus();
      await openAt(rendered);

      await userEvent.keyboard('{ArrowDown}{Enter}');

      await expect.poll(() => rendered.component.closes()).toBe(1);
      expect(document.activeElement).toBe(other());
    });

    it('leaves focus alone when an outside click took it to another control', async () => {
      const rendered = await render();
      region().focus();
      await openAt(rendered);

      await userEvent.click(other());

      await expect.poll(() => rendered.component.closes()).toBe(1);
      expect(document.activeElement).toBe(other());
    });

    it('with nothing focused when it opened, closes without throwing and does not steal focus', async () => {
      const rendered = await render(globalMenu);
      expect(document.activeElement).toBe(document.body);
      await openAt(rendered, document.body);

      await userEvent.keyboard('{Escape}');

      await expect.poll(() => rendered.component.closes()).toBe(1);
      await expect.poll(() => listEl()).toBeNull();
      expect(document.activeElement).toBe(document.body);
    });
  });

  describe('accessibility', () => {
    const states: Record<string, (host: Host) => void> = {
      'open at a target': () => undefined,
      'a disabled item': (host) => {
        host.model.set([
          { label: 'Cut' },
          { label: 'Paste', disabled: true },
          { label: 'Select all' },
        ]);
      },
      'the item slot in use': (host) => {
        host.withSlot.set(true);
      },
      global: globalMenu,
    };

    for (const scheme of ['light', 'dark'] as const) {
      for (const [name, setup] of Object.entries(states)) {
        it(`has no axe violations: ${name}, ${scheme}`, async () => {
          const rendered = await render(setup, scheme);
          await openAt(rendered, name === 'global' ? other() : region());

          await expectNoAxeViolations();
        });
      }

      it(`has no axe violations: closed, ${scheme}`, async () => {
        await render(() => undefined, scheme);

        await expectNoAxeViolations();
      });

      it(`has no axe violations: a submenu open, ${scheme}`, async () => {
        await page.viewport(1280, 800);
        const rendered = await render(() => undefined, scheme);
        await openAt(rendered);
        await openSubmenu(rendered.fixture, 'Share');

        await expectOnlyTheParentNameGap();
      });

      it(`has no axe violations: a submenu open with the item slot, ${scheme}`, async () => {
        await page.viewport(1280, 800);
        const rendered = await render((host) => {
          host.withSlot.set(true);
        }, scheme);
        await openAt(rendered);
        await openSubmenu(rendered.fixture, 'Share');

        await expectOnlyTheParentNameGap();
      });
    }

    it('gives every item a hit box of at least 24 × 24 px, slotted ones too', async () => {
      const rendered = await render();
      await openAt(rendered);
      const sizes = (): DOMRect[] =>
        [...document.querySelectorAll('[role="menuitem"]')].map(
          (item) =>
            item.querySelector('[data-pc-section="itemcontent"]')?.getBoundingClientRect() ??
            new DOMRect(),
        );

      for (const box of sizes()) {
        expect(box.height).toBeGreaterThanOrEqual(24);
        expect(box.width).toBeGreaterThanOrEqual(24);
      }
      await closeMenu(rendered, rendered.component);
      rendered.component.withSlot.set(true);
      await rendered.fixture.whenStable();
      await openAt(rendered);
      await openSubmenu(rendered.fixture, 'Share');
      expect(sizes()).toHaveLength(7);
      for (const box of sizes()) {
        expect(box.height).toBeGreaterThanOrEqual(24);
        expect(box.width).toBeGreaterThanOrEqual(24);
      }
    });
  });

  describe('motion', () => {
    it('plays no enter or leave motion under reduced motion, and still emits opened and closed', async () => {
      const rendered = await render();
      const read = recordClasses();

      await openAt(rendered);
      await closeMenu(rendered, rendered.component);

      expect(motionClasses(read())).toEqual([]);
      expect(rendered.component.opens()).toBe(1);
      await expect.poll(() => rendered.component.closes()).toBe(1);
    });

    it('plays the motion when the reader has not asked for less, so the recorder sees it', async () => {
      reduceMotion(false);
      const rendered = await render();
      const read = recordClasses();

      await openAt(rendered);
      await closeMenu(rendered, rendered.component);

      expect(motionClasses(read()).length).toBeGreaterThan(0);
    });
  });
});
