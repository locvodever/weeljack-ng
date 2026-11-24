import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Component, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import type { MockInstance } from 'vitest';
import { userEvent } from 'vitest/browser';
import { provideWeeljack } from 'weeljack-ng';
import {
  WjMessage,
  type WjMessagePt,
  type WjMessageSeverity,
  type WjMessageSize,
  type WjMessageVariant,
} from 'weeljack-ng/message';
import { WjMessageHarness } from 'weeljack-ng/message/testing';
import { expectNoAxeViolations } from '../spec-support/axe';

const PAYLOAD = '<img src=x onerror="window.wjInjected = true">';
const ROOT = document.documentElement;
const CLEAR = 'rgba(0, 0, 0, 0)';
const SEVERITIES: WjMessageSeverity[] = [
  'success',
  'info',
  'warn',
  'error',
  'secondary',
  'contrast',
];
const ALERTS: WjMessageSeverity[] = ['error', 'warn'];

/** A consumer's template: one message between two buttons, closed by the app through `closed`. */
@Component({
  selector: 'wj-message-host',
  imports: [WjMessage],
  template: `
    <button type="button" id="before">Before</button>
    <div id="box" [style.inline-size]="width()">
      @if (shown()) {
        <wj-message
          [severity]="severity()"
          [closable]="closable()"
          [size]="size()"
          [variant]="variant()"
          [pt]="pt()"
          (closed)="onClosed()"
          >{{ text() }}</wj-message
        >
      }
    </div>
    <button type="button" id="after">After</button>
  `,
})
class Host {
  readonly severity = signal<WjMessageSeverity>('info');
  readonly closable = signal(false);
  readonly size = signal<WjMessageSize | undefined>(undefined);
  readonly variant = signal<WjMessageVariant | undefined>(undefined);
  readonly pt = signal<WjMessagePt>(undefined);
  readonly text = signal('Saved. Your changes are stored.');
  readonly width = signal<string | undefined>(undefined);
  readonly shown = signal(true);
  readonly removeOnClose = signal(false);
  readonly closes = signal(0);

  protected onClosed(): void {
    this.closes.update((count) => count + 1);
    if (this.removeOnClose()) {
      this.shown.set(false);
    }
  }
}

/** Every severity, size and fill side by side, so one render measures them all. */
@Component({
  selector: 'wj-message-gallery-host',
  imports: [WjMessage],
  template: `
    <wj-message>Default</wj-message>
    <wj-message severity="info">Info</wj-message>
    <wj-message severity="success">Success</wj-message>
    <wj-message severity="warn">Warn</wj-message>
    <wj-message severity="error">Error</wj-message>
    <wj-message severity="secondary">Secondary</wj-message>
    <wj-message severity="contrast">Contrast</wj-message>
    <wj-message size="small" closable>Small</wj-message>
    <wj-message closable>Medium</wj-message>
    <wj-message size="large" closable>Large</wj-message>
    <wj-message variant="outlined">Outlined</wj-message>
    <wj-message variant="simple">Simple</wj-message>
  `,
})
class GalleryHost {}

/** A consumer who writes `aria-label` on the host. */
@Component({
  selector: 'wj-message-aria-host',
  imports: [WjMessage],
  template: `<wj-message aria-label="Saved">Saved.</wj-message>`,
})
class AriaOnHostHost {}

/** A consumer who uses nothing of the host's ARIA. */
@Component({
  selector: 'wj-message-plain-host',
  imports: [WjMessage],
  template: `<wj-message severity="error">Upload failed.</wj-message>`,
})
class PlainHost {}

type Scheme = 'light' | 'dark';

interface Rendered {
  fixture: ComponentFixture<Host>;
  host: Host;
  message: WjMessageHarness;
  element: HTMLElement;
}

