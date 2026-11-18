/// <reference types="@vitest/browser-playwright" />
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Component, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import type { MockInstance } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { provideWeeljack, type WjMenuItem, type WjMenuItemCommandEvent } from 'weeljack-ng';
import {
  WjDock,
  WjDockItemSlot,
  type WjDockItemContext,
  type WjDockPosition,
  type WjDockPt,
} from 'weeljack-ng/dock';
import { WjDockHarness } from 'weeljack-ng/dock/testing';
import { expectNoAxeViolations } from '../spec-support/axe';

const PAYLOAD = '<img src=x onerror="window.wjInjected = true">';
const ROOT = document.documentElement;
const WJ0140 =
  'WJ0140: wj-dock: the dock has items but no wjDockItem template, so every item draws an empty ' +
  "tile. Put an ng-template with wjDockItem inside wj-dock that draws the item's icon. " +
  'Find more at https://locvodever.github.io/weeljack-ng/errors/WJ0140';

const apps = (): WjMenuItem[] => [
  { label: 'Home' },
  { label: 'Search' },
  { label: 'Mail' },
  { label: 'Settings' },
];

/** A consumer's template: a button, a stage holding the dock, and a button after it. */
@Component({
  selector: 'wj-dock-host',
  imports: [WjDock, WjDockItemSlot],
  styles: `
    .stage {
      position: relative;
      inline-size: 100%;
      block-size: 16rem;
      color: var(--wj-text-color);
      background: var(--wj-content-hover-background);
    }
  `,
  template: `
    <button id="before" type="button">Before</button>
    <p id="caption">Apps</p>
    <p id="notes">Use the arrow keys.</p>
    <div class="stage" id="stage">
      <wj-dock
        id="dock"
        [model]="model()"
        [position]="position()"
        [ariaLabel]="ariaLabel()"
        [ariaLabelledBy]="ariaLabelledBy()"
        [ariaDescribedBy]="ariaDescribedBy()"
        [pt]="pt()"
      >
        @if (withSlot()) {
          <ng-template wjDockItem let-item>
            <svg
              class="icon"
              aria-hidden="true"
              focusable="false"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              [attr.data-label]="seen(item)"
            >
              <circle cx="12" cy="12" r="8" />
            </svg>
          </ng-template>
        }
      </wj-dock>
    </div>
    @if (second()) {
      <div class="stage" id="stage2">
        <wj-dock id="dock2" [model]="model2()" ariaLabel="Shortcuts">
          <ng-template wjDockItem let-item>
            <svg class="icon" aria-hidden="true" width="24" height="24" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="8" [attr.data-label]="item.label" />
            </svg>
          </ng-template>
        </wj-dock>
      </div>
    }
    <button id="after" type="button">After</button>
  `,
})
class Host {
  readonly model = signal<WjMenuItem[]>(apps());
  readonly model2 = signal<WjMenuItem[]>(apps());
  readonly position = signal<WjDockPosition>('bottom');
  readonly ariaLabel = signal<string | undefined>('Apps');
  readonly ariaLabelledBy = signal<string | undefined>(undefined);
  readonly ariaDescribedBy = signal<string | undefined>(undefined);
  readonly pt = signal<WjDockPt>(undefined);
  readonly withSlot = signal(true);
  readonly second = signal(false);
  /** The items the slot template was given, in render order. */
  readonly given: WjMenuItem[] = [];

  /** Records the item a slot template was rendered for, and returns its label. */
  seen(item: WjDockItemContext['$implicit']): string {
    this.given.push(item);
    return item.label ?? '';
  }
}

/** A consumer who writes aria-* on the host. */
@Component({
  selector: 'wj-dock-aria-on-host-host',
  imports: [WjDock, WjDockItemSlot],
  template: ` <wj-dock aria-label="Apps" [model]="model"><ng-template wjDockItem /></wj-dock> `,
})
class AriaOnHostHost {
  readonly model = apps();
}

/** A dock with no `position`, to read Optimus's default. */
@Component({
  selector: 'wj-dock-bare-host',
  imports: [WjDock, WjDockItemSlot],
  template: `
    <wj-dock id="dock" ariaLabel="Apps" [model]="model"><ng-template wjDockItem /></wj-dock>
  `,
})
class BareHost {
  readonly model = apps();
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

const listEl = (id = 'dock'): HTMLElement => find(document, `#${id} [role="menu"]`, HTMLElement);
const hostEl = (id = 'dock'): HTMLElement => find(document, `#${id}`, HTMLElement);
const stageEl = (id = 'stage'): HTMLElement => find(document, `#${id}`, HTMLElement);
const rootEl = (id = 'dock'): HTMLElement => find(hostEl(id), '[data-pc-name="dock"]', HTMLElement);
const tiles = (id = 'dock'): HTMLElement[] =>
  Array.from(hostEl(id).querySelectorAll<HTMLElement>('[role="menuitem"]'));
const tile = (label: string, id = 'dock'): HTMLElement => {
  const found = tiles(id).find((item) => item.getAttribute('aria-label') === label);
  if (!found) {
    throw new Error(`no tile named ${label}`);
  }
  return found;
};
const button = (id: 'before' | 'after'): HTMLElement => find(document, `#${id}`, HTMLElement);
const activeLabel = (id = 'dock'): string | null =>
  tiles(id)
    .find((item) => item.getAttribute('data-p-focused') === 'true')
    ?.getAttribute('aria-label') ?? null;

/** Renders `Host` with `provideWeeljack` in `scheme`, after `setup`, and waits for the dock. */
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
  await expect.poll(() => document.querySelector('#dock [role="menu"]')).not.toBeNull();
  if (fixture.componentInstance.second()) {
    await expect.poll(() => document.querySelector('#dock2 [role="menu"]')).not.toBeNull();
  }
  return {
    fixture,
    component: fixture.componentInstance,
    element: fixture.nativeElement as HTMLElement,
  };
}

