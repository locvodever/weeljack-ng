/// <reference types="@vitest/browser-playwright" />
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Component, signal, viewChild } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import type { MockInstance } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { provideWeeljack, type WjMenuItem, type WjMenuItemCommandEvent } from 'weeljack-ng';
import { WjButton } from 'weeljack-ng/button';
import { WjTieredMenu, WjTieredMenuItemSlot, type WjTieredMenuPt } from 'weeljack-ng/tieredmenu';
import { WjTieredMenuHarness } from 'weeljack-ng/tieredmenu/testing';
import { expectNoAxeViolations, runAxe } from '../spec-support/axe';

const PAYLOAD = '<img src=x onerror="window.wjInjected = true">';
const ROOT = document.documentElement;

const fileMenu = (): WjMenuItem[] => [
  { label: 'New', items: [{ label: 'Document' }, { label: 'Spreadsheet' }, { label: 'Folder' }] },
  { label: 'Open…' },
  { label: 'Export', items: [{ label: 'PDF' }, { label: 'CSV' }] },
  { separator: true },
  { label: 'Print…' },
];

/** Every item of a model, parents before their children, as the slot sees them. */
const flatten = (items: readonly WjMenuItem[]): WjMenuItem[] =>
  items.flatMap((item) => [item, ...flatten(item.items ?? [])]);

/** A consumer's template: two openers, then one menu, optionally with an item slot. */
@Component({
  selector: 'wj-tieredmenu-host',
  imports: [WjButton, WjTieredMenu, WjTieredMenuItemSlot],
  styles: `
    .stage {
      min-block-size: 24rem;
      max-inline-size: 16rem;
    }

    .row {
      display: flex;
      align-items: flex-end;
      gap: 8px;
    }
  `,
  template: `
    <div class="stage">
      <p id="caption">Document</p>
      <p id="notes">Use the arrow keys.</p>
      <div class="row">
        <button id="trigger" type="button" (click)="menu.toggle($event)">File</button>
        @if (withWjTrigger()) {
          <wj-button id="wj-trigger" label="More" (click)="menu.toggle($event)" />
        }
      </div>
      <wj-tieredmenu
        #menu
        [model]="model()"
        [popup]="popup()"
        [appendTo]="appendTo()"
        [ariaLabel]="ariaLabel()"
        [ariaLabelledBy]="ariaLabelledBy()"
        [ariaDescribedBy]="ariaDescribedBy()"
        [pt]="pt()"
        (opened)="opens.update(countUp)"
        (closed)="closes.update(countUp)"
      >
        @if (withSlot()) {
          <ng-template wjTieredMenuItem let-item let-hasSubmenu="hasSubmenu">
            <span class="icon" aria-hidden="true"></span>
            <span class="text" [attr.data-index]="position(item)">{{ item.label }}</span>
            @if (hasSubmenu) {
              <span class="chevron" aria-hidden="true"></span>
            }
          </ng-template>
        }
      </wj-tieredmenu>
      <button id="after" type="button">After</button>
    </div>
  `,
})
class Host {
  readonly menu = viewChild.required(WjTieredMenu);
  readonly model = signal<WjMenuItem[]>(fileMenu());
  readonly popup = signal(false);
  readonly appendTo = signal<'self' | 'body'>('self');
  readonly ariaLabel = signal<string | undefined>('File');
  readonly ariaLabelledBy = signal<string | undefined>(undefined);
  readonly ariaDescribedBy = signal<string | undefined>(undefined);
  readonly pt = signal<WjTieredMenuPt>(undefined);
  readonly withSlot = signal(false);
  readonly withWjTrigger = signal(false);
  readonly opens = signal(0);
  readonly closes = signal(0);
  readonly countUp = (count: number): number => count + 1;
  readonly position = (item: WjMenuItem): number => flatten(this.model()).indexOf(item);
}

/** A consumer who writes aria-* on the host. */
@Component({
  selector: 'wj-tieredmenu-aria-on-host-host',
  imports: [WjTieredMenu],
  template: `<wj-tieredmenu aria-label="File" [model]="model" />`,
})
class AriaOnHostHost {
  readonly model = fileMenu();
}

