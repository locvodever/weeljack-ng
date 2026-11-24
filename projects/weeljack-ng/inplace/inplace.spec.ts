import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Component, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import type { MockInstance } from 'vitest';
import { userEvent } from 'vitest/browser';
import { provideWeeljack } from 'weeljack-ng';
import {
  WjInplace,
  WjInplaceContentSlot,
  WjInplaceDisplaySlot,
  type WjInplacePt,
} from 'weeljack-ng/inplace';
import { WjInplaceHarness } from 'weeljack-ng/inplace/testing';
import { expectNoAxeViolations } from '../spec-support/axe';

const PAYLOAD = '<img src=x onerror="window.wjInjected = true">';
const ROOT = document.documentElement;

/**
 * A consumer's template: native buttons around one inplace. The display shows a label; the content
 * is an editor (an input and a "Done" button that calls the context's `close`) or plain text with
 * nothing to focus. Every input is driven by a signal.
 */
@Component({
  selector: 'wj-inplace-host',
  imports: [WjInplace, WjInplaceDisplaySlot, WjInplaceContentSlot],
  template: `
    <button type="button" id="before">Before</button>
    <span id="name-label">Display name</span>
    <span id="name-hint">Shown on your profile</span>
    <wj-inplace
      [(active)]="active"
      [closable]="closable()"
      [disabled]="disabled()"
      [ariaLabel]="ariaLabel()"
      [ariaLabelledBy]="ariaLabelledBy()"
      [ariaDescribedBy]="ariaDescribedBy()"
      [pt]="pt()"
      (activeChange)="changes.update((list) => [...list, $event])"
    >
      <ng-template wjInplaceDisplay
        ><span id="name-value" class="shown">{{ label() }}</span></ng-template
      >
      <ng-template wjInplaceContent let-close="close">
        @if (editor()) {
          <input class="editor" type="text" aria-label="Name" />
          <button type="button" class="done" (click)="close()">Done</button>
        } @else {
          <span class="plain">Details</span>
        }
      </ng-template>
    </wj-inplace>
    <button type="button" id="after">After</button>
  `,
})
class Host {
  readonly active = signal(false);
  readonly closable = signal(false);
  readonly disabled = signal(false);
  readonly editor = signal(true);
  readonly label = signal('Mara Ellis');
  readonly ariaLabel = signal<string | undefined>(undefined);
  readonly ariaLabelledBy = signal<string | undefined>(undefined);
  readonly ariaDescribedBy = signal<string | undefined>(undefined);
  readonly pt = signal<WjInplacePt>(undefined);
  /** Every value `activeChange` emitted, in order. */
  readonly changes = signal<boolean[]>([]);
}

/** A consumer who writes `aria-*` on the host instead of using the inputs. */
@Component({
  selector: 'wj-inplace-aria-host',
  imports: [WjInplace, WjInplaceDisplaySlot, WjInplaceContentSlot],
  template: `
    <wj-inplace aria-label="Other">
      <ng-template wjInplaceDisplay>Value</ng-template>
      <ng-template wjInplaceContent>Content</ng-template>
    </wj-inplace>
  `,
})
class AriaOnHostHost {}

/** A minimal consumer, to render without `provideWeeljack`. */
@Component({
  selector: 'wj-inplace-bare-host',
  imports: [WjInplace, WjInplaceDisplaySlot, WjInplaceContentSlot],
  template: `
    <wj-inplace>
      <ng-template wjInplaceDisplay>Value</ng-template>
      <ng-template wjInplaceContent>Content</ng-template>
    </wj-inplace>
  `,
})
class BareHost {}

type Scheme = 'light' | 'dark';

interface Rendered {
  fixture: ComponentFixture<Host>;
  host: Host;
  inplace: WjInplaceHarness;
  element: HTMLElement;
}

function find<E extends Element>(root: ParentNode, selector: string, type: new () => E): E {
  const found = root.querySelector(selector);
  if (!(found instanceof type)) {
    throw new Error(`${selector} is missing`);
  }
  return found;
}

const sectionOf = (root: ParentNode, section: string): HTMLElement =>
  find(root, `[data-pc-section="${section}"]`, HTMLElement);
const displayOf = (root: ParentNode): HTMLElement => sectionOf(root, 'display');
const contentOf = (root: ParentNode): HTMLElement => sectionOf(root, 'content');
const closeButtonOf = (root: ParentNode): HTMLButtonElement =>
  find(root, '[data-pc-name="pcbutton"]', HTMLButtonElement);
const rootOf = (root: ParentNode): HTMLElement => find(root, 'p-inplace', HTMLElement);
const hostOf = (root: ParentNode): HTMLElement => find(root, 'wj-inplace', HTMLElement);
const has = (root: ParentNode, selector: string): boolean => root.querySelector(selector) !== null;

