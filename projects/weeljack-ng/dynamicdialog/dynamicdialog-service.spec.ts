/// <reference types="@vitest/browser-playwright" />
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Component, Injectable, inject, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { Dialog } from '@openng/optimus-ui/dialog';
import { DialogService } from '@openng/optimus-ui/dynamicdialog';
import type { MockInstance } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { provideWeeljack } from 'weeljack-ng';
import { WjButton } from 'weeljack-ng/button';
import { WjButtonHarness } from 'weeljack-ng/button/testing';
import {
  WjDialogService,
  WjDynamicDialogRef,
  type WjDynamicDialogConfig,
  type WjDynamicDialogPt,
} from 'weeljack-ng/dynamicdialog';
import { WjDynamicDialogHarness } from 'weeljack-ng/dynamicdialog/testing';
import { _overlayEscapeGate } from 'weeljack-ng/private';
import { expectNoAxeViolations } from '../spec-support/axe';
import { WJ_DIALOGS } from './dynamicdialog-service';
import { afterOverlay } from '../spec-support/teardown';

const PAYLOAD = '<img src=x onerror="window.wjInjected = true">';
const ROOT = document.documentElement;

interface Data {
  name: string;
}

/** A root-provided service: the content reaches it from the application's root injector. */
@Injectable({ providedIn: 'root' })
class Greeter {
  readonly greeting = 'Hello';
}

/** The ref the last `Form` injected. */
const injected: { ref: WjDynamicDialogRef<string, Data> | undefined } = { ref: undefined };

/** The app's component: a field and two actions, closing itself through the ref. */
@Component({
  selector: 'wj-dd-form',
  imports: [WjButton],
  template: `
    <p id="greeting">{{ greeter.greeting }}, {{ ref.data.name }}</p>
    <input id="name" aria-label="Name" [value]="ref.data.name" />
    <wj-button id="save" label="Save" (click)="ref.close('saved')" />
    <wj-button id="cancel" label="Cancel" severity="secondary" (click)="ref.close()" />
  `,
})
class Form {
  readonly ref = inject<WjDynamicDialogRef<string, Data>>(WjDynamicDialogRef);
  readonly greeter = inject(Greeter);

  constructor() {
    injected.ref = this.ref;
  }
}

/** A component with nothing focusable in it. */
@Component({ selector: 'wj-dd-text', template: `<p id="text">Nothing to do here.</p>` })
class Text {}

/** A component wider than any viewport. */
@Component({
  selector: 'wj-dd-wide',
  template: `<div style="inline-size: 900px">Wide.</div>`,
})
class Wide {}

/** A second component, to open beside the first. */
@Component({ selector: 'wj-dd-other', template: `<p id="other">Other.</p>` })
class Other {}

/** A consumer's template: an opener that opens the form. */
@Component({
  selector: 'wj-dd-host',
  imports: [WjButton],
  template: `
    @if (withOpener()) {
      <wj-button id="opener" label="Edit" (click)="open()" />
    }
  `,
})
class Host {
  readonly service = inject(WjDialogService);
  readonly config = signal<WjDynamicDialogConfig<Data>>({
    header: 'Edit name',
    data: { name: 'Alex' },
  });
  readonly withOpener = signal(true);
  ref: WjDynamicDialogRef<string, Data> | undefined;

  open(): void {
    this.ref = this.service.open<string, Data>(Form, this.config());
  }
}

/** A spec-local modal below the dynamic dialog: Optimus Dialog, not closable, on the seam's gate. */
@Component({
  selector: 'wj-dd-lower',
  imports: [Dialog, WjButton],
  template: `
    <p-dialog [(visible)]="visible" header="Lower" [modal]="true" [closable]="false">
      <wj-button id="lower-opener" label="Open" (click)="open()" />
    </p-dialog>
  `,
})
class LowerHost {
  readonly service = inject(WjDialogService);
  readonly visible = signal(true);
  ref: WjDynamicDialogRef<string, Data> | undefined;

  constructor() {
    _overlayEscapeGate(this.visible, () => false);
  }

