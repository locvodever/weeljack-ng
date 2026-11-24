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
import { WjOverlay, type WjOverlayPt } from 'weeljack-ng/overlay';
import { WjOverlayHarness } from 'weeljack-ng/overlay/testing';
import { _overlayEscapeGate } from 'weeljack-ng/private';
import { expectNoAxeViolations } from '../spec-support/axe';
import { afterOverlay } from '../spec-support/teardown';

const ROOT = document.documentElement;

/** A consumer's template: a trigger, the overlay right after it, and other things on the page. */
@Component({
  selector: 'wj-overlay-host',
  imports: [WjButton, WjOverlay],
  template: `
    <button id="other" type="button">Other</button>
    <div id="blank">Nothing to focus here</div>
    @if (withTrigger()) {
      @if (kind() === 'native') {
        <button id="trigger" type="button" (click)="toggle()">Resources</button>
      } @else {
        <wj-button id="trigger" label="Resources" (click)="toggle()" />
      }
    }
    <wj-overlay
      [(visible)]="open"
      [target]="explicit()"
      [pt]="pt()"
      (opened)="opens.set(opens() + 1)"
      (closed)="closes.set(closes() + 1)"
    >
      <ul id="links">
        <li><button id="first" type="button">First</button></li>
        <li><button id="second" type="button">Second</button></li>
        <li><wj-button label="Third" /></li>
      </ul>
    </wj-overlay>
  `,
  styles: `
    button {
      min-block-size: 44px;
      min-inline-size: 44px;
    }
  `,
})
class Host {
  readonly overlay = viewChild.required(WjOverlay);
  readonly open = signal(false);
  readonly kind = signal<'native' | 'wj'>('native');
  readonly explicit = signal<HTMLElement | undefined>(undefined);
  readonly pt = signal<WjOverlayPt>(undefined);
  readonly withTrigger = signal(true);
  readonly opens = signal(0);
  readonly closes = signal(0);

  toggle(): void {
    this.open.update((open) => !open);
  }
}

/** An overlay with nothing before it. */
@Component({
  selector: 'wj-overlay-lonely-host',
  imports: [WjOverlay],
  template: `<wj-overlay [(visible)]="open" (opened)="opens.set(opens() + 1)"
    ><p>Orphan</p></wj-overlay
  >`,
})
class LonelyHost {
  readonly open = signal(false);
  readonly opens = signal(0);
}

/** A spec-local modal below the overlay: Optimus Dialog, not closable, on the seam's gate. */
@Component({
  selector: 'wj-overlay-lower',
  imports: [Dialog, WjOverlay],
  template: `
    <p-dialog [(visible)]="visible" header="Lower" [modal]="true" [closable]="false">
      <button id="lower-opener" type="button" (click)="open.set(!open())">Open</button>
      <wj-overlay [(visible)]="open">
        <button id="inner" type="button">Inner</button>
      </wj-overlay>
    </p-dialog>
  `,
})
class LowerHost {
  readonly visible = signal(true);
  readonly open = signal(false);

  constructor() {
    _overlayEscapeGate(this.visible, () => false);
  }
}

/** A panel with a `wj-dialog` that a button inside it opens: the dialog is the upper overlay. */
@Component({
  selector: 'wj-overlay-over-dialog-host',
  imports: [WjDialog, WjOverlay],
  template: `
    <button id="trigger" type="button" (click)="open.set(!open())">Open</button>
    <wj-overlay id="outer" [(visible)]="open">
      <button id="open-dialog" type="button" (click)="dialog.set(true)">Dialog</button>
    </wj-overlay>
    <wj-dialog [(visible)]="dialog" header="Above">
      <button id="dialog-action" type="button">Action</button>
    </wj-dialog>
  `,
})
class OverDialogHost {
  readonly open = signal(false);
  readonly dialog = signal(false);
}

/** A panel with another `wj-overlay` inside it: the inner one is the upper overlay. */
@Component({
  selector: 'wj-overlay-nested-host',
  imports: [WjOverlay],
  template: `
    <button id="outer-trigger" type="button" (click)="outer.set(!outer())">Outer</button>
    <wj-overlay id="outer" [(visible)]="outer">
      <button id="inner-trigger" type="button" (click)="inner.set(!inner())">Inner</button>
      <wj-overlay id="inner" [(visible)]="inner">
        <button id="inner-action" type="button">Action</button>
      </wj-overlay>
    </wj-overlay>
  `,
})
class NestedHost {
  readonly outer = signal(false);
  readonly inner = signal(false);
}

