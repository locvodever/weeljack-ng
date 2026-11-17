import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Component, signal, viewChild } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import type { MockInstance } from 'vitest';
import { userEvent } from 'vitest/browser';
import { provideWeeljack } from 'weeljack-ng';
import {
  WjScroller,
  WjScrollerItemSlot,
  WjScrollerLoaderSlot,
  type WjScrollerOrientation,
  type WjScrollerPt,
  type WjScrollerRange,
} from 'weeljack-ng/scroller';
import { WjScrollerHarness } from 'weeljack-ng/scroller/testing';
import { expectNoAxeViolations } from '../spec-support/axe';

const PAYLOAD = '<img src=x onerror="window.wjInjected = true">';
const ROOT = document.documentElement;

type Scheme = 'light' | 'dark';

interface Row {
  id: number;
  name: string;
}

function makeRows(count: number): Row[] {
  return Array.from({ length: count }, (_unused, index) => ({
    id: index + 1,
    name: `Item ${String(index + 1)}`,
  }));
}

/** What a consumer writes to give an item list semantics: the content part is the list. */
const LIST_PT: WjScrollerPt = { content: { role: 'list' } };

/** A consumer's template: a scroller between two buttons, with the item and loader slots. */
@Component({
  selector: 'wj-scroller-host',
  imports: [WjScroller, WjScrollerItemSlot, WjScrollerLoaderSlot],
  template: `
    <button type="button" id="before">Before</button>
    <p id="name">Items list</p>
    <div class="frame" [class.wide]="orientation() === 'horizontal'">
      <wj-scroller
        [items]="items()"
        [itemSize]="itemSize()"
        [scrollHeight]="scrollHeight()"
        [scrollWidth]="scrollWidth()"
        [orientation]="orientation()"
        [lazy]="lazy()"
        [loading]="loading()"
        [ariaLabel]="ariaLabel()"
        [ariaLabelledBy]="ariaLabelledBy()"
        [pt]="pt()"
        (lazyLoad)="lazyLoads.update((list) => [...list, $event])"
        (scrollIndexChange)="indexChanges.update((list) => [...list, $event])"
      >
        <ng-template
          wjScrollerItem
          [wjScrollerItemOf]="items()"
          let-row
          let-index="index"
          let-count="count"
          let-first="first"
          let-last="last"
          let-even="even"
          let-odd="odd"
        >
          <div
            class="item"
            role="listitem"
            [attr.aria-posinset]="index + 1"
            [attr.aria-setsize]="count"
            [attr.data-index]="index"
            [attr.data-first]="first"
            [attr.data-last]="last"
            [attr.data-even]="even"
            [attr.data-odd]="odd"
          >
            {{ row.name }}
          </div>
        </ng-template>
        @if (withLoader()) {
          <ng-template wjScrollerLoader let-index="index">
            <div class="item loader-item">{{ index }}</div>
          </ng-template>
        }
      </wj-scroller>
    </div>
    <button type="button" id="after">After</button>
  `,
  styles: `
    .frame {
      inline-size: 24rem;
    }
    .item {
      box-sizing: border-box;
      block-size: 48px;
      padding-inline: 16px;
      display: flex;
      align-items: center;
      color: var(--wj-text-color);
      border-block-end: 1px solid var(--wj-content-border-color);
    }
    .wide .item {
      inline-size: 120px;
      block-size: 100%;
      border-block-end: 0;
      border-inline-end: 1px solid var(--wj-content-border-color);
    }
  `,
})
class Host {
  readonly scroller = viewChild.required(WjScroller);
  readonly items = signal<Row[] | undefined>(Object.freeze(makeRows(10_000)) as Row[]);
  readonly itemSize = signal(48);
  readonly scrollHeight = signal<string | undefined>('20rem');
  readonly scrollWidth = signal<string | undefined>(undefined);
  readonly orientation = signal<WjScrollerOrientation>('vertical');
  readonly lazy = signal(false);
  readonly loading = signal(false);
  readonly withLoader = signal(false);
  readonly ariaLabel = signal<string | undefined>('Items list');
  readonly ariaLabelledBy = signal<string | undefined>(undefined);
  readonly pt = signal<WjScrollerPt>(LIST_PT);
  readonly lazyLoads = signal<WjScrollerRange[]>([]);
  readonly indexChanges = signal<WjScrollerRange[]>([]);
}

