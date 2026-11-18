/// <reference types="@vitest/browser-playwright" />
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Component, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import type { SplitButtonPassThroughOptions } from '@openng/optimus-ui/types/splitbutton';
import type { MockInstance } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import {
  provideWeeljack,
  type WjMenuItem,
  type WjMenuItemCommandEvent,
  type WjTranslation,
} from 'weeljack-ng';
import {
  WjSplitButton,
  WjSplitButtonContentSlot,
  type WjSplitButtonPt,
  type WjSplitButtonSeverity,
  type WjSplitButtonSize,
  type WjSplitButtonVariant,
} from 'weeljack-ng/splitbutton';
import { WjSplitButtonHarness } from 'weeljack-ng/splitbutton/testing';
import { expectNoAxeViolations, runAxe } from '../spec-support/axe';

const PAYLOAD = '<img src=x onerror="window.wjInjected = true">';
const ROOT = document.documentElement;

const saveMenu = (): WjMenuItem[] => [
  { label: 'Save as draft' },
  { label: 'Save and close' },
  { separator: true },
  { label: 'Export', items: [{ label: 'PDF' }, { label: 'CSV' }] },
  { label: 'Delete', disabled: true },
];

/** A consumer's template: a button before and one after, so Tab has somewhere to go. */
@Component({
  selector: 'wj-splitbutton-host',
  imports: [WjSplitButton, WjSplitButtonContentSlot],
  styles: `
    .stage {
      min-block-size: 20rem;
      max-inline-size: 28rem;
    }

    .spacer {
      block-size: calc(100vh - 7.5rem);
    }
  `,
  template: `
    <div class="stage">
      <p id="caption">Document</p>
      <p id="notes">Saves the document.</p>
      <button id="before" type="button">Before</button>
      @if (tall()) {
        <div class="spacer"></div>
      }
      <wj-splitbutton
        id="sb"
        [label]="label()"
        [model]="model()"
        [severity]="severity()"
        [size]="size()"
        [variant]="variant()"
        [disabled]="disabled()"
        [appendTo]="appendTo()"
        [expandAriaLabel]="expandAriaLabel()"
        [ariaLabel]="ariaLabel()"
        [ariaLabelledBy]="ariaLabelledBy()"
        [ariaDescribedBy]="ariaDescribedBy()"
        [pt]="pt()"
        (buttonClick)="clicks.update(countUp)"
        (opened)="opens.update(countUp)"
        (closed)="closes.update(countUp)"
      >
        @if (withSlot()) {
          <ng-template wjSplitButtonContent>
            <svg class="slot-icon" aria-hidden="true" focusable="false" viewBox="0 0 16 16">
              <circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" />
            </svg>
            <span class="slot-text">{{ label() }}</span>
          </ng-template>
        }
      </wj-splitbutton>
      <button id="after" type="button">After</button>
    </div>
  `,
})
class Host {
  readonly label = signal<string | undefined>('Save');
  readonly model = signal<WjMenuItem[]>(saveMenu());
  readonly severity = signal<WjSplitButtonSeverity | undefined>(undefined);
  readonly size = signal<WjSplitButtonSize | undefined>(undefined);
  readonly variant = signal<WjSplitButtonVariant | undefined>(undefined);
  readonly disabled = signal(false);
  readonly appendTo = signal<'self' | 'body'>('body');
  readonly expandAriaLabel = signal<string | undefined>(undefined);
  readonly ariaLabel = signal<string | undefined>(undefined);
  readonly ariaLabelledBy = signal<string | undefined>(undefined);
  readonly ariaDescribedBy = signal<string | undefined>(undefined);
  readonly pt = signal<WjSplitButtonPt>(undefined);
  readonly withSlot = signal(false);
  readonly tall = signal(false);
  readonly clicks = signal(0);
  readonly opens = signal(0);
  readonly closes = signal(0);
  readonly countUp = (count: number): number => count + 1;
}

/** A consumer who writes aria-* on the host. */
@Component({
  selector: 'wj-splitbutton-aria-on-host-host',
  imports: [WjSplitButton],
  template: `<wj-splitbutton aria-label="Save" label="Save" [model]="model" />`,
})
class AriaOnHostHost {
  readonly model = saveMenu();
}

