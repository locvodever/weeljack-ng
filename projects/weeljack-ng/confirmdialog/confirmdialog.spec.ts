/// <reference types="@vitest/browser-playwright" />
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Component, inject, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { Dialog } from '@openng/optimus-ui/dialog';
import type { MockInstance } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { WjConfirmationService, provideWeeljack, type WjConfirmation } from 'weeljack-ng';
import { WjButton } from 'weeljack-ng/button';
import { WjConfirmDialog, type WjConfirmDialogPt } from 'weeljack-ng/confirmdialog';
import { WjConfirmDialogHarness } from 'weeljack-ng/confirmdialog/testing';
import { _overlayEscapeGate } from 'weeljack-ng/private';
import { expectNoAxeViolations } from '../spec-support/axe';

const PAYLOAD = '<img src=x onerror="window.wjInjected = true">';
const ROOT = document.documentElement;

/** A consumer's template: an opener that asks, and the app shell's one confirm dialog. */
@Component({
  selector: 'wj-confirmdialog-host',
  imports: [WjButton, WjConfirmDialog],
  template: `
    @if (withOpener()) {
      <wj-button id="opener" label="Delete" (click)="ask()" />
    }
    <wj-confirmdialog [pt]="pt()" />
  `,
})
class Host {
  readonly service = inject(WjConfirmationService);
  readonly pt = signal<WjConfirmDialogPt>(undefined);
  readonly withOpener = signal(true);
  readonly confirmation = signal<WjConfirmation>({
    header: 'Delete this file?',
    message: 'This removes report.pdf for everyone.',
    accept: () => {
      this.accepts.update(countUp);
    },
    reject: () => {
      this.rejects.update(countUp);
    },
  });
  readonly accepts = signal(0);
  readonly rejects = signal(0);

  ask(): void {
    this.service.confirm(this.confirmation());
  }
}

const countUp = (count: number): number => count + 1;

/** A spec-local modal below the confirm dialog: Optimus Dialog, not closable, on the seam's gate. */
@Component({
  selector: 'wj-confirmdialog-lower',
  imports: [Dialog, WjButton, WjConfirmDialog],
  template: `
    <p-dialog [(visible)]="visible" header="Lower" [modal]="true" [closable]="false">
      <wj-button id="lower-opener" label="Ask" (click)="ask()" />
      <wj-confirmdialog />
    </p-dialog>
  `,
})
class LowerHost {
  readonly service = inject(WjConfirmationService);
  readonly visible = signal(true);

  constructor() {
    _overlayEscapeGate(this.visible, () => false);
  }

  ask(): void {
    this.service.confirm({ message: 'Sure?', header: 'Sure?' });
  }
}

/** A consumer who writes aria-* on the host. */
@Component({
  selector: 'wj-confirmdialog-aria-on-host-host',
  imports: [WjConfirmDialog],
  template: `<wj-confirmdialog aria-label="Delete" />`,
})
class AriaOnHostHost {}

/** Two confirm dialogs in one application. */
@Component({
  selector: 'wj-confirmdialog-twice-host',
  imports: [WjConfirmDialog],
  template: `<wj-confirmdialog /><wj-confirmdialog />`,
})
class TwiceHost {}

type Scheme = 'light' | 'dark';

interface Rendered {
  fixture: ComponentFixture<Host>;
  component: Host;
  element: HTMLElement;
}

let current: Rendered | undefined;

const realMatchMedia = window.matchMedia.bind(window);

/** Sets the reader's reduced-motion preference for this window only (Optimus reads `matchMedia`). */
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

const dialogEl = (): HTMLElement | null =>
  document.querySelector<HTMLElement>('div[role="alertdialog"]');
const maskEl = (): HTMLElement | null => document.querySelector<HTMLElement>('.p-dialog-mask');

