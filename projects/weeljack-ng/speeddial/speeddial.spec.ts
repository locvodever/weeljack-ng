/// <reference types="@vitest/browser-playwright" />
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Component, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import type { MockInstance } from 'vitest';
import { cdp, page, userEvent } from 'vitest/browser';
import {
  provideWeeljack,
  type WjMenuItem,
  type WjMenuItemCommandEvent,
  type WjTranslation,
} from 'weeljack-ng';
import {
  WjSpeedDial,
  WjSpeedDialItemSlot,
  type WjSpeedDialDirection,
  type WjSpeedDialItemContext,
  type WjSpeedDialPt,
  type WjSpeedDialType,
} from 'weeljack-ng/speeddial';
import { WjSpeedDialHarness } from 'weeljack-ng/speeddial/testing';
import { expectNoAxeViolations } from '../spec-support/axe';

const PAYLOAD = '<img src=x onerror="window.wjInjected = true">';
const ROOT = document.documentElement;
const WJ0141 =
  'WJ0141: wj-speeddial: the speed dial has items but no wjSpeedDialItem template, so every action ' +
  "draws an empty button. Put an ng-template with wjSpeedDialItem inside wj-speeddial that draws the action's icon. " +
  'Find more at https://locvodever.github.io/weeljack-ng/errors/WJ0141';

const actions = (): WjMenuItem[] => [
  { label: 'Edit' },
  { label: 'Share' },
  { label: 'Download', disabled: true },
  { label: 'Copy link' },
];

type Anchor = 'corner' | 'flow';

/** A consumer's template: a button, a stage holding the dial, and a button after it. */
@Component({
  selector: 'wj-speeddial-host',
  imports: [WjSpeedDial, WjSpeedDialItemSlot],
  styles: `
    .stage {
      position: relative;
      inline-size: 100%;
      block-size: 24rem;
      color: var(--wj-text-color);
      background: var(--wj-content-hover-background);
    }

    /* Out of flow, anchored at the toggle's corner: the contract the docs give. */
    .corner {
      position: absolute;
      inset-block-end: 16px;
      inset-inline-end: 16px;
    }

    /* In flow, well inside the stage: nothing positions the host, so only Optimus's root can. */
    .flow {
      margin-block: 8rem 0;
      margin-inline: 8rem 0;
    }
  `,
  template: `
    <button id="before" type="button">Before</button>
    <p id="caption">Actions caption</p>
    <p id="notes">Press the toggle.</p>
    <div class="stage" id="stage">
      <wj-speeddial
        id="dial"
        [class]="anchor()"
        [model]="model()"
        [(visible)]="visible"
        [direction]="direction()"
        [type]="type()"
        [radius]="radius()"
        [disabled]="disabled()"
        [ariaLabel]="ariaLabel()"
        [ariaLabelledBy]="ariaLabelledBy()"
        [ariaDescribedBy]="ariaDescribedBy()"
        [pt]="pt()"
      >
        @if (withSlot()) {
          <ng-template wjSpeedDialItem let-item>
            <svg
              class="icon"
              aria-hidden="true"
              focusable="false"
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              [attr.data-label]="seen(item)"
            >
              <circle cx="8" cy="8" r="6" />
            </svg>
          </ng-template>
        }
      </wj-speeddial>
    </div>
    <button id="after" type="button">After</button>
  `,
})
class Host {
  readonly model = signal<WjMenuItem[]>(actions());
  readonly visible = signal(false);
  readonly direction = signal<WjSpeedDialDirection>('up');
  readonly type = signal<WjSpeedDialType>('linear');
  readonly radius = signal(0);
  readonly disabled = signal(false);
  readonly ariaLabel = signal<string | undefined>(undefined);
  readonly ariaLabelledBy = signal<string | undefined>(undefined);
  readonly ariaDescribedBy = signal<string | undefined>(undefined);
  readonly pt = signal<WjSpeedDialPt>(undefined);
  readonly withSlot = signal(true);
  readonly anchor = signal<Anchor>('corner');
  /** The items the slot template was given, in render order. */
  readonly given: WjMenuItem[] = [];

  /** Records the item a slot template was rendered for, and returns its label. */
  seen(item: WjSpeedDialItemContext['$implicit']): string {
    this.given.push(item);
    return item.label ?? '';
  }
}

/** A consumer who writes aria-* on the host. */
@Component({
  selector: 'wj-speeddial-aria-on-host-host',
  imports: [WjSpeedDial, WjSpeedDialItemSlot],
  template: `
    <wj-speeddial aria-label="Host label" [model]="model"
      ><ng-template wjSpeedDialItem
    /></wj-speeddial>
  `,
})
class AriaOnHostHost {
  readonly model = actions();
}

type Scheme = 'light' | 'dark';

interface Rendered {
  fixture: ComponentFixture<Host>;
  component: Host;
}

function find<E extends Element>(element: ParentNode, selector: string, type: new () => E): E {
  const found = element.querySelector(selector);
  if (!(found instanceof type)) {
    throw new Error(`${selector} is missing`);
  }
  return found;
}

const hostEl = (): HTMLElement => find(document, '#dial', HTMLElement);
const stageEl = (): HTMLElement => find(document, '#stage', HTMLElement);
const rootEl = (): HTMLElement => find(hostEl(), '[data-pc-name="speeddial"]', HTMLElement);
const toggleEl = (): HTMLButtonElement =>
  find(hostEl(), 'button[aria-haspopup]', HTMLButtonElement);
const listEl = (): HTMLElement => find(hostEl(), '[role="menu"]', HTMLElement);
const itemEls = (): HTMLElement[] =>
  Array.from(hostEl().querySelectorAll<HTMLElement>('[role="menuitem"]'));
const actionEls = (): HTMLButtonElement[] =>
  Array.from(hostEl().querySelectorAll<HTMLButtonElement>('li button'));
const itemEl = (label: string): HTMLElement => {
  const found = itemEls().find((item) => item.querySelector('button')?.ariaLabel === label);
  if (!found) {
    throw new Error(`no action named ${label}`);
  }
  return found;
};
const actionEl = (label: string): HTMLButtonElement =>
  find(itemEl(label), 'button', HTMLButtonElement);
const labels = (): string[] => actionEls().map((action) => action.ariaLabel ?? '');
const button = (id: 'before' | 'after'): HTMLElement => find(document, `#${id}`, HTMLElement);
const isOpen = (): boolean => toggleEl().getAttribute('aria-expanded') === 'true';
const activeLabel = (): string | null =>
  itemEls()
    .find((item) => item.getAttribute('data-p-active') === 'true')
    ?.querySelector('button')?.ariaLabel ?? null;
const centre = (element: Element): { x: number; y: number } => {
  const box = element.getBoundingClientRect();
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
};

