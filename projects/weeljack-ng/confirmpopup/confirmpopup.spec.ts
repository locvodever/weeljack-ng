/// <reference types="@vitest/browser-playwright" />
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Component, inject, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { Dialog } from '@openng/optimus-ui/dialog';
import type { MockInstance } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { WjConfirmationService, provideWeeljack, type WjConfirmation } from 'weeljack-ng';
import { WjButton } from 'weeljack-ng/button';
import { WjConfirmPopup, type WjConfirmPopupPt } from 'weeljack-ng/confirmpopup';
import { WjConfirmPopupHarness } from 'weeljack-ng/confirmpopup/testing';
import { _overlayEscapeGate } from 'weeljack-ng/private';
import { expectNoAxeViolations } from '../spec-support/axe';

const PAYLOAD = '<img src=x onerror="window.wjInjected = true">';
const ROOT = document.documentElement;

/** A consumer's template: a `wj-button` that asks, another control, and the app shell's one popup. */
@Component({
  selector: 'wj-confirmpopup-host',
  imports: [WjButton, WjConfirmPopup],
  template: `
    @if (withOpener()) {
      <wj-button id="opener" label="Remove" (click)="ask($event)" />
    }
    <button id="other" type="button">Other</button>
    <wj-confirmpopup [pt]="pt()" />
  `,
})
class Host {
  readonly service = inject(WjConfirmationService);
  readonly pt = signal<WjConfirmPopupPt>(undefined);
  readonly withOpener = signal(true);
  readonly confirmation = signal<WjConfirmation>({
    message: 'Remove this item from the list?',
    accept: () => {
      this.accepts.update(countUp);
    },
    reject: () => {
      this.rejects.update(countUp);
    },
  });
  readonly accepts = signal(0);
  readonly rejects = signal(0);

  ask(event: Event): void {
    const target = event.currentTarget;
    if (target) {
      this.service.confirm({ ...this.confirmation(), target });
    }
  }
}

const countUp = (count: number): number => count + 1;

/** A spec-local modal below the popup: Optimus Dialog, not closable, on the seam's gate. */
@Component({
  selector: 'wj-confirmpopup-lower',
  imports: [Dialog, WjConfirmPopup],
  template: `
    <p-dialog [(visible)]="visible" header="Lower" [modal]="true" [closable]="false">
      <button id="lower-opener" type="button" (click)="ask($event)">Ask</button>
      <wj-confirmpopup />
    </p-dialog>
  `,
})
class LowerHost {
  readonly service = inject(WjConfirmationService);
  readonly visible = signal(true);

  constructor() {
    _overlayEscapeGate(this.visible, () => false);
  }

  ask(event: Event): void {
    const target = event.currentTarget;
    if (target) {
      this.service.confirm({ message: 'Sure?', target });
    }
  }
}

/** A consumer who writes aria-* on the host. */
@Component({
  selector: 'wj-confirmpopup-aria-on-host-host',
  imports: [WjConfirmPopup],
  template: `<wj-confirmpopup aria-label="Remove" />`,
})
class AriaOnHostHost {}