/** A consumer who writes `aria-label` on the host instead of using the input. */
@Component({
  selector: 'wj-scroller-aria-host',
  imports: [WjScroller],
  template: `<wj-scroller [itemSize]="48" scrollHeight="10rem" aria-label="Items" />`,
})
class AriaOnHostHost {}

/** A consumer who uses the routed inputs only, and gives the scroller no item slot. */
@Component({
  selector: 'wj-scroller-routed-host',
  imports: [WjScroller],
  template: `<wj-scroller [items]="items" itemSize="48" scrollHeight="10rem" ariaLabel="Items" />`,
})
class RoutedHost {
  readonly items = makeRows(20);
}

interface Rendered {
  fixture: ComponentFixture<Host>;
  host: Host;
  scroller: WjScrollerHarness;
  element: HTMLElement;
}

/** Renders the host with `provideWeeljack`, in the given colour scheme, after `setup` ran. */
async function render(
  scheme: Scheme = 'light',
  setup: (host: Host) => void = () => undefined,
  expectItems = true,
): Promise<Rendered> {
  ROOT.classList.toggle('wj-dark', scheme === 'dark');
  document.body.style.backgroundColor = 'var(--wj-content-background)';
  TestBed.configureTestingModule({ providers: [provideWeeljack({ darkMode: 'class' })] });
  const fixture = TestBed.createComponent(Host);
  setup(fixture.componentInstance);
  await fixture.whenStable();
  const element = fixture.nativeElement as HTMLElement;
  const scroller = await TestbedHarnessEnvironment.loader(fixture).getHarness(WjScrollerHarness);
  // A render without Optimus's styles would pass axe for the wrong reason: fail loudly instead.
  expect(getComputedStyle(part(element, '.p-virtualscroller')).overflow).toBe('auto');
  if (expectItems) {
    await expect
      .poll(async () => (await scroller.getRenderedItemTexts()).length)
      .toBeGreaterThan(0);
  }
  return { fixture, host: fixture.componentInstance, scroller, element };
}

/** The first element matching `selector` inside `element`. */
function part(element: ParentNode, selector: string): HTMLElement {
  const found = element.querySelector(selector);
  if (!(found instanceof HTMLElement)) {
    throw new Error(`${selector} is missing`);
  }
  return found;
}

function parts(element: ParentNode, selector: string): HTMLElement[] {
  return Array.from(element.querySelectorAll<HTMLElement>(selector));
}

const VIEWPORT = '.p-virtualscroller';

/** A key scroll over 480,000 px animates in the browser for longer than a poll's default second. */
const SCROLL = { timeout: 5000 };

/** The documented states: default, scrolled to the middle, horizontal, lazy while loading, empty. */
const STATES: [string, (host: Host) => void, ((scroller: WjScrollerHarness) => Promise<void>)?][] =
  [
    ['default', () => undefined],
    [
      'scrolled to the middle',
      () => undefined,
      async (scroller) => {
        await scroller.scrollToOffset(48 * 5000);
        await expect.poll(() => scroller.getRenderedItemTexts()).toContain('Item 5001');
      },
    ],
    [
      'horizontal',
      (host) => {
        host.orientation.set('horizontal');
        host.itemSize.set(120);
        host.scrollWidth.set('24rem');
        host.scrollHeight.set('6rem');
      },
    ],
    [
      'named by a visible label',
      (host) => {
        host.ariaLabel.set(undefined);
        host.ariaLabelledBy.set('name');
      },
    ],
    [
      'lazy, loading, with the loader slot',
      (host) => {
        host.lazy.set(true);
        host.withLoader.set(true);
        host.loading.set(true);
      },
    ],
  ];