/** Renders the host with `provideWeeljack`, in the given colour scheme, after `setup` ran. */
async function render(
  scheme: Scheme = 'light',
  setup: (host: Host) => void = () => undefined,
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
  const element = fixture.nativeElement as HTMLElement;
  const message = await TestbedHarnessEnvironment.loader(fixture).getHarness(WjMessageHarness);
  // A render without Optimus's styles would pass axe for the wrong reason: fail loudly instead.
  expect(getComputedStyle(parts(element).root).borderTopLeftRadius).toBe('12px');
  await enterSettled(element);
  return { fixture, host: fixture.componentInstance, message, element };
}

/** Waits until Optimus's 0.3 s enter has finished, so a colour is read at its end state. */
async function enterSettled(element: HTMLElement): Promise<void> {
  await expect
    .poll(
      () =>
        element
          .getAnimations({ subtree: true })
          .filter((animation) => animation.playState === 'running').length,
    )
    .toBe(0);
}

function find<E extends Element>(element: ParentNode, selector: string, type: new () => E): E {
  const found = element.querySelector(selector);
  if (!(found instanceof type)) {
    throw new Error(`${selector} is missing`);
  }
  return found;
}

/** The `wj-message` host, Optimus's element inside it, and the parts the spec measures. */
function parts(element: ParentNode): {
  host: HTMLElement;
  root: HTMLElement;
  content: HTMLElement;
  text: HTMLElement;
  close: HTMLButtonElement;
} {
  const host =
    element instanceof HTMLElement && element.matches('wj-message')
      ? element
      : find(element, 'wj-message', HTMLElement);
  return {
    host,
    root: find(host, 'p-message', HTMLElement),
    content: find(host, '.p-message-content', HTMLElement),
    text: find(host, '.p-message-text', HTMLElement),
    /** Only a closable message has one: read it when it is there. */
    get close(): HTMLButtonElement {
      return find(host, 'button', HTMLButtonElement);
    },
  };
}

/** The `wj-message` whose text is `text` in the gallery. */
function messageNamed(element: ParentNode, text: string): HTMLElement {
  const found = Array.from(element.querySelectorAll<HTMLElement>('wj-message')).find(
    (message) => message.textContent.trim() === text,
  );
  if (!found) {
    throw new Error(`no wj-message says ${text}`);
  }
  return found;
}

function byId(element: HTMLElement, id: string): HTMLElement {
  return find(element, `#${id}`, HTMLElement);
}

const attributeOf = (element: HTMLElement, name: string): string | null =>
  find(element, 'p-message', HTMLElement).getAttribute(name);

/** The style rules inside a media block whose condition holds `media`, in every sheet. */
function mediaStyleRules(media: string): CSSStyleRule[] {
  const found: CSSStyleRule[] = [];
  const walk = (rules: CSSRuleList, inMedia: boolean): void => {
    for (const rule of Array.from(rules)) {
      if (rule instanceof CSSStyleRule && inMedia) {
        found.push(rule);
      }
      if (rule instanceof CSSGroupingRule) {
        walk(
          rule.cssRules,
          inMedia || (rule instanceof CSSMediaRule && rule.conditionText.includes(media)),
        );
      }
    }
  };
  for (const sheet of Array.from(document.styleSheets)) {
    walk(sheet.cssRules, false);
  }
  return found;
}

/** The layer name chain of the first style rule whose selector starts with `selector`, or `null`. */
function layerOfRule(selector: string): string[] | null {
  let layers: string[] | null = null;
  const walk = (rules: CSSRuleList, chain: string[]): void => {
    for (const rule of Array.from(rules)) {
      if (
        rule instanceof CSSStyleRule &&
        rule.selectorText.startsWith(selector) &&
        layers === null
      ) {
        layers = chain;
      }
      if (rule instanceof CSSGroupingRule) {
        walk(rule.cssRules, rule instanceof CSSLayerBlockRule ? [...chain, rule.name] : chain);
      }
    }
  };
  for (const sheet of Array.from(document.styleSheets)) {
    walk(sheet.cssRules, []);
  }
  return layers;
}

