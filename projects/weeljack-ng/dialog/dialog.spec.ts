/// <reference types="@vitest/browser-playwright" />
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Component, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import type { MockInstance } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { provideWeeljack } from 'weeljack-ng';
import { WjButton } from 'weeljack-ng/button';
import { WjButtonHarness } from 'weeljack-ng/button/testing';
import { WjDialog, WjDialogFooterSlot, type WjDialogPt } from 'weeljack-ng/dialog';
import { WjDialogHarness } from 'weeljack-ng/dialog/testing';
import { WjSelect } from 'weeljack-ng/select';
import { WjSelectHarness } from 'weeljack-ng/select/testing';
import { expectNoAxeViolations } from '../spec-support/axe';

const PAYLOAD = '<img src=x onerror="window.wjInjected = true">';
const ROOT = document.documentElement;

/** A consumer's template: an opener, then one dialog with a body and, optionally, a footer. */
@Component({
  selector: 'wj-dialog-host',
  imports: [WjButton, WjDialog, WjDialogFooterSlot, WjSelect],
  template: `
    @if (withOpener()) {
      <wj-button id="opener" label="Open" (click)="visible.set(true)" />
    }
    <wj-dialog
      [(visible)]="visible"
      [header]="header()"
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
        <ng-template wjDialogFooter>
          <wj-button label="Cancel" severity="secondary" variant="outlined" />
          <wj-button label="Delete" severity="danger" />
        </ng-template>
      }
    </wj-dialog>
  `,
})
class Host {
  readonly visible = signal(false);
  readonly header = signal('Delete this file?');
  readonly closable = signal(true);
  readonly describedBy = signal<string | undefined>('body-text');
  readonly pt = signal<WjDialogPt>(undefined);
  readonly text = signal('This cannot be undone.');
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
  selector: 'wj-dialog-aria-on-host-host',
  imports: [WjDialog],
  template: `<wj-dialog aria-label="Delete" header="Delete this file?" />`,
})
class AriaOnHostHost {}

/** A dialog rendered without `provideWeeljack`. */
@Component({
  selector: 'wj-dialog-routed-host',
  imports: [WjDialog],
  template: `<wj-dialog header="Delete this file?" />`,
})
class RoutedHost {}

