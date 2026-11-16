import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Component, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import type { MockInstance } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { provideWeeljack } from 'weeljack-ng';
import {
  WjToast,
  WjToastService,
  type WjToastMessage,
  type WjToastPosition,
  type WjToastPt,
} from 'weeljack-ng/toast';
import { WjToastHarness } from 'weeljack-ng/toast/testing';
import { expectNoAxeViolations } from '../spec-support/axe';

const PAYLOAD = '<img src=x onerror="window.wjInjected = true">';
const ROOT = document.documentElement;
/** Long enough that no message closes by itself while a spec runs. */
const STAY = 600000;

/** A consumer's template: one toast between two buttons. */
@Component({
  selector: 'wj-toast-host',
  imports: [WjToast],
  template: `
    <button type="button" id="before">Before</button>
    <wj-toast [position]="position()" [pt]="pt()" />
    <button type="button" id="after">After</button>
  `,
})
class Host {
  readonly position = signal<WjToastPosition>('top-right');
  readonly pt = signal<WjToastPt>(undefined);
}

/** A consumer who writes aria-* on the host. */
@Component({
  selector: 'wj-toast-aria-on-host-host',
  imports: [WjToast],
  template: `<wj-toast aria-label="Messages" />`,
})
class AriaOnHostHost {}

/** A toast rendered without `provideWeeljack`. */
@Component({
  selector: 'wj-toast-routed-host',
  imports: [WjToast],
  template: `<wj-toast />`,
})
class RoutedHost {}

type Scheme = 'light' | 'dark';

interface Rendered {
  fixture: ComponentFixture<Host>;
  component: Host;
  element: HTMLElement;
}

const alerts = (): HTMLElement[] =>
  Array.from(document.querySelectorAll<HTMLElement>('wj-toast [role="alert"]'));

const closeButtons = (): HTMLButtonElement[] =>
  Array.from(document.querySelectorAll<HTMLButtonElement>('wj-toast [role="alert"] button'));

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
  return {
    fixture,
    component: fixture.componentInstance,
    element: fixture.nativeElement as HTMLElement,
  };
}

/** Shows `messages` and waits until each one is on the page. */
async function show(...messages: WjToastMessage[]): Promise<void> {
  const before = alerts().length;
  const service = TestBed.inject(WjToastService);
  for (const message of messages) {
    service.show({ life: STAY, ...message });
  }
  await expect.poll(alerts).toHaveLength(before + messages.length);
}

function find<E extends Element>(element: ParentNode, selector: string, type: new () => E): E {
  const found = element.querySelector(selector);
  if (!(found instanceof type)) {
    throw new Error(`${selector} is missing`);
  }
  return found;
}

const hostOf = (element: HTMLElement): HTMLElement => find(element, 'wj-toast', HTMLElement);
const rootOf = (element: HTMLElement): HTMLElement => find(element, 'p-toast', HTMLElement);

function harnessOf(fixture: ComponentFixture<unknown>): Promise<WjToastHarness> {
  return TestbedHarnessEnvironment.loader(fixture).getHarness(WjToastHarness);
}

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

/**
 * Records every class list a message has from now on, so a spec can tell whether Optimus's enter
 * and leave motion ran. Call the returned function to stop and read them.
 */
function recordMessageClasses(): () => string[] {
  const seen = new Set<string>();
  const read = (): void => {
    alerts().forEach((message) => seen.add(message.className));
  };
  const observer = new MutationObserver(read);
  observer.observe(document.body, { attributes: true, subtree: true, childList: true });
  return () => {
    read();
    observer.disconnect();
    return [...seen];
  };
}

/** A pt part's context as Optimus hands it: `instance` is the message item, untyped. */
function messageSummaryOf(context: unknown): string {
  const item: unknown = Reflect.get(Object(context), 'instance');
  const message: unknown = Reflect.get(Object(item), 'message');
  const summary: unknown = Reflect.get(Object(message), 'summary');
  return typeof summary === 'string' ? summary : '';
}