/**
 * Renders the host with `provideWeeljack` in the given scheme. It renders inactive first (the
 * display proves Optimus's styles loaded: a render without them would pass axe for the wrong
 * reason), then runs `setup`.
 */
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
  await fixture.whenStable();
  const element = fixture.nativeElement as HTMLElement;
  expect(getComputedStyle(displayOf(element)).borderTopLeftRadius).toBe('12px');
  setup(fixture.componentInstance);
  await fixture.whenStable();
  const inplace = await TestbedHarnessEnvironment.loader(fixture).getHarness(WjInplaceHarness);
  return { fixture, host: fixture.componentInstance, inplace, element };
}

/** Renders one of the small hosts with `provideWeeljack` (or without it). */
async function renderSmall<T>(
  type: new () => T,
  withProvider = true,
): Promise<{ fixture: ComponentFixture<T>; element: HTMLElement }> {
  if (withProvider) {
    TestBed.configureTestingModule({ providers: [provideWeeljack({ darkMode: 'class' })] });
  }
  const fixture = TestBed.createComponent(type);
  await fixture.whenStable();
  return { fixture, element: fixture.nativeElement as HTMLElement };
}

/** The documented states for axe (FR-29). */
const STATES: [string, (host: Host) => void][] = [
  ['inactive', () => undefined],
  [
    'active',
    (host) => {
      host.active.set(true);
    },
  ],
  [
    'active and closable',
    (host) => {
      host.closable.set(true);
      host.active.set(true);
    },
  ],
  [
    'disabled (inactive)',
    (host) => {
      host.disabled.set(true);
    },
  ],
];