/** The wrapper's reduced-motion rule, as written in `message.css`. */
function reducedMotionRule(): CSSStyleRule {
  const rule = mediaStyleRules('prefers-reduced-motion').find((candidate) =>
    candidate.selectorText.startsWith('p-message'),
  );
  if (!rule) {
    throw new Error('the message reduced-motion rule is missing');
  }
  return rule;
}

/**
 * Applies the reduced-motion rule the way a reader who asks for it gets it: lifted out of its media
 * block, into the same `wj` layer, and placed *before* every other style (Optimus's own message
 * style is appended later), so only selector specificity can decide the cascade. A CDP media
 * emulation would change the whole shared browser page and leak into other spec files.
 */
function applyReducedMotion(): void {
  const style = document.createElement('style');
  style.setAttribute('data-wj-spec', 'reduced-motion');
  style.textContent = `@layer wj { ${reducedMotionRule().cssText} }`;
  document.head.prepend(style);
}

/** The documented states, every one closable except the plain default. */
const STATES: [string, (host: Host) => void][] = [
  ['default', () => undefined],
  ...SEVERITIES.map((severity): [string, (host: Host) => void] => [
    `severity ${severity}, closable`,
    (host) => {
      host.severity.set(severity);
      host.closable.set(true);
    },
  ]),
  [
    'outlined, closable',
    (host) => {
      host.variant.set('outlined');
      host.closable.set(true);
    },
  ],
  [
    'simple, closable',
    (host) => {
      host.variant.set('simple');
      host.closable.set(true);
    },
  ],
  [
    'small, closable',
    (host) => {
      host.size.set('small');
      host.closable.set(true);
    },
  ],
  [
    'large, closable',
    (host) => {
      host.size.set('large');
      host.closable.set(true);
    },
  ],
  [
    'long text in a narrow column',
    (host) => {
      host.text.set(`Upload failed. ${'https://example.com/a/very/long/path/'.repeat(4)}`);
      host.closable.set(true);
      host.width.set('320px');
    },
  ],
];

