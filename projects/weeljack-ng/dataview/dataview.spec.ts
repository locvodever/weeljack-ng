import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Component, computed, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import type { MockInstance } from 'vitest';
import { userEvent } from 'vitest/browser';
import { provideWeeljack, type WjPageEvent, type WjPaginatorPosition } from 'weeljack-ng';
import {
  WjDataView,
  WjDataViewEmptySlot,
  WjDataViewFooterSlot,
  WjDataViewHeaderSlot,
  WjDataViewItemSlot,
  type WjDataViewLayout,
  type WjDataViewPt,
} from 'weeljack-ng/dataview';
import { WjDataViewHarness } from 'weeljack-ng/dataview/testing';
import { WjPaginator } from 'weeljack-ng/paginator';
import { WjPaginatorHarness } from 'weeljack-ng/paginator/testing';
import { expectNoAxeViolations } from '../spec-support/axe';

const PAYLOAD = '<img src=x onerror="window.wjInjected = true">';
const ROOT = document.documentElement;

type Scheme = 'light' | 'dark';

interface Product {
  id: number;
  name: string;
}

function makeProducts(count: number): Product[] {
  return Array.from({ length: count }, (_unused, index) => ({
    id: index + 1,
    name: `Product ${String(index + 1)}`,
  }));
}

/** A `pageChange`, with the models as they were when it fired. */
interface PageSeen {
  event: WjPageEvent;
  first: number;
  rows: number | undefined;
}

interface Seen {
  index: string | undefined;
  layout: string | undefined;
}

/** A consumer's template: a view between two buttons, with every slot a consumer can give. */
@Component({
  selector: 'wj-dataview-host',
  imports: [
    WjDataView,
    WjDataViewItemSlot,
    WjDataViewHeaderSlot,
    WjDataViewFooterSlot,
    WjDataViewEmptySlot,
  ],
  template: `
    <button type="button" id="before">Before</button>
    <p id="name">Products list</p>
    <div class="frame" [class.narrow]="narrow()">
      <wj-dataview
        [value]="items()"
        [layout]="layout()"
        [dataKey]="dataKey()"
        [paginator]="paginator()"
        [(first)]="first"
        [(rows)]="rows"
        [totalRecords]="totalRecords()"
        [rowsPerPageOptions]="rowsPerPageOptions()"
        [paginatorPosition]="paginatorPosition()"
        [lazy]="lazy()"
        [loading]="loading()"
        [ariaLabel]="ariaLabel()"
        [ariaLabelledBy]="ariaLabelledBy()"
        [pt]="pt()"
        (pageChange)="
          pages.update((list) => [...list, { event: $event, first: first(), rows: rows() }])
        "
        (lazyLoad)="lazyLoads.update((list) => [...list, $event])"
      >
        <ng-template
          wjDataViewItem
          [wjDataViewItemOf]="items()"
          let-product
          let-i="index"
          let-l="layout"
        >
          <div class="item" [attr.data-index]="i" [attr.data-layout]="l">
            <button type="button" class="open">{{ product.name }}</button>
            @if (tall().includes(product.id)) {
              <p class="tall">One. Two. Three. Four. Five. Six. Seven. Eight.</p>
            }
          </div>
        </ng-template>
        @if (withHeader()) {
          <ng-template wjDataViewHeader><span class="header-text">Header text</span></ng-template>
        }
        @if (withFooter()) {
          <ng-template wjDataViewFooter><span class="footer-text">Footer text</span></ng-template>
        }
        @if (withEmpty()) {
          <ng-template wjDataViewEmpty
            ><span class="empty-text">{{ emptyText() }}</span></ng-template
          >
        }
      </wj-dataview>
    </div>
    <button type="button" id="after">After</button>
  `,
  styles: `
    :host {
      color: var(--wj-text-color);
    }
    .frame {
      inline-size: 40rem;
    }
    .frame.narrow {
      inline-size: 10rem;
    }
    button {
      min-block-size: 44px;
      min-inline-size: 44px;
    }
    .item {
      color: var(--wj-text-color);
    }
    .tall {
      margin: 0;
      color: var(--wj-text-muted-color);
    }
  `,
})
class Host {
  readonly items = signal<readonly Product[]>(makeProducts(24));
  readonly layout = signal<WjDataViewLayout>('list');
  readonly dataKey = signal('');
  readonly paginator = signal(false);
  readonly first = signal(0);
  readonly rows = signal<number | undefined>(undefined);
  readonly totalRecords = signal(0);
  readonly rowsPerPageOptions = signal<number[] | undefined>(undefined);
  readonly paginatorPosition = signal<WjPaginatorPosition>('bottom');
  readonly lazy = signal(false);
  readonly loading = signal(false);
  readonly ariaLabel = signal<string | undefined>('Products list');
  readonly ariaLabelledBy = signal<string | undefined>(undefined);
  readonly pt = signal<WjDataViewPt | undefined>(undefined);
  readonly narrow = signal(false);
  readonly tall = signal<number[]>([]);
  readonly withHeader = signal(false);
  readonly withFooter = signal(false);
  readonly withEmpty = signal(false);
  readonly emptyText = signal('No products match.');
  readonly pages = signal<PageSeen[]>([]);
  readonly lazyLoads = signal<WjPageEvent[]>([]);
}