/** A split button rendered without `provideWeeljack`. */
@Component({
  selector: 'wj-splitbutton-unprovided-host',
  imports: [WjSplitButton],
  template: `<wj-splitbutton label="Save" [model]="model" />`,
})
class UnprovidedHost {
  readonly model = saveMenu();
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

const hostEl = (): HTMLElement => find(document, 'wj-splitbutton', HTMLElement);
const mainEl = (): HTMLButtonElement =>
  find(hostEl(), 'button:not([aria-haspopup])', HTMLButtonElement);
const menuBtn = (): HTMLButtonElement => find(hostEl(), 'button[aria-haspopup]', HTMLButtonElement);
const listEl = (): HTMLElement | null => document.querySelector<HTMLElement>('[role="menu"]');
/** The popup's root: the element the menu button controls, wherever it renders. */
const popupEl = (): HTMLElement | null =>
  document.getElementById(menuBtn().getAttribute('aria-controls') ?? '');
const after = (): HTMLElement => find(document, '#after', HTMLElement);
const before = (): HTMLElement => find(document, '#before', HTMLElement);
const tooltips = (): number => document.querySelectorAll('.p-tooltip, [role="tooltip"]').length;

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
  translation?: WjTranslation,
): Promise<Rendered> {
  ROOT.classList.toggle('wj-dark', scheme === 'dark');
  document.body.style.backgroundColor = 'var(--wj-content-background)';
  TestBed.configureTestingModule({
    providers: [provideWeeljack({ darkMode: 'class', ...(translation && { translation }) })],
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

const harnessOf = (fixture: ComponentFixture<unknown>): Promise<WjSplitButtonHarness> =>
  TestbedHarnessEnvironment.loader(fixture).getHarness(WjSplitButtonHarness);

/** Opens the popup from a click on the menu button and waits until it has entered. */
async function openMenu({ fixture, component }: Rendered): Promise<void> {
  const opened = component.opens();
  await userEvent.click(page.elementLocator(menuBtn()));
  await fixture.whenStable();
  await expect.poll(() => component.opens()).toBe(opened + 1);
  await expect.poll(() => document.activeElement?.getAttribute('role')).toBe('menu');
}

/** Closes the popup with the menu button and waits for the leave to end. */
async function closeMenu({ fixture }: Rendered): Promise<void> {
  await (await harnessOf(fixture)).closeMenu();
  await fixture.whenStable();
  await expect.poll(() => listEl()).toBeNull();
}

/** The own text of the active item, which is where the keyboard is. */
const activeLabel = (): string =>
  document
    .querySelector('[role="menuitem"][data-p-focused="true"] > [data-pc-section="itemcontent"]')
    ?.textContent.trim() ?? '';

/** Opens the popup with the keyboard from the menu button and waits for the first key to count. */
async function openByKey(rendered: Rendered, key: string): Promise<void> {
  menuBtn().focus();
  const opened = rendered.component.opens();
  await userEvent.keyboard(key);
  await expect.poll(() => rendered.component.opens()).toBe(opened + 1);
  await expect.poll(() => document.activeElement?.getAttribute('role')).toBe('menu');
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
  await expect.poll(() => itemEl(label).getAttribute('aria-expanded')).toBe('true');
}

/** Records every class list the popup's root and list have from now on, to tell if motion ran. */
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

type Attributes = Record<string, string>;

interface Parts {
  root?: Attributes;
  pcButton?: { root: Attributes };
  pcDropdown?: { root: Attributes };
  /** Parts of the inner TieredMenu, by its own names (`rootList`, `item`, ...). */
  popup?: Record<string, Attributes>;
}

/**
 * A `pt` for the split button. `SplitButtonPassThrough` types `pcMenu` as Menu's, which has no
 * `rootList`, though the real inner component is a TieredMenu: the popup's parts ride in through
 * a spread of a `Record`, which TypeScript does not check for excess properties.
 */
const ptOf = ({ popup, ...own }: Parts): SplitButtonPassThroughOptions => ({
  ...own,
  pcMenu: { list: {}, ...popup },
});

describe('WjSplitButton', () => {
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
      await closeMenu(current);
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
    it('label is the main button’s text, and model is the popup’s items, which follow a new array', async () => {
      const { fixture, component } = await render();
      const splitButton = await harnessOf(fixture);

      expect(await splitButton.getLabel()).toBe('Save');
      expect(await splitButton.isMenuOpen()).toBe(false);
      await splitButton.openMenu();
      await expect.poll(() => splitButton.isMenuOpen()).toBe(true);
      expect(await splitButton.getItemLabels()).toEqual([
        'Save as draft',
        'Save and close',
        'Export',
        'Delete',
      ]);
      await splitButton.closeMenu();
      await expect.poll(() => splitButton.isMenuOpen()).toBe(false);

      component.label.set('Publish');
      component.model.set([{ label: 'Schedule…' }]);
      await fixture.whenStable();
      await splitButton.openMenu();
      await expect.poll(() => splitButton.getItemLabels()).toEqual(['Schedule…']);
      expect(await splitButton.getLabel()).toBe('Publish');
      expect(await (await harnessOf(fixture)).getLabel()).toBe('Publish');
    });

    it('nested items open as submenus, and a separator draws a line', async () => {
      const rendered = await render();
      await openMenu(rendered);
      const splitButton = await harnessOf(rendered.fixture);

      expect(document.querySelectorAll('[role="separator"]')).toHaveLength(1);
      const [exportItem] = await splitButton.getItems({ label: 'Export' });
      expect(await exportItem?.hasSubmenu()).toBe(true);
      await openSubmenu(rendered.fixture, 'Export');
      expect(await splitButton.getItemLabels()).toEqual([
        'Save as draft',
        'Save and close',
        'Export',
        'PDF',
        'CSV',
        'Delete',
      ]);
    });

    it('leaves out an item with visible false, and a disabled item runs nothing', async () => {
      const run = vi.fn<(event: WjMenuItemCommandEvent) => void>();
      const rendered = await render((host) => {
        host.model.set([
          { label: 'Hidden', visible: false },
          { label: 'Off', disabled: true, command: run },
          { label: 'On' },
        ]);
      });
      await openMenu(rendered);
      const splitButton = await harnessOf(rendered.fixture);

      expect(await splitButton.getItemLabels()).toEqual(['Off', 'On']);
      const [off] = await splitButton.getItems({ label: 'Off' });
      expect(await off?.isDisabled()).toBe(true);
      await off?.click();
      expect(run).not.toHaveBeenCalled();
    });

    it('severity, size and variant reach both buttons when they are set at creation', async () => {
      await render((host) => {
        host.severity.set('secondary');
        host.size.set('small');
        host.variant.set('outlined');
      });
      const both = (name: string): boolean =>
        mainEl().classList.contains(name) && menuBtn().classList.contains(name);

      expect(both('p-button-secondary')).toBe(true);
      expect(both('p-button-sm')).toBe(true);
      expect(both('p-button-outlined')).toBe(true);
      expect(both('p-button-text')).toBe(false);

      TestBed.resetTestingModule();
      await render((host) => {
        host.size.set('large');
        host.variant.set('text');
      });
      expect(both('p-button-lg')).toBe(true);
      expect(both('p-button-text')).toBe(true);
      expect(both('p-button-secondary')).toBe(false);
      expect(both('p-button-outlined')).toBe(false);
    });

    it('pins a gap: severity follows a later change, size and variant are read at creation', async () => {
      const { fixture, component } = await render();
      const both = (name: string): boolean =>
        mainEl().classList.contains(name) && menuBtn().classList.contains(name);

      component.severity.set('danger');
      component.size.set('small');
      component.variant.set('outlined');
      await fixture.whenStable();

      expect(both('p-button-danger')).toBe(true);
      expect(both('p-button-sm')).toBe(false);
      expect(both('p-button-outlined')).toBe(false);
    });

    it('is 44 px tall by default, 36 small and 52 large; the menu button is as tall as the main one', async () => {
      const box = (element: HTMLElement): { width: number; height: number } => {
        const { width, height } = element.getBoundingClientRect();
        return { width, height };
      };
      const heights: [WjSplitButtonSize | undefined, number][] = [
        [undefined, 44],
        ['small', 36],
        ['large', 52],
      ];

      for (const [size, height] of heights) {
        TestBed.resetTestingModule();
        await render((host) => {
          host.size.set(size);
        });
        expect(box(mainEl()).height).toBe(height);
        expect(box(menuBtn()).height).toBe(height);
        expect(box(hostEl()).height).toBe(height);
      }
    });

    it('pins a gap: the menu button is 2 px wider than tall by default (6 small, 2 narrower large)', async () => {
      const widths: [WjSplitButtonSize | undefined, number][] = [
        [undefined, 46],
        ['small', 42],
        ['large', 50],
      ];

      for (const [size, width] of widths) {
        TestBed.resetTestingModule();
        await render((host) => {
          host.size.set(size);
        });
        expect(menuBtn().getBoundingClientRect().width).toBe(width);
      }
    });

    it('disabled makes both buttons inert: no click, no popup, and it follows the input', async () => {
      const { fixture, component } = await render((host) => {
        host.disabled.set(true);
      });
      const splitButton = await harnessOf(fixture);

      expect(await splitButton.isDisabled()).toBe(true);
      expect(await splitButton.isMenuButtonDisabled()).toBe(true);
      await userEvent.click(mainEl(), { force: true });
      await userEvent.click(menuBtn(), { force: true });
      await fixture.whenStable();
      expect(component.clicks()).toBe(0);
      expect(component.opens()).toBe(0);
      expect(listEl()).toBeNull();

      component.disabled.set(false);
      await fixture.whenStable();
      expect(await splitButton.isDisabled()).toBe(false);
      expect(await splitButton.isMenuButtonDisabled()).toBe(false);
    });

    it('with no items the menu button is disabled and the main button still works', async () => {
      const { fixture, component } = await render((host) => {
        host.model.set([]);
      });
      const splitButton = await harnessOf(fixture);

      expect(await splitButton.isMenuButtonDisabled()).toBe(true);
      expect(await splitButton.isDisabled()).toBe(false);
      await splitButton.clickButton();
      expect(component.clicks()).toBe(1);
      await userEvent.click(menuBtn(), { force: true });
      expect(listEl()).toBeNull();
      expect(component.opens()).toBe(0);

      component.model.set([{ label: 'One' }]);
      await fixture.whenStable();
      expect(await splitButton.isMenuButtonDisabled()).toBe(false);

      component.model.set([]);
      await fixture.whenStable();
      expect(await splitButton.isMenuButtonDisabled()).toBe(true);
    });

    it('keeps the menu button disabled with no items when disabled goes true, then false', async () => {
      const { fixture, component } = await render((host) => {
        host.model.set([]);
      });
      const splitButton = await harnessOf(fixture);

      component.disabled.set(true);
      await fixture.whenStable();
      expect(await splitButton.isDisabled()).toBe(true);
      expect(await splitButton.isMenuButtonDisabled()).toBe(true);

      // Optimus's `disabled` setter writes `menuButtonDisabled` too: it must not undo the rule.
      component.disabled.set(false);
      await fixture.whenStable();
      expect(await splitButton.isDisabled()).toBe(false);
      expect(await splitButton.isMenuButtonDisabled()).toBe(true);

      component.disabled.set(true);
      await fixture.whenStable();
      component.disabled.set(false);
      await fixture.whenStable();
      expect(await splitButton.isMenuButtonDisabled()).toBe(true);

      component.model.set([{ label: 'One' }]);
      await fixture.whenStable();
      expect(await splitButton.isMenuButtonDisabled()).toBe(false);
    });

    it('with items, disabled flips both buttons together and back', async () => {
      const { fixture, component } = await render();
      const splitButton = await harnessOf(fixture);

      component.disabled.set(true);
      await fixture.whenStable();
      component.disabled.set(false);
      await fixture.whenStable();

      expect(await splitButton.isMenuButtonDisabled()).toBe(false);
      expect(await splitButton.isDisabled()).toBe(false);
    });

    it('appendTo body puts the popup on body, self keeps it inside the host', async () => {
      const rendered = await render();
      await openMenu(rendered);
      expect(popupEl()?.parentElement).toBe(document.body);
      expect(hostEl().contains(popupEl())).toBe(false);
      await closeMenu(rendered);
      TestBed.resetTestingModule();

      const inside = await render((host) => {
        host.appendTo.set('self');
      });
      await openMenu(inside);
      expect(hostEl().contains(popupEl())).toBe(true);
      expect(await (await harnessOf(inside.fixture)).getItemLabels()).toContain('Save as draft');
    });

    it('opens the popup below the host, start-aligned, at least as wide as it and 12.5rem', async () => {
      const rendered = await render();
      await openMenu(rendered);

      const host = hostEl().getBoundingClientRect();
      const popup = popupEl()?.getBoundingClientRect() ?? new DOMRect();
      expect(Math.abs(popup.left - host.left)).toBeLessThanOrEqual(1);
      expect(popup.top - host.bottom).toBeGreaterThanOrEqual(0);
      expect(popup.top - host.bottom).toBeLessThanOrEqual(4);
      expect(popup.width).toBeGreaterThanOrEqual(host.width);
      expect(popup.width).toBeGreaterThanOrEqual(200);
    });

    it('flips the popup above the host when there is no room below', async () => {
      const rendered = await render((host) => {
        host.tall.set(true);
      });
      hostEl().scrollIntoView({ block: 'end' });
      await openMenu(rendered);

      const host = hostEl().getBoundingClientRect();
      const popup = popupEl()?.getBoundingClientRect() ?? new DOMRect();
      expect(popup.bottom).toBeLessThanOrEqual(host.top + 1);
    });
  });

  describe('names', () => {
    it('names the menu button "More actions" by default, and the popup with it', async () => {
      const rendered = await render();
      const splitButton = await harnessOf(rendered.fixture);

      expect(await splitButton.getMenuButtonName()).toBe('More actions');
      expect(menuBtn().getAttribute('aria-label')).toBe('More actions');
      await openMenu(rendered);
      expect(listEl()?.getAttribute('aria-label')).toBe('More actions');
    });

    it('expandAriaLabel renames the menu button and the popup, and follows the input', async () => {
      const rendered = await render((host) => {
        host.expandAriaLabel.set('Other ways to save');
      });
      await openMenu(rendered);

      expect(menuBtn().getAttribute('aria-label')).toBe('Other ways to save');
      expect(listEl()?.getAttribute('aria-label')).toBe('Other ways to save');

      rendered.component.expandAriaLabel.set('Save options');
      await rendered.fixture.whenStable();
      expect(menuBtn().getAttribute('aria-label')).toBe('Save options');
      expect(listEl()?.getAttribute('aria-label')).toBe('Save options');
    });

    it('reads the app’s translation, and falls back to English for the rest', async () => {
      const rendered = await render(() => undefined, 'light', {
        wj: { moreActions: 'Thêm thao tác' },
      });
      await openMenu(rendered);

      expect(await (await harnessOf(rendered.fixture)).getMenuButtonName()).toBe('Thêm thao tác');
      expect(listEl()?.getAttribute('aria-label')).toBe('Thêm thao tác');
    });

    it('falls back to English when the translation sets other wj strings only', async () => {
      const { fixture } = await render(() => undefined, 'light', { wj: { home: 'Trang chủ' } });

      expect(await (await harnessOf(fixture)).getMenuButtonName()).toBe('More actions');
    });

    it('menu button carries the popup ARIA Optimus tracks', async () => {
      const rendered = await render();
      const controls = menuBtn().getAttribute('aria-controls');

      expect(menuBtn().getAttribute('aria-haspopup')).toBe('true');
      expect(menuBtn().getAttribute('aria-expanded')).toBe('false');
      expect(controls).toBeTruthy();
      await openMenu(rendered);
      expect(menuBtn().getAttribute('aria-expanded')).toBe('true');
      expect(popupEl()?.id).toBe(controls);
    });

    it('names the main button from its visible label, and ariaLabel sets its aria-label', async () => {
      const { fixture, component } = await render();

      expect(mainEl().hasAttribute('aria-label')).toBe(false);

      component.ariaLabel.set('Save the document');
      await fixture.whenStable();
      expect(mainEl().getAttribute('aria-label')).toBe('Save the document');
      expect(menuBtn().getAttribute('aria-label')).toBe('More actions');

      component.ariaLabel.set(undefined);
      await fixture.whenStable();
      expect(mainEl().hasAttribute('aria-label')).toBe(false);
    });

    it('routes ariaLabelledBy and ariaDescribedBy to the main button and clears them', async () => {
      const { fixture, component } = await render((host) => {
        host.ariaLabelledBy.set('caption');
        host.ariaDescribedBy.set('notes');
      });

      expect(mainEl().getAttribute('aria-labelledby')).toBe('caption');
      expect(mainEl().getAttribute('aria-describedby')).toBe('notes');
      expect(menuBtn().hasAttribute('aria-labelledby')).toBe(false);
      expect(menuBtn().hasAttribute('aria-describedby')).toBe(false);
      expect(hostEl().hasAttribute('aria-labelledby')).toBe(false);

      component.ariaLabelledBy.set(undefined);
      component.ariaDescribedBy.set(undefined);
      await fixture.whenStable();
      expect(mainEl().hasAttribute('aria-labelledby')).toBe(false);
      expect(mainEl().hasAttribute('aria-describedby')).toBe(false);
    });
  });

  describe('the main button', () => {
    it('emits buttonClick with the click event, once, from the main button only', async () => {
      const received: MouseEvent[] = [];
      const { fixture, component } = await render();
      hostEl().addEventListener('click', (event) => {
        if (event instanceof MouseEvent) {
          received.push(event);
        }
      });
      const splitButton = await harnessOf(fixture);

      await splitButton.clickButton();
      expect(component.clicks()).toBe(1);

      await userEvent.click(menuBtn());
      await expect.poll(() => component.opens()).toBe(1);
      expect(component.clicks()).toBe(1);
      // A native click on the host also fires for the menu button: that is why buttonClick exists.
      expect(received).toHaveLength(2);
    });

    it('closes an open menu when it is clicked, and emits closed once', async () => {
      const rendered = await render();
      await openMenu(rendered);

      await userEvent.click(mainEl());

      await expect.poll(() => listEl()).toBeNull();
      expect(rendered.component.clicks()).toBe(1);
      await expect.poll(() => rendered.component.closes()).toBe(1);
    });
  });

  describe('opened and closed', () => {
    it('emit once per open and once per close, and never twice for one close', async () => {
      reduceMotion(false);
      const rendered = await render();

      await openMenu(rendered);
      expect(rendered.component.opens()).toBe(1);
      expect(rendered.component.closes()).toBe(0);

      await closeMenu(rendered);
      expect(rendered.component.closes()).toBe(1);

      await openMenu(rendered);
      await closeMenu(rendered);
      expect(rendered.component.opens()).toBe(2);
      expect(rendered.component.closes()).toBe(2);
    });

    it('closed also fires for an outside click', async () => {
      const rendered = await render();
      await openMenu(rendered);

      await userEvent.click(find(document, '#caption', HTMLElement));

      await expect.poll(() => rendered.component.closes()).toBe(1);
      await expect.poll(() => listEl()).toBeNull();
    });

    it('running an item closes the popup and runs its command with the app’s own item', async () => {
      const received: WjMenuItemCommandEvent[] = [];
      const draft: WjMenuItem = {
        label: 'Save as draft',
        command: (event) => {
          received.push(event);
        },
      };
      const rendered = await render((host) => {
        host.model.set([draft, { label: 'Other' }]);
      });
      await openMenu(rendered);

      await (await harnessOf(rendered.fixture)).clickItem('Save as draft');

      expect(received).toHaveLength(1);
      expect(received[0]?.item).toBe(draft);
      expect(received[0]?.originalEvent).toBeInstanceOf(MouseEvent);
      await expect.poll(() => rendered.component.closes()).toBe(1);
      await expect.poll(() => listEl()).toBeNull();
    });

    it('runs a nested item’s command with its own object, and closes the whole popup', async () => {
      const received: WjMenuItem[] = [];
      const pdf: WjMenuItem = {
        label: 'PDF',
        command: ({ item }) => {
          received.push(item);
        },
      };
      const rendered = await render((host) => {
        host.model.set([{ label: 'Export', items: [pdf] }]);
      });
      await openMenu(rendered);
      await openSubmenu(rendered.fixture, 'Export');

      await (await harnessOf(rendered.fixture)).clickItem('PDF');

      expect(received).toEqual([pdf]);
      expect(received[0]).toBe(pdf);
      await expect.poll(() => listEl()).toBeNull();
      await expect.poll(() => rendered.component.closes()).toBe(1);
    });
  });

  describe('focus', () => {
    for (const reduce of [true, false]) {
      const motion = reduce ? 'reduced motion' : 'full motion';

      it(`Escape closes the popup and puts focus on the menu button, ${motion}`, async () => {
        reduceMotion(reduce);
        const rendered = await render();
        await openMenu(rendered);
        await userEvent.keyboard('{ArrowDown}');
        await expect.poll(activeLabel).toBe('Save as draft');

        await userEvent.keyboard('{Escape}');

        await expect.poll(() => rendered.component.closes()).toBe(1);
        await expect.poll(() => listEl()).toBeNull();
        await expect.poll(() => document.activeElement).toBe(menuBtn());
      });

      it(`running an item with Enter puts focus on the menu button, ${motion}`, async () => {
        reduceMotion(reduce);
        const run = vi.fn<(event: WjMenuItemCommandEvent) => void>();
        const rendered = await render((host) => {
          host.model.set([{ label: 'Edit', command: run }]);
        });
        await openMenu(rendered);
        await userEvent.keyboard('{ArrowDown}');
        await expect.poll(activeLabel).toBe('Edit');

        await userEvent.keyboard('{Enter}');

        expect(run).toHaveBeenCalledTimes(1);
        await expect.poll(() => listEl()).toBeNull();
        await expect.poll(() => document.activeElement).toBe(menuBtn());
        expect(rendered.component.closes()).toBe(1);
      });
    }

    it('clicking an item with the pointer puts focus on the menu button', async () => {
      const rendered = await render();
      await openMenu(rendered);

      await userEvent.click(
        find(itemEl('Save as draft'), '[data-pc-section="itemcontent"]', HTMLElement),
      );

      await expect.poll(() => listEl()).toBeNull();
      await expect.poll(() => document.activeElement).toBe(menuBtn());
    });

    it('leaves focus where an outside click on another control put it', async () => {
      const rendered = await render();
      await openMenu(rendered);

      await userEvent.click(after());

      await expect.poll(() => rendered.component.closes()).toBe(1);
      await expect.poll(() => listEl()).toBeNull();
      expect(document.activeElement).toBe(after());
    });

    it('Tab closes the popup, and with nothing after it on the page focus returns to the menu button', async () => {
      const rendered = await render();
      await openMenu(rendered);

      // The popup sits on `body`, after the page, so the browser's Tab has no next stop: without
      // the return focus would end on `body`.
      await userEvent.keyboard('{Tab}');

      await expect.poll(() => rendered.component.closes()).toBe(1);
      await expect.poll(() => listEl()).toBeNull();
      await expect.poll(() => document.activeElement).toBe(menuBtn());
    });
  });

  describe('the content slot', () => {
    it('renders inside the main button, with its icon and its text', async () => {
      await render((host) => {
        host.withSlot.set(true);
      });

      expect(mainEl().querySelector('.slot-icon')).not.toBeNull();
      expect(mainEl().querySelector('.slot-text')?.textContent).toBe('Save');
      expect(mainEl().querySelector('[data-pc-section="buttonlabel"]')).toBeNull();
      expect(mainEl().textContent.trim()).toBe('Save');
    });

    it('lays the slot’s nodes out in the button’s own 8 px row', async () => {
      await render((host) => {
        host.withSlot.set(true);
      });
      const row = getComputedStyle(mainEl());
      const icon = mainEl().querySelector('.slot-icon')?.getBoundingClientRect() ?? new DOMRect();
      const text = mainEl().querySelector('.slot-text')?.getBoundingClientRect() ?? new DOMRect();

      expect(row.display).toBe('flex');
      expect(row.columnGap).toBe('8px');
      expect(Math.round(text.left - icon.right)).toBe(8);
    });

    it('names the button from label, ariaLabel overriding it, and the slot keeps the ARIA routes', async () => {
      const { fixture, component } = await render((host) => {
        host.withSlot.set(true);
        host.ariaLabelledBy.set('caption');
        host.ariaDescribedBy.set('notes');
      });

      expect(mainEl().getAttribute('aria-label')).toBe('Save');
      expect(mainEl().getAttribute('aria-labelledby')).toBe('caption');
      expect(mainEl().getAttribute('aria-describedby')).toBe('notes');

      component.ariaLabel.set('Save the document');
      await fixture.whenStable();
      expect(mainEl().getAttribute('aria-label')).toBe('Save the document');
    });

    it('is inert like the label button when disabled, and clicks emit buttonClick', async () => {
      const { fixture, component } = await render((host) => {
        host.withSlot.set(true);
      });
      const splitButton = await harnessOf(fixture);

      await splitButton.clickButton();
      expect(component.clicks()).toBe(1);

      component.disabled.set(true);
      await fixture.whenStable();
      expect(await splitButton.isDisabled()).toBe(true);
      expect(await splitButton.isMenuButtonDisabled()).toBe(true);
    });

    it('is read once: a slot that appears after creation is not drawn', async () => {
      const { fixture, component } = await render();

      component.withSlot.set(true);
      await fixture.whenStable();

      expect(mainEl().querySelector('.slot-text')).toBeNull();
      expect(mainEl().querySelector('[data-pc-section="buttonlabel"]')?.textContent).toBe('Save');
    });
  });

  describe('pt', () => {
    it('reaches every part: root, the main button, the menu button and the popup’s list', async () => {
      const rendered = await render((host) => {
        host.pt.set(
          ptOf({
            popup: { rootList: { 'data-from-pt': 'popup-list' } },
            root: { 'data-from-pt': 'root' },
            pcButton: { root: { 'data-from-pt': 'main' } },
            pcDropdown: { root: { 'data-from-pt': 'menu-button' } },
          }),
        );
      });
      await openMenu(rendered);

      expect(find(document, 'p-splitbutton', HTMLElement).getAttribute('data-from-pt')).toBe(
        'root',
      );
      expect(mainEl().getAttribute('data-from-pt')).toBe('main');
      expect(menuBtn().getAttribute('data-from-pt')).toBe('menu-button');
      expect(listEl()?.getAttribute('data-from-pt')).toBe('popup-list');
    });

    it('keeps the routed ARIA over a pt value of the same name, and the other pt keys beside it', async () => {
      const rendered = await render((host) => {
        host.ariaLabelledBy.set('caption');
        host.ariaDescribedBy.set('notes');
        host.pt.set(
          ptOf({
            popup: { rootList: { 'aria-label': 'From pt', 'data-kept': 'yes' } },
            pcButton: {
              root: {
                'aria-labelledby': 'notes',
                'aria-describedby': 'caption',
                'data-kept': 'yes',
              },
            },
          }),
        );
      });
      await openMenu(rendered);

      expect(mainEl().getAttribute('aria-labelledby')).toBe('caption');
      expect(mainEl().getAttribute('aria-describedby')).toBe('notes');
      expect(mainEl().getAttribute('data-kept')).toBe('yes');
      expect(listEl()?.getAttribute('aria-label')).toBe('More actions');
      expect(listEl()?.getAttribute('data-kept')).toBe('yes');
    });

    it('lets a consumer pt value stay when nothing is routed to it', async () => {
      await render((host) => {
        host.pt.set({ pcButton: { root: { 'aria-describedby': 'caption' } } });
      });

      expect(mainEl().getAttribute('aria-describedby')).toBe('caption');
    });

    it('takes the function form', async () => {
      const rendered = await render((host) => {
        host.ariaDescribedBy.set('notes');
        host.pt.set(() =>
          ptOf({
            popup: { rootList: { 'data-fn': 'yes' } },
            pcButton: { root: { 'data-fn': 'yes' } },
            pcDropdown: { root: { 'data-fn': 'yes' } },
          }),
        );
      });
      await openMenu(rendered);

      expect(mainEl().getAttribute('data-fn')).toBe('yes');
      expect(mainEl().getAttribute('aria-describedby')).toBe('notes');
      expect(menuBtn().getAttribute('data-fn')).toBe('yes');
      expect(listEl()?.getAttribute('data-fn')).toBe('yes');
      expect(listEl()?.getAttribute('aria-label')).toBe('More actions');
    });

    it('pins a typed gap: pcMenu.list, Menu’s key, does not reach the inner TieredMenu', async () => {
      const rendered = await render((host) => {
        host.pt.set({ pcMenu: { list: { 'data-menu-key': 'x' } } });
      });
      await openMenu(rendered);

      expect(listEl()?.hasAttribute('data-menu-key')).toBe(false);
    });
  });

  describe('the app’s objects', () => {
    it('never changes the model or its items, whatever the reader does', async () => {
      const items: WjMenuItem[] = [
        { label: 'Save as draft', command: () => undefined },
        { label: 'Export', expanded: false, items: [{ label: 'PDF', command: () => undefined }] },
      ];
      const snapshot = JSON.stringify(items);
      const rendered = await render((host) => {
        host.model.set(items);
      });
      await openMenu(rendered);
      await openSubmenu(rendered.fixture, 'Export');
      await userEvent.keyboard('{ArrowDown}{ArrowDown}');

      await (await harnessOf(rendered.fixture)).clickItem('PDF');

      expect(JSON.stringify(items)).toBe(snapshot);
      expect(items).toHaveLength(2);
      for (const item of [...items, ...(items[1]?.items ?? [])]) {
        expect(item).not.toHaveProperty('escape');
        expect(item).not.toHaveProperty('id');
      }
      expect(items[1]).toHaveProperty('expanded', false);
    });
  });

  describe('dev warnings', () => {
    it('warns WJ0003 once for aria-* on the host, and does not forward it', async () => {
      TestBed.configureTestingModule({ providers: [provideWeeljack()] });
      const fixture = TestBed.createComponent(AriaOnHostHost);
      await fixture.whenStable();

      expect(warn).toHaveBeenCalledTimes(1);
      expect(String(warn.mock.calls[0]?.[0])).toContain('WJ0003: wj-splitbutton:');
      expect(String(warn.mock.calls[0]?.[0])).toContain('expandAriaLabel');
      const button = find(
        fixture.nativeElement as HTMLElement,
        'button:not([aria-haspopup])',
        HTMLButtonElement,
      );
      expect(button.hasAttribute('aria-label')).toBe(false);
    });

    it('warns WJ0001 when provideWeeljack is missing', async () => {
      const fixture = TestBed.createComponent(UnprovidedHost);
      await fixture.whenStable();

      expect(
        warn.mock.calls.some(([message]) => String(message).startsWith('WJ0001: wj-splitbutton:')),
      ).toBe(true);
    });
  });

  describe('rendering safety', () => {
    const expectNoInjection = (): void => {
      expect(document.querySelector('img')).toBeNull();
      expect(Reflect.get(window, 'wjInjected')).toBeUndefined();
    };

    it('renders the label as text', async () => {
      const { fixture } = await render((host) => {
        host.label.set(PAYLOAD);
      });

      expect(mainEl().textContent.trim()).toBe(PAYLOAD);
      expect(await (await harnessOf(fixture)).getLabel()).toBe(PAYLOAD);
      expectNoInjection();
    });

    it('renders root, parent and submenu labels as text', async () => {
      const rendered = await render((host) => {
        host.model.set([
          { label: PAYLOAD },
          { label: `${PAYLOAD} parent`, items: [{ label: `${PAYLOAD} child` }] },
        ]);
      });
      await openMenu(rendered);
      await openSubmenu(rendered.fixture, `${PAYLOAD} parent`);

      expect(await (await harnessOf(rendered.fixture)).getItemLabels()).toEqual([
        PAYLOAD,
        `${PAYLOAD} parent`,
        `${PAYLOAD} child`,
      ]);
      expectNoInjection();
    });

    it('renders expandAriaLabel, ariaLabel, ariaLabelledBy and ariaDescribedBy as attribute text', async () => {
      const rendered = await render((host) => {
        host.expandAriaLabel.set(PAYLOAD);
        host.ariaLabel.set(PAYLOAD);
        host.ariaLabelledBy.set(PAYLOAD);
        host.ariaDescribedBy.set(PAYLOAD);
      });
      // Every name is the payload, so the pointer helper cannot tell the buttons apart.
      await (await harnessOf(rendered.fixture)).openMenu();
      await expect.poll(() => listEl()).not.toBeNull();

      expect(menuBtn().getAttribute('aria-label')).toBe(PAYLOAD);
      expect(listEl()?.getAttribute('aria-label')).toBe(PAYLOAD);
      expect(mainEl().getAttribute('aria-label')).toBe(PAYLOAD);
      expect(mainEl().getAttribute('aria-labelledby')).toBe(PAYLOAD);
      expect(mainEl().getAttribute('aria-describedby')).toBe(PAYLOAD);
      expectNoInjection();
    });

    it('renders as text an object that also carries escape: false, styleClass, tooltipOptions and icon', async () => {
      const wider = {
        label: PAYLOAD,
        escape: false,
        styleClass: 'smuggled',
        icon: 'smuggled-icon',
        tooltip: PAYLOAD,
        tooltipOptions: { escape: false },
        items: [{ label: `${PAYLOAD} child`, escape: false, styleClass: 'smuggled' }],
      };
      const smuggled: WjMenuItem = wider;
      const rendered = await render((host) => {
        host.model.set([smuggled, { label: 'Other', escape: false, items: [wider] } as WjMenuItem]);
      });
      await openMenu(rendered);
      await openSubmenu(rendered.fixture, PAYLOAD);

      expect(document.body.textContent).toContain(`${PAYLOAD} child`);
      expectNoInjection();
      expect(document.querySelector('.smuggled, .smuggled-icon')).toBeNull();
    });

    it('shows no tooltip on hover or focus of either button or an item', async () => {
      const rendered = await render((host) => {
        host.model.set([{ label: 'Tipped', tooltipOptions: { escape: false } } as WjMenuItem]);
      });

      await userEvent.hover(mainEl());
      mainEl().focus();
      await userEvent.hover(menuBtn());
      menuBtn().focus();
      await rendered.fixture.whenStable();
      expect(tooltips()).toBe(0);

      await openMenu(rendered);
      await userEvent.hover(find(itemEl('Tipped'), '[data-pc-section="itemcontent"]', HTMLElement));
      await rendered.fixture.whenStable();
      expect(tooltips()).toBe(0);
      expectNoInjection();
    });
  });

  describe('keyboard', () => {
    it('Tab moves from the main button to the menu button', async () => {
      await render();
      before().focus();

      await userEvent.tab();
      expect(document.activeElement).toBe(mainEl());
      await userEvent.tab();
      expect(document.activeElement).toBe(menuBtn());
      await userEvent.tab();
      expect(document.activeElement).toBe(after());
    });

    it('Enter and Space on the main button emit buttonClick', async () => {
      const { component } = await render();
      mainEl().focus();

      await userEvent.keyboard('{Enter}');
      expect(component.clicks()).toBe(1);
      await userEvent.keyboard(' ');
      expect(component.clicks()).toBe(2);
      expect(component.opens()).toBe(0);
    });

    for (const [name, key] of [
      ['Enter', '{Enter}'],
      ['Space', ' '],
      ['Arrow Down', '{ArrowDown}'],
      ['Arrow Up', '{ArrowUp}'],
    ] as const) {
      it(`${name} on the menu button opens the menu`, async () => {
        const rendered = await render();

        await openByKey(rendered, key);

        expect(listEl()).not.toBeNull();
        expect(menuBtn().getAttribute('aria-expanded')).toBe('true');
        expect(rendered.component.clicks()).toBe(0);
      });
    }

    it('Arrow Down and Arrow Up move through the items, skipping a disabled one, and Home and End jump', async () => {
      const rendered = await render();
      await openMenu(rendered);

      await userEvent.keyboard('{ArrowDown}');
      await expect.poll(activeLabel).toBe('Save as draft');
      await userEvent.keyboard('{ArrowDown}');
      await expect.poll(activeLabel).toBe('Save and close');
      await userEvent.keyboard('{ArrowDown}');
      await expect.poll(activeLabel).toBe('Export');
      await userEvent.keyboard('{ArrowDown}');
      await expect.poll(activeLabel).toBe('Export');
      await userEvent.keyboard('{ArrowUp}');
      await expect.poll(activeLabel).toBe('Save and close');
      await userEvent.keyboard('{End}');
      await expect.poll(activeLabel).toBe('Export');
      await userEvent.keyboard('{Home}');
      await expect.poll(activeLabel).toBe('Save as draft');
    });

    it('Arrow Right opens a submenu and moves into it, Arrow Left closes it and moves back', async () => {
      const rendered = await render();
      await openMenu(rendered);
      const splitButton = await harnessOf(rendered.fixture);
      await userEvent.keyboard('{ArrowDown}{ArrowDown}{ArrowDown}');
      await expect.poll(activeLabel).toBe('Export');

      await userEvent.keyboard('{ArrowRight}');
      await expect.poll(activeLabel).toBe('PDF');
      await userEvent.keyboard('{ArrowDown}');
      await expect.poll(activeLabel).toBe('CSV');

      await userEvent.keyboard('{ArrowLeft}');
      await expect.poll(activeLabel).toBe('Export');
      await expect
        .poll(() => splitButton.getItemLabels())
        .toEqual(['Save as draft', 'Save and close', 'Export', 'Delete']);
    });

    it('Enter and Space run the active item and close the menu', async () => {
      const run = vi.fn<(event: WjMenuItemCommandEvent) => void>();
      const rendered = await render((host) => {
        host.model.set([
          { label: 'Cut', command: run },
          { label: 'Copy', command: run },
        ]);
      });
      await openMenu(rendered);
      await userEvent.keyboard('{ArrowDown}');
      await expect.poll(activeLabel).toBe('Cut');

      await userEvent.keyboard('{Enter}');
      expect(run).toHaveBeenCalledTimes(1);
      expect(run.mock.calls[0]?.[0].item.label).toBe('Cut');
      await expect.poll(() => listEl()).toBeNull();

      await openByKey(rendered, '{ArrowDown}');
      await userEvent.keyboard('{ArrowDown}{ArrowDown}');
      await expect.poll(activeLabel).toBe('Copy');
      await userEvent.keyboard(' ');
      expect(run).toHaveBeenCalledTimes(2);
      expect(run.mock.calls[1]?.[0].item.label).toBe('Copy');
      await expect.poll(() => listEl()).toBeNull();
    });
  });

  describe('harness', () => {
    it('describes the control: label, names, state, items, and finds it by label', async () => {
      const { fixture, component } = await render();
      const splitButton = await harnessOf(fixture);

      expect(await splitButton.getLabel()).toBe('Save');
      expect(await splitButton.getMenuButtonName()).toBe('More actions');
      expect(await splitButton.isDisabled()).toBe(false);
      expect(await splitButton.getItems()).toEqual([]);
      await expect(
        TestbedHarnessEnvironment.loader(fixture).getHarness(
          WjSplitButtonHarness.with({ label: 'Save' }),
        ),
      ).resolves.toBeDefined();
      await expect(
        TestbedHarnessEnvironment.loader(fixture).getHarnessOrNull(
          WjSplitButtonHarness.with({ label: 'Nothing' }),
        ),
      ).resolves.toBeNull();

      await splitButton.focusButton();
      expect(document.activeElement).toBe(mainEl());
      await splitButton.focusMenuButton();
      expect(document.activeElement).toBe(menuBtn());

      await splitButton.openMenu();
      await expect.poll(() => splitButton.isMenuOpen()).toBe(true);
      await splitButton.clickItem('Save and close');
      await expect.poll(() => splitButton.isMenuOpen()).toBe(false);
      await expect(splitButton.clickItem('Nothing')).rejects.toThrow(/no item with the label/);
      expect(component.closes()).toBe(1);

      await splitButton.clickButton();
      expect(component.clicks()).toBe(1);
    });

    it('finds items by label, reads their state and refuses a submenu that is not there', async () => {
      const rendered = await render();
      await openMenu(rendered);
      const splitButton = await harnessOf(rendered.fixture);

      const [delete1] = await splitButton.getItems({ label: 'Delete' });
      const [draft] = await splitButton.getItems({ label: /draft$/ });
      expect(await delete1?.isDisabled()).toBe(true);
      expect(await draft?.getLabel()).toBe('Save as draft');
      expect(await draft?.hasSubmenu()).toBe(false);
      await expect(draft?.openSubmenu()).rejects.toThrow(/no submenu/);
    });
  });

  describe('accessibility', () => {
    const states: Record<string, (host: Host) => void> = {
      default: () => undefined,
      outlined: (host) => {
        host.variant.set('outlined');
      },
      text: (host) => {
        host.variant.set('text');
      },
      secondary: (host) => {
        host.severity.set('secondary');
      },
      small: (host) => {
        host.size.set('small');
      },
      disabled: (host) => {
        host.disabled.set(true);
      },
      'no items': (host) => {
        host.model.set([]);
      },
      'the content slot in use': (host) => {
        host.withSlot.set(true);
      },
    };

    for (const scheme of ['light', 'dark'] as const) {
      for (const [name, setup] of Object.entries(states)) {
        it(`has no axe violations: ${name}, ${scheme}`, async () => {
          await render(setup, scheme);

          await expectNoAxeViolations();
        });
      }

      it(`has no axe violations: menu open, ${scheme}`, async () => {
        const rendered = await render(() => undefined, scheme);
        await openMenu(rendered);

        await expectNoAxeViolations();
      });

      it(`has no axe violations: menu open inside the host, ${scheme}`, async () => {
        const rendered = await render((host) => {
          host.appendTo.set('self');
        }, scheme);
        await openMenu(rendered);

        await expectNoAxeViolations();
      });

      it(`has no axe violations: menu open with the content slot, ${scheme}`, async () => {
        const rendered = await render((host) => {
          host.withSlot.set(true);
        }, scheme);
        await openMenu(rendered);

        await expectNoAxeViolations();
      });

      it(`has no axe violations: a submenu open, ${scheme}`, async () => {
        await page.viewport(1280, 800);
        const rendered = await render(() => undefined, scheme);
        await openMenu(rendered);
        await openSubmenu(rendered.fixture, 'Export');

        await expectOnlyTheParentNameGap();
      });
    }

    it('gives both buttons and every item a hit box of at least 24 × 24 px', async () => {
      const rendered = await render((host) => {
        host.size.set('small');
      });
      await openMenu(rendered);
      await openSubmenu(rendered.fixture, 'Export');
      const boxes = [
        mainEl(),
        menuBtn(),
        ...document.querySelectorAll('[role="menuitem"] > [data-pc-section="itemcontent"]'),
      ].map((element) => element.getBoundingClientRect());

      expect(boxes).toHaveLength(2 + 6);
      for (const box of boxes) {
        expect(box.height).toBeGreaterThanOrEqual(24);
        expect(box.width).toBeGreaterThanOrEqual(24);
      }
    });
  });

  describe('motion', () => {
    it('plays no enter or leave motion under reduced motion, and still emits opened and closed', async () => {
      const rendered = await render();
      const read = recordClasses();

      await openMenu(rendered);
      await closeMenu(rendered);

      expect(motionClasses(read())).toEqual([]);
      expect(rendered.component.opens()).toBe(1);
      await expect.poll(() => rendered.component.closes()).toBe(1);
    });

    it('keeps reduced motion on when a consumer pt asks for motion that is not safe', async () => {
      // `motion` is not a typed part of `SplitButtonPassThrough`; Optimus reads it all the same.
      const unsafe = { motion: { safe: false } };
      const rendered = await render((host) => {
        host.pt.set({ root: {}, ...unsafe });
      });
      const read = recordClasses();

      await openMenu(rendered);
      await closeMenu(rendered);

      expect(motionClasses(read())).toEqual([]);
    });

    it('plays the motion when the reader has not asked for less, so the recorder sees it', async () => {
      reduceMotion(false);
      const rendered = await render();
      const read = recordClasses();

      await openMenu(rendered);
      await closeMenu(rendered);

      expect(motionClasses(read()).length).toBeGreaterThan(0);
    });
  });
});
