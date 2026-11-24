/// <reference types="@vitest/browser-playwright" />
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Component, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import type { MockInstance } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { provideWeeljack, type WjMenuItem, type WjMenuItemCommandEvent } from 'weeljack-ng';
import { WjButton } from 'weeljack-ng/button';
import {
  WjMenubar,
  WjMenubarEndSlot,
  WjMenubarItemSlot,
  WjMenubarStartSlot,
  type WjMenubarPt,
} from 'weeljack-ng/menubar';
import { WjMenubarHarness } from 'weeljack-ng/menubar/testing';
import { expectNoAxeViolations, runAxe } from '../spec-support/axe';

const PAYLOAD = '<img src=x onerror="window.wjInjected = true">';
const ROOT = document.documentElement;

const WIDE = { width: 1280, height: 800 };
const NARROW = { width: 600, height: 800 };

const editorBar = (): WjMenuItem[] => [
  { label: 'File', items: [{ label: 'New' }, { label: 'Open…' }, { label: 'Save' }] },
  {
    label: 'Edit',
    items: [{ label: 'Undo' }, { label: 'Redo' }, { separator: true }, { label: 'Cut' }],
  },
  { label: 'View', items: [{ label: 'Zoom in' }, { label: 'Zoom out' }] },
  { label: 'Help' },
];

/** Every item of a model, parents before their children, as the slot sees them. */
const flatten = (items: readonly WjMenuItem[]): WjMenuItem[] =>
  items.flatMap((item) => [item, ...flatten(item.items ?? [])]);

/** A consumer's template: one bar, optionally with the start, end and item slots. */
@Component({
  selector: 'wj-menubar-host',
  imports: [WjButton, WjMenubar, WjMenubarItemSlot, WjMenubarStartSlot, WjMenubarEndSlot],
  styles: `
    .stage {
      min-block-size: 24rem;
    }
  `,
  template: `
    <div class="stage">
      <p id="caption">Editor</p>
      <p id="notes">Use the arrow keys.</p>
      <button id="before" type="button">Before</button>
      <wj-menubar
        [model]="model()"
        [ariaLabel]="ariaLabel()"
        [ariaLabelledBy]="ariaLabelledBy()"
        [ariaDescribedBy]="ariaDescribedBy()"
        [pt]="pt()"
      >
        @if (withStart()) {
          <ng-template wjMenubarStart><span class="brand">Acme</span></ng-template>
        }
        @if (withEnd()) {
          <ng-template wjMenubarEnd>
            <wj-button id="sign-in" label="Sign in" size="small" />
          </ng-template>
        }
        @if (withSlot()) {
          <ng-template wjMenubarItem let-item let-root="root">
            <span class="icon" aria-hidden="true"></span>
            <span class="text" [attr.data-index]="position(item)" [attr.data-root]="root">{{
              item.label
            }}</span>
            @if (item.items?.length) {
              <span class="chevron" aria-hidden="true"></span>
            }
          </ng-template>
        }
      </wj-menubar>
      <button id="after" type="button">After</button>
    </div>
  `,
})
class Host {
  readonly model = signal<WjMenuItem[]>(editorBar());
  readonly ariaLabel = signal<string | undefined>('Editor');
  readonly ariaLabelledBy = signal<string | undefined>(undefined);
  readonly ariaDescribedBy = signal<string | undefined>(undefined);
  readonly pt = signal<WjMenubarPt>(undefined);
  readonly withStart = signal(false);
  readonly withEnd = signal(false);
  readonly withSlot = signal(false);
  readonly position = (item: WjMenuItem): number => flatten(this.model()).indexOf(item);
}

/** A consumer who writes aria-* on the host. */
@Component({
  selector: 'wj-menubar-aria-on-host-host',
  imports: [WjMenubar],
  template: `<wj-menubar aria-label="Editor" [model]="model" />`,
})
class AriaOnHostHost {
  readonly model = editorBar();
}

/** A bar rendered without `provideWeeljack`. */
@Component({
  selector: 'wj-menubar-routed-host',
  imports: [WjMenubar],
  template: `<wj-menubar [model]="model" ariaLabel="Editor" />`,
})
class RoutedHost {
  readonly model = editorBar();
}

type Scheme = 'light' | 'dark';

interface Rendered {
  fixture: ComponentFixture<Host>;
  component: Host;
  element: HTMLElement;
}

interface RenderOptions {
  scheme?: Scheme;
  viewport?: { width: number; height: number };
  translation?: { aria: { navigation: string } };
}

function find<E extends Element>(element: ParentNode, selector: string, type: new () => E): E {
  const found = element.querySelector(selector);
  if (!(found instanceof type)) {
    throw new Error(`${selector} is missing`);
  }
  return found;
}