/** A consumer who writes `aria-label` on the host instead of using the input. */
@Component({
  selector: 'wj-dataview-aria-host',
  imports: [WjDataView],
  template: `<wj-dataview [value]="[]" aria-label="Products" />`,
})
class AriaOnHostHost {}

/** A consumer who uses the routed inputs only, and gives the view no item slot. */
@Component({
  selector: 'wj-dataview-routed-host',
  imports: [WjDataView],
  template: `<wj-dataview [value]="items" ariaLabel="Products" />`,
})
class RoutedHost {
  readonly items = makeProducts(3);
}

/**
 * FR-8's recipe as built: the view's own pager is off and it is given the current page, cut from
 * the `first` and `rows` the `wj-paginator` writes. `sliced` switches to the recipe the PRD first
 * described: every item given, `[(first)]` and `[(rows)]` bound on both.
 */
@Component({
  selector: 'wj-dataview-beside-host',
  imports: [WjDataView, WjDataViewItemSlot, WjPaginator],
  template: `
    <wj-dataview
      [value]="sliced() ? page() : all"
      [(first)]="first"
      [(rows)]="rows"
      ariaLabel="Products"
    >
      <ng-template wjDataViewItem [wjDataViewItemOf]="all" let-product>{{
        product.name
      }}</ng-template>
    </wj-dataview>
    <wj-paginator
      [totalRecords]="all.length"
      [(first)]="first"
      [(rows)]="rows"
      [rowsPerPageOptions]="[6, 12]"
      showCurrentPageReport
      ariaLabel="Product pages"
    />
  `,
})
class BesideHost {
  readonly all = makeProducts(24);
  readonly first = signal(0);
  readonly rows = signal(6);
  readonly sliced = signal(true);
  readonly page = computed(() => this.all.slice(this.first(), this.first() + this.rows()));
}

interface Rendered {
  fixture: ComponentFixture<Host>;
  host: Host;
  view: WjDataViewHarness;
  element: HTMLElement;
}

type Translation = NonNullable<Parameters<typeof provideWeeljack>[0]>['translation'];

