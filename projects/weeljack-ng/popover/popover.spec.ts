/// <reference types="@vitest/browser-playwright" />
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Component, signal, viewChild } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { Dialog } from '@openng/optimus-ui/dialog';
import type { MockInstance } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { provideWeeljack } from 'weeljack-ng';
import { WjButton } from 'weeljack-ng/button';
import { WjButtonHarness } from 'weeljack-ng/button/testing';
import { WjDialog } from 'weeljack-ng/dialog';
import { WjPopover, type WjPopoverPt } from 'weeljack-ng/popover';
import { WjPopoverHarness } from 'weeljack-ng/popover/testing';
import { _overlayEscapeGate } from 'weeljack-ng/private';
import { expectNoAxeViolations } from '../spec-support/axe';
import { afterOverlay } from '../spec-support/teardown';

const PAYLOAD = '<img src=x onerror="window.wjInjected = true">';
const ROOT = document.documentElement;

type Content = 'text' | 'form';

/** A consumer's template: a `wj-button` that toggles the popover, other controls, and its content. */
@Component({
  selector: 'wj-popover-host',
  imports: [WjButton, WjPopover],
  template: `
    @if (withTrigger()) {
      <wj-button id="trigger" label="Details" (click)="popover.toggle($event)" />
    }
    <button id="shower" type="button" (click)="popover.show($event)">Show</button>
    <button id="other" type="button">Other</button>
    <div id="blank">Nothing to focus here</div>
    <wj-popover
      #popover
      [ariaLabel]="label()"
      [ariaLabelledBy]="labelledBy()"
      [pt]="pt()"
      (opened)="countOpen()"
      (closed)="countClose()"
    >
      @if (content() === 'text') {
        <p id="text">Orders placed before 2 pm ship the same day.</p>
      } @else {
        <h2 id="caption">Rename item</h2>
        <input id="name" type="text" aria-label="Name" />
        <wj-button id="save" label="Save" (click)="popover.hide()" />
      }
    </wj-popover>
  `,
})
class Host {
  readonly popover = viewChild.required(WjPopover);
  readonly label = signal<string | undefined>('Shipping details');
  readonly labelledBy = signal<string | undefined>(undefined);
  readonly pt = signal<WjPopoverPt>(undefined);
  readonly content = signal<Content>('text');
  readonly withTrigger = signal(true);
  readonly opens = signal(0);
  readonly closes = signal(0);

  countOpen(): void {
    this.opens.update((count) => count + 1);
  }

  countClose(): void {
    this.closes.update((count) => count + 1);
  }
}

/** A spec-local modal below the popover: Optimus Dialog, not closable, on the seam's gate. */
@Component({
  selector: 'wj-popover-lower',
  imports: [Dialog, WjPopover],
  template: `
    <p-dialog [(visible)]="visible" header="Lower" [modal]="true" [closable]="false">
      <button id="lower-opener" type="button" (click)="popover.toggle($event)">Open</button>
      <wj-popover #popover ariaLabel="Inner">
        <button id="inner" type="button">Inner</button>
      </wj-popover>
    </p-dialog>
  `,
})
class LowerHost {
  readonly visible = signal(true);

  constructor() {
    _overlayEscapeGate(this.visible, () => false);
  }
}

/** A popover with a `wj-dialog` that a button inside it opens: the dialog is the upper overlay. */
@Component({
  selector: 'wj-popover-over-dialog-host',
  imports: [WjButton, WjDialog, WjPopover],
  template: `
    <wj-button id="trigger" label="Open" (click)="popover.toggle($event)" />
    <wj-popover #popover ariaLabel="Outer">
      <button id="open-dialog" type="button" (click)="dialog.set(true)">Dialog</button>
    </wj-popover>
    <wj-dialog [(visible)]="dialog" header="Above">
      <button id="dialog-action" type="button">Action</button>
    </wj-dialog>
  `,
})
class OverDialogHost {
  readonly popover = viewChild.required(WjPopover);
  readonly dialog = signal(false);
}