describe('WjInplace', () => {
  let warn: MockInstance<typeof console.warn>;

  beforeEach(() => {
    // Optimus injects its styles after the first render, and every colour then transitions for
    // 0.2s from the browser default. Measure the end state, not the animation.
    const noMotion = document.createElement('style');
    noMotion.id = 'wj-spec-no-motion';
    noMotion.textContent = '*, *::before, *::after { transition: none !important; }';
    document.head.append(noMotion);
    warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    document.getElementById('wj-spec-no-motion')?.remove();
    ROOT.classList.remove('wj-dark');
    document.body.style.backgroundColor = '';
    document.head.querySelectorAll('style[data-optimus-style-id]').forEach((style) => {
      style.remove();
    });
    Reflect.deleteProperty(window, 'wjInjected');
  });

  describe('state', () => {
    it('shows the display and not the content until activated', async () => {
      const { inplace, element } = await render();

      expect(await inplace.isActive()).toBe(false);
      expect(await inplace.getDisplayText()).toBe('Mara Ellis');
      expect(await inplace.getContentText()).toBe('');
      expect(has(element, '.editor')).toBe(false);
      expect(displayOf(element).getAttribute('role')).toBe('button');
      expect(displayOf(element).getAttribute('tabindex')).toBe('0');
    });

    it('activates on a click: the model follows and activeChange emits once', async () => {
      const { inplace, host, element } = await render();

      await inplace.activate();

      await expect.poll(() => host.active()).toBe(true);
      expect(host.changes()).toEqual([true]);
      expect(await inplace.isActive()).toBe(true);
      expect(has(element, '[data-pc-section="display"]')).toBe(false);
      expect(has(element, '.editor')).toBe(true);
    });

    it('follows the app: setting active shows the content and emits nothing', async () => {
      const { inplace, host } = await render();

      host.active.set(true);
      await expect.poll(() => inplace.isActive()).toBe(true);
      host.active.set(false);
      await expect.poll(() => inplace.isActive()).toBe(false);

      expect(host.changes()).toEqual([]);
      expect(await inplace.getDisplayText()).toBe('Mara Ellis');
    });

    it('starts active when active is bound true', async () => {
      const { inplace } = await render('light', (host) => {
        host.active.set(true);
      });

      expect(await inplace.isActive()).toBe(true);
    });

    it('reports every user switch once, in order, and keeps both sides equal', async () => {
      const { inplace, host } = await render('light', (instance) => {
        instance.closable.set(true);
      });

      await inplace.activate();
      await expect.poll(() => host.active()).toBe(true);
      await inplace.close();
      await expect.poll(() => host.active()).toBe(false);
      await inplace.activate();
      await expect.poll(() => host.active()).toBe(true);

      expect(host.changes()).toEqual([true, false, true]);
      expect(await inplace.isActive()).toBe(true);
      host.active.set(false);
      await expect.poll(() => inplace.isActive()).toBe(false);
      // An app switch after user switches is still followed, and still reports nothing.
      expect(host.changes()).toEqual([true, false, true]);
    });

    it('activates a second time after the app closed it behind Optimus’s back', async () => {
      const { inplace, host } = await render();

      await inplace.activate();
      await expect.poll(() => inplace.isActive()).toBe(true);
      host.active.set(false);
      await expect.poll(() => inplace.isActive()).toBe(false);
      await inplace.activate();

      await expect.poll(() => inplace.isActive()).toBe(true);
      expect(host.changes()).toEqual([true, true]);
    });

    it('closes through the content context’s close', async () => {
      const { inplace, host, element } = await render();
      await inplace.activate();
      await expect.poll(() => inplace.isActive()).toBe(true);

      await userEvent.click(find(element, '.done', HTMLElement));

      await expect.poll(() => inplace.isActive()).toBe(false);
      expect(host.active()).toBe(false);
      expect(host.changes()).toEqual([true, false]);
    });
  });

  describe('closable', () => {
    it('shows the close button while active and closable, and not without it', async () => {
      const { inplace, host, element } = await render('light', (instance) => {
        instance.active.set(true);
      });

      expect(has(element, '[data-pc-name="pcbutton"]')).toBe(false);
      expect(await inplace.isClosable()).toBe(false);
      expect(await inplace.getCloseLabel()).toBeNull();

      host.closable.set(true);
      await expect.poll(() => has(element, '[data-pc-name="pcbutton"]')).toBe(true);
      expect(await inplace.isClosable()).toBe(true);

      host.closable.set(false);
      await expect.poll(() => has(element, '[data-pc-name="pcbutton"]')).toBe(false);
    });

    it('shows no close button while inactive', async () => {
      const { inplace, element } = await render('light', (host) => {
        host.closable.set(true);
      });

      expect(has(element, '[data-pc-name="pcbutton"]')).toBe(false);
      expect(await inplace.isClosable()).toBe(true);
    });

    it('closes with a click on the close button', async () => {
      const { inplace, host } = await render('light', (instance) => {
        instance.closable.set(true);
        instance.active.set(true);
      });

      await inplace.close();

      await expect.poll(() => inplace.isActive()).toBe(false);
      expect(host.active()).toBe(false);
      expect(host.changes()).toEqual([false]);
    });
  });

  describe('disabled', () => {
    it('blocks a click and shows the display as disabled to assistive tech', async () => {
      const { fixture, inplace, host, element } = await render('light', (instance) => {
        instance.disabled.set(true);
      });

      expect(await inplace.isDisabled()).toBe(true);
      expect(displayOf(element).getAttribute('aria-disabled')).toBe('true');
      expect(displayOf(element).getAttribute('tabindex')).toBe('0');
      // A disabled display ignores the pointer (pointer-events: none), so the click goes direct.
      displayOf(element).click();
      await fixture.whenStable();

      expect(await inplace.isActive()).toBe(false);
      expect(host.changes()).toEqual([]);
    });

    it('blocks Enter and Space on the display, which stays a Tab stop', async () => {
      const { inplace, host, element } = await render('light', (instance) => {
        instance.disabled.set(true);
      });
      find(element, '#before', HTMLElement).focus();

      await userEvent.tab();
      expect(await inplace.isFocused()).toBe(true);
      await userEvent.keyboard('{Enter}');
      await userEvent.keyboard(' ');

      expect(await inplace.isActive()).toBe(false);
      expect(await inplace.isFocused()).toBe(true);
      expect(host.changes()).toEqual([]);
    });

    it('blocks the close button and the context’s close while active', async () => {
      const { inplace, host, element } = await render('light', (instance) => {
        instance.closable.set(true);
        instance.disabled.set(true);
        instance.active.set(true);
      });

      expect(await inplace.isDisabled()).toBe(true);
      await inplace.close();
      await userEvent.click(find(element, '.done', HTMLElement));

      expect(await inplace.isActive()).toBe(true);
      expect(host.active()).toBe(true);
      expect(host.changes()).toEqual([]);
    });

    it('takes the disabled marking off again, and works again', async () => {
      const { inplace, host, element } = await render('light', (instance) => {
        instance.disabled.set(true);
      });
      expect(displayOf(element).getAttribute('aria-disabled')).toBe('true');

      host.disabled.set(false);
      await expect.poll(() => displayOf(element).hasAttribute('aria-disabled')).toBe(false);
      expect(await inplace.isDisabled()).toBe(false);

      await inplace.activate();
      await expect.poll(() => inplace.isActive()).toBe(true);
    });

    it('marks a display that turns disabled later', async () => {
      const { host, element } = await render();
      expect(displayOf(element).hasAttribute('aria-disabled')).toBe(false);

      host.disabled.set(true);

      await expect.poll(() => displayOf(element).getAttribute('aria-disabled')).toBe('true');
    });
  });

  describe('focus', () => {
    it('moves into the first control of the content after a click on the display', async () => {
      const { inplace, element } = await render();

      await inplace.activate();

      await expect.poll(() => document.activeElement).toBe(find(element, '.editor', HTMLElement));
      expect(await inplace.hasContentFocus()).toBe(true);
    });

    it('moves to the content part, tabindex -1, when the content has no control', async () => {
      const { inplace, element } = await render('light', (host) => {
        host.editor.set(false);
      });

      await inplace.activate();

      await expect.poll(() => document.activeElement).toBe(contentOf(element));
      expect(contentOf(element).getAttribute('tabindex')).toBe('-1');
    });

    it('prefers the content’s control to the close button', async () => {
      const { inplace, element } = await render('light', (host) => {
        host.closable.set(true);
      });

      await inplace.activate();

      await expect.poll(() => document.activeElement).toBe(find(element, '.editor', HTMLElement));
    });

    it('moves to the content part, not the close button, when only the button is focusable', async () => {
      const { inplace, element } = await render('light', (host) => {
        host.closable.set(true);
        host.editor.set(false);
      });

      await inplace.activate();

      await expect.poll(() => document.activeElement).toBe(contentOf(element));
    });

    it('returns to the display after the close button, and after the context’s close', async () => {
      const { inplace, element } = await render('light', (host) => {
        host.closable.set(true);
      });
      await inplace.activate();
      await expect.poll(() => inplace.isActive()).toBe(true);

      await inplace.close();
      await expect.poll(() => document.activeElement).toBe(displayOf(element));
      expect(await inplace.isFocused()).toBe(true);

      await inplace.activate();
      await expect.poll(() => inplace.isActive()).toBe(true);
      await userEvent.click(find(element, '.done', HTMLElement));
      await expect.poll(() => document.activeElement).toBe(displayOf(element));
    });

    it('moves no focus when the app changes active, either way', async () => {
      const { fixture, host, inplace, element } = await render('light', (instance) => {
        instance.closable.set(true);
      });
      const before = find(element, '#before', HTMLElement);
      before.focus();

      host.active.set(true);
      await expect.poll(() => inplace.isActive()).toBe(true);
      await fixture.whenStable();
      expect(document.activeElement).toBe(before);

      host.active.set(false);
      await expect.poll(() => inplace.isActive()).toBe(false);
      await fixture.whenStable();
      expect(document.activeElement).toBe(before);
    });

    it('gives the content part the focus ring when it takes focus from the keyboard', async () => {
      const { inplace, element } = await render('light', (host) => {
        host.editor.set(false);
      });
      await inplace.focus();

      await userEvent.keyboard('{Enter}');

      await expect.poll(() => document.activeElement).toBe(contentOf(element));
      const style = getComputedStyle(contentOf(element));
      expect(contentOf(element).matches(':focus-visible')).toBe(true);
      expect(style.outlineWidth).toBe('2px');
      expect(style.outlineStyle).toBe('solid');
      expect(style.outlineOffset).toBe('2px');
    });
  });

  describe('aria', () => {
    it('routes ariaLabel, ariaLabelledBy and ariaDescribedBy to the display', async () => {
      const { inplace, element } = await render('light', (host) => {
        host.ariaLabel.set('Display name');
        host.ariaLabelledBy.set('name-label');
        host.ariaDescribedBy.set('name-hint');
      });

      expect(displayOf(element).getAttribute('aria-label')).toBe('Display name');
      expect(displayOf(element).getAttribute('aria-labelledby')).toBe('name-label');
      expect(displayOf(element).getAttribute('aria-describedby')).toBe('name-hint');
      expect(await inplace.getAriaLabel()).toBe('Display name');
      expect(await inplace.getAriaLabelledBy()).toBe('name-label');
      expect(await inplace.getAriaDescribedBy()).toBe('name-hint');
      for (const name of ['aria-label', 'aria-labelledby', 'aria-describedby']) {
        expect(hostOf(element).hasAttribute(name)).toBe(false);
        expect(rootOf(element).hasAttribute(name)).toBe(false);
      }
    });

    it('lets the display name come from a label and the value together', async () => {
      const { element } = await render('light', (host) => {
        host.ariaLabelledBy.set('name-label name-value');
      });

      expect(displayOf(element).getAttribute('aria-labelledby')).toBe('name-label name-value');
      await expectNoAxeViolations(hostOf(element));
    });

    it('follows changed ARIA inputs, and takes a cleared one off again', async () => {
      const { host, element } = await render('light', (instance) => {
        instance.ariaLabel.set('First');
      });

      host.ariaLabel.set('Second');
      await expect.poll(() => displayOf(element).getAttribute('aria-label')).toBe('Second');
      host.ariaLabel.set(undefined);
      await expect.poll(() => displayOf(element).hasAttribute('aria-label')).toBe(false);
    });

    it('keeps every routed attribute after the display was replaced by a switch', async () => {
      const { inplace, host, element } = await render('light', (instance) => {
        instance.ariaLabel.set('Display name');
        instance.ariaDescribedBy.set('name-hint');
        instance.closable.set(true);
        instance.disabled.set(false);
      });

      await inplace.activate();
      await expect.poll(() => inplace.isActive()).toBe(true);
      expect(closeButtonOf(element).getAttribute('aria-label')).toBe('Close');
      await inplace.close();
      await expect.poll(() => inplace.isActive()).toBe(false);

      expect(displayOf(element).getAttribute('aria-label')).toBe('Display name');
      expect(displayOf(element).getAttribute('aria-describedby')).toBe('name-hint');
      host.disabled.set(true);
      await expect.poll(() => displayOf(element).getAttribute('aria-disabled')).toBe('true');
      host.disabled.set(false);
      await inplace.activate();
      await expect.poll(() => inplace.isActive()).toBe(true);
      expect(closeButtonOf(element).getAttribute('aria-label')).toBe('Close');
    });

    it('shows an HTML payload in the ARIA inputs as attribute text, never as markup', async () => {
      const { element } = await render('light', (host) => {
        host.ariaLabel.set(PAYLOAD);
        host.ariaLabelledBy.set(PAYLOAD);
        host.ariaDescribedBy.set(PAYLOAD);
      });

      expect(displayOf(element).getAttribute('aria-label')).toBe(PAYLOAD);
      expect(displayOf(element).getAttribute('aria-labelledby')).toBe(PAYLOAD);
      expect(displayOf(element).getAttribute('aria-describedby')).toBe(PAYLOAD);
      expect(element.querySelector('img')).toBeNull();
      expect(Reflect.get(window, 'wjInjected')).toBeUndefined();
    });

    it('warns WJ0003 for aria-* on the host and forwards nothing', async () => {
      const { element } = await renderSmall(AriaOnHostHost);

      expect(warn).toHaveBeenCalledTimes(1);
      expect(warn).toHaveBeenCalledWith(
        'WJ0003: wj-inplace: aria-label is set on the host, where it is not forwarded to the ' +
          'focusable element. Use the ariaLabel, ariaLabelledBy or ariaDescribedBy input instead. ' +
          'Find more at https://locvodever.github.io/weeljack-ng/errors/WJ0003',
      );
      expect(displayOf(element).hasAttribute('aria-label')).toBe(false);
    });

    it('warns WJ0001 when provideWeeljack is missing', async () => {
      await renderSmall(BareHost, false);

      expect(warn).toHaveBeenCalledTimes(1);
      expect(warn).toHaveBeenCalledWith(
        'WJ0001: wj-inplace: provideWeeljack() is missing from the application providers. ' +
          'Add provideWeeljack() to your application config. ' +
          'Find more at https://locvodever.github.io/weeljack-ng/errors/WJ0001',
      );
    });
  });

  describe('close button name', () => {
    it('is the configured aria.close, "Close" by default', async () => {
      const { inplace, element } = await render('light', (host) => {
        host.closable.set(true);
        host.active.set(true);
      });

      expect(closeButtonOf(element).getAttribute('aria-label')).toBe('Close');
      expect(await inplace.getCloseLabel()).toBe('Close');
      // The name is on the real button: the p-button host carries none.
      expect(closeButtonOf(element).parentElement?.hasAttribute('aria-label')).toBe(false);
      await expectNoAxeViolations(hostOf(element));
    });

    it('follows the translation: a changed aria.close renames it', async () => {
      const { inplace, element } = await render(
        'light',
        (host) => {
          host.closable.set(true);
          host.active.set(true);
        },
        { translation: { aria: { close: 'Đóng' } } },
      );

      expect(closeButtonOf(element).getAttribute('aria-label')).toBe('Đóng');
      expect(await inplace.getCloseLabel()).toBe('Đóng');
    });
  });

  describe('pt', () => {
    const probe = (name: string): { 'data-probe': string } => ({ 'data-probe': name });

    it('reaches the display, content and close button as an object', async () => {
      const { element } = await render('light', (host) => {
        host.closable.set(true);
        host.pt.set({
          root: probe('root'),
          display: probe('display'),
          pcButton: { root: probe('close') },
        });
      });
      const at = (name: string): Element | null => element.querySelector(`[data-probe="${name}"]`);

      expect(at('root')?.localName).toBe('p-inplace');
      expect(at('display')?.getAttribute('data-pc-section')).toBe('display');
      expect(at('close')).toBeNull();

      await userEvent.click(displayOf(element));
      await expect.poll(() => has(element, '.editor')).toBe(true);
      expect(at('close')?.localName).toBe('button');
    });

    it('reaches the content part, as an object and as a function', async () => {
      const { host, element, inplace } = await render('light', (instance) => {
        instance.active.set(true);
        instance.pt.set({ content: probe('content') });
      });

      expect(contentOf(element).getAttribute('data-probe')).toBe('content');
      // The wrapper's own routed tabindex is still there next to the consumer's key.
      expect(contentOf(element).getAttribute('tabindex')).toBe('-1');

      host.pt.set({ content: () => probe('content-fn') });
      await expect.poll(() => contentOf(element).getAttribute('data-probe')).toBe('content-fn');
      expect(await inplace.isActive()).toBe(true);
    });

    it('reaches the display and the close button as a function', async () => {
      const { inplace, element } = await render('light', (host) => {
        host.closable.set(true);
        host.pt.set({
          display: () => probe('display-fn'),
          pcButton: { root: () => probe('close-fn') },
        });
      });

      expect(find(element, '[data-probe="display-fn"]', HTMLElement).getAttribute('role')).toBe(
        'button',
      );
      await inplace.activate();
      await expect.poll(() => has(element, '[data-probe="close-fn"]')).toBe(true);
    });

    it('keeps a consumer pcButton.root key next to the routed aria-label', async () => {
      const { element } = await render('light', (host) => {
        host.closable.set(true);
        host.active.set(true);
        host.pt.set({ pcButton: { root: { 'data-probe': 'mine', 'data-other': 'kept' } } });
      });
      const button = closeButtonOf(element);

      expect(button.getAttribute('data-probe')).toBe('mine');
      expect(button.getAttribute('data-other')).toBe('kept');
      expect(button.getAttribute('aria-label')).toBe('Close');
    });

    it('keeps a consumer pcButton.root key after a switch and a changed pt', async () => {
      const { host, inplace, element } = await render('light', (instance) => {
        instance.closable.set(true);
        instance.active.set(true);
        instance.pt.set({ pcButton: { root: { 'data-probe': 'one' } } });
      });

      await inplace.close();
      await expect.poll(() => inplace.isActive()).toBe(false);
      host.pt.set({ pcButton: { root: () => ({ 'data-probe': 'two' }) } });
      await inplace.activate();
      await expect.poll(() => has(element, '[data-pc-name="pcbutton"]')).toBe(true);

      expect(closeButtonOf(element).getAttribute('data-probe')).toBe('two');
      expect(closeButtonOf(element).getAttribute('aria-label')).toBe('Close');
    });

    it('replaces a consumer class on pcButton.root with the close look, as a routed attribute does', async () => {
      const { element } = await render('light', (host) => {
        host.closable.set(true);
        host.active.set(true);
        host.pt.set({ pcButton: { root: { class: 'mine' } } });
      });

      expect(closeButtonOf(element).classList.contains('mine')).toBe(false);
      expect(closeButtonOf(element).classList.contains('p-button-text')).toBe(true);
    });

    it('lets a routed attribute win over a consumer’s of the same name', async () => {
      const { element } = await render('light', (host) => {
        host.closable.set(true);
        host.active.set(true);
        host.ariaLabel.set('Routed');
        host.pt.set({
          display: { 'aria-label': 'Consumer' },
          pcButton: { root: { 'aria-label': 'Consumer close' } },
        });
      });

      expect(closeButtonOf(element).getAttribute('aria-label')).toBe('Close');
    });

    it('lets the routed ARIA input win on the display, and follows a changed pt', async () => {
      const { host, element } = await render('light', (instance) => {
        instance.ariaLabel.set('Routed');
        instance.pt.set({ display: { 'aria-label': 'Consumer', 'data-probe': 'one' } });
      });

      expect(displayOf(element).getAttribute('aria-label')).toBe('Routed');
      expect(displayOf(element).getAttribute('data-probe')).toBe('one');

      host.pt.set({ display: { 'data-probe': 'two' } });
      await expect.poll(() => displayOf(element).getAttribute('data-probe')).toBe('two');
      expect(displayOf(element).getAttribute('aria-label')).toBe('Routed');
    });

    it('changes nothing visible when no pt is given', async () => {
      const { element } = await render();

      expect(element.querySelector('[data-probe]')).toBeNull();
    });
  });

  describe('harness', () => {
    it('finds an inplace by its display text', async () => {
      const { fixture } = await render();
      const loader = TestbedHarnessEnvironment.loader(fixture);

      expect(await loader.hasHarness(WjInplaceHarness.with({ displayText: 'Mara Ellis' }))).toBe(
        true,
      );
      expect(await loader.hasHarness(WjInplaceHarness.with({ displayText: /^Mara/ }))).toBe(true);
      expect(await loader.hasHarness(WjInplaceHarness.with({ displayText: 'Other' }))).toBe(false);
    });

    it('describes the state, the text and the focus', async () => {
      const { inplace } = await render('light', (host) => {
        host.closable.set(true);
      });

      expect(await inplace.isClosable()).toBe(true);
      expect(await inplace.isDisabled()).toBe(false);
      expect(await inplace.isFocused()).toBe(false);
      await inplace.focus();
      expect(await inplace.isFocused()).toBe(true);
      await inplace.blur();
      expect(await inplace.isFocused()).toBe(false);

      await inplace.activate();
      await expect.poll(() => inplace.isActive()).toBe(true);
      expect(await inplace.getContentText()).toContain('Done');
      expect(await inplace.getDisplayText()).toBe('');
      await expect.poll(() => inplace.hasContentFocus()).toBe(true);
      await expect(inplace.activate()).rejects.toThrow('active');
      await expect(inplace.focus()).rejects.toThrow('active');
    });

    it('refuses to close an inplace with no close button', async () => {
      const { inplace } = await render('light', (host) => {
        host.active.set(true);
      });

      await expect(inplace.close()).rejects.toThrow('no close button');
    });
  });

  describe('look', () => {
    it('is a block with no box of its own, and the root has the same box', async () => {
      const { element } = await render();
      const host = hostOf(element);
      const style = getComputedStyle(host);

      expect(style.display).toBe('block');
      expect(getComputedStyle(rootOf(element)).display).toBe('block');
      expect(style.padding).toBe('0px');
      expect(style.borderTopWidth).toBe('0px');
      expect(style.backgroundColor).toBe('rgba(0, 0, 0, 0)');
      expect(host.getBoundingClientRect().toJSON()).toEqual(
        rootOf(element).getBoundingClientRect().toJSON(),
      );
    });

    it('keeps the display inline-block at the start, with Optimus’s padding and radius', async () => {
      const { element } = await render();
      const style = getComputedStyle(displayOf(element));

      expect(style.display).toBe('inline-block');
      expect(style.paddingTop).toBe('9px');
      expect(style.paddingLeft).toBe('14px');
      expect(style.borderTopLeftRadius).toBe('12px');
      expect(displayOf(element).getBoundingClientRect().width).toBeLessThan(
        hostOf(element).getBoundingClientRect().width,
      );
    });

    it.each(['', 'A'])(
      'keeps the display at least 44 px tall and 30 px wide for "%s"',
      async (label) => {
        const { element } = await render('light', (host) => {
          host.label.set(label);
        });
        const box = displayOf(element).getBoundingClientRect();

        expect(box.height).toBeGreaterThanOrEqual(44);
        expect(box.width).toBeGreaterThanOrEqual(30);
        expect(box.height).toBeGreaterThanOrEqual(24);
      },
    );

    it('wraps a long display and never truncates it', async () => {
      const { element } = await render('light', (host) => {
        host.label.set('A very long display name that keeps going and going and going on');
      });
      const display = displayOf(element);
      const style = getComputedStyle(display);

      document.body.style.width = '12rem';
      expect(display.getBoundingClientRect().height).toBeGreaterThan(
        parseFloat(style.fontSize) * 2,
      );
      expect(style.textOverflow).toBe('clip');
      expect(display.scrollWidth).toBeLessThanOrEqual(display.clientWidth);
      document.body.style.width = '';
    });

    it('lays the content out as a top-aligned row: the slot, then the close button 8 px after', async () => {
      // Plain text is shorter than the 44 px button, so a centred or stretched row would show.
      const { element } = await render('light', (host) => {
        host.closable.set(true);
        host.active.set(true);
        host.editor.set(false);
      });
      const style = getComputedStyle(contentOf(element));
      const slot = find(element, '[data-wj-part="inplace"]', HTMLElement).getBoundingClientRect();
      const button = closeButtonOf(element).getBoundingClientRect();

      expect(style.display).toBe('flex');
      expect(style.flexWrap).toBe('nowrap');
      expect(style.columnGap).toBe('8px');
      expect(button.left - slot.right).toBe(8);
      expect(slot.height).toBeLessThan(button.height);
      expect(button.top).toBe(slot.top);
      expect(slot.top).toBe(contentOf(element).getBoundingClientRect().top);
    });

    it('keeps the close button a 44 px round secondary text button', async () => {
      const { element } = await render('light', (host) => {
        host.closable.set(true);
        host.active.set(true);
      });
      const box = closeButtonOf(element).getBoundingClientRect();
      const style = getComputedStyle(closeButtonOf(element));

      expect(box.width).toBe(44);
      expect(box.height).toBe(44);
      expect(style.backgroundColor).toBe('rgba(0, 0, 0, 0)');
      expect(parseFloat(style.borderTopLeftRadius)).toBeGreaterThanOrEqual(22);
    });

    it('lets the content narrow while the close button stays 44 px', async () => {
      const { element } = await render('light', (host) => {
        host.closable.set(true);
        host.active.set(true);
        host.editor.set(false);
      });
      const narrow = document.createElement('style');
      narrow.textContent = 'wj-inplace { display: block; inline-size: 5rem; }';
      document.head.append(narrow);

      try {
        const button = closeButtonOf(element).getBoundingClientRect();
        expect(button.width).toBe(44);
        expect(hostOf(element).scrollWidth).toBeLessThanOrEqual(hostOf(element).clientWidth + 1);
      } finally {
        narrow.remove();
      }
    });
  });

  describe('accessibility', () => {
    describe.each<Scheme>(['light', 'dark'])('%s', (scheme) => {
      it.each(STATES)('has no axe violations: %s', async (_name, setup) => {
        const { element } = await render(scheme, setup);

        await expectNoAxeViolations(hostOf(element));
      });
    });
  });

  describe('keyboard', () => {
    it('Tab reaches the display; Enter and Space activate and focus lands in the content', async () => {
      const { inplace, host, element } = await render();
      const before = find(element, '#before', HTMLElement);
      before.focus();

      await userEvent.tab();
      expect(await inplace.isFocused()).toBe(true);
      await userEvent.keyboard('{Enter}');
      await expect.poll(() => document.activeElement).toBe(find(element, '.editor', HTMLElement));
      expect(host.changes()).toEqual([true]);

      host.active.set(false);
      await expect.poll(() => inplace.isActive()).toBe(false);
      await inplace.focus();
      await userEvent.keyboard(' ');
      await expect.poll(() => document.activeElement).toBe(find(element, '.editor', HTMLElement));
      expect(host.changes()).toEqual([true, true]);
    });

    it('Space on the display is not left to scroll the page', async () => {
      const { inplace, element } = await render();
      const event = new KeyboardEvent('keydown', {
        code: 'Space',
        key: ' ',
        bubbles: true,
        cancelable: true,
      });

      displayOf(element).dispatchEvent(event);

      expect(event.defaultPrevented).toBe(true);
      await expect.poll(() => inplace.isActive()).toBe(true);
    });

    it('ignores Space typed in the content, and any other key on the display', async () => {
      const { inplace, element } = await render('light', (host) => {
        host.active.set(true);
      });
      const editor = find(element, '.editor', HTMLElement);
      editor.focus();

      await userEvent.keyboard('a b');

      expect(await inplace.isActive()).toBe(true);
      expect(editor).toBeInstanceOf(HTMLInputElement);
      expect(editor instanceof HTMLInputElement && editor.value).toBe('a b');
    });

    it('Tab reaches the close button; Enter and Space on it close, and focus is back on the display', async () => {
      const { inplace, host, element } = await render('light', (instance) => {
        instance.closable.set(true);
        instance.editor.set(false);
      });
      find(element, '#before', HTMLElement).focus();

      await userEvent.tab();
      await userEvent.keyboard('{Enter}');
      await expect.poll(() => document.activeElement).toBe(contentOf(element));
      await userEvent.tab();
      expect(document.activeElement).toBe(closeButtonOf(element));
      await userEvent.keyboard('{Enter}');
      await expect.poll(() => inplace.isFocused()).toBe(true);
      expect(host.active()).toBe(false);

      await userEvent.keyboard(' ');
      await expect.poll(() => document.activeElement).toBe(contentOf(element));
      await userEvent.tab();
      expect(document.activeElement).toBe(closeButtonOf(element));
      await userEvent.keyboard(' ');
      await expect.poll(() => inplace.isFocused()).toBe(true);
      expect(host.active()).toBe(false);
      expect(host.changes()).toEqual([true, false, true, false]);
    });

    it('walks the content in order, then the close button, then on to the page', async () => {
      const { inplace, element } = await render('light', (host) => {
        host.closable.set(true);
      });
      await inplace.focus();
      await userEvent.keyboard('{Enter}');
      await expect.poll(() => document.activeElement).toBe(find(element, '.editor', HTMLElement));

      await userEvent.tab();
      expect(document.activeElement).toBe(find(element, '.done', HTMLElement));
      await userEvent.tab();
      expect(document.activeElement).toBe(closeButtonOf(element));
      await userEvent.tab();
      expect(document.activeElement).toBe(find(element, '#after', HTMLElement));
    });

    it('lets Escape alone do nothing: switching back is the app’s or the close button’s', async () => {
      const { inplace, element } = await render('light', (host) => {
        host.closable.set(true);
        host.active.set(true);
      });
      find(element, '.editor', HTMLElement).focus();

      await userEvent.keyboard('{Escape}');

      expect(await inplace.isActive()).toBe(true);
    });
  });
});
