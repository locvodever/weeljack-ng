/// <reference types="@vitest/browser-playwright" />
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Component, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { Dialog } from '@openng/optimus-ui/dialog';
import type { TooltipPassThroughOptions } from '@openng/optimus-ui/types/tooltip';
import type { MockInstance } from 'vitest';
import { cdp, page, userEvent } from 'vitest/browser';
import { provideWeeljack } from 'weeljack-ng';
import { WjButton } from 'weeljack-ng/button';
import { WjField } from 'weeljack-ng/field';
import { WjInputText } from 'weeljack-ng/inputtext';
import { _overlayEscapeGate } from 'weeljack-ng/private';
import { WjTooltip, type WjTooltipPosition } from 'weeljack-ng/tooltip';
import { WjTooltipHarness } from 'weeljack-ng/tooltip/testing';
import { expectNoAxeViolations } from '../spec-support/axe';

const PAYLOAD = '<img src=x onerror="window.wjInjected = true">';
const TEXT = 'Downloads the current view as a CSV file.';
const ROOT = document.documentElement;

type Kind = 'native' | 'component' | 'bound' | 'field';

/** A consumer's template: one tooltip on whatever `kind` selects, plus a neutral spot for the pointer. */
@Component({
  selector: 'wj-tooltip-host',
  imports: [WjTooltip, WjButton, WjField, WjInputText],
  template: `
    <button id="before" type="button">Before</button>
    <p id="neutral">Neutral</p>
    <div class="stage" [style.padding-inline-start]="inset()">
      @switch (kind()) {
        @case ('native') {
          @if (present()) {
            <button
              id="target"
              type="button"
              style="min-block-size: 44px"
              aria-describedby="mine"
              [wjTooltip]="text()"
              [tooltipPosition]="position()"
              [tooltipDisabled]="disabled()"
              [pt]="pt()"
            >
              Export
            </button>
          }
        }
        @case ('component') {
          <wj-button id="target" label="Archive" [wjTooltip]="text()" />
        }
        @case ('bound') {
          <wj-button
            id="target"
            label="Archive"
            #tip="wjTooltip"
            [wjTooltip]="text()"
            [ariaDescribedBy]="tip.descriptionId"
          />
        }
        @case ('field') {
          <wj-field label="Name" hint="Your full name" [error]="error()">
            <input wjInputText id="target" [wjTooltip]="text()" />
          </wj-field>
        }
      }
    </div>
    <p id="mine" hidden>Mine</p>
    <button id="after" type="button">After</button>
  `,
  styles: `
    .stage {
      padding-block: 200px;
      padding-inline-end: 200px;
    }
  `,
})
class Host {
  readonly kind = signal<Kind>('native');
  readonly text = signal(TEXT);
  readonly position = signal<WjTooltipPosition | undefined>(undefined);
  readonly disabled = signal(false);
  readonly pt = signal<TooltipPassThroughOptions | undefined>(undefined);
  readonly present = signal(true);
  readonly error = signal<string | undefined>(undefined);
  readonly inset = signal('200px');
}

/** A spec-local modal: Optimus Dialog on the seam's gate, with a tooltip on a button inside it. */
@Component({
  selector: 'wj-tooltip-dialog-host',
  imports: [Dialog, WjTooltip],
  template: `
    <p-dialog [(visible)]="visible" header="Lower" [modal]="true" [closable]="closable()">
      <button id="inside" type="button" wjTooltip="Inside the dialog.">Inside</button>
    </p-dialog>
  `,
})
class DialogHost {
  readonly visible = signal(true);
  readonly closable = signal(false);

  constructor() {
    _overlayEscapeGate(this.visible, this.closable);
  }
}

type Scheme = 'light' | 'dark';

interface Rendered {
  fixture: ComponentFixture<Host>;
  component: Host;
  element: HTMLElement;
}

function find<E extends Element>(element: ParentNode, selector: string, type: new () => E): E {
  const found = element.querySelector(selector);
  if (!(found instanceof type)) {
    throw new Error(`${selector} is missing`);
  }
  return found;
}

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

const bubbleEl = (): HTMLElement | null => document.querySelector<HTMLElement>('[role="tooltip"]');

const hostOf = ({ element }: Rendered): HTMLElement => find(element, '#target', HTMLElement);