/** A menu rendered without `provideWeeljack`. */
@Component({
  selector: 'wj-tieredmenu-routed-host',
  imports: [WjTieredMenu],
  template: `<wj-tieredmenu [model]="model" ariaLabel="File" />`,
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
const trigger = (): HTMLElement => find(document, '#trigger', HTMLElement);
const after = (): HTMLElement => find(document, '#after', HTMLElement);
const wjTrigger = (): HTMLElement => find(document, '#wj-trigger button', HTMLElement);
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

const popupHost = (host: Host): void => {
  host.popup.set(true);
};

const withWjTrigger = (host: Host): void => {
  popupHost(host);
  host.withWjTrigger.set(true);
};

const harnessOf = (fixture: ComponentFixture<unknown>): Promise<WjTieredMenuHarness> =>
  TestbedHarnessEnvironment.loader(fixture).getHarness(WjTieredMenuHarness);

/** Opens the popup from a click on `opener` and waits until it has entered (`opened` emitted). */
async function openFrom(
  { fixture, component }: Rendered,
  opener: () => HTMLElement = trigger,
): Promise<void> {
  const before = component.opens();
  await userEvent.click(opener());
  await fixture.whenStable();
  await expect.poll(() => component.opens()).toBe(before + 1);
  await expect.poll(() => document.activeElement?.getAttribute('role')).toBe('menu');
}

/** Closes the popup from the app and waits for the leave to end. */
async function closePopup({ fixture }: Rendered, host: Host): Promise<void> {
  host.menu().hide();
  await fixture.whenStable();
  await expect.poll(() => listEl()).toBeNull();
}

/** The own text of the active item, which is where the keyboard is. */
const activeLabel = (): string =>
  document
    .querySelector('[role="menuitem"][data-p-focused="true"] > [data-pc-section="itemcontent"]')
    ?.textContent.trim() ?? '';

/** Tabs onto the list of an inline menu and waits for the first item to become active. */
async function tabOntoList(): Promise<void> {
  // The opener comes first in the page, then the list: Tab until it arrives, with a bound.
  for (let tabs = 0; tabs < 3 && document.activeElement?.getAttribute('role') !== 'menu'; tabs++) {
    await userEvent.tab();
  }
  await expect.poll(() => document.activeElement?.getAttribute('role')).toBe('menu');
}

/** Tabs onto the list, then presses Arrow Down once: Optimus activates no item before that. */
async function activateFirstItem(): Promise<void> {
  await tabOntoList();
  await userEvent.keyboard('{ArrowDown}');
  await expect.poll(activeLabel).not.toBe('');
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

/** Opens the submenu of the item labelled `label` through the harness and waits for it. */
async function openSubmenu(fixture: ComponentFixture<unknown>, label: string): Promise<void> {
  const [item] = await (await harnessOf(fixture)).getItems({ label });
  await item?.openSubmenu();
  await expect.poll(async () => item?.isSubmenuOpen()).toBe(true);
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

describe('WjTieredMenu', () => {
  let warn: MockInstance<typeof console.warn>;
  const viewport = { width: window.innerWidth, height: window.innerHeight };

  beforeEach(() => {
    warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    // Motion is off unless a spec turns it on: an open or a close then ends at once.
    reduceMotion(true);
  });

  afterEach(async () => {
    // An overlay left open at teardown would reach the next spec: close it and wait for the leave.
    if (current && listEl() && current.component.popup()) {
      await closePopup(current, current.component);
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
    it('model renders the top level in a role="menu" list, and follows a new array', async () => {
      const { fixture, component } = await render();
      const menu = await harnessOf(fixture);

      expect(await menu.getItemLabels()).toEqual(['New', 'Open…', 'Export', 'Print…']);
      expect(listEl()?.tagName).toBe('UL');
      expect(await menu.getSeparatorCount()).toBe(1);

      component.model.set([{ label: 'Undo' }, { label: 'Redo' }]);
      await fixture.whenStable();
      expect(await menu.getItemLabels()).toEqual(['Undo', 'Redo']);
    });

    it('with no items renders nothing: no box, no list, no tab stop, a host with no height', async () => {
      const { fixture, component, element } = await render((host) => {
        host.model.set([]);
      });
      const menu = await harnessOf(fixture);
      const host = find(element, 'wj-tieredmenu', HTMLElement);

      expect(element.querySelector('p-tieredmenu')).toBeNull();
      expect(listEl()).toBeNull();
      expect(getComputedStyle(host).display).toBe('block');
      expect(host.getBoundingClientRect().height).toBe(0);
      expect(await menu.isOpen()).toBe(false);

      component.model.set(fileMenu());
      await fixture.whenStable();
      expect(await menu.isOpen()).toBe(true);
    });

    it('with no items, toggle and show do nothing and emit nothing', async () => {
      const rendered = await render((host) => {
        host.model.set([]);
        popupHost(host);
      });

      await userEvent.click(trigger());
      rendered.component.menu().show(new Event('click'));
      await rendered.fixture.whenStable();

      expect(listEl()).toBeNull();
      expect(rendered.component.opens()).toBe(0);
    });

    it('marks an item with items as having a submenu, and opens it from the harness', async () => {
      const { fixture } = await render();
      const menu = await harnessOf(fixture);
      const [parent, leaf] = await menu.getItems();

      expect(await parent?.hasSubmenu()).toBe(true);
      expect(await leaf?.hasSubmenu()).toBe(false);
      expect(await parent?.isSubmenuOpen()).toBe(false);

      await parent?.openSubmenu();

      await expect.poll(async () => parent?.isSubmenuOpen()).toBe(true);
      expect(await menu.getItemLabels()).toEqual([
        'New',
        'Document',
        'Spreadsheet',
        'Folder',
        'Open…',
        'Export',
        'Print…',
      ]);
      await expect(leaf?.openSubmenu()).rejects.toThrow('wj-tieredmenu: the item has no submenu');
    });

    it('opens one branch at a time', async () => {
      const { fixture } = await render();
      const menu = await harnessOf(fixture);

      await openSubmenu(fixture, 'New');
      await openSubmenu(fixture, 'Export');

      await expect
        .poll(() => menu.getItemLabels())
        .toEqual(['New', 'Open…', 'Export', 'PDF', 'CSV', 'Print…']);
    });

    it('opens a submenu beside its parent on a wide screen, level with it', async () => {
      await page.viewport(1280, 800);
      const { fixture } = await render();
      await openSubmenu(fixture, 'New');

      const flyout = find(itemEl('New'), '[role="menu"]', HTMLElement);
      await expect.poll(() => flyout.getBoundingClientRect().width).toBeGreaterThan(0);
      const parent = itemEl('New').getBoundingClientRect();
      const box = flyout.getBoundingClientRect();

      expect(box.left).toBeGreaterThanOrEqual(parent.right - 4);
      expect(Math.abs(box.top - parent.top)).toBeLessThanOrEqual(8);
    });

    it('opens a submenu in place below its parent on a narrow screen', async () => {
      await page.viewport(600, 800);
      const { fixture } = await render();
      await openSubmenu(fixture, 'New');

      const parent = find(itemEl('New'), '[data-pc-section="itemcontent"]', HTMLElement);
      const inPlace = find(itemEl('New'), '[role="menu"]', HTMLElement);
      await expect.poll(() => inPlace.getBoundingClientRect().height).toBeGreaterThan(0);

      expect(inPlace.getBoundingClientRect().top).toBeGreaterThanOrEqual(
        parent.getBoundingClientRect().bottom - 1,
      );
      expect(inPlace.getBoundingClientRect().left).toBeLessThan(
        parent.getBoundingClientRect().right,
      );
    });

    it('leaves out an item with visible false', async () => {
      const { fixture } = await render((host) => {
        host.model.set([{ label: 'New' }, { label: 'Hidden', visible: false }, { label: 'Save' }]);
      });

      expect(await (await harnessOf(fixture)).getItemLabels()).toEqual(['New', 'Save']);
    });

    it('a disabled item reports it, runs nothing on a click and has aria-disabled', async () => {
      const run = vi.fn<(event: WjMenuItemCommandEvent) => void>();
      const { fixture } = await render((host) => {
        host.model.set([
          { label: 'Cut', command: run },
          { label: 'Paste', command: run, disabled: true },
        ]);
      });
      const menu = await harnessOf(fixture);
      const [cut, paste] = await menu.getItems();

      expect(await cut?.isDisabled()).toBe(false);
      expect(await paste?.isDisabled()).toBe(true);
      expect(getComputedStyle(itemEl('Paste')).pointerEvents).toBe('none');
      await paste?.click();
      expect(run).not.toHaveBeenCalled();
      await cut?.click();
      expect(run).toHaveBeenCalledTimes(1);
    });

    it('a url item is a real link, with its target', async () => {
      await render((host) => {
        host.model.set([{ label: 'Docs', url: 'https://example.com/docs', target: '_blank' }]);
      });

      const link = find(document, '[role="menuitem"] a', HTMLAnchorElement);
      expect(link.getAttribute('href')).toBe('https://example.com/docs');
      expect(link.getAttribute('target')).toBe('_blank');
    });

    it('popup renders nothing while closed, and toggle opens and closes it with opened and closed', async () => {
      const rendered = await render(popupHost);
      const { fixture, component } = rendered;
      const menu = await harnessOf(fixture);

      expect(await menu.isOpen()).toBe(false);
      expect(
        find(rendered.element, 'wj-tieredmenu', HTMLElement).getBoundingClientRect().height,
      ).toBe(0);

      await openFrom(rendered);
      expect(await menu.isOpen()).toBe(true);
      expect(await menu.getItemLabels()).toEqual(['New', 'Open…', 'Export', 'Print…']);
      expect(component.opens()).toBe(1);

      await userEvent.click(trigger());
      await expect.poll(() => component.closes()).toBe(1);
      expect(await menu.isOpen()).toBe(false);
    });

    it('show opens it, hide closes it, and the popup is aligned to the event target', async () => {
      const rendered = await render(popupHost);
      const { fixture, component } = rendered;
      const opener = trigger();

      component
        .menu()
        .show(Object.defineProperty(new Event('click'), 'currentTarget', { value: opener }));
      await fixture.whenStable();
      await expect.poll(() => component.opens()).toBe(1);

      const overlay = find(document, '[data-pc-section="root"]', HTMLElement);
      expect(Math.round(overlay.getBoundingClientRect().left)).toBe(
        Math.round(opener.getBoundingClientRect().left),
      );
      expect(overlay.getBoundingClientRect().top).toBeGreaterThanOrEqual(
        opener.getBoundingClientRect().bottom - 1,
      );

      component.menu().hide();
      await fixture.whenStable();
      await expect.poll(() => component.closes()).toBe(1);
    });

    it('appendTo self keeps the popup inside the host, body moves it out', async () => {
      const rendered = await render(popupHost);
      const { fixture, component, element } = rendered;
      await openFrom(rendered);
      expect(find(element, 'wj-tieredmenu', HTMLElement).contains(listEl())).toBe(true);
      await closePopup(rendered, component);

      component.appendTo.set('body');
      await fixture.whenStable();
      await openFrom(rendered);
      expect(find(element, 'wj-tieredmenu', HTMLElement).contains(listEl())).toBe(false);
      expect(document.body.contains(listEl())).toBe(true);
      // The harness finds a popup that lives in the document.
      const menu = await harnessOf(fixture);
      expect(await menu.isOpen()).toBe(true);
      expect(await menu.getItemLabels()).toEqual(['New', 'Open…', 'Export', 'Print…']);
    });

    it('opened and closed also fire for a popup closed by an outside click', async () => {
      const rendered = await render(popupHost);
      await openFrom(rendered);

      await userEvent.click(document.body);

      await expect.poll(() => rendered.component.closes()).toBe(1);
      expect(listEl()).toBeNull();
    });

    it('running an item closes a popup', async () => {
      const run = vi.fn<(event: WjMenuItemCommandEvent) => void>();
      const rendered = await render((host) => {
        popupHost(host);
        host.model.set([{ label: 'Edit', command: run }]);
      });
      await openFrom(rendered);

      await (await harnessOf(rendered.fixture)).clickItem('Edit');

      expect(run).toHaveBeenCalledTimes(1);
      await expect.poll(() => rendered.component.closes()).toBe(1);
    });

    it('running an item in a submenu of a popup closes the whole popup', async () => {
      const run = vi.fn<(event: WjMenuItemCommandEvent) => void>();
      const rendered = await render((host) => {
        popupHost(host);
        host.model.set([{ label: 'New', items: [{ label: 'Document', command: run }] }]);
      });
      await openFrom(rendered);
      await openSubmenu(rendered.fixture, 'New');

      await (await harnessOf(rendered.fixture)).clickItem('Document');

      expect(run).toHaveBeenCalledTimes(1);
      await expect.poll(() => rendered.component.closes()).toBe(1);
      await expect.poll(() => listEl()).toBeNull();
    });
  });

  describe('ARIA', () => {
    it('ariaLabel names the role="menu" list, and the host has no aria attribute', async () => {
      const { fixture, element } = await render();
      const menu = await harnessOf(fixture);

      expect(await menu.getName()).toBe('File');
      expect(listEl()?.getAttribute('role')).toBe('menu');
      expect(find(element, 'wj-tieredmenu', HTMLElement).getAttributeNames()).not.toContain(
        'aria-label',
      );
    });

    it('ariaLabelledBy names the list through another element', async () => {
      const { fixture } = await render((host) => {
        host.ariaLabel.set(undefined);
        host.ariaLabelledBy.set('caption');
      });
      const menu = await harnessOf(fixture);

      expect(await menu.getAriaAttributes()).toMatchObject({ label: null, labelledBy: 'caption' });
      expect(await menu.getName()).toBe('Document');
    });

    it('ariaDescribedBy lands on the root list only, follows the input and clears when unset', async () => {
      const { fixture, component } = await render((host) => {
        host.ariaDescribedBy.set('notes');
      });
      const menu = await harnessOf(fixture);
      expect((await menu.getAriaAttributes()).describedBy).toBe('notes');

      await openSubmenu(fixture, 'New');
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
      expect(String(warn.mock.calls[0]?.[0])).toContain('WJ0003: wj-tieredmenu:');
      const list = find(fixture.nativeElement as HTMLElement, '[role="menu"]', HTMLElement);
      expect(list.getAttribute('aria-label')).toBeNull();
    });

    it('warns WJ0001 when provideWeeljack is missing', async () => {
      const fixture = TestBed.createComponent(RoutedHost);
      await fixture.whenStable();

      expect(
        warn.mock.calls.some(([message]) => String(message).startsWith('WJ0001: wj-tieredmenu:')),
      ).toBe(true);
    });
  });

  describe('pt', () => {
    it('reaches the inner parts, the submenu included', async () => {
      const { fixture } = await render((host) => {
        host.pt.set({
          rootList: { 'data-from-pt': 'root-list' },
          submenu: { 'data-from-pt': 'submenu' },
          item: { 'data-from-pt': 'item' },
        });
      });
      await openSubmenu(fixture, 'New');

      expect(listEl()?.getAttribute('data-from-pt')).toBe('root-list');
      expect(itemEl('Open…').getAttribute('data-from-pt')).toBe('item');
      expect(find(itemEl('New'), '[role="menu"]', HTMLElement).getAttribute('data-from-pt')).toBe(
        'submenu',
      );
    });

    it('keeps the routed aria-describedby over a pt value of the same name, and other pt keys', async () => {
      await render((host) => {
        host.ariaDescribedBy.set('notes');
        host.pt.set({ rootList: { 'aria-describedby': 'caption', 'data-kept': 'yes' } });
      });

      expect(listEl()?.getAttribute('aria-describedby')).toBe('notes');
      expect(listEl()?.getAttribute('data-kept')).toBe('yes');
    });

    it('lets a consumer pt value stay when nothing is routed', async () => {
      await render((host) => {
        host.pt.set({ rootList: { 'aria-describedby': 'caption' } });
      });

      expect(listEl()?.getAttribute('aria-describedby')).toBe('caption');
    });

    it('takes the function form', async () => {
      await render((host) => {
        host.ariaDescribedBy.set('notes');
        host.pt.set(() => ({ rootList: { 'data-fn': 'yes' } }));
      });

      expect(listEl()?.getAttribute('data-fn')).toBe('yes');
      expect(listEl()?.getAttribute('aria-describedby')).toBe('notes');
    });
  });

  describe('commands', () => {
    it('runs the command with the click event and the app’s own item object', async () => {
      const received: WjMenuItemCommandEvent[] = [];
      const save: WjMenuItem = {
        label: 'Save',
        command: (event) => {
          received.push(event);
        },
      };
      const { fixture } = await render((host) => {
        host.model.set([{ label: 'New' }, save]);
      });

      await (await harnessOf(fixture)).clickItem('Save');

      expect(received).toHaveLength(1);
      expect(received[0]?.item).toBe(save);
      expect(received[0]?.originalEvent).toBeInstanceOf(MouseEvent);
    });

    it('hands a nested item its own object too', async () => {
      const received: WjMenuItem[] = [];
      const child: WjMenuItem = {
        label: 'Document',
        command: ({ item }) => {
          received.push(item);
        },
      };
      const { fixture } = await render((host) => {
        host.model.set([{ label: 'New', items: [child] }]);
      });
      await openSubmenu(fixture, 'New');

      await (await harnessOf(fixture)).clickItem('Document');

      expect(received).toEqual([child]);
      expect(received[0]).toBe(child);
    });

    it('never changes the app’s objects', async () => {
      const items: WjMenuItem[] = [
        {
          label: 'File',
          expanded: false,
          items: [{ label: 'New', command: () => undefined }],
        },
      ];
      const before = JSON.stringify(items);
      const { fixture } = await render((host) => {
        host.model.set(items);
      });
      await openSubmenu(fixture, 'File');

      await (await harnessOf(fixture)).clickItem('New');

      expect(items[0]).not.toHaveProperty('escape');
      expect(JSON.stringify(items)).toBe(before);
      expect(items[0]?.items?.[0]).not.toHaveProperty('escape');
    });
  });

  describe('slot', () => {
    it('renders the consumer’s template for every item, in place of the default label', async () => {
      const { fixture } = await render((host) => {
        host.withSlot.set(true);
        host.model.set([{ label: 'New' }, { label: 'Open…' }]);
      });
      const menu = await harnessOf(fixture);

      expect(await menu.getItemLabels()).toEqual(['New', 'Open…']);
      expect(document.querySelectorAll('[role="menuitem"] .icon')).toHaveLength(2);
      expect(document.querySelector('[data-pc-section="itemlabel"]')).toBeNull();
    });

    it('renders it for the items of an open submenu too', async () => {
      const { fixture } = await render((host) => {
        host.withSlot.set(true);
      });
      await openSubmenu(fixture, 'New');

      expect(document.querySelectorAll('[role="menuitem"] .icon')).toHaveLength(7);
      expect(await (await harnessOf(fixture)).getItemLabels()).toContain('Spreadsheet');
    });

    it('tells the template which items have a submenu', async () => {
      const { fixture } = await render((host) => {
        host.withSlot.set(true);
      });
      await openSubmenu(fixture, 'New');

      const withChevron = [...document.querySelectorAll('[role="menuitem"]')]
        .filter((item) => item.querySelector(':scope > [data-pc-section="itemcontent"] .chevron'))
        .map((item) => item.getAttribute('aria-label'));
      expect(withChevron).toEqual(['New', 'Export']);
      expect(document.querySelector('[data-p-icon="angle-right"]')).toBeNull();
    });

    it('hands the app’s own item objects to the template, not copies', async () => {
      const { fixture } = await render((host) => {
        host.withSlot.set(true);
      });
      await openSubmenu(fixture, 'Export');

      // `indexOf` finds an item only by identity: -1 would mean the template got a copy.
      const indices = [...document.querySelectorAll('.text')].map((node) =>
        node.getAttribute('data-index'),
      );
      expect(indices).toEqual(['0', '4', '5', '6', '7', '9']);
    });

    it('hands a slotted item’s command the app’s object too', async () => {
      const seen: unknown[] = [];
      const open: WjMenuItem = {
        label: 'Open…',
        command: ({ item }) => {
          seen.push(item);
        },
      };
      const { fixture } = await render((host) => {
        host.withSlot.set(true);
        host.model.set([open]);
      });

      await (await harnessOf(fixture)).clickItem('Open…');

      expect(seen).toHaveLength(1);
      expect(seen[0]).toBe(open);
    });

    it('keeps Optimus’s own rendering when no slot is given', async () => {
      await render();

      expect(document.querySelector('[role="menuitem"] .icon')).toBeNull();
      expect(document.querySelector('[data-pc-section="itemlabel"]')).not.toBeNull();
      expect(document.querySelector('[data-p-icon="angle-right"]')).not.toBeNull();
    });

    it('wraps each slotted item in one link box that keeps the item’s padding and size', async () => {
      await render((host) => {
        host.withSlot.set(true);
      });

      const link = find(document, '[role="menuitem"] a', HTMLAnchorElement);
      expect(link.classList.contains('p-tieredmenu-item-link')).toBe(true);
      expect(link.getAttribute('data-pc-section')).toBe('itemlink');
      expect(link.getAttribute('tabindex')).toBe('-1');
      expect(link.hasAttribute('href')).toBe(false);
      expect(link.getBoundingClientRect().height).toBeGreaterThanOrEqual(32);
      expect(getComputedStyle(link).paddingLeft).toBe('12px');
      expect(getComputedStyle(link).paddingTop).toBe('8px');
    });

    it('gives a slotted url item an href and a target', async () => {
      await render((host) => {
        host.withSlot.set(true);
        host.model.set([{ label: 'Docs', url: 'https://example.com/', target: '_blank' }]);
      });

      const link = find(document, '[role="menuitem"] a', HTMLAnchorElement);
      expect(link.getAttribute('href')).toBe('https://example.com/');
      expect(link.getAttribute('target')).toBe('_blank');
    });

    it('wraps a long slotted label instead of cutting it off', async () => {
      await render((host) => {
        host.withSlot.set(true);
        host.model.set([{ label: 'A very long label that keeps going and going '.repeat(6) }]);
      });

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
      await render((host) => {
        host.model.set([{ label: PAYLOAD }]);
      });

      expectText(PAYLOAD);
    });

    it('renders a parent and a submenu label as text', async () => {
      const { fixture } = await render((host) => {
        host.model.set([
          { label: PAYLOAD, items: [{ label: `${PAYLOAD} child`, items: [{ label: PAYLOAD }] }] },
        ]);
      });
      await openSubmenu(fixture, PAYLOAD);
      await openSubmenu(fixture, `${PAYLOAD} child`);

      expectText(PAYLOAD);
      expectText(`${PAYLOAD} child`);
      expect(await (await harnessOf(fixture)).getItemLabels()).toEqual([
        PAYLOAD,
        `${PAYLOAD} child`,
        PAYLOAD,
      ]);
    });

    it('renders ariaLabel, ariaLabelledBy and ariaDescribedBy as attribute text', async () => {
      await render((host) => {
        host.ariaLabel.set(PAYLOAD);
        host.ariaLabelledBy.set(PAYLOAD);
        host.ariaDescribedBy.set(PAYLOAD);
      });

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
      const { fixture } = await render((host) => {
        host.model.set([smuggled, { label: 'Other', escape: false, items: [wider] } as WjMenuItem]);
      });
      await openSubmenu(fixture, PAYLOAD);
      expectText(`${PAYLOAD} child`);
      await openSubmenu(fixture, 'Other');

      expectText(PAYLOAD);
      expect(document.querySelector('.smuggled')).toBeNull();
    });
  });

  describe('keyboard', () => {
    it('Tab focuses the list with no item active, and Arrow Down activates the first one', async () => {
      const { fixture } = await render();

      await tabOntoList();

      expect(await (await harnessOf(fixture)).isFocused()).toBe(true);
      expect(activeLabel()).toBe('');
      await userEvent.keyboard('{ArrowDown}');
      await expect.poll(activeLabel).toBe('New');
    });

    it('Arrow Down and Arrow Up move the active item, Home and End jump', async () => {
      await render();
      await activateFirstItem();

      await userEvent.keyboard('{ArrowDown}');
      await expect.poll(activeLabel).toBe('Open…');
      await userEvent.keyboard('{ArrowDown}');
      await expect.poll(activeLabel).toBe('Export');
      await userEvent.keyboard('{ArrowUp}');
      await expect.poll(activeLabel).toBe('Open…');
      await userEvent.keyboard('{End}');
      await expect.poll(activeLabel).toBe('Print…');
      await userEvent.keyboard('{Home}');
      await expect.poll(activeLabel).toBe('New');
    });

    it('skips a disabled item with the arrow keys', async () => {
      await render((host) => {
        host.model.set([
          { label: 'Cut' },
          { label: 'Copy', disabled: true },
          { label: 'Select all' },
        ]);
      });
      await activateFirstItem();

      await userEvent.keyboard('{ArrowDown}');

      await expect.poll(activeLabel).toBe('Select all');
    });

    it('Enter and Space run the active item', async () => {
      const run = vi.fn<(event: WjMenuItemCommandEvent) => void>();
      await render((host) => {
        host.model.set([
          { label: 'Cut', command: run },
          { label: 'Copy', command: run },
        ]);
      });
      await activateFirstItem();

      await userEvent.keyboard('{Enter}');
      expect(run).toHaveBeenCalledTimes(1);
      expect(run.mock.calls[0]?.[0].item.label).toBe('Cut');

      await userEvent.keyboard('{ArrowDown}');
      await expect.poll(activeLabel).toBe('Copy');
      await userEvent.keyboard(' ');
      expect(run).toHaveBeenCalledTimes(2);
      expect(run.mock.calls[1]?.[0].item.label).toBe('Copy');
    });

    it('Arrow Right opens the submenu and moves into it, Arrow Left closes it and moves back', async () => {
      const { fixture } = await render();
      const menu = await harnessOf(fixture);
      await activateFirstItem();
      await expect.poll(activeLabel).toBe('New');

      await userEvent.keyboard('{ArrowRight}');

      await expect.poll(activeLabel).toBe('Document');
      expect(await menu.getItemLabels()).toContain('Spreadsheet');
      await userEvent.keyboard('{ArrowDown}');
      await expect.poll(activeLabel).toBe('Spreadsheet');

      await userEvent.keyboard('{ArrowLeft}');

      await expect.poll(activeLabel).toBe('New');
      await expect.poll(() => menu.getItemLabels()).toEqual(['New', 'Open…', 'Export', 'Print…']);
    });

    it('Arrow Right on an item without a submenu stays where it is', async () => {
      await render();
      await activateFirstItem();
      await userEvent.keyboard('{ArrowDown}');
      await expect.poll(activeLabel).toBe('Open…');

      await userEvent.keyboard('{ArrowRight}');

      expect(activeLabel()).toBe('Open…');
    });

    it('Escape closes an open submenu of an inline menu', async () => {
      const { fixture } = await render();
      const menu = await harnessOf(fixture);
      await activateFirstItem();
      await userEvent.keyboard('{ArrowRight}');
      await expect.poll(activeLabel).toBe('Document');

      await userEvent.keyboard('{Escape}');

      await expect.poll(() => menu.getItemLabels()).toEqual(['New', 'Open…', 'Export', 'Print…']);
      expect(await menu.isFocused()).toBe(true);
    });

    it('Enter on a parent opens its submenu, and Enter on a child runs it', async () => {
      const run = vi.fn<(event: WjMenuItemCommandEvent) => void>();
      const document1: WjMenuItem = { label: 'Document', command: run };
      const { fixture } = await render((host) => {
        host.model.set([{ label: 'New', items: [document1] }]);
      });
      const menu = await harnessOf(fixture);
      await activateFirstItem();

      await userEvent.keyboard('{Enter}');
      await expect.poll(() => menu.getItemLabels()).toEqual(['New', 'Document']);
      await userEvent.keyboard('{ArrowRight}');
      await expect.poll(activeLabel).toBe('Document');
      await userEvent.keyboard('{Enter}');

      expect(run).toHaveBeenCalledTimes(1);
      expect(run.mock.calls[0]?.[0].item).toBe(document1);
    });

    it('Enter runs a slotted item exactly as a plain one', async () => {
      const run = vi.fn<(event: WjMenuItemCommandEvent) => void>();
      const copy: WjMenuItem = { label: 'Copy', command: run };
      await render((host) => {
        host.withSlot.set(true);
        host.model.set([{ label: 'Cut' }, copy]);
      });
      await activateFirstItem();

      await userEvent.keyboard('{ArrowDown}');
      await expect.poll(activeLabel).toBe('Copy');
      await userEvent.keyboard('{Enter}');

      expect(run).toHaveBeenCalledTimes(1);
      expect(run.mock.calls[0]?.[0].item).toBe(copy);
    });

    it('in a popup, Arrow Right opens a submenu and Escape closes the popup and returns focus to the trigger', async () => {
      const rendered = await render(popupHost);
      await openFrom(rendered);
      await userEvent.keyboard('{ArrowDown}');
      await expect.poll(activeLabel).toBe('New');
      await userEvent.keyboard('{ArrowRight}');
      await expect.poll(activeLabel).toBe('Document');

      await userEvent.keyboard('{Escape}');

      await expect.poll(() => rendered.component.closes()).toBe(1);
      expect(document.activeElement).toBe(trigger());
    });

    it('in a popup, Tab closes it and focus moves on to the next tab stop, never to body', async () => {
      const rendered = await render(popupHost);
      await openFrom(rendered);

      await userEvent.keyboard('{Tab}');

      await expect.poll(() => rendered.component.closes()).toBe(1);
      // Optimus does not move focus for Tab: the browser's Tab leaves the list for the button that
      // follows the menu, and the wrapper leaves focus where the reader took it.
      await expect.poll(() => document.activeElement).toBe(after());
      await expect.poll(() => listEl()).toBeNull();
    });

    it('in a popup, Tab with no tab stop after it returns focus to the trigger', async () => {
      const rendered = await render(popupHost);
      after().remove();
      await openFrom(rendered);

      await userEvent.keyboard('{Tab}');

      await expect.poll(() => rendered.component.closes()).toBe(1);
      await expect.poll(() => document.activeElement).toBe(trigger());
    });

    it('in a popup, Enter on an item runs it, closes the popup and returns focus to the trigger', async () => {
      const run = vi.fn<(event: WjMenuItemCommandEvent) => void>();
      const rendered = await render((host) => {
        popupHost(host);
        host.model.set([{ label: 'Edit', command: run }]);
      });
      await openFrom(rendered);

      await userEvent.keyboard('{ArrowDown}');
      await expect.poll(activeLabel).toBe('Edit');
      await userEvent.keyboard('{Enter}');

      expect(run).toHaveBeenCalledTimes(1);
      await expect.poll(() => rendered.component.closes()).toBe(1);
      expect(document.activeElement).toBe(trigger());
    });

    it('in a popup opened from a wj-button, Escape returns focus to the button', async () => {
      const rendered = await render(withWjTrigger);
      await openFrom(rendered, wjTrigger);

      await userEvent.keyboard('{Escape}');

      await expect.poll(() => rendered.component.closes()).toBe(1);
      await expect.poll(() => document.activeElement).toBe(wjTrigger());
    });
  });

  describe('accessibility', () => {
    const states: Record<string, (host: Host) => void> = {
      'default inline': () => undefined,
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
      'url items': (host) => {
        host.model.set([{ label: 'Docs', url: 'https://example.com/' }]);
      },
    };

    for (const scheme of ['light', 'dark'] as const) {
      for (const [name, setup] of Object.entries(states)) {
        it(`has no axe violations: ${name}, ${scheme}`, async () => {
          await render(setup, scheme);

          await expectNoAxeViolations();
        });
      }

      it(`has no axe violations: a submenu open, ${scheme}`, async () => {
        await page.viewport(1280, 800);
        const { fixture } = await render(() => undefined, scheme);
        await openSubmenu(fixture, 'New');

        await expectOnlyTheParentNameGap();
      });

      it(`has no axe violations: a submenu open with the item slot, ${scheme}`, async () => {
        await page.viewport(1280, 800);
        const { fixture } = await render((host) => {
          host.withSlot.set(true);
        }, scheme);
        await openSubmenu(fixture, 'Export');

        await expectOnlyTheParentNameGap();
      });

      it(`has no axe violations: popup open, ${scheme}`, async () => {
        const rendered = await render(popupHost, scheme);
        await openFrom(rendered);

        await expectNoAxeViolations();
      });

      it(`has no axe violations: popup open with a submenu, ${scheme}`, async () => {
        await page.viewport(1280, 800);
        const rendered = await render(popupHost, scheme);
        await openFrom(rendered);
        await openSubmenu(rendered.fixture, 'New');

        await expectOnlyTheParentNameGap();
      });

      it(`has no axe violations: popup open on body, ${scheme}`, async () => {
        const rendered = await render((host) => {
          popupHost(host);
          host.appendTo.set('body');
        }, scheme);
        await openFrom(rendered);

        await expectNoAxeViolations();
      });
    }

    it('gives every item a hit box of at least 24 × 24 px, slotted ones too', async () => {
      const { fixture, component } = await render();
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
      component.withSlot.set(true);
      await fixture.whenStable();
      await openSubmenu(fixture, 'New');
      expect(sizes()).toHaveLength(7);
      for (const box of sizes()) {
        expect(box.height).toBeGreaterThanOrEqual(24);
        expect(box.width).toBeGreaterThanOrEqual(24);
      }
    });
  });

  describe('motion', () => {
    it('plays no enter or leave motion under reduced motion, and still emits opened and closed', async () => {
      const rendered = await render(popupHost);
      const read = recordClasses();

      await openFrom(rendered);
      await closePopup(rendered, rendered.component);

      expect(motionClasses(read())).toEqual([]);
      expect(rendered.component.opens()).toBe(1);
      await expect.poll(() => rendered.component.closes()).toBe(1);
    });

    it('plays the motion when the reader has not asked for less, so the recorder sees it', async () => {
      reduceMotion(false);
      const rendered = await render(popupHost);
      const read = recordClasses();

      await openFrom(rendered);
      await closePopup(rendered, rendered.component);

      expect(motionClasses(read()).length).toBeGreaterThan(0);
    });
  });
});