const harnessOf = (fixture: ComponentFixture<unknown>): Promise<WjDockHarness> =>
  TestbedHarnessEnvironment.loader(fixture).getHarness(WjDockHarness);

/** Moves the pointer onto a neutral element: Optimus's `mouseenter` would move the active item. */
async function parkPointer(): Promise<void> {
  await userEvent.hover(button('after'));
}

/** Tabs from the button before the dock onto its list, with the pointer parked first. */
async function tabOntoList(): Promise<void> {
  await parkPointer();
  button('before').focus();
  await userEvent.tab();
  await expect.poll(() => document.activeElement?.getAttribute('role')).toBe('menu');
  await expect.poll(() => activeLabel()).not.toBeNull();
}

/** Records, and stops, every click that reaches a link, so a `url` item never navigates. */
function interceptLinks(): { hrefs: string[]; stop: () => void } {
  const hrefs: string[] = [];
  const listener = (event: Event): void => {
    const link = event.target instanceof Element ? event.target.closest('a') : null;
    if (link) {
      hrefs.push(link.getAttribute('href') ?? '');
      event.preventDefault();
    }
  };
  document.addEventListener('click', listener, true);
  return {
    hrefs,
    stop: () => {
      document.removeEventListener('click', listener, true);
    },
  };
}

