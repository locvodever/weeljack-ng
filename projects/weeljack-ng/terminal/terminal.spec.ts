import { LiveAnnouncer } from '@angular/cdk/a11y';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Component, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import type { MockInstance } from 'vitest';
import { userEvent } from 'vitest/browser';
import { provideWeeljack, type WjTranslation } from 'weeljack-ng';
import { vi as viLocale } from 'weeljack-ng/locale';
import { WjTerminal, WjTerminalService, type WjTerminalPt } from 'weeljack-ng/terminal';
import { WjTerminalHarness } from 'weeljack-ng/terminal/testing';
import { expectNoAxeViolations } from '../spec-support/axe';
import { WJ_TERMINAL } from './terminal-service';

const PAYLOAD = '<img src=x onerror="window.wjInjected = true">';
const ROOT = document.documentElement;
const DOCS = 'https://locvodever.github.io/weeljack-ng/errors';

/** A consumer's template: one terminal between two buttons, and the elements the ARIA inputs name. */
@Component({
  selector: 'wj-terminal-host',
  imports: [WjTerminal],
  template: `
    <button type="button" id="before">Before</button>
    @if (show()) {
      <wj-terminal
        [welcomeMessage]="welcomeMessage()"
        [prompt]="prompt()"
        [ariaLabel]="ariaLabel()"
        [ariaLabelledBy]="ariaLabelledBy()"
        [ariaDescribedBy]="ariaDescribedBy()"
        [pt]="pt()"
        (commandEntered)="entered($event)"
      />
    }
    <button type="button" id="after">After</button>
    <p id="name">A name</p>
    <p id="description">A description</p>
  `,
})
class Host {
  readonly show = signal(true);
  readonly welcomeMessage = signal<string | undefined>('Type help and press Enter.');
  readonly prompt = signal<string | undefined>('$');
  readonly ariaLabel = signal<string | undefined>(undefined);
  readonly ariaLabelledBy = signal<string | undefined>(undefined);
  readonly ariaDescribedBy = signal<string | undefined>(undefined);
  readonly pt = signal<WjTerminalPt>(undefined);
  readonly entered = vi.fn<(command: string) => void>();
}

/** A consumer who renders two terminals. */
@Component({
  selector: 'wj-terminal-two-host',
  imports: [WjTerminal],
  template: `<wj-terminal /><wj-terminal />`,
})
class TwoHost {}

/** A consumer who writes aria-* on the host. */
@Component({
  selector: 'wj-terminal-aria-on-host-host',
  imports: [WjTerminal],
  template: `<wj-terminal aria-label="Shell" />`,
})
class AriaOnHostHost {}

type Scheme = 'light' | 'dark';

interface Rendered {
  fixture: ComponentFixture<Host>;
  component: Host;
  element: HTMLElement;
  terminal: WjTerminalHarness;
  service: WjTerminalService;
  /** The announcer's `announce`, replaced so no real live region or timer runs. */
  announce: MockInstance<LiveAnnouncer['announce']>;
}

/** Renders `Host` with `provideWeeljack` in the given scheme, after `setup` ran. */
async function render(
  setup: (host: Host) => void = () => undefined,
  scheme: Scheme = 'light',
  translation?: WjTranslation,
): Promise<Rendered> {
  ROOT.classList.toggle('wj-dark', scheme === 'dark');
  document.body.style.backgroundColor = 'var(--wj-content-background)';
  TestBed.configureTestingModule({
    providers: [
      provideWeeljack(translation ? { darkMode: 'class', translation } : { darkMode: 'class' }),
    ],
  });
  const announce = vi
    .spyOn(TestBed.inject(LiveAnnouncer), 'announce')
    .mockImplementation(() => Promise.resolve());
  const fixture = TestBed.createComponent(Host);
  setup(fixture.componentInstance);
  await fixture.whenStable();
  return {
    fixture,
    component: fixture.componentInstance,
    element: fixture.nativeElement as HTMLElement,
    terminal: await TestbedHarnessEnvironment.loader(fixture).getHarness(WjTerminalHarness),
    service: TestBed.inject(WjTerminalService),
    announce,
  };
}