/** A non-closable dialog with a closable one in its body: the stacked case of FR-9. */
@Component({
  selector: 'wj-dialog-nested-host',
  imports: [WjDialog],
  template: `
    <wj-dialog [(visible)]="outer" header="Outer" [closable]="false">
      <p>Saving.</p>
      <wj-dialog [(visible)]="inner" header="Inner"><p>Are you sure?</p></wj-dialog>
    </wj-dialog>
  `,
})
class NestedHost {
  readonly outer = signal(false);
  readonly inner = signal(false);
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

const dialogEl = (): HTMLElement | null => document.querySelector<HTMLElement>('[role="dialog"]');
const maskEl = (): HTMLElement | null => document.querySelector<HTMLElement>('.p-dialog-mask');

function find<E extends Element>(element: ParentNode, selector: string, type: new () => E): E {
  const found = element.querySelector(selector);
  if (!(found instanceof type)) {
    throw new Error(`${selector} is missing`);
  }
  return found;
}

const closeButtonEl = (): HTMLElement =>
  find(document, '[role="dialog"] .p-dialog-close-button', HTMLElement);

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

/** Opens the dialog from the app and waits until it has finished entering (`opened` emitted). */
async function open({ fixture, component }: Rendered): Promise<void> {
  const before = component.opens();
  component.visible.set(true);
  await fixture.whenStable();
  await expect.poll(() => component.opens()).toBe(before + 1);
}

/** Waits until the dialog has left and nothing of it, its backdrop or its scroll lock remains. */
async function gone(): Promise<void> {
  await expect.poll(() => maskEl()).toBeNull();
  await expect.poll(() => document.body.classList.contains('p-overflow-hidden')).toBe(false);
}

/** Closes the dialog from the app and waits for the leave to end. */
async function close({ fixture, component }: Rendered): Promise<void> {
  component.visible.set(false);
  await fixture.whenStable();
  await gone();
}

const harnessOf = (fixture: ComponentFixture<unknown>): Promise<WjDialogHarness> =>
  TestbedHarnessEnvironment.loader(fixture).getHarness(WjDialogHarness);

/** The name of the element that has focus: its `aria-label`, else its text. */
const focusedName = (): string => {
  const active = document.activeElement;
  return active?.getAttribute('aria-label') ?? active?.textContent.trim() ?? '';
};

/**
 * Records every class list `.p-dialog` and its mask have from now on, so a spec can tell whether
 * Optimus's enter and leave motion ran. Call the returned function to stop and read them.
 */
function recordClasses(): () => string[] {
  const seen = new Set<string>();
  const read = (): void => {
    for (const element of document.querySelectorAll('.p-dialog, .p-dialog-mask')) {
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

describe('WjDialog', () => {
  let warn: MockInstance<typeof console.warn>;
  const viewport = { width: window.innerWidth, height: window.innerHeight };

  beforeEach(() => {
    warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    // Motion is off unless a spec turns it on: an open or a close then ends at once.
    reduceMotion(true);
  });

  afterEach(async () => {
    // An overlay left open at teardown would reach the next spec: close it and wait for the leave.
    if (current && dialogEl()) {
      await close(current);
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
    it('renders nothing while closed, in a host that is a block with no height', async () => {
      const { fixture, element } = await render();
      const host = find(element, 'wj-dialog', HTMLElement);

      expect(dialogEl()).toBeNull();
      expect(getComputedStyle(host).display).toBe('block');
      expect(host.getBoundingClientRect().height).toBe(0);
      expect(await (await harnessOf(fixture)).isOpen()).toBe(false);
    });

    it('visible is two-way: the app opens and closes it, and the close button writes it back', async () => {
      const rendered = await render();
      const { fixture, component } = rendered;
      const dialog = await harnessOf(fixture);

      await open(rendered);
      expect(await dialog.isOpen()).toBe(true);
      expect(component.visible()).toBe(true);

      await dialog.close();
      await fixture.whenStable();
      expect(component.visible()).toBe(false);
      await gone();
      expect(await dialog.isOpen()).toBe(false);

      await open(rendered);
      await close(rendered);
      expect(await dialog.isOpen()).toBe(false);
    });

    it('header is the title, names the dialog, and follows the bound value', async () => {
      const rendered = await render();
      await open(rendered);
      const dialog = await harnessOf(rendered.fixture);

      expect(await dialog.getTitle()).toBe('Delete this file?');
      const title = find(document, '[data-pc-section="title"]', HTMLElement);
      expect(dialogEl()?.getAttribute('aria-labelledby')).toBe(title.id);

      rendered.component.header.set('Remove it?');
      await rendered.fixture.whenStable();
      expect(await dialog.getTitle()).toBe('Remove it?');
    });

    it('is a modal dialog, and the body is projected between the header and the footer', async () => {
      const rendered = await render();
      await open(rendered);
      const dialog = await harnessOf(rendered.fixture);

      expect(await dialog.getRole()).toBe('dialog');
      expect(await dialog.isModal()).toBe(true);
      const content = find(document, '[data-pc-section="content"]', HTMLElement);
      expect(content.textContent).toContain('This cannot be undone.');
    });

    it('closable shows the close button and turns it off at once, also while open', async () => {
      const rendered = await render();
      await open(rendered);
      const dialog = await harnessOf(rendered.fixture);
      expect(await dialog.hasCloseButton()).toBe(true);

      rendered.component.closable.set(false);
      await rendered.fixture.whenStable();
      expect(await dialog.hasCloseButton()).toBe(false);

      rendered.component.closable.set(true);
      await rendered.fixture.whenStable();
      expect(await dialog.hasCloseButton()).toBe(true);
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

    it('closed emits once, after the dialog is gone, when the close button closes it', async () => {
      const rendered = await render();
      await open(rendered);
      const dialog = await harnessOf(rendered.fixture);

      await dialog.close();
      await expect.poll(() => rendered.component.closes()).toBe(1);
      expect(dialogEl()).toBeNull();
      await rendered.fixture.whenStable();
      expect(rendered.component.closes()).toBe(1);
    });

    it('closed emits once when Escape closes it', async () => {
      const rendered = await render();
      await open(rendered);
      const dialog = await harnessOf(rendered.fixture);

      await dialog.closeWithEscape();
      await expect.poll(() => rendered.component.closes()).toBe(1);
      await rendered.fixture.whenStable();
      expect(rendered.component.closes()).toBe(1);
      expect(rendered.component.visible()).toBe(false);
    });

    it('closed emits once when the app sets visible to false, and once per close after that', async () => {
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

    it('does not emit closed for a dialog that never opened', async () => {
      const rendered = await render();
      rendered.component.visible.set(true);
      rendered.component.visible.set(false);
      await rendered.fixture.whenStable();

      expect(rendered.component.opens()).toBe(0);
      expect(rendered.component.closes()).toBe(0);
    });

    it('the footer slot renders the consumer template below the body, and a dialog without it has no footer', async () => {
      const rendered = await render();
      await open(rendered);
      const dialog = await harnessOf(rendered.fixture);

      const buttons = await dialog.getAllHarnesses(WjButtonHarness);
      expect(await Promise.all(buttons.map((button) => button.getLabel()))).toEqual([
        'Cancel',
        'Delete',
      ]);
      const footer = find(document, '[data-pc-section="footer"]', HTMLElement);
      expect(footer.contains(find(footer, 'wj-button', HTMLElement))).toBe(true);

      rendered.component.withFooter.set(false);
      await rendered.fixture.whenStable();
      expect(document.querySelector('[data-pc-section="footer"]')).toBeNull();
    });

    it('a dialog opened without a footer slot has no footer region', async () => {
      const rendered = await render((host) => {
        host.withFooter.set(false);
      });
      await open(rendered);

      expect(document.querySelector('[data-pc-section="footer"]')).toBeNull();
    });

    it('ariaDescribedBy describes the dialog element, and a harness reads the description', async () => {
      const rendered = await render();
      await open(rendered);
      const dialog = await harnessOf(rendered.fixture);

      expect(dialogEl()?.getAttribute('aria-describedby')).toBe('body-text');
      expect(await dialog.getDescription()).toBe('This cannot be undone.');

      rendered.component.describedBy.set(undefined);
      await rendered.fixture.whenStable();
      expect(dialogEl()?.hasAttribute('aria-describedby')).toBe(false);
      expect(await dialog.getDescription()).toBeNull();
    });

    it('pt reaches the root and the close button, and the routed description survives it', async () => {
      const rendered = await render((host) => {
        host.pt.set({
          root: { 'data-root': 'r', 'aria-describedby': 'ignored' },
          mask: { 'data-mask': 'm' },
          header: { 'data-header': 'h' },
          pcCloseButton: { root: { 'data-close': 'c' } },
          footer: { 'data-footer': 'f' },
        });
      });
      await open(rendered);

      expect(dialogEl()?.getAttribute('data-root')).toBe('r');
      expect(dialogEl()?.getAttribute('aria-describedby')).toBe('body-text');
      expect(maskEl()?.getAttribute('data-mask')).toBe('m');
      expect(document.querySelector('[data-header]')?.getAttribute('data-header')).toBe('h');
      expect(document.querySelector('[data-footer]')?.getAttribute('data-footer')).toBe('f');
      expect(closeButtonEl().getAttribute('data-close')).toBe('c');
    });

    it('pt works as a function, and clears nothing the wrapper routes', async () => {
      const rendered = await render((host) => {
        host.pt.set(() => ({ root: { 'data-root': 'fn' } }));
      });
      await open(rendered);

      expect(dialogEl()?.getAttribute('data-root')).toBe('fn');
      expect(dialogEl()?.getAttribute('aria-describedby')).toBe('body-text');
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
  });

  describe('close paths', () => {
    it('Escape closes the dialog while it is closable', async () => {
      const rendered = await render();
      await open(rendered);

      await userEvent.keyboard('{Escape}');

      await expect.poll(() => rendered.component.visible()).toBe(false);
      await gone();
    });

    it('the backdrop never closes it', async () => {
      const rendered = await render();
      await open(rendered);
      const mask = maskEl();
      mask?.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
      mask?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      await rendered.fixture.whenStable();

      expect(rendered.component.visible()).toBe(true);
      expect(dialogEl()).not.toBeNull();
    });

    it('closable set to false before opening removes the close button and Escape', async () => {
      const rendered = await render((host) => {
        host.closable.set(false);
      });
      await open(rendered);
      const dialog = await harnessOf(rendered.fixture);

      expect(await dialog.hasCloseButton()).toBe(false);
      await userEvent.keyboard('{Escape}');
      await rendered.fixture.whenStable();
      expect(rendered.component.visible()).toBe(true);
      expect(dialogEl()).not.toBeNull();
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

      rendered.component.closable.set(true);
      await rendered.fixture.whenStable();
      await userEvent.keyboard('{Escape}');
      await expect.poll(() => rendered.component.visible()).toBe(false);
      await gone();
      expect(rendered.component.closes()).toBe(1);
    });

    it('closable turning true while open, after opening without it, brings Escape back', async () => {
      const rendered = await render((host) => {
        host.closable.set(false);
      });
      await open(rendered);

      rendered.component.closable.set(true);
      await rendered.fixture.whenStable();
      await userEvent.keyboard('{Escape}');

      await expect.poll(() => rendered.component.visible()).toBe(false);
      await gone();
      expect(rendered.component.closes()).toBe(1);
    });

    it('Escape pressed with focus on the page, not in the dialog, still follows closable', async () => {
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

      rendered.component.closable.set(true);
      await rendered.fixture.whenStable();
      await userEvent.keyboard('{Escape}');
      await expect.poll(() => rendered.component.visible()).toBe(false);
      await gone();
    });

    it('Escape still reaches a control in the body while the dialog is not closable', async () => {
      const rendered = await render((host) => {
        host.withInput.set(true);
      });
      await open(rendered);
      await expect.poll(() => document.activeElement?.id).toBe('body-input');
      rendered.component.closable.set(false);
      await rendered.fixture.whenStable();

      await userEvent.keyboard('{Escape}');
      await rendered.fixture.whenStable();

      expect(rendered.component.escapes()).toBe(1);
      expect(rendered.component.visible()).toBe(true);
    });

    it('Escape closes an open select in the body first, and the dialog stays while it is not closable', async () => {
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
      expect(dialogEl()).not.toBeNull();
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

    it('moves to the dialog itself when nothing inside can take focus', async () => {
      const rendered = await render((host) => {
        host.withFooter.set(false);
        host.closable.set(false);
      });
      await open(rendered);

      expect(document.activeElement).toBe(dialogEl());
      expect(dialogEl()?.getAttribute('tabindex')).toBe('-1');
    });

    it('Tab and Shift+Tab cycle inside the dialog', async () => {
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
      expect(forward).toEqual(['Cancel', 'Delete', 'Close', 'Name']);

      const backward: string[] = [];
      for (let step = 0; step < 3; step += 1) {
        await userEvent.tab({ shift: true });
        backward.push(focusedName());
      }
      expect(backward).toEqual(['Close', 'Delete', 'Cancel']);
    });

    it.each([
      ['Enter', '{Enter}'],
      ['Space', ' '],
    ])('%s on the close button closes the dialog', async (_name, key) => {
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
        content.getBoundingClientRect().top - (dialogEl()?.getBoundingClientRect().top ?? 0);

      rendered.component.closable.set(false);
      await rendered.fixture.whenStable();
      const without =
        content.getBoundingClientRect().top - (dialogEl()?.getBoundingClientRect().top ?? 0);

      expect(without).toBe(withButton);
      expect(find(document, '[data-pc-section="header"]', HTMLElement).offsetHeight).toBe(64);
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
      expect(dialogEl()?.getBoundingClientRect().right).toBeLessThanOrEqual(window.innerWidth);
    });

    it('never grows past the viewport minus 1rem on each side', async () => {
      await page.viewport(320, 640);
      const rendered = await render((host) => {
        host.text.set('Long body text. '.repeat(60));
      });
      await open(rendered);
      const box = dialogEl()?.getBoundingClientRect();

      expect(box?.width).toBeLessThanOrEqual(320 - 32);
      expect(box?.left).toBeGreaterThanOrEqual(16);
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
      expect(Reflect.get(window, 'wjInjected')).toBeUndefined();
    });

    it('renders an HTML payload in ariaDescribedBy as attribute text', async () => {
      const rendered = await render((host) => {
        host.describedBy.set(PAYLOAD);
      });
      await open(rendered);

      expect(dialogEl()?.getAttribute('aria-describedby')).toBe(PAYLOAD);
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
        'WJ0001: wj-dialog: provideWeeljack() is missing from the application providers. ' +
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
        'WJ0003: wj-dialog: aria-label is set on the host, where it is not forwarded to the focusable element. ' +
          'Use the ariaDescribedBy input; the header names the dialog. ' +
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

        it('finds no violation while open with a footer', async () => {
          const rendered = await render(undefined, scheme);
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

describe('WjDialog, stacked and in Safari', () => {
  const viewport = { width: window.innerWidth, height: window.innerHeight };
  const masks = (): number => document.querySelectorAll('.p-dialog-mask').length;

  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    reduceMotion(true);
  });

  afterEach(async () => {
    if (current && dialogEl()) {
      await close(current);
    }
    current = undefined;
    await page.viewport(viewport.width, viewport.height);
  });

  it('closes a closable dialog inside a non-closable one on Escape, and the outer one stays', async () => {
    TestBed.configureTestingModule({ providers: [provideWeeljack()] });
    const fixture = TestBed.createComponent(NestedHost);
    const host = fixture.componentInstance;
    try {
      host.outer.set(true);
      await fixture.whenStable();
      await expect.poll(masks).toBe(1);
      host.inner.set(true);
      await fixture.whenStable();
      await expect.poll(masks).toBe(2);
      await expect
        .poll(() =>
          document.activeElement?.closest('.p-dialog')?.textContent.includes('Are you sure?'),
        )
        .toBe(true);

      await userEvent.keyboard('{Escape}');
      await expect.poll(() => host.inner()).toBe(false);
      await expect.poll(masks).toBe(1);

      expect(host.outer()).toBe(true);
      expect(maskEl()).not.toBeNull();
      // The upper dialog has left, so the outer one blocks Escape again: a second one does nothing.
      await userEvent.keyboard('{Escape}');
      await fixture.whenStable();
      expect(host.outer()).toBe(true);
      expect(masks()).toBe(1);
    } finally {
      host.inner.set(false);
      host.outer.set(false);
      await fixture.whenStable();
      await gone();
    }
  });

  it('keeps the page from scrolling under the outer dialog once the inner one has closed', async () => {
    TestBed.configureTestingModule({ providers: [provideWeeljack()] });
    const fixture = TestBed.createComponent(NestedHost);
    const host = fixture.componentInstance;
    try {
      host.outer.set(true);
      host.inner.set(true);
      await fixture.whenStable();
      await expect.poll(masks).toBe(2);
      host.inner.set(false);
      await fixture.whenStable();
      await expect.poll(masks).toBe(1);

      await expect.poll(() => document.body.classList.contains('p-overflow-hidden')).toBe(true);
    } finally {
      host.inner.set(false);
      host.outer.set(false);
      await fixture.whenStable();
      await gone();
    }
  });

  it('returns focus to the opener in Safari, where a pressed button takes no focus', async () => {
    const rendered = await render();
    const opener = find(rendered.element, '#opener button', HTMLElement);
    opener.addEventListener('mousedown', (event) => {
      event.preventDefault();
    });
    expect(document.activeElement).toBe(document.body);

    for (const key of ['{Escape}', 'close']) {
      await userEvent.click(opener);
      await expect.poll(() => rendered.component.opens()).toBeGreaterThan(0);
      if (key === 'close') {
        await (await harnessOf(rendered.fixture)).close();
      } else {
        await userEvent.keyboard(key);
      }
      await gone();
      expect(document.activeElement).toBe(opener);
      opener.blur();
    }
  });
});