/** Renders `Host` with `provideWeeljack` in `scheme`, after `setup`, and waits for the dial. */
async function render(
  setup: (host: Host) => void = () => undefined,
  scheme: Scheme = 'light',
  translation?: WjTranslation,
): Promise<Rendered> {
  ROOT.classList.toggle('wj-dark', scheme === 'dark');
  document.body.style.backgroundColor = 'var(--wj-content-background)';
  TestBed.configureTestingModule({
    providers: [provideWeeljack({ darkMode: 'class', ...(translation && { translation }) })],
  });
  const fixture = TestBed.createComponent(Host);
  setup(fixture.componentInstance);
  await fixture.whenStable();
  await expect.poll(() => document.querySelector('#dial [role="menu"]')).not.toBeNull();
  return { fixture, component: fixture.componentInstance };
}

const harnessOf = (fixture: ComponentFixture<unknown>): Promise<WjSpeedDialHarness> =>
  TestbedHarnessEnvironment.loader(fixture).getHarness(WjSpeedDialHarness);

/** Moves the pointer onto a neutral element, so a stray hover cannot change what a read sees. */
async function parkPointer(): Promise<void> {
  await userEvent.hover(button('after'));
}

/** Waits until the dial is open and its actions have grown in (Optimus fades them over 0.8 s). */
async function settled(): Promise<void> {
  await expect.poll(isOpen).toBe(true);
  await expect
    .poll(() => itemEls().every((item) => getComputedStyle(item).opacity === '1'))
    .toBe(true);
}

/** Opens the dial with a click on the toggle and waits for it. */
async function open(): Promise<void> {
  toggleEl().click();
  await settled();
}

/** Closes an open dial, so nothing is left open at teardown. */
async function closeDial(): Promise<void> {
  if (document.querySelector('#dial') && isOpen()) {
    toggleEl().click();
    await expect.poll(isOpen).toBe(false);
  }
}

/** Tabs from the button before the dial onto its toggle, with the pointer parked first. */
async function tabOntoToggle(): Promise<void> {
  await parkPointer();
  button('before').focus();
  await userEvent.tab();
  await expect.poll(() => document.activeElement).toBe(toggleEl());
}

interface FrameNode {
  frame: { id: string };
  childFrames?: FrameNode[];
}

/** The names of the `menuitem`s the browser exposes to assistive technology, in every frame. */
async function exposedMenuItems(): Promise<string[]> {
  const session = cdp();
  await session.send('Accessibility.enable');
  const { frameTree } = await session.send('Page.getFrameTree');
  const ids = (node: FrameNode): string[] => [
    node.frame.id,
    ...(node.childFrames ?? []).flatMap(ids),
  ];
  const names: string[] = [];
  for (const frameId of ids(frameTree)) {
    const { nodes } = await session.send('Accessibility.getFullAXTree', { frameId });
    for (const node of nodes) {
      if (node.role?.value === 'menuitem' && !node.ignored) {
        names.push(String(node.name?.value));
      }
    }
  }
  return names.sort();
}

/** The reduced-motion media rule that stops the dial's transitions, wherever its sheet sits. */
function reducedMotionRule(): CSSMediaRule {
  const found: CSSMediaRule[] = [];
  const walk = (rules: CSSRuleList): void => {
    for (const rule of Array.from(rules)) {
      if (
        found.length === 0 &&
        rule instanceof CSSMediaRule &&
        rule.conditionText.includes('prefers-reduced-motion') &&
        Array.from(rule.cssRules).some(
          (inner) => inner instanceof CSSStyleRule && inner.selectorText.includes('p-speeddial'),
        )
      ) {
        found.push(rule);
      }
      if (rule instanceof CSSGroupingRule) {
        walk(rule.cssRules);
      }
    }
  };
  for (const sheet of Array.from(document.styleSheets)) {
    walk(sheet.cssRules);
  }
  const [rule] = found;
  if (!rule) {
    throw new Error('the speed-dial reduced-motion rule is missing');
  }
  return rule;
}

/** The `@layer` names `target` sits inside. */
function layerOf(target: CSSRule): string[] {
  const chains: string[][] = [];
  const walk = (rules: CSSRuleList, path: string[]): void => {
    for (const rule of Array.from(rules)) {
      if (rule === target) {
        chains.push(path);
      }
      if (rule instanceof CSSGroupingRule) {
        walk(rule.cssRules, rule instanceof CSSLayerBlockRule ? [...path, rule.name] : path);
      }
    }
  };
  for (const sheet of Array.from(document.styleSheets)) {
    walk(sheet.cssRules, []);
  }
  return chains[0] ?? [];
}

/**
 * Runs `check` with the real reduced-motion media rule widened to `all` *in place*, so it keeps the
 * position it ships in. A CDP media emulation would change the shared browser page and every spec
 * file running beside this one. The condition is put back in `finally`.
 */
async function withReducedMotion(check: () => void | Promise<void>): Promise<void> {
  const { media } = reducedMotionRule();
  const original = media.mediaText;
  media.mediaText = 'all';
  try {
    await check();
  } finally {
    media.mediaText = original;
  }
}

/** Whether Optimus's part-function `context` says the item is hidden (it types only `instance`). */
function hiddenOf(options: unknown): string {
  if (typeof options === 'object' && options !== null && 'context' in options) {
    const { context } = options;
    if (typeof context === 'object' && context !== null && 'hidden' in context) {
      return String(context.hidden);
    }
  }
  return '';
}

/** A snapshot of the app's items that a mutation would change: own keys and values, per item. */
const snapshot = (model: WjMenuItem[]): string[] =>
  model.map((item) =>
    JSON.stringify(Object.entries(item).map(([key, value]) => [key, typeof value])),
  );

