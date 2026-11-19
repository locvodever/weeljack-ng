/// <reference types="@vitest/browser-playwright" />
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Component, signal, type WritableSignal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import type { MockInstance } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { provideWeeljack } from 'weeljack-ng';
import { WjButton } from 'weeljack-ng/button';
import { WjButtonHarness } from 'weeljack-ng/button/testing';
import { WjSelect } from 'weeljack-ng/select';
import { WjSelectHarness } from 'weeljack-ng/select/testing';
import { expectNoAxeViolations } from '../spec-support/axe';
import { WjSheet } from './sheet';
import { WJ_SHEET_WIDE } from './sheet-wide';
import { WjSheetHarness } from './testing/sheet-harness';
import { afterOverlay } from '../spec-support/teardown';
import { FRAMES } from '../spec-support/frames';

const PAYLOAD = '<img src=x onerror="window.wjInjected = true">';
const ROOT = document.documentElement;

/** A consumer's template: an opener, then one sheet with a body and, optionally, a footer. */
@Component({
  selector: 'wj-sheet-host',
  imports: [WjButton, WjSheet, WjSelect],
  template: `
    @if (withOpener()) {
      <wj-button id="opener" label="Open" (click)="visible.set(true)" />
    }
    <wj-sheet
      [(visible)]="visible"
      [header]="header()"
      [closable]="closable()"
      [style.--wj-sheet-width]="width()"
      [style.--wj-sheet-body-padding]="padding()"
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
        <wj-button wjSheetFooter label="Cancel" severity="secondary" variant="outlined" />
      }
      @if (withFooter()) {
        <wj-button wjSheetFooter label="Save" />
      }
    </wj-sheet>
  `,
})
class Host {
  readonly visible = signal(false);
  readonly header = signal('Rename item');
  readonly closable = signal(true);
  readonly width = signal<string | null>(null);
  readonly padding = signal<string | null>(null);
  readonly text = signal('Give it a new name.');
  readonly withOpener = signal(true);
  readonly withInput = signal(false);
  readonly withSelect = signal(false);
  readonly withFooter = signal(true);
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
  selector: 'wj-sheet-aria-on-host-host',
  imports: [WjSheet],
  template: `<wj-sheet aria-label="Rename" header="Rename item" />`,
})
class AriaOnHostHost {}

/** A sheet rendered without `provideWeeljack`. */
@Component({
  selector: 'wj-sheet-routed-host',
  imports: [WjSheet],
  template: `<wj-sheet header="Rename item" />`,
})
class RoutedHost {}

type Scheme = 'light' | 'dark';
type Mode = 'dialog' | 'drawer';

interface Rendered {
  fixture: ComponentFixture<Host>;
  component: Host;
  element: HTMLElement;
  /** The token the sheet reads: set it to change the mode. */
  wide: WritableSignal<boolean>;
}

interface RenderOptions {
  mode?: Mode;
  scheme?: Scheme;
  translation?: Parameters<typeof provideWeeljack>[0];
  setup?: (host: Host) => void;
}

/** The fixture currently on screen, so `afterEach` can close a sheet a spec left open. */
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

const panelEl = (): HTMLElement | null => document.querySelector<HTMLElement>('[role="dialog"]');
const masks = (): HTMLElement[] =>
  Array.from(document.querySelectorAll<HTMLElement>('.p-dialog-mask, .p-drawer-mask'));
const scrollLocked = (): boolean => document.body.classList.contains('p-overflow-hidden');
const footerEl = (): HTMLElement | null =>
  document.querySelector<HTMLElement>('[data-pc-section="footer"]');

function find<E extends Element>(element: ParentNode, selector: string, type: new () => E): E {
  const found = element.querySelector(selector);
  if (!(found instanceof type)) {
    throw new Error(`${selector} is missing`);
  }
  return found;
}

const closeButtonEl = (): HTMLElement =>
  find(document, '[role="dialog"] [data-pc-section="header"] button', HTMLElement);

/** Renders `Host` with `provideWeeljack`, the token pinned to `mode`, after `setup` ran. */
async function render({
  mode = 'drawer',
  scheme = 'light',
  translation,
  setup = () => undefined,
}: RenderOptions = {}): Promise<Rendered> {
  ROOT.classList.toggle('wj-dark', scheme === 'dark');
  document.body.style.backgroundColor = 'var(--wj-content-background)';
  const wide = signal(mode === 'dialog');
  TestBed.configureTestingModule({
    providers: [
      provideWeeljack({ darkMode: 'class', ...translation }),
      { provide: WJ_SHEET_WIDE, useValue: wide },
    ],
  });
  const fixture = TestBed.createComponent(Host);
  setup(fixture.componentInstance);
  await fixture.whenStable();
  current = {
    fixture,
    component: fixture.componentInstance,
    element: fixture.nativeElement as HTMLElement,
    wide,
  };
  return current;
}

/** Waits until the sheet has entered: it is on the page and focus has moved into it. */
async function entered(): Promise<void> {
  await expect.poll(() => panelEl()?.contains(document.activeElement) ?? false).toBe(true);
}

/** Opens the sheet from the app and waits until it has entered. */
async function open({ fixture, component }: Rendered): Promise<void> {
  component.visible.set(true);
  await fixture.whenStable();
  await entered();
}

/** Waits until the sheet has left and nothing of it, its backdrop or its scroll lock remains. */
async function gone(): Promise<void> {
  await expect.poll(panelEl, FRAMES).toBeNull();
  await expect.poll(masks, FRAMES).toEqual([]);
  await expect.poll(scrollLocked, FRAMES).toBe(false);
}