const barEl = (): HTMLElement => find(document, 'wj-menubar', HTMLElement);
const rootBox = (): HTMLElement => find(document, '[data-pc-section="root"]', HTMLElement);
const listEl = (): HTMLElement => find(document, '[data-pc-section="rootlist"]', HTMLElement);
const buttonEl = (): HTMLElement => find(document, '[data-pc-section="button"]', HTMLElement);
const after = (): HTMLElement => find(document, '#after', HTMLElement);
/** The item whose own text (not its dropdown's) is `label`. */
const itemEl = (label: string): HTMLElement => {
  const found = [...document.querySelectorAll<HTMLElement>('[role="menuitem"]')].find(
    (item) => item.querySelector('[data-pc-section="itemcontent"]')?.textContent.trim() === label,
  );
  if (found === undefined) {
    throw new Error(`the item ${label} is not on the page`);
  }
  return found;
};

/** The fixture currently on screen, so `afterEach` can close a dropdown a spec left open. */
let current: Rendered | undefined;

/** Renders `Host` with `provideWeeljack`, in the given scheme and viewport, after `setup` ran. */
async function render(
  setup: (host: Host) => void = () => undefined,
  { scheme = 'light', viewport = WIDE, translation }: RenderOptions = {},
): Promise<Rendered> {
  await page.viewport(viewport.width, viewport.height);
  ROOT.classList.toggle('wj-dark', scheme === 'dark');
  document.body.style.backgroundColor = 'var(--wj-content-background)';
  TestBed.configureTestingModule({
    providers: [
      provideRouter([]),
      provideWeeljack({ darkMode: 'class', ...(translation && { translation }) }),
    ],
  });
  const fixture = TestBed.createComponent(Host);
  setup(fixture.componentInstance);
  await fixture.whenStable();
  // A pointer left over from an earlier spec would sit over the dropdown and, once it opens under
  // it, take the keyboard's active item: park it above the bar.
  await userEvent.hover(find(document, '#caption', HTMLElement));
  current = {
    fixture,
    component: fixture.componentInstance,
    element: fixture.nativeElement as HTMLElement,
  };
  return current;
}

const narrow = { viewport: NARROW } satisfies RenderOptions;

const harnessOf = (fixture: ComponentFixture<unknown>): Promise<WjMenubarHarness> =>
  TestbedHarnessEnvironment.loader(fixture).getHarness(WjMenubarHarness);

/** Opens the dropdown of the root item labelled `label` through the harness and waits for it. */
async function openDropdown(fixture: ComponentFixture<unknown>, label: string): Promise<void> {
  const [item] = await (await harnessOf(fixture)).getItems({ label });
  await item?.openSubmenu();
  await expect.poll(async () => item?.isSubmenuOpen()).toBe(true);
}

/**
 * Closes whatever is open before teardown: the narrow list through its button, a wide dropdown with
 * Escape. A dropdown renders inside the host, so nothing can outlive the fixture.
 */
async function closeDropdowns(fixture: ComponentFixture<unknown>): Promise<void> {
  const menu = await harnessOf(fixture);
  if (await menu.isMobileMenuOpen()) {
    await menu.toggleMobileMenu();
    await expect.poll(() => menu.isMobileMenuOpen()).toBe(false);
  } else if (await menu.isDropdownOpen()) {
    await menu.focus();
    await userEvent.keyboard('{Escape}');
    await expect.poll(() => menu.isDropdownOpen()).toBe(false);
  }
}

/** The own text of the active item, which is where the keyboard is. */
const activeLabel = (): string =>
  document
    .querySelector('[role="menuitem"][data-p-focused="true"] > [data-pc-section="itemcontent"]')
    ?.textContent.trim() ?? '';

/** Tabs onto the bar's list and waits for it: Optimus activates the first root item itself. */
async function tabOntoList(): Promise<void> {
  // The "Before" button comes first in the page, then the list: Tab until it arrives, with a bound.
  for (let tabs = 0; tabs < 3 && document.activeElement !== listEl(); tabs++) {
    await userEvent.tab();
  }
  await expect.poll(() => document.activeElement === listEl()).toBe(true);
  await expect.poll(activeLabel).not.toBe('');
}