/** The reduced-motion media rule that stops the tiles' transition, wherever its sheet sits. */
function reducedMotionRule(): CSSMediaRule {
  const found: CSSMediaRule[] = [];
  const walk = (rules: CSSRuleList): void => {
    for (const rule of Array.from(rules)) {
      if (
        found.length === 0 &&
        rule instanceof CSSMediaRule &&
        rule.conditionText.includes('prefers-reduced-motion') &&
        Array.from(rule.cssRules).some(
          (inner) => inner instanceof CSSStyleRule && inner.selectorText.includes('p-dock-item'),
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
    throw new Error('the dock reduced-motion rule is missing');
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

/** The item index Optimus puts in a part function's `context` (it types only `instance`). */
function indexOf(options: unknown): string {
  if (typeof options === 'object' && options !== null && 'context' in options) {
    const { context } = options;
    if (typeof context === 'object' && context !== null && 'index' in context) {
      return String(context.index);
    }
  }
  return '';
}

/** A snapshot of the app's items that a mutation would change: own keys and values, per item. */
const snapshot = (model: WjMenuItem[]): string[] =>
  model.map((item) =>
    JSON.stringify(Object.entries(item).map(([key, value]) => [key, typeof value])),
  );

describe('WjDock', () => {
  let warn: MockInstance<typeof console.warn>;
  const viewport = { width: window.innerWidth, height: window.innerHeight };

  beforeEach(() => {
    warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(async () => {
    ROOT.classList.remove('wj-dark');
    document.body.style.backgroundColor = '';
    document.head.querySelectorAll('style[data-optimus-style-id]').forEach((style) => {
      style.remove();
    });
    Reflect.deleteProperty(window, 'wjInjected');
    await page.viewport(viewport.width, viewport.height);
  });

  describe('inputs', () => {
    it('model draws one tile per item in a role="menu" list, named by its label, and follows a new array', async () => {
      const { fixture, component } = await render();
      const dock = await harnessOf(fixture);

      expect(await dock.getItemLabels()).toEqual(['Home', 'Search', 'Mail', 'Settings']);
      expect(listEl().tagName).toBe('UL');
      expect(tile('Mail').getAttribute('role')).toBe('menuitem');
      expect(tile('Mail').textContent.trim()).toBe('');

      component.model.set([{ label: 'Undo' }, { label: 'Redo' }]);
      await fixture.whenStable();
      await expect.poll(() => dock.getItemLabels()).toEqual(['Undo', 'Redo']);
    });

    it('with no items draws the empty frame, and the host takes no space', async () => {
      const { fixture, component, element } = await render((host) => {
        host.model.set([]);
      });
      const dock = await harnessOf(fixture);

      expect(await dock.getItemLabels()).toEqual([]);
      expect(getComputedStyle(hostEl()).display).toBe('block');
      expect(hostEl().getBoundingClientRect().height).toBe(0);
      expect(element.querySelector('[role="menuitem"]')).toBeNull();
      expect(warn).not.toHaveBeenCalled();

      component.model.set(apps());
      await fixture.whenStable();
      await expect.poll(() => dock.getItemLabels()).toHaveLength(4);
    });

    it('leaves out an item with visible false', async () => {
      const { fixture } = await render((host) => {
        host.model.set([{ label: 'Home' }, { label: 'Hidden', visible: false }, { label: 'Mail' }]);
      });

      expect(await (await harnessOf(fixture)).getItemLabels()).toEqual(['Home', 'Mail']);
    });

    it('a disabled item reports it, is skipped by the keys and runs nothing on a click', async () => {
      const run = vi.fn<(event: WjMenuItemCommandEvent) => void>();
      const { fixture } = await render((host) => {
        host.model.set([
          { label: 'Home', command: run },
          { label: 'Mail', command: run, disabled: true },
        ]);
      });
      const dock = await harnessOf(fixture);
      const [home, mail] = await dock.getItems();

      expect(await home?.isDisabled()).toBe(false);
      expect(await mail?.isDisabled()).toBe(true);
      expect(tile('Mail').getAttribute('aria-disabled')).toBe('true');
      await mail?.click();
      expect(run).not.toHaveBeenCalled();
      await home?.click();
      expect(run).toHaveBeenCalledTimes(1);
    });

    it('runs a command with the app’s own item and the original event', async () => {
      const seen: WjMenuItemCommandEvent[] = [];
      const bookmark: WjMenuItem = {
        label: 'Bookmark',
        command: (event) => {
          seen.push(event);
        },
      };
      const { fixture } = await render((host) => {
        host.model.set([{ label: 'Home' }, bookmark]);
      });

      await (await harnessOf(fixture)).clickItem('Bookmark');

      expect(seen).toHaveLength(1);
      expect(seen[0]?.item).toBe(bookmark);
      expect(seen[0]?.originalEvent).toBeInstanceOf(Event);
    });

    it('a disabled item with a url has no link to follow: no href, so no click or Enter navigates', async () => {
      const { fixture } = await render((host) => {
        host.model.set([{ label: 'Home' }, { label: 'Docs', url: '#docs', disabled: true }]);
      });
      const links = interceptLinks();
      try {
        await (await harnessOf(fixture)).clickItem('Docs');
        find(tile('Docs'), 'a', HTMLAnchorElement).click();
      } finally {
        links.stop();
      }

      expect(find(tile('Docs'), 'a', HTMLAnchorElement).hasAttribute('href')).toBe(false);
      expect(links.hrefs).toEqual(['']);
    });

    it('a url item is a real link, with its target', async () => {
      await render((host) => {
        host.model.set([{ label: 'Docs', url: 'https://example.com/docs', target: '_blank' }]);
      });

      const link = find(document, '[role="menuitem"] a', HTMLAnchorElement);
      expect(link.getAttribute('href')).toBe('https://example.com/docs');
      expect(link.getAttribute('target')).toBe('_blank');
    });

    it('position defaults to bottom', async () => {
      TestBed.configureTestingModule({ providers: [provideWeeljack()] });
      const fixture = TestBed.createComponent(BareHost);
      await fixture.whenStable();
      await expect.poll(() => document.querySelector('#dock [role="menu"]')).not.toBeNull();

      expect(await (await harnessOf(fixture)).getPosition()).toBe('bottom');
      expect(listEl().getAttribute('aria-orientation')).toBe('horizontal');
    });

    it('position names each edge on the list and in the harness', async () => {
      const { fixture, component } = await render();
      const dock = await harnessOf(fixture);

      for (const [position, orientation] of [
        ['top', 'horizontal'],
        ['left', 'vertical'],
        ['right', 'vertical'],
        ['bottom', 'horizontal'],
      ] as const) {
        component.position.set(position);
        await fixture.whenStable();
        await expect.poll(() => dock.getPosition()).toBe(position);
        expect(listEl().getAttribute('aria-orientation')).toBe(orientation);
      }
    });

    it('lies flush along the chosen edge of its positioned container, centred, in a row or a column', async () => {
      await page.viewport(1200, 800);
      const { fixture, component } = await render();
      await fixture.whenStable();
      const near = (actual: number, expected: number): void => {
        expect(Math.abs(actual - expected)).toBeLessThanOrEqual(1);
      };

      const cases: [WjDockPosition, (dock: DOMRect, stage: DOMRect) => void][] = [
        [
          'bottom',
          (dock, stage) => {
            near(dock.bottom, stage.bottom);
            near(dock.left + dock.width / 2, stage.left + stage.width / 2);
            expect(dock.width).toBeLessThan(stage.width);
          },
        ],
        [
          'top',
          (dock, stage) => {
            near(dock.top, stage.top);
            near(dock.left + dock.width / 2, stage.left + stage.width / 2);
          },
        ],
        [
          'left',
          (dock, stage) => {
            near(dock.left, stage.left);
            near(dock.top + dock.height / 2, stage.top + stage.height / 2);
          },
        ],
        [
          'right',
          (dock, stage) => {
            near(dock.right, stage.right);
            near(dock.top + dock.height / 2, stage.top + stage.height / 2);
          },
        ],
      ];
      for (const [position, check] of cases) {
        component.position.set(position);
        await fixture.whenStable();
        await expect.poll(() => rootEl().classList.contains(`p-dock-${position}`)).toBe(true);
        const frame = find(rootEl(), '[data-pc-section="listcontainer"]', HTMLElement);
        check(frame.getBoundingClientRect(), stageEl().getBoundingClientRect());
        const row = getComputedStyle(listEl()).flexDirection;
        expect(row).toBe(position === 'left' || position === 'right' ? 'column' : 'row');
        expect(getComputedStyle(rootEl()).pointerEvents).toBe('none');
        expect(getComputedStyle(frame).pointerEvents).toBe('auto');
      }
    });

    it('at 960 px or narrower the bar spans its edge', async () => {
      await page.viewport(700, 800);
      const { fixture } = await render();
      await fixture.whenStable();

      await expect.poll(() => rootEl().classList.contains('p-dock-mobile')).toBe(true);
      expect(
        Math.abs(
          find(rootEl(), '[data-pc-section="listcontainer"]', HTMLElement).getBoundingClientRect()
            .width - stageEl().getBoundingClientRect().width,
        ),
      ).toBeLessThanOrEqual(1);
    });
  });

  describe('server rendering', () => {
    it('creates p-dock only after the first render, so the server output is the empty host', async () => {
      const matchMedia = vi.spyOn(window, 'matchMedia');
      TestBed.configureTestingModule({ providers: [provideWeeljack()] });
      const fixture = TestBed.createComponent(Host);
      const element = fixture.nativeElement as HTMLElement;

      // A view check with no render hooks is what the server runs: `afterNextRender` has not run.
      fixture.componentRef.changeDetectorRef.detectChanges();
      expect(element.querySelector('wj-dock')).not.toBeNull();
      expect(element.querySelector('wj-dock')?.querySelector('*')).toBeNull();
      expect(matchMedia).not.toHaveBeenCalledWith('(max-width: 960px)');

      await fixture.whenStable();
      await expect.poll(() => element.querySelector('p-dock')).not.toBeNull();
      expect(matchMedia).toHaveBeenCalledWith('(max-width: 960px)');
    });
  });

  describe('item ids', () => {
    it('gives every tile an id of its dock’s own, unique across two docks on one page', async () => {
      const { element } = await render((host) => {
        host.second.set(true);
      });

      const ids = Array.from(element.querySelectorAll('[role="menuitem"]')).map((item) => item.id);
      expect(ids).toHaveLength(8);
      expect(new Set(ids).size).toBe(8);
      expect(ids.every((id) => /^wj-dock-\d+-\d+$/.test(id))).toBe(true);
      expect(
        tiles('dock')
          .map((item) => item.id.replace(/-\d+$/, ''))
          .every((prefix, _index, all) => prefix === all[0]),
      ).toBe(true);
      expect(tiles('dock')[0]?.id.replace(/-\d+$/, '')).not.toBe(
        tiles('dock2')[0]?.id.replace(/-\d+$/, ''),
      );
    });

    it('resolves each list’s aria-activedescendant inside its own list', async () => {
      await render((host) => {
        host.second.set(true);
      });
      await parkPointer();

      for (const id of ['dock', 'dock2']) {
        listEl(id).focus();
        await expect.poll(() => listEl(id).getAttribute('aria-activedescendant')).not.toBeNull();
        const target = listEl(id).getAttribute('aria-activedescendant') ?? '';
        const matches = document.querySelectorAll(`[id="${target}"]`);
        expect(matches).toHaveLength(1);
        expect(listEl(id).contains(matches[0] ?? null)).toBe(true);
        expect(matches[0]?.getAttribute('data-p-focused')).toBe('true');
      }
    });

    it('moves the active tile in the second dock, and never in the first', async () => {
      await render((host) => {
        host.second.set(true);
      });
      await parkPointer();

      listEl('dock').focus();
      await expect.poll(() => activeLabel('dock')).toBe('Home');
      listEl('dock2').focus();
      await expect.poll(() => activeLabel('dock2')).toBe('Home');
      await userEvent.keyboard('{ArrowRight}');

      await expect.poll(() => activeLabel('dock2')).toBe('Search');
      expect(activeLabel('dock')).toBeNull();
    });
  });

  describe('ARIA', () => {
    it('ariaLabel names the list, not the host, and the harness reads the name', async () => {
      const { fixture } = await render();
      const dock = await harnessOf(fixture);

      expect(listEl().getAttribute('aria-label')).toBe('Apps');
      expect(hostEl().hasAttribute('aria-label')).toBe(false);
      expect(await dock.getName()).toBe('Apps');
    });

    it('ariaLabelledBy names the list from visible text', async () => {
      const { fixture } = await render((host) => {
        host.ariaLabel.set(undefined);
        host.ariaLabelledBy.set('caption');
      });
      const dock = await harnessOf(fixture);

      expect(listEl().getAttribute('aria-labelledby')).toBe('caption');
      expect(listEl().hasAttribute('aria-label')).toBe(false);
      expect(await dock.getName()).toBe('Apps');
    });

    it('ariaDescribedBy lands on the list, and is removed again', async () => {
      const { fixture, component } = await render((host) => {
        host.ariaDescribedBy.set('notes');
      });
      const dock = await harnessOf(fixture);

      expect(listEl().getAttribute('aria-describedby')).toBe('notes');
      expect((await dock.getAriaAttributes()).describedBy).toBe('notes');

      component.ariaDescribedBy.set(undefined);
      await fixture.whenStable();
      await expect.poll(() => listEl().hasAttribute('aria-describedby')).toBe(false);
    });

    it('finds a dock by its name', async () => {
      const { fixture } = await render();
      const loader = TestbedHarnessEnvironment.loader(fixture);

      expect(await loader.getAllHarnesses(WjDockHarness.with({ name: 'Apps' }))).toHaveLength(1);
      expect(await loader.getAllHarnesses(WjDockHarness.with({ name: /^Other/ }))).toHaveLength(0);
    });

    it('warns WJ0003 once for aria-* on the host, and does not forward it', async () => {
      TestBed.configureTestingModule({ providers: [provideWeeljack()] });
      const fixture = TestBed.createComponent(AriaOnHostHost);
      await fixture.whenStable();
      await expect.poll(() => warn.mock.calls.length).toBeGreaterThan(0);

      const calls = warn.mock.calls.filter(([message]) => String(message).startsWith('WJ0003'));
      expect(calls).toHaveLength(1);
      expect(String(calls[0]?.[0])).toContain('WJ0003: wj-dock:');
      await expect.poll(() => document.querySelector('[role="menu"]')).not.toBeNull();
      expect(document.querySelector('[role="menu"]')?.getAttribute('aria-label')).toBeNull();
    });

    it('warns WJ0001 when provideWeeljack is missing', async () => {
      const fixture = TestBed.createComponent(AriaOnHostHost);
      await fixture.whenStable();

      expect(
        warn.mock.calls.some(([message]) => String(message).startsWith('WJ0001: wj-dock:')),
      ).toBe(true);
    });
  });

  describe('pt', () => {
    it('lands part attributes from an object, with the routed description kept beside them', async () => {
      await render((host) => {
        host.ariaDescribedBy.set('notes');
        host.pt.set({
          root: { 'data-consumer': 'root' },
          listContainer: { 'data-consumer': 'frame' },
          list: { 'data-consumer': 'list' },
          item: { 'data-consumer': 'item' },
          itemContent: { 'data-consumer': 'content' },
          itemLink: { 'data-consumer': 'link' },
        });
      });

      expect(rootEl().getAttribute('data-consumer')).toBe('root');
      expect(listEl().parentElement?.getAttribute('data-consumer')).toBe('frame');
      expect(listEl().getAttribute('data-consumer')).toBe('list');
      expect(listEl().getAttribute('aria-describedby')).toBe('notes');
      expect(tiles().map((item) => item.getAttribute('data-consumer'))).toEqual(
        Array.from({ length: 4 }, () => 'item'),
      );
      expect(tiles().map((item) => item.querySelector('a')?.getAttribute('data-consumer'))).toEqual(
        Array.from({ length: 4 }, () => 'link'),
      );
      expect(
        tiles().map((item) =>
          item.querySelector('[data-pc-section="itemcontent"]')?.getAttribute('data-consumer'),
        ),
      ).toEqual(Array.from({ length: 4 }, () => 'content'));
    });

    it('lands them from the function form too, per item, with the routed description', async () => {
      await render((host) => {
        host.ariaDescribedBy.set('notes');
        host.pt.set(() => ({
          list: { 'data-consumer': 'list' },
          item: (options) => ({ 'data-consumer': indexOf(options) }),
        }));
      });

      expect(listEl().getAttribute('data-consumer')).toBe('list');
      expect(listEl().getAttribute('aria-describedby')).toBe('notes');
      expect(tiles().map((item) => item.getAttribute('data-consumer'))).toEqual([
        '0',
        '1',
        '2',
        '3',
      ]);
    });

    it('lets the routed description win over a pt aria-describedby on the list', async () => {
      await render((host) => {
        host.ariaDescribedBy.set('notes');
        host.pt.set({ list: { 'aria-describedby': 'caption' } });
      });

      expect(listEl().getAttribute('aria-describedby')).toBe('notes');
    });

    it('keeps a pt aria-describedby on the list when ariaDescribedBy is not set', async () => {
      await render((host) => {
        host.pt.set({ list: { 'aria-describedby': 'caption' } });
      });

      expect(listEl().getAttribute('aria-describedby')).toBe('caption');
    });
  });

  describe('item slot', () => {
    it('draws the slot inside each tile’s link, with the app’s own item', async () => {
      const { component } = await render();

      const links = tiles().map((item) => find(item, 'a', HTMLAnchorElement));
      expect(links.every((link) => link.querySelectorAll('svg.icon').length === 1)).toBe(true);
      expect(links.every((link) => link.getAttribute('aria-hidden') === 'true')).toBe(true);
      expect(new Set(component.given)).toEqual(new Set(component.model()));
      for (const item of component.given) {
        expect(component.model()).toContain(item);
      }
      expect(tile('Mail').querySelector('svg')?.getAttribute('data-label')).toBe('Mail');
    });

    it('names each tile by its label, which is never drawn', async () => {
      await render();

      for (const label of ['Home', 'Search', 'Mail', 'Settings']) {
        expect(tile(label).getAttribute('aria-label')).toBe(label);
        expect(tile(label).textContent.trim()).toBe('');
      }
    });

    it('draws a router link tile’s slot too', async () => {
      TestBed.configureTestingModule({
        providers: [provideWeeljack({ darkMode: 'class' }), provideRouter([])],
      });
      const fixture = TestBed.createComponent(Host);
      fixture.componentInstance.model.set([
        { label: 'Home', routerLink: '/' },
        { label: 'Docs', routerLink: ['/components', 'dock'] },
      ]);
      await fixture.whenStable();
      await expect.poll(() => document.querySelector('#dock [role="menu"]')).not.toBeNull();

      for (const item of tiles()) {
        expect(item.querySelectorAll('a svg.icon')).toHaveLength(1);
      }
    });
  });

  describe('late slot', () => {
    it('is not drawn: Optimus reads its item template once, so the slot is given at creation', async () => {
      const { fixture, component } = await render((host) => {
        host.withSlot.set(false);
      });
      expect(document.querySelectorAll('#dock svg.icon')).toHaveLength(0);

      component.withSlot.set(true);
      await fixture.whenStable();
      await fixture.whenStable();

      expect(document.querySelectorAll('#dock svg.icon')).toHaveLength(0);
      expect(component.given).toHaveLength(0);
    });
  });

  describe('WJ0140', () => {
    it('warns once, with the exact text, when the dock has items and no slot', async () => {
      const { fixture } = await render((host) => {
        host.withSlot.set(false);
        host.second.set(true);
      });
      await fixture.whenStable();

      const calls = warn.mock.calls.filter(([message]) => String(message).startsWith('WJ0140'));
      expect(calls).toHaveLength(1);
      expect(String(calls[0]?.[0])).toBe(WJ0140);
    });

    it('stays silent with the slot', async () => {
      await render();

      expect(warn.mock.calls.some(([message]) => String(message).startsWith('WJ0140'))).toBe(false);
    });

    it('stays silent when the model has no items', async () => {
      await render((host) => {
        host.withSlot.set(false);
        host.model.set([]);
      });

      expect(warn.mock.calls.some(([message]) => String(message).startsWith('WJ0140'))).toBe(false);
    });
  });

  describe('app data', () => {
    it('never changes the app’s array or items: no id, escape or expanded, through clicks and keys', async () => {
      const run = vi.fn<(event: WjMenuItemCommandEvent) => void>();
      const model: WjMenuItem[] = [
        { label: 'Home', command: run },
        { label: 'Mail', url: '#mail', disabled: true },
        { label: 'Settings', command: run },
      ];
      const before = snapshot(model);
      const references = [...model];
      const { fixture } = await render((host) => {
        host.model.set(model);
      });
      const links = interceptLinks();
      try {
        await (await harnessOf(fixture)).clickItem('Home');
        await tabOntoList();
        await userEvent.keyboard('{End}');
        await expect.poll(() => activeLabel()).toBe('Settings');
        await userEvent.keyboard('{Enter}');
        await expect.poll(() => run.mock.calls.length).toBe(2);
      } finally {
        links.stop();
      }

      expect(model).toHaveLength(3);
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

      expect(tiles()[0]?.getAttribute('aria-label')).toBe(PAYLOAD);
      expectText();
    });

    it('renders ariaLabel, ariaLabelledBy and ariaDescribedBy as attribute text', async () => {
      await render((host) => {
        host.ariaLabel.set(PAYLOAD);
        host.ariaLabelledBy.set(PAYLOAD);
        host.ariaDescribedBy.set(PAYLOAD);
      });

      expect(listEl().getAttribute('aria-label')).toBe(PAYLOAD);
      expect(listEl().getAttribute('aria-labelledby')).toBe(PAYLOAD);
      expect(listEl().getAttribute('aria-describedby')).toBe(PAYLOAD);
      expectText();
    });

    it('renders as text an object that also carries escape: false, styleClass, tooltipOptions and icon', async () => {
      const wider = {
        label: PAYLOAD,
        escape: false,
        styleClass: 'smuggled',
        icon: 'pi pi-smuggled',
        tooltipOptions: { escape: false },
      };
      const smuggled: WjMenuItem = wider;
      await render((host) => {
        host.model.set([smuggled]);
      });

      expect(tiles()[0]?.getAttribute('aria-label')).toBe(PAYLOAD);
      expect(tiles()[0]?.classList.contains('smuggled')).toBe(false);
      expect(document.querySelector('.pi-smuggled')).toBeNull();
      expect(document.querySelector('.p-tooltip')).toBeNull();
      expectText();
    });
  });

  describe('motion', () => {
    it('stops each tile’s transition under reduced motion, in the wj layer, and only then', async () => {
      await render();
      const item = tile('Home');
      const outside = getComputedStyle(item).transitionDuration;

      expect(outside).toBe('0.2s');
      expect(layerOf(reducedMotionRule())).toEqual(['wj']);
      await withReducedMotion(() => {
        expect(getComputedStyle(item).transitionDuration).toBe('0s');
        expect(getComputedStyle(item).transitionProperty).not.toBe('all');
      });

      // The condition is back: Optimus's own duration holds again, so nothing leaked past the proof.
      expect(getComputedStyle(item).transitionDuration).toBe('0.2s');
    });

    it('leaves every tile’s transition at Optimus’s outside reduced motion', async () => {
      await render();

      for (const item of tiles()) {
        expect(getComputedStyle(item).transitionDuration).toBe('0.2s');
      }
    });

    it.each<Scheme>(['light', 'dark'])(
      'has no axe violations with the rule applied: %s',
      async (scheme) => {
        await render(undefined, scheme);

        await withReducedMotion(async () => {
          await expectNoAxeViolations(stageEl());
        });
      },
    );
  });

  describe('pointer', () => {
    it('shows the pointer cursor on an enabled tile, and not on a disabled one', async () => {
      await render((host) => {
        host.model.set([{ label: 'Home' }, { label: 'Mail', disabled: true }]);
      });

      const cursorOf = (label: string): string =>
        getComputedStyle(find(tile(label), 'a', HTMLAnchorElement)).cursor;
      expect(cursorOf('Home')).toBe('pointer');
      expect(cursorOf('Mail')).not.toBe('pointer');
    });

    it('draws 64 x 64 px tiles around a 48 px link, well over the 24 px target size', async () => {
      await page.viewport(1200, 800);
      await render();

      for (const item of tiles()) {
        const box = item.getBoundingClientRect();
        expect([box.width, box.height]).toEqual([64, 64]);
        const link = find(item, 'a', HTMLAnchorElement).getBoundingClientRect();
        expect([link.width, link.height]).toEqual([48, 48]);
      }
    });
  });

  describe('accessibility', () => {
    const positions: WjDockPosition[] = ['bottom', 'top', 'left', 'right'];
    const withItems = (host: Host): void => {
      host.model.set([
        { label: 'Home' },
        { label: 'Search' },
        { label: 'Mail', disabled: true },
        { label: 'Settings' },
      ]);
    };

    describe.each<Scheme>(['light', 'dark'])('%s', (scheme) => {
      it.each(positions)('has no axe violations: position %s', async (position) => {
        await page.viewport(1200, 800);
        await render((host) => {
          host.position.set(position);
        }, scheme);

        await expectNoAxeViolations(stageEl());
      });

      it('has no axe violations: a disabled item', async () => {
        await render(withItems, scheme);

        await expectNoAxeViolations(stageEl());
      });

      it('has no axe violations: a disabled item that carries a url', async () => {
        await render((host) => {
          host.model.set([{ label: 'Home' }, { label: 'Docs', url: '#docs', disabled: true }]);
        }, scheme);

        await expectNoAxeViolations(stageEl());
      });

      it('has no axe violations: an item active from the keyboard', async () => {
        await render(undefined, scheme);
        await tabOntoList();
        await userEvent.keyboard('{ArrowRight}');
        await expect.poll(() => activeLabel()).toBe('Search');

        await expectNoAxeViolations(stageEl());
      });

      it('has no axe violations: narrow, with the bar spanning its edge', async () => {
        await render(undefined, scheme);

        await expectNoAxeViolations(stageEl());
      });

      it('has no axe violations: two docks on one page', async () => {
        await render((host) => {
          host.second.set(true);
        }, scheme);

        await expectNoAxeViolations(document);
      });
    });
  });

  describe('keyboard', () => {
    it('Tab focuses the list and makes the first item active', async () => {
      const { fixture } = await render();
      const dock = await harnessOf(fixture);

      await tabOntoList();

      expect(await dock.isFocused()).toBe(true);
      expect(await dock.getActiveItemLabel()).toBe('Home');
      expect(listEl().getAttribute('aria-activedescendant')).toBe(tile('Home').id);
    });

    it('the list is the only Tab stop, and Tab leaves the dock', async () => {
      await render();
      await tabOntoList();
      const stops = Array.from(
        hostEl().querySelectorAll('[tabindex]:not([tabindex="-1"]), a[href]'),
      );
      expect(stops).toEqual([listEl()]);

      await userEvent.tab();

      expect(document.activeElement).toBe(button('after'));
      await expect.poll(() => activeLabel()).toBeNull();
    });

    it('ArrowRight and ArrowLeft move the active item in a bottom or top dock, and stop at the ends', async () => {
      for (const position of ['bottom', 'top'] as const) {
        const { fixture, component } = await render((host) => {
          host.position.set(position);
        });
        await tabOntoList();

        await userEvent.keyboard('{ArrowDown}');
        expect(activeLabel()).toBe('Home');
        await userEvent.keyboard('{ArrowRight}');
        await expect.poll(() => activeLabel()).toBe('Search');
        await userEvent.keyboard('{ArrowRight}{ArrowRight}{ArrowRight}');
        await expect.poll(() => activeLabel()).toBe('Settings');
        await userEvent.keyboard('{ArrowLeft}');
        await expect.poll(() => activeLabel()).toBe('Mail');
        await userEvent.keyboard('{ArrowLeft}{ArrowLeft}{ArrowLeft}');
        await expect.poll(() => activeLabel()).toBe('Home');
        expect(component.position()).toBe(position);

        fixture.destroy();
        TestBed.resetTestingModule();
      }
    });

    it('ArrowDown and ArrowUp move the active item in a left or right dock', async () => {
      for (const position of ['left', 'right'] as const) {
        const { fixture } = await render((host) => {
          host.position.set(position);
        });
        await tabOntoList();

        await userEvent.keyboard('{ArrowRight}');
        expect(activeLabel()).toBe('Home');
        await userEvent.keyboard('{ArrowDown}{ArrowDown}');
        await expect.poll(() => activeLabel()).toBe('Mail');
        await userEvent.keyboard('{ArrowUp}');
        await expect.poll(() => activeLabel()).toBe('Search');

        fixture.destroy();
        TestBed.resetTestingModule();
      }
    });

    it('skips a disabled item', async () => {
      await render((host) => {
        host.model.set([
          { label: 'Home' },
          { label: 'Search', disabled: true },
          { label: 'Mail' },
          { label: 'Settings', disabled: true },
          { label: 'Help' },
        ]);
      });
      await tabOntoList();

      await userEvent.keyboard('{ArrowRight}');
      await expect.poll(() => activeLabel()).toBe('Mail');
      await userEvent.keyboard('{ArrowRight}');
      await expect.poll(() => activeLabel()).toBe('Help');
      await userEvent.keyboard('{ArrowLeft}');
      await expect.poll(() => activeLabel()).toBe('Mail');
      await userEvent.keyboard('{Home}');
      await expect.poll(() => activeLabel()).toBe('Home');
      await userEvent.keyboard('{End}');
      await expect.poll(() => activeLabel()).toBe('Help');
    });

    it('Home and End go to the first and last item', async () => {
      await render();
      await tabOntoList();

      await userEvent.keyboard('{End}');
      await expect.poll(() => activeLabel()).toBe('Settings');
      await userEvent.keyboard('{Home}');
      await expect.poll(() => activeLabel()).toBe('Home');
    });

    it('Enter and Space run the active item’s command with the app’s own item', async () => {
      const seen: WjMenuItem[] = [];
      const search: WjMenuItem = {
        label: 'Search',
        command: (event) => {
          seen.push(event.item);
        },
      };
      await render((host) => {
        host.model.set([{ label: 'Home' }, search]);
      });
      await tabOntoList();
      await userEvent.keyboard('{ArrowRight}');
      await expect.poll(() => activeLabel()).toBe('Search');

      await userEvent.keyboard('{Enter}');
      await expect.poll(() => seen.length).toBe(1);
      await userEvent.keyboard(' ');
      await expect.poll(() => seen.length).toBe(2);

      expect(seen.every((item) => item === search)).toBe(true);
    });

    it('Enter follows the active item’s url', async () => {
      await render((host) => {
        host.model.set([{ label: 'Home' }, { label: 'Docs', url: '#docs' }]);
      });
      const links = interceptLinks();
      try {
        await tabOntoList();
        await userEvent.keyboard('{ArrowRight}');
        await expect.poll(() => activeLabel()).toBe('Docs');

        await userEvent.keyboard('{Enter}');
        await expect.poll(() => links.hrefs).toEqual(['#docs']);
      } finally {
        links.stop();
      }
    });

    it('a disabled item never runs from the keyboard', async () => {
      const run = vi.fn<(event: WjMenuItemCommandEvent) => void>();
      await render((host) => {
        host.model.set([
          { label: 'Home', disabled: true, command: run },
          { label: 'Search', disabled: true, command: run },
        ]);
      });
      await parkPointer();
      listEl().focus();
      await userEvent.keyboard('{Enter}');

      expect(run).not.toHaveBeenCalled();
    });
  });
});