/** Two confirm popups in one application. */
@Component({
  selector: 'wj-confirmpopup-twice-host',
  imports: [WjConfirmPopup],
  template: `<wj-confirmpopup /><wj-confirmpopup />`,
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

const POPUP = 'div[role="alertdialog"][data-wj-confirmpopup]';
const popupEl = (): HTMLElement | null => document.querySelector<HTMLElement>(POPUP);

function find<E extends Element>(element: ParentNode, selector: string, type: new () => E): E {
  const found = element.querySelector(selector);
  if (!(found instanceof type)) {
    throw new Error(`${selector} is missing`);
  }
  return found;
}

const button = (hook: 'accept' | 'reject'): HTMLElement =>
  find(document, `${POPUP} [data-wj-confirm-${hook}]`, HTMLElement);

const opener = ({ element }: Rendered): HTMLElement => find(element, '#opener button', HTMLElement);

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

/** Waits until the popup is on the page, has entered and has put focus on Reject. */
async function opened(): Promise<void> {
  await expect.poll(() => popupEl() !== null).toBe(true);
  await expect
    .poll(() => document.activeElement?.hasAttribute('data-wj-confirm-reject'))
    .toBe(true);
}

/** Presses the opener, as a reader does, and waits until the popup is open. */
async function open(rendered: Rendered): Promise<void> {
  await userEvent.click(opener(rendered));
  await rendered.fixture.whenStable();
  await opened();
}

/** Waits until the popup has left and nothing of it remains on the page. */
async function gone(): Promise<void> {
  await expect.poll(popupEl).toBeNull();
}

const harnessOf = (fixture: ComponentFixture<unknown>): Promise<WjConfirmPopupHarness> =>
  TestbedHarnessEnvironment.loader(fixture).getHarness(WjConfirmPopupHarness);

const focusedName = (): string => document.activeElement?.textContent.trim() ?? '';

/** Every class list the popup has from now on, to tell whether motion ran. */
function recordClasses(): () => string[] {
  const seen = new Set<string>();
  const read = (): void => {
    for (const element of document.querySelectorAll('.p-confirmpopup')) {
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
function simulateSafari(target: HTMLElement): void {
  target.addEventListener('mousedown', (event) => {
    event.preventDefault();
  });
}

describe('WjConfirmPopup', () => {
  let warn: MockInstance<typeof console.warn>;
  const viewport = { width: window.innerWidth, height: window.innerHeight };

  beforeEach(() => {
    warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    reduceMotion(true);
  });

  afterEach(async () => {
    // A popup left open at teardown lives in `document.body`: close it and wait for the leave.
    if (current && popupEl()) {
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
      const host = find(element, 'wj-confirmpopup', HTMLElement);

      expect(getComputedStyle(host).display).toBe('block');
      expect(host.getBoundingClientRect().height).toBe(0);
      expect(popupEl()).toBeNull();
      expect(await (await harnessOf(fixture)).isOpen()).toBe(false);
    });

    it('opens in document.body with the message and the translation labels, as an alertdialog', async () => {
      const rendered = await render();
      await open(rendered);
      const harness = await harnessOf(rendered.fixture);

      expect(popupEl()?.parentElement).toBe(document.body);
      expect(popupEl()?.getAttribute('aria-modal')).toBe('true');
      expect(rendered.element.querySelector('[role="alertdialog"]')).toBeNull();
      expect(await harness.isOpen()).toBe(true);
      expect(await harness.getMessage()).toBe('Remove this item from the list?');
      expect(await harness.getAcceptLabel()).toBe('Yes');
      expect(await harness.getRejectLabel()).toBe('No');
      expect(await harness.getRole()).toBe('alertdialog');
      expect(
        rendered.element.querySelector('wj-confirmpopup')?.getBoundingClientRect().height,
      ).toBe(0);
    });

    it('uses the labels the confirmation names', async () => {
      const rendered = await render((host) => {
        host.confirmation.update((c) => ({ ...c, acceptLabel: 'Remove', rejectLabel: 'Cancel' }));
      });
      await open(rendered);
      const harness = await harnessOf(rendered.fixture);

      expect(await harness.getAcceptLabel()).toBe('Remove');
      expect(await harness.getRejectLabel()).toBe('Cancel');
    });

    it('follows the translation: changed accept and reject rename the buttons', async () => {
      const rendered = await render(undefined, 'light', {
        translation: { accept: 'Đồng ý', reject: 'Không' },
      });
      await open(rendered);
      const harness = await harnessOf(rendered.fixture);

      expect(await harness.getAcceptLabel()).toBe('Đồng ý');
      expect(await harness.getRejectLabel()).toBe('Không');
    });

    it('is named by its message', async () => {
      const rendered = await render();
      await open(rendered);
      const message = find(document, `${POPUP} .p-confirmpopup-message`, HTMLElement);

      expect(popupEl()?.getAttribute('aria-labelledby')).toBe(message.id);
      expect(message.id).not.toBe('');
      expect(await (await harnessOf(rendered.fixture)).getName()).toBe(
        'Remove this item from the list?',
      );
    });

    it('is named by the new message when it opens again', async () => {
      const rendered = await render();
      await open(rendered);
      rendered.component.service.close();
      await gone();
      rendered.component.confirmation.update((c) => ({ ...c, message: 'Second question?' }));
      await open(rendered);

      expect(await (await harnessOf(rendered.fixture)).getName()).toBe('Second question?');
    });

    it('ignores a header: the popup has none', async () => {
      const rendered = await render((host) => {
        host.confirmation.update((c) => ({ ...c, header: 'Header text' }));
      });
      await open(rendered);

      expect(popupEl()?.textContent).not.toContain('Header text');
    });

    it('opens below the target, and above it when there is no room below', async () => {
      const rendered = await render();
      const wjButton = find(rendered.element, '#opener', HTMLElement);
      await open(rendered);
      expect(popupEl()?.getBoundingClientRect().top).toBeGreaterThanOrEqual(
        wjButton.getBoundingClientRect().bottom,
      );
      rendered.component.service.close();
      await gone();

      wjButton.style.position = 'fixed';
      wjButton.style.insetBlockEnd = '0';
      await open(rendered);

      expect(popupEl()?.getAttribute('data-p-confirmpopup-flipped')).toBe('true');
      expect(popupEl()?.getBoundingClientRect().bottom).toBeLessThanOrEqual(
        wjButton.getBoundingClientRect().top,
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

    it('a click outside closes it without running accept or reject', async () => {
      const rendered = await render();
      await open(rendered);

      // Optimus listens for the click on the next tick: press until it has.
      await expect
        .poll(async () => {
          await userEvent.click(find(rendered.element, '#other', HTMLElement));
          return popupEl();
        })
        .toBeNull();

      expect(rendered.component.accepts()).toBe(0);
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

    it('Tab and Shift+Tab stay inside the popup', async () => {
      const rendered = await render();
      await open(rendered);

      const forward: string[] = [];
      for (let step = 0; step < 3; step += 1) {
        await userEvent.tab();
        forward.push(focusedName());
      }
      expect(forward).toEqual(['Yes', 'No', 'Yes']);

      const backward: string[] = [];
      for (let step = 0; step < 3; step += 1) {
        await userEvent.tab({ shift: true });
        backward.push(focusedName());
      }
      expect(backward).toEqual(['No', 'Yes', 'No']);
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

    it('returns focus to the button inside a wj-button target, whatever closed it', async () => {
      const rendered = await render();

      const closers: (() => Promise<void> | void)[] = [
        () => userEvent.keyboard('{Escape}'),
        async () => (await harnessOf(rendered.fixture)).accept(),
        async () => (await harnessOf(rendered.fixture)).reject(),
        () => {
          rendered.component.service.close();
        },
      ];
      for (const close of closers) {
        await userEvent.click(opener(rendered));
        await opened();
        await close();
        await gone();
        expect(document.activeElement).toBe(opener(rendered));
      }
    });

    it('returns focus to a native target, which can take focus itself', async () => {
      const rendered = await render();
      const other = find(rendered.element, '#other', HTMLElement);
      rendered.component.service.confirm({ message: 'Sure?', target: other });
      await rendered.fixture.whenStable();
      await opened();

      await (await harnessOf(rendered.fixture)).reject();
      await gone();

      expect(document.activeElement).toBe(other);
    });

    it('returns focus to the target in Safari, which never focuses a clicked button', async () => {
      const rendered = await render();
      simulateSafari(opener(rendered));
      const original = rendered.component.service.confirm.bind(rendered.component.service);
      const activeAtOpen: (Element | null)[] = [];
      vi.spyOn(rendered.component.service, 'confirm').mockImplementation((confirmation) => {
        activeAtOpen.push(document.activeElement);
        original(confirmation);
      });

      for (const close of [
        () => userEvent.keyboard('{Escape}'),
        async () => (await harnessOf(rendered.fixture)).accept(),
      ]) {
        await userEvent.click(opener(rendered));
        await opened();
        expect(activeAtOpen.at(-1)).toBe(document.body);
        await close();
        await gone();
        expect(document.activeElement).toBe(opener(rendered));
        opener(rendered).blur();
      }
    });

    it('leaves focus where an outside click put it', async () => {
      const rendered = await render();
      await open(rendered);
      const other = find(rendered.element, '#other', HTMLElement);

      await expect
        .poll(async () => {
          await userEvent.click(other);
          return popupEl();
        })
        .toBeNull();

      expect(document.activeElement).toBe(other);
    });

    it('leaves focus alone when the target is gone', async () => {
      const rendered = await render();
      await open(rendered);

      rendered.component.withOpener.set(false);
      await rendered.fixture.whenStable();
      rendered.component.service.close();
      await gone();

      expect(document.activeElement).toBe(document.body);
    });
  });

  describe('buttons', () => {
    it('carries no autofocus on either button, also after a cycle', async () => {
      const rendered = await render();
      for (let cycle = 0; cycle < 2; cycle += 1) {
        await open(rendered);
        for (const hook of ['accept', 'reject'] as const) {
          expect(button(hook).hasAttribute('autofocus')).toBe(false);
          expect(button(hook).closest('[autofocus]')).toBeNull();
        }
        expect(document.activeElement).toBe(button('reject'));
        rendered.component.service.close();
        await gone();
      }
    });

    it('has boxes of at least 24 x 24 px, 36 px tall by the default look', async () => {
      const rendered = await render();
      await open(rendered);

      for (const hook of ['accept', 'reject'] as const) {
        const box = button(hook).getBoundingClientRect();
        expect(box.width).toBeGreaterThanOrEqual(24);
        expect(box.height).toBeGreaterThanOrEqual(24);
        expect(Math.round(box.height)).toBe(36);
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
    const parts: WjConfirmPopupPt = {
      host: { 'data-p-host': 'h' },
      root: { 'data-p-root': 'r' },
      content: { 'data-p-content': 'c' },
      message: { 'data-p-message': 'm' },
      footer: { 'data-p-footer': 'f' },
      pcAcceptButton: { root: { 'data-p-accept': 'a' } },
      pcRejectButton: { root: { 'data-p-reject': 'j' } },
    };

    const attribute = (selector: string, name: string): string | null | undefined =>
      document.querySelector(selector)?.getAttribute(name);

    async function expectParts(rendered: Rendered): Promise<void> {
      await open(rendered);
      expect(attribute('wj-confirmpopup p-confirmpopup', 'data-p-host')).toBe('h');
      expect(popupEl()?.getAttribute('data-p-root')).toBe('r');
      expect(attribute('[data-p-content]', 'data-p-content')).toBe('c');
      expect(attribute('.p-confirmpopup-message', 'data-p-message')).toBe('m');
      expect(attribute('[data-p-footer]', 'data-p-footer')).toBe('f');
      expect(button('accept').getAttribute('data-p-accept')).toBe('a');
      expect(button('reject').getAttribute('data-p-reject')).toBe('j');
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
          message: { id: 'mine' },
          root: { 'aria-labelledby': 'mine' },
          pcRejectButton: { root: { autofocus: true } },
        });
      });
      await open(rendered);

      expect(find(document, `${POPUP} .p-confirmpopup-message`, HTMLElement).id).not.toBe('mine');
      expect(popupEl()?.getAttribute('aria-labelledby')).not.toBe('mine');
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

  describe('safety', () => {
    it('renders an HTML payload in message, acceptLabel and rejectLabel as text', async () => {
      const rendered = await render((host) => {
        host.confirmation.set({ message: PAYLOAD, acceptLabel: PAYLOAD, rejectLabel: PAYLOAD });
      });
      await open(rendered);
      const harness = await harnessOf(rendered.fixture);

      expect(await harness.getMessage()).toBe(PAYLOAD);
      expect(await harness.getAcceptLabel()).toBe(PAYLOAD);
      expect(await harness.getRejectLabel()).toBe(PAYLOAD);
      expect(await harness.getName()).toBe(PAYLOAD);
      expect(popupEl()?.querySelector('img')).toBeNull();
      expect(document.querySelector('img[src="x"]')).toBeNull();
      expect(Reflect.get(window, 'wjInjected')).toBeUndefined();
    });
  });

  describe('setup and ARIA checks', () => {
    it('warns WJ0001 when provideWeeljack is missing', async () => {
      const fixture = TestBed.createComponent(AriaOnHostHost);
      await fixture.whenStable();

      expect(warn).toHaveBeenCalledWith(
        'WJ0001: wj-confirmpopup: provideWeeljack() is missing from the application providers. ' +
          'Add provideWeeljack() to your application config. ' +
          'Find more at https://locvodever.github.io/weeljack-ng/errors/WJ0001',
      );
    });

    it('stays silent with provideWeeljack', async () => {
      const rendered = await render();
      await open(rendered);
      expect(warn).not.toHaveBeenCalled();
    });

    it('warns WJ0003 once when aria-* is written on the host, and says what names the popup', async () => {
      TestBed.configureTestingModule({ providers: [provideWeeljack()] });
      const fixture = TestBed.createComponent(AriaOnHostHost);
      await fixture.whenStable();

      expect(warn).toHaveBeenCalledTimes(1);
      expect(warn).toHaveBeenCalledWith(
        "WJ0003: wj-confirmpopup: aria-label is set on the host, where it is not forwarded to the focusable element. The confirmation's message names the popup; remove the attribute. " +
          'Find more at https://locvodever.github.io/weeljack-ng/errors/WJ0003',
      );
    });

    it('warns WJ0151 when a second confirm popup is rendered', async () => {
      TestBed.configureTestingModule({ providers: [provideWeeljack()] });
      const fixture = TestBed.createComponent(TwiceHost);
      await fixture.whenStable();

      expect(warn).toHaveBeenCalledTimes(1);
      expect(warn).toHaveBeenCalledWith(
        'WJ0151: wj-confirmpopup: a second wj-confirmpopup is rendered, and every one opens each confirmation. ' +
          'Render one wj-confirmpopup at a time. ' +
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
      await expect.poll(() => document.querySelector('.p-dialog-mask')).toBeNull();
      await expect.poll(() => document.body.classList.contains('p-overflow-hidden')).toBe(false);
    }

    it('closes on Escape, and the non-closable modal below keeps its backdrop', async () => {
      const fixture = await renderLower();
      await userEvent.click(find(document, '#lower-opener', HTMLElement));
      await opened();

      await userEvent.keyboard('{Escape}');
      await gone();

      expect(fixture.componentInstance.visible()).toBe(true);
      expect(document.querySelector('.p-dialog-mask')).not.toBeNull();
      expect(document.querySelector('[role="dialog"]')).not.toBeNull();

      await userEvent.keyboard('{Escape}');
      expect(fixture.componentInstance.visible()).toBe(true);
      expect(document.querySelector('.p-dialog-mask')).not.toBeNull();
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

        it('finds no violation while open beside a button', async () => {
          const rendered = await render(undefined, scheme);
          await open(rendered);
          await expectNoAxeViolations(document.body);
        });
      });
    }
  });
});