/** A `wj-dialog` with a popover that a button inside it opens: the popover is the upper overlay. */
@Component({
  selector: 'wj-popover-under-dialog-host',
  imports: [WjDialog, WjPopover],
  template: `
    <wj-dialog [(visible)]="dialog" header="Below">
      <button id="popover-opener" type="button" (click)="popover.toggle($event)">Open</button>
    </wj-dialog>
    <wj-popover #popover ariaLabel="Inner">
      <button id="inner" type="button">Inner</button>
    </wj-popover>
  `,
})
class UnderDialogHost {
  readonly popover = viewChild.required(WjPopover);
  readonly dialog = signal(true);
}

/** A consumer who writes aria-* on the host. */
@Component({
  selector: 'wj-popover-aria-on-host-host',
  imports: [WjPopover],
  template: `<wj-popover aria-label="Details" />`,
})
class AriaOnHostHost {}

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

const PANEL = 'div[role="dialog"][data-wj-popover]';
const panelEl = (): HTMLElement | null => document.querySelector<HTMLElement>(PANEL);

function find<E extends Element>(element: ParentNode, selector: string, type: new () => E): E {
  const found = element.querySelector(selector);
  if (!(found instanceof type)) {
    throw new Error(`${selector} is missing`);
  }
  return found;
}

/** The button inside the `wj-button` trigger: what a reader presses and what takes focus. */
const trigger = ({ element }: Rendered): HTMLElement =>
  find(element, '#trigger button', HTMLElement);

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

/** Waits until the panel is on the page and focus has moved into it (or onto it). */
async function opened(): Promise<void> {
  await expect.poll(() => panelEl() !== null).toBe(true);
  await expect.poll(() => panelEl()?.contains(document.activeElement)).toBe(true);
}

/** Presses the trigger, as a reader does, and waits until the panel is open. */
async function open(rendered: Rendered): Promise<void> {
  await userEvent.click(trigger(rendered));
  await rendered.fixture.whenStable();
  await opened();
}

/** Waits until the panel has left and nothing of it remains on the page. */
async function gone(): Promise<void> {
  await expect.poll(panelEl).toBeNull();
}

const harnessOf = (fixture: ComponentFixture<unknown>): Promise<WjPopoverHarness> =>
  TestbedHarnessEnvironment.loader(fixture).getHarness(WjPopoverHarness);

const activeId = (): string => document.activeElement?.id ?? '';