describe('WjMessage', () => {
  let warn: MockInstance<typeof console.warn>;

  beforeEach(() => {
    // Optimus injects its styles after the first render, and every colour then transitions for
    // 0.2s from the browser default. Measure the end state, not the animation.
    const noTransition = document.createElement('style');
    noTransition.id = 'wj-spec-no-transition';
    noTransition.textContent = '*, *::before, *::after { transition: none !important; }';
    document.head.append(noTransition);
    warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    document.getElementById('wj-spec-no-transition')?.remove();
    document.head.querySelectorAll('style[data-wj-spec]').forEach((style) => {
      style.remove();
    });
    ROOT.classList.remove('wj-dark');
    document.body.style.backgroundColor = '';
    document.head.querySelectorAll('style[data-optimus-style-id]').forEach((style) => {
      style.remove();
    });
    Reflect.deleteProperty(window, 'wjInjected');
  });

  describe('in the gallery', () => {
    let element: HTMLElement;

    beforeEach(async () => {
      TestBed.configureTestingModule({ providers: [provideWeeljack()] });
      const fixture = TestBed.createComponent(GalleryHost);
      await fixture.whenStable();
      element = fixture.nativeElement as HTMLElement;
      await enterSettled(element);
    });

    it('with no inputs, a message is an info message, announced as a status', () => {
      const bare = parts(messageNamed(element, 'Default'));
      const info = parts(messageNamed(element, 'Info'));

      expect(bare.root.getAttribute('role')).toBe('status');
      expect(bare.root.getAttribute('aria-live')).toBe('polite');
      for (const property of ['color', 'backgroundColor', 'outlineColor'] as const) {
        expect(getComputedStyle(bare.root)[property]).toBe(getComputedStyle(info.root)[property]);
      }
      expect(getComputedStyle(bare.root).color).not.toBe(
        getComputedStyle(parts(messageNamed(element, 'Success')).root).color,
      );
    });

    it('with no inputs, it is a 12 px tinted box with an outline, 8 x 12 px padding and 1rem text', () => {
      const { root, content, text } = parts(messageNamed(element, 'Default'));
      const box = getComputedStyle(root);

      expect(box.display).toBe('grid');
      expect(box.borderTopLeftRadius).toBe('12px');
      expect(box.outlineStyle).toBe('solid');
      expect(box.outlineWidth).toBe('1px');
      expect(box.backgroundColor).not.toBe(CLEAR);
      expect(getComputedStyle(content).padding).toBe('8px 12px');
      expect(getComputedStyle(text).fontSize).toBe('16px');
      expect(getComputedStyle(text).fontWeight).toBe('500');
    });

    it('severity gives six different text colours', () => {
      const colours = SEVERITIES.map((severity) => {
        const name = severity.charAt(0).toUpperCase() + severity.slice(1);
        return getComputedStyle(parts(messageNamed(element, name)).root).color;
      });

      expect(new Set(colours).size).toBe(6);
    });

    it('size steps the padding and the text: 6 x 10 / 14 px small, 8 x 12 / 16 px, 10 x 14 / 18 px large', () => {
      const steps = ['Small', 'Medium', 'Large'].map((name) => {
        const { content, text } = parts(messageNamed(element, name));
        return [getComputedStyle(content).padding, getComputedStyle(text).fontSize];
      });

      expect(steps).toEqual([
        ['6px 10px', '14px'],
        ['8px 12px', '16px'],
        ['10px 14px', '18px'],
      ]);
    });

    it('variant draws an outlined or a simple message instead of the tinted one', () => {
      const tinted = getComputedStyle(parts(messageNamed(element, 'Default')).root);
      const outlined = parts(messageNamed(element, 'Outlined'));
      const simple = parts(messageNamed(element, 'Simple'));

      expect(tinted.backgroundColor).not.toBe(CLEAR);
      expect(getComputedStyle(outlined.root).backgroundColor).toBe(CLEAR);
      expect(getComputedStyle(outlined.root).outlineColor).toBe(
        getComputedStyle(outlined.root).color,
      );
      expect(getComputedStyle(simple.root).backgroundColor).toBe(CLEAR);
      expect(getComputedStyle(simple.root).outlineColor).toBe(CLEAR);
      expect(getComputedStyle(simple.content).padding).toBe('0px');
    });

    it('makes the close button at least 24 x 24 px at every size', () => {
      for (const name of ['Small', 'Medium', 'Large']) {
        const { close } = parts(messageNamed(element, name));
        const box = close.getBoundingClientRect();

        expect(box.width).toBeGreaterThanOrEqual(24);
        expect(box.height).toBeGreaterThanOrEqual(24);
      }
    });

    it('has no close button unless it is closable', () => {
      expect(messageNamed(element, 'Default').querySelector('button')).toBeNull();
    });
  });

  describe('inputs', () => {
    it('closable adds a close button, and without it there is none', async () => {
      const { host, message, element } = await render();
      expect(await message.isClosable()).toBe(false);
      expect(element.querySelector('button#before + div button')).toBeNull();

      host.closable.set(true);

      await expect.poll(() => message.isClosable()).toBe(true);
    });

    it('reads a bare closable attribute as true', async () => {
      @Component({
        selector: 'wj-message-bare-host',
        imports: [WjMessage],
        template: `<wj-message closable>Saved.</wj-message>`,
      })
      class BareHost {}
      TestBed.configureTestingModule({ providers: [provideWeeljack()] });
      const fixture = TestBed.createComponent(BareHost);
      await fixture.whenStable();
      const message = await TestbedHarnessEnvironment.loader(fixture).getHarness(WjMessageHarness);

      expect(await message.isClosable()).toBe(true);
    });

    it('renders the projected content as the message text', async () => {
      const { message, host, fixture } = await render();
      expect(await message.getText()).toBe('Saved. Your changes are stored.');

      host.text.set('Storage almost full.');
      await fixture.whenStable();

      expect(await message.getText()).toBe('Storage almost full.');
    });

    it('finds a message by its text', async () => {
      const { fixture } = await render();
      const loader = TestbedHarnessEnvironment.loader(fixture);

      expect(await loader.getAllHarnesses(WjMessageHarness.with({ text: /^Saved/ }))).toHaveLength(
        1,
      );
      expect(await loader.getAllHarnesses(WjMessageHarness.with({ text: 'Nothing' }))).toHaveLength(
        0,
      );
    });
  });

  describe('closing', () => {
    it('emits closed once per close, even when the button is pressed again while it leaves', async () => {
      const { host, message, element } = await render('light', (initial) => {
        initial.closable.set(true);
      });
      const { close } = parts(element);

      close.click();
      close.click();
      await message.close();

      expect(host.closes()).toBe(1);
    });

    it('emits nothing until the user closes it', async () => {
      const { host, message } = await render('light', (initial) => {
        initial.closable.set(true);
      });

      expect(host.closes()).toBe(0);
      expect(await message.isClosed()).toBe(false);
    });

    it('hides its own host once the leave has ended: out of the layout and the accessibility tree', async () => {
      const { message, element } = await render('light', (host) => {
        host.closable.set(true);
      });
      const { host, root } = parts(element);
      expect(host.getBoundingClientRect().height).toBeGreaterThan(0);

      await message.close();

      await expect.poll(() => message.isClosed()).toBe(true);
      expect(host.hasAttribute('hidden')).toBe(true);
      expect(getComputedStyle(host).display).toBe('none');
      expect(host.getBoundingClientRect().height).toBe(0);
      expect(host.checkVisibility()).toBe(false);
      expect(root.checkVisibility()).toBe(false);
    });

    it('leaves no focus inside the hidden message', async () => {
      const { message, element } = await render('light', (host) => {
        host.closable.set(true);
      });
      const { host, close } = parts(element);
      close.focus();
      expect(host.contains(document.activeElement)).toBe(true);

      await userEvent.keyboard('{Enter}');

      await expect.poll(() => message.isClosed()).toBe(true);
      // Chrome moves focus off a hidden element at its next frame, not in the same task.
      await expect.poll(() => host.contains(document.activeElement)).toBe(false);
    });

    it('lets the app remove it in (closed) and move focus there', async () => {
      const { host, fixture, element } = await render('light', (initial) => {
        initial.closable.set(true);
        initial.removeOnClose.set(true);
      });
      parts(element).close.focus();

      await userEvent.keyboard('{Enter}');
      await fixture.whenStable();

      await expect.poll(() => element.querySelector('wj-message')).toBeNull();
      expect(host.closes()).toBe(1);
      expect(document.activeElement).not.toBeInstanceOf(HTMLButtonElement);
    });

    it('does not hide a message that was not closed when an animation ends in it', async () => {
      const { fixture, message, element } = await render('light', (host) => {
        host.closable.set(true);
      });

      parts(element).root.dispatchEvent(new AnimationEvent('animationend', { bubbles: true }));
      await fixture.whenStable();

      expect(await message.isClosed()).toBe(false);
    });
  });

  describe('motion', () => {
    it('runs the 0.15 s leave animation when the reader has no preference', async () => {
      const { message, element } = await render('light', (host) => {
        host.closable.set(true);
      });

      await message.close();

      const box = getComputedStyle(parts(element).root);
      expect(box.animationName).toBe('p-animate-message-leave');
      expect(box.animationDuration).toBe('0.15s');
      await expect.poll(() => message.isClosed()).toBe(true);
    });

    it('holds one reduced-motion rule, in the wj layer, that sets the duration to 0s and not none', async () => {
      await render();

      const rule = reducedMotionRule();
      expect(rule.style.animationDuration).toBe('0s');
      expect(rule.style.animationName).toBe('');
      expect(layerOfRule(rule.selectorText)).toEqual(['wj']);
      expect(
        mediaStyleRules('prefers-reduced-motion').filter((candidate) =>
          candidate.selectorText.startsWith('p-message'),
        ),
      ).toHaveLength(1);
    });

    it('under reduced motion the animation lasts 0s and closing hides the message at once', async () => {
      const { message, element } = await render('light', (host) => {
        host.closable.set(true);
      });
      applyReducedMotion();
      const { root } = parts(element);

      await message.close();

      // The animation still runs (a 0s one, so it keeps its `forwards` end state and `animationend`
      // fires): that event is what hides the host.
      const box = getComputedStyle(root);
      expect(box.animationName).toBe('p-animate-message-leave');
      expect(box.animationDuration).toBe('0s');
      await expect.poll(() => message.isClosed()).toBe(true);
      expect(Number(getComputedStyle(root).opacity)).toBe(0);
    });
  });

  describe('pt', () => {
    it('reaches the inner parts, as an object', async () => {
      const { element } = await render('light', (host) => {
        host.closable.set(true);
        host.pt.set({
          contentWrapper: { 'data-probe': 'wrapper' },
          text: { 'data-probe': 'text' },
          closeButton: { 'data-probe': 'close' },
        });
      });

      expect(find(element, '[data-probe="wrapper"]', HTMLElement).tagName).toBe('DIV');
      expect(find(element, '[data-probe="text"]', HTMLElement).textContent).toContain('Saved.');
      expect(find(element, '[data-probe="close"]', HTMLElement).tagName).toBe('BUTTON');
    });

    it('reaches the inner parts, as a function with a function part', async () => {
      const { element } = await render('light', (host) => {
        host.pt.set(() => ({ contentWrapper: () => ({ 'data-probe': 'fn' }) }));
      });

      expect(find(element, '[data-probe="fn"]', HTMLElement).tagName).toBe('DIV');
    });

    it('keeps the consumer host keys beside the routed role and live region', async () => {
      const { element } = await render('light', (host) => {
        host.severity.set('error');
        host.pt.set({ host: { 'data-probe': 'host', 'aria-describedby': 'hint' } });
      });

      expect(attributeOf(element, 'data-probe')).toBe('host');
      expect(attributeOf(element, 'aria-describedby')).toBe('hint');
      expect(attributeOf(element, 'role')).toBe('alert');
      expect(attributeOf(element, 'aria-live')).toBe('assertive');
    });

    it('keeps the consumer host keys of a function pt beside the routed ones', async () => {
      const { element } = await render('light', (host) => {
        host.pt.set(() => ({ host: { 'data-probe': 'fn-host' } }));
      });

      expect(attributeOf(element, 'data-probe')).toBe('fn-host');
      expect(attributeOf(element, 'role')).toBe('status');
    });

    it('lets the routed role win over a consumer role of the same name', async () => {
      const { element } = await render('light', (host) => {
        host.pt.set({ host: { role: 'note', 'aria-live': 'off' } });
      });

      expect(attributeOf(element, 'role')).toBe('status');
      expect(attributeOf(element, 'aria-live')).toBe('polite');
    });

    it('keeps the consumer keys of a part when the severity changes', async () => {
      const { host, fixture, element } = await render('light', (initial) => {
        initial.pt.set({ host: { 'data-probe': 'kept' } });
      });

      host.severity.set('error');
      await fixture.whenStable();

      expect(attributeOf(element, 'data-probe')).toBe('kept');
    });
  });

  describe('role and live region (FR-14)', () => {
    it.each(SEVERITIES)(
      'severity %s is announced as the right role and live region',
      async (severity) => {
        const { message, element } = await render('light', (host) => {
          host.severity.set(severity);
        });
        const alert = ALERTS.includes(severity);

        expect(await message.getRole()).toBe(alert ? 'alert' : 'status');
        expect(attributeOf(element, 'role')).toBe(alert ? 'alert' : 'status');
        expect(attributeOf(element, 'aria-live')).toBe(alert ? 'assertive' : 'polite');
      },
    );

    it('keeps the routed role and live region through several severity changes', async () => {
      const { host, message, element } = await render();
      const sequence: WjMessageSeverity[] = [
        'error',
        'info',
        'warn',
        'success',
        'error',
        'contrast',
      ];

      for (const severity of sequence) {
        host.severity.set(severity);
        const alert = ALERTS.includes(severity);
        await expect.poll(() => attributeOf(element, 'role')).toBe(alert ? 'alert' : 'status');
        expect(attributeOf(element, 'aria-live')).toBe(alert ? 'assertive' : 'polite');
        expect(await message.getRole()).toBe(alert ? 'alert' : 'status');
      }
    });

    it('puts no role and no aria-* on the wj-message host itself', async () => {
      const { element } = await render('light', (host) => {
        host.severity.set('error');
      });
      const { host } = parts(element);

      expect(host.hasAttribute('role')).toBe(false);
      expect(host.getAttributeNames().filter((name) => name.startsWith('aria-'))).toEqual([]);
      expect(warn).not.toHaveBeenCalled();
    });
  });

  describe('ARIA', () => {
    it('names the close button from translation.aria.close: "Close" by default', async () => {
      const { message, element } = await render('light', (host) => {
        host.closable.set(true);
      });

      expect(await message.getCloseButtonLabel()).toBe('Close');
      expect(parts(element).close.getAttribute('aria-label')).toBe('Close');
    });

    it('follows the translation: a changed aria.close renames the close button', async () => {
      const { message } = await render(
        'light',
        (host) => {
          host.closable.set(true);
        },
        { translation: { aria: { close: 'Đóng' } } },
      );

      expect(await message.getCloseButtonLabel()).toBe('Đóng');
    });

    it('has no close button label when it is not closable', async () => {
      const { message } = await render();

      expect(await message.getCloseButtonLabel()).toBeNull();
      await expect(message.close()).rejects.toThrow('not closable');
    });

    it('warns WJ0003 once, with its own advice, and forwards nothing when aria-* is on the host', async () => {
      TestBed.configureTestingModule({ providers: [provideWeeljack()] });
      const fixture = TestBed.createComponent(AriaOnHostHost);
      await fixture.whenStable();
      const element = fixture.nativeElement as HTMLElement;

      expect(attributeOf(element, 'aria-label')).toBeNull();
      expect(warn).toHaveBeenCalledTimes(1);
      expect(warn).toHaveBeenCalledWith(
        'WJ0003: wj-message: aria-label is set on the host, where it is not forwarded to the ' +
          'focusable element. A message has no aria inputs: its role follows the severity, and ' +
          'its text is the projected content. ' +
          'Find more at https://locvodever.github.io/weeljack-ng/errors/WJ0003',
      );
    });

    it('stays silent when no aria-* is written on the host', async () => {
      TestBed.configureTestingModule({ providers: [provideWeeljack()] });
      const fixture = TestBed.createComponent(PlainHost);
      await fixture.whenStable();

      expect(warn).not.toHaveBeenCalled();
    });

    it('warns WJ0001 when provideWeeljack is missing', async () => {
      const fixture = TestBed.createComponent(PlainHost);
      await fixture.whenStable();

      expect(warn).toHaveBeenCalledTimes(1);
      expect(warn).toHaveBeenCalledWith(
        'WJ0001: wj-message: provideWeeljack() is missing from the application providers. ' +
          'Add provideWeeljack() to your application config. ' +
          'Find more at https://locvodever.github.io/weeljack-ng/errors/WJ0001',
      );
    });
  });

  describe('HTML payloads', () => {
    it('renders a payload interpolated into the projected content as text', async () => {
      const { message, element } = await render('light', (host) => {
        host.text.set(PAYLOAD);
      });

      expect(await message.getText()).toBe(PAYLOAD);
      expect(element.querySelector('wj-message img')).toBeNull();
      expect(Reflect.get(window, 'wjInjected')).toBeUndefined();
    });

    it('binds neither text nor escape, so Optimus’s innerHTML branch is unreachable', async () => {
      const { element } = await render();

      expect(
        find(element, 'p-message', HTMLElement).querySelectorAll('.p-message-text'),
      ).toHaveLength(1);
    });
  });

  describe('layout', () => {
    it('takes the block display of the box it wraps and adds no box of its own', async () => {
      const { element } = await render('light', (host) => {
        host.width.set('320px');
      });
      const { host, root } = parts(element);
      const own = getComputedStyle(host);

      expect(own.display).toBe('block');
      expect(host.getBoundingClientRect().width).toBe(320);
      expect(host.getBoundingClientRect().height).toBe(root.getBoundingClientRect().height);
      for (const property of ['padding', 'borderTopWidth', 'backgroundColor'] as const) {
        expect(own[property]).toMatch(/^(0px|rgba\(0, 0, 0, 0\))$/);
      }
    });

    it('keeps the close button inside the box at 320 px, however long the unbroken text', async () => {
      const { element } = await render('light', (host) => {
        host.closable.set(true);
        host.text.set('x'.repeat(300));
        host.width.set('320px');
      });
      const { root, close, text } = parts(element);
      const box = root.getBoundingClientRect();
      const button = close.getBoundingClientRect();

      expect(box.width).toBe(320);
      expect(button.right).toBeLessThanOrEqual(box.right);
      expect(button.left).toBeGreaterThanOrEqual(box.left);
      expect(root.scrollWidth).toBeLessThanOrEqual(root.clientWidth);
      expect(text.getBoundingClientRect().right).toBeLessThanOrEqual(button.left);
    });

    it('centres the close button in the row of a message with several lines', async () => {
      const { element } = await render('light', (host) => {
        host.closable.set(true);
        host.text.set('A message that says a good deal and so runs over several lines. '.repeat(3));
        host.width.set('320px');
      });
      const { content, close } = parts(element);
      const row = content.getBoundingClientRect();
      const button = close.getBoundingClientRect();

      expect(parts(element).text.getBoundingClientRect().height).toBeGreaterThan(button.height);
      expect(Math.abs(button.top + button.height / 2 - (row.top + row.height / 2))).toBeLessThan(1);
    });
  });

  describe('accessibility', () => {
    describe.each<Scheme>(['light', 'dark'])('%s', (scheme) => {
      it.each(STATES)('has no axe violations: %s', async (_name, setup) => {
        const { element } = await render(scheme, setup);

        await expectNoAxeViolations(byId(element, 'box'));
      });

      it('has no axe violations once closed', async () => {
        const { element, message } = await render(scheme, (host) => {
          host.closable.set(true);
        });
        await message.close();
        await expect.poll(() => message.isClosed()).toBe(true);

        await expectNoAxeViolations(byId(element, 'box'));
      });
    });
  });

  describe('keyboard', () => {
    it('is no Tab stop unless it is closable', async () => {
      const { element } = await render();
      byId(element, 'before').focus();

      await userEvent.tab();

      expect(document.activeElement).toBe(byId(element, 'after'));
    });

    it('Tab moves focus onto the close button and past it, Shift+Tab back', async () => {
      const { element } = await render('light', (host) => {
        host.closable.set(true);
      });
      byId(element, 'before').focus();

      await userEvent.tab();
      expect(document.activeElement).toBe(parts(element).close);

      await userEvent.tab();
      expect(document.activeElement).toBe(byId(element, 'after'));

      await userEvent.tab({ shift: true });
      expect(document.activeElement).toBe(parts(element).close);
    });

    it.each([
      ['Enter', '{Enter}'],
      ['Space', ' '],
    ])('%s on the close button closes the message once', async (_name, keys) => {
      const { host, message, element } = await render('light', (initial) => {
        initial.closable.set(true);
      });
      parts(element).close.focus();

      await userEvent.keyboard(keys);

      await expect.poll(() => message.isClosed()).toBe(true);
      expect(host.closes()).toBe(1);
    });
  });
});