/**
 * axe over a page with a dropdown open. Optimus gap, listed on the docs page: the parent item keeps
 * `aria-label` = its own label while its visible text is longer (its open dropdown is nested in
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

describe('WjMenubar', () => {
  let warn: MockInstance<typeof console.warn>;
  const viewport = { width: window.innerWidth, height: window.innerHeight };

  beforeEach(() => {
    warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(async () => {
    // A dropdown left open at teardown would reach the next spec: close it and wait.
    if (current) {
      await closeDropdowns(current.fixture);
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
    it('model renders the root items across the bar, in a role="menubar" list, and follows a new array', async () => {
      const { fixture, component } = await render();
      const menu = await harnessOf(fixture);

      expect(await menu.getItemLabels()).toEqual(['File', 'Edit', 'View', 'Help']);
      expect(listEl().tagName).toBe('UL');
      expect(listEl().getAttribute('role')).toBe('menubar');
      const tops = [
        ...document.querySelectorAll('[role="menuitem"]:not([aria-expanded="false"] *)'),
      ].map((item) => Math.round(item.getBoundingClientRect().top));
      expect(new Set(tops).size).toBe(1);

      component.model.set([{ label: 'Undo' }, { label: 'Redo' }]);
      await fixture.whenStable();
      expect(await menu.getItemLabels()).toEqual(['Undo', 'Redo']);
    });

    it('opens an item’s items as a dropdown below it, start-aligned, and one at a time', async () => {
      const { fixture } = await render();
      const menu = await harnessOf(fixture);

      expect(await menu.isDropdownOpen()).toBe(false);
      await openDropdown(fixture, 'File');
      const dropdown = find(itemEl('File'), '[data-pc-section="submenu"]', HTMLElement);
      await expect.poll(() => dropdown.getBoundingClientRect().width).toBeGreaterThan(0);

      const parent = itemEl('File').getBoundingClientRect();
      const box = dropdown.getBoundingClientRect();
      expect(box.top).toBeGreaterThanOrEqual(parent.bottom - 1);
      expect(Math.abs(box.left - parent.left)).toBeLessThanOrEqual(8);
      expect(await menu.getItemLabels()).toEqual([
        'File',
        'New',
        'Open…',
        'Save',
        'Edit',
        'View',
        'Help',
      ]);

      await openDropdown(fixture, 'Edit');
      await expect
        .poll(() => menu.getItemLabels())
        .toEqual(['File', 'Edit', 'Undo', 'Redo', 'Cut', 'View', 'Help']);
      expect(await menu.getSeparatorCount()).toBe(1);
    });

    it('with no items keeps the bar, draws no Navigation button and takes no tab stop for items', async () => {
      const { fixture, component, element } = await render((host) => {
        host.model.set([]);
        host.withStart.set(true);
        host.withEnd.set(true);
      });
      const menu = await harnessOf(fixture);

      expect(element.querySelector('p-menubar')).not.toBeNull();
      expect(rootBox().getBoundingClientRect().height).toBeGreaterThan(0);
      expect(getComputedStyle(barEl()).display).toBe('block');
      expect(element.querySelector('.brand')).not.toBeNull();
      expect(element.querySelector('#sign-in')).not.toBeNull();
      expect(await menu.getItemLabels()).toEqual([]);
      expect(await menu.getMobileButtonName()).toBeNull();
      await expect(menu.toggleMobileMenu()).rejects.toThrow('wj-menubar: the bar has no');

      component.model.set(editorBar());
      await fixture.whenStable();
      expect(await menu.getItemLabels()).toEqual(['File', 'Edit', 'View', 'Help']);
      expect(element.querySelector('.brand')).not.toBeNull();
    });

    it('leaves out an item with visible false', async () => {
      const { fixture } = await render((host) => {
        host.model.set([{ label: 'File' }, { label: 'Hidden', visible: false }, { label: 'Help' }]);
      });

      expect(await (await harnessOf(fixture)).getItemLabels()).toEqual(['File', 'Help']);
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

    it('a disabled item in a dropdown runs nothing on a click either', async () => {
      const run = vi.fn<(event: WjMenuItemCommandEvent) => void>();
      const { fixture } = await render((host) => {
        host.model.set([
          {
            label: 'Edit',
            items: [{ label: 'Paste', command: run, disabled: true }, { label: 'Cut' }],
          },
        ]);
      });
      await openDropdown(fixture, 'Edit');

      await (await harnessOf(fixture)).clickItem('Paste');

      expect(run).not.toHaveBeenCalled();
    });

    it('a url item is a real link, with its target', async () => {
      await render((host) => {
        host.model.set([{ label: 'Docs', url: 'https://example.com/docs', target: '_blank' }]);
      });

      const link = find(document, '[role="menuitem"] a', HTMLAnchorElement);
      expect(link.getAttribute('href')).toBe('https://example.com/docs');
      expect(link.getAttribute('target')).toBe('_blank');
    });

    it('a routerLink item is a real link too, without the app providing a router', async () => {
      await render((host) => {
        host.model.set([{ label: 'Docs', routerLink: ['/components', 'menu'] }]);
      });

      expect(document.querySelector('[role="menuitem"] a')).not.toBeNull();
    });
  });

  describe('narrow layout', () => {
    it('draws the Navigation button, named from the translation, and hides the list until it opens', async () => {
      const { fixture } = await render(undefined, narrow);
      const menu = await harnessOf(fixture);

      expect(await menu.getMobileButtonName()).toBe('Navigation');
      expect(buttonEl().getAttribute('role')).toBe('button');
      expect(await menu.isMobileMenuOpen()).toBe(false);
      await expect.poll(() => getComputedStyle(listEl()).display).toBe('none');

      await menu.toggleMobileMenu();

      await expect.poll(() => menu.isMobileMenuOpen()).toBe(true);
      await expect.poll(() => getComputedStyle(listEl()).display).not.toBe('none');
      expect(await menu.getItemLabels()).toEqual(['File', 'Edit', 'View', 'Help']);
    });

    it('names the button from a changed translation', async () => {
      const { fixture } = await render(undefined, {
        ...narrow,
        translation: { aria: { navigation: 'Điều hướng' } },
      });

      expect(await (await harnessOf(fixture)).getMobileButtonName()).toBe('Điều hướng');
    });

    it('makes the button 44 × 44 px', async () => {
      await render(undefined, narrow);

      await expect.poll(() => Math.round(buttonEl().getBoundingClientRect().width)).toBe(44);
      expect(Math.round(buttonEl().getBoundingClientRect().height)).toBe(44);
    });

    it('is hidden on a wide screen, and the list is a row', async () => {
      await render();

      expect(getComputedStyle(buttonEl()).display).toBe('none');
      expect(getComputedStyle(listEl()).display).not.toBe('none');
    });

    it('drops the list below the bar at its full width, with a dropdown that expands in place', async () => {
      const { fixture } = await render(undefined, narrow);
      const menu = await harnessOf(fixture);
      await menu.toggleMobileMenu();
      await expect.poll(() => menu.isMobileMenuOpen()).toBe(true);

      await openDropdown(fixture, 'File');

      const parent = find(itemEl('File'), '[data-pc-section="itemcontent"]', HTMLElement);
      const inPlace = find(itemEl('File'), '[data-pc-section="submenu"]', HTMLElement);
      await expect.poll(() => inPlace.getBoundingClientRect().height).toBeGreaterThan(0);
      expect(inPlace.getBoundingClientRect().top).toBeGreaterThanOrEqual(
        parent.getBoundingClientRect().bottom - 1,
      );
      expect(listEl().getBoundingClientRect().width).toBeGreaterThanOrEqual(
        rootBox().getBoundingClientRect().width - 40,
      );
    });

    it('closes the list when a leaf runs', async () => {
      const run = vi.fn<(event: WjMenuItemCommandEvent) => void>();
      const { fixture } = await render((host) => {
        host.model.set([{ label: 'Help', command: run }]);
      }, narrow);
      const menu = await harnessOf(fixture);
      await menu.toggleMobileMenu();
      await expect.poll(() => menu.isMobileMenuOpen()).toBe(true);

      await menu.clickItem('Help');

      expect(run).toHaveBeenCalledTimes(1);
      await expect.poll(() => menu.isMobileMenuOpen()).toBe(false);
    });

    it('keeps the start and end slots', async () => {
      const { element } = await render((host) => {
        host.withStart.set(true);
        host.withEnd.set(true);
      }, narrow);

      expect(element.querySelector('.brand')?.getBoundingClientRect().width).toBeGreaterThan(0);
      expect(element.querySelector('#sign-in')?.getBoundingClientRect().width).toBeGreaterThan(0);
    });
  });

  describe('start and end slots', () => {
    it('render nothing when not given', async () => {
      const { element } = await render();

      expect(element.querySelector('.brand')).toBeNull();
      expect(element.querySelector('#sign-in')).toBeNull();
      expect(element.querySelector('[data-pc-section="start"]')).toBeNull();
    });

    it('render before and after the list, in the bar', async () => {
      const { element } = await render((host) => {
        host.withStart.set(true);
        host.withEnd.set(true);
      });

      const start = find(element, '.brand', HTMLElement);
      const end = find(element, '#sign-in', HTMLElement);
      expect(start.textContent.trim()).toBe('Acme');
      expect(rootBox().contains(start)).toBe(true);
      expect(rootBox().contains(end)).toBe(true);
      expect(start.getBoundingClientRect().right).toBeLessThanOrEqual(
        listEl().getBoundingClientRect().left + 1,
      );
      expect(end.getBoundingClientRect().left).toBeGreaterThanOrEqual(
        listEl().getBoundingClientRect().right - 1,
      );
    });

    it('lets the end slot take a control that works', async () => {
      const { element } = await render((host) => {
        host.withEnd.set(true);
      });

      await userEvent.click(find(element, '#sign-in button', HTMLElement));

      expect(document.activeElement?.closest('#sign-in')).not.toBeNull();
    });
  });

  describe('ARIA', () => {
    it('ariaLabel names the role="menubar" list, and the host has no aria attribute', async () => {
      const { fixture, element } = await render();
      const menu = await harnessOf(fixture);

      expect(await menu.getName()).toBe('Editor');
      expect(listEl().getAttribute('role')).toBe('menubar');
      expect(find(element, 'wj-menubar', HTMLElement).getAttributeNames()).not.toContain(
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
      expect(await menu.getName()).toBe('Editor');
    });

    it('ariaDescribedBy lands on the root list only, follows the input and clears when unset', async () => {
      const { fixture, component } = await render((host) => {
        host.ariaDescribedBy.set('notes');
      });
      const menu = await harnessOf(fixture);
      expect((await menu.getAriaAttributes()).describedBy).toBe('notes');

      await openDropdown(fixture, 'File');
      const lists = [...document.querySelectorAll('[role="menubar"]')];
      // Optimus renders every dropdown's list, open or not: only the root list is described.
      expect(lists).toHaveLength(4);
      expect(lists.map((list) => list.getAttribute('aria-describedby'))).toEqual([
        'notes',
        null,
        null,
        null,
      ]);

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
      expect(String(warn.mock.calls[0]?.[0])).toContain('WJ0003: wj-menubar:');
      const list = find(
        fixture.nativeElement as HTMLElement,
        '[data-pc-section="rootlist"]',
        HTMLElement,
      );
      expect(list.getAttribute('aria-label')).toBeNull();
    });

    it('warns WJ0001 when provideWeeljack is missing', async () => {
      const fixture = TestBed.createComponent(RoutedHost);
      await fixture.whenStable();

      expect(
        warn.mock.calls.some(([message]) => String(message).startsWith('WJ0001: wj-menubar:')),
      ).toBe(true);
    });
  });

  describe('pt', () => {
    it('reaches the inner parts, the dropdown included', async () => {
      const { fixture } = await render((host) => {
        host.withStart.set(true);
        host.withEnd.set(true);
        host.pt.set({
          root: { 'data-from-pt': 'root' },
          rootList: { 'data-from-pt': 'root-list' },
          submenu: { 'data-from-pt': 'submenu' },
          item: { 'data-from-pt': 'item' },
          button: { 'data-from-pt': 'button' },
          start: { 'data-from-pt': 'start' },
          end: { 'data-from-pt': 'end' },
        });
      });
      await openDropdown(fixture, 'File');

      expect(rootBox().getAttribute('data-from-pt')).toBe('root');
      expect(listEl().getAttribute('data-from-pt')).toBe('root-list');
      expect(itemEl('Help').getAttribute('data-from-pt')).toBe('item');
      expect(
        find(itemEl('File'), '[data-pc-section="submenu"]', HTMLElement).getAttribute(
          'data-from-pt',
        ),
      ).toBe('submenu');
      expect(buttonEl().getAttribute('data-from-pt')).toBe('button');
      expect(
        find(document, '[data-pc-section="start"]', HTMLElement).getAttribute('data-from-pt'),
      ).toBe('start');
      expect(
        find(document, '[data-pc-section="end"]', HTMLElement).getAttribute('data-from-pt'),
      ).toBe('end');
    });

    it('keeps the routed aria-describedby over a pt value of the same name, and other pt keys', async () => {
      await render((host) => {
        host.ariaDescribedBy.set('notes');
        host.pt.set({ rootList: { 'aria-describedby': 'caption', 'data-kept': 'yes' } });
      });

      expect(listEl().getAttribute('aria-describedby')).toBe('notes');
      expect(listEl().getAttribute('data-kept')).toBe('yes');
    });

    it('lets a consumer pt value stay when nothing is routed', async () => {
      await render((host) => {
        host.pt.set({ rootList: { 'aria-describedby': 'caption' } });
      });

      expect(listEl().getAttribute('aria-describedby')).toBe('caption');
    });

    it('takes the function form', async () => {
      await render((host) => {
        host.ariaDescribedBy.set('notes');
        host.pt.set(() => ({ rootList: { 'data-fn': 'yes' } }));
      });

      expect(listEl().getAttribute('data-fn')).toBe('yes');
      expect(listEl().getAttribute('aria-describedby')).toBe('notes');
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
        host.model.set([{ label: 'File' }, save]);
      });

      await (await harnessOf(fixture)).clickItem('Save');

      expect(received).toHaveLength(1);
      expect(received[0]?.item).toBe(save);
      expect(received[0]?.originalEvent).toBeInstanceOf(MouseEvent);
    });

    it('hands a dropdown item its own object too, and closes the dropdown', async () => {
      const received: WjMenuItem[] = [];
      const open: WjMenuItem = {
        label: 'Open…',
        command: ({ item }) => {
          received.push(item);
        },
      };
      const { fixture } = await render((host) => {
        host.model.set([{ label: 'File', items: [open] }]);
      });
      const menu = await harnessOf(fixture);
      await openDropdown(fixture, 'File');

      await menu.clickItem('Open…');

      expect(received).toEqual([open]);
      expect(received[0]).toBe(open);
      await expect.poll(() => menu.isDropdownOpen()).toBe(false);
    });

    it('never changes the app’s objects', async () => {
      const items: WjMenuItem[] = [
        { label: 'File', expanded: false, items: [{ label: 'New', command: () => undefined }] },
      ];
      const before = JSON.stringify(items);
      const { fixture } = await render((host) => {
        host.model.set(items);
      });
      await openDropdown(fixture, 'File');

      await (await harnessOf(fixture)).clickItem('New');

      expect(items[0]).not.toHaveProperty('escape');
      expect(JSON.stringify(items)).toBe(before);
      expect(items[0]?.items?.[0]).not.toHaveProperty('escape');
    });
  });

  describe('item slot', () => {
    it('renders the consumer’s template for every item, in place of the default label', async () => {
      const { fixture } = await render((host) => {
        host.withSlot.set(true);
        host.model.set([{ label: 'File' }, { label: 'Help' }]);
      });
      const menu = await harnessOf(fixture);

      expect(await menu.getItemLabels()).toEqual(['File', 'Help']);
      expect(document.querySelectorAll('[role="menuitem"] .icon')).toHaveLength(2);
      expect(document.querySelector('[data-pc-section="itemlabel"]')).toBeNull();
    });

    it('renders it for the items of an open dropdown too, and says which are on the bar', async () => {
      const { fixture } = await render((host) => {
        host.withSlot.set(true);
      });
      await openDropdown(fixture, 'File');

      expect(document.querySelectorAll('[role="menuitem"] .icon')).toHaveLength(12);
      const roots = [...document.querySelectorAll('.text')]
        .filter((node) => node.getAttribute('data-root') === 'true')
        .map((node) => node.textContent.trim());
      expect(roots).toEqual(['File', 'Edit', 'View', 'Help']);
    });

    it('hands the app’s own item objects to the template, not copies', async () => {
      const { fixture } = await render((host) => {
        host.withSlot.set(true);
      });
      await openDropdown(fixture, 'Edit');

      // `indexOf` finds an item only by identity: -1 would mean the template got a copy.
      const indices = [...document.querySelectorAll('.text')].map((node) =>
        node.getAttribute('data-index'),
      );
      expect(indices).not.toContain('-1');
      expect(indices).toHaveLength(12);
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
      expect(document.querySelector('[data-p-icon="angle-down"]')).not.toBeNull();
    });

    it('wraps each slotted item in one link box that keeps the item’s padding and size', async () => {
      await render((host) => {
        host.withSlot.set(true);
      });

      const link = find(document, '[role="menuitem"] a', HTMLAnchorElement);
      expect(link.classList.contains('p-menubar-item-link')).toBe(true);
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

    it('with start and end slots as well, all three render', async () => {
      const { element } = await render((host) => {
        host.withSlot.set(true);
        host.withStart.set(true);
        host.withEnd.set(true);
      });

      expect(element.querySelector('.brand')).not.toBeNull();
      expect(element.querySelector('#sign-in')).not.toBeNull();
      expect(element.querySelectorAll('[role="menuitem"] .icon')).toHaveLength(12);
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

    it('renders a parent and a dropdown label as text', async () => {
      const { fixture } = await render((host) => {
        host.model.set([
          { label: PAYLOAD, items: [{ label: `${PAYLOAD} child`, items: [{ label: PAYLOAD }] }] },
        ]);
      });
      await openDropdown(fixture, PAYLOAD);
      await openDropdown(fixture, `${PAYLOAD} child`);

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

      expect(listEl().getAttribute('aria-label')).toBe(PAYLOAD);
      expect(listEl().getAttribute('aria-labelledby')).toBe(PAYLOAD);
      expect(listEl().getAttribute('aria-describedby')).toBe(PAYLOAD);
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
      await openDropdown(fixture, PAYLOAD);
      expectText(`${PAYLOAD} child`);
      await openDropdown(fixture, 'Other');

      expectText(PAYLOAD);
      expect(document.querySelector('.smuggled')).toBeNull();
    });
  });

  describe('keyboard', () => {
    it('Tab focuses the list and activates the first root item', async () => {
      const { fixture } = await render();

      await tabOntoList();

      expect(await (await harnessOf(fixture)).isFocused()).toBe(true);
      expect(activeLabel()).toBe('File');
    });

    it('Arrow Right and Arrow Left move along the bar, and wrap', async () => {
      await render();
      await tabOntoList();

      await userEvent.keyboard('{ArrowRight}');
      await expect.poll(activeLabel).toBe('Edit');
      await userEvent.keyboard('{ArrowRight}');
      await expect.poll(activeLabel).toBe('View');
      await userEvent.keyboard('{ArrowLeft}');
      await expect.poll(activeLabel).toBe('Edit');
      await userEvent.keyboard('{End}');
      await expect.poll(activeLabel).toBe('Help');
      await userEvent.keyboard('{Home}');
      await expect.poll(activeLabel).toBe('File');
    });

    it('skips a disabled item along the bar', async () => {
      await render((host) => {
        host.model.set([
          { label: 'Cut' },
          { label: 'Copy', disabled: true },
          { label: 'Select all' },
        ]);
      });
      await tabOntoList();

      await userEvent.keyboard('{ArrowRight}');

      await expect.poll(activeLabel).toBe('Select all');
    });

    it('Arrow Down on a parent opens its dropdown and moves into it, Arrow Up and Down move inside', async () => {
      const { fixture } = await render();
      const menu = await harnessOf(fixture);
      await tabOntoList();

      await userEvent.keyboard('{ArrowDown}');

      await expect.poll(() => menu.isDropdownOpen()).toBe(true);
      await expect.poll(activeLabel).toBe('New');
      await expect.poll(() => itemEl('New').getBoundingClientRect().width).toBeGreaterThan(0);
      await userEvent.keyboard('{ArrowDown}');
      await expect.poll(activeLabel).toBe('Open…');
      await userEvent.keyboard('{ArrowDown}');
      await expect.poll(activeLabel).toBe('Save');
      await userEvent.keyboard('{ArrowUp}');
      await expect.poll(activeLabel).toBe('Open…');
    });

    it('Escape closes the dropdown and leaves focus on its root item', async () => {
      const { fixture } = await render();
      const menu = await harnessOf(fixture);
      await tabOntoList();
      await userEvent.keyboard('{ArrowDown}');
      await expect.poll(() => menu.isDropdownOpen()).toBe(true);

      await userEvent.keyboard('{Escape}');

      await expect.poll(() => menu.isDropdownOpen()).toBe(false);
      expect(await menu.isFocused()).toBe(true);
      await expect.poll(activeLabel).toBe('File');
    });

    it('Enter and Space on a parent open its dropdown', async () => {
      const { fixture } = await render();
      const menu = await harnessOf(fixture);
      await tabOntoList();

      await userEvent.keyboard('{Enter}');
      await expect.poll(() => menu.isDropdownOpen()).toBe(true);
      await userEvent.keyboard('{Escape}');
      await expect.poll(() => menu.isDropdownOpen()).toBe(false);

      await userEvent.keyboard(' ');
      await expect.poll(() => menu.isDropdownOpen()).toBe(true);
    });

    it('Enter and Space run the active item', async () => {
      const run = vi.fn<(event: WjMenuItemCommandEvent) => void>();
      await render((host) => {
        host.model.set([
          { label: 'Cut', command: run },
          { label: 'Copy', command: run },
        ]);
      });
      await tabOntoList();

      await userEvent.keyboard('{Enter}');
      expect(run).toHaveBeenCalledTimes(1);
      expect(run.mock.calls[0]?.[0].item.label).toBe('Cut');

      await userEvent.keyboard('{ArrowRight}');
      await expect.poll(activeLabel).toBe('Copy');
      await userEvent.keyboard(' ');
      expect(run).toHaveBeenCalledTimes(2);
      expect(run.mock.calls[1]?.[0].item.label).toBe('Copy');
    });

    it('Enter runs an item in a dropdown and closes it, Arrow Left closes it without running', async () => {
      const run = vi.fn<(event: WjMenuItemCommandEvent) => void>();
      const save: WjMenuItem = { label: 'Save', command: run };
      const { fixture } = await render((host) => {
        host.model.set([
          { label: 'File', items: [save] },
          { label: 'Edit', items: [{ label: 'Undo' }] },
        ]);
      });
      const menu = await harnessOf(fixture);
      await tabOntoList();
      await userEvent.keyboard('{ArrowDown}');
      await expect.poll(activeLabel).toBe('Save');
      await expect.poll(() => itemEl('Save').getBoundingClientRect().width).toBeGreaterThan(0);

      await userEvent.keyboard('{ArrowLeft}');
      await expect.poll(() => menu.isDropdownOpen()).toBe(false);
      await expect.poll(activeLabel).toBe('File');
      expect(run).not.toHaveBeenCalled();
      await userEvent.keyboard('{ArrowDown}');
      await expect.poll(activeLabel).toBe('Save');
      await userEvent.keyboard('{Enter}');

      expect(run).toHaveBeenCalledTimes(1);
      expect(run.mock.calls[0]?.[0].item).toBe(save);
      await expect.poll(() => menu.isDropdownOpen()).toBe(false);
    });

    it('Enter runs a slotted item exactly as a plain one', async () => {
      const run = vi.fn<(event: WjMenuItemCommandEvent) => void>();
      const copy: WjMenuItem = { label: 'Copy', command: run };
      await render((host) => {
        host.withSlot.set(true);
        host.model.set([{ label: 'Cut' }, copy]);
      });
      await tabOntoList();

      await userEvent.keyboard('{ArrowRight}');
      await expect.poll(activeLabel).toBe('Copy');
      await userEvent.keyboard('{Enter}');

      expect(run).toHaveBeenCalledTimes(1);
      expect(run.mock.calls[0]?.[0].item).toBe(copy);
    });

    it('narrow: Enter and Space on the Navigation button open the list', async () => {
      const { fixture } = await render(undefined, narrow);
      const menu = await harnessOf(fixture);
      buttonEl().focus();
      expect(document.activeElement).toBe(buttonEl());

      await userEvent.keyboard('{Enter}');
      await expect.poll(() => menu.isMobileMenuOpen()).toBe(true);
      // Opening the list moves focus into it: go back to the button to close it.
      buttonEl().focus();
      await userEvent.keyboard(' ');
      await expect.poll(() => menu.isMobileMenuOpen()).toBe(false);

      buttonEl().focus();
      await userEvent.keyboard(' ');
      await expect.poll(() => menu.isMobileMenuOpen()).toBe(true);
    });

    it('narrow: Tab reaches the button, Enter opens the list and focus moves into it', async () => {
      const { fixture } = await render(undefined, narrow);
      const menu = await harnessOf(fixture);

      await userEvent.tab();
      await userEvent.tab();
      expect(document.activeElement).toBe(buttonEl());
      await userEvent.keyboard('{Enter}');
      await expect.poll(() => menu.isMobileMenuOpen()).toBe(true);

      await expect.poll(() => document.activeElement === listEl()).toBe(true);
      await userEvent.keyboard('{ArrowDown}');
      await expect.poll(activeLabel).not.toBe('');
    });

    it('Tab leaves the bar for the next stop', async () => {
      await render();
      await tabOntoList();

      await userEvent.tab();

      await expect.poll(() => document.activeElement).toBe(after());
    });
  });

  describe('accessibility', () => {
    const states: Record<string, (host: Host) => void> = {
      'wide default': () => undefined,
      'a disabled item': (host) => {
        host.model.set([{ label: 'Cut' }, { label: 'Paste', disabled: true }, { label: 'Help' }]);
      },
      'start and end slots in use': (host) => {
        host.withStart.set(true);
        host.withEnd.set(true);
      },
      'no items, with start and end slots': (host) => {
        host.model.set([]);
        host.withStart.set(true);
        host.withEnd.set(true);
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
          await render(setup, { scheme });

          await expectNoAxeViolations();
        });
      }

      it(`has no axe violations: a dropdown open, ${scheme}`, async () => {
        const { fixture } = await render(undefined, { scheme });
        await openDropdown(fixture, 'File');

        await expectOnlyTheParentNameGap();
      });

      it(`has no axe violations: a dropdown open with the item slot, ${scheme}`, async () => {
        const { fixture } = await render(
          (host) => {
            host.withSlot.set(true);
          },
          { scheme },
        );
        await openDropdown(fixture, 'Edit');

        await expectOnlyTheParentNameGap();
      });

      it(`has no axe violations: narrow collapsed, ${scheme}`, async () => {
        await render(undefined, { scheme, viewport: NARROW });

        await expectNoAxeViolations();
      });

      it(`has no axe violations: narrow expanded, ${scheme}`, async () => {
        const { fixture } = await render(undefined, { scheme, viewport: NARROW });
        await (await harnessOf(fixture)).toggleMobileMenu();
        await expect.poll(async () => (await harnessOf(fixture)).isMobileMenuOpen()).toBe(true);

        await expectNoAxeViolations();
      });

      it(`has no axe violations: narrow with start and end slots, ${scheme}`, async () => {
        await render(
          (host) => {
            host.withStart.set(true);
            host.withEnd.set(true);
          },
          { scheme, viewport: NARROW },
        );

        await expectNoAxeViolations();
      });
    }

    it('gives every item a hit box of at least 24 × 24 px, slotted ones too', async () => {
      const { fixture, component } = await render();
      const sizes = (): DOMRect[] =>
        [...document.querySelectorAll('[role="menuitem"]:not([aria-expanded="false"] *)')].map(
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
      await openDropdown(fixture, 'File');
      expect(sizes()).toHaveLength(7);
      for (const box of sizes()) {
        expect(box.height).toBeGreaterThanOrEqual(24);
        expect(box.width).toBeGreaterThanOrEqual(24);
      }
    });
  });
});