/** Every class list the panel has from now on, to tell whether motion ran. */
function recordClasses(): () => string[] {
  const seen = new Set<string>();
  const read = (): void => {
    for (const element of document.querySelectorAll('.p-popover')) {
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

describe('WjPopover', () => {
  let warn: MockInstance<typeof console.warn>;
  const viewport = { width: window.innerWidth, height: window.innerHeight };

  beforeEach(() => {
    warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    reduceMotion(true);
  });

  afterEach(() =>
    afterOverlay(
      async () => {
        // A panel left open at teardown lives in `document.body`: close it and wait for the leave.
        if (current && panelEl()) {
          current.component.popover().hide();
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

  describe('the panel', () => {
    it('renders nothing while closed, in a host that is a block with no height', async () => {
      const { element, fixture } = await render();
      const host = find(element, 'wj-popover', HTMLElement);

      expect(getComputedStyle(host).display).toBe('block');
      expect(host.getBoundingClientRect().height).toBe(0);
      expect(panelEl()).toBeNull();
      expect(await (await harnessOf(fixture)).isOpen()).toBe(false);
    });

    it('opens in document.body as a dialog named by ariaLabel, below the trigger', async () => {
      const rendered = await render();
      await open(rendered);
      const harness = await harnessOf(rendered.fixture);

      expect(panelEl()?.parentElement).toBe(document.body);
      expect(rendered.element.querySelector('[role="dialog"]')).toBeNull();
      expect(await harness.isOpen()).toBe(true);
      expect(await harness.getRole()).toBe('dialog');
      expect(await harness.getName()).toBe('Shipping details');
      expect(panelEl()?.textContent).toContain('Orders placed before 2 pm');
      expect(panelEl()?.getBoundingClientRect().top).toBeGreaterThanOrEqual(
        find(rendered.element, '#trigger', HTMLElement).getBoundingClientRect().bottom,
      );
    });

    it('is named by the element ariaLabelledBy points to', async () => {
      const rendered = await render((host) => {
        host.label.set(undefined);
        host.labelledBy.set('caption');
        host.content.set('form');
      });
      await open(rendered);

      expect(panelEl()?.getAttribute('aria-labelledby')).toBe('caption');
      expect(await (await harnessOf(rendered.fixture)).getName()).toBe('Rename item');
    });

    it('opens above the trigger when there is no room below', async () => {
      const rendered = await render();
      const wjButton = find(rendered.element, '#trigger', HTMLElement);
      wjButton.style.position = 'fixed';
      wjButton.style.insetBlockEnd = '0';

      await open(rendered);

      expect(panelEl()?.getAttribute('data-p-popover-flipped')).toBe('true');
      expect(panelEl()?.getBoundingClientRect().bottom).toBeLessThanOrEqual(
        wjButton.getBoundingClientRect().top,
      );
    });

    it('is not marked modal, because it has no backdrop', async () => {
      const rendered = await render();
      await open(rendered);

      expect(panelEl()?.hasAttribute('aria-modal')).toBe(false);
      rendered.component.popover().hide();
      await gone();
      await open(rendered);
      expect(panelEl()?.hasAttribute('aria-modal')).toBe(false);
    });

    it('keeps the projected content alive while closed, and shows it again on reopening', async () => {
      const rendered = await render((host) => {
        host.content.set('form');
      });
      await open(rendered);
      const input = find(document, '#name', HTMLInputElement);
      await userEvent.fill(input, 'Draft');
      rendered.component.popover().hide();
      await gone();

      await open(rendered);

      expect(find(document, '#name', HTMLInputElement).value).toBe('Draft');
    });
  });

  describe('methods and outputs', () => {
    it('toggle opens and closes it, and opened and closed fire once each', async () => {
      const rendered = await render();
      await open(rendered);
      expect(rendered.component.opens()).toBe(1);
      expect(rendered.component.closes()).toBe(0);

      rendered.component.popover().toggle(new Event('click'), trigger(rendered));
      await gone();

      expect(rendered.component.opens()).toBe(1);
      expect(rendered.component.closes()).toBe(1);
    });

    it('show opens it beside the event target and hide closes it', async () => {
      const rendered = await render();
      await userEvent.click(find(rendered.element, '#shower', HTMLElement));
      await opened();
      expect(rendered.component.opens()).toBe(1);

      rendered.component.popover().hide();
      await gone();

      expect(rendered.component.closes()).toBe(1);
      expect(document.activeElement).toBe(find(rendered.element, '#shower', HTMLElement));
    });

    it('opens beside an explicit target, and focus returns to it', async () => {
      const rendered = await render();
      const other = find(rendered.element, '#other', HTMLElement);
      other.focus();
      rendered.component.popover().show(new Event('click'), other);
      await rendered.fixture.whenStable();
      await opened();

      expect(panelEl()?.getBoundingClientRect().top).toBeGreaterThanOrEqual(
        other.getBoundingClientRect().bottom,
      );
      await userEvent.keyboard('{Escape}');
      await gone();

      expect(document.activeElement).toBe(other);
    });

    it('closed fires once per close, whatever closed it', async () => {
      const rendered = await render();
      const closers: (() => Promise<void> | void)[] = [
        () => userEvent.keyboard('{Escape}'),
        () => {
          rendered.component.popover().hide();
        },
        async () => (await harnessOf(rendered.fixture)).close(),
        async () => (await harnessOf(rendered.fixture)).closeByClickingOutside(),
      ];
      let expected = 0;
      for (const close of closers) {
        await open(rendered);
        // Optimus listens for a click outside from the next tick: close until it has.
        await expect
          .poll(async () => {
            await close();
            return panelEl();
          })
          .toBeNull();
        expected += 1;
        expect(rendered.component.closes()).toBe(expected);
        expect(rendered.component.opens()).toBe(expected);
      }
    });

    it('Escape closes it', async () => {
      const rendered = await render();
      await open(rendered);

      await userEvent.keyboard('{Escape}');
      await gone();

      expect(rendered.component.closes()).toBe(1);
    });

    it('a click outside closes it', async () => {
      const rendered = await render();
      await open(rendered);

      await expect
        .poll(async () => {
          await userEvent.click(find(rendered.element, '#blank', HTMLElement));
          return panelEl();
        })
        .toBeNull();
    });

    it('a click inside does not close it', async () => {
      const rendered = await render();
      await open(rendered);

      await userEvent.click(find(document, '#text', HTMLElement));

      expect(panelEl()).not.toBeNull();
    });

    it('is closed by its host when the trigger is pressed again', async () => {
      const rendered = await render();
      await open(rendered);

      await userEvent.click(trigger(rendered));
      await gone();

      expect(rendered.component.closes()).toBe(1);
    });
  });

  describe('keyboard', () => {
    it('Enter on the trigger opens it and moves focus into the panel when it has no control', async () => {
      const rendered = await render();
      trigger(rendered).focus();

      await userEvent.keyboard('{Enter}');
      await opened();

      expect(document.activeElement).toBe(panelEl());
      expect(panelEl()?.getAttribute('tabindex')).toBe('-1');
    });

    it('Space on the trigger opens it', async () => {
      const rendered = await render();
      trigger(rendered).focus();

      await userEvent.keyboard(' ');
      await opened();

      expect(panelEl()).not.toBeNull();
    });

    it('traps Tab with two sentinels only while the panel holds a control', async () => {
      const text = await render();
      await open(text);
      expect(panelEl()?.querySelector('[data-p-hidden-focusable]')).toBeNull();
      text.component.popover().hide();
      await gone();
      text.component.content.set('form');
      await text.fixture.whenStable();

      await open(text);

      expect(panelEl()?.querySelectorAll('[data-p-hidden-focusable]').length).toBe(2);
    });

    it('moves focus to the first control when there is one', async () => {
      const rendered = await render((host) => {
        host.content.set('form');
      });
      await open(rendered);

      expect(activeId()).toBe('name');
    });

    it('Tab and Shift+Tab stay inside while it holds controls', async () => {
      const rendered = await render((host) => {
        host.content.set('form');
      });
      await open(rendered);
      const inside = (): boolean => panelEl()?.contains(document.activeElement) === true;
      const name = (): string => document.activeElement?.closest('button, input')?.id ?? '';

      const forward: string[] = [];
      for (let step = 0; step < 4; step += 1) {
        await userEvent.tab();
        forward.push(name());
        expect(inside()).toBe(true);
      }
      expect(forward).toEqual(['', 'name', '', 'name']);

      const backward: string[] = [];
      for (let step = 0; step < 4; step += 1) {
        await userEvent.tab({ shift: true });
        backward.push(name());
        expect(inside()).toBe(true);
      }
      expect(backward).toEqual(['', 'name', '', 'name']);
    });

    it('Escape closes it and focus is on the trigger', async () => {
      const rendered = await render();
      await open(rendered);

      await userEvent.keyboard('{Escape}');
      await gone();

      expect(document.activeElement).toBe(trigger(rendered));
    });

    it('Escape from a control inside closes it and returns focus to the trigger', async () => {
      const rendered = await render((host) => {
        host.content.set('form');
      });
      await open(rendered);

      await userEvent.keyboard('{Escape}');
      await gone();

      expect(document.activeElement).toBe(trigger(rendered));
    });

    it('Save, a button that calls hide(), closes it and returns focus to the trigger', async () => {
      const rendered = await render((host) => {
        host.content.set('form');
      });
      await open(rendered);
      const save = await TestbedHarnessEnvironment.documentRootLoader(rendered.fixture).getHarness(
        WjButtonHarness.with({ label: 'Save' }),
      );

      await save.click();
      await gone();

      expect(document.activeElement).toBe(trigger(rendered));
    });

    it('returns focus to the trigger in Safari, which never focuses a clicked button', async () => {
      const rendered = await render();
      simulateSafari(trigger(rendered));

      for (const close of [
        () => userEvent.keyboard('{Escape}'),
        () => userEvent.keyboard('{Escape}'),
      ]) {
        await userEvent.click(trigger(rendered));
        await opened();
        await close();
        await gone();
        expect(document.activeElement).toBe(trigger(rendered));
        trigger(rendered).blur();
      }
    });

    it('returns focus to the trigger after a click outside that lands on nothing focusable', async () => {
      const rendered = await render();
      await open(rendered);

      await expect
        .poll(async () => {
          await userEvent.click(find(rendered.element, '#blank', HTMLElement));
          return panelEl();
        })
        .toBeNull();

      expect(document.activeElement).toBe(trigger(rendered));
    });

    it('leaves focus where a click on another control put it', async () => {
      const rendered = await render();
      await open(rendered);
      const other = find(rendered.element, '#other', HTMLElement);

      await expect
        .poll(async () => {
          await userEvent.click(other);
          return panelEl();
        })
        .toBeNull();

      expect(document.activeElement).toBe(other);
    });

    it('hide() with focus on another control leaves focus there', async () => {
      const rendered = await render();
      await open(rendered);
      const other = find(rendered.element, '#other', HTMLElement);
      other.focus();

      rendered.component.popover().hide();
      await gone();

      expect(document.activeElement).toBe(other);
    });

    it('leaves focus alone when the trigger is gone', async () => {
      const rendered = await render();
      await open(rendered);

      rendered.component.withTrigger.set(false);
      await rendered.fixture.whenStable();
      rendered.component.popover().hide();
      await gone();

      expect(document.activeElement).toBe(document.body);
    });
  });

  describe('the harness', () => {
    it('reports the open state, the name and the role, and closes it with Escape', async () => {
      const rendered = await render();
      const harness = await harnessOf(rendered.fixture);
      expect(await harness.isOpen()).toBe(false);

      await open(rendered);
      expect(await harness.isOpen()).toBe(true);
      expect(await harness.getName()).toBe('Shipping details');

      await harness.close();
      await gone();
      expect(await harness.isOpen()).toBe(false);
    });

    it('closes it through an outside click', async () => {
      const rendered = await render();
      const harness = await harnessOf(rendered.fixture);
      await open(rendered);

      await expect
        .poll(async () => {
          await harness.closeByClickingOutside();
          return panelEl();
        })
        .toBeNull();
    });

    it('reaches harnesses inside the panel', async () => {
      const rendered = await render((host) => {
        host.content.set('form');
      });
      await open(rendered);
      const harness = await harnessOf(rendered.fixture);

      const save = await harness.getHarness(WjButtonHarness.with({ label: 'Save' }));

      expect(await save.getLabel()).toBe('Save');
    });
  });

  describe('pt', () => {
    const parts: WjPopoverPt = {
      host: { 'data-p-host': 'h' },
      root: { 'data-p-root': 'r' },
      content: { 'data-p-content': 'c' },
    };

    async function expectParts(rendered: Rendered): Promise<void> {
      await open(rendered);
      expect(document.querySelector('wj-popover p-popover')?.getAttribute('data-p-host')).toBe('h');
      expect(panelEl()?.getAttribute('data-p-root')).toBe('r');
      expect(document.querySelector('[data-p-content]')?.getAttribute('data-p-content')).toBe('c');
    }

    it('reaches host, root and content, after open and close cycles too', async () => {
      const rendered = await render((host) => {
        host.pt.set(parts);
      });
      await expectParts(rendered);
      rendered.component.popover().hide();
      await gone();
      await expectParts(rendered);
    });

    it('works as a function, with the same parts', async () => {
      const rendered = await render((host) => {
        host.pt.set(() => parts);
      });
      await expectParts(rendered);
      rendered.component.popover().hide();
      await gone();
      await expectParts(rendered);
    });

    it('keeps what the wrapper routes when pt names the same attribute', async () => {
      const rendered = await render((host) => {
        host.pt.set({ root: { 'data-wj-popover': 'mine', 'data-p-root': 'r' } });
      });
      await open(rendered);

      expect(panelEl()?.getAttribute('data-wj-popover')).toBe('');
      expect(panelEl()?.getAttribute('data-p-root')).toBe('r');
    });
  });

  describe('motion', () => {
    it('plays no enter or leave motion under reduced motion', async () => {
      const rendered = await render();
      const read = recordClasses();

      await open(rendered);
      rendered.component.popover().hide();
      await gone();

      expect(motionClasses(read())).toEqual([]);
    });

    it('plays the motion when the reader has not asked for less, so the recorder sees it', async () => {
      reduceMotion(false);
      const rendered = await render();
      const read = recordClasses();

      await open(rendered);
      rendered.component.popover().hide();
      await gone();

      expect(motionClasses(read()).length).toBeGreaterThan(0);
    });
  });

  describe('safety', () => {
    it('renders an HTML payload in ariaLabel and ariaLabelledBy as attribute text', async () => {
      const rendered = await render((host) => {
        host.label.set(PAYLOAD);
        host.labelledBy.set(PAYLOAD);
      });
      await open(rendered);

      expect(panelEl()?.getAttribute('aria-label')).toBe(PAYLOAD);
      expect(panelEl()?.getAttribute('aria-labelledby')).toBe(PAYLOAD);
      expect((await harnessOf(rendered.fixture).then((h) => h.getName())) ?? '').toBe(PAYLOAD);
      expect(panelEl()?.querySelector('img')).toBeNull();
      expect(document.querySelector('img[src="x"]')).toBeNull();
      expect(Reflect.get(window, 'wjInjected')).toBeUndefined();
    });
  });

  describe('setup and ARIA checks', () => {
    it('warns WJ0001 when provideWeeljack is missing', async () => {
      const fixture = TestBed.createComponent(AriaOnHostHost);
      await fixture.whenStable();

      expect(warn).toHaveBeenCalledWith(
        'WJ0001: wj-popover: provideWeeljack() is missing from the application providers. ' +
          'Add provideWeeljack() to your application config. ' +
          'Find more at https://locvodever.github.io/weeljack-ng/errors/WJ0001',
      );
    });

    it('warns WJ0003 once when aria-* is written on the host, and says what to use', async () => {
      TestBed.configureTestingModule({ providers: [provideWeeljack()] });
      const fixture = TestBed.createComponent(AriaOnHostHost);
      await fixture.whenStable();

      expect(warn).toHaveBeenCalledTimes(1);
      expect(warn).toHaveBeenCalledWith(
        'WJ0003: wj-popover: aria-label is set on the host, where it is not forwarded to the focusable element. Use the ariaLabel or ariaLabelledBy input. ' +
          'Find more at https://locvodever.github.io/weeljack-ng/errors/WJ0003',
      );
    });

    it('warns WJ0152 once when it opens with no name', async () => {
      const rendered = await render((host) => {
        host.label.set(undefined);
      });
      await open(rendered);
      rendered.component.popover().hide();
      await gone();
      await open(rendered);

      expect(warn).toHaveBeenCalledTimes(1);
      expect(warn).toHaveBeenCalledWith(
        'WJ0152: wj-popover: the popover opened with no name, so a screen reader announces an unnamed dialog. ' +
          'Set ariaLabel or ariaLabelledBy. ' +
          'Find more at https://locvodever.github.io/weeljack-ng/errors/WJ0152',
      );
    });

    it('stays silent when it is named, by either input', async () => {
      const rendered = await render();
      await open(rendered);
      rendered.component.popover().hide();
      await gone();
      rendered.component.label.set(undefined);
      rendered.component.labelledBy.set('text');
      await open(rendered);

      expect(warn).not.toHaveBeenCalled();
    });
  });

  describe('stacked overlays', () => {
    async function renderLower(): Promise<ComponentFixture<LowerHost>> {
      TestBed.configureTestingModule({ providers: [provideWeeljack()] });
      const fixture = TestBed.createComponent(LowerHost);
      await fixture.whenStable();
      await expect.poll(() => document.querySelector('#lower-opener') !== null).toBe(true);
      // Optimus Dialog moves focus in on a timer after it shows. Wait for that to land, or under
      // load it lands after the overlay above has opened and pulls focus out of it.
      await expect
        .poll(() => document.querySelector('[role="dialog"]')?.contains(document.activeElement))
        .toBe(true);
      return fixture;
    }

    async function closeBoth(fixture: ComponentFixture<LowerHost>): Promise<void> {
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

      await userEvent.keyboard('{Escape}');
      expect(fixture.componentInstance.visible()).toBe(true);
      expect(document.querySelector('.p-dialog-mask')).not.toBeNull();
      await closeBoth(fixture);
    });

    it('closes on Escape pressed with focus back on a control of the modal below', async () => {
      const fixture = await renderLower();
      const opener = find(document, '#lower-opener', HTMLElement);
      await userEvent.click(opener);
      await opened();

      // Focus moves without closing the popover; the modal's own Escape gate sees the keydown.
      opener.focus();
      await userEvent.keyboard('{Escape}');
      await gone();

      expect(fixture.componentInstance.visible()).toBe(true);
      expect(document.querySelector('.p-dialog-mask')).not.toBeNull();
      await closeBoth(fixture);
    });

    const dialogEl = (): HTMLElement | null => document.querySelector<HTMLElement>('.p-dialog');

    /** Waits until the dialog is on the page and focus has moved into it. */
    async function dialogOpened(): Promise<void> {
      await expect.poll(() => dialogEl() !== null).toBe(true);
      await expect.poll(() => dialogEl()?.contains(document.activeElement)).toBe(true);
    }

    it('closes only the dialog opened above it on Escape, then itself on the next', async () => {
      TestBed.configureTestingModule({ providers: [provideWeeljack()] });
      const fixture = TestBed.createComponent(OverDialogHost);
      const host = fixture.componentInstance;
      await fixture.whenStable();
      try {
        await userEvent.click(find(document, '#trigger button', HTMLElement));
        await opened();
        await userEvent.click(find(document, '#open-dialog', HTMLElement));
        await dialogOpened();

        await userEvent.keyboard('{Escape}');
        await expect.poll(dialogEl).toBeNull();
        await fixture.whenStable();
        expect(panelEl()).not.toBeNull();
        expect(host.dialog()).toBe(false);

        await userEvent.keyboard('{Escape}');
        await gone();
        await expect
          .poll(() => document.activeElement === find(document, '#trigger button', HTMLElement))
          .toBe(true);
      } finally {
        host.dialog.set(false);
        host.popover().hide();
        await fixture.whenStable();
        await expect.poll(dialogEl).toBeNull();
        await gone();
        await expect.poll(() => document.body.classList.contains('p-overflow-hidden')).toBe(false);
      }
    });

    it('leaves a dialog below it open on its Escape', async () => {
      TestBed.configureTestingModule({ providers: [provideWeeljack()] });
      const fixture = TestBed.createComponent(UnderDialogHost);
      const host = fixture.componentInstance;
      await fixture.whenStable();
      try {
        await dialogOpened();
        await userEvent.click(find(document, '#popover-opener', HTMLElement));
        await opened();

        await userEvent.keyboard('{Escape}');
        await gone();
        await fixture.whenStable();

        expect(host.dialog()).toBe(true);
        expect(dialogEl()).not.toBeNull();
      } finally {
        host.popover().hide();
        host.dialog.set(false);
        await fixture.whenStable();
        await gone();
        await expect.poll(dialogEl).toBeNull();
        await expect.poll(() => document.body.classList.contains('p-overflow-hidden')).toBe(false);
      }
    });
  });

  describe('accessibility', () => {
    for (const scheme of ['light', 'dark'] as const) {
      describe(`axe, ${scheme}`, () => {
        it('finds no violation while closed', async () => {
          const { element } = await render(undefined, scheme);
          await expectNoAxeViolations(element);
        });

        it('finds no violation while open with text only', async () => {
          const rendered = await render(undefined, scheme);
          await open(rendered);
          await expectNoAxeViolations(document.body);
        });

        it('finds no violation while open with a control inside', async () => {
          const rendered = await render((host) => {
            host.label.set(undefined);
            host.labelledBy.set('caption');
            host.content.set('form');
          }, scheme);
          await open(rendered);
          await expectNoAxeViolations(document.body);
        });
      });
    }
  });
});