function find(selector: string): HTMLElement {
  const found = document.querySelector<HTMLElement>(selector);
  if (!found) {
    throw new Error(`${selector} is missing`);
  }
  return found;
}

function input(): HTMLInputElement {
  const found = find('wj-terminal input');
  if (!(found instanceof HTMLInputElement)) {
    throw new Error('the command input is not an input');
  }
  return found;
}

const box = (): HTMLElement => find('wj-terminal p-terminal');
const all = (selector: string): HTMLElement[] =>
  Array.from(document.querySelectorAll<HTMLElement>(selector));
const texts = (selector: string): (string | null)[] => all(selector).map((e) => e.textContent);
const attributes = (selector: string, name: string): (string | null)[] =>
  all(selector).map((e) => e.getAttribute(name));

/** Reaches the input the way a reader does: by Tab, which is what makes `:focus-within` draw. */
async function tabToInput(): Promise<void> {
  find('#before').focus();
  await userEvent.tab();
  await expect.poll(() => document.activeElement).toBe(input());
}

describe('WjTerminal', () => {
  let warn: MockInstance<typeof console.warn>;

  beforeEach(() => {
    warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    ROOT.classList.remove('wj-dark');
    document.body.style.backgroundColor = '';
    document.head.querySelectorAll('style[data-optimus-style-id]').forEach((style) => {
      style.remove();
    });
    Reflect.deleteProperty(window, 'wjInjected');
  });

  describe('inputs and output', () => {
    it('shows the welcome message and the prompt as text, above and before the input', async () => {
      const { terminal } = await render();

      expect(await terminal.getWelcomeMessage()).toBe('Type help and press Enter.');
      expect(await terminal.getPrompt()).toBe('$');
      expect(await terminal.getEntries()).toEqual([]);
    });

    it('shows no welcome message when none is set', async () => {
      const { terminal } = await render((host) => {
        host.welcomeMessage.set(undefined);
      });

      expect(await terminal.getWelcomeMessage()).toBe('');
      expect(all('.p-terminal-welcome-message')).toHaveLength(0);
    });

    it('emits commandEntered with the typed text, once, and clears the input', async () => {
      const { terminal, component } = await render();

      await terminal.enterCommand('help');

      expect(component.entered).toHaveBeenCalledTimes(1);
      expect(component.entered).toHaveBeenCalledWith('help');
      expect(input().value).toBe('');
      expect(await terminal.getEntries()).toEqual([{ command: 'help', response: '' }]);
    });

    it('emits nothing for an empty command', async () => {
      const { terminal, component } = await render();

      await terminal.enterCommand('');

      expect(component.entered).not.toHaveBeenCalled();
    });

    it('routes the three ARIA inputs to the input, not the host', async () => {
      const { element } = await render((host) => {
        host.ariaLabel.set('Shell');
        host.ariaLabelledBy.set('name');
        host.ariaDescribedBy.set('description');
      });

      expect(input().getAttribute('aria-label')).toBe('Shell');
      expect(input().getAttribute('aria-labelledby')).toBe('name');
      expect(input().getAttribute('aria-describedby')).toBe('description');
      const host = element.querySelector('wj-terminal');
      for (const name of ['aria-label', 'aria-labelledby', 'aria-describedby']) {
        expect(host?.hasAttribute(name)).toBe(false);
      }
    });

    it('reads the name of a labelledby input from the element it points at', async () => {
      const { terminal } = await render((host) => {
        host.ariaLabelledBy.set('name');
      });

      expect(await terminal.getInputLabel()).toBe('A name');
    });
  });

  describe('the input name (FR-39)', () => {
    it('is "Command" under provideWeeljack()', async () => {
      const { terminal } = await render();

      expect(await terminal.getInputLabel()).toBe('Command');
      expect(input().getAttribute('aria-label')).toBe('Command');
    });

    it('follows the real vi locale', async () => {
      const { terminal } = await render(undefined, 'light', viLocale);

      expect(viLocale.wj?.terminalCommand).toBe('Lệnh');
      expect(await terminal.getInputLabel()).toBe('Lệnh');
    });

    it('follows an app translation of its own', async () => {
      const { terminal } = await render(undefined, 'light', { wj: { terminalCommand: 'Shell' } });

      expect(await terminal.getInputLabel()).toBe('Shell');
    });

    it('prefers ariaLabel to the translation', async () => {
      const { terminal } = await render((host) => {
        host.ariaLabel.set('Admin shell');
      });

      expect(await terminal.getInputLabel()).toBe('Admin shell');
    });
  });

  describe('the response path (FR-40)', () => {
    it('renders and announces a synchronous answer, once', async () => {
      const { terminal, component, service, announce } = await render();
      component.entered.mockImplementation(() => {
        service.respond('Commands: date, help.');
      });

      await terminal.enterCommand('help');

      await expect
        .poll(() => terminal.getEntries())
        .toEqual([{ command: 'help', response: 'Commands: date, help.' }]);
      expect(announce).toHaveBeenCalledTimes(1);
      expect(announce).toHaveBeenCalledWith('Commands: date, help.', 'polite');
    });

    it('renders an answer sent after an await, with no other trigger, and announces it once', async () => {
      const { terminal, component, service, announce, fixture } = await render();
      let release: () => void = () => undefined;
      const gate = new Promise<void>((resolve) => {
        release = resolve;
      });
      component.entered.mockImplementation(() => {
        void gate.then(() => {
          service.respond('Late answer');
        });
      });

      await terminal.enterCommand('slow');
      // The command is on screen and nothing is answered yet: the answer arrives after this poll.
      await expect.poll(() => texts('[data-wj-command-value]')).toEqual(['slow']);
      expect(texts('[data-wj-response]')).toEqual(['']);
      expect(announce).not.toHaveBeenCalled();
      // Let every change detection the command itself scheduled finish, so only the answer is left.
      await fixture.whenStable();

      release();

      // Read the DOM directly: a harness call would run change detection and hide a missing mark.
      await expect
        .poll(() => texts('[data-wj-response]'), { timeout: 5000 })
        .toEqual(['Late answer']);
      expect(announce).toHaveBeenCalledTimes(1);
      expect(announce).toHaveBeenCalledWith('Late answer', 'polite');
    });

    it('announces the same text twice, once per response', async () => {
      const { terminal, component, service, announce } = await render();
      component.entered.mockImplementation(() => {
        service.respond('Done');
      });

      await terminal.enterCommand('one');
      await terminal.enterCommand('two');

      await expect
        .poll(() => terminal.getEntries())
        .toEqual([
          { command: 'one', response: 'Done' },
          { command: 'two', response: 'Done' },
        ]);
      expect(announce).toHaveBeenCalledTimes(2);
      expect(announce).toHaveBeenNthCalledWith(1, 'Done', 'polite');
      expect(announce).toHaveBeenNthCalledWith(2, 'Done', 'polite');
    });

    it('puts no aria-live on a response, or anywhere in the terminal', async () => {
      const { terminal, component, service } = await render();
      component.entered.mockImplementation(() => {
        service.respond('Answer');
      });
      await terminal.enterCommand('go');
      await expect.poll(() => all('[data-wj-response]')).toHaveLength(1);

      expect(all('[data-wj-response]')[0]?.hasAttribute('aria-live')).toBe(false);
      expect(document.querySelector('wj-terminal [aria-live]')).toBeNull();
    });

    it('replaces the latest command response with a later one', async () => {
      const { terminal, component, service } = await render();
      component.entered.mockImplementation(() => {
        service.respond('First');
      });
      await terminal.enterCommand('go');
      await expect
        .poll(() => terminal.getEntries())
        .toEqual([{ command: 'go', response: 'First' }]);

      service.respond('Second');

      await expect
        .poll(() => terminal.getEntries())
        .toEqual([{ command: 'go', response: 'Second' }]);
    });

    it('ignores an empty response, silently', async () => {
      const { terminal, service, announce } = await render();
      await terminal.enterCommand('go');

      service.respond('');

      expect(await terminal.getEntries()).toEqual([{ command: 'go', response: '' }]);
      expect(announce).not.toHaveBeenCalled();
      expect(warn).not.toHaveBeenCalled();
    });

    it('scrolls the newest response into view at once', async () => {
      const { terminal, component, service } = await render();
      component.entered.mockImplementation(() => {
        service.respond('A response');
      });
      for (let n = 0; n < 20; n++) {
        await terminal.enterCommand(`command ${String(n)}`);
      }

      await expect.poll(() => box().scrollTop).toBeGreaterThan(0);
      const last = all('[data-wj-response]').at(-1)?.getBoundingClientRect();
      const frame = box().getBoundingClientRect();
      expect(last?.bottom).toBeLessThanOrEqual(frame.bottom);
    });
  });

  describe('WJ0180 and WJ0181 (FR-40)', () => {
    const WJ0180 =
      `WJ0180: wj-terminal: respond() was called with no command waiting for a response, so it ` +
      `was dropped. Call respond() after the reader enters a command (commandEntered). ` +
      `Find more at ${DOCS}/WJ0180`;
    const WJ0181 =
      `WJ0181: wj-terminal: a second wj-terminal is rendered, and every wj-terminal shares ` +
      `WjTerminalService. Render one wj-terminal at a time. Find more at ${DOCS}/WJ0181`;

    it('drops a response with no command waiting, warns once, and never reaches Optimus', async () => {
      const { terminal, service } = await render();
      const optimus = vi.spyOn(TestBed.inject(WJ_TERMINAL), 'sendResponse');

      expect(() => {
        service.respond('Too early');
        service.respond('Too early again');
      }).not.toThrow();

      expect(optimus).not.toHaveBeenCalled();
      expect(await terminal.getEntries()).toEqual([]);
      expect(warn).toHaveBeenCalledTimes(1);
      expect(warn).toHaveBeenCalledWith(WJ0180);
    });

    it('drops a response when no wj-terminal is rendered', () => {
      TestBed.configureTestingModule({ providers: [provideWeeljack()] });
      const optimus = vi.spyOn(TestBed.inject(WJ_TERMINAL), 'sendResponse');

      TestBed.inject(WjTerminalService).respond('Nobody home');

      expect(optimus).not.toHaveBeenCalled();
      expect(warn).toHaveBeenCalledWith(WJ0180);
    });

    it('forwards a response once a command has been entered', async () => {
      const { terminal, service } = await render();
      const optimus = vi.spyOn(TestBed.inject(WJ_TERMINAL), 'sendResponse');
      await terminal.enterCommand('go');

      service.respond('Answer');

      expect(optimus).toHaveBeenCalledWith('Answer');
      expect(warn).not.toHaveBeenCalled();
    });

    it('drops a response again after the terminal is destroyed, and for a new one with no command', async () => {
      const { terminal, component, fixture, service } = await render();
      await terminal.enterCommand('go');

      component.show.set(false);
      await fixture.whenStable();
      service.respond('After destroy');
      expect(warn).toHaveBeenCalledTimes(1);
      expect(warn).toHaveBeenCalledWith(WJ0180);

      component.show.set(true);
      await fixture.whenStable();
      const optimus = vi.spyOn(TestBed.inject(WJ_TERMINAL), 'sendResponse');
      service.respond('Before any command');
      expect(optimus).not.toHaveBeenCalled();
      expect(warn).not.toHaveBeenCalledWith(WJ0181);
    });

    it('warns WJ0181 once when a second terminal is rendered', async () => {
      TestBed.configureTestingModule({ providers: [provideWeeljack()] });
      const fixture = TestBed.createComponent(TwoHost);
      await fixture.whenStable();

      expect(warn).toHaveBeenCalledTimes(1);
      expect(warn).toHaveBeenCalledWith(WJ0181);
    });

    it('does not warn WJ0181 for one terminal, rendered again after it was destroyed', async () => {
      const { component, fixture } = await render();

      component.show.set(false);
      await fixture.whenStable();
      component.show.set(true);
      await fixture.whenStable();

      expect(warn).not.toHaveBeenCalled();
    });
  });

  describe('focus (FR-39, FR-41)', () => {
    it('leaves focus where it was when it renders, with no autofocus on the input', async () => {
      const { fixture, component } = await render();
      component.show.set(false);
      await fixture.whenStable();
      find('#before').focus();
      expect(document.activeElement).toBe(find('#before'));

      component.show.set(true);
      await fixture.whenStable();

      expect(input().hasAttribute('autofocus')).toBe(false);
      expect(document.activeElement).toBe(find('#before'));
    });

    it('is reached by one Tab and left by Shift+Tab, with no trap', async () => {
      await render();
      await tabToInput();

      await userEvent.tab({ shift: true });
      await expect.poll(() => document.activeElement).toBe(find('#before'));

      await userEvent.tab();
      await userEvent.tab();
      await expect.poll(() => document.activeElement).toBe(find('#after'));
    });

    it('takes typed text and Enter: emits, clears, and keeps focus in the input', async () => {
      const { component } = await render();
      await tabToInput();

      await userEvent.keyboard('date{Enter}');

      expect(component.entered).toHaveBeenCalledTimes(1);
      expect(component.entered).toHaveBeenCalledWith('date');
      expect(input().value).toBe('');
      expect(document.activeElement).toBe(input());
    });

    it('focuses the input on a click anywhere in the terminal', async () => {
      await render();
      find('#before').focus();

      await userEvent.click(find('.p-terminal-welcome-message'));

      await expect.poll(() => document.activeElement).toBe(input());
    });

    it('draws the preset focus ring around the whole box while the input holds focus', async () => {
      await render();
      const probe = document.createElement('span');
      probe.style.color = 'var(--wj-focus-ring-color)';
      document.body.append(probe);
      const ringColor = getComputedStyle(probe).color;
      probe.remove();
      expect(getComputedStyle(box()).outlineStyle).toBe('none');

      await tabToInput();

      const ring = getComputedStyle(box());
      expect(ring.outlineStyle).toBe('solid');
      expect(ring.outlineWidth).toBe('2px');
      expect(ring.outlineOffset).toBe('2px');
      expect(ring.outlineColor).toBe(ringColor);

      await userEvent.tab({ shift: true });
      await expect.poll(() => getComputedStyle(box()).outlineStyle).toBe('none');
    });

    it('is at least 24 px tall, across the width of the box', async () => {
      await render();
      const rect = input().getBoundingClientRect();

      expect(rect.height).toBeGreaterThanOrEqual(24);
      expect(rect.height).toBe(24);
      expect(rect.width).toBeGreaterThan(100);
    });

    it('sets the host and the prompt input in a monospace stack', async () => {
      await render();

      expect(getComputedStyle(find('wj-terminal')).fontFamily).toMatch(/^ui-monospace, /);
      expect(getComputedStyle(input()).fontFamily).toMatch(/^ui-monospace, /);
    });

    it('lets an app set its own font on the host', async () => {
      await render();
      const host = find('wj-terminal');
      host.style.fontFamily = 'Georgia, serif';

      expect(getComputedStyle(input()).fontFamily).toBe('Georgia, serif');
    });

    it('wraps a long unbroken word instead of scrolling sideways', async () => {
      const { terminal, component, service } = await render();
      component.entered.mockImplementation((command) => {
        service.respond(command);
      });
      await terminal.enterCommand('x'.repeat(400));

      await expect.poll(() => texts('[data-wj-response]')).toEqual(['x'.repeat(400)]);
      expect(box().scrollWidth).toBeLessThanOrEqual(box().clientWidth);
    });
  });

  describe('pass-through (FR-4)', () => {
    /** The hooks and the routed attributes after a state change: the per-command parts included. */
    async function expectHooks(): Promise<void> {
      await expect.poll(() => all('.p-terminal-command')).toHaveLength(2);
      for (const command of all('.p-terminal-command')) {
        expect(command.hasAttribute('data-wj-command')).toBe(true);
      }
      for (const value of all('.p-terminal-command-value')) {
        expect(value.hasAttribute('data-wj-command-value')).toBe(true);
      }
      for (const response of all('.p-terminal-command-response')) {
        expect(response.hasAttribute('data-wj-response')).toBe(true);
        expect(response.hasAttribute('aria-live')).toBe(false);
      }
      expect(input().getAttribute('aria-label')).toBe('Command');
    }

    it('lands the hooks on every per-command part, as commands are added', async () => {
      const { terminal } = await render();

      await terminal.enterCommand('one');
      await terminal.enterCommand('two');

      await expectHooks();
    });

    it('stamps the welcome and prompt hooks once each, on the parts that hold the text', async () => {
      const { terminal, component, fixture } = await render();
      await terminal.enterCommand('one');
      await terminal.enterCommand('two');

      expect(all('[data-wj-welcome]')).toHaveLength(1);
      expect(all('[data-wj-welcome]')[0]?.classList.contains('p-terminal-welcome-message')).toBe(
        true,
      );
      // The prompt row holds the live prompt and the input; the per-command labels carry no hook.
      expect(all('[data-wj-prompt]')).toHaveLength(1);
      expect(all('[data-wj-prompt]')[0]?.contains(input())).toBe(true);
      expect(all('[data-wj-prompt]')[0]?.textContent.trim()).toBe('$');

      component.pt.set(() => ({ welcomeMessage: { 'data-consumer': 'welcome' } }));
      component.prompt.set('>');
      await fixture.whenStable();

      await expect.poll(() => terminal.getPrompt()).toBe('>');
      expect(attributes('[data-wj-welcome]', 'data-consumer')).toEqual(['welcome']);
      expect(await terminal.getWelcomeMessage()).toBe('Type help and press Enter.');
    });

    it('lands an object pt on every per-command part, keeping the hooks', async () => {
      const { terminal, component, fixture } = await render();
      await terminal.enterCommand('one');
      await terminal.enterCommand('two');

      component.pt.set({
        command: { 'data-consumer': 'command' },
        commandValue: { 'data-consumer': 'value' },
        commandResponse: { 'data-consumer': 'response' },
        promptValue: { 'data-consumer': 'input', 'aria-label': 'Mine' },
      });
      await fixture.whenStable();

      await expect
        .poll(() => attributes('[data-consumer]', 'data-consumer'))
        .toEqual(['command', 'value', 'response', 'command', 'value', 'response', 'input']);
      await expectHooks();
      // A routed attribute wins over the consumer's on the same name.
      expect(input().getAttribute('aria-label')).toBe('Command');
    });

    it('lands a function pt on every per-command part, keeping the hooks', async () => {
      const { terminal, component, fixture } = await render();
      await terminal.enterCommand('one');
      await terminal.enterCommand('two');

      component.pt.set(() => ({
        command: { 'data-consumer': 'command' },
        commandValue: { 'data-consumer': 'value' },
        commandResponse: { 'data-consumer': 'response' },
      }));
      await fixture.whenStable();

      await expect
        .poll(() => attributes('[data-consumer]', 'data-consumer'))
        .toEqual(['command', 'value', 'response', 'command', 'value', 'response']);
      await expectHooks();
    });

    it('keeps a consumer pt and the hooks on a command entered after the pt was set', async () => {
      const { terminal, component, fixture } = await render();
      component.pt.set({ commandValue: { 'data-consumer': 'value' } });
      await fixture.whenStable();

      await terminal.enterCommand('late');

      await expect
        .poll(() => attributes('.p-terminal-command-value', 'data-consumer'))
        .toEqual(['value']);
      expect(all('.p-terminal-command-value')[0]?.hasAttribute('data-wj-command-value')).toBe(true);
    });
  });

  describe('rendering safety (FR-42)', () => {
    it('renders every string as text and sets no attribute from it', async () => {
      const { terminal, component, service } = await render((host) => {
        host.welcomeMessage.set(PAYLOAD);
        host.prompt.set(PAYLOAD);
        host.ariaLabel.set(PAYLOAD);
        host.ariaLabelledBy.set(PAYLOAD);
        host.ariaDescribedBy.set(PAYLOAD);
      });
      component.entered.mockImplementation(() => {
        service.respond(PAYLOAD);
      });

      await terminal.enterCommand(PAYLOAD);

      await expect
        .poll(() => terminal.getEntries())
        .toEqual([{ command: PAYLOAD, response: PAYLOAD }]);
      expect(await terminal.getWelcomeMessage()).toBe(PAYLOAD);
      expect(await terminal.getPrompt()).toBe(PAYLOAD);
      expect(document.querySelector('wj-terminal img')).toBeNull();
      expect(Reflect.get(window, 'wjInjected')).toBeUndefined();
      expect(input().getAttribute('aria-label')).toBe(PAYLOAD);
      expect(input().getAttribute('aria-labelledby')).toBe(PAYLOAD);
      expect(input().getAttribute('aria-describedby')).toBe(PAYLOAD);
    });
  });

  describe('the service pattern (FR-37, FR-43)', () => {
    it('injects with only provideWeeljack() provided, and is one instance', () => {
      TestBed.configureTestingModule({ providers: [provideWeeljack()] });
      const service = TestBed.inject(WjTerminalService);

      expect(service).toBeInstanceOf(WjTerminalService);
      expect(TestBed.inject(WjTerminalService)).toBe(service);
    });

    it('reaches a rendered host through respond()', async () => {
      const { terminal, service } = await render();
      await terminal.enterCommand('go');

      service.respond('Reached');

      await expect
        .poll(() => terminal.getEntries())
        .toEqual([{ command: 'go', response: 'Reached' }]);
    });

    it('lets an app spy on respond() as it would on its own service', async () => {
      const { terminal, component, service } = await render();
      const respond = vi.spyOn(service, 'respond');
      component.entered.mockImplementation((command) => {
        service.respond(`You said ${command}`);
      });

      await terminal.enterCommand('hi');

      expect(respond).toHaveBeenCalledTimes(1);
      expect(respond).toHaveBeenCalledWith('You said hi');
    });

    it('gives a second TestBed a fresh service and a fresh token instance', () => {
      TestBed.configureTestingModule({ providers: [provideWeeljack()] });
      const service = TestBed.inject(WjTerminalService);
      const token = TestBed.inject(WJ_TERMINAL);

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({ providers: [provideWeeljack()] });

      expect(TestBed.inject(WjTerminalService)).not.toBe(service);
      expect(TestBed.inject(WJ_TERMINAL)).not.toBe(token);
    });
  });

  describe('accessibility (FR-41)', () => {
    it.each<Scheme>(['light', 'dark'])('has no axe violations, %s', async (scheme) => {
      const { terminal, component, element, service } = await render(undefined, scheme);
      // With a welcome message and no commands.
      await expectNoAxeViolations(element);

      // After two commands with responses.
      component.entered.mockImplementation((command) => {
        service.respond(`Answer to ${command}`);
      });
      await terminal.enterCommand('one');
      await terminal.enterCommand('two');
      await expect.poll(() => all('[data-wj-response]')).toHaveLength(2);
      await expectNoAxeViolations(element);

      // With the input focused: the ring.
      await tabToInput();
      await expectNoAxeViolations(element);
    });
  });

  describe('dev warnings', () => {
    it('warns WJ0003 once when aria-* is written on the host', async () => {
      TestBed.configureTestingModule({ providers: [provideWeeljack()] });
      const fixture = TestBed.createComponent(AriaOnHostHost);
      await fixture.whenStable();

      expect(warn).toHaveBeenCalledTimes(1);
      expect(warn).toHaveBeenCalledWith(
        'WJ0003: wj-terminal: aria-label is set on the host, where it is not forwarded to the ' +
          'focusable element. Use the ariaLabel, ariaLabelledBy or ariaDescribedBy input instead. ' +
          `Find more at ${DOCS}/WJ0003`,
      );
    });

    it('stays silent with provideWeeljack and no aria-* on the host', async () => {
      await render();

      expect(warn).not.toHaveBeenCalled();
    });
  });
});