const SEVERITIES: [WjToastMessage][] = [
  [{ severity: 'success', summary: 'Saved', detail: 'Your changes are saved.' }],
  [{ severity: 'info', summary: 'Heads up', detail: 'A new version is ready.' }],
  [{ severity: 'warn', summary: 'Check your input', detail: 'Two fields look empty.' }],
  [{ severity: 'error', summary: 'Could not save', detail: 'Check your connection and retry.' }],
];

const STATES: [string, WjToastMessage[]][] = [
  ['an empty host', []],
  ...SEVERITIES.map(([message]): [string, WjToastMessage[]] => [
    `one ${message.severity ?? 'info'} message`,
    [message],
  ]),
  ['three stacked messages', SEVERITIES.slice(0, 3).map(([message]) => message)],
];

describe('WjToast', () => {
  let warn: MockInstance<typeof console.warn>;
  const viewport = { width: window.innerWidth, height: window.innerHeight };

  beforeEach(() => {
    warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    // A leave under reduced motion is immediate, so a spec never waits on the motion to end. The
    // motion specs turn the preference off themselves. No spec-wide `transition: none` here: it
    // can stop Optimus's motion from ever ending.
    reduceMotion(true);
  });

  afterEach(async () => {
    // A message left open at teardown would reach the next spec.
    TestBed.inject(WjToastService).clear();
    await expect.poll(alerts, { timeout: 5000 }).toHaveLength(0);
    ROOT.classList.remove('wj-dark');
    document.body.style.backgroundColor = '';
    document.head.querySelectorAll('style[data-optimus-style-id]').forEach((style) => {
      style.remove();
    });
    Reflect.deleteProperty(window, 'wjInjected');
    await page.viewport(viewport.width, viewport.height);
  });

  describe('inputs', () => {
    it('defaults to the top right, 20px in from the corner', async () => {
      const { element } = await render();
      await show({ summary: 'Saved' });
      const rect = rootOf(element).getBoundingClientRect();

      expect(rootOf(element).classList.contains('p-toast-top-right')).toBe(true);
      expect(rect.top).toBe(20);
      expect(rect.right).toBe(ROOT.clientWidth - 20);
    });

    it('position moves the stack, and updates when it changes', async () => {
      const { fixture, component, element } = await render((host) => {
        host.position.set('bottom-left');
      });
      await show({ summary: 'Saved' });
      expect(rootOf(element).classList.contains('p-toast-bottom-left')).toBe(true);
      expect(rootOf(element).getBoundingClientRect().left).toBe(20);
      expect(rootOf(element).getBoundingClientRect().bottom).toBe(ROOT.clientHeight - 20);

      component.position.set('top-left');
      await fixture.whenStable();
      expect(rootOf(element).classList.contains('p-toast-top-left')).toBe(true);
      expect(rootOf(element).getBoundingClientRect().top).toBe(20);
    });

    it('takes no room in the flow: the host is a block with no height of its own', async () => {
      const { element } = await render();
      await show({ summary: 'Saved' });

      expect(getComputedStyle(hostOf(element)).display).toBe('block');
      expect(hostOf(element).getBoundingClientRect().height).toBe(0);
    });

    it('shows each message as its own severity, and an unset one as info', async () => {
      const { fixture } = await render();
      await show(
        { severity: 'success', summary: 'a' },
        { severity: 'warn', summary: 'b' },
        { severity: 'error', summary: 'c' },
        { summary: 'd' },
      );
      const messages = await (await harnessOf(fixture)).getMessages();

      expect(await Promise.all(messages.map((message) => message.getSeverity()))).toEqual([
        'success',
        'warn',
        'error',
        'info',
      ]);
      expect(alerts().map((message) => message.dataset['wjSeverity'])).toEqual([
        'success',
        'warn',
        'error',
        'info',
      ]);
    });

    it('closes a message after its life, in milliseconds', async () => {
      await render();
      // spec-timing: Optimus closes a message with its own setTimeout, so the spec advances it
      vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
      try {
        TestBed.inject(WjToastService).show({ summary: 'Short', life: 5000 });
        await expect.poll(alerts).toHaveLength(1);

        vi.advanceTimersByTime(4900);
        expect(alerts()).toHaveLength(1);
        vi.advanceTimersByTime(200);
        await expect.poll(alerts).toHaveLength(0);
      } finally {
        vi.useRealTimers();
      }
    });

    it('falls back to 3000 ms when life is unset', async () => {
      await render();
      // spec-timing: Optimus closes a message with its own setTimeout, so the spec advances it
      vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
      try {
        TestBed.inject(WjToastService).show({ summary: 'Default' });
        await expect.poll(alerts).toHaveLength(1);

        vi.advanceTimersByTime(2900);
        expect(alerts()).toHaveLength(1);
        vi.advanceTimersByTime(200);
        await expect.poll(alerts).toHaveLength(0);
      } finally {
        vi.useRealTimers();
      }
    });

    it('pt reaches the message parts as an object, next to the wrapper own attributes', async () => {
      await render((host) => {
        host.pt.set({
          root: { 'data-root': 'r' },
          message: { 'data-message': 'm' },
          summary: { 'data-summary': 's' },
          closeButton: { 'data-close': 'c' },
        });
      });
      await show({ severity: 'error', summary: 'One' }, { severity: 'info', summary: 'Two' });
      const [first, second] = alerts();

      expect(document.querySelector('p-toast')?.getAttribute('data-root')).toBe('r');
      for (const message of [first, second]) {
        expect(message?.getAttribute('data-message')).toBe('m');
        expect(message?.querySelector('[data-summary]')?.textContent.trim()).toMatch(/One|Two/);
        expect(message?.querySelector('button')?.getAttribute('data-close')).toBe('c');
      }
      expect(first?.getAttribute('data-wj-severity')).toBe('error');
      expect(second?.getAttribute('data-wj-severity')).toBe('info');
    });

    it('pt reaches the message parts as a function', async () => {
      await render((host) => {
        host.pt.set(() => ({
          root: { 'data-root': 'fn' },
          message: { 'data-message': 'fn' },
          closeButton: () => ({ 'data-close': 'fn' }),
        }));
      });
      await show({ severity: 'warn', summary: 'One' });
      const [message] = alerts();

      expect(document.querySelector('p-toast')?.getAttribute('data-root')).toBe('fn');
      expect(message?.getAttribute('data-message')).toBe('fn');
      expect(message?.querySelector('button')?.getAttribute('data-close')).toBe('fn');
      expect(message?.getAttribute('data-wj-severity')).toBe('warn');
    });

    it('a pt part function is called for each message, with that message in its context', async () => {
      await render((host) => {
        host.pt.set({ message: (context) => ({ 'data-for': messageSummaryOf(context) }) });
      });
      await show({ summary: 'One' }, { summary: 'Two' });

      expect(alerts().map((message) => message.getAttribute('data-for'))).toEqual(['One', 'Two']);
    });

    it('keeps the consumer message attributes when its function also sets the part', async () => {
      await render((host) => {
        host.pt.set(() => ({ message: () => ({ 'data-message': 'kept' }) }));
      });
      await show({ severity: 'success', summary: 'One' });

      const [message] = alerts();
      expect(message?.getAttribute('data-message')).toBe('kept');
      expect(message?.getAttribute('data-wj-severity')).toBe('success');
    });
  });

  describe('safety', () => {
    it('renders an HTML payload in summary and detail as text', async () => {
      const { element } = await render();
      await show({ severity: 'error', summary: PAYLOAD, detail: PAYLOAD });

      expect(element.querySelector('img, script')).toBeNull();
      expect(alerts()[0]?.textContent).toContain(PAYLOAD);
      expect(Reflect.get(window, 'wjInjected')).toBeUndefined();
    });

    it('puts nothing of a wider message on the page: icon, classes, id and data are dropped', async () => {
      await render();
      const wider = {
        severity: 'error',
        summary: 'Wider',
        icon: 'wj-spec-icon',
        styleClass: 'wj-spec-style',
        contentStyleClass: 'wj-spec-content',
        closeIcon: 'wj-spec-close-icon',
        id: 'wj-spec-id',
        data: { payload: PAYLOAD },
        // A key no host has: Optimus would not show a message that carried it.
        key: 'other',
        closable: false,
        life: STAY,
      } satisfies WjToastMessage & Record<string, unknown>;
      TestBed.inject(WjToastService).show(wider);
      await expect.poll(alerts).toHaveLength(1);
      const [message] = alerts();

      for (const name of [
        'wj-spec-icon',
        'wj-spec-style',
        'wj-spec-content',
        'wj-spec-close-icon',
      ]) {
        expect(document.querySelector(`.${name}`)).toBeNull();
      }
      expect(document.getElementById('wj-spec-id')).toBeNull();
      expect(message?.querySelector('svg[data-p-icon="times-circle"]')).not.toBeNull();
      expect(message?.querySelector('button')).not.toBeNull();
      expect(message?.innerHTML).not.toContain('<img');
    });
  });

  describe('setup and ARIA checks', () => {
    it('warns WJ0001 when provideWeeljack is missing', async () => {
      const fixture = TestBed.createComponent(RoutedHost);
      await fixture.whenStable();

      expect(warn).toHaveBeenCalledTimes(1);
      expect(warn).toHaveBeenCalledWith(
        'WJ0001: wj-toast: provideWeeljack() is missing from the application providers. ' +
          'Add provideWeeljack() to your application config. ' +
          'Find more at https://locvodever.github.io/weeljack-ng/errors/WJ0001',
      );
    });

    it('stays silent with provideWeeljack', async () => {
      await render();
      await show({ summary: 'Saved' });
      expect(warn).not.toHaveBeenCalled();
    });

    it('warns WJ0003 once when aria-* is written on the host', async () => {
      TestBed.configureTestingModule({ providers: [provideWeeljack()] });
      const fixture = TestBed.createComponent(AriaOnHostHost);
      await fixture.whenStable();

      expect(warn).toHaveBeenCalledTimes(1);
      expect(warn).toHaveBeenCalledWith(
        'WJ0003: wj-toast: aria-label is set on the host, where it is not forwarded to the ' +
          'focusable element. Use the ariaLabel, ariaLabelledBy or ariaDescribedBy input instead. ' +
          'Find more at https://locvodever.github.io/weeljack-ng/errors/WJ0003',
      );
    });
  });

  describe('focus and the close button (FR-32, FR-33)', () => {
    it('puts no autofocus on any close button', async () => {
      await render();
      await show(...SEVERITIES.map(([message]) => message));

      expect(closeButtons()).toHaveLength(4);
      for (const button of closeButtons()) {
        expect(button.hasAttribute('autofocus')).toBe(false);
      }
    });

    it('keeps no autofocus even when the consumer pt sets other close button attributes', async () => {
      await render((host) => {
        host.pt.set({ closeButton: { 'data-close': 'c' } });
      });
      await show({ summary: 'Saved' });

      expect(closeButtons()[0]?.getAttribute('data-close')).toBe('c');
      expect(closeButtons()[0]?.hasAttribute('autofocus')).toBe(false);
    });

    it('names the close button "Close" under provideWeeljack()', async () => {
      const { fixture } = await render();
      await show({ summary: 'Saved' });
      const [message] = await (await harnessOf(fixture)).getMessages();

      expect(await message?.getCloseLabel()).toBe('Close');
    });

    it('makes the close button at least 24 x 24 px', async () => {
      await render();
      await show({ summary: 'Saved' });
      const rect = closeButtons()[0]?.getBoundingClientRect();

      expect(rect?.width).toBeGreaterThanOrEqual(24);
      expect(rect?.height).toBeGreaterThanOrEqual(24);
    });

    it('announces each message as an assertive, atomic alert', async () => {
      await render();
      await show(...SEVERITIES.map(([message]) => message));

      for (const message of alerts()) {
        expect(message.getAttribute('role')).toBe('alert');
        expect(message.getAttribute('aria-live')).toBe('assertive');
        expect(message.getAttribute('aria-atomic')).toBe('true');
      }
    });
  });

  describe('reflow at 320px (FR-32)', () => {
    const LONG = 'Averyveryverylongwordthatcannotbreakanywhereunlessthemessagewrapsit '.repeat(4);

    it.each<WjToastPosition>(['top-right', 'top-center', 'bottom-left', 'center'])(
      'keeps a message inside a 320px viewport: %s',
      async (position) => {
        await page.viewport(320, 640);
        await render((host) => {
          host.position.set(position);
        });
        await show(
          { severity: 'error', summary: LONG, detail: LONG },
          { severity: 'info', summary: 'Short' },
        );

        for (const message of alerts()) {
          const rect = message.getBoundingClientRect();
          expect(rect.left).toBeGreaterThanOrEqual(0);
          expect(rect.right).toBeLessThanOrEqual(ROOT.clientWidth);
        }
        expect(ROOT.clientWidth).toBeLessThanOrEqual(320);
        // The close button stays on screen, whatever the text does.
        for (const button of closeButtons()) {
          expect(button.getBoundingClientRect().right).toBeLessThanOrEqual(ROOT.clientWidth);
        }
      },
    );

    it('stays 25rem wide when the viewport has room', async () => {
      await page.viewport(800, 600);
      const { element } = await render();
      await show({ summary: 'Saved' });

      expect(rootOf(element).getBoundingClientRect().width).toBe(400);
    });
  });

  describe('motion (FR-31)', () => {
    it('runs the enter and leave when the reader has no preference', async () => {
      reduceMotion(false);
      await render();
      const stop = recordMessageClasses();

      await show({ summary: 'Saved' });
      closeButtons()[0]?.click();
      await expect.poll(alerts, { timeout: 5000 }).toHaveLength(0);
      const classes = stop().join(' ');

      expect(classes).toContain('p-toast-message-enter-active');
      expect(classes).toContain('p-toast-message-leave-active');
    });

    it('runs neither the enter nor the leave under reduced motion', async () => {
      reduceMotion(true);
      await render();
      const stop = recordMessageClasses();

      await show({ summary: 'Saved' });
      closeButtons()[0]?.click();
      await expect.poll(alerts, { timeout: 5000 }).toHaveLength(0);

      expect(stop().join(' ')).not.toMatch(/-(enter|leave)-/);
    });

    it('keeps safe motion when the consumer pt.motion tries to switch it off', async () => {
      reduceMotion(true);
      await render((host) => {
        host.pt.set({ motion: { safe: false } });
      });
      const stop = recordMessageClasses();

      await show({ summary: 'Saved' });
      closeButtons()[0]?.click();
      await expect.poll(alerts, { timeout: 5000 }).toHaveLength(0);

      expect(stop().join(' ')).not.toMatch(/-(enter|leave)-/);
    });
  });

  describe('accessibility', () => {
    describe.each<Scheme>(['light', 'dark'])('%s', (scheme) => {
      beforeEach(() => {
        // Optimus injects its styles after the first render, and every colour then transitions for
        // 0.2s from the browser default. Measure the end state, not the animation. The messages
        // leave at once under the reduced motion these specs emulate, so this cannot stall a leave.
        const noMotion = document.createElement('style');
        noMotion.id = 'wj-spec-no-motion';
        noMotion.textContent = '*, *::before, *::after { transition: none !important; }';
        document.head.append(noMotion);
      });

      afterEach(() => {
        document.getElementById('wj-spec-no-motion')?.remove();
      });

      it.each(STATES)('has no axe violations: %s', async (_name, messages) => {
        const { element } = await render(undefined, scheme);
        await show(...messages);
        // A render without Optimus's styles would pass axe for the wrong reason: fail loudly.
        for (const message of alerts()) {
          expect(getComputedStyle(message).borderTopWidth).toBe('1px');
        }

        // The fixture's native Before/After buttons are not under test and fail `target-size`.
        await expectNoAxeViolations(hostOf(element));
      });
    });
  });

  describe('keyboard', () => {
    it('showing a message leaves focus where it was', async () => {
      await render();
      const before = find(document.body, '#before', HTMLElement);
      before.focus();

      await show({ severity: 'error', summary: 'Could not save' });
      expect(document.activeElement).toBe(before);

      await show({ severity: 'info', summary: 'Heads up' });
      expect(document.activeElement).toBe(before);
    });

    it('showing a message leaves focus on the page when nothing was focused', async () => {
      await render();
      expect(document.activeElement).toBe(document.body);

      await show({ severity: 'error', summary: 'Could not save' });
      expect(document.activeElement).toBe(document.body);
    });

    it('Tab reaches each close button in turn, then the next control, and Shift+Tab goes back', async () => {
      await render();
      await show({ summary: 'One' }, { summary: 'Two' });
      const [first, second] = closeButtons();
      find(document.body, '#before', HTMLElement).focus();

      await userEvent.tab();
      expect(document.activeElement).toBe(first);
      await userEvent.tab();
      expect(document.activeElement).toBe(second);
      await userEvent.tab();
      expect(document.activeElement).toBe(find(document.body, '#after', HTMLElement));
      await userEvent.tab({ shift: true });
      expect(document.activeElement).toBe(second);
    });

    it('Enter closes the focused message', async () => {
      await render();
      await show({ summary: 'One' }, { summary: 'Two' });
      closeButtons()[0]?.focus();

      await userEvent.keyboard('{Enter}');

      await expect.poll(alerts).toHaveLength(1);
      expect(alerts()[0]?.textContent).toContain('Two');
    });

    it('Space closes the focused message', async () => {
      await render();
      await show({ summary: 'One' }, { summary: 'Two' });
      closeButtons()[1]?.focus();

      await userEvent.keyboard(' ');

      await expect.poll(alerts).toHaveLength(1);
      expect(alerts()[0]?.textContent).toContain('One');
    });
  });

  describe('harness', () => {
    it('finds the open messages, and filters them by summary and severity', async () => {
      const { fixture } = await render();
      await show(
        { severity: 'success', summary: 'Saved', detail: 'All good.' },
        { severity: 'error', summary: 'Failed' },
        { severity: 'error', summary: 'Failed again' },
      );
      const toast = await harnessOf(fixture);

      expect(await toast.getMessages()).toHaveLength(3);
      expect(await toast.getMessages({ severity: 'error' })).toHaveLength(2);
      expect(await toast.getMessages({ summary: 'Saved' })).toHaveLength(1);
      expect(await toast.getMessages({ summary: /^Failed/, severity: 'error' })).toHaveLength(2);
      expect(await toast.getMessages({ summary: 'Saved', severity: 'error' })).toHaveLength(0);
    });

    it('reads a message and closes it', async () => {
      const { fixture } = await render();
      await show({ severity: 'warn', summary: 'Careful', detail: 'Look twice.' });
      const toast = await harnessOf(fixture);
      const [message] = await toast.getMessages();

      expect(await message?.getSeverity()).toBe('warn');
      expect(await message?.getSummary()).toBe('Careful');
      expect(await message?.getDetail()).toBe('Look twice.');
      expect(await message?.getCloseLabel()).toBe('Close');

      await message?.close();
      await expect.poll(alerts).toHaveLength(0);
      expect(await toast.getMessages()).toHaveLength(0);
    });

    it('reads an empty detail as an empty string', async () => {
      const { fixture } = await render();
      await show({ summary: 'No detail' });
      const [message] = await (await harnessOf(fixture)).getMessages();

      expect(await message?.getDetail()).toBe('');
    });
  });
});