describe('WjSpeedDial', () => {
  let warn: MockInstance<typeof console.warn>;
  const viewport = { width: window.innerWidth, height: window.innerHeight };

  beforeEach(() => {
    warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(async () => {
    await closeDial();
    ROOT.classList.remove('wj-dark');
    document.body.style.backgroundColor = '';
    document.head.querySelectorAll('style[data-optimus-style-id]').forEach((style) => {
      style.remove();
    });
    Reflect.deleteProperty(window, 'wjInjected');
    await page.viewport(viewport.width, viewport.height);
  });

  describe('inputs', () => {
    it('model draws one named action per item in a role="menu" list, and follows a new array', async () => {
      const { fixture, component } = await render();

      expect(listEl().getAttribute('role')).toBe('menu');
      expect(labels()).toEqual(['Edit', 'Share', 'Download', 'Copy link']);
      expect(itemEls().every((item) => item.parentElement === listEl())).toBe(true);

      component.model.set([{ label: 'Print' }, { label: 'Export' }]);
      await fixture.whenStable();
      await expect.poll(labels).toEqual(['Print', 'Export']);
    });

    it('names the toggle "Actions" by default, and the harness reads the name', async () => {
      const { fixture } = await render();

      expect(toggleEl().getAttribute('aria-label')).toBe('Actions');
      expect(hostEl().hasAttribute('aria-label')).toBe(false);
      expect(await (await harnessOf(fixture)).getName()).toBe('Actions');
    });

    it('visible is two-way: it opens and closes the dial, and the dial writes it back', async () => {
      const { fixture, component } = await render();
      expect(isOpen()).toBe(false);

      component.visible.set(true);
      await fixture.whenStable();
      await settled();
      expect(rootEl().classList.contains('p-speeddial-open')).toBe(true);

      toggleEl().click();
      await expect.poll(() => component.visible()).toBe(false);
      await expect.poll(isOpen).toBe(false);

      toggleEl().click();
      await expect.poll(() => component.visible()).toBe(true);
    });

    it('direction and type reach Optimus, and the defaults are up and linear', async () => {
      const { fixture, component } = await render();
      expect(rootEl().classList.contains('p-speeddial-linear')).toBe(true);
      expect(rootEl().classList.contains('p-speeddial-direction-up')).toBe(true);

      component.type.set('semi-circle');
      component.direction.set('left');
      await fixture.whenStable();
      await expect.poll(() => rootEl().classList.contains('p-speeddial-semi-circle')).toBe(true);
      expect(rootEl().classList.contains('p-speeddial-direction-left')).toBe(true);
    });

    it('radius sets the circle: every action sits that far from the toggle', async () => {
      await render((host) => {
        host.type.set('circle');
        host.radius.set(100);
        host.anchor.set('flow');
      });
      await open();
      const toggle = centre(toggleEl());

      for (const action of actionEls()) {
        const point = centre(action);
        expect(Math.hypot(point.x - toggle.x, point.y - toggle.y)).toBeCloseTo(100, 0);
      }
    });

    it('radius 0 gives each action 20 px: 80 px for four', async () => {
      await render((host) => {
        host.type.set('circle');
        host.anchor.set('flow');
      });
      await open();
      const toggle = centre(toggleEl());

      for (const action of actionEls()) {
        const point = centre(action);
        expect(Math.hypot(point.x - toggle.x, point.y - toggle.y)).toBeCloseTo(80, 0);
      }
    });

    it('disabled makes the toggle inert, so the actions cannot open', async () => {
      const { fixture } = await render((host) => {
        host.disabled.set(true);
      });
      const dial = await harnessOf(fixture);

      expect(toggleEl().disabled).toBe(true);
      expect(await dial.isDisabled()).toBe(true);
      toggleEl().click();
      await fixture.whenStable();
      expect(isOpen()).toBe(false);
    });
  });

  describe('action bridge', () => {
    it('draws a named button with the slot’s icon for every action, and hands the slot the app’s own item', async () => {
      const model = actions();
      const { component } = await render((host) => {
        host.model.set(model);
      });

      expect(actionEls()).toHaveLength(4);
      for (const action of actionEls()) {
        expect(action.type).toBe('button');
        expect(action.classList.contains('p-speeddial-action')).toBe(true);
        expect(action.querySelector('svg.icon')).not.toBeNull();
      }
      expect(actionEls().map((action) => action.querySelector('svg')?.dataset['label'])).toEqual(
        labels(),
      );
      expect(new Set(component.given).size).toBe(4);
      expect(component.given.every((item) => model.includes(item))).toBe(true);
    });

    it('runs the command with the original event and the app’s own item, closes the dial and writes visible back', async () => {
      const run = vi.fn<(event: WjMenuItemCommandEvent) => void>();
      const share: WjMenuItem = { label: 'Share', command: run };
      const { component } = await render((host) => {
        host.model.set([{ label: 'Edit' }, share]);
      });
      await open();

      actionEl('Share').click();

      await expect.poll(() => run.mock.calls.length).toBe(1);
      const [event] = run.mock.calls[0] ?? [];
      expect(event?.item).toBe(share);
      expect(event?.originalEvent).toBeInstanceOf(MouseEvent);
      await expect.poll(isOpen).toBe(false);
      expect(component.visible()).toBe(false);
    });

    it('a disabled action is a disabled button that runs nothing, and the dial stays open', async () => {
      const run = vi.fn<(event: WjMenuItemCommandEvent) => void>();
      await render((host) => {
        host.model.set([
          { label: 'Edit', command: run },
          { label: 'Download', disabled: true },
        ]);
      });
      await open();

      expect(actionEl('Download').disabled).toBe(true);
      expect(actionEl('Edit').disabled).toBe(false);
      actionEl('Download').click();

      expect(run).not.toHaveBeenCalled();
      expect(isOpen()).toBe(true);
    });

    it('a disabled item never gets a command, even one the app wrote', async () => {
      const run = vi.fn<(event: WjMenuItemCommandEvent) => void>();
      await render((host) => {
        host.model.set([{ label: 'Edit' }, { label: 'Share', disabled: true, command: run }]);
      });
      await open();

      actionEl('Share').click();

      expect(run).not.toHaveBeenCalled();
    });

    it('draws 36 x 36 px actions with the 16 px icon centred, and a 44 x 44 px toggle', async () => {
      await render();
      const closed = toggleEl().getBoundingClientRect();
      expect([closed.width, closed.height]).toEqual([44, 44]);
      await open();

      for (const action of actionEls()) {
        const box = action.getBoundingClientRect();
        expect([box.width, box.height]).toEqual([36, 36]);
        const icon = find(action, 'svg', SVGSVGElement);
        expect([icon.getBoundingClientRect().width, icon.getBoundingClientRect().height]).toEqual([
          16, 16,
        ]);
        expect(Math.abs(centre(icon).x - centre(action).x)).toBeLessThan(1);
        expect(Math.abs(centre(icon).y - centre(action).y)).toBeLessThan(1);
      }
    });
  });

  describe('closed actions', () => {
    it('are inert and not in the accessibility tree while closed, and Tab goes from the toggle to the next control', async () => {
      await render();

      expect(itemEls().every((item) => item.hasAttribute('inert'))).toBe(true);
      expect(itemEls().every((item) => item.inert)).toBe(true);
      expect(await exposedMenuItems()).toEqual([]);

      await tabOntoToggle();
      await userEvent.tab();
      expect(document.activeElement).toBe(button('after'));
      await userEvent.tab({ shift: true });
      expect(document.activeElement).toBe(toggleEl());
    });

    it('are exposed, Tab stops and no longer inert while open, and inert again once closed', async () => {
      await render();
      await open();

      expect(itemEls().some((item) => item.hasAttribute('inert'))).toBe(false);
      expect(await exposedMenuItems()).toEqual(['Copy link', 'Download', 'Edit', 'Share']);

      await tabOntoToggle();
      await userEvent.tab();
      expect(document.activeElement).toBe(actionEl('Edit'));
      await userEvent.tab();
      expect(document.activeElement).toBe(actionEl('Share'));
      await userEvent.tab();
      // The disabled action is skipped.
      expect(document.activeElement).toBe(actionEl('Copy link'));
      await userEvent.tab();
      expect(document.activeElement).toBe(button('after'));

      toggleEl().click();
      await expect.poll(() => itemEls().every((item) => item.hasAttribute('inert'))).toBe(true);
      await expect.poll(exposedMenuItems).toEqual([]);
    });

    it('lose their dangling aria-controls, open and closed', async () => {
      await render();

      expect(itemEls().some((item) => item.hasAttribute('aria-controls'))).toBe(false);
      await open();
      expect(itemEls().some((item) => item.hasAttribute('aria-controls'))).toBe(false);
    });
  });

  describe('visible: false', () => {
    const run = vi.fn<(event: WjMenuItemCommandEvent) => void>();

    it('leaves the item out, and leaves the app’s array and items alone', async () => {
      const model: WjMenuItem[] = [
        { label: 'Edit' },
        { label: 'Hidden', visible: false },
        { label: 'Share' },
      ];
      const references = [...model];
      const before = snapshot(model);
      const { fixture } = await render((host) => {
        host.model.set(model);
      });
      const dial = await harnessOf(fixture);

      expect(labels()).toEqual(['Edit', 'Share']);
      expect(await dial.getItemLabels()).toEqual(['Edit', 'Share']);
      expect(model).toHaveLength(3);
      expect(model.every((item, index) => item === references[index])).toBe(true);
      expect(snapshot(model)).toEqual(before);
    });

    it('Enter on a rendered action runs that action, not the one at its position in the app’s array', async () => {
      run.mockClear();
      const other = vi.fn<(event: WjMenuItemCommandEvent) => void>();
      await render((host) => {
        host.model.set([
          { label: 'Edit', command: other },
          { label: 'Hidden', visible: false, command: other },
          { label: 'Share', command: run },
        ]);
      });
      await tabOntoToggle();
      await userEvent.keyboard('{ArrowDown}');
      await expect.poll(activeLabel).toBe('Edit');
      await userEvent.keyboard('{ArrowUp}');
      await expect.poll(activeLabel).toBe('Share');

      await userEvent.keyboard('{Enter}');

      await expect.poll(() => run.mock.calls.length).toBe(1);
      expect(other).not.toHaveBeenCalled();
    });

    it('draws the toggle alone when every item is hidden, and opens onto nothing', async () => {
      const { fixture } = await render((host) => {
        host.model.set([{ label: 'Hidden', visible: false }]);
      });
      const dial = await harnessOf(fixture);

      expect(await dial.getItemLabels()).toEqual([]);
      await dial.open();
      expect(await dial.isOpen()).toBe(true);
      expect(await exposedMenuItems()).toEqual([]);
    });
  });

  describe('ARIA', () => {
    it('ariaLabel names the toggle, not the host, and replaces the default', async () => {
      const { fixture } = await render((host) => {
        host.ariaLabel.set('Document actions');
      });

      expect(toggleEl().getAttribute('aria-label')).toBe('Document actions');
      expect(hostEl().hasAttribute('aria-label')).toBe(false);
      expect(await (await harnessOf(fixture)).getName()).toBe('Document actions');
    });

    it('ariaLabelledBy names the toggle from visible text', async () => {
      const { fixture } = await render((host) => {
        host.ariaLabelledBy.set('caption');
      });

      expect(toggleEl().getAttribute('aria-labelledby')).toBe('caption');
      expect(await (await harnessOf(fixture)).getName()).toBe('Actions caption');
    });

    it('ariaDescribedBy lands on the toggle through the pcButton part, and is removed again', async () => {
      const { fixture, component } = await render((host) => {
        host.ariaDescribedBy.set('notes');
      });

      expect(toggleEl().getAttribute('aria-describedby')).toBe('notes');
      expect(hostEl().hasAttribute('aria-describedby')).toBe(false);

      component.ariaDescribedBy.set(undefined);
      await fixture.whenStable();
      await expect.poll(() => toggleEl().hasAttribute('aria-describedby')).toBe(false);
    });

    it('finds a dial by its name', async () => {
      const { fixture } = await render();
      const loader = TestbedHarnessEnvironment.loader(fixture);

      expect(
        await loader.getAllHarnesses(WjSpeedDialHarness.with({ name: 'Actions' })),
      ).toHaveLength(1);
      expect(
        await loader.getAllHarnesses(WjSpeedDialHarness.with({ name: /^Other/ })),
      ).toHaveLength(0);
    });

    it('reads the app’s translation for the default name, and falls back to English for the rest', async () => {
      await render(undefined, 'light', { wj: { actions: 'Thao tác' } });

      expect(toggleEl().getAttribute('aria-label')).toBe('Thao tác');
    });

    it('warns WJ0003 once for aria-* on the host, and does not forward it', async () => {
      TestBed.configureTestingModule({ providers: [provideWeeljack()] });
      const fixture = TestBed.createComponent(AriaOnHostHost);
      await fixture.whenStable();
      await expect.poll(() => warn.mock.calls.length).toBeGreaterThan(0);

      const calls = warn.mock.calls.filter(([message]) => String(message).startsWith('WJ0003'));
      expect(calls).toHaveLength(1);
      expect(String(calls[0]?.[0])).toContain('WJ0003: wj-speeddial:');
      await expect.poll(() => document.querySelector('button[aria-haspopup]')).not.toBeNull();
      expect(document.querySelector('button[aria-haspopup]')?.getAttribute('aria-label')).toBe(
        'Actions',
      );
    });

    it('warns WJ0001 when provideWeeljack is missing', async () => {
      const fixture = TestBed.createComponent(AriaOnHostHost);
      await fixture.whenStable();

      expect(
        warn.mock.calls.some(([message]) => String(message).startsWith('WJ0001: wj-speeddial:')),
      ).toBe(true);
    });
  });

  describe('pt', () => {
    it('lands part attributes from an object: the toggle, the list, the root and every item, beside the routed ones', async () => {
      await render((host) => {
        host.ariaDescribedBy.set('notes');
        host.pt.set({
          root: { 'data-consumer': 'root' },
          pcButton: { root: { 'data-consumer': 'toggle' } },
          list: { 'data-consumer': 'list' },
          item: { 'data-consumer': 'item' },
        });
      });

      expect(rootEl().getAttribute('data-consumer')).toBe('root');
      expect(toggleEl().getAttribute('data-consumer')).toBe('toggle');
      expect(toggleEl().getAttribute('aria-describedby')).toBe('notes');
      expect(listEl().getAttribute('data-consumer')).toBe('list');
      expect(itemEls().map((item) => item.getAttribute('data-consumer'))).toEqual(
        Array.from({ length: 4 }, () => 'item'),
      );
      // The wrapper's own item attributes are still there beside the consumer's.
      expect(itemEls().every((item) => item.hasAttribute('inert'))).toBe(true);
      expect(itemEls().some((item) => item.hasAttribute('aria-controls'))).toBe(false);
    });

    it('lands them from the function form too, with a per-item function that reads Optimus’s own context, closed and open', async () => {
      await render((host) => {
        host.ariaDescribedBy.set('notes');
        host.pt.set(() => ({
          pcButton: { root: { 'data-consumer': 'toggle' } },
          item: (options) => ({ 'data-hidden': hiddenOf(options) }),
        }));
      });

      expect(toggleEl().getAttribute('data-consumer')).toBe('toggle');
      expect(toggleEl().getAttribute('aria-describedby')).toBe('notes');
      expect(itemEls().map((item) => item.getAttribute('data-hidden'))).toEqual(
        Array.from({ length: 4 }, () => 'true'),
      );
      expect(itemEls().every((item) => item.inert)).toBe(true);

      await open();
      expect(itemEls().map((item) => item.getAttribute('data-hidden'))).toEqual(
        Array.from({ length: 4 }, () => 'false'),
      );
      expect(itemEls().some((item) => item.inert)).toBe(false);
      expect(itemEls().some((item) => item.hasAttribute('aria-controls'))).toBe(false);
    });

    it('keeps a string item part as a class list beside the inert fix', async () => {
      await render((host) => {
        host.pt.set({ item: 'consumer-item' });
      });

      expect(itemEls().every((item) => item.classList.contains('consumer-item'))).toBe(true);
      expect(itemEls().every((item) => item.inert)).toBe(true);
    });

    it('lets the routed description win over a pt aria-describedby on the toggle', async () => {
      await render((host) => {
        host.ariaDescribedBy.set('notes');
        host.pt.set({ pcButton: { root: { 'aria-describedby': 'caption' } } });
      });

      expect(toggleEl().getAttribute('aria-describedby')).toBe('notes');
    });

    it('keeps a pt aria-describedby on the toggle when ariaDescribedBy is not set', async () => {
      await render((host) => {
        host.pt.set({ pcButton: { root: { 'aria-describedby': 'caption' } } });
      });

      expect(toggleEl().getAttribute('aria-describedby')).toBe('caption');
    });

    it('reaches no bridge action through pcAction: the wrapper draws the action itself', async () => {
      await render((host) => {
        host.pt.set({ pcAction: { root: { 'data-consumer': 'action' } } });
      });

      expect(actionEls().some((action) => action.hasAttribute('data-consumer'))).toBe(false);
    });
  });

  describe('item slot', () => {
    it('gives each template the app’s own item', async () => {
      const model = actions();
      const { component } = await render((host) => {
        host.model.set(model);
      });

      expect(component.given.slice(0, 4)).toEqual(model);
      expect(component.given.slice(0, 4).every((item, index) => item === model[index])).toBe(true);
    });

    it('does not notice a slot that appears after creation: Optimus’s own empty buttons stay', async () => {
      const { fixture, component } = await render((host) => {
        host.withSlot.set(false);
      });
      expect(actionEls()).toHaveLength(4);
      expect(hostEl().querySelector('svg.icon')).toBeNull();

      component.withSlot.set(true);
      await fixture.whenStable();

      expect(hostEl().querySelector('svg.icon')).toBeNull();
    });
  });

  describe('WJ0141', () => {
    it('warns once, with the exact text, when the dial has items and no slot', async () => {
      await render((host) => {
        host.withSlot.set(false);
      });

      const calls = warn.mock.calls.filter(([message]) => String(message).startsWith('WJ0141'));
      expect(calls).toHaveLength(1);
      expect(String(calls[0]?.[0])).toBe(WJ0141);
    });

    it('stays silent with the slot', async () => {
      await render();

      expect(warn.mock.calls.some(([message]) => String(message).startsWith('WJ0141'))).toBe(false);
    });

    it('stays silent when the model has no items', async () => {
      await render((host) => {
        host.withSlot.set(false);
        host.model.set([]);
      });

      expect(warn.mock.calls.some(([message]) => String(message).startsWith('WJ0141'))).toBe(false);
    });
  });

  describe('app data', () => {
    it('never changes the app’s array or items: no id, escape or expanded, through clicks and keys', async () => {
      const run = vi.fn<(event: WjMenuItemCommandEvent) => void>();
      const model: WjMenuItem[] = [
        { label: 'Edit', command: run },
        { label: 'Hidden', visible: false },
        { label: 'Download', disabled: true },
        { label: 'Share', command: run },
      ];
      const before = snapshot(model);
      const references = [...model];
      await render((host) => {
        host.model.set(model);
      });
      await open();
      actionEl('Edit').click();
      await expect.poll(() => run.mock.calls.length).toBe(1);
      await tabOntoToggle();
      await userEvent.keyboard('{ArrowDown}');
      await expect.poll(activeLabel).toBe('Edit');
      await userEvent.keyboard('{End}');
      await expect.poll(activeLabel).toBe('Share');
      await userEvent.keyboard('{Enter}');
      await expect.poll(() => run.mock.calls.length).toBe(2);

      expect(model).toHaveLength(4);
      expect(model.every((item, index) => item === references[index])).toBe(true);
      expect(snapshot(model)).toEqual(before);
      for (const item of model) {
        for (const key of ['id', 'escape', 'expanded']) {
          expect(key in item).toBe(false);
        }
      }
    });
  });

  describe('rendering safety', () => {
    const expectText = (): void => {
      expect(document.querySelector('img')).toBeNull();
      expect(Reflect.get(window, 'wjInjected')).toBeUndefined();
    };

    it('renders a label as attribute text, never as HTML', async () => {
      await render((host) => {
        host.model.set([{ label: PAYLOAD }, { label: 'Other' }]);
      });
      await open();

      expect(actionEls()[0]?.getAttribute('aria-label')).toBe(PAYLOAD);
      expectText();
    });

    it('renders ariaLabel, ariaLabelledBy and ariaDescribedBy as attribute text', async () => {
      await render((host) => {
        host.ariaLabel.set(PAYLOAD);
        host.ariaLabelledBy.set(PAYLOAD);
        host.ariaDescribedBy.set(PAYLOAD);
      });

      expect(toggleEl().getAttribute('aria-label')).toBe(PAYLOAD);
      expect(toggleEl().getAttribute('aria-labelledby')).toBe(PAYLOAD);
      expect(toggleEl().getAttribute('aria-describedby')).toBe(PAYLOAD);
      expectText();
    });

    it('renders as text an object that also carries escape: false, styleClass, tooltipOptions and icon, with no tooltip on hover or focus', async () => {
      const wider = {
        label: PAYLOAD,
        escape: false,
        styleClass: 'smuggled',
        icon: 'pi pi-smuggled',
        tooltipOptions: { escape: false },
      };
      const smuggled: WjMenuItem = wider;
      const { fixture } = await render((host) => {
        host.model.set([smuggled]);
      });
      await open();

      expect(actionEls()[0]?.getAttribute('aria-label')).toBe(PAYLOAD);
      expect(itemEls()[0]?.classList.contains('smuggled')).toBe(false);
      expect(document.querySelector('.pi-smuggled')).toBeNull();

      await userEvent.hover(actionEl(PAYLOAD));
      actionEl(PAYLOAD).focus();
      await fixture.whenStable();
      expect(document.querySelector('.p-tooltip')).toBeNull();
      expect(document.querySelector('[role="tooltip"]')).toBeNull();
      expectText();
    });
  });

  describe('motion', () => {
    it('stops the actions’, the toggle’s and the list’s transitions under reduced motion, in the wj layer, and only then', async () => {
      await render();
      const item = itemEls()[0];
      const list = listEl();
      const toggle = toggleEl();
      if (!item) {
        throw new Error('no action');
      }
      const outside = {
        item: getComputedStyle(item).transitionDuration,
        toggle: getComputedStyle(toggle).transitionDuration,
        list: getComputedStyle(list).transitionDelay,
      };

      expect(outside.item).toBe('0.2s, 0.8s');
      expect(outside.toggle.split(', ')).toContain('0.25s');
      expect(outside.list).toBe('0.2s');
      expect(layerOf(reducedMotionRule())).toEqual(['wj']);
      await withReducedMotion(() => {
        expect(getComputedStyle(item).transitionDuration).toBe('0s');
        expect(getComputedStyle(item).transitionProperty).not.toBe('all');
        expect(getComputedStyle(toggle).transitionDuration).toBe('0s');
        expect(getComputedStyle(list).transitionDelay).toBe('0s');
      });

      // The condition is back: Optimus's own values hold again, so nothing leaked past the proof.
      expect(getComputedStyle(item).transitionDuration).toBe(outside.item);
      expect(getComputedStyle(toggle).transitionDuration).toBe(outside.toggle);
      expect(getComputedStyle(list).transitionDelay).toBe(outside.list);
    });

    it('opens in one frame under reduced motion: the actions are fully shown as soon as the page has updated', async () => {
      const { fixture } = await render();
      const opacities = (): string[] => itemEls().map((item) => getComputedStyle(item).opacity);
      const openAndRead = async (): Promise<string[]> => {
        toggleEl().click();
        await fixture.whenStable();
        return opacities();
      };

      // The closed style is read first, so the browser has a "before" to transition from.
      expect(opacities()).toEqual(Array.from({ length: 4 }, () => '0'));
      // Control: with Optimus's own 0.8 s fade, the actions have only begun to appear.
      expect((await openAndRead()).every((opacity) => opacity === '1')).toBe(false);
      await settled();
      await closeDial();
      await expect.poll(() => opacities().every((opacity) => opacity === '0')).toBe(true);

      await withReducedMotion(async () => {
        expect(await openAndRead()).toEqual(Array.from({ length: 4 }, () => '1'));
        expect(getComputedStyle(toggleEl()).transform).not.toBe('none');
        await closeDial();
      });
    });

    it.each<Scheme>(['light', 'dark'])(
      'has no axe violations with the rule applied, open: %s',
      async (scheme) => {
        await render(undefined, scheme);

        await withReducedMotion(async () => {
          await open();
          await expectNoAxeViolations(stageEl());
        });
      },
    );
  });

  describe('layout', () => {
    const circles: [WjSpeedDialType, WjSpeedDialDirection][] = [
      ['circle', 'up'],
      ['circle', 'left'],
      ['circle', 'down'],
      ['circle', 'right'],
      ['semi-circle', 'up'],
      ['semi-circle', 'down'],
      ['semi-circle', 'left'],
      ['semi-circle', 'right'],
      ['quarter-circle', 'up-left'],
      ['quarter-circle', 'up-right'],
      ['quarter-circle', 'down-left'],
      ['quarter-circle', 'down-right'],
    ];

    it.each(circles)(
      'centres the %s actions on the toggle within 1 px: direction %s, a host nothing positions',
      async (type, direction) => {
        await render((host) => {
          host.type.set(type);
          host.direction.set(direction);
          host.anchor.set('flow');
        });
        await open();
        const toggle = centre(toggleEl());

        // Every action sits on one circle around the toggle: four actions at 20 px each.
        for (const action of actionEls()) {
          const point = centre(action);
          expect(Math.abs(Math.hypot(point.x - toggle.x, point.y - toggle.y) - 80)).toBeLessThan(1);
        }
        if (type === 'circle') {
          const points = actionEls().map(centre);
          const mean = {
            x: points.reduce((sum, point) => sum + point.x, 0) / points.length,
            y: points.reduce((sum, point) => sum + point.y, 0) / points.length,
          };
          expect(Math.abs(mean.x - toggle.x)).toBeLessThan(1);
          expect(Math.abs(mean.y - toggle.y)).toBeLessThan(1);
        }
        // The Optimus root is the box the actions are placed against: as big as the toggle.
        const box = rootEl().getBoundingClientRect();
        expect([box.width, box.height]).toEqual([44, 44]);
        expect(getComputedStyle(rootEl()).position).toBe('relative');
      },
    );

    it('places the actions of a linear dial in a line from the toggle, 8 px apart, on its axis', async () => {
      await render();
      await open();
      const toggle = centre(toggleEl());
      const points = actionEls().map(centre);

      // Up: above the toggle, one column, nearest first in the DOM order, 36 + 8 px apart.
      expect(points.every((point) => Math.abs(point.x - toggle.x) < 1)).toBe(true);
      expect(points.every((point) => point.y < toggle.y)).toBe(true);
      const ys = points.map((point) => point.y).sort((a, b) => b - a);
      for (let index = 1; index < ys.length; index += 1) {
        expect(Math.abs((ys[index - 1] ?? 0) - (ys[index] ?? 0) - 44)).toBeLessThan(1);
      }
    });
  });

  describe('keyboard focus ring', () => {
    it('draws the preset ring on the active action and on no other', async () => {
      await render();
      const probe = document.createElement('i');
      probe.style.color = 'var(--wj-focus-ring-color)';
      document.body.append(probe);
      const ring = getComputedStyle(probe).color;
      probe.remove();
      await tabOntoToggle();
      await userEvent.keyboard('{ArrowDown}');
      await expect.poll(activeLabel).toBe('Edit');
      await settled();

      const active = getComputedStyle(actionEl('Edit'));
      expect([active.outlineStyle, active.outlineWidth, active.outlineOffset]).toEqual([
        'solid',
        '2px',
        '2px',
      ]);
      expect(active.outlineColor).toBe(ring);
      for (const label of ['Share', 'Download', 'Copy link']) {
        expect(getComputedStyle(actionEl(label)).outlineStyle).toBe('none');
      }

      await userEvent.keyboard('{ArrowUp}');
      await expect.poll(activeLabel).toBe('Share');
      expect(getComputedStyle(actionEl('Edit')).outlineStyle).toBe('none');
      expect(getComputedStyle(actionEl('Share')).outlineStyle).toBe('solid');
    });
  });

  describe('accessibility', () => {
    describe.each<Scheme>(['light', 'dark'])('%s', (scheme) => {
      it('has no axe violations: closed', async () => {
        await render(undefined, scheme);

        await expectNoAxeViolations(stageEl());
      });

      it('has no axe violations: open, linear, direction up', async () => {
        await render(undefined, scheme);
        await open();

        await expectNoAxeViolations(stageEl());
      });

      it('has no axe violations: open, type circle', async () => {
        await render((host) => {
          host.type.set('circle');
          host.anchor.set('flow');
        }, scheme);
        await open();

        await expectNoAxeViolations(stageEl());
      });

      it('has no axe violations: open, direction left', async () => {
        await render((host) => {
          host.direction.set('left');
        }, scheme);
        await open();

        await expectNoAxeViolations(stageEl());
      });

      it('has no axe violations: a disabled action', async () => {
        await render((host) => {
          host.model.set([{ label: 'Edit' }, { label: 'Download', disabled: true }]);
        }, scheme);
        await open();

        await expectNoAxeViolations(stageEl());
      });

      it('has no axe violations: the whole dial disabled', async () => {
        await render((host) => {
          host.disabled.set(true);
        }, scheme);

        await expectNoAxeViolations(stageEl());
      });

      it('has no axe violations: an action active from the keyboard', async () => {
        await render(undefined, scheme);
        await tabOntoToggle();
        await userEvent.keyboard('{ArrowDown}');
        await expect.poll(activeLabel).toBe('Edit');
        await settled();

        await expectNoAxeViolations(stageEl());
      });

      it('has no axe violations: a named toggle, described and labelled by the page', async () => {
        await render((host) => {
          host.ariaLabelledBy.set('caption');
          host.ariaDescribedBy.set('notes');
        }, scheme);

        await expectNoAxeViolations(stageEl());
      });
    });
  });

  describe('keyboard', () => {
    it('Tab focuses the toggle, and Shift+Tab leaves it', async () => {
      await render();
      await tabOntoToggle();

      await userEvent.tab({ shift: true });

      expect(document.activeElement).toBe(button('before'));
    });

    it('Enter and Space open and close the dial from the toggle', async () => {
      await render();
      await tabOntoToggle();

      await userEvent.keyboard('{Enter}');
      await settled();
      await userEvent.keyboard('{Enter}');
      await expect.poll(isOpen).toBe(false);

      await userEvent.keyboard(' ');
      await settled();
      await userEvent.keyboard(' ');
      await expect.poll(isOpen).toBe(false);
      expect(document.activeElement).toBe(toggleEl());
    });

    it.each<[string, string]>([
      ['ArrowDown', 'Edit'],
      ['ArrowLeft', 'Edit'],
    ])(
      '%s on the toggle opens the dial, moves focus to the list and activates the first action',
      async (key, first) => {
        await render();
        await tabOntoToggle();

        await userEvent.keyboard(`{${key}}`);

        await settled();
        await expect.poll(activeLabel).toBe(first);
        expect(document.activeElement).toBe(listEl());
        expect(listEl().getAttribute('aria-activedescendant')).toBe(itemEl(first).id);
      },
    );

    it.each<[string]>([['ArrowUp'], ['ArrowRight']])(
      'pins Optimus: the very first %s on a fresh toggle opens the dial and activates nothing, and the next one on the list starts from the first',
      async (key) => {
        await render();
        await tabOntoToggle();

        await userEvent.keyboard(`{${key}}`);

        await settled();
        expect(document.activeElement).toBe(listEl());
        expect(activeLabel()).toBeNull();
        expect(listEl().hasAttribute('aria-activedescendant')).toBe(false);

        await userEvent.keyboard(`{${key}}`);
        await expect.poll(activeLabel).toBe('Edit');
      },
    );

    it('pins Optimus: once the list has lost focus, the first ArrowUp on the toggle steps back from the end', async () => {
      await render();
      await tabOntoToggle();
      await userEvent.keyboard('{ArrowDown}');
      await expect.poll(activeLabel).toBe('Edit');
      await userEvent.keyboard('{Escape}');
      await expect.poll(isOpen).toBe(false);
      await expect.poll(() => listEl().hasAttribute('aria-activedescendant')).toBe(false);

      // Optimus resets its position to "none" on blur, and from there the first step back is the last.
      await userEvent.keyboard('{ArrowUp}');
      await expect.poll(activeLabel).toBe('Copy link');
    });

    it.each<[WjSpeedDialDirection, string, string]>([
      ['up', 'ArrowUp', 'ArrowDown'],
      ['down', 'ArrowDown', 'ArrowUp'],
      ['left', 'ArrowLeft', 'ArrowRight'],
      ['right', 'ArrowRight', 'ArrowLeft'],
    ])(
      'on the list, with direction %s, %s moves to the next action and %s back, stopping at both ends',
      async (direction, forward, back) => {
        await render((host) => {
          host.direction.set(direction);
        });
        await tabOntoToggle();
        await userEvent.keyboard('{ArrowDown}');
        await expect.poll(activeLabel).toBe('Edit');

        await userEvent.keyboard(`{${back}}`);
        await expect.poll(activeLabel).toBe('Edit');
        await userEvent.keyboard(`{${forward}}`);
        await expect.poll(activeLabel).toBe('Share');
        await userEvent.keyboard(`{${back}}`);
        await expect.poll(activeLabel).toBe('Edit');
        for (let step = 0; step < 5; step += 1) {
          await userEvent.keyboard(`{${forward}}`);
        }
        await expect.poll(activeLabel).toBe('Copy link');
      },
    );

    it('Home and End go to the first and last action', async () => {
      await render();
      await tabOntoToggle();
      await userEvent.keyboard('{ArrowDown}');
      await expect.poll(activeLabel).toBe('Edit');

      await userEvent.keyboard('{End}');
      await expect.poll(activeLabel).toBe('Copy link');
      await userEvent.keyboard('{Home}');
      await expect.poll(activeLabel).toBe('Edit');
    });

    it('pins Optimus: the arrows also land on a disabled action, which runs nothing', async () => {
      const run = vi.fn<(event: WjMenuItemCommandEvent) => void>();
      await render((host) => {
        host.model.set([
          { label: 'Edit', command: run },
          { label: 'Share', command: run },
          { label: 'Download', disabled: true, command: run },
        ]);
      });
      await tabOntoToggle();
      await userEvent.keyboard('{ArrowDown}');
      await expect.poll(activeLabel).toBe('Edit');
      await userEvent.keyboard('{ArrowUp}{ArrowUp}');
      await expect.poll(activeLabel).toBe('Download');

      await userEvent.keyboard('{Enter}');

      await expect.poll(() => document.activeElement).toBe(toggleEl());
      expect(run).not.toHaveBeenCalled();
    });

    it('Enter runs the active action and puts focus back on the toggle', async () => {
      const run = vi.fn<(event: WjMenuItemCommandEvent) => void>();
      const edit: WjMenuItem = { label: 'Edit', command: run };
      await render((host) => {
        host.model.set([edit, { label: 'Share' }]);
      });
      await tabOntoToggle();
      await userEvent.keyboard('{ArrowDown}');
      await expect.poll(activeLabel).toBe('Edit');

      await userEvent.keyboard('{Enter}');

      await expect.poll(() => run.mock.calls.length).toBe(1);
      expect(run.mock.calls[0]?.[0].item).toBe(edit);
      expect(document.activeElement).toBe(toggleEl());
    });

    it('pins Optimus: Enter on the list moves focus to the toggle during keydown, so its click opens the dial again', async () => {
      await render();
      await tabOntoToggle();
      await userEvent.keyboard('{ArrowDown}');
      await expect.poll(activeLabel).toBe('Edit');

      await userEvent.keyboard('{Enter}');

      await expect.poll(() => document.activeElement).toBe(toggleEl());
      await settled();
      expect(isOpen()).toBe(true);
    });

    it('Space runs the active action, closes the dial and puts focus back on the toggle', async () => {
      const run = vi.fn<(event: WjMenuItemCommandEvent) => void>();
      await render((host) => {
        host.model.set([{ label: 'Edit', command: run }, { label: 'Share' }]);
      });
      await tabOntoToggle();
      await userEvent.keyboard('{ArrowDown}');
      await expect.poll(activeLabel).toBe('Edit');

      await userEvent.keyboard(' ');

      await expect.poll(() => run.mock.calls.length).toBe(1);
      await expect.poll(isOpen).toBe(false);
      expect(document.activeElement).toBe(toggleEl());
    });

    it.each<[string, string]>([
      ['Enter', '{Enter}'],
      ['Space', ' '],
    ])(
      'pins Optimus: %s on an action reached with Tab runs nothing, because Optimus’s list takes the key and moves focus to the toggle',
      async (_name, key) => {
        const run = vi.fn<(event: WjMenuItemCommandEvent) => void>();
        await render((host) => {
          host.model.set([{ label: 'Edit', command: run }, { label: 'Share' }]);
        });
        await open();
        await tabOntoToggle();
        await userEvent.tab();
        expect(document.activeElement).toBe(actionEl('Edit'));

        await userEvent.keyboard(key);

        await expect.poll(() => document.activeElement).toBe(toggleEl());
        expect(run).not.toHaveBeenCalled();
      },
    );

    it('a click on a Tab-focused action does run it', async () => {
      const run = vi.fn<(event: WjMenuItemCommandEvent) => void>();
      await render((host) => {
        host.model.set([{ label: 'Edit', command: run }, { label: 'Share' }]);
      });
      await open();
      await tabOntoToggle();
      await userEvent.tab();

      await userEvent.click(actionEl('Edit'));

      await expect.poll(() => run.mock.calls.length).toBe(1);
      await expect.poll(isOpen).toBe(false);
    });

    it('Escape closes the dial from the toggle and from the list, with focus on the toggle', async () => {
      await render();
      await tabOntoToggle();
      await userEvent.keyboard('{Enter}');
      await settled();
      await userEvent.keyboard('{Escape}');
      await expect.poll(isOpen).toBe(false);
      expect(document.activeElement).toBe(toggleEl());

      await userEvent.keyboard('{ArrowDown}');
      await settled();
      expect(document.activeElement).toBe(listEl());
      await userEvent.keyboard('{Escape}');
      await expect.poll(isOpen).toBe(false);
      expect(document.activeElement).toBe(toggleEl());
    });

    it('does not open from the keyboard while the whole dial is disabled', async () => {
      await render((host) => {
        host.disabled.set(true);
      });
      await parkPointer();
      button('before').focus();
      await userEvent.tab();

      expect(document.activeElement).toBe(button('after'));
      expect(isOpen()).toBe(false);
    });
  });

  describe('harness', () => {
    it('reads and drives the dial as a user would', async () => {
      const run = vi.fn<(event: WjMenuItemCommandEvent) => void>();
      const { fixture } = await render((host) => {
        host.model.set([
          { label: 'Edit', command: run },
          { label: 'Download', disabled: true },
        ]);
      });
      const dial = await harnessOf(fixture);

      expect(await dial.isOpen()).toBe(false);
      expect(await dial.isDisabled()).toBe(false);
      expect(await dial.getItemLabels()).toEqual(['Edit', 'Download']);

      await dial.toggle();
      expect(await dial.isOpen()).toBe(true);
      await dial.open();
      expect(await dial.isOpen()).toBe(true);
      await dial.close();
      expect(await dial.isOpen()).toBe(false);
      await dial.close();
      expect(await dial.isOpen()).toBe(false);
    });

    it('finds actions by label, reads their state, and clicks one, opening the dial first', async () => {
      const run = vi.fn<(event: WjMenuItemCommandEvent) => void>();
      const { fixture } = await render((host) => {
        host.model.set([
          { label: 'Edit', command: run },
          { label: 'Download', disabled: true },
        ]);
      });
      const dial = await harnessOf(fixture);

      const [download] = await dial.getItems({ label: 'Download' });
      expect(await download?.getLabel()).toBe('Download');
      expect(await download?.isDisabled()).toBe(true);
      expect(await dial.getItems({ label: /^Ed/ })).toHaveLength(1);

      await dial.clickItem('Edit');

      expect(run).toHaveBeenCalledTimes(1);
      await expect.poll(() => dial.isOpen()).toBe(false);
      await expect(dial.clickItem('Missing')).rejects.toThrow(/no action with the label/);
    });

    it('reports the active action and moves focus to the toggle', async () => {
      const { fixture } = await render();
      const dial = await harnessOf(fixture);

      await dial.focusToggle();
      expect(document.activeElement).toBe(toggleEl());
      await userEvent.keyboard('{ArrowDown}');
      await settled();
      const [edit, share] = await dial.getItems();

      expect(await edit?.isActive()).toBe(true);
      expect(await share?.isActive()).toBe(false);
    });
  });
});