describe('WjScroller', () => {
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

  describe('items and sizes', () => {
    it('renders a window of the items, not all of them, over a spacer as tall as the list', async () => {
      const { element, scroller } = await render();

      const texts = await scroller.getRenderedItemTexts();
      expect(texts[0]).toBe('Item 1');
      expect(texts.length).toBeGreaterThan(5);
      expect(texts.length).toBeLessThan(60);
      expect(part(element, '.p-virtualscroller-spacer').style.height).toBe('480000px');
    });

    it('itemSize sets the height of the list, and follows a change', async () => {
      const { element, fixture, host } = await render();

      host.itemSize.set(24);
      await fixture.whenStable();

      await expect
        .poll(() => part(element, '.p-virtualscroller-spacer').style.height)
        .toBe('240000px');
    });

    it('itemSize takes a number written as an attribute', async () => {
      TestBed.configureTestingModule({ providers: [provideWeeljack()] });
      const fixture = TestBed.createComponent(RoutedHost);
      await fixture.whenStable();

      await expect
        .poll(
          () =>
            part(fixture.nativeElement as HTMLElement, '.p-virtualscroller-spacer').style.height,
        )
        .toBe('960px');
    });

    it('scrollHeight sets the height of the viewport', async () => {
      const { element, fixture, host } = await render();
      await expect.poll(() => part(element, VIEWPORT).style.height).toBe('20rem');
      expect(part(element, VIEWPORT).offsetHeight).toBe(320);

      host.scrollHeight.set('10rem');
      await fixture.whenStable();

      await expect.poll(() => part(element, VIEWPORT).offsetHeight).toBe(160);
    });

    it('has no height without scrollHeight, as Optimus does', async () => {
      const { element } = await render(
        'light',
        (host) => {
          host.scrollHeight.set(undefined);
        },
        false,
      );

      expect(part(element, VIEWPORT).offsetHeight).toBe(0);
    });

    it('fills the width of its container', async () => {
      const { element } = await render();

      expect(part(element, VIEWPORT).offsetWidth).toBe(part(element, '.frame').offsetWidth);
      expect(getComputedStyle(part(element, 'wj-scroller')).display).toBe('block');
    });

    it('items renders nothing, and does not fail, while it is undefined or empty', async () => {
      const { element, fixture, host, scroller } = await render();

      host.items.set([]);
      await fixture.whenStable();
      await expect.poll(() => scroller.getRenderedItemTexts()).toEqual([]);

      host.items.set(undefined);
      await fixture.whenStable();
      expect(await scroller.getRenderedItemTexts()).toEqual([]);
      expect(part(element, VIEWPORT)).toBeInstanceOf(HTMLElement);
    });

    it('follows new items', async () => {
      const { fixture, host, scroller } = await render();

      host.items.set(makeRows(3).map((row) => ({ ...row, name: `Row ${row.name}` })));
      await fixture.whenStable();

      await expect
        .poll(() => scroller.getRenderedItemTexts())
        .toEqual(['Row Item 1', 'Row Item 2', 'Row Item 3']);
    });
  });

  describe('orientation', () => {
    it('scrolls vertically by default', async () => {
      const { element } = await render();

      expect(part(element, VIEWPORT).classList.contains('p-virtualscroller-horizontal')).toBe(
        false,
      );
      expect(part(element, VIEWPORT).scrollHeight).toBeGreaterThan(
        part(element, VIEWPORT).clientHeight,
      );
    });

    it('horizontal scrolls along x, with itemSize as the width and scrollWidth the viewport', async () => {
      const { element, scroller } = await render('light', (host) => {
        host.orientation.set('horizontal');
        host.itemSize.set(120);
        host.scrollWidth.set('24rem');
        host.scrollHeight.set('6rem');
      });
      const viewport = part(element, VIEWPORT);
      expect(viewport.classList.contains('p-virtualscroller-horizontal')).toBe(true);
      expect(viewport.offsetWidth).toBe(384);
      expect(viewport.offsetHeight).toBe(96);
      expect(parseFloat(part(element, '.p-virtualscroller-spacer').style.width)).toBe(1_200_000);

      await scroller.scrollToOffset(120 * 500);

      expect(viewport.scrollLeft).toBe(60_000);
      await expect.poll(() => scroller.getRenderedItemTexts()).toContain('Item 501');
    });
  });

  describe('scrolling', () => {
    it('scrollToOffset moves the window to the items there, and back', async () => {
      const { scroller } = await render();

      await scroller.scrollToOffset(48 * 5000);
      await expect.poll(() => scroller.getRenderedItemTexts()).toContain('Item 5001');
      expect(await scroller.getRenderedItemTexts()).not.toContain('Item 1');

      await scroller.scrollToOffset(0);
      await expect.poll(() => scroller.getRenderedItemTexts()).toContain('Item 1');
    });

    it('scrollToOffset to where the viewport already is does nothing and returns', async () => {
      const { scroller } = await render();

      await scroller.scrollToOffset(0);

      expect((await scroller.getRenderedItemTexts())[0]).toBe('Item 1');
    });

    it('scrollIndexChange emits the range of rendered items as it moves', async () => {
      const { host, scroller } = await render();
      expect(host.indexChanges()).toEqual([]);

      await scroller.scrollToOffset(48 * 5000);

      await expect.poll(() => host.indexChanges().length).toBeGreaterThan(0);
      const range = host.indexChanges().at(-1);
      expect(range?.first).toBeGreaterThan(4000);
      expect(range?.last).toBeGreaterThan(range?.first ?? Infinity);
    });

    it('scrollToIndex brings an item to the start of the viewport', async () => {
      const { host, scroller } = await render();

      host.scroller().scrollToIndex(3000);

      await expect.poll(() => scroller.getRenderedItemTexts()).toContain('Item 3001');
      await expect.poll(() => part(document.body, VIEWPORT).scrollTop).toBe(48 * 3000);
    });

    it('scrollToIndex takes a scroll behaviour', async () => {
      const { host, scroller } = await render();

      host.scroller().scrollToIndex(2000, 'instant');

      await expect.poll(() => scroller.getRenderedItemTexts()).toContain('Item 2001');
    });
  });

  describe('lazy and loading', () => {
    it('lazy asks for the first range with lazyLoad, and for more as it is scrolled', async () => {
      const { host, scroller } = await render('light', (initial) => {
        initial.lazy.set(true);
      });
      await expect.poll(() => host.lazyLoads().length).toBeGreaterThan(0);
      expect(host.lazyLoads()[0]?.first).toBe(0);

      const before = host.lazyLoads().length;
      await scroller.scrollToOffset(48 * 4000);

      await expect.poll(() => host.lazyLoads().length).toBeGreaterThan(before);
      expect(host.lazyLoads().at(-1)?.first).toBeGreaterThan(3000);
    });

    it('is not lazy by default: scrolling asks for nothing', async () => {
      const { host, scroller } = await render();

      await scroller.scrollToOffset(48 * 4000);
      await expect.poll(() => host.indexChanges().length).toBeGreaterThan(0);

      expect(host.lazyLoads()).toEqual([]);
    });

    it('loading, with the loader slot, shows one placeholder for each item in view', async () => {
      const { element, fixture, host, scroller } = await render('light', (initial) => {
        initial.lazy.set(true);
        initial.withLoader.set(true);
      });
      expect(parts(element, '.loader-item')).toEqual([]);
      expect(await scroller.isLoading()).toBe(false);

      host.loading.set(true);
      await fixture.whenStable();

      await expect.poll(() => parts(element, '.loader-item').length).toBeGreaterThan(0);
      const placeholders = parts(element, '.loader-item');
      // 20rem at 48 px: seven items fit.
      expect(placeholders).toHaveLength(7);
      expect(placeholders.map((item) => item.textContent.trim())).toEqual([
        '0',
        '1',
        '2',
        '3',
        '4',
        '5',
        '6',
      ]);
      expect(await scroller.isLoading()).toBe(true);
      expect(await scroller.getRenderedItemTexts()).toEqual([]);

      host.loading.set(false);
      await fixture.whenStable();

      await expect.poll(() => parts(element, '.loader-item')).toEqual([]);
      await expect.poll(() => scroller.getRenderedItemTexts().then((t) => t[0])).toBe('Item 1');
      expect(await scroller.isLoading()).toBe(false);
    });

    it('shows no placeholder without the loader slot', async () => {
      const { element, fixture, host, scroller } = await render('light', (initial) => {
        initial.lazy.set(true);
      });

      host.loading.set(true);
      await fixture.whenStable();

      await expect.poll(() => scroller.getRenderedItemTexts()).toEqual([]);
      expect(element.querySelector('.p-virtualscroller-loader')).toBeNull();
      expect(await scroller.isLoading()).toBe(true);
    });

    it('loading does nothing, and is not announced, unless the scroller is lazy', async () => {
      const { fixture, host, scroller } = await render('light', (initial) => {
        initial.withLoader.set(true);
      });

      host.loading.set(true);
      await fixture.whenStable();

      expect(await scroller.isLoading()).toBe(false);
      expect((await scroller.getRenderedItemTexts())[0]).toBe('Item 1');
    });
  });

  describe('slots', () => {
    it('renders the item template for each rendered item, with the typed context', async () => {
      const { element, scroller } = await render();

      const first = part(element, '.item');
      expect(first.textContent.trim()).toBe('Item 1');
      expect(first.dataset['index']).toBe('0');
      expect(first.dataset['first']).toBe('true');
      expect(first.dataset['last']).toBe('false');
      expect(first.dataset['even']).toBe('true');
      expect(first.dataset['odd']).toBe('false');
      expect(first.getAttribute('aria-setsize')).toBe('10000');
      expect(first.getAttribute('aria-posinset')).toBe('1');
      const second = parts(element, '.item')[1];
      expect(second?.dataset['odd']).toBe('true');
      expect(second?.dataset['even']).toBe('false');
      expect(second?.getAttribute('aria-posinset')).toBe('2');

      await scroller.scrollToOffset(48 * 10_000);
      await expect.poll(() => scroller.getRenderedItemTexts()).toContain('Item 10000');
      const last = parts(element, '.item').at(-1);
      expect(last?.dataset['index']).toBe('9999');
      expect(last?.dataset['last']).toBe('true');
    });

    it('renders the loader template with the index of each placeholder', async () => {
      const { element, fixture, host } = await render('light', (initial) => {
        initial.lazy.set(true);
        initial.withLoader.set(true);
      });

      host.loading.set(true);
      await fixture.whenStable();

      await expect.poll(() => parts(element, '.loader-item').length).toBe(7);
      expect(part(element, '.p-virtualscroller-loader').children).toHaveLength(7);
    });

    it('renders nothing, and fails nowhere, for a scroller with no item slot', async () => {
      TestBed.configureTestingModule({ providers: [provideWeeljack()] });
      const fixture = TestBed.createComponent(RoutedHost);
      await fixture.whenStable();
      const scroller =
        await TestbedHarnessEnvironment.loader(fixture).getHarness(WjScrollerHarness);

      expect(await scroller.getRenderedItemTexts()).toEqual([]);
      expect(warn).not.toHaveBeenCalled();
    });
  });

  describe('FR-9: the app’s array is never changed', () => {
    it('keeps its reference, its order and its freeze through scrolling and a lazy round', async () => {
      const { host, scroller } = await render('light', (initial) => {
        initial.lazy.set(true);
      });
      const bound = host.items();
      const snapshot = JSON.stringify(bound);

      await scroller.scrollToOffset(48 * 4000);
      await expect.poll(() => scroller.getRenderedItemTexts()).toContain('Item 4001');
      host.loading.set(true);
      await scroller.scrollToOffset(0);
      host.loading.set(false);
      await scroller.scrollToOffset(48 * 9000);

      expect(host.items()).toBe(bound);
      expect(Object.isFrozen(bound)).toBe(true);
      expect(JSON.stringify(bound)).toBe(snapshot);
    });
  });

  describe('harness', () => {
    it('finds a scroller by its name, from ariaLabel or from the element ariaLabelledBy points at', async () => {
      const { fixture, host } = await render();
      const loader = TestbedHarnessEnvironment.loader(fixture);
      expect(
        await loader.getAllHarnesses(WjScrollerHarness.with({ name: 'Items list' })),
      ).toHaveLength(1);
      expect(await loader.getAllHarnesses(WjScrollerHarness.with({ name: /^Other/ }))).toHaveLength(
        0,
      );

      host.ariaLabel.set(undefined);
      host.ariaLabelledBy.set('name');
      await fixture.whenStable();

      const named = await loader.getHarness(WjScrollerHarness.with({ name: 'Items list' }));
      expect(await named.getName()).toBe('Items list');
    });

    it('getName is empty for an unnamed scroller', async () => {
      const { scroller } = await render('light', (host) => {
        host.ariaLabel.set(undefined);
      });

      expect(await scroller.getName()).toBe('');
    });
  });

  describe('pt', () => {
    it('forwards a pt object to the parts, the root included', async () => {
      const { element } = await render('light', (host) => {
        host.pt.set({
          root: { 'data-root': 'yes' },
          content: { role: 'list', 'data-content': 'yes' },
          spacer: { 'data-spacer': 'yes' },
        });
      });

      expect(part(element, VIEWPORT).dataset['root']).toBe('yes');
      expect(part(element, '.p-virtualscroller-content').dataset['content']).toBe('yes');
      expect(part(element, '.p-virtualscroller-spacer').dataset['spacer']).toBe('yes');
      expect(part(element, VIEWPORT).getAttribute('role')).toBe('region');
    });

    it('forwards the function form too, and keeps the routed role and name', async () => {
      const { element } = await render('light', (host) => {
        host.pt.set(() => ({ root: { 'data-fn': 'yes' }, content: { role: 'list' } }));
      });

      expect(part(element, VIEWPORT).dataset['fn']).toBe('yes');
      expect(part(element, VIEWPORT).getAttribute('role')).toBe('region');
      expect(part(element, VIEWPORT).getAttribute('aria-label')).toBe('Items list');
      expect(part(element, '.p-virtualscroller-content').getAttribute('role')).toBe('list');
    });

    it('lets a routed attribute win over a pt value of the same name', async () => {
      const { element } = await render('light', (host) => {
        host.pt.set({
          root: { role: 'group', 'aria-label': 'From pt' },
          content: { role: 'list' },
        });
      });

      expect(part(element, VIEWPORT).getAttribute('role')).toBe('region');
      expect(part(element, VIEWPORT).getAttribute('aria-label')).toBe('Items list');
    });
  });

  describe('ARIA', () => {
    it('routes the name onto the root, a focusable region, and not onto the host', async () => {
      const { element } = await render();
      const viewport = part(element, VIEWPORT);

      expect(viewport.getAttribute('role')).toBe('region');
      expect(viewport.getAttribute('aria-label')).toBe('Items list');
      expect(viewport.getAttribute('tabindex')).toBe('0');
      expect(part(element, 'wj-scroller').hasAttribute('aria-label')).toBe(false);
      expect(part(element, 'wj-scroller').hasAttribute('role')).toBe(false);
    });

    it('routes ariaLabelledBy, and drops the attributes it no longer has', async () => {
      const { element, fixture, host } = await render();

      host.ariaLabel.set(undefined);
      host.ariaLabelledBy.set('name');
      await fixture.whenStable();

      const viewport = part(element, VIEWPORT);
      expect(viewport.getAttribute('aria-labelledby')).toBe('name');
      expect(viewport.hasAttribute('aria-label')).toBe(false);

      host.ariaLabelledBy.set(undefined);
      await fixture.whenStable();

      expect(viewport.hasAttribute('aria-labelledby')).toBe(false);
      expect(viewport.getAttribute('role')).toBe('region');
    });

    it('marks the region busy only while a lazy scroller loads', async () => {
      const { element, fixture, host } = await render('light', (initial) => {
        initial.lazy.set(true);
      });
      expect(part(element, VIEWPORT).hasAttribute('aria-busy')).toBe(false);

      host.loading.set(true);
      await fixture.whenStable();
      expect(part(element, VIEWPORT).getAttribute('aria-busy')).toBe('true');

      host.loading.set(false);
      await fixture.whenStable();
      expect(part(element, VIEWPORT).hasAttribute('aria-busy')).toBe(false);
    });

    it('warns WJ0003 once, with advice that names only the inputs it has, for aria-* on the host', async () => {
      TestBed.configureTestingModule({ providers: [provideWeeljack()] });
      const fixture = TestBed.createComponent(AriaOnHostHost);
      await fixture.whenStable();

      expect(warn).toHaveBeenCalledTimes(1);
      expect(warn).toHaveBeenCalledWith(
        'WJ0003: wj-scroller: aria-label is set on the host, where it is not forwarded to the ' +
          'focusable element. Use the ariaLabel or ariaLabelledBy input instead. ' +
          'Find more at https://locvodever.github.io/weeljack-ng/errors/WJ0003',
      );
    });

    it('stays silent when only the routed inputs are used', async () => {
      TestBed.configureTestingModule({ providers: [provideWeeljack()] });
      const fixture = TestBed.createComponent(RoutedHost);
      await fixture.whenStable();

      expect(warn).not.toHaveBeenCalled();
    });

    it('warns WJ0001 when provideWeeljack is missing', async () => {
      const fixture = TestBed.createComponent(RoutedHost);
      await fixture.whenStable();

      expect(warn).toHaveBeenCalledTimes(1);
      expect(warn).toHaveBeenCalledWith(
        'WJ0001: wj-scroller: provideWeeljack() is missing from the application providers. ' +
          'Add provideWeeljack() to your application config. ' +
          'Find more at https://locvodever.github.io/weeljack-ng/errors/WJ0001',
      );
    });
  });

  describe('HTML payloads', () => {
    it('renders an item’s text as text', async () => {
      const { element, scroller } = await render('light', (host) => {
        host.items.set([{ id: 1, name: PAYLOAD }]);
      });

      expect(await scroller.getRenderedItemTexts()).toEqual([PAYLOAD]);
      expect(element.querySelector('img')).toBeNull();
      expect(Reflect.get(window, 'wjInjected')).toBeUndefined();
    });

    it('sets ariaLabel and ariaLabelledBy as attribute text and creates no element', async () => {
      const { element, fixture, host } = await render('light', (initial) => {
        initial.ariaLabel.set(PAYLOAD);
      });
      expect(part(element, VIEWPORT).getAttribute('aria-label')).toBe(PAYLOAD);

      host.ariaLabel.set(undefined);
      host.ariaLabelledBy.set(PAYLOAD);
      await fixture.whenStable();

      expect(part(element, VIEWPORT).getAttribute('aria-labelledby')).toBe(PAYLOAD);
      expect(element.querySelector('img')).toBeNull();
      expect(Reflect.get(window, 'wjInjected')).toBeUndefined();
    });

    it('treats scrollHeight and scrollWidth as CSS lengths, never as markup', async () => {
      const { element, fixture, host } = await render(
        'light',
        (initial) => {
          initial.scrollHeight.set(PAYLOAD);
          initial.orientation.set('horizontal');
          initial.scrollWidth.set(PAYLOAD);
        },
        false,
      );
      await fixture.whenStable();

      expect(element.querySelector('img')).toBeNull();
      expect(part(element, VIEWPORT).style.height).not.toContain('<img');
      expect(host.scrollWidth()).toBe(PAYLOAD);
      expect(part(element, VIEWPORT).style.width).not.toContain('<img');
      expect(Reflect.get(window, 'wjInjected')).toBeUndefined();
    });
  });

  describe('keyboard', () => {
    it('Tab focuses the scrolling region, once, and shows the 2 px ring at a 2 px offset', async () => {
      const { element } = await render();
      part(element, '#before').focus();

      await userEvent.tab();

      const viewport = part(element, VIEWPORT);
      expect(document.activeElement).toBe(viewport);
      const style = getComputedStyle(viewport);
      expect(style.outlineStyle).toBe('solid');
      expect(style.outlineWidth).toBe('2px');
      expect(style.outlineOffset).toBe('2px');
      expect(style.outlineColor).not.toBe('rgba(0, 0, 0, 0)');

      await userEvent.tab();
      expect(document.activeElement).toBe(part(element, '#after'));
      await userEvent.tab({ shift: true });
      expect(document.activeElement).toBe(viewport);
    });

    it('shows no ring when the region is not focused', async () => {
      const { element } = await render();

      expect(getComputedStyle(part(element, VIEWPORT)).outlineStyle).toBe('none');
    });

    it('ArrowDown and ArrowUp scroll the region by a line', async () => {
      const { element } = await render();
      const viewport = part(element, VIEWPORT);
      viewport.focus();

      await userEvent.keyboard('{ArrowDown}');
      await expect.poll(() => viewport.scrollTop).toBeGreaterThan(0);
      const down = viewport.scrollTop;

      await userEvent.keyboard('{ArrowUp}');
      await expect.poll(() => viewport.scrollTop).toBeLessThan(down);
    });

    it('PageDown and PageUp scroll the region by about a viewport, and the window follows', async () => {
      const { element, scroller } = await render();
      const viewport = part(element, VIEWPORT);
      viewport.focus();

      await userEvent.keyboard('{PageDown}');
      await expect.poll(() => viewport.scrollTop).toBeGreaterThan(200);
      const down = viewport.scrollTop;
      await expect
        .poll(() =>
          scroller
            .getRenderedItemTexts()
            .then((texts) => texts.includes(`Item ${String(Math.floor(down / 48) + 2)}`)),
        )
        .toBe(true);

      await userEvent.keyboard('{PageUp}');
      await expect.poll(() => viewport.scrollTop).toBeLessThan(down);
    });

    it('End and Home scroll the region to its last and first item', async () => {
      const { element, scroller } = await render();
      const viewport = part(element, VIEWPORT);
      viewport.focus();

      await userEvent.keyboard('{End}');
      await expect.poll(() => scroller.getRenderedItemTexts(), SCROLL).toContain('Item 10000');
      expect(viewport.scrollTop + viewport.clientHeight).toBe(viewport.scrollHeight);

      // Chrome sometimes drops a key pressed as the End animation settles: press until it takes.
      await vi.waitFor(async () => {
        if (viewport.scrollTop !== 0) {
          await userEvent.keyboard('{Home}');
        }
        expect(viewport.scrollTop).toBe(0);
      }, SCROLL);
      await expect.poll(() => scroller.getRenderedItemTexts(), SCROLL).toContain('Item 1');
    });
  });

  describe('axe', () => {
    describe.each<Scheme>(['light', 'dark'])('%s', (scheme) => {
      it.each(STATES)('has no axe violations: %s', async (_name, setup, after) => {
        const { element, scroller } = await render(scheme, setup, !_name.startsWith('lazy'));
        await after?.(scroller);

        await expectNoAxeViolations(element);
      });

      it('has no axe violations while the region has focus', async () => {
        const { element } = await render(scheme);
        part(element, VIEWPORT).focus();

        await expectNoAxeViolations(element);
      });
    });
  });
});