/** A `wj-dialog` that holds a trigger and a panel: the dialog is the lower overlay. */
@Component({
  selector: 'wj-overlay-under-dialog-host',
  imports: [WjDialog, WjOverlay],
  template: `
    <wj-dialog [(visible)]="dialog" header="Below">
      <button id="panel-opener" type="button" (click)="open.set(!open())">Open</button>
      <wj-overlay [(visible)]="open">
        <button id="inner" type="button">Inner</button>
      </wj-overlay>
    </wj-dialog>
  `,
})
class UnderDialogHost {
  readonly dialog = signal(true);
  readonly open = signal(false);
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

const PANEL = 'wj-overlay .p-overlay-content';
const panelEl = (): HTMLElement | null => document.querySelector<HTMLElement>(PANEL);

function find<E extends Element>(element: ParentNode, selector: string, type: new () => E): E {
  const found = element.querySelector(selector);
  if (!(found instanceof type)) {
    throw new Error(`${selector} is missing`);
  }
  return found;
}

/** The element a reader presses: the native button, or the button inside the `wj-button`. */
const trigger = ({ element }: Rendered): HTMLElement =>
  find(element, '#trigger button, button#trigger', HTMLElement);

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

/** Waits until the panel is on the page, placed or not (an overlay with no target never is). */
async function appeared(): Promise<void> {
  await expect.poll(() => panelEl() !== null).toBe(true);
}

/**
 * Waits until the panel is on the page and Optimus has placed it: its root gets a `min-width` in
 * the same step as `opened` fires, and binds Escape and the outside click a moment later.
 */
async function opened(): Promise<void> {
  await appeared();
  await expect
    .poll(() => panelEl()?.closest<HTMLElement>('.p-overlay')?.style.minWidth !== '')
    .toBe(true);
}

/** Presses Escape until the panel is gone: Optimus binds its Escape listener when the enter ends. */
async function escape(): Promise<void> {
  await expect
    .poll(async () => {
      await userEvent.keyboard('{Escape}');
      return panelEl();
    })
    .toBeNull();
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

/** Closes through the app's own signal and waits for the leave. */
async function closeByApp(rendered: Rendered): Promise<void> {
  rendered.component.open.set(false);
  await rendered.fixture.whenStable();
  await gone();
}

const harnessOf = (fixture: ComponentFixture<unknown>): Promise<WjOverlayHarness> =>
  TestbedHarnessEnvironment.loader(fixture).getHarness(WjOverlayHarness);

const activeId = (): string => document.activeElement?.id ?? '';

/** Every class list the panel's root has from now on, to tell whether motion ran. */
function recordClasses(): () => string[] {
  const seen = new Set<string>();
  const read = (): void => {
    for (const element of document.querySelectorAll('.p-overlay, p-motion, .p-overlay-content')) {
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

describe('WjOverlay', () => {
  let warn: MockInstance<typeof console.warn>;
  const viewport = { width: window.innerWidth, height: window.innerHeight };

  beforeEach(() => {
    warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    reduceMotion(true);
  });

  afterEach(() =>
    afterOverlay(
      async () => {
        // A panel left open at teardown still holds the stack and its listeners: close it.
        if (current && panelEl()) {
          await closeByApp(current);
        }
      },
      async () => {
        current = undefined;
        ROOT.classList.remove('wj-dark');
        document.body.style.backgroundColor = '';
        await page.viewport(viewport.width, viewport.height);
      },
    ),
  );

  describe('the panel', () => {
    it('renders nothing while closed, in a host that is a block with no height', async () => {
      const { element, fixture } = await render();
      const host = find(element, 'wj-overlay', HTMLElement);

      expect(getComputedStyle(host).display).toBe('block');
      expect(host.getBoundingClientRect().height).toBe(0);
      expect(panelEl()).toBeNull();
      expect(await (await harnessOf(fixture)).isOpen()).toBe(false);
    });

    it('opens inside its host, right after the trigger, just below it', async () => {
      const rendered = await render();
      await open(rendered);
      const host = find(rendered.element, 'wj-overlay', HTMLElement);
      const box = trigger(rendered).getBoundingClientRect();
      const panel = panelEl()?.getBoundingClientRect();

      expect(host.contains(panelEl())).toBe(true);
      expect(host.getBoundingClientRect().height).toBe(0);
      expect(panel?.top).toBeGreaterThanOrEqual(box.bottom - 0.5);
      expect(panel?.top).toBeLessThanOrEqual(box.bottom + 2.5);
      expect(panel?.left).toBeCloseTo(box.left, 0);
      expect(panel?.width).toBeGreaterThanOrEqual(box.width);
    });

    it('stays on the trigger when the trigger is not at the start of its line', async () => {
      const rendered = await render();
      trigger(rendered).style.marginInlineStart = '120px';
      find(rendered.element, 'wj-overlay', HTMLElement).style.marginBlockStart = '40px';

      await open(rendered);

      expect(panelEl()?.getBoundingClientRect().left).toBeCloseTo(
        trigger(rendered).getBoundingClientRect().left,
        0,
      );
    });

    it('opens above the trigger when there is no room below', async () => {
      const rendered = await render();
      const button = trigger(rendered);
      button.style.position = 'fixed';
      button.style.insetBlockEnd = '0';

      await open(rendered);

      expect(panelEl()?.getBoundingClientRect().bottom).toBeLessThanOrEqual(
        button.getBoundingClientRect().top,
      );
    });

    it('sits 2px under the trigger, on the anchor gutter', async () => {
      const rendered = await render();
      await open(rendered);

      const gap =
        (panelEl()?.getBoundingClientRect().top ?? 0) -
        trigger(rendered).getBoundingClientRect().bottom;

      expect(Math.abs(gap - 2)).toBeLessThanOrEqual(0.5);
    });

    it('sits 2px over the trigger when it opens above', async () => {
      const rendered = await render();
      const button = trigger(rendered);
      button.style.position = 'fixed';
      button.style.insetBlockEnd = '0';
      await open(rendered);

      const gap =
        button.getBoundingClientRect().top - (panelEl()?.getBoundingClientRect().bottom ?? 0);

      expect(panelEl()?.closest<HTMLElement>('.p-overlay')?.style.transformOrigin).toBe(
        'center bottom',
      );
      expect(Math.abs(gap - 2)).toBeLessThanOrEqual(0.5);
    });

    it('paints the anchored surface with a 4px inset, from the --wj-* tokens', async () => {
      const rendered = await render();
      await open(rendered);
      const style = getComputedStyle(panelEl() ?? document.body);

      expect(style.paddingTop).toBe('4px');
      expect(style.borderTopWidth).toBe('1px');
      expect(style.borderTopStyle).toBe('solid');
      expect(style.borderTopLeftRadius).toBe('12px');
      expect(style.boxShadow).not.toBe('none');
      expect(style.backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
    });

    it('has no role of its own', async () => {
      const rendered = await render();
      await open(rendered);

      expect(rendered.element.querySelector('wj-overlay [role]')).toBeNull();
    });

    it('keeps the projected content alive while closed, and shows it again on reopening', async () => {
      const rendered = await render();
      await open(rendered);
      await closeByApp(rendered);

      await open(rendered);

      expect(find(document, '#links', HTMLElement)).toBeTruthy();
    });
  });

  describe('target', () => {
    it('defaults to the element before the host', async () => {
      const rendered = await render();
      await open(rendered);

      expect(panelEl()?.getBoundingClientRect().top).toBeGreaterThanOrEqual(
        trigger(rendered).getBoundingClientRect().bottom,
      );
    });

    it('can be given, and wins over the element before the host', async () => {
      const rendered = await render();
      const other = find(rendered.element, '#other', HTMLElement);
      rendered.component.explicit.set(other);
      await rendered.fixture.whenStable();

      rendered.component.open.set(true);
      await rendered.fixture.whenStable();
      await opened();

      expect(panelEl()?.getBoundingClientRect().top).toBeGreaterThanOrEqual(
        other.getBoundingClientRect().bottom - 0.5,
      );
      expect(panelEl()?.getBoundingClientRect().top).toBeLessThanOrEqual(
        other.getBoundingClientRect().bottom + 2.5,
      );
      expect(panelEl()?.getBoundingClientRect().left).toBeCloseTo(
        other.getBoundingClientRect().left,
        0,
      );
    });

    it('reads the element before the host again each time it opens', async () => {
      const rendered = await render();
      await open(rendered);
      await closeByApp(rendered);
      rendered.component.withTrigger.set(false);
      await rendered.fixture.whenStable();

      rendered.component.open.set(true);
      await rendered.fixture.whenStable();
      await opened();

      const blank = find(rendered.element, '#blank', HTMLElement);
      expect(panelEl()?.getBoundingClientRect().top).toBeGreaterThanOrEqual(
        blank.getBoundingClientRect().bottom - 0.5,
      );
      expect(warn).not.toHaveBeenCalled();
    });
  });

  describe('visible, opened and closed', () => {
    it('opens and closes from the app, and each output fires once', async () => {
      const rendered = await render();

      rendered.component.open.set(true);
      await rendered.fixture.whenStable();
      await opened();
      expect(rendered.component.opens()).toBe(1);
      expect(rendered.component.closes()).toBe(0);

      await closeByApp(rendered);

      expect(rendered.component.opens()).toBe(1);
      expect(rendered.component.closes()).toBe(1);
    });

    it('writes false back to the model when Optimus closes it', async () => {
      const rendered = await render();
      await open(rendered);

      await escape();

      expect(rendered.component.open()).toBe(false);
    });

    it('fires opened and closed once per cause, whatever closed it', async () => {
      const rendered = await render();
      const closers: (() => Promise<void> | void)[] = [
        () => userEvent.keyboard('{Escape}'),
        () => {
          rendered.component.open.set(false);
        },
        async () => {
          const harness = await harnessOf(rendered.fixture);
          if (await harness.isOpen()) {
            await harness.close();
          }
        },
        async () => (await harnessOf(rendered.fixture)).closeByClickingOutside(),
        () => userEvent.click(find(rendered.element, '#blank', HTMLElement)),
      ];
      let expected = 0;
      for (const close of closers) {
        await open(rendered);
        // Optimus listens for a click outside from the end of the enter: close until it has.
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

    it('a click inside does not close it', async () => {
      const rendered = await render();
      await open(rendered);

      await userEvent.click(find(document, '#links', HTMLElement));

      expect(panelEl()).not.toBeNull();
    });

    it('pressing the trigger again closes it', async () => {
      const rendered = await render();
      await open(rendered);

      await userEvent.click(trigger(rendered));
      await gone();

      expect(rendered.component.closes()).toBe(1);
    });
  });

  describe('keyboard', () => {
    it('opening keeps focus on the trigger', async () => {
      const rendered = await render();
      trigger(rendered).focus();

      await userEvent.keyboard('{Enter}');
      await opened();

      expect(document.activeElement).toBe(trigger(rendered));
    });

    it('Tab from the trigger reaches the first control of the panel, then the next', async () => {
      const rendered = await render();
      await open(rendered);

      await userEvent.tab();
      expect(activeId()).toBe('first');
      await userEvent.tab();
      expect(activeId()).toBe('second');
    });

    it('Escape closes it and focus is on the trigger', async () => {
      const rendered = await render();
      await open(rendered);

      await escape();

      expect(document.activeElement).toBe(trigger(rendered));
    });

    it('Escape pressed with focus inside the panel returns focus to the trigger', async () => {
      const rendered = await render();
      await open(rendered);
      await userEvent.tab();
      expect(activeId()).toBe('first');

      await escape();

      expect(document.activeElement).toBe(trigger(rendered));
    });

    it('closing from the app with focus inside the panel returns focus to the trigger', async () => {
      const rendered = await render();
      await open(rendered);
      await userEvent.tab();

      await closeByApp(rendered);

      expect(document.activeElement).toBe(trigger(rendered));
    });

    it('returns focus to the button inside a wj-button trigger', async () => {
      const rendered = await render((host) => {
        host.kind.set('wj');
      });
      await open(rendered);
      await userEvent.tab();

      await escape();

      expect(document.activeElement).toBe(trigger(rendered));
      expect(document.activeElement?.tagName).toBe('BUTTON');
    });

    it('returns focus to the trigger in Safari, which never focuses a clicked button', async () => {
      const rendered = await render();
      simulateSafari(trigger(rendered));

      for (let round = 0; round < 2; round += 1) {
        await userEvent.click(trigger(rendered));
        await opened();
        await closeByApp(rendered);
        expect(document.activeElement).toBe(trigger(rendered));
        trigger(rendered).blur();
      }
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

    it('leaves focus alone when the trigger is gone', async () => {
      const rendered = await render();
      await open(rendered);

      rendered.component.withTrigger.set(false);
      await rendered.fixture.whenStable();
      await closeByApp(rendered);

      expect(document.activeElement).toBe(document.body);
    });
  });

  describe('the harness', () => {
    it('reports the open state and closes it with Escape', async () => {
      const rendered = await render();
      const harness = await harnessOf(rendered.fixture);
      expect(await harness.isOpen()).toBe(false);

      await open(rendered);
      expect(await harness.isOpen()).toBe(true);

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
      const rendered = await render();
      await open(rendered);
      const harness = await harnessOf(rendered.fixture);

      const third = await harness.getHarness(WjButtonHarness.with({ label: 'Third' }));

      expect(await third.getLabel()).toBe('Third');
    });
  });

  describe('pt', () => {
    const parts: WjOverlayPt = {
      root: { 'data-p-root': 'r' },
      content: { 'data-p-content': 'c' },
    };

    async function expectParts(rendered: Rendered): Promise<void> {
      await open(rendered);
      expect(document.querySelector('wj-overlay .p-overlay')?.getAttribute('data-p-root')).toBe(
        'r',
      );
      expect(panelEl()?.getAttribute('data-p-content')).toBe('c');
    }

    it('reaches root and content, after open and close cycles too', async () => {
      const rendered = await render((host) => {
        host.pt.set(parts);
      });
      await expectParts(rendered);
      await closeByApp(rendered);
      await expectParts(rendered);
    });

    it('works as a function, with the same parts', async () => {
      const rendered = await render((host) => {
        host.pt.set(() => parts);
      });
      await expectParts(rendered);
      await closeByApp(rendered);
      await expectParts(rendered);
    });

    it('lets an app class on the content part override the surface', async () => {
      const sheet = document.createElement('style');
      sheet.textContent = '.spec-flat { padding: 0; }';
      document.head.append(sheet);
      try {
        const rendered = await render((host) => {
          host.pt.set({ content: { class: 'spec-flat' } });
        });
        await open(rendered);

        expect(getComputedStyle(panelEl() ?? document.body).paddingTop).toBe('0px');
        await closeByApp(rendered);
      } finally {
        sheet.remove();
      }
    });
  });

  describe('motion', () => {
    it('plays no enter or leave motion under reduced motion', async () => {
      const rendered = await render();
      const read = recordClasses();

      await open(rendered);
      await closeByApp(rendered);

      expect(motionClasses(read())).toEqual([]);
      expect(rendered.component.closes()).toBe(1);
    });

    it('plays the motion when the reader has not asked for less, so the recorder sees it', async () => {
      reduceMotion(false);
      const rendered = await render();
      const read = recordClasses();

      await open(rendered);
      await closeByApp(rendered);

      expect(motionClasses(read()).length).toBeGreaterThan(0);
      expect(rendered.component.closes()).toBe(1);
    });
  });

  describe('setup and dev checks', () => {
    it('warns WJ0001 when provideWeeljack is missing', async () => {
      const fixture = TestBed.createComponent(LonelyHost);
      await fixture.whenStable();

      expect(warn).toHaveBeenCalledWith(
        'WJ0001: wj-overlay: provideWeeljack() is missing from the application providers. ' +
          'Add provideWeeljack() to your application config. ' +
          'Find more at https://locvodever.github.io/weeljack-ng/errors/WJ0001',
      );
    });

    it('warns WJ0154 once when it opens with no target, and still opens', async () => {
      TestBed.configureTestingModule({ providers: [provideWeeljack()] });
      const fixture = TestBed.createComponent(LonelyHost);
      await fixture.whenStable();

      for (let round = 0; round < 2; round += 1) {
        fixture.componentInstance.open.set(true);
        await fixture.whenStable();
        await appeared();
        await expect.poll(() => fixture.componentInstance.opens()).toBe(round + 1);
        fixture.componentInstance.open.set(false);
        await fixture.whenStable();
        await gone();
      }

      expect(warn).toHaveBeenCalledTimes(1);
      expect(warn).toHaveBeenCalledWith(
        'WJ0154: wj-overlay: the overlay opened with no target, so it has nothing to anchor to. ' +
          'Put it right after the element it opens from, or set the target input. ' +
          'Find more at https://locvodever.github.io/weeljack-ng/errors/WJ0154',
      );
    });

    it('stays silent with a target before it, and takes no aria-* warning of its own', async () => {
      const rendered = await render();
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
      fixture.componentInstance.open.set(false);
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

      await escape();

      expect(fixture.componentInstance.open()).toBe(false);
      expect(fixture.componentInstance.visible()).toBe(true);
      expect(document.querySelector('.p-dialog-mask')).not.toBeNull();

      await userEvent.keyboard('{Escape}');
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

    /** A panel by its own host id, so nested panels are never confused. */
    const panelOf = (id: string): HTMLElement | null =>
      document.querySelector<HTMLElement>(`#${id} .p-overlay-content`);

    /** Waits until that host's panel is on the page and placed. */
    async function panelOpened(id: string): Promise<void> {
      await expect.poll(() => panelOf(id) !== null).toBe(true);
      await expect
        .poll(() => panelOf(id)?.closest<HTMLElement>('.p-overlay')?.style.minWidth !== '')
        .toBe(true);
    }

    it('closes only the dialog opened above it on Escape, then itself on the next', async () => {
      TestBed.configureTestingModule({ providers: [provideWeeljack()] });
      const fixture = TestBed.createComponent(OverDialogHost);
      const host = fixture.componentInstance;
      await fixture.whenStable();
      try {
        await userEvent.click(find(document, '#trigger', HTMLElement));
        await panelOpened('outer');
        await userEvent.click(find(document, '#open-dialog', HTMLElement));
        await dialogOpened();

        await userEvent.keyboard('{Escape}');
        await expect.poll(dialogEl).toBeNull();
        await fixture.whenStable();
        expect(panelOf('outer')).not.toBeNull();
        expect(host.open()).toBe(true);
        expect(host.dialog()).toBe(false);

        await userEvent.keyboard('{Escape}');
        await expect.poll(() => panelOf('outer')).toBeNull();
        await expect
          .poll(() => document.activeElement === find(document, '#trigger', HTMLElement))
          .toBe(true);
      } finally {
        host.dialog.set(false);
        host.open.set(false);
        await fixture.whenStable();
        await expect.poll(dialogEl).toBeNull();
        await expect.poll(() => panelOf('outer')).toBeNull();
        await expect.poll(() => document.querySelector('.p-dialog-mask')).toBeNull();
        await expect.poll(() => document.body.classList.contains('p-overflow-hidden')).toBe(false);
      }
    });

    it('closes only the inner overlay of two on Escape, then the outer on the next', async () => {
      TestBed.configureTestingModule({ providers: [provideWeeljack()] });
      const fixture = TestBed.createComponent(NestedHost);
      const host = fixture.componentInstance;
      await fixture.whenStable();
      try {
        await userEvent.click(find(document, '#outer-trigger', HTMLElement));
        await panelOpened('outer');
        await userEvent.click(find(document, '#inner-trigger', HTMLElement));
        await panelOpened('inner');

        await userEvent.keyboard('{Escape}');
        await expect.poll(() => panelOf('inner')).toBeNull();
        await fixture.whenStable();
        expect(panelOf('outer')).not.toBeNull();
        expect(host.outer()).toBe(true);
        expect(host.inner()).toBe(false);

        await userEvent.keyboard('{Escape}');
        await expect.poll(() => panelOf('outer')).toBeNull();
        await expect
          .poll(() => document.activeElement === find(document, '#outer-trigger', HTMLElement))
          .toBe(true);
      } finally {
        host.inner.set(false);
        host.outer.set(false);
        await fixture.whenStable();
        await expect.poll(() => panelOf('inner')).toBeNull();
        await expect.poll(() => panelOf('outer')).toBeNull();
      }
    });

    it('leaves a wj-dialog below it open on its Escape', async () => {
      TestBed.configureTestingModule({ providers: [provideWeeljack()] });
      const fixture = TestBed.createComponent(UnderDialogHost);
      const host = fixture.componentInstance;
      await fixture.whenStable();
      try {
        await dialogOpened();
        await userEvent.click(find(document, '#panel-opener', HTMLElement));
        await opened();

        await userEvent.keyboard('{Escape}');
        await gone();
        await fixture.whenStable();

        expect(host.open()).toBe(false);
        expect(host.dialog()).toBe(true);
        expect(dialogEl()).not.toBeNull();
      } finally {
        host.open.set(false);
        host.dialog.set(false);
        await fixture.whenStable();
        await gone();
        await expect.poll(dialogEl).toBeNull();
        await expect.poll(() => document.querySelector('.p-dialog-mask')).toBeNull();
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

        it('finds no violation while open', async () => {
          const rendered = await render(undefined, scheme);
          await open(rendered);
          await expectNoAxeViolations(document.body);
        });
      });
    }
  });
});