function find<E extends Element>(element: ParentNode, selector: string, type: new () => E): E {
  const found = element.querySelector(selector);
  if (!(found instanceof type)) {
    throw new Error(`${selector} is missing`);
  }
  return found;
}

const button = (hook: 'accept' | 'reject' | 'close'): HTMLElement =>
  find(document, `[data-wj-confirm-${hook}]`, HTMLElement);

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

/** Waits until the dialog is on the page, has entered and has put focus on Reject. */
async function opened(): Promise<void> {
  await expect.poll(() => dialogEl() !== null).toBe(true);
  await expect
    .poll(() => document.activeElement?.hasAttribute('data-wj-confirm-reject'))
    .toBe(true);
}

/** Asks from the app and waits until the dialog is open. */
async function open({ fixture, component }: Rendered): Promise<void> {
  component.ask();
  await fixture.whenStable();
  await opened();
}

/** Waits until the dialog has left and nothing of it, its backdrop or its scroll lock remains. */
async function gone(): Promise<void> {
  await expect.poll(() => maskEl()).toBeNull();
  await expect.poll(() => document.body.classList.contains('p-overflow-hidden')).toBe(false);
}

const harnessOf = (fixture: ComponentFixture<unknown>): Promise<WjConfirmDialogHarness> =>
  TestbedHarnessEnvironment.loader(fixture).getHarness(WjConfirmDialogHarness);

const focusedName = (): string => {
  const active = document.activeElement;
  return active?.getAttribute('aria-label') ?? active?.textContent.trim() ?? '';
};

/** Every class list `.p-dialog` and its mask have from now on, to tell whether motion ran. */
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

/** Makes the opener take no focus on a press, as Safari does for a button. */
function simulateSafari(opener: HTMLElement): void {
  opener.addEventListener('mousedown', (event) => {
    event.preventDefault();
  });
}