/** The element a reader presses or tabs to: the host, or the button inside a `wj-button`. */
const controlOf = (rendered: Rendered): HTMLElement =>
  rendered.element.querySelector<HTMLElement>('button.p-component') ?? hostOf(rendered);

const harnessOf = (fixture: ComponentFixture<unknown>): Promise<WjTooltipHarness> =>
  TestbedHarnessEnvironment.loader(fixture).getHarness(WjTooltipHarness);

/** Parks the pointer away from the host: it is page-wide, and a leftover one blocks a new enter. */
async function park(rendered: Rendered): Promise<void> {
  await userEvent.hover(find(rendered.element, '#neutral', HTMLElement));
}

/** Waits for the bubble, and for Optimus's 250 ms fade to finish (it is JavaScript, not CSS). */
async function shown(): Promise<HTMLElement> {
  await expect.poll(bubbleEl).not.toBeNull();
  await expect.poll(() => getComputedStyle(bubbleEl() ?? document.body).opacity).toBe('1');
  return find(document, '[role="tooltip"]', HTMLElement);
}

async function gone(): Promise<void> {
  await expect.poll(bubbleEl).toBeNull();
}

interface DomNode {
  backendNodeId: number;
  attributes?: string[];
  children?: DomNode[];
  contentDocument?: DomNode;
}

/** The node carrying `data-ax-probe`, found through the test iframe (the page itself runs in one). */
function probed(node: DomNode): DomNode | undefined {
  if (node.attributes?.includes('data-ax-probe')) {
    return node;
  }
  for (const child of [
    ...(node.children ?? []),
    ...(node.contentDocument ? [node.contentDocument] : []),
  ]) {
    const found = probed(child);
    if (found) {
      return found;
    }
  }
  return undefined;
}

/** The accessible description the browser computes for `element`, shown tooltip or not. */
async function accessibleDescription(element: HTMLElement): Promise<string> {
  const session = cdp();
  await session.send('DOM.enable');
  await session.send('Accessibility.enable');
  element.setAttribute('data-ax-probe', '');
  try {
    const { root } = await session.send('DOM.getDocument', { depth: -1, pierce: true });
    const node = probed(root);
    if (!node) {
      throw new Error('the probed element is not in the document tree');
    }
    const { nodes } = await session.send('Accessibility.getPartialAXTree', {
      backendNodeId: node.backendNodeId,
      fetchRelatives: false,
    });
    const description: unknown = nodes[0]?.description?.value;
    return typeof description === 'string' ? description : '';
  } finally {
    element.removeAttribute('data-ax-probe');
  }
}

const TOOLTIP_ID = /wj-tooltip-\d+/;

const descriptionEl = (rendered: Rendered): HTMLElement | null => {
  const id = TOOLTIP_ID.exec(controlOf(rendered).getAttribute('aria-describedby') ?? '')?.[0];
  return id === undefined ? null : document.getElementById(id);
};

const warned = (warn: MockInstance<typeof console.warn>, code: string): boolean =>
  warn.mock.calls.some(([message]) => String(message).includes(code));