  open(): void {
    this.ref = this.service.open<string, Data>(Form, { header: 'Upper', data: { name: 'Sam' } });
  }
}

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
  document.querySelector<HTMLElement>('[data-wj-dynamicdialog]');
const maskEl = (): HTMLElement | null => document.querySelector<HTMLElement>('.p-dialog-mask');

function find<E extends Element>(element: ParentNode, selector: string, type: new () => E): E {
  const found = element.querySelector(selector);
  if (!(found instanceof type)) {
    throw new Error(`${selector} is missing`);
  }
  return found;
}

const opener = (rendered: Rendered): HTMLElement =>
  find(rendered.element, '#opener button', HTMLElement);
const closeButton = (): HTMLElement =>
  find(document, '[data-wj-dynamicdialog] [data-pc-section="header"] button', HTMLElement);

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

/** Waits until the dialog is on the page, has entered and has put focus inside itself. */
async function opened(): Promise<void> {
  await expect.poll(() => dialogEl() !== null).toBe(true);
  await expect.poll(() => dialogEl()?.contains(document.activeElement)).toBe(true);
}

/** Opens from the app's opener with a real click, so focus and the pointer are the user's. */
async function open(rendered: Rendered): Promise<void> {
  await userEvent.click(opener(rendered));
  await opened();
}

/** Waits until the dialog has left and nothing of it, its backdrop or its scroll lock remains. */
async function gone(): Promise<void> {
  await expect.poll(() => dialogEl()).toBeNull();
  await expect.poll(() => maskEl()).toBeNull();
  await expect.poll(() => document.body.classList.contains('p-overflow-hidden')).toBe(false);
}

const harnessOf = (fixture: ComponentFixture<unknown>): Promise<WjDynamicDialogHarness> =>
  TestbedHarnessEnvironment.documentRootLoader(fixture).getHarness(WjDynamicDialogHarness);

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
function simulateSafari(button: HTMLElement): boolean[] {
  const bodyActive: boolean[] = [];
  button.addEventListener('mousedown', (event) => {
    bodyActive.push(document.activeElement === document.body);
    event.preventDefault();
  });
  return bodyActive;
}