describe('WjConfirmDialog', () => {
  let warn: MockInstance<typeof console.warn>;
  const viewport = { width: window.innerWidth, height: window.innerHeight };

  beforeEach(() => {
    warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    reduceMotion(true);
  });

  afterEach(async () => {
    // An overlay left open at teardown would reach the next spec: close it and wait for the leave.
    if (current && dialogEl()) {
      current.component.service.close();
      await current.fixture.whenStable();
      await gone();
    }
    current = undefined;
    ROOT.classList.remove('wj-dark');
    document.body.style.backgroundColor = '';
    Reflect.deleteProperty(window, 'wjInjected');
    await page.viewport(viewport.width, viewport.height);
  });

  describe('the confirmation', () => {
    it('renders nothing while closed, in a host that is a block with no height', async () => {
      const { element, fixture } = await render();
      const host = find(element, 'wj-confirmdialog', HTMLElement);

      expect(getComputedStyle(host).display).toBe('block');
      expect(host.getBoundingClientRect().height).toBe(0);
      expect(dialogEl()).toBeNull();
      expect(await (await harnessOf(fixture)).isOpen()).toBe(false);
    });

    it('opens with the header, the message and the translation labels, as an alertdialog', async () => {
      const rendered = await render();
      await open(rendered);
      const harness = await harnessOf(rendered.fixture);

      expect(await harness.isOpen()).toBe(true);
      expect(await harness.getHeader()).toBe('Delete this file?');
      expect(await harness.getMessage()).toBe('This removes report.pdf for everyone.');
      expect(await harness.getAcceptLabel()).toBe('Yes');
      expect(await harness.getRejectLabel()).toBe('No');
      expect(await harness.getRole()).toBe('alertdialog');
      expect(await harness.isModal()).toBe(true);
    });

    it('uses the labels the confirmation names', async () => {
      const rendered = await render((host) => {
        host.confirmation.update((c) => ({ ...c, acceptLabel: 'Delete', rejectLabel: 'Cancel' }));
      });
      await open(rendered);
      const harness = await harnessOf(rendered.fixture);

      expect(await harness.getAcceptLabel()).toBe('Delete');
      expect(await harness.getRejectLabel()).toBe('Cancel');
    });

    it('follows the translation: changed accept, reject and aria.close rename the buttons', async () => {
      const rendered = await render(undefined, 'light', {
        translation: { accept: 'Đồng ý', reject: 'Không', aria: { close: 'Đóng' } },
      });
      await open(rendered);
      const harness = await harnessOf(rendered.fixture);

      expect(await harness.getAcceptLabel()).toBe('Đồng ý');
      expect(await harness.getRejectLabel()).toBe('Không');
      expect(await harness.getCloseLabel()).toBe('Đóng');
    });

    it('is named by the header and described by the message', async () => {
      const rendered = await render();
      await open(rendered);
      const dialog = dialogEl();
      const title = find(document, '[data-wj-confirm-title]', HTMLElement);
      const message = find(document, '.message', HTMLElement);

      expect(dialog?.getAttribute('aria-labelledby')).toBe(title.id);
      expect(dialog?.getAttribute('aria-describedby')).toBe(message.id);
      expect(title.textContent.trim()).toBe('Delete this file?');
    });

    it('is named by the message when the confirmation has no header', async () => {
      const rendered = await render((host) => {
        host.confirmation.set({ message: 'This removes report.pdf for everyone.' });
      });
      await open(rendered);
      const message = find(document, '.message', HTMLElement);

      expect(dialogEl()?.getAttribute('aria-labelledby')).toBe(message.id);
      expect(dialogEl()?.getAttribute('aria-describedby')).toBe(message.id);
      expect(await (await harnessOf(rendered.fixture)).getHeader()).toBe('');
    });

    it('is named by the header again after a confirmation with none', async () => {
      const rendered = await render((host) => {
        host.confirmation.set({ message: 'This removes report.pdf for everyone.' });
      });
      await open(rendered);
      rendered.component.service.close();
      await gone();
      rendered.component.confirmation.update((c) => ({ ...c, header: 'Delete?' }));
      await open(rendered);

      expect(dialogEl()?.getAttribute('aria-labelledby')).toBe(
        find(document, '[data-wj-confirm-title]', HTMLElement).id,
      );
    });
  });

  describe('close paths', () => {
    it('Accept runs accept once and closes', async () => {
      const rendered = await render();
      await open(rendered);

      await (await harnessOf(rendered.fixture)).accept();
      await gone();

      expect(rendered.component.accepts()).toBe(1);
      expect(rendered.component.rejects()).toBe(0);
    });

    it('Reject runs reject once and closes', async () => {
      const rendered = await render();
      await open(rendered);

      await (await harnessOf(rendered.fixture)).reject();
      await gone();

      expect(rendered.component.rejects()).toBe(1);
      expect(rendered.component.accepts()).toBe(0);
    });

    it('the close button runs reject once and closes', async () => {
      const rendered = await render();
      await open(rendered);

      await (await harnessOf(rendered.fixture)).close();
      await gone();

      expect(rendered.component.rejects()).toBe(1);
      expect(rendered.component.accepts()).toBe(0);
    });

    it('Escape runs reject once and closes', async () => {
      const rendered = await render();
      await open(rendered);

      await userEvent.keyboard('{Escape}');
      await gone();

      expect(rendered.component.rejects()).toBe(1);
      expect(rendered.component.accepts()).toBe(0);
    });

    it('cancel through the harness is Escape', async () => {
      const rendered = await render();
      await open(rendered);

      await (await harnessOf(rendered.fixture)).cancel();
      await gone();

      expect(rendered.component.rejects()).toBe(1);
    });

    it('the backdrop never closes it', async () => {
      const rendered = await render();
      await open(rendered);
      const mask = maskEl();
      mask?.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
      mask?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      await rendered.fixture.whenStable();

      expect(dialogEl()).not.toBeNull();
      expect(rendered.component.rejects()).toBe(0);
    });

    it('close() on the service closes it and runs neither accept nor reject', async () => {
      const rendered = await render();
      await open(rendered);

      rendered.component.service.close();
      await gone();

      expect(rendered.component.accepts()).toBe(0);
      expect(rendered.component.rejects()).toBe(0);
    });

    it('opens again after a close, with the new confirmation', async () => {
      const rendered = await render();
      await open(rendered);
      await (await harnessOf(rendered.fixture)).reject();
      await gone();

      rendered.component.confirmation.update((c) => ({ ...c, message: 'Second question?' }));
      await open(rendered);

      expect(await (await harnessOf(rendered.fixture)).getMessage()).toBe('Second question?');
      await (await harnessOf(rendered.fixture)).accept();
      await gone();
      expect(rendered.component.accepts()).toBe(1);
      expect(rendered.component.rejects()).toBe(1);
    });
  });

  describe('keyboard and focus', () => {
    it('puts focus on Reject when it opens', async () => {
      const rendered = await render();
      await open(rendered);

      expect(document.activeElement).toBe(button('reject'));
    });

    it('Tab and Shift+Tab cycle Reject, Accept and Close inside the dialog', async () => {
      const rendered = await render();
      await open(rendered);

      const forward: string[] = [];
      for (let step = 0; step < 3; step += 1) {
        await userEvent.tab();
        forward.push(focusedName());
      }
      expect(forward).toEqual(['Yes', 'Close', 'No']);

      const backward: string[] = [];
      for (let step = 0; step < 3; step += 1) {
        await userEvent.tab({ shift: true });
        backward.push(focusedName());
      }
      expect(backward).toEqual(['Close', 'Yes', 'No']);
    });

    it.each([
      ['Enter', '{Enter}'],
      ['Space', ' '],
    ])('%s on Reject rejects', async (_name, key) => {
      const rendered = await render();
      await open(rendered);

      await userEvent.keyboard(key);
      await gone();

      expect(rendered.component.rejects()).toBe(1);
    });

    it.each([
      ['Enter', '{Enter}'],
      ['Space', ' '],
    ])('%s on Accept accepts', async (_name, key) => {
      const rendered = await render();
      await open(rendered);

      await userEvent.tab();
      await userEvent.keyboard(key);
      await gone();

      expect(rendered.component.accepts()).toBe(1);
    });

    it('returns focus to the opener, whatever closed it', async () => {
      const rendered = await render();
      const opener = (): HTMLElement => find(rendered.element, '#opener button', HTMLElement);

      const closers: (() => Promise<void> | void)[] = [
        () => userEvent.keyboard('{Escape}'),
        async () => (await harnessOf(rendered.fixture)).accept(),
        async () => (await harnessOf(rendered.fixture)).reject(),
        async () => (await harnessOf(rendered.fixture)).close(),
        () => {
          rendered.component.service.close();
        },
      ];
      for (const close of closers) {
        await userEvent.click(opener());
        await opened();
        await close();
        await gone();
        expect(document.activeElement).toBe(opener());
      }
    });

    it('returns focus to the opener in Safari, which never focuses a clicked button', async () => {
      const rendered = await render();
      const opener = find(rendered.element, '#opener button', HTMLElement);
      simulateSafari(opener);

      for (const close of [
        () => userEvent.keyboard('{Escape}'),
        async () => (await harnessOf(rendered.fixture)).accept(),
      ]) {
        await userEvent.click(opener);
        expect(document.activeElement).toBe(document.body);
        await opened();
        await close();
        await gone();
        expect(document.activeElement).toBe(opener);
        opener.blur();
      }
    });

    it('leaves focus alone when the opener is gone', async () => {
      const rendered = await render();
      await userEvent.click(find(rendered.element, '#opener button', HTMLElement));
      await opened();

      rendered.component.withOpener.set(false);
      await rendered.fixture.whenStable();
      rendered.component.service.close();
      await gone();

      expect(document.activeElement).toBe(document.body);
    });
  });

  describe('buttons', () => {
    it('names the close button Close, and none of the three carries autofocus, also after a cycle', async () => {
      const rendered = await render();
      for (let cycle = 0; cycle < 2; cycle += 1) {
        await open(rendered);
        expect(await (await harnessOf(rendered.fixture)).getCloseLabel()).toBe('Close');
        for (const hook of ['accept', 'reject', 'close'] as const) {
          expect(button(hook).hasAttribute('autofocus')).toBe(false);
          expect(button(hook).closest('[autofocus]')).toBeNull();
        }
        rendered.component.service.close();
        await gone();
      }
    });

    it('has boxes of at least 24 x 24 px, 44 px tall by the default look', async () => {
      const rendered = await render();
      await open(rendered);

      for (const hook of ['accept', 'reject', 'close'] as const) {
        const box = button(hook).getBoundingClientRect();
        expect(box.width).toBeGreaterThanOrEqual(24);
        expect(box.height).toBeGreaterThanOrEqual(24);
        expect(Math.round(box.height)).toBe(44);
      }
    });

    it('draws Reject as the quiet outlined button and Accept as the ink fill', async () => {
      const rendered = await render();
      for (let cycle = 0; cycle < 2; cycle += 1) {
        await open(rendered);
        const reject = getComputedStyle(button('reject'));
        const accept = getComputedStyle(button('accept'));

        expect(reject.backgroundColor).toBe('rgba(0, 0, 0, 0)');
        expect(accept.backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
        expect(reject.borderTopWidth).toBe('1px');
        rendered.component.service.close();
        await gone();
      }
    });
  });

  describe('pt', () => {
    const parts: WjConfirmDialogPt = {
      mask: { 'data-p-mask': 'm' },
      header: { 'data-p-header': 'h' },
      title: { 'data-p-title': 't' },
      content: { 'data-p-content': 'c' },
      footer: { 'data-p-footer': 'f' },
      pcCloseButton: { root: { 'data-p-close': 'x' } },
      pcAcceptButton: { root: { 'data-p-accept': 'a' } },
      pcRejectButton: { root: { 'data-p-reject': 'r' } },
    };

    const attribute = (selector: string, name: string): string | null | undefined =>
      document.querySelector(selector)?.getAttribute(name);

    async function expectParts(rendered: Rendered): Promise<void> {
      await open(rendered);
      expect(attribute('.p-dialog-mask', 'data-p-mask')).toBe('m');
      expect(attribute('[data-p-header]', 'data-p-header')).toBe('h');
      expect(attribute('[data-wj-confirm-title]', 'data-p-title')).toBe('t');
      expect(attribute('[data-p-content]', 'data-p-content')).toBe('c');
      expect(attribute('[data-p-footer]', 'data-p-footer')).toBe('f');
      expect(button('close').getAttribute('data-p-close')).toBe('x');
      expect(button('accept').getAttribute('data-p-accept')).toBe('a');
      expect(button('reject').getAttribute('data-p-reject')).toBe('r');
    }

    it('reaches every part the wrapper hands Optimus, after open and close cycles too', async () => {
      const rendered = await render((host) => {
        host.pt.set(parts);
      });
      await expectParts(rendered);
      rendered.component.service.close();
      await gone();
      await expectParts(rendered);
    });

    it('works as a function, with the same parts', async () => {
      const rendered = await render((host) => {
        host.pt.set(() => parts);
      });
      await expectParts(rendered);
    });

    it('keeps what the wrapper routes when pt names the same part', async () => {
      const rendered = await render((host) => {
        host.pt.set({
          title: { id: 'mine' },
          pcCloseButton: { root: { 'aria-label': 'Mine' } },
          pcRejectButton: { root: { autofocus: true } },
        });
      });
      await open(rendered);

      expect(find(document, '[data-wj-confirm-title]', HTMLElement).id).not.toBe('mine');
      expect(button('close').getAttribute('aria-label')).toBe('Close');
      expect(button('reject').hasAttribute('autofocus')).toBe(false);
    });
  });

  describe('motion', () => {
    it('plays no enter or leave motion under reduced motion', async () => {
      const rendered = await render();
      const read = recordClasses();

      await open(rendered);
      rendered.component.service.close();
      await gone();

      expect(motionClasses(read())).toEqual([]);
    });

    it('plays the motion when the reader has not asked for less, so the recorder sees it', async () => {
      reduceMotion(false);
      const rendered = await render();
      const read = recordClasses();

      await open(rendered);
      rendered.component.service.close();
      await gone();

      expect(motionClasses(read()).length).toBeGreaterThan(0);
    });
  });

  describe('layout', () => {
    it('never grows past the viewport minus 1rem on each side', async () => {
      await page.viewport(320, 640);
      const rendered = await render((host) => {
        host.confirmation.update((c) => ({ ...c, message: 'word '.repeat(80) }));
      });
      await open(rendered);

      expect(dialogEl()?.getBoundingClientRect().width).toBeLessThanOrEqual(320 - 32);
    });

    it('keeps the message to a readable measure and breaks long words', async () => {
      const rendered = await render((host) => {
        host.confirmation.update((c) => ({ ...c, message: 'x'.repeat(200) }));
      });
      await open(rendered);
      const message = find(document, '.message', HTMLElement);

      expect(getComputedStyle(message).maxInlineSize).toBe('448px');
      expect(message.scrollWidth).toBeLessThanOrEqual(message.clientWidth);
    });

    it('wraps a long header and holds the close button in the top corner', async () => {
      await page.viewport(360, 640);
      const rendered = await render((host) => {
        host.confirmation.update((c) => ({ ...c, header: 'Delete '.repeat(20) }));
      });
      await open(rendered);
      const close = button('close').getBoundingClientRect();
      const dialog = dialogEl()?.getBoundingClientRect();

      expect(close.top - (dialog?.top ?? 0)).toBeLessThan(24);
    });
  });

  describe('safety', () => {
    it('renders an HTML payload in message, header, acceptLabel and rejectLabel as text', async () => {
      const rendered = await render((host) => {
        host.confirmation.set({
          message: PAYLOAD,
          header: PAYLOAD,
          acceptLabel: PAYLOAD,
          rejectLabel: PAYLOAD,
        });
      });
      await open(rendered);
      const harness = await harnessOf(rendered.fixture);

      expect(await harness.getMessage()).toBe(PAYLOAD);
      expect(await harness.getHeader()).toBe(PAYLOAD);
      expect(await harness.getAcceptLabel()).toBe(PAYLOAD);
      expect(await harness.getRejectLabel()).toBe(PAYLOAD);
      expect(document.querySelector('wj-confirmdialog img')).toBeNull();
      expect(document.querySelector('.p-confirmdialog-message')).toBeNull();
      expect(Reflect.get(window, 'wjInjected')).toBeUndefined();
    });
  });

  describe('setup and ARIA checks', () => {
    it('warns WJ0001 when provideWeeljack is missing', async () => {
      const fixture = TestBed.createComponent(AriaOnHostHost);
      await fixture.whenStable();

      expect(warn).toHaveBeenCalledWith(
        'WJ0001: wj-confirmdialog: provideWeeljack() is missing from the application providers. ' +
          'Add provideWeeljack() to your application config. ' +
          'Find more at https://locvodever.github.io/weeljack-ng/errors/WJ0001',
      );
    });

    it('stays silent with provideWeeljack', async () => {
      const rendered = await render();
      await open(rendered);
      expect(warn).not.toHaveBeenCalled();
    });

    it('warns WJ0003 once when aria-* is written on the host, and says what names the dialog', async () => {
      TestBed.configureTestingModule({ providers: [provideWeeljack()] });
      const fixture = TestBed.createComponent(AriaOnHostHost);
      await fixture.whenStable();

      expect(warn).toHaveBeenCalledTimes(1);
      expect(warn).toHaveBeenCalledWith(
        "WJ0003: wj-confirmdialog: aria-label is set on the host, where it is not forwarded to the focusable element. The confirmation's header and message name and describe the dialog; remove the attribute. " +
          'Find more at https://locvodever.github.io/weeljack-ng/errors/WJ0003',
      );
    });

    it('warns WJ0151 when a second confirm dialog is rendered', async () => {
      TestBed.configureTestingModule({ providers: [provideWeeljack()] });
      const fixture = TestBed.createComponent(TwiceHost);
      await fixture.whenStable();

      expect(warn).toHaveBeenCalledTimes(1);
      expect(warn).toHaveBeenCalledWith(
        'WJ0151: wj-confirmdialog: a second wj-confirmdialog is rendered, and every one opens each confirmation. ' +
          'Render one wj-confirmdialog at a time. ' +
          'Find more at https://locvodever.github.io/weeljack-ng/errors/WJ0151',
      );
    });
  });

  describe('stacked overlays', () => {
    async function renderLower(): Promise<ComponentFixture<LowerHost>> {
      TestBed.configureTestingModule({ providers: [provideWeeljack()] });
      const fixture = TestBed.createComponent(LowerHost);
      await fixture.whenStable();
      await expect.poll(() => document.querySelector('[role="dialog"]') !== null).toBe(true);
      return fixture;
    }

    async function closeBoth(fixture: ComponentFixture<LowerHost>): Promise<void> {
      fixture.componentInstance.service.close();
      fixture.componentInstance.visible.set(false);
      await fixture.whenStable();
      await gone();
    }

    it('closes on Escape from inside it, and the non-closable modal below keeps its backdrop', async () => {
      const fixture = await renderLower();
      await userEvent.click(find(document, '#lower-opener button', HTMLElement));
      await opened();

      await userEvent.keyboard('{Escape}');
      await expect.poll(dialogEl).toBeNull();

      expect(fixture.componentInstance.visible()).toBe(true);
      expect(maskEl()).not.toBeNull();
      // Optimus's Dialog drops the page's scroll lock when it leaves; the seam puts it back.
      await expect.poll(() => document.body.classList.contains('p-overflow-hidden')).toBe(true);

      await userEvent.keyboard('{Escape}');
      expect(fixture.componentInstance.visible()).toBe(true);
      expect(maskEl()).not.toBeNull();
      await closeBoth(fixture);
    });

    it('closes on Escape with focus on the page, and the modal below stays', async () => {
      const fixture = await renderLower();
      await userEvent.click(find(document, '#lower-opener button', HTMLElement));
      await opened();
      const active = document.activeElement;
      if (active instanceof HTMLElement) {
        active.blur();
      }

      await userEvent.keyboard('{Escape}');
      await expect.poll(dialogEl).toBeNull();

      expect(fixture.componentInstance.visible()).toBe(true);
      expect(maskEl()).not.toBeNull();
      await closeBoth(fixture);
    });
  });

  describe('accessibility', () => {
    for (const scheme of ['light', 'dark'] as const) {
      describe(`axe, ${scheme}`, () => {
        it('finds no violation while closed', async () => {
          const { element } = await render(undefined, scheme);
          await expectNoAxeViolations(element);
        });

        it('finds no violation while open with a header', async () => {
          const rendered = await render(undefined, scheme);
          await open(rendered);
          await expectNoAxeViolations(rendered.element);
        });

        it('finds no violation while open without a header', async () => {
          const rendered = await render((host) => {
            host.confirmation.set({ message: 'This removes report.pdf for everyone.' });
          }, scheme);
          await open(rendered);
          await expectNoAxeViolations(rendered.element);
        });
      });
    }
  });
});