/** Closes the sheet from the app and waits for the leave to end. */
async function close({ fixture, component }: Rendered): Promise<void> {
  component.visible.set(false);
  await fixture.whenStable();
  await gone();
}

const harnessOf = (fixture: ComponentFixture<unknown>): Promise<WjSheetHarness> =>
  TestbedHarnessEnvironment.loader(fixture).getHarness(WjSheetHarness);

/** The name of the element that has focus: its `aria-label`, else its text. */
const focusedName = (): string => {
  const active = document.activeElement;
  return active?.getAttribute('aria-label') ?? active?.textContent.trim() ?? '';
};

/** Records every class list the panels and backdrops have from now on, to tell whether motion ran. */
function recordClasses(): () => string[] {
  const seen = new Set<string>();
  const read = (): void => {
    for (const element of document.querySelectorAll('.p-dialog, .p-drawer')) {
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
  classes.filter((name) => /enter-active|leave-active|p-drawer-(enter|leave)-/.test(name));

describe('WjSheet', () => {
  let warn: MockInstance<typeof console.warn>;
  const viewport = { width: window.innerWidth, height: window.innerHeight };

  beforeEach(async () => {
    warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    // Motion is off unless a spec turns it on: an open or a close then ends at once.
    reduceMotion(true);
    await page.viewport(1024, 768);
  });

  afterEach(() =>
    afterOverlay(
      async () => {
        // A sheet left open at teardown would reach the next spec: close it and wait for the leave,
        // for the drawer's backdrop to leave the body and for the scroll lock to clear.
        if (current && (panelEl() || masks().length > 0)) {
          await close(current);
        }
      },
      async () => {
        current = undefined;
        ROOT.classList.remove('wj-dark');
        ROOT.style.removeProperty('--wj-mask-transition-duration');
        document.body.style.backgroundColor = '';
        document.head.querySelectorAll('style[data-optimus-style-id]').forEach((style) => {
          style.remove();
        });
        Reflect.deleteProperty(window, 'wjInjected');
        await page.viewport(viewport.width, viewport.height);
      },
    ),
  );

  describe.each<Mode>(['dialog', 'drawer'])('in %s mode', (mode) => {
    const renderMode = (options: Omit<RenderOptions, 'mode'> = {}): Promise<Rendered> =>
      render({ ...options, mode });

    describe('inputs', () => {
      it('renders nothing while closed, in a host that is a block with no height', async () => {
        const { fixture, element } = await renderMode();
        const host = find(element, 'wj-sheet', HTMLElement);

        expect(panelEl()).toBeNull();
        expect(masks()).toEqual([]);
        expect(getComputedStyle(host).display).toBe('block');
        expect(host.getBoundingClientRect().height).toBe(0);
        expect(host.getAttribute('data-wj-mode')).toBe(mode);
        const sheet = await harnessOf(fixture);
        expect(await sheet.isOpen()).toBe(false);
        expect(await sheet.getMode()).toBe(mode);
      });

      it('carries data-wj-mode while open, in the role of a modal dialog', async () => {
        const rendered = await renderMode();
        await open(rendered);
        const sheet = await harnessOf(rendered.fixture);

        expect(await sheet.getMode()).toBe(mode);
        expect(await sheet.getRole()).toBe('dialog');
        expect(await sheet.isModal()).toBe(true);
      });

      it('visible is two-way: the app opens and closes it, and the close button writes it back', async () => {
        const rendered = await renderMode();
        const { fixture, component } = rendered;
        const sheet = await harnessOf(fixture);

        await open(rendered);
        expect(await sheet.isOpen()).toBe(true);
        expect(component.visible()).toBe(true);

        await sheet.close();
        await fixture.whenStable();
        expect(component.visible()).toBe(false);
        await gone();
        expect(await sheet.isOpen()).toBe(false);

        await open(rendered);
        await close(rendered);
        expect(await sheet.isOpen()).toBe(false);
      });

      it('header is the title, names the sheet, and follows the bound value', async () => {
        const rendered = await renderMode();
        await open(rendered);
        const sheet = await harnessOf(rendered.fixture);

        expect(await sheet.getTitle()).toBe('Rename item');
        const title = find(document, '[data-pc-section="title"]', HTMLElement);
        expect(title.id).not.toBe('');
        expect(panelEl()?.getAttribute('aria-labelledby')).toBe(title.id);

        rendered.component.header.set('Rename file');
        await rendered.fixture.whenStable();
        expect(await sheet.getTitle()).toBe('Rename file');
      });

      it('has no aria-describedby, no pt and no ARIA input of its own', async () => {
        const rendered = await renderMode();
        await open(rendered);

        expect(panelEl()?.hasAttribute('aria-describedby')).toBe(false);
        expect(find(document, 'wj-sheet', HTMLElement).hasAttribute('aria-label')).toBe(false);
      });

      it('closable shows the close button and turns it off at once, also while open', async () => {
        const rendered = await renderMode();
        await open(rendered);
        const sheet = await harnessOf(rendered.fixture);
        expect(await sheet.hasCloseButton()).toBe(true);

        rendered.component.closable.set(false);
        await rendered.fixture.whenStable();
        expect(await sheet.hasCloseButton()).toBe(false);

        rendered.component.closable.set(true);
        await rendered.fixture.whenStable();
        expect(await sheet.hasCloseButton()).toBe(true);
      });

      it('is always modal: a backdrop is on the page and the page behind does not scroll', async () => {
        const rendered = await renderMode();
        await open(rendered);

        expect(masks()).toHaveLength(1);
        expect(scrollLocked()).toBe(true);
        expect(await (await harnessOf(rendered.fixture)).hasBackdrop()).toBe(true);
      });

      it('is never draggable or resizable', async () => {
        const rendered = await renderMode();
        await open(rendered);
        const before = panelEl()?.getBoundingClientRect();
        const header = find(document, '[data-pc-section="header"]', HTMLElement);

        header.dispatchEvent(
          new MouseEvent('mousedown', { bubbles: true, clientX: 200, clientY: 200 }),
        );
        document.dispatchEvent(new MouseEvent('mousemove', { clientX: 20, clientY: 20 }));
        document.dispatchEvent(new MouseEvent('mouseup'));

        expect(document.querySelector('.p-resizable-handle')).toBeNull();
        expect(panelEl()?.getBoundingClientRect().left).toBe(before?.left);
        expect(panelEl()?.getBoundingClientRect().top).toBe(before?.top);
      });
    });

    describe('closed', () => {
      it('emits once, after the sheet is gone, when the close button closes it', async () => {
        const rendered = await renderMode();
        await open(rendered);

        await (await harnessOf(rendered.fixture)).close();
        await expect.poll(() => rendered.component.closes()).toBe(1);
        expect(panelEl()).toBeNull();
        await rendered.fixture.whenStable();
        expect(rendered.component.closes()).toBe(1);
      });

      it('emits once when Escape closes it', async () => {
        const rendered = await renderMode();
        await open(rendered);

        await userEvent.keyboard('{Escape}');
        await expect.poll(() => rendered.component.closes()).toBe(1);
        await rendered.fixture.whenStable();
        expect(rendered.component.closes()).toBe(1);
        expect(rendered.component.visible()).toBe(false);
      });

      it('emits once when the app sets visible to false', async () => {
        const rendered = await renderMode();
        await open(rendered);

        await close(rendered);
        expect(rendered.component.closes()).toBe(1);
        await rendered.fixture.whenStable();
        expect(rendered.component.closes()).toBe(1);

        await open(rendered);
        await close(rendered);
        expect(rendered.component.closes()).toBe(2);
      });

      it('does not emit for a sheet that never opened', async () => {
        const rendered = await renderMode();
        rendered.component.visible.set(true);
        rendered.component.visible.set(false);
        await rendered.fixture.whenStable();

        expect(rendered.component.closes()).toBe(0);
      });
    });

    describe('close paths', () => {
      it('Escape closes the sheet while it is closable', async () => {
        const rendered = await renderMode();
        await open(rendered);

        await userEvent.keyboard('{Escape}');

        await expect.poll(() => rendered.component.visible()).toBe(false);
        await gone();
      });

      it(
        mode === 'drawer'
          ? 'a click on the backdrop closes the sheet while it is closable'
          : 'a click on the backdrop never closes the sheet',
        async () => {
          const rendered = await renderMode();
          await open(rendered);

          await (await harnessOf(rendered.fixture)).clickBackdrop();

          if (mode === 'drawer') {
            await expect.poll(() => rendered.component.visible()).toBe(false);
            await gone();
            expect(rendered.component.closes()).toBe(1);
          } else {
            await rendered.fixture.whenStable();
            expect(rendered.component.visible()).toBe(true);
            expect(panelEl()).not.toBeNull();
            expect(rendered.component.closes()).toBe(0);
          }
        },
      );

      it('closable set to false before opening removes the close button, Escape and the backdrop', async () => {
        const rendered = await renderMode({
          setup: (host) => {
            host.closable.set(false);
          },
        });
        await open(rendered);
        const sheet = await harnessOf(rendered.fixture);

        expect(await sheet.hasCloseButton()).toBe(false);
        await userEvent.keyboard('{Escape}');
        await sheet.clickBackdrop();
        await rendered.fixture.whenStable();
        expect(rendered.component.visible()).toBe(true);
        expect(panelEl()).not.toBeNull();
        expect(masks()).toHaveLength(1);
        expect(scrollLocked()).toBe(true);
        expect(rendered.component.closes()).toBe(0);
      });

      it('closable turning false while open stops Escape, and turning true brings it back', async () => {
        const rendered = await renderMode();
        await open(rendered);

        rendered.component.closable.set(false);
        await rendered.fixture.whenStable();
        await userEvent.keyboard('{Escape}');
        await rendered.fixture.whenStable();
        expect(rendered.component.visible()).toBe(true);
        expect(rendered.component.closes()).toBe(0);
        expect(masks()).toHaveLength(1);
        expect(scrollLocked()).toBe(true);

        rendered.component.closable.set(true);
        await rendered.fixture.whenStable();
        await userEvent.keyboard('{Escape}');
        await expect.poll(() => rendered.component.visible()).toBe(false);
        await gone();
        expect(rendered.component.closes()).toBe(1);
      });

      it('closable turning false while open stops the backdrop, and turning true brings it back', async () => {
        const rendered = await renderMode();
        await open(rendered);
        const sheet = await harnessOf(rendered.fixture);

        rendered.component.closable.set(false);
        await rendered.fixture.whenStable();
        await sheet.clickBackdrop();
        await rendered.fixture.whenStable();
        expect(rendered.component.visible()).toBe(true);
        expect(masks()).toHaveLength(1);

        rendered.component.closable.set(true);
        await rendered.fixture.whenStable();
        await sheet.clickBackdrop();
        if (mode === 'drawer') {
          await expect.poll(() => rendered.component.visible()).toBe(false);
          await gone();
          expect(rendered.component.closes()).toBe(1);
        } else {
          expect(rendered.component.visible()).toBe(true);
        }
      });

      it('closable turning true while open, after opening without it, brings Escape back', async () => {
        const rendered = await renderMode({
          setup: (host) => {
            host.closable.set(false);
          },
        });
        await open(rendered);
        rendered.component.closable.set(true);
        await rendered.fixture.whenStable();

        await userEvent.keyboard('{Escape}');
        await expect.poll(() => rendered.component.visible()).toBe(false);
        await gone();
        expect(rendered.component.closes()).toBe(1);
      });

      it('Escape pressed with focus on the page, not in the sheet, still follows closable', async () => {
        const rendered = await renderMode();
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
        expect(masks()).toHaveLength(1);

        rendered.component.closable.set(true);
        await rendered.fixture.whenStable();
        await userEvent.keyboard('{Escape}');
        await expect.poll(() => rendered.component.visible()).toBe(false);
        await gone();
      });

      it('Escape inside the body of a non-closable sheet keeps the backdrop and the scroll lock', async () => {
        const rendered = await renderMode({
          setup: (host) => {
            host.withInput.set(true);
            host.closable.set(false);
          },
        });
        await open(rendered);
        await expect.poll(() => document.activeElement?.id).toBe('body-input');

        await userEvent.keyboard('{Escape}');
        await rendered.fixture.whenStable();
        expect(rendered.component.escapes()).toBe(1);
        expect(rendered.component.visible()).toBe(true);
        expect(masks()).toHaveLength(1);
        expect(masks()[0]?.classList.contains('p-overlay-mask-leave-active')).toBe(false);
        expect(scrollLocked()).toBe(true);
      });

      it('Escape on the sheet or a footer action of a non-closable sheet keeps the backdrop too', async () => {
        const rendered = await renderMode({
          setup: (host) => {
            host.closable.set(false);
          },
        });
        await open(rendered);

        expect(focusedName()).toBe('Cancel');
        await userEvent.keyboard('{Escape}');
        panelEl()?.focus();
        await userEvent.keyboard('{Escape}');
        await rendered.fixture.whenStable();

        expect(rendered.component.visible()).toBe(true);
        expect(masks()[0]?.classList.contains('p-overlay-mask-leave-active')).toBe(false);
        expect(scrollLocked()).toBe(true);
      });

      it('Escape closes an open select in the body first, and the sheet stays while it is not closable', async () => {
        const rendered = await renderMode({
          setup: (host) => {
            host.withSelect.set(true);
          },
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
        expect(panelEl()).not.toBeNull();
        expect(masks()).toHaveLength(1);
        expect(scrollLocked()).toBe(true);
      });
    });

    describe('the body and the footer', () => {
      it('puts the footer below the body, outside the part that scrolls, with the actions in a row', async () => {
        const rendered = await renderMode();
        await open(rendered);
        const sheet = await harnessOf(rendered.fixture);
        const body = find(document, '#body-text', HTMLElement);
        const footer = find(document, '[data-pc-section="footer"]', HTMLElement);

        const buttons = await sheet.getAllHarnesses(WjButtonHarness);
        expect(await Promise.all(buttons.map((button) => button.getLabel()))).toEqual([
          'Cancel',
          'Save',
        ]);
        expect(footer.contains(find(footer, 'wj-button', HTMLElement))).toBe(true);
        expect(body.closest('[data-pc-section="content"]')?.contains(footer)).toBe(false);
        expect(footer.getBoundingClientRect().top).toBeGreaterThanOrEqual(
          body.getBoundingClientRect().bottom,
        );
        expect(getComputedStyle(footer).justifyContent).toMatch(/flex-end|end/);
        expect(getComputedStyle(footer).flexWrap).toBe('wrap');
        expect(getComputedStyle(footer).padding).toBe('0px 20px 20px');
      });

      it('has no footer region without footer elements, and gets one when they appear', async () => {
        const rendered = await renderMode({
          setup: (host) => {
            host.withFooter.set(false);
          },
        });
        await open(rendered);

        const empty = footerEl();
        expect(empty === null || getComputedStyle(empty).display === 'none').toBe(true);
        expect(find(document, '[data-pc-section="content"]', HTMLElement).textContent).toContain(
          'Give it a new name.',
        );

        rendered.component.withFooter.set(true);
        await rendered.fixture.whenStable();
        await expect.poll(() => getComputedStyle(footerEl() ?? document.body).display).toBe('flex');
        const buttons = await (await harnessOf(rendered.fixture)).getAllHarnesses(WjButtonHarness);
        expect(buttons).toHaveLength(2);
      });

      it('keeps the 44px header row without a close button, so the body does not move', async () => {
        const rendered = await renderMode();
        await open(rendered);
        const body = find(document, '#body-text', HTMLElement);
        const withButton = body.getBoundingClientRect().top;

        rendered.component.closable.set(false);
        await rendered.fixture.whenStable();

        expect(body.getBoundingClientRect().top).toBe(withButton);
        expect(find(document, '[data-pc-section="header"]', HTMLElement).offsetHeight).toBe(64);
      });

      it('draws the title at 1.25rem and wraps a long one with the close button in the top corner', async () => {
        const rendered = await renderMode({
          setup: (host) => {
            host.header.set(`${'A very long title '.repeat(12)}${'x'.repeat(80)}`);
          },
        });
        await open(rendered);
        const title = find(document, '[data-pc-section="title"]', HTMLElement);
        const header = find(document, '[data-pc-section="header"]', HTMLElement);

        expect(getComputedStyle(title).fontSize).toBe('20px');
        expect(title.getBoundingClientRect().height).toBeGreaterThan(60);
        expect(
          closeButtonEl().getBoundingClientRect().top - header.getBoundingClientRect().top,
        ).toBe(12);
        expect(panelEl()?.getBoundingClientRect().right).toBeLessThanOrEqual(window.innerWidth);
      });

      it('lets a crowded footer wrap instead of overflowing', async () => {
        await page.viewport(320, 640);
        const rendered = await renderMode();
        await open(rendered);
        const footer = find(document, '[data-pc-section="footer"]', HTMLElement);
        for (let index = 0; index < 5; index += 1) {
          const extra = document.createElement('button');
          extra.setAttribute('wjSheetFooter', '');
          extra.textContent = `Extra action number ${String(index)}`;
          footer.append(extra);
        }

        expect(footer.scrollWidth).toBeLessThanOrEqual(footer.clientWidth);
      });

      it('scrolls the body, and only the body, when it is long', async () => {
        const rendered = await renderMode({
          setup: (host) => {
            host.text.set('Long body text. '.repeat(2000));
          },
        });
        await open(rendered);
        const content = find(document, '[data-pc-section="content"]', HTMLElement);

        expect(content.scrollHeight).toBeGreaterThan(content.clientHeight);
        expect(getComputedStyle(content).overflowY).toBe('auto');
        expect(footerEl()?.getBoundingClientRect().bottom).toBeLessThanOrEqual(window.innerHeight);
      });
    });

    describe('styling', () => {
      it('pads the body by --wj-sheet-body-padding, 0 1.25rem 1.25rem by default', async () => {
        const rendered = await renderMode();
        await open(rendered);
        const body = find(document, '.wj-sheet-body', HTMLElement);

        expect(getComputedStyle(body).padding).toBe('0px 20px 20px');

        rendered.component.padding.set('0');
        await rendered.fixture.whenStable();
        expect(getComputedStyle(body).padding).toBe('0px');
        expect(
          getComputedStyle(find(document, '[data-pc-section="content"]', HTMLElement)).padding,
        ).toBe('0px');
        // The header and the footer keep their insets.
        expect(
          getComputedStyle(find(document, '[data-pc-section="header"]', HTMLElement)).padding,
        ).toBe('12px 12px 8px 20px');
        expect(
          getComputedStyle(find(document, '[data-pc-section="footer"]', HTMLElement)).padding,
        ).toBe('0px 20px 20px');
      });
    });

    describe('focus', () => {
      it('moves to the first control of the body when it opens', async () => {
        const rendered = await renderMode({
          setup: (host) => {
            host.withInput.set(true);
          },
        });
        await open(rendered);

        expect(document.activeElement?.id).toBe('body-input');
        expect(await (await harnessOf(rendered.fixture)).containsFocus()).toBe(true);
      });

      it('moves to the first action of the footer when the body has no control', async () => {
        const rendered = await renderMode();
        await open(rendered);

        expect(focusedName()).toBe('Cancel');
      });

      it('moves to the close button when only the header has a control', async () => {
        const rendered = await renderMode({
          setup: (host) => {
            host.withFooter.set(false);
          },
        });
        await open(rendered);

        expect(focusedName()).toBe('Close');
      });

      it('moves to the sheet itself when nothing inside can take focus', async () => {
        const rendered = await renderMode({
          setup: (host) => {
            host.withFooter.set(false);
            host.closable.set(false);
          },
        });
        await open(rendered);

        expect(document.activeElement).toBe(panelEl());
        expect(panelEl()?.getAttribute('tabindex')).toBe('-1');
      });

      it('Tab and Shift+Tab cycle inside the sheet', async () => {
        const rendered = await renderMode({
          setup: (host) => {
            host.withInput.set(true);
          },
        });
        await open(rendered);
        expect(document.activeElement?.id).toBe('body-input');

        const forward: string[] = [];
        for (let step = 0; step < 4; step += 1) {
          await userEvent.tab();
          forward.push(focusedName());
        }
        expect(forward).toEqual(['Cancel', 'Save', 'Close', 'Name']);

        const backward: string[] = [];
        for (let step = 0; step < 3; step += 1) {
          await userEvent.tab({ shift: true });
          backward.push(focusedName());
        }
        expect(backward).toEqual(['Close', 'Save', 'Cancel']);
      });

      it.each([
        ['Enter', '{Enter}'],
        ['Space', ' '],
      ])('%s on the close button closes the sheet', async (_name, key) => {
        const rendered = await renderMode({
          setup: (host) => {
            host.withFooter.set(false);
          },
        });
        await open(rendered);
        expect(focusedName()).toBe('Close');

        await userEvent.keyboard(key);
        await expect.poll(() => rendered.component.visible()).toBe(false);
        await gone();
      });

      it('returns to the opener when it closes, whatever closed it', async () => {
        const rendered = await renderMode();
        const opener = (): HTMLElement => find(rendered.element, '#opener button', HTMLElement);

        await userEvent.click(opener());
        await entered();
        await userEvent.keyboard('{Escape}');
        await gone();
        expect(document.activeElement).toBe(opener());

        await userEvent.click(opener());
        await entered();
        await (await harnessOf(rendered.fixture)).close();
        await gone();
        expect(document.activeElement).toBe(opener());

        if (mode === 'drawer') {
          await userEvent.click(opener());
          await entered();
          await (await harnessOf(rendered.fixture)).clickBackdrop();
          await gone();
          expect(document.activeElement).toBe(opener());
        }

        await userEvent.click(opener());
        await entered();
        rendered.component.visible.set(false);
        await gone();
        expect(document.activeElement).toBe(opener());
      });

      it('does not fail when the opener is gone, and leaves focus to the closed handler', async () => {
        const rendered = await renderMode();
        await userEvent.click(find(rendered.element, '#opener button', HTMLElement));
        await entered();

        rendered.component.withOpener.set(false);
        await rendered.fixture.whenStable();
        await close(rendered);

        expect(rendered.component.closes()).toBe(1);
        expect(document.activeElement).toBe(document.body);
      });
    });

    describe('motion', () => {
      it('plays no enter or leave motion under reduced motion, and still emits closed', async () => {
        const rendered = await renderMode();
        const read = recordClasses();

        await open(rendered);
        await close(rendered);

        expect(motionClasses(read())).toEqual([]);
        expect(rendered.component.closes()).toBe(1);
      });

      it('the backdrop still leaves the body under reduced motion, where its animation lasts 0s', async () => {
        // The theme's reduced-motion block sets this variable; matchMedia is mocked, so set it here.
        ROOT.style.setProperty('--wj-mask-transition-duration', '0s');
        const rendered = await renderMode();
        await open(rendered);
        expect(getComputedStyle(masks()[0] ?? document.body).animationDuration).toBe('0s');

        await close(rendered);

        expect(masks()).toEqual([]);
        expect(scrollLocked()).toBe(false);
        expect(rendered.component.closes()).toBe(1);
      });

      it('plays the motion when the reader has not asked for less, so the recorder sees it', async () => {
        reduceMotion(false);
        const rendered = await renderMode();
        const read = recordClasses();

        await open(rendered);
        await close(rendered);

        expect(motionClasses(read()).length).toBeGreaterThan(0);
        expect(rendered.component.closes()).toBe(1);
      });
    });

    describe('the close button', () => {
      it('is named Close by default', async () => {
        const rendered = await renderMode();
        await open(rendered);

        expect(await (await harnessOf(rendered.fixture)).getCloseLabel()).toBe('Close');
        expect(closeButtonEl().getAttribute('aria-label')).toBe('Close');
      });

      it('follows the translation: a changed aria.close renames it', async () => {
        const rendered = await renderMode({
          translation: { translation: { aria: { close: 'Đóng' } } },
        });
        await open(rendered);

        expect(await (await harnessOf(rendered.fixture)).getCloseLabel()).toBe('Đóng');
      });

      it('has a box of at least 24 x 24 px, 44 x 44 by the default look', async () => {
        const rendered = await renderMode();
        await open(rendered);
        const box = closeButtonEl().getBoundingClientRect();

        expect(box.width).toBeGreaterThanOrEqual(24);
        expect(box.height).toBeGreaterThanOrEqual(24);
        expect(box.width).toBe(44);
        expect(box.height).toBe(44);
      });

      it('never takes focus by autofocus', async () => {
        const rendered = await renderMode();
        await open(rendered);

        expect(closeButtonEl().hasAttribute('autofocus')).toBe(false);
      });
    });

    describe('safety', () => {
      it('renders an HTML payload in header as text', async () => {
        const rendered = await renderMode({
          setup: (host) => {
            host.header.set(PAYLOAD);
          },
        });
        await open(rendered);

        expect(await (await harnessOf(rendered.fixture)).getTitle()).toBe(PAYLOAD);
        expect(rendered.element.querySelector('img, script')).toBeNull();
        expect(document.querySelector('[role="dialog"] img, [role="dialog"] script')).toBeNull();
        expect(Reflect.get(window, 'wjInjected')).toBeUndefined();
      });
    });

    describe('accessibility', () => {
      for (const scheme of ['light', 'dark'] as const) {
        describe(`axe, ${scheme}`, () => {
          it('finds no violation while closed', async () => {
            const { element } = await renderMode({ scheme });
            await expectNoAxeViolations(element);
          });

          it('finds no violation while open', async () => {
            const rendered = await renderMode({ scheme });
            await open(rendered);
            await expectNoAxeViolations(rendered.element);
          });

          it('finds no violation while open without a footer', async () => {
            const rendered = await renderMode({
              scheme,
              setup: (host) => {
                host.withFooter.set(false);
              },
            });
            await open(rendered);
            await expectNoAxeViolations(rendered.element);
          });

          it('finds no violation while open with closable false', async () => {
            const rendered = await renderMode({
              scheme,
              setup: (host) => {
                host.closable.set(false);
              },
            });
            await open(rendered);
            await expectNoAxeViolations(rendered.element);
          });
        });
      }
    });
  });

  describe('the dialog mode', () => {
    it('is centred, with the width --wj-sheet-width: min(32rem, 100vw - 2rem) by default', async () => {
      const rendered = await render({ mode: 'dialog' });
      await open(rendered);
      const box = panelEl()?.getBoundingClientRect();

      expect(box?.width).toBe(512);
      expect((box?.left ?? 0) + (box?.width ?? 0) / 2).toBeCloseTo(window.innerWidth / 2, 0);
      await close(rendered);

      await page.viewport(320, 640);
      await open(rendered);
      expect(panelEl()?.getBoundingClientRect().width).toBe(320 - 32);
    });

    it('takes its width from --wj-sheet-width set on the host', async () => {
      const rendered = await render({
        mode: 'dialog',
        setup: (host) => {
          host.width.set('20rem');
        },
      });
      await open(rendered);

      expect(panelEl()?.getBoundingClientRect().width).toBe(320);
    });

    it('rounds its panel by 12px and has no bottom-sheet geometry', async () => {
      const rendered = await render({ mode: 'dialog' });
      await open(rendered);

      expect(getComputedStyle(panelEl() ?? document.body).borderTopLeftRadius).toBe('12px');
      expect(document.querySelector('.p-drawer')).toBeNull();
    });
  });

  describe('the drawer mode', () => {
    it('is a bottom drawer as wide as the page, as tall as its content', async () => {
      const rendered = await render({
        mode: 'drawer',
        setup: (host) => {
          host.withFooter.set(false);
        },
      });
      await open(rendered);
      const box = panelEl()?.getBoundingClientRect();
      const header = find(document, '[data-pc-section="header"]', HTMLElement);
      const content = find(document, '[data-pc-section="content"]', HTMLElement);

      expect(box?.width).toBe(window.innerWidth);
      expect(box?.bottom).toBe(window.innerHeight);
      const fit = header.offsetHeight + content.offsetHeight;
      expect(box?.height).toBeGreaterThanOrEqual(fit);
      expect(box?.height).toBeLessThanOrEqual(fit + 6);
      expect(fit).toBeLessThan(200);
      expect(document.querySelector('.p-dialog')).toBeNull();
    });

    it('never grows past 90dvh, and its body scrolls', async () => {
      const rendered = await render({
        mode: 'drawer',
        setup: (host) => {
          host.text.set('Long body text. '.repeat(2000));
        },
      });
      await open(rendered);
      const box = panelEl()?.getBoundingClientRect();
      const content = find(document, '[data-pc-section="content"]', HTMLElement);

      expect(box?.height).toBeCloseTo(window.innerHeight * 0.9, 0);
      expect(content.scrollHeight).toBeGreaterThan(content.clientHeight);
    });

    it('rounds its top corners by 12px and squares the bottom ones', async () => {
      const rendered = await render({ mode: 'drawer' });
      await open(rendered);
      const style = getComputedStyle(panelEl() ?? document.body);

      expect([
        style.borderTopLeftRadius,
        style.borderTopRightRadius,
        style.borderBottomRightRadius,
        style.borderBottomLeftRadius,
      ]).toEqual(['12px', '12px', '0px', '0px']);
    });

    it('is named by its title: the root is a dialog, not a complementary landmark', async () => {
      const rendered = await render({ mode: 'drawer' });
      await open(rendered);
      const title = find(document, '[data-pc-section="title"]', HTMLElement);

      expect(title.id).toMatch(/^wj-sheet-title-\d+$/);
      expect(panelEl()?.getAttribute('aria-labelledby')).toBe(title.id);
      expect(panelEl()?.getAttribute('aria-modal')).toBe('true');
    });

    it('closable turning true while open, after opening without it, brings the backdrop back', async () => {
      const rendered = await render({
        mode: 'drawer',
        setup: (host) => {
          host.closable.set(false);
        },
      });
      await open(rendered);
      rendered.component.closable.set(true);
      await rendered.fixture.whenStable();

      await (await harnessOf(rendered.fixture)).clickBackdrop();
      await expect.poll(() => rendered.component.visible()).toBe(false);
      await gone();
      expect(rendered.component.closes()).toBe(1);
    });

    it('takes the body padding from --wj-sheet-body-padding too', async () => {
      const rendered = await render({
        mode: 'drawer',
        setup: (host) => {
          host.padding.set('0 8px 16px');
        },
      });
      await open(rendered);

      expect(getComputedStyle(find(document, '.wj-sheet-body', HTMLElement)).padding).toBe(
        '0px 8px 16px',
      );
    });
  });

  describe('a mode change while open', () => {
    const backdropsAndLock = (): { masks: number; locked: boolean } => ({
      masks: masks().length,
      locked: scrollLocked(),
    });

    it('swaps the overlay, keeps the body nodes and what was typed, one backdrop and one scroll lock', async () => {
      const rendered = await render({
        mode: 'drawer',
        setup: (host) => {
          host.withInput.set(true);
        },
      });
      await open(rendered);
      const input = find(document, '#body-input', HTMLInputElement);
      await userEvent.fill(input, 'draft name');
      const sheet = await harnessOf(rendered.fixture);
      expect(document.querySelector('.p-drawer')).not.toBeNull();

      rendered.wide.set(true);
      await rendered.fixture.whenStable();
      await expect.poll(() => document.querySelector('.p-dialog') !== null).toBe(true);

      expect(document.querySelector('.p-drawer')).toBeNull();
      expect(await sheet.getMode()).toBe('dialog');
      expect(find(document, '#body-input', HTMLInputElement)).toBe(input);
      expect(input.value).toBe('draft name');
      expect(backdropsAndLock()).toEqual({ masks: 1, locked: true });
      expect(rendered.component.closes()).toBe(0);
      expect(rendered.component.visible()).toBe(true);
      expect(await sheet.isOpen()).toBe(true);

      rendered.wide.set(false);
      await rendered.fixture.whenStable();
      await expect.poll(() => document.querySelector('.p-drawer') !== null).toBe(true);
      expect(document.querySelector('.p-dialog')).toBeNull();
      expect(find(document, '#body-input', HTMLInputElement)).toBe(input);
      expect(input.value).toBe('draft name');
      expect(backdropsAndLock()).toEqual({ masks: 1, locked: true });
      expect(rendered.component.closes()).toBe(0);

      await close(rendered);
      expect(rendered.component.closes()).toBe(1);
      expect(backdropsAndLock()).toEqual({ masks: 0, locked: false });
    });

    it('releases the one backdrop and the one scroll lock on close, from either mode', async () => {
      const rendered = await render({ mode: 'dialog' });
      await open(rendered);
      rendered.wide.set(false);
      await rendered.fixture.whenStable();
      await expect.poll(() => document.querySelector('.p-drawer') !== null).toBe(true);

      await (await harnessOf(rendered.fixture)).close();
      await gone();
      expect(rendered.component.closes()).toBe(1);
      await rendered.fixture.whenStable();
      expect(rendered.component.closes()).toBe(1);
    });

    it('gives focus back to the control that had it, and the final close to the original opener', async () => {
      const rendered = await render({
        mode: 'drawer',
        setup: (host) => {
          host.withInput.set(true);
        },
      });
      const opener = find(rendered.element, '#opener button', HTMLElement);
      await userEvent.click(opener);
      await entered();
      const input = find(document, '#body-input', HTMLInputElement);
      input.focus();

      rendered.wide.set(true);
      await rendered.fixture.whenStable();
      await expect.poll(() => document.querySelector('.p-dialog') !== null).toBe(true);
      await expect.poll(() => document.activeElement).toBe(input);

      await userEvent.keyboard('{Escape}');
      await gone();
      expect(document.activeElement).toBe(opener);
      expect(rendered.component.closes()).toBe(1);
    });

    it('moves focus in by the usual order when the control that had it is not in the new mode', async () => {
      const rendered = await render({ mode: 'drawer' });
      await open(rendered);
      expect(focusedName()).toBe('Cancel');
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }

      rendered.wide.set(true);
      await rendered.fixture.whenStable();
      await expect.poll(() => document.querySelector('.p-dialog') !== null).toBe(true);
      await entered();

      expect(panelEl()?.contains(document.activeElement)).toBe(true);
    });

    it('keeps Escape and closable working in the new mode', async () => {
      const rendered = await render({ mode: 'drawer' });
      await open(rendered);
      rendered.wide.set(true);
      await rendered.fixture.whenStable();
      await expect.poll(() => document.querySelector('.p-dialog') !== null).toBe(true);
      await entered();

      rendered.component.closable.set(false);
      await rendered.fixture.whenStable();
      await userEvent.keyboard('{Escape}');
      await rendered.fixture.whenStable();
      expect(rendered.component.visible()).toBe(true);

      rendered.component.closable.set(true);
      await rendered.fixture.whenStable();
      await userEvent.keyboard('{Escape}');
      await expect.poll(() => rendered.component.visible()).toBe(false);
      await gone();
      expect(rendered.component.closes()).toBe(1);
    });

    it('plays no enter motion for the sheet that replaces the other', async () => {
      reduceMotion(false);
      const rendered = await render({ mode: 'drawer' });
      await open(rendered);
      const read = recordClasses();

      rendered.wide.set(true);
      await rendered.fixture.whenStable();
      await expect.poll(() => document.querySelector('.p-dialog') !== null).toBe(true);
      await entered();

      expect(motionClasses(read().filter((name) => name.includes('p-dialog')))).toEqual([]);
    });

    it('does nothing to a closed sheet but change data-wj-mode', async () => {
      const rendered = await render({ mode: 'drawer' });

      rendered.wide.set(true);
      await rendered.fixture.whenStable();

      expect(find(rendered.element, 'wj-sheet', HTMLElement).getAttribute('data-wj-mode')).toBe(
        'dialog',
      );
      expect(panelEl()).toBeNull();
      expect(rendered.component.closes()).toBe(0);
    });
  });

  describe('setup and ARIA checks', () => {
    it('warns WJ0001 when provideWeeljack is missing', async () => {
      const fixture = TestBed.createComponent(RoutedHost);
      await fixture.whenStable();

      expect(warn).toHaveBeenCalledTimes(1);
      expect(warn).toHaveBeenCalledWith(
        'WJ0001: wj-sheet: provideWeeljack() is missing from the application providers. ' +
          'Add provideWeeljack() to your application config. ' +
          'Find more at https://locvodever.github.io/weeljack-ng/errors/WJ0001',
      );
    });

    it('stays silent with provideWeeljack', async () => {
      const rendered = await render();
      await open(rendered);
      expect(warn).not.toHaveBeenCalled();
    });

    it('warns WJ0003 once when aria-* is written on the host, and says the header names the sheet', async () => {
      TestBed.configureTestingModule({ providers: [provideWeeljack()] });
      const fixture = TestBed.createComponent(AriaOnHostHost);
      await fixture.whenStable();

      expect(warn).toHaveBeenCalledTimes(1);
      expect(warn).toHaveBeenCalledWith(
        'WJ0003: wj-sheet: aria-label is set on the host, where it is not forwarded to the focusable element. ' +
          'The header names the sheet; remove the attribute. ' +
          'Find more at https://locvodever.github.io/weeljack-ng/errors/WJ0003',
      );
    });
  });
});