/** Renders the host with `provideWeeljack`, in the given colour scheme, after `setup` ran. */
async function render(
  scheme: Scheme = 'light',
  setup: (host: Host) => void = () => undefined,
  translation: Translation = {},
): Promise<Rendered> {
  ROOT.classList.toggle('wj-dark', scheme === 'dark');
  document.body.style.backgroundColor = 'var(--wj-content-background)';
  TestBed.configureTestingModule({
    providers: [provideWeeljack({ darkMode: 'class', translation })],
  });
  const fixture = TestBed.createComponent(Host);
  setup(fixture.componentInstance);
  await fixture.whenStable();
  const element = fixture.nativeElement as HTMLElement;
  const view = await TestbedHarnessEnvironment.loader(fixture).getHarness(WjDataViewHarness);
  // A render without Optimus's styles would pass axe for the wrong reason: fail loudly instead.
  expect(getComputedStyle(part(element, 'p-dataview')).display).toBe('block');
  expect(getComputedStyle(part(element, 'p-dataview')).fontFamily).not.toBe('');
  return { fixture, host: fixture.componentInstance, view, element };
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

/** What each item template saw, in order. */
function seen(element: ParentNode): Seen[] {
  return parts(element, '.item').map((item) => ({
    index: item.dataset['index'],
    layout: item.dataset['layout'],
  }));
}

function columns(list: HTMLElement): number {
  return getComputedStyle(list).gridTemplateColumns.split(' ').length;
}

const SELECT = '.p-paginator-rpp-dropdown [role="combobox"]';

/** Optimus marks the overlay motion with classes on `p-motion`: wait until the enter is over. */
async function overlayOpen(): Promise<void> {
  const motion = (): string | undefined => document.querySelector('p-motion')?.className;
  await expect.poll(motion).toContain('-enter-');
  await expect.poll(motion).toBe('p-motion');
}

/** Closes the rows-per-page select if it is open, and waits for its leave to end. */
async function closeSelect(element: HTMLElement): Promise<void> {
  const combobox = element.querySelector<HTMLElement>(SELECT);
  if (combobox === null) {
    return;
  }
  if (combobox.getAttribute('aria-expanded') === 'true') {
    combobox.focus();
    await userEvent.keyboard('{Escape}');
  }
  await expect.poll(() => combobox.getAttribute('aria-expanded')).toBe('false');
  await expect.poll(() => document.querySelector('[role="listbox"]')).toBeNull();
}

/** The documented states: list, grid, empty, loading, paginated, and the bands. */
const STATES: [string, (host: Host) => void][] = [
  ['list', () => undefined],
  [
    'grid',
    (host) => {
      host.layout.set('grid');
    },
  ],
  [
    'grid, narrower than one track',
    (host) => {
      host.layout.set('grid');
      host.narrow.set(true);
    },
  ],
  [
    'empty',
    (host) => {
      host.items.set([]);
    },
  ],
  [
    'empty, with the empty slot',
    (host) => {
      host.items.set([]);
      host.withEmpty.set(true);
    },
  ],
  [
    'loading',
    (host) => {
      host.loading.set(true);
    },
  ],
  [
    'loading, empty',
    (host) => {
      host.items.set([]);
      host.loading.set(true);
    },
  ],
  [
    'paginated',
    (host) => {
      host.paginator.set(true);
      host.rows.set(6);
    },
  ],
  [
    'paginated, grid, pager on both sides, with the page sizes',
    (host) => {
      host.layout.set('grid');
      host.paginator.set(true);
      host.rows.set(6);
      host.paginatorPosition.set('both');
      host.rowsPerPageOptions.set([6, 12, 24]);
    },
  ],
  [
    'header and footer',
    (host) => {
      host.withHeader.set(true);
      host.withFooter.set(true);
    },
  ],
  [
    'named by a visible label',
    (host) => {
      host.ariaLabel.set(undefined);
      host.ariaLabelledBy.set('name');
    },
  ],
];

describe('WjDataView', () => {
  let warn: MockInstance<typeof console.warn>;
  let closeAtTeardown: (() => Promise<void>) | undefined;

  beforeEach(() => {
    // Optimus injects its styles after the first render, and every colour then transitions for
    // 0.2s from the browser default. Measure the end state, not the animation.
    const noMotion = document.createElement('style');
    noMotion.id = 'wj-spec-no-motion';
    noMotion.textContent = '*, *::before, *::after { transition: none !important; }';
    document.head.append(noMotion);
    warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    closeAtTeardown = undefined;
  });

  afterEach(async () => {
    await closeAtTeardown?.();
    document.getElementById('wj-spec-no-motion')?.remove();
    ROOT.classList.remove('wj-dark');
    document.body.style.backgroundColor = '';
    document.head.querySelectorAll('style[data-optimus-style-id]').forEach((style) => {
      style.remove();
    });
    Reflect.deleteProperty(window, 'wjInjected');
  });

  /** Registers the rows-per-page select to be closed before teardown. */
  function watchSelect(element: HTMLElement): void {
    closeAtTeardown = () => closeSelect(element);
  }

  describe('items', () => {
    it('writes a list with one li per item, in order, and no bullets, margin or padding', async () => {
      const { element, view } = await render();

      const list = part(element, 'ul');
      expect(list.getAttribute('role')).toBe('list');
      expect(parts(list, ':scope > li')).toHaveLength(24);
      expect((await view.getItemTexts()).slice(0, 3)).toEqual([
        'Product 1',
        'Product 2',
        'Product 3',
      ]);
      const style = getComputedStyle(list);
      expect(style.listStyleType).toBe('none');
      expect(style.margin).toBe('0px');
      expect(style.padding).toBe('0px');
      expect(style.display).toBe('block');
    });

    it('adds no padding, border, fill or radius to an item, and lets it shrink', async () => {
      const { element } = await render();

      const style = getComputedStyle(part(element, 'li'));
      expect(style.padding).toBe('0px');
      expect(style.borderTopWidth).toBe('0px');
      expect(style.backgroundColor).toBe('rgba(0, 0, 0, 0)');
      expect(style.borderRadius).toBe('0px');
      expect(style.minInlineSize).toBe('0px');
    });

    it('stacks the list layout edge to edge, with no gap', async () => {
      const { element } = await render();

      const [first, second] = parts(element, 'li');
      expect(first?.getBoundingClientRect().bottom).toBe(second?.getBoundingClientRect().top);
    });

    it('gives the item template the item, its index in the whole list and the layout', async () => {
      const { element, fixture, host } = await render();
      expect(seen(element).slice(0, 2)).toEqual([
        { index: '0', layout: 'list' },
        { index: '1', layout: 'list' },
      ]);

      host.layout.set('grid');
      await fixture.whenStable();

      expect(seen(element)[1]).toEqual({ index: '1', layout: 'grid' });
    });

    it('follows new items, and renders none while value is empty', async () => {
      const { fixture, host, view } = await render();

      host.items.set(makeProducts(2));
      await fixture.whenStable();
      expect(await view.getItemTexts()).toEqual(['Product 1', 'Product 2']);

      host.items.set([]);
      await fixture.whenStable();
      expect(await view.isEmpty()).toBe(true);
    });

    it('dataKey keeps an item’s DOM when its object is replaced, and without it the DOM is new', async () => {
      const { element, fixture, host } = await render('light', (initial) => {
        initial.items.set(makeProducts(3));
      });
      const before = parts(element, 'li');

      host.items.set(makeProducts(3));
      await fixture.whenStable();
      expect(parts(element, 'li').some((li) => before.includes(li))).toBe(false);

      host.dataKey.set('id');
      await fixture.whenStable();
      const keyed = parts(element, 'li');

      host.items.set(makeProducts(3));
      await fixture.whenStable();
      expect(parts(element, 'li')).toEqual(keyed);
    });

    it('renders blank items, and fails nowhere, for a view with no item slot', async () => {
      TestBed.configureTestingModule({ providers: [provideWeeljack()] });
      const fixture = TestBed.createComponent(RoutedHost);
      await fixture.whenStable();

      expect(parts(fixture.nativeElement as HTMLElement, 'li')).toHaveLength(3);
      expect(warn).not.toHaveBeenCalled();
    });
  });

  describe('layout', () => {
    it('is a list by default, and the harness says so', async () => {
      const { view } = await render();

      expect(await view.getLayout()).toBe('list');
    });

    it('grid lays the items out in tracks of at least 16rem, 16 px apart, and follows layout back', async () => {
      const { element, fixture, host, view } = await render('light', (initial) => {
        initial.layout.set('grid');
      });

      const list = part(element, 'ul');
      expect(await view.getLayout()).toBe('grid');
      expect(getComputedStyle(list).display).toBe('grid');
      expect(columns(list)).toBe(2);
      expect(getComputedStyle(list).columnGap).toBe('16px');
      expect(getComputedStyle(list).rowGap).toBe('16px');
      const [first, second] = parts(list, 'li');
      expect(first?.getBoundingClientRect().right).toBe(
        (second?.getBoundingClientRect().left ?? 0) - 16,
      );

      host.layout.set('list');
      await fixture.whenStable();
      expect(await view.getLayout()).toBe('list');
      expect(getComputedStyle(part(element, 'ul')).display).toBe('block');
    });

    it('--wj-dataview-grid-item-min-width sets the track minimum, 16rem by default', async () => {
      const { element, fixture } = await render('light', (host) => {
        host.layout.set('grid');
      });
      const view = part(element, 'wj-dataview');
      expect(columns(part(element, 'ul'))).toBe(2);

      view.style.setProperty('--wj-dataview-grid-item-min-width', '10rem');
      await fixture.whenStable();
      expect(columns(part(element, 'ul'))).toBe(3);

      view.style.setProperty('--wj-dataview-grid-item-min-width', '30rem');
      await fixture.whenStable();
      expect(columns(part(element, 'ul'))).toBe(1);
    });

    it('keeps one column inside a container narrower than a track, instead of overflowing', async () => {
      const { element } = await render('light', (host) => {
        host.layout.set('grid');
        host.narrow.set(true);
      });

      const list = part(element, 'ul');
      expect(columns(list)).toBe(1);
      expect(list.scrollWidth).toBeLessThanOrEqual(list.clientWidth);
      expect(part(element, 'li').offsetWidth).toBe(part(element, '.frame').clientWidth);
    });

    it('stretches the items of a row to the tallest one', async () => {
      const { element } = await render('light', (host) => {
        host.layout.set('grid');
        host.tall.set([1]);
      });

      const [first, second] = parts(element, 'li');
      expect(first?.offsetHeight).toBe(second?.offsetHeight);
      expect(parts(element, 'li')[2]?.offsetHeight).toBeLessThan(first?.offsetHeight ?? 0);
    });

    it('re-flows at once: no animation, and the focus stays where it is', async () => {
      const { element, fixture, host } = await render();
      part(element, '#before').focus();

      host.layout.set('grid');
      await fixture.whenStable();

      expect(document.activeElement).toBe(part(element, '#before'));
      expect(getComputedStyle(part(element, 'ul')).animationName).toBe('none');
      expect(warn).not.toHaveBeenCalled();
    });
  });

  describe('empty', () => {
    it('writes no list, and shows the translation’s emptyMessage', async () => {
      const { element, view } = await render('light', (host) => {
        host.items.set([]);
      });

      expect(element.querySelector('ul')).toBeNull();
      expect(await view.isEmpty()).toBe(true);
      expect(await view.getEmptyText()).toBe('No available options');
    });

    it('follows a translation emptyMessage, and renders it as text', async () => {
      const { element, view } = await render(
        'light',
        (host) => {
          host.items.set([]);
        },
        { emptyMessage: PAYLOAD },
      );

      expect(await view.getEmptyText()).toBe(PAYLOAD);
      expect(element.querySelector('img')).toBeNull();
      expect(Reflect.get(window, 'wjInjected')).toBeUndefined();
    });

    it('wjDataViewEmpty replaces the default text, and renders its text as text', async () => {
      const { element, view } = await render('light', (host) => {
        host.items.set([]);
        host.withEmpty.set(true);
        host.emptyText.set(PAYLOAD);
      });

      expect(await view.getEmptyText()).toBe(PAYLOAD);
      expect(element.querySelector('img')).toBeNull();
      expect(Reflect.get(window, 'wjInjected')).toBeUndefined();
    });

    it('keeps the header and footer, and goes away when items arrive', async () => {
      const { element, fixture, host, view } = await render('light', (initial) => {
        initial.items.set([]);
        initial.withHeader.set(true);
        initial.withFooter.set(true);
      });
      expect(part(element, '.header-text').textContent).toBe('Header text');
      expect(part(element, '.footer-text').textContent).toBe('Footer text');

      host.items.set(makeProducts(2));
      await fixture.whenStable();

      expect(await view.getEmptyText()).toBe('');
      expect(part(element, '.header-text')).toBeTruthy();
    });

    it('is not shown while loading, and the harness reads empty text as blank', async () => {
      const { view } = await render('light', (host) => {
        host.items.set([]);
        host.loading.set(true);
      });

      expect(await view.isLoading()).toBe(true);
      expect(await view.getEmptyText()).toBe('');
    });
  });

  describe('loading', () => {
    it('shows Optimus’s mask over the items, and takes it away', async () => {
      const { element, fixture, host, view } = await render('light', (initial) => {
        initial.loading.set(true);
      });

      expect(await view.isLoading()).toBe(true);
      expect(parts(element, 'li')).toHaveLength(24);

      host.loading.set(false);
      await fixture.whenStable();
      expect(await view.isLoading()).toBe(false);
    });

    it('is not loading by default', async () => {
      const { view } = await render();

      expect(await view.isLoading()).toBe(false);
    });
  });

  describe('slots', () => {
    it('renders the header above the items and the footer below them', async () => {
      const { element } = await render('light', (host) => {
        host.withHeader.set(true);
        host.withFooter.set(true);
      });

      const header = part(element, '.header-text').getBoundingClientRect();
      const list = part(element, 'ul').getBoundingClientRect();
      const footer = part(element, '.footer-text').getBoundingClientRect();
      expect(header.bottom).toBeLessThanOrEqual(list.top);
      expect(footer.top).toBeGreaterThanOrEqual(list.bottom);
    });

    it('writes no band for a slot it was not given', async () => {
      const { element } = await render();

      expect(element.querySelector('.p-dataview-header')).toBeNull();
      expect(element.querySelector('.p-dataview-footer')).toBeNull();
    });
  });

  describe('paging', () => {
    it('shows every item, and no pager, until paginator is on', async () => {
      const { element, view } = await render();

      expect(await view.getItemTexts()).toHaveLength(24);
      expect(element.querySelector('p-paginator')).toBeNull();
      expect(await view.getCurrentPage()).toBe(0);
    });

    it('paginator shows one page of 10 items by default, and a pager under them', async () => {
      const { element, view } = await render('light', (host) => {
        host.paginator.set(true);
      });

      expect(await view.getItemTexts()).toHaveLength(10);
      expect(await view.getCurrentPage()).toBe(1);
      expect(part(element, 'p-paginator').getBoundingClientRect().top).toBeGreaterThanOrEqual(
        part(element, 'ul').getBoundingClientRect().bottom,
      );
    });

    it('rows sets the page size, first the page, and both follow a change of the model', async () => {
      const { fixture, host, view } = await render('light', (initial) => {
        initial.paginator.set(true);
        initial.rows.set(6);
      });
      expect(await view.getItemTexts()).toEqual(makeProducts(6).map((one) => one.name));

      host.first.set(12);
      await fixture.whenStable();
      expect(await view.getCurrentPage()).toBe(3);
      expect((await view.getItemTexts())[0]).toBe('Product 13');

      host.first.set(0);
      host.rows.set(12);
      await fixture.whenStable();
      expect(await view.getItemTexts()).toHaveLength(12);
    });

    it('the pager moves the page, writes first and rows to the models, and emits pageChange', async () => {
      const { host, view } = await render('light', (initial) => {
        initial.paginator.set(true);
        initial.rows.set(6);
      });

      await view.goToNextPage();
      expect(await view.getCurrentPage()).toBe(2);
      expect((await view.getItemTexts())[0]).toBe('Product 7');
      expect(host.first()).toBe(6);
      expect(host.rows()).toBe(6);
      // The models were written before the output fired.
      expect(host.pages()).toEqual([{ event: { first: 6, rows: 6 }, first: 6, rows: 6 }]);

      await view.goToPage(4);
      expect(host.first()).toBe(18);
      expect(await view.getItemTexts()).toHaveLength(6);

      await view.goToPreviousPage();
      expect(host.first()).toBe(12);
      expect(host.pages()).toHaveLength(3);
    });

    it('gives the item template its index in the whole list across pages', async () => {
      const { element, view } = await render('light', (host) => {
        host.paginator.set(true);
        host.rows.set(6);
      });

      await view.goToPage(3);

      expect(seen(element).map((one) => one.index)).toEqual(['12', '13', '14', '15', '16', '17']);
    });

    it('totalRecords is the length of value unless the view is lazy', async () => {
      const { element, fixture, host } = await render('light', (initial) => {
        initial.paginator.set(true);
        initial.rows.set(6);
        initial.totalRecords.set(500);
      });

      expect(parts(element, '.p-paginator-page')).toHaveLength(4);

      host.items.set(makeProducts(30));
      await fixture.whenStable();
      expect(parts(element, '.p-paginator-page')).toHaveLength(5);
    });

    it('rowsPerPageOptions adds a select that sets the page size and goes back to the first page', async () => {
      const { element, host, view } = await render('light', (initial) => {
        initial.paginator.set(true);
        initial.rows.set(6);
        initial.rowsPerPageOptions.set([6, 12, 24]);
      });
      watchSelect(element);
      await view.goToNextPage();
      const combobox = part(element, SELECT);
      combobox.focus();

      await userEvent.keyboard('{ArrowDown}');
      await overlayOpen();
      await userEvent.keyboard('{ArrowDown}');
      await userEvent.keyboard('{Enter}');

      await expect.poll(() => host.rows()).toBe(12);
      expect(host.first()).toBe(0);
      expect(await view.getItemTexts()).toHaveLength(12);
      expect(host.pages().at(-1)).toEqual({ event: { first: 0, rows: 12 }, first: 0, rows: 12 });
      await closeSelect(element);
    });

    it.each<[WjPaginatorPosition, number, number]>([
      ['top', 1, 0],
      ['bottom', 0, 1],
      ['both', 1, 1],
    ])(
      'paginatorPosition %s puts the pager above and/or below the items',
      async (position, above, below) => {
        const { element } = await render('light', (host) => {
          host.paginator.set(true);
          host.rows.set(6);
          host.paginatorPosition.set(position);
        });

        const list = part(element, 'ul').getBoundingClientRect();
        const pagers = parts(element, 'p-paginator').map((pager) => pager.getBoundingClientRect());
        expect(pagers.filter((pager) => pager.bottom <= list.top)).toHaveLength(above);
        expect(pagers.filter((pager) => pager.top >= list.bottom)).toHaveLength(below);
      },
    );

    it('refuses to move on a view with no pager', async () => {
      const { view } = await render();

      await expect(view.goToNextPage()).rejects.toThrow('is it paginated');
      await expect(view.goToPreviousPage()).rejects.toThrow('is it paginated');
    });

    it('goToPage refuses a page the pager does not have', async () => {
      const { view } = await render('light', (host) => {
        host.paginator.set(true);
        host.rows.set(6);
      });

      await expect(view.goToPage(9)).rejects.toThrow('cannot move to page 9');
    });
  });

  describe('lazy', () => {
    it('asks for the first page on init, and for each page the user moves to', async () => {
      const { fixture, host, view } = await render('light', (initial) => {
        initial.lazy.set(true);
        initial.paginator.set(true);
        initial.rows.set(6);
        initial.items.set(makeProducts(6));
        initial.totalRecords.set(24);
      });
      expect(host.lazyLoads()).toEqual([{ first: 0, rows: 6 }]);
      expect(await view.getItemTexts()).toHaveLength(6);

      await view.goToNextPage();
      host.items.set(makeProducts(12).slice(6));
      await fixture.whenStable();

      expect(host.lazyLoads()).toEqual([
        { first: 0, rows: 6 },
        { first: 6, rows: 6 },
      ]);
      expect(host.pages()).toEqual([{ event: { first: 6, rows: 6 }, first: 6, rows: 6 }]);
      expect(await view.getCurrentPage()).toBe(2);
      expect(await view.getItemTexts()).toEqual([
        'Product 7',
        'Product 8',
        'Product 9',
        'Product 10',
        'Product 11',
        'Product 12',
      ]);
    });

    it('shows the items it is given as the page, with their index in the whole list, and counts pages from totalRecords', async () => {
      const { element, view } = await render('light', (host) => {
        host.lazy.set(true);
        host.paginator.set(true);
        host.rows.set(6);
        host.items.set(makeProducts(6));
        host.totalRecords.set(24);
        host.first.set(12);
      });

      expect(await view.getItemTexts()).toHaveLength(6);
      expect(seen(element)[0]?.index).toBe('12');
      expect(await view.getCurrentPage()).toBe(3);
      expect(parts(element, '.p-paginator-page')).toHaveLength(4);
    });

    it('is not lazy by default: nothing is asked for', async () => {
      const { host } = await render('light', (initial) => {
        initial.paginator.set(true);
      });

      expect(host.lazyLoads()).toEqual([]);
    });
  });

  describe('beside a paginator (the paging finding)', () => {
    async function renderBeside(sliced: boolean): Promise<{
      fixture: ComponentFixture<BesideHost>;
      host: BesideHost;
      view: WjDataViewHarness;
      pager: WjPaginatorHarness;
    }> {
      TestBed.configureTestingModule({ providers: [provideWeeljack()] });
      const fixture = TestBed.createComponent(BesideHost);
      fixture.componentInstance.sliced.set(sliced);
      await fixture.whenStable();
      const loader = TestbedHarnessEnvironment.loader(fixture);
      return {
        fixture,
        host: fixture.componentInstance,
        view: await loader.getHarness(WjDataViewHarness),
        pager: await loader.getHarness(WjPaginatorHarness),
      };
    }

    it('follows the pager when it is given the current page from a computed slice', async () => {
      const { fixture, host, pager, view } = await renderBeside(true);
      expect(await view.getItemTexts()).toEqual(makeProducts(6).map((one) => one.name));

      await pager.goToNextPage();
      await fixture.whenStable();

      expect(host.first()).toBe(6);
      expect(await view.getItemTexts()).toEqual(
        makeProducts(12)
          .slice(6)
          .map((one) => one.name),
      );
      expect(await view.getCurrentPage()).toBe(0);
    });

    it('shows every item when it is given them all with paginator off, though first and rows are bound on both', async () => {
      const { fixture, host, pager, view } = await renderBeside(false);
      expect(await view.getItemTexts()).toHaveLength(24);

      await pager.goToNextPage();
      await fixture.whenStable();

      // Optimus slices only while its own `paginator` is on: bound or not, first and rows do not
      // page a view that is not paginating.
      expect(host.first()).toBe(6);
      expect(await view.getItemTexts()).toHaveLength(24);
    });
  });

  describe('FR-9: the app’s array is never changed', () => {
    it('keeps its reference, its order and its freeze through paging, layout changes and new bindings', async () => {
      const original = Object.freeze(makeProducts(24));
      const copy = [...original];
      const { fixture, host, view } = await render('light', (initial) => {
        initial.items.set(original);
        initial.paginator.set(true);
        initial.rows.set(6);
      });

      await view.goToNextPage();
      host.layout.set('grid');
      await fixture.whenStable();
      host.layout.set('list');
      await fixture.whenStable();

      expect(host.items()).toBe(original);
      expect(Object.isFrozen(original)).toBe(true);
      expect([...original]).toEqual(copy);
      expect(warn).not.toHaveBeenCalled();
    });
  });

  describe('harness', () => {
    it('finds a view by the name of its list, from ariaLabel or from the element ariaLabelledBy points at', async () => {
      const { fixture } = await render();
      const loader = TestbedHarnessEnvironment.loader(fixture);

      expect(
        await loader.getHarness(WjDataViewHarness.with({ name: 'Products list' })),
      ).toBeTruthy();
      expect(await loader.getHarnessOrNull(WjDataViewHarness.with({ name: 'Other' }))).toBeNull();

      fixture.componentInstance.ariaLabel.set(undefined);
      fixture.componentInstance.ariaLabelledBy.set('name');
      await fixture.whenStable();
      expect(await loader.getHarness(WjDataViewHarness.with({ name: /^Products/ }))).toBeTruthy();
    });

    it('getName is empty for an unnamed view and for an empty one', async () => {
      const { fixture, view } = await render('light', (host) => {
        host.ariaLabel.set(undefined);
      });
      expect(await view.getName()).toBe('');

      fixture.componentInstance.ariaLabel.set('Products list');
      fixture.componentInstance.items.set([]);
      await fixture.whenStable();
      expect(await view.getName()).toBe('');
    });
  });

  describe('pt', () => {
    it('forwards a pt object to the parts', async () => {
      const { element } = await render('light', (host) => {
        host.withHeader.set(true);
        host.withFooter.set(true);
        host.paginator.set(true);
        host.rows.set(6);
        host.pt.set({
          host: { 'data-host': 'yes' },
          root: { 'data-root': 'yes' },
          content: { 'data-content': 'yes' },
          header: { 'data-header': 'yes' },
          footer: { 'data-footer': 'yes' },
          pcPaginator: { root: { 'data-pager': 'yes' } },
        });
      });

      expect(part(element, 'p-dataview').dataset['host']).toBe('yes');
      expect(part(element, '.p-dataview-content').dataset['content']).toBe('yes');
      expect(part(element, '.p-dataview-header').dataset['header']).toBe('yes');
      expect(part(element, '.p-dataview-footer').dataset['footer']).toBe('yes');
      expect(part(element, '.p-paginator').dataset['pager']).toBe('yes');
    });

    it('forwards the empty part, and the function form', async () => {
      const { element } = await render('light', (host) => {
        host.items.set([]);
        host.pt.set(() => ({ emptyMessage: { 'data-empty': 'yes' } }));
      });

      expect(part(element, '.p-dataview-empty-message').dataset['empty']).toBe('yes');
    });

    it('forwards the loading parts', async () => {
      const { element } = await render('light', (host) => {
        host.loading.set(true);
        host.pt.set({
          loading: { 'data-loading': 'yes' },
          loadingOverlay: { 'data-mask': 'yes' },
        });
      });

      expect(part(element, '.p-dataview-loading').dataset['loading']).toBe('yes');
      expect(part(element, '.p-dataview-loading-overlay').dataset['mask']).toBe('yes');
    });
  });

  describe('ARIA', () => {
    it('routes the name onto the list, and not onto the host', async () => {
      const { element } = await render();

      expect(part(element, 'ul').getAttribute('aria-label')).toBe('Products list');
      expect(part(element, 'wj-dataview').hasAttribute('aria-label')).toBe(false);
      expect(part(element, 'wj-dataview').hasAttribute('role')).toBe(false);
    });

    it('routes ariaLabelledBy, and drops the attributes it no longer has', async () => {
      const { element, fixture, host } = await render();

      host.ariaLabel.set(undefined);
      host.ariaLabelledBy.set('name');
      await fixture.whenStable();
      const list = part(element, 'ul');
      expect(list.getAttribute('aria-labelledby')).toBe('name');
      expect(list.hasAttribute('aria-label')).toBe(false);

      host.ariaLabelledBy.set(undefined);
      await fixture.whenStable();
      expect(list.hasAttribute('aria-labelledby')).toBe(false);
      expect(list.getAttribute('role')).toBe('list');
    });

    it('warns WJ0003 once, with advice that names only the inputs it has, for aria-* on the host', async () => {
      TestBed.configureTestingModule({ providers: [provideWeeljack()] });
      const fixture = TestBed.createComponent(AriaOnHostHost);
      await fixture.whenStable();

      expect(warn).toHaveBeenCalledTimes(1);
      expect(warn).toHaveBeenCalledWith(
        'WJ0003: wj-dataview: aria-label is set on the host, where it is not forwarded to the ' +
          'focusable element. Use ariaLabel or ariaLabelledBy instead. ' +
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
        'WJ0001: wj-dataview: provideWeeljack() is missing from the application providers. ' +
          'Add provideWeeljack() to your application config. ' +
          'Find more at https://locvodever.github.io/weeljack-ng/errors/WJ0001',
      );
    });
  });

  describe('HTML payloads', () => {
    it('renders an item’s text as text', async () => {
      const { element, view } = await render('light', (host) => {
        host.items.set([{ id: 1, name: PAYLOAD }]);
      });

      expect(await view.getItemTexts()).toEqual([PAYLOAD]);
      expect(element.querySelector('img')).toBeNull();
      expect(Reflect.get(window, 'wjInjected')).toBeUndefined();
    });

    it('sets ariaLabel and ariaLabelledBy as attribute text and creates no element', async () => {
      const { element, fixture, host } = await render('light', (initial) => {
        initial.ariaLabel.set(PAYLOAD);
      });
      expect(part(element, 'ul').getAttribute('aria-label')).toBe(PAYLOAD);

      host.ariaLabel.set(undefined);
      host.ariaLabelledBy.set(PAYLOAD);
      await fixture.whenStable();
      expect(part(element, 'ul').getAttribute('aria-labelledby')).toBe(PAYLOAD);

      expect(element.querySelector('img')).toBeNull();
      expect(Reflect.get(window, 'wjInjected')).toBeUndefined();
    });

    it('treats dataKey as a field name, never as markup', async () => {
      const { element, view } = await render('light', (host) => {
        host.items.set(makeProducts(2));
        host.dataKey.set(PAYLOAD);
      });

      expect(await view.getItemTexts()).toEqual(['Product 1', 'Product 2']);
      expect(element.querySelector('img')).toBeNull();
      expect(Reflect.get(window, 'wjInjected')).toBeUndefined();
    });
  });

  describe('keyboard', () => {
    it('Tab reaches the focusable content of each item in order, then the pager, then what follows', async () => {
      const { element } = await render('light', (host) => {
        host.paginator.set(true);
        host.rows.set(3);
        host.rowsPerPageOptions.set([3, 6]);
      });
      watchSelect(element);
      part(element, '#before').focus();

      const order = [
        ...parts(element, '.open').map(
          (_button, index) => `li:nth-child(${String(index + 1)}) .open`,
        ),
        // Optimus gap: the dimmed "First Page" stays a tab stop on the first page.
        '.p-paginator-first',
        '.p-paginator-page:nth-of-type(1)',
        '.p-paginator-page:nth-of-type(2)',
        '.p-paginator-page:nth-of-type(3)',
        '.p-paginator-page:nth-of-type(4)',
        '.p-paginator-page:nth-of-type(5)',
        '.p-paginator-next',
        '.p-paginator-last',
        SELECT,
        '#after',
      ];
      expect(order.filter((selector) => selector.endsWith('.open'))).toHaveLength(3);
      for (const selector of order) {
        await userEvent.tab();
        expect(document.activeElement).toBe(part(element, selector));
      }
    });

    it('Enter and Space activate the pager’s buttons and the page follows', async () => {
      const { element, host, view } = await render('light', (initial) => {
        initial.paginator.set(true);
        initial.rows.set(6);
      });

      part(element, '.p-paginator-next').focus();
      await userEvent.keyboard('{Enter}');
      expect(await view.getCurrentPage()).toBe(2);

      part(element, '.p-paginator-last').focus();
      await userEvent.keyboard(' ');
      expect(host.first()).toBe(18);
    });

    it('the view has no keys of its own: arrows leave the focus on the item', async () => {
      const { element } = await render();
      part(element, '.open').focus();

      await userEvent.keyboard('{ArrowDown}{End}');

      expect(document.activeElement).toBe(part(element, '.open'));
    });
  });

  describe('axe', () => {
    describe.each<Scheme>(['light', 'dark'])('%s', (scheme) => {
      it.each(STATES)('has no axe violations: %s', async (_name, setup) => {
        const { element } = await render(scheme, setup);
        watchSelect(element);

        await expectNoAxeViolations(element);
      });

      it('has no axe violations with the rows-per-page select open', async () => {
        const { element } = await render(scheme, (host) => {
          host.paginator.set(true);
          host.rows.set(6);
          host.rowsPerPageOptions.set([6, 12, 24]);
        });
        watchSelect(element);
        part(element, SELECT).click();
        await overlayOpen();

        await expectNoAxeViolations(document.body);
        await closeSelect(element);
      });
    });
  });
});