describe('WjDialogService', () => {
  let warn: MockInstance<typeof console.warn>;
  const viewport = { width: window.innerWidth, height: window.innerHeight };

  beforeEach(() => {
    warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    reduceMotion(true);
  });

  afterEach(() =>
    afterOverlay(
      async () => {
        // An overlay left open at teardown would reach the next spec: close it and wait for the leave.
        if (current && dialogEl()) {
          current.component.ref?.close();
          await current.fixture.whenStable();
          await gone();
        }
      },
      async () => {
        current = undefined;
        ROOT.classList.remove('wj-dark');
        document.body.style.backgroundColor = '';
        Reflect.deleteProperty(window, 'wjInjected');
        await page.viewport(viewport.width, viewport.height);
      },
    ),
  );

  describe('the service', () => {
    it('injects with only provideWeeljack() and no Optimus service provided', () => {
      TestBed.configureTestingModule({ providers: [provideWeeljack()] });

      expect(TestBed.inject(WjDialogService)).toBeInstanceOf(WjDialogService);
      expect(TestBed.inject(DialogService, null)).toBeNull();
      expect(warn).not.toHaveBeenCalled();
    });

    it('gives each application its own service and Optimus instance', () => {
      TestBed.configureTestingModule({ providers: [provideWeeljack()] });
      const service = TestBed.inject(WjDialogService);
      const dialogs = TestBed.inject(WJ_DIALOGS);
      expect(TestBed.inject(WJ_DIALOGS)).toBe(dialogs);

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({ providers: [provideWeeljack()] });

      expect(TestBed.inject(WjDialogService)).not.toBe(service);
      expect(TestBed.inject(WJ_DIALOGS)).not.toBe(dialogs);
    });

    it('warns WJ0001 when provideWeeljack is missing', () => {
      TestBed.inject(WjDialogService);

      expect(warn).toHaveBeenCalledWith(
        'WJ0001: WjDialogService: provideWeeljack() is missing from the application providers. ' +
          'Add provideWeeljack() to your application config. ' +
          'Find more at https://locvodever.github.io/weeljack-ng/errors/WJ0001',
      );
    });
  });

  describe('open', () => {
    it('renders nothing until opened, then the content under the header', async () => {
      const rendered = await render();
      expect(dialogEl()).toBeNull();

      await open(rendered);
      const harness = await harnessOf(rendered.fixture);

      expect(await harness.isOpen()).toBe(true);
      expect(await harness.getHeader()).toBe('Edit name');
      expect(await harness.getRole()).toBe('dialog');
      expect(await harness.isModal()).toBe(true);
      expect(find(document, '#greeting', HTMLElement).textContent).toBe('Hello, Alex');
    });

    it('names the dialog by its header', async () => {
      const rendered = await render();
      await open(rendered);
      const title = find(
        document,
        '[data-wj-dynamicdialog] [data-pc-section="title"]',
        HTMLElement,
      );

      expect(dialogEl()?.getAttribute('aria-labelledby')).toBe(title.id);
      expect(title.id).not.toBe('');
    });

    it('gives the content the ref open() returned, with the data and a root-provided service', async () => {
      injected.ref = undefined;
      const rendered = await render();
      await open(rendered);

      expect(injected.ref).toBe(rendered.component.ref);
      expect(rendered.component.ref?.data).toEqual({
        name: 'Alex',
      });
      expect(find(document, '#greeting', HTMLElement).textContent).toBe('Hello, Alex');
    });

    it('lets the content close its own dialog with a result', async () => {
      const rendered = await render();
      await open(rendered);

      await userEvent.click(find(document, '#save button', HTMLElement));

      expect(await rendered.component.ref?.closed).toBe('saved');
    });

    it('finds the harnesses of the content inside the dialog', async () => {
      const rendered = await render();
      await open(rendered);
      const harness = await harnessOf(rendered.fixture);

      const save = await harness.getHarness(WjButtonHarness.with({ label: 'Save' }));
      expect(await save.getLabel()).toBe('Save');
    });

    it('opens again after a close, with a new ref', async () => {
      const rendered = await render();
      await open(rendered);
      const first = rendered.component.ref;
      first?.close();
      await gone();

      await open(rendered);

      expect(rendered.component.ref).not.toBe(first);
    });

    it('returns the open dialog’s ref when the same component is opened twice', async () => {
      const rendered = await render();
      await open(rendered);
      const first = rendered.component.ref;

      rendered.component.open();
      await rendered.fixture.whenStable();

      expect(rendered.component.ref).toBe(first);
      expect(document.querySelectorAll('[data-wj-dynamicdialog]')).toHaveLength(1);
    });

    it('opens a different component beside the first', async () => {
      const rendered = await render();
      await open(rendered);

      const other = rendered.component.service.open(Other, { header: 'Other' });
      await expect.poll(() => document.querySelectorAll('[data-wj-dynamicdialog]').length).toBe(2);

      other.close();
      await expect.poll(() => document.querySelectorAll('[data-wj-dynamicdialog]').length).toBe(1);
    });
  });

  describe('closing', () => {
    it('ref.close(value) settles closed with value, after the dialog is gone', async () => {
      const rendered = await render();
      await open(rendered);
      const ref = rendered.component.ref;

      ref?.close('saved');
      const result = await ref?.closed;

      expect(result).toBe('saved');
      expect(dialogEl()).toBeNull();
      expect(maskEl()).toBeNull();
    });

    it('settles closed with undefined for close() with nothing', async () => {
      const rendered = await render();
      await open(rendered);

      rendered.component.ref?.close();

      expect(await rendered.component.ref?.closed).toBeUndefined();
    });

    it('settles closed with undefined for the close button', async () => {
      const rendered = await render();
      await open(rendered);

      await (await harnessOf(rendered.fixture)).close();

      expect(await rendered.component.ref?.closed).toBeUndefined();
      expect(dialogEl()).toBeNull();
    });

    it('settles closed with undefined for Escape', async () => {
      const rendered = await render();
      await open(rendered);

      await userEvent.keyboard('{Escape}');

      expect(await rendered.component.ref?.closed).toBeUndefined();
      expect(dialogEl()).toBeNull();
    });

    it('closes through the harness with Escape', async () => {
      const rendered = await render();
      await open(rendered);

      await (await harnessOf(rendered.fixture)).closeWithEscape();

      expect(await rendered.component.ref?.closed).toBeUndefined();
    });

    it('settles closed once, with the first close', async () => {
      const rendered = await render();
      await open(rendered);
      const ref = rendered.component.ref;

      ref?.close('first');
      ref?.close('second');

      expect(await ref?.closed).toBe('first');
    });

    it('the backdrop never closes it', async () => {
      const rendered = await render();
      await open(rendered);

      await userEvent.click(find(document, '.p-dialog-mask', HTMLElement), {
        position: { x: 2, y: 2 },
      });

      expect(dialogEl()).not.toBeNull();
    });

    it('closable: false removes the close button and stops Escape, but ref.close() still closes', async () => {
      const rendered = await render((host) => {
        host.config.update((config) => ({ ...config, closable: false }));
      });
      await open(rendered);
      const harness = await harnessOf(rendered.fixture);

      expect(await harness.hasCloseButton()).toBe(false);
      expect(await harness.getCloseLabel()).toBeNull();
      await expect(harness.close()).rejects.toThrow(/no close button/);

      await userEvent.keyboard('{Escape}');
      await harness.closeWithEscape();
      expect(dialogEl()).not.toBeNull();

      rendered.component.ref?.close('saved');
      expect(await rendered.component.ref?.closed).toBe('saved');
    });

    it('closable: false also holds with focus on the page behind the backdrop', async () => {
      const rendered = await render((host) => {
        host.config.update((config) => ({ ...config, closable: false }));
      });
      await open(rendered);
      const active = document.activeElement;
      if (active instanceof HTMLElement) {
        active.blur();
      }

      await userEvent.keyboard('{Escape}');

      expect(dialogEl()).not.toBeNull();
    });
  });

  describe('keyboard and focus', () => {
    it('moves focus into the first control of the content when it opens', async () => {
      const rendered = await render();
      await open(rendered);

      expect(document.activeElement).toBe(find(document, '#name', HTMLElement));
    });

    it('moves focus to the close button when nothing in the content can take it', async () => {
      const rendered = await render();
      rendered.component.service.open(Text, { header: 'Read' });
      await opened();

      expect(document.activeElement).toBe(closeButton());
      TestBed.inject(WjDialogService).open(Text, { header: 'Read' }).close();
      await gone();
    });

    it('Tab and Shift+Tab stay inside the dialog', async () => {
      const rendered = await render();
      await open(rendered);

      const forward: string[] = [];
      for (let step = 0; step < 4; step += 1) {
        await userEvent.tab();
        forward.push(focusedName());
      }
      expect(forward).toEqual(['Save', 'Cancel', 'Close', 'Name']);

      const backward: string[] = [];
      for (let step = 0; step < 3; step += 1) {
        await userEvent.tab({ shift: true });
        backward.push(focusedName());
      }
      expect(backward).toEqual(['Close', 'Cancel', 'Save']);
    });

    it('returns focus to the opener, whatever closed it', async () => {
      const rendered = await render();
      const closers: (() => Promise<void> | void)[] = [
        () => userEvent.keyboard('{Escape}'),
        async () => (await harnessOf(rendered.fixture)).close(),
        () => {
          rendered.component.ref?.close('saved');
        },
        () => userEvent.click(find(document, '#cancel button', HTMLElement)),
      ];
      for (const close of closers) {
        await open(rendered);
        await close();
        await gone();
        expect(document.activeElement).toBe(opener(rendered));
      }
    });

    it('has focus back on the opener when closed resolves', async () => {
      const rendered = await render();
      await open(rendered);

      rendered.component.ref?.close();
      await rendered.component.ref?.closed;

      expect(document.activeElement).toBe(opener(rendered));
    });

    it('returns focus to the opener in Safari, which never focuses a clicked button', async () => {
      const rendered = await render();
      const bodyActive = simulateSafari(opener(rendered));

      for (const close of [
        () => userEvent.keyboard('{Escape}'),
        async () => (await harnessOf(rendered.fixture)).close(),
      ]) {
        await userEvent.click(opener(rendered));
        await opened();
        await close();
        await gone();
        expect(document.activeElement).toBe(opener(rendered));
        opener(rendered).blur();
      }
      // Every press found `document.body` active and left it so, as Safari does.
      expect(bodyActive).toEqual([true, true]);
    });

    it('leaves focus alone when the opener is gone', async () => {
      const rendered = await render();
      await open(rendered);

      rendered.component.withOpener.set(false);
      await rendered.fixture.whenStable();
      rendered.component.ref?.close();
      await gone();

      expect(document.activeElement).toBe(document.body);
    });

    describe('stacked over a modal that is not closable', () => {
      async function renderLower(): Promise<ComponentFixture<LowerHost>> {
        TestBed.configureTestingModule({ providers: [provideWeeljack()] });
        const fixture = TestBed.createComponent(LowerHost);
        await fixture.whenStable();
        await expect.poll(() => document.querySelector('[role="dialog"]') !== null).toBe(true);
        // Optimus Dialog moves focus in on a timer after it shows. Wait for that to land, or under
        // load it lands after the dynamic dialog has opened and pulls focus out of it.
        await expect
          .poll(() => document.querySelector('[role="dialog"]')?.contains(document.activeElement))
          .toBe(true);
        return fixture;
      }

      async function closeBoth(fixture: ComponentFixture<LowerHost>): Promise<void> {
        fixture.componentInstance.ref?.close();
        fixture.componentInstance.visible.set(false);
        await fixture.whenStable();
        await gone();
      }

      it('closes on Escape from inside it, and the modal below keeps its backdrop', async () => {
        const fixture = await renderLower();
        await userEvent.click(find(document, '#lower-opener button', HTMLElement));
        await opened();

        await userEvent.keyboard('{Escape}');
        await expect.poll(dialogEl).toBeNull();

        expect(fixture.componentInstance.visible()).toBe(true);
        expect(maskEl()).not.toBeNull();
        await expect.poll(() => document.body.classList.contains('p-overflow-hidden')).toBe(true);

        await userEvent.keyboard('{Escape}');
        expect(fixture.componentInstance.visible()).toBe(true);
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
  });

  describe('the close button', () => {
    it('is named Close, and carries no autofocus, also after a cycle', async () => {
      const rendered = await render();
      for (let cycle = 0; cycle < 2; cycle += 1) {
        await open(rendered);
        expect(await (await harnessOf(rendered.fixture)).getCloseLabel()).toBe('Close');
        expect(closeButton().hasAttribute('autofocus')).toBe(false);
        expect(closeButton().closest('[autofocus]')).toBeNull();
        rendered.component.ref?.close();
        await gone();
      }
    });

    it('follows the translation', async () => {
      const rendered = await render(undefined, 'light', {
        translation: { aria: { close: 'Đóng' } },
      });
      await open(rendered);

      expect(await (await harnessOf(rendered.fixture)).getCloseLabel()).toBe('Đóng');
    });

    it('has a box of at least 24 x 24 px, 44 px by the default look', async () => {
      const rendered = await render();
      await open(rendered);
      const box = closeButton().getBoundingClientRect();

      expect(box.width).toBeGreaterThanOrEqual(24);
      expect(box.height).toBeGreaterThanOrEqual(24);
      expect(Math.round(box.width)).toBe(44);
      expect(Math.round(box.height)).toBe(44);
    });
  });

  describe('pt', () => {
    const parts: WjDynamicDialogPt = {
      mask: { 'data-p-mask': 'm' },
      header: { 'data-p-header': 'h' },
      title: { 'data-p-title': 't' },
      content: { 'data-p-content': 'c' },
      pcCloseButton: { root: { 'data-p-close': 'x' } },
    };

    const attribute = (selector: string, name: string): string | null | undefined =>
      document.querySelector(selector)?.getAttribute(name);

    async function expectParts(rendered: Rendered): Promise<void> {
      await open(rendered);
      expect(attribute('.p-dialog-mask', 'data-p-mask')).toBe('m');
      expect(attribute('[data-p-header]', 'data-p-header')).toBe('h');
      expect(attribute('[data-p-title]', 'data-p-title')).toBe('t');
      expect(attribute('[data-p-content]', 'data-p-content')).toBe('c');
      expect(attribute('[data-p-close]', 'data-p-close')).toBe('x');
      // The parts the service routes land with them.
      expect(dialogEl()).not.toBeNull();
      expect(closeButton().hasAttribute('autofocus')).toBe(false);
      expect(await (await harnessOf(rendered.fixture)).getCloseLabel()).toBe('Close');
    }

    it('reaches every part, with the ones the service routes, after open and close cycles', async () => {
      const rendered = await render((host) => {
        host.config.update((config) => ({ ...config, pt: parts }));
      });
      await expectParts(rendered);
      rendered.component.ref?.close();
      await gone();
      await expectParts(rendered);
    });

    it('works as a function, with the same parts', async () => {
      const rendered = await render((host) => {
        host.config.update((config) => ({ ...config, pt: () => parts }));
      });
      await expectParts(rendered);
      rendered.component.ref?.close();
      await gone();
      await expectParts(rendered);
    });

    it('keeps what the service routes when pt names the same part', async () => {
      const rendered = await render((host) => {
        host.config.update((config) => ({
          ...config,
          pt: { root: { 'data-wj-dynamicdialog': 'mine' }, motion: { safe: false } },
        }));
      });
      await open(rendered);

      expect(dialogEl()?.getAttribute('data-wj-dynamicdialog')).toBe('');
    });
  });

  describe('motion', () => {
    it('plays no enter or leave motion under reduced motion', async () => {
      const rendered = await render();
      const read = recordClasses();

      await open(rendered);
      rendered.component.ref?.close();
      await gone();

      expect(motionClasses(read())).toEqual([]);
    });

    it('plays the motion when the reader has not asked for less, so the recorder sees it', async () => {
      reduceMotion(false);
      const rendered = await render();
      const read = recordClasses();

      await open(rendered);
      rendered.component.ref?.close();
      await gone();

      expect(motionClasses(read()).length).toBeGreaterThan(0);
    });

    it('keeps the motion safe even when pt asks for it unsafe', async () => {
      const rendered = await render((host) => {
        host.config.update((config) => ({ ...config, pt: { motion: { safe: false } } }));
      });
      const read = recordClasses();

      await open(rendered);
      rendered.component.ref?.close();
      await gone();

      expect(motionClasses(read())).toEqual([]);
    });
  });

  describe('layout', () => {
    it('never grows past the viewport minus 1rem on each side, however wide the content is', async () => {
      await page.viewport(320, 640);
      const rendered = await render();
      const ref = rendered.component.service.open(Wide, { header: 'Wide' });
      await opened();

      expect(dialogEl()?.getBoundingClientRect().width).toBeLessThanOrEqual(320 - 32);
      ref.close();
      await gone();
    });

    it('keeps the content within the dialog, which is a block', async () => {
      const rendered = await render();
      await open(rendered);
      const content = find(document, 'wj-dynamicdialog-content', HTMLElement);

      expect(getComputedStyle(content).display).toBe('block');
      expect(getComputedStyle(content).minInlineSize).toBe('0px');
    });
  });

  describe('safety', () => {
    it('renders an HTML payload in header as text', async () => {
      const rendered = await render((host) => {
        host.config.update((config) => ({ ...config, header: PAYLOAD }));
      });
      await open(rendered);

      expect(await (await harnessOf(rendered.fixture)).getHeader()).toBe(PAYLOAD);
      expect(document.querySelector('[data-wj-dynamicdialog] img')).toBeNull();
      expect(Reflect.get(window, 'wjInjected')).toBeUndefined();
    });
  });

  describe('accessibility', () => {
    for (const scheme of ['light', 'dark'] as const) {
      describe(`axe, ${scheme}`, () => {
        it('finds no violation while open and closable', async () => {
          const rendered = await render(undefined, scheme);
          await open(rendered);
          await expectNoAxeViolations();
        });

        it('finds no violation while open and not closable', async () => {
          const rendered = await render((host) => {
            host.config.update((config) => ({ ...config, closable: false }));
          }, scheme);
          await open(rendered);
          await expectNoAxeViolations();
        });
      });
    }
  });
});