describe('WjTooltip', () => {
  let warn: MockInstance<typeof console.warn>;
  const viewport = { width: window.innerWidth, height: window.innerHeight };

  beforeEach(() => {
    warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(async () => {
    ROOT.classList.remove('wj-dark');
    document.body.style.backgroundColor = '';
    Reflect.deleteProperty(window, 'wjInjected');
    await page.viewport(viewport.width, viewport.height);
  });

  describe('showing and hiding', () => {
    it('shows on hover, keeps the bubble while the pointer is on it, and hides on leave', async () => {
      const rendered = await render();
      const harness = await harnessOf(rendered.fixture);
      await park(rendered);
      expect(await harness.isShown()).toBe(false);

      await userEvent.hover(hostOf(rendered));
      const bubble = await shown();
      expect(await harness.getText()).toBe(TEXT);
      expect(bubble.parentElement).toBe(document.body);

      // From the host onto the bubble: still shown (WCAG 1.4.13 hoverable).
      await userEvent.hover(find(bubble, '.p-tooltip-text', HTMLElement));
      await rendered.fixture.whenStable();
      expect(await harness.isShown()).toBe(true);

      await park(rendered);
      await gone();
    });

    it('shows on keyboard focus, hides on Escape with focus staying, and hides on blur', async () => {
      const rendered = await render();
      const harness = await harnessOf(rendered.fixture);
      await userEvent.click(find(rendered.element, '#before', HTMLElement));
      await park(rendered);

      await userEvent.tab();
      expect(document.activeElement).toBe(hostOf(rendered));
      await shown();

      await userEvent.keyboard('{Escape}');
      await gone();
      expect(document.activeElement).toBe(hostOf(rendered));

      await harness.blur();
      await harness.focus();
      await shown();
      await userEvent.tab();
      await gone();
      expect(document.activeElement).toBe(find(rendered.element, '#after', HTMLElement));
    });

    it('drives the same through the harness', async () => {
      const rendered = await render();
      const harness = await harnessOf(rendered.fixture);
      await park(rendered);

      await harness.hover();
      await shown();
      expect(await harness.getPosition()).toBe('right');
      await harness.unhover();
      await gone();

      await harness.focus();
      await shown();
      await harness.dismiss();
      await gone();
      expect(await harness.isShown()).toBe(false);
    });

    it('never times out', async () => {
      const rendered = await render();
      await park(rendered);
      await userEvent.hover(hostOf(rendered));
      await shown();

      // Two frames after the fade is over: still there, with no `life` to end it.
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            resolve();
          });
        });
      });
      expect(bubbleEl()).not.toBeNull();
    });

    it.each<WjTooltipPosition>(['left', 'top', 'bottom', 'right'])(
      'is on the %s side when asked, with room',
      async (position) => {
        const rendered = await render((host) => {
          host.position.set(position);
        });
        const harness = await harnessOf(rendered.fixture);
        await park(rendered);
        await userEvent.hover(hostOf(rendered));
        await shown();

        expect(await harness.getPosition()).toBe(position);
      },
    );

    it('falls back to another side when its own has no room', async () => {
      const rendered = await render((host) => {
        host.position.set('left');
        host.inset.set('0px');
      });
      const harness = await harnessOf(rendered.fixture);
      await park(rendered);
      await userEvent.hover(hostOf(rendered));
      await shown();

      expect(await harness.getPosition()).not.toBe('left');
    });

    it('shows no bubble for empty text, and none while tooltipDisabled', async () => {
      const rendered = await render((host) => {
        host.text.set('');
      });
      await park(rendered);
      await userEvent.hover(hostOf(rendered));
      await rendered.fixture.whenStable();
      expect(bubbleEl()).toBeNull();

      rendered.component.text.set(TEXT);
      rendered.component.disabled.set(true);
      await rendered.fixture.whenStable();
      await park(rendered);
      await userEvent.hover(hostOf(rendered));
      await rendered.fixture.whenStable();
      expect(bubbleEl()).toBeNull();
    });

    it('keeps the bubble in step with the text while shown, and hides it when emptied', async () => {
      const rendered = await render();
      const harness = await harnessOf(rendered.fixture);
      await park(rendered);
      await userEvent.hover(hostOf(rendered));
      await shown();

      rendered.component.text.set('Saves a copy.');
      await rendered.fixture.whenStable();
      await expect.poll(() => harness.getText()).toBe('Saves a copy.');
      expect(await harness.getDescription()).toContain('Saves a copy.');

      rendered.component.text.set('');
      await rendered.fixture.whenStable();
      await gone();
    });
  });

  describe('the description', () => {
    it('is the host’s accessible description before and after the bubble shows', async () => {
      const rendered = await render();
      const harness = await harnessOf(rendered.fixture);
      await park(rendered);

      expect(await accessibleDescription(hostOf(rendered))).toContain(TEXT);
      expect(await harness.getDescription()).toContain(TEXT);

      await userEvent.hover(hostOf(rendered));
      await shown();
      expect(await accessibleDescription(hostOf(rendered))).toContain(TEXT);
    });

    it('adds its id to the app’s own tokens and keeps them', async () => {
      const rendered = await render();
      const tokens = (hostOf(rendered).getAttribute('aria-describedby') ?? '').split(' ');

      expect(tokens[0]).toBe('mine');
      expect(tokens[1]).toMatch(/^wj-tooltip-\d+$/);
      expect(await accessibleDescription(hostOf(rendered))).toBe(`Mine ${TEXT}`);
    });

    it('is hidden, outside the layout, and never a Tab stop', async () => {
      const rendered = await render();
      const description = descriptionEl(rendered);

      expect(description?.parentElement).toBe(document.body);
      expect(description?.hidden).toBe(true);
      expect(description?.getBoundingClientRect().height).toBe(0);
      expect(description?.textContent).toBe(TEXT);
      expect(description?.hasAttribute('tabindex')).toBe(false);
    });

    it('follows the text, is empty for empty text, and leaves with the host', async () => {
      const rendered = await render();
      rendered.component.text.set('Saves a copy.');
      await rendered.fixture.whenStable();
      expect(descriptionEl(rendered)?.textContent).toBe('Saves a copy.');

      rendered.component.text.set('');
      await rendered.fixture.whenStable();
      expect(descriptionEl(rendered)?.textContent).toBe('');

      const id = descriptionEl(rendered)?.id ?? '';
      rendered.component.present.set(false);
      await rendered.fixture.whenStable();
      expect(document.getElementById(id)).toBeNull();
    });

    it('is put back when an app binding rewrites aria-describedby', async () => {
      const rendered = await render();
      hostOf(rendered).setAttribute('aria-describedby', 'mine');

      await expect
        .poll(() => hostOf(rendered).getAttribute('aria-describedby'))
        .toMatch(/^mine wj-tooltip-\d+$/);
    });

    it('coexists with the describedby ids a wj-field writes, before and after an error', async () => {
      const rendered = await render((host) => {
        host.kind.set('field');
      });
      const input = hostOf(rendered);
      const has = (pattern: RegExp): boolean =>
        (input.getAttribute('aria-describedby') ?? '').split(' ').some((id) => pattern.test(id));

      await expect.poll(() => has(TOOLTIP_ID)).toBe(true);
      expect(has(/^wj-field-hint-/)).toBe(true);
      expect(await accessibleDescription(input)).toContain(TEXT);

      rendered.component.error.set('Enter a name.');
      await rendered.fixture.whenStable();
      await expect.poll(() => has(/^wj-field-error-/)).toBe(true);
      await expect.poll(() => has(TOOLTIP_ID)).toBe(true);
      expect(await accessibleDescription(input)).toContain(TEXT);
      expect(await accessibleDescription(input)).toContain('Enter a name.');
    });
  });

  describe('on a component host', () => {
    it('writes nothing on the host and raises WJ0153', async () => {
      const rendered = await render((host) => {
        host.kind.set('component');
      });
      await expect.poll(() => warned(warn, 'WJ0153')).toBe(true);

      expect(hostOf(rendered).hasAttribute('aria-describedby')).toBe(false);
      expect(controlOf(rendered).hasAttribute('aria-describedby')).toBe(false);
      expect(String(warn.mock.calls.find(([m]) => String(m).includes('WJ0153'))?.[0])).toMatch(
        /^WJ0153: \[wjTooltip\]: .* Find more at .*\/errors\/WJ0153$/,
      );
    });

    it('describes the inner button through descriptionId, and shows on its focus', async () => {
      const rendered = await render((host) => {
        host.kind.set('bound');
      });
      const harness = await harnessOf(rendered.fixture);
      await park(rendered);

      expect(controlOf(rendered).tagName).toBe('BUTTON');
      expect(hostOf(rendered).hasAttribute('aria-describedby')).toBe(false);
      expect(await accessibleDescription(controlOf(rendered))).toBe(TEXT);
      expect(await harness.getDescription()).toBe(TEXT);

      await userEvent.tab();
      await userEvent.tab();
      expect(document.activeElement).toBe(controlOf(rendered));
      await shown();
      expect(await harness.getText()).toBe(TEXT);
      await userEvent.keyboard('{Escape}');
      await gone();
    });

    it('raises nothing on a focusable host, and no ARIA warning', async () => {
      await render();

      expect(warned(warn, 'WJ0153')).toBe(false);
      expect(warned(warn, 'WJ0003')).toBe(false);
    });
  });

  describe('safety and pass-through', () => {
    it('renders an HTML payload as text in the bubble and in the description', async () => {
      const rendered = await render((host) => {
        host.text.set(PAYLOAD);
      });
      await park(rendered);
      await userEvent.hover(hostOf(rendered));
      const bubble = await shown();

      expect(bubble.querySelector('.p-tooltip-text')?.textContent).toBe(PAYLOAD);
      expect(bubble.querySelector('img')).toBeNull();
      expect(descriptionEl(rendered)?.textContent).toBe(PAYLOAD);
      expect(descriptionEl(rendered)?.querySelector('img')).toBeNull();
      expect(Reflect.get(window, 'wjInjected')).toBeUndefined();
    });

    it('reaches root, arrow and text through pt', async () => {
      const rendered = await render((host) => {
        host.pt.set({
          root: { 'data-pt': 'root' },
          arrow: { 'data-pt': 'arrow' },
          text: { 'data-pt': 'text' },
        });
      });
      await park(rendered);
      await userEvent.hover(hostOf(rendered));
      const bubble = await shown();

      expect(bubble.getAttribute('data-pt')).toBe('root');
      expect(bubble.querySelector('.p-tooltip-arrow')?.getAttribute('data-pt')).toBe('arrow');
      expect(bubble.querySelector('.p-tooltip-text')?.getAttribute('data-pt')).toBe('text');
    });
  });

  describe('stacked overlays', () => {
    async function renderDialog(closable: boolean): Promise<ComponentFixture<DialogHost>> {
      TestBed.configureTestingModule({ providers: [provideWeeljack({ darkMode: 'class' })] });
      const fixture = TestBed.createComponent(DialogHost);
      fixture.componentInstance.closable.set(closable);
      await fixture.whenStable();
      await expect.poll(() => document.querySelector('#inside')).not.toBeNull();
      // Optimus Dialog moves focus in on a timer after it shows. Wait for that to land, or under
      // load it lands after the overlay above has opened and pulls focus out of it.
      await expect
        .poll(() => document.querySelector('[role="dialog"]')?.contains(document.activeElement))
        .toBe(true);
      return fixture;
    }

    async function closeDialog(fixture: ComponentFixture<DialogHost>): Promise<void> {
      fixture.componentInstance.visible.set(false);
      await fixture.whenStable();
      await expect.poll(() => document.querySelector('.p-dialog-mask')).toBeNull();
    }

    it('hides on Escape inside a non-closable dialog, which stays open', async () => {
      const fixture = await renderDialog(false);
      find(document, '#inside', HTMLElement).focus();
      await expect.poll(bubbleEl).not.toBeNull();
      await fixture.whenStable();

      await userEvent.keyboard('{Escape}');
      await gone();
      expect(fixture.componentInstance.visible()).toBe(true);
      expect(document.querySelector('.p-dialog-mask')).not.toBeNull();

      await userEvent.keyboard('{Escape}');
      expect(fixture.componentInstance.visible()).toBe(true);
      await closeDialog(fixture);
    });

    it('leaves a closable dialog open on that first Escape, and closes it on the next', async () => {
      const fixture = await renderDialog(true);
      find(document, '#inside', HTMLElement).focus();
      await expect.poll(bubbleEl).not.toBeNull();
      await fixture.whenStable();

      await userEvent.keyboard('{Escape}');
      await gone();
      expect(fixture.componentInstance.visible()).toBe(true);

      await userEvent.keyboard('{Escape}');
      await expect.poll(() => fixture.componentInstance.visible()).toBe(false);
      await closeDialog(fixture);
    });
  });

  describe('accessibility', () => {
    for (const scheme of ['light', 'dark'] as const) {
      describe(scheme, () => {
        it('has no axe violations hidden, on hover and on focus', async () => {
          const rendered = await render(() => undefined, scheme);
          await park(rendered);
          await expectNoAxeViolations();

          await userEvent.hover(hostOf(rendered));
          await shown();
          await expectNoAxeViolations();
          await park(rendered);
          await gone();

          await userEvent.tab();
          await userEvent.tab();
          await shown();
          await expectNoAxeViolations();
        });

        it('has none on a component host described through descriptionId', async () => {
          const rendered = await render((host) => {
            host.kind.set('bound');
          }, scheme);
          await park(rendered);
          await expectNoAxeViolations();
          await userEvent.tab();
          await userEvent.tab();
          await shown();
          await expectNoAxeViolations();
        });
      });
    }

    it('adds no hit box of its own: the host is the only target', async () => {
      const rendered = await render();
      const box = hostOf(rendered).getBoundingClientRect();

      expect(box.width).toBeGreaterThanOrEqual(24);
      expect(box.height).toBeGreaterThanOrEqual(24);
      expect(descriptionEl(rendered)?.getBoundingClientRect().width).toBe(0);
    });
  });
});
