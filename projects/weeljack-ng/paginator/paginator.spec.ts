import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Component, computed, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import type { MockInstance } from 'vitest';
import { userEvent } from 'vitest/browser';
import { provideWeeljack, type WjPageEvent } from 'weeljack-ng';
import { WjPaginator, type WjPaginatorPt } from 'weeljack-ng/paginator';
import { WjPaginatorHarness } from 'weeljack-ng/paginator/testing';
import { WjColumn, WjTable } from 'weeljack-ng/table';
import { WjTableHarness } from 'weeljack-ng/table/testing';
import { expectNoAxeViolations } from '../spec-support/axe';

const PAYLOAD = '<img src=x onerror="window.wjInjected = true">';
const ROOT = document.documentElement;

type Scheme = 'light' | 'dark';

/** A consumer's template: a pager between two buttons, bound two-way as FR-8 says. */
@Component({
  selector: 'wj-paginator-host',
  imports: [WjPaginator],
  template: `
    <button type="button" id="before">Before</button>
    <p id="name">Orders pages</p>
    <wj-paginator
      [totalRecords]="totalRecords()"
      [(first)]="first"
      [(rows)]="rows"
      [rowsPerPageOptions]="rowsPerPageOptions()"
      [pageLinkSize]="pageLinkSize()"
      [alwaysShow]="alwaysShow()"
      [showFirstLastIcon]="showFirstLastIcon()"
      [showPageLinks]="showPageLinks()"
      [showCurrentPageReport]="showCurrentPageReport()"
      [currentPageReportTemplate]="template()"
      [ariaLabel]="ariaLabel()"
      [ariaLabelledBy]="ariaLabelledBy()"
      [pt]="pt()"
      (pageChange)="pages.update((list) => [...list, $event])"
    />
    <button type="button" id="after">After</button>
  `,
})
class Host {
  readonly totalRecords = signal(120);
  readonly first = signal(0);
  readonly rows = signal(10);
  readonly rowsPerPageOptions = signal<number[] | undefined>(undefined);
  readonly pageLinkSize = signal(5);
  readonly alwaysShow = signal(true);
  readonly showFirstLastIcon = signal(true);
  readonly showPageLinks = signal(true);
  readonly showCurrentPageReport = signal(false);
  readonly template = signal('{currentPage} of {totalPages}');
  readonly ariaLabel = signal<string | undefined>('Orders pages');
  readonly ariaLabelledBy = signal<string | undefined>(undefined);
  readonly pt = signal<WjPaginatorPt>(undefined);
  readonly pages = signal<WjPageEvent[]>([]);
}

/** A consumer who writes `aria-label` on the host instead of using the input. */
@Component({
  selector: 'wj-paginator-aria-host',
  imports: [WjPaginator],
  template: `<wj-paginator [totalRecords]="30" aria-label="Pages" />`,
})
class AriaOnHostHost {}

/** A consumer who uses the routed inputs only. */
@Component({
  selector: 'wj-paginator-routed-host',
  imports: [WjPaginator],
  template: `<wj-paginator [totalRecords]="30" ariaLabel="Pages" />`,
})
class RoutedHost {}

/** FR-8's recipe: a table whose own pager is off, with a `wj-paginator` under it. */
@Component({
  selector: 'wj-paginator-beside-table-host',
  imports: [WjPaginator, WjTable, WjColumn],
  template: `
    <wj-table [value]="sliced() ? page() : all" ariaLabel="Orders">
      <wj-column field="id" header="Order" />
    </wj-table>
    <wj-paginator [totalRecords]="all.length" [(first)]="first" [(rows)]="rows" ariaLabel="Pages" />
  `,
})
class BesideTableHost {
  readonly all = Array.from({ length: 23 }, (_unused, index) => ({ id: index + 1 }));
  readonly first = signal(0);
  readonly rows = signal(10);
  readonly sliced = signal(true);
  readonly page = computed(() => this.all.slice(this.first(), this.first() + this.rows()));
}

interface Rendered {
  fixture: ComponentFixture<Host>;
  host: Host;
  pager: WjPaginatorHarness;
  element: HTMLElement;
}

/** Renders the host with `provideWeeljack`, in the given colour scheme, after `setup` ran. */
async function render(
  scheme: Scheme = 'light',
  setup: (host: Host) => void = () => undefined,
): Promise<Rendered> {
  ROOT.classList.toggle('wj-dark', scheme === 'dark');
  document.body.style.backgroundColor = 'var(--wj-content-background)';
  TestBed.configureTestingModule({ providers: [provideWeeljack({ darkMode: 'class' })] });
  const fixture = TestBed.createComponent(Host);
  setup(fixture.componentInstance);
  await fixture.whenStable();
  const element = fixture.nativeElement as HTMLElement;
  const pager = await TestbedHarnessEnvironment.loader(fixture).getHarness(WjPaginatorHarness);
  // A render without Optimus's styles would pass axe for the wrong reason: fail loudly instead.
  expect(getComputedStyle(part(element, 'p-paginator')).justifyContent).toBe('center');
  return { fixture, host: fixture.componentInstance, pager, element };
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

/** The documented states: default, first page, last page, hidden, with the report. */
const STATES: [string, (host: Host) => void][] = [
  ['default', () => undefined],
  [
    'first page',
    (host) => {
      host.first.set(0);
    },
  ],
  [
    'last page',
    (host) => {
      host.first.set(110);
    },
  ],
  [
    'single page, alwaysShow off (hidden)',
    (host) => {
      host.totalRecords.set(5);
      host.alwaysShow.set(false);
    },
  ],
  [
    'no records',
    (host) => {
      host.totalRecords.set(0);
    },
  ],
  [
    'with the report and the page sizes',
    (host) => {
      host.showCurrentPageReport.set(true);
      host.template.set('{first}–{last} of {totalRecords}');
      host.rowsPerPageOptions.set([10, 20, 50]);
    },
  ],
  [
    'without first, last or page links',
    (host) => {
      host.showFirstLastIcon.set(false);
      host.showPageLinks.set(false);
      host.showCurrentPageReport.set(true);
    },
  ],
];

describe('WjPaginator', () => {
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

  describe('paging inputs', () => {
    it('totalRecords, first and rows set the page count and the current page', async () => {
      const { fixture, host, pager } = await render();
      expect(await pager.getPageCount()).toBe(12);
      expect(await pager.getCurrentPage()).toBe(1);

      host.first.set(20);
      await fixture.whenStable();
      expect(await pager.getCurrentPage()).toBe(3);

      host.rows.set(20);
      host.first.set(20);
      await fixture.whenStable();
      expect(await pager.getPageCount()).toBe(6);
      expect(await pager.getCurrentPage()).toBe(2);

      host.totalRecords.set(0);
      await fixture.whenStable();
      expect(await pager.getPageCount()).toBe(0);
      expect(await pager.getCurrentPage()).toBe(0);
    });

    it('starts on the first page, with 10 rows, when only totalRecords is bound', async () => {
      TestBed.configureTestingModule({ providers: [provideWeeljack()] });
      const fixture = TestBed.createComponent(RoutedHost);
      await fixture.whenStable();
      const pager = await TestbedHarnessEnvironment.loader(fixture).getHarness(WjPaginatorHarness);

      expect(await pager.getPageCount()).toBe(3);
      expect(await pager.getCurrentPage()).toBe(1);
    });

    it('a model set from code moves the pager and emits no pageChange', async () => {
      const { fixture, host, pager } = await render();

      host.first.set(30);
      await fixture.whenStable();

      expect(await pager.getCurrentPage()).toBe(4);
      expect(host.pages()).toEqual([]);
    });

    it('pageLinkSize sets how many page buttons show', async () => {
      const { element, fixture, host } = await render();
      expect(parts(element, '.p-paginator-page')).toHaveLength(5);

      host.pageLinkSize.set(3);
      await fixture.whenStable();

      expect(parts(element, '.p-paginator-page')).toHaveLength(3);
    });

    it('showPageLinks and showFirstLastIcon switch those buttons off', async () => {
      const { element, fixture, host } = await render();
      expect(parts(element, '.p-paginator-first, .p-paginator-last')).toHaveLength(2);

      host.showFirstLastIcon.set(false);
      host.showPageLinks.set(false);
      await fixture.whenStable();

      expect(parts(element, '.p-paginator-first, .p-paginator-last, .p-paginator-page')).toEqual(
        [],
      );
      expect(part(element, '.p-paginator-next')).toBeInstanceOf(HTMLButtonElement);
    });

    it('alwaysShow off hides a pager of one page, and nothing renders', async () => {
      const { element, fixture, host } = await render('light', (initial) => {
        initial.totalRecords.set(5);
        initial.alwaysShow.set(false);
      });
      expect(getComputedStyle(part(element, 'p-paginator')).display).toBe('none');
      expect(part(element, 'wj-paginator').getBoundingClientRect().height).toBe(0);

      host.alwaysShow.set(true);
      await fixture.whenStable();
      expect(getComputedStyle(part(element, 'p-paginator')).display).toBe('flex');

      host.alwaysShow.set(false);
      host.totalRecords.set(25);
      await fixture.whenStable();
      expect(getComputedStyle(part(element, 'p-paginator')).display).toBe('flex');
    });

    it('showCurrentPageReport shows the report, filled in from currentPageReportTemplate', async () => {
      const { fixture, host, pager } = await render();
      expect(await pager.getReportText()).toBeNull();

      host.showCurrentPageReport.set(true);
      await fixture.whenStable();
      expect(await pager.getReportText()).toBe('1 of 12');

      host.template.set('{first}–{last} of {totalRecords} ({rows} a page, page {currentPage})');
      host.first.set(110);
      await fixture.whenStable();
      expect(await pager.getReportText()).toBe('111–120 of 120 (10 a page, page 12)');
    });

    it('rowsPerPageOptions offers a select of page sizes, and none without it', async () => {
      const { element, fixture, host, pager } = await render();
      expect(element.querySelector(SELECT)).toBeNull();
      await expect(pager.getRowsPerPage()).rejects.toThrow('no rows-per-page select');

      host.rowsPerPageOptions.set([10, 20, 50]);
      await fixture.whenStable();
      watchSelect(element);

      expect(await pager.getRowsPerPage()).toBe(10);
    });

    it('never changes the rowsPerPageOptions array the app bound', async () => {
      const options = [10, 20, 50];
      const { element, fixture, host, pager } = await render('light', (initial) => {
        initial.rowsPerPageOptions.set(options);
      });
      watchSelect(element);

      await pager.goToNextPage();
      await pager.setRowsPerPage(50);
      await fixture.whenStable();

      expect(host.rowsPerPageOptions()).toBe(options);
      expect(options).toEqual([10, 20, 50]);
      await closeSelect(element);
    });
  });

  describe('pageChange', () => {
    it('emits the new first and rows for the buttons and page links, and writes both models', async () => {
      const { host, pager } = await render();

      await pager.goToNextPage();
      await pager.goToLastPage();
      await pager.goToPreviousPage();
      await pager.goToFirstPage();
      await pager.goToPage(4);

      expect(host.pages()).toEqual([
        { first: 10, rows: 10 },
        { first: 110, rows: 10 },
        { first: 100, rows: 10 },
        { first: 0, rows: 10 },
        { first: 30, rows: 10 },
      ]);
      expect(host.first()).toBe(30);
      expect(await pager.getCurrentPage()).toBe(4);
    });

    it('goToPage steps when the page has no link, and refuses a page that does not exist', async () => {
      const { host, pager } = await render('light', (initial) => {
        initial.showPageLinks.set(false);
      });

      await pager.goToPage(3);
      expect(host.first()).toBe(20);
      await pager.goToPage(1);
      expect(host.first()).toBe(0);
      await expect(pager.goToPage(13)).rejects.toThrow('no page 13: it has 12');
      await expect(pager.goToPage(0)).rejects.toThrow('no page 0');
    });

    it('a page size picked in the select emits it, keeps the page and writes rows', async () => {
      const { element, host, pager } = await render('light', (initial) => {
        initial.rowsPerPageOptions.set([10, 20, 50]);
        initial.first.set(30);
      });
      watchSelect(element);

      await pager.setRowsPerPage(20);
      await expect.poll(() => host.rows()).toBe(20);

      // Page 4 of 10 rows starts at 30; with 20 rows the same page index holds row 20.
      expect(host.pages()).toEqual([{ first: 20, rows: 20 }]);
      expect(host.first()).toBe(20);
      expect(await pager.getRowsPerPage()).toBe(20);
      expect(await pager.getPageCount()).toBe(6);
      await closeSelect(element);
    });

    it('setRowsPerPage refuses a size the select does not offer', async () => {
      const { element, pager } = await render('light', (initial) => {
        initial.rowsPerPageOptions.set([10, 20]);
      });
      watchSelect(element);

      await expect(pager.setRowsPerPage(15)).rejects.toThrow('no page size of 15');
      await closeSelect(element);
    });

    it('next and last are disabled on the last page, previous is not', async () => {
      const { element, pager } = await render();

      await pager.goToLastPage();

      expect(part(element, '.p-paginator-next').hasAttribute('disabled')).toBe(true);
      expect(part(element, '.p-paginator-last').hasAttribute('disabled')).toBe(true);
      expect(part(element, '.p-paginator-prev').hasAttribute('disabled')).toBe(false);
    });

    it('the previous button is disabled on the first page', async () => {
      const { element } = await render();

      expect(part(element, '.p-paginator-prev').hasAttribute('disabled')).toBe(true);
    });
  });

  describe('layout', () => {
    it('keeps the preset look: 40 px buttons, a 44 px select, a block host', async () => {
      const { element } = await render('light', (host) => {
        host.rowsPerPageOptions.set([10, 20]);
      });
      watchSelect(element);

      const size = (selector: string): [number, number] => {
        const box = part(element, selector).getBoundingClientRect();
        return [box.width, box.height];
      };
      expect(getComputedStyle(part(element, 'wj-paginator')).display).toBe('block');
      expect(size('.p-paginator-next')).toEqual([40, 40]);
      expect(size('.p-paginator-page')).toEqual([40, 40]);
      expect(size('.p-paginator-rpp-dropdown')[1]).toBe(44);
    });

    it('centres its buttons and wraps them onto more lines when it is narrow', async () => {
      const { element, fixture } = await render();
      const pager = part(element, 'p-paginator');
      const wide = pager.getBoundingClientRect().height;
      expect(getComputedStyle(pager).flexWrap).toBe('wrap');

      part(element, 'wj-paginator').style.width = '120px';
      await fixture.whenStable();

      expect(pager.getBoundingClientRect().height).toBeGreaterThan(wide);
    });
  });

  describe('harness', () => {
    it('finds a pager by its name, from ariaLabel or from the element ariaLabelledBy points at', async () => {
      const { fixture, host } = await render();
      const loader = TestbedHarnessEnvironment.loader(fixture);
      expect(
        await loader.getHarnessOrNull(WjPaginatorHarness.with({ name: 'Orders pages' })),
      ).not.toBeNull();
      expect(await loader.getHarnessOrNull(WjPaginatorHarness.with({ name: 'Other' }))).toBeNull();

      host.ariaLabel.set(undefined);
      host.ariaLabelledBy.set('name');
      await fixture.whenStable();
      const named = await loader.getHarness(WjPaginatorHarness.with({ name: /Orders/ }));

      expect(await named.getName()).toBe('Orders pages');
    });

    it('getName is empty for an unnamed pager', async () => {
      const { pager, fixture, host } = await render();
      host.ariaLabel.set(undefined);
      await fixture.whenStable();

      expect(await pager.getName()).toBe('');
    });

    it('refuses a button the pager does not show', async () => {
      const { fixture, host, pager } = await render();
      host.showFirstLastIcon.set(false);
      await fixture.whenStable();

      await expect(pager.goToFirstPage()).rejects.toThrow('no first page button');
      await expect(pager.goToLastPage()).rejects.toThrow('no last page button');
    });
  });

  describe('pt', () => {
    it('forwards a pt object to the parts, the root included', async () => {
      const { element } = await render('light', (host) => {
        host.pt.set({
          root: 'consumer-root',
          page: { class: 'consumer-page' },
          next: 'consumer-next',
        });
      });

      expect(part(element, 'p-paginator').classList.contains('consumer-root')).toBe(true);
      expect(parts(element, '.p-paginator-page.consumer-page')).toHaveLength(5);
      expect(part(element, '.p-paginator-next').classList.contains('consumer-next')).toBe(true);
    });

    it('forwards the function form too, and keeps the routed role and name', async () => {
      const { element } = await render('light', (host) => {
        host.pt.set(() => ({ root: { 'data-consumer': 'fn' }, prev: { 'data-prev': 'fn' } }));
      });

      const root = part(element, 'p-paginator');
      expect(root.getAttribute('data-consumer')).toBe('fn');
      expect(root.getAttribute('role')).toBe('navigation');
      expect(root.getAttribute('aria-label')).toBe('Orders pages');
      expect(part(element, '.p-paginator-prev').getAttribute('data-prev')).toBe('fn');
    });

    it('lets a routed attribute win over a pt value of the same name', async () => {
      const { element } = await render('light', (host) => {
        host.pt.set({ root: { role: 'region', 'aria-label': 'Consumer' } });
      });

      const root = part(element, 'p-paginator');
      expect(root.getAttribute('role')).toBe('navigation');
      expect(root.getAttribute('aria-label')).toBe('Orders pages');
    });
  });

  describe('ARIA', () => {
    it('routes the name onto the root, which is a navigation landmark', async () => {
      const { element } = await render();

      const root = part(element, 'p-paginator');
      expect(root.getAttribute('role')).toBe('navigation');
      expect(root.getAttribute('aria-label')).toBe('Orders pages');
      expect(root.hasAttribute('aria-labelledby')).toBe(false);
      const host = part(element, 'wj-paginator');
      expect(host.getAttributeNames().filter((name) => name.startsWith('aria-'))).toEqual([]);
      expect(warn).not.toHaveBeenCalled();
    });

    it('routes ariaLabelledBy, and drops the attributes it no longer has', async () => {
      const { element, fixture, host } = await render();

      host.ariaLabel.set(undefined);
      host.ariaLabelledBy.set('name');
      await fixture.whenStable();

      const root = part(element, 'p-paginator');
      expect(root.getAttribute('aria-labelledby')).toBe('name');
      expect(root.hasAttribute('aria-label')).toBe(false);
      expect(root.getAttribute('role')).toBe('navigation');
    });

    it('takes the names of its buttons from the translation, and marks the current page', async () => {
      const { element } = await render();

      expect(part(element, '.p-paginator-first').getAttribute('aria-label')).toBe('First Page');
      expect(part(element, '.p-paginator-prev').getAttribute('aria-label')).toBe('Previous Page');
      expect(part(element, '.p-paginator-next').getAttribute('aria-label')).toBe('Next Page');
      expect(part(element, '.p-paginator-last').getAttribute('aria-label')).toBe('Last Page');
      const current = part(element, '.p-paginator-page[aria-current="page"]');
      expect(current.getAttribute('aria-label')).toBe('Page 1');
      expect(current.textContent.trim()).toBe('1');
    });

    it('names the rows-per-page select from the translation', async () => {
      const { element } = await render('light', (host) => {
        host.rowsPerPageOptions.set([10, 20]);
      });
      watchSelect(element);

      expect(part(element, SELECT).getAttribute('aria-label')).toBe('Rows per page');
    });

    it('warns WJ0003 once, with advice that names only the inputs it has, for aria-* on the host', async () => {
      TestBed.configureTestingModule({ providers: [provideWeeljack()] });
      const fixture = TestBed.createComponent(AriaOnHostHost);
      await fixture.whenStable();

      expect(
        part(fixture.nativeElement as HTMLElement, 'p-paginator').hasAttribute('aria-label'),
      ).toBe(false);
      expect(warn).toHaveBeenCalledTimes(1);
      expect(warn).toHaveBeenCalledWith(
        'WJ0003: wj-paginator: aria-label is set on the host, where it is not forwarded to the ' +
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
        'WJ0001: wj-paginator: provideWeeljack() is missing from the application providers. ' +
          'Add provideWeeljack() to your application config. ' +
          'Find more at https://locvodever.github.io/weeljack-ng/errors/WJ0001',
      );
    });
  });

  describe('HTML payloads', () => {
    it('renders currentPageReportTemplate as text', async () => {
      const { element, pager } = await render('light', (host) => {
        host.showCurrentPageReport.set(true);
        host.template.set(`${PAYLOAD} {currentPage}`);
      });

      expect(await pager.getReportText()).toBe(`${PAYLOAD} 1`);
      expect(element.querySelector('img')).toBeNull();
      expect(Reflect.get(window, 'wjInjected')).toBeUndefined();
    });

    it('sets ariaLabel and ariaLabelledBy as attribute text and creates no element', async () => {
      const { element, fixture, host } = await render('light', (initial) => {
        initial.ariaLabel.set(PAYLOAD);
      });
      expect(part(element, 'p-paginator').getAttribute('aria-label')).toBe(PAYLOAD);

      host.ariaLabel.set(undefined);
      host.ariaLabelledBy.set(PAYLOAD);
      await fixture.whenStable();

      expect(part(element, 'p-paginator').getAttribute('aria-labelledby')).toBe(PAYLOAD);
      expect(element.querySelector('img')).toBeNull();
      expect(Reflect.get(window, 'wjInjected')).toBeUndefined();
    });
  });

  describe('beside a table', () => {
    async function renderBeside(sliced: boolean): Promise<{
      fixture: ComponentFixture<BesideTableHost>;
      table: WjTableHarness;
      pager: WjPaginatorHarness;
    }> {
      TestBed.configureTestingModule({ providers: [provideWeeljack()] });
      const fixture = TestBed.createComponent(BesideTableHost);
      fixture.componentInstance.sliced.set(sliced);
      await fixture.whenStable();
      const loader = TestbedHarnessEnvironment.loader(fixture);
      return {
        fixture,
        table: await loader.getHarness(WjTableHarness),
        pager: await loader.getHarness(WjPaginatorHarness),
      };
    }

    it('shows the page the app cuts from first and rows, and follows the pager', async () => {
      const { fixture, table, pager } = await renderBeside(true);
      expect(await table.getCellTexts()).toHaveLength(10);

      await pager.goToLastPage();
      await fixture.whenStable();

      expect(await pager.getCurrentPage()).toBe(3);
      expect(await table.getCellTexts()).toEqual([['21'], ['22'], ['23']]);
    });

    it('does not cut the rows itself: a table with its pager off shows every row it is given', async () => {
      const { table } = await renderBeside(false);

      expect(await table.getCellTexts()).toHaveLength(23);
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
          host.rowsPerPageOptions.set([10, 20, 50]);
        });
        watchSelect(element);
        part(element, SELECT).click();
        await overlayOpen();

        await expectNoAxeViolations(document.body);
        await closeSelect(element);
      });
    });
  });

  describe('keyboard', () => {
    it('Tab and Shift+Tab move through the buttons and the select', async () => {
      const { element } = await render('light', (host) => {
        host.rowsPerPageOptions.set([10, 20, 50]);
        host.first.set(30);
      });
      watchSelect(element);
      part(element, '#before').focus();

      const order = [
        '.p-paginator-first',
        '.p-paginator-prev',
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
      for (const selector of order) {
        await userEvent.tab();
        expect(document.activeElement).toBe(part(element, selector));
      }
      await userEvent.tab({ shift: true });
      expect(document.activeElement).toBe(part(element, SELECT));
    });

    it('on the first page the dimmed first-page button is still a tab stop (Optimus gap)', async () => {
      const { element } = await render();
      part(element, '#before').focus();

      await userEvent.tab();

      // Optimus gives "First Page" a `p-disabled` class and no `disabled`, so Tab lands on it; the
      // previous button, which is truly disabled, is skipped.
      expect(document.activeElement).toBe(part(element, '.p-paginator-first'));
      await userEvent.tab();
      expect(document.activeElement).toBe(part(element, '.p-paginator-page'));
    });

    it('Enter and Space activate a button', async () => {
      const { host, pager } = await render();

      part(document.body, '.p-paginator-next').focus();
      await userEvent.keyboard('{Enter}');
      expect(await pager.getCurrentPage()).toBe(2);

      parts(document.body, '.p-paginator-page')
        .find((link) => link.textContent.trim() === '4')
        ?.focus();
      await userEvent.keyboard(' ');
      expect(await pager.getCurrentPage()).toBe(4);
      expect(host.first()).toBe(30);

      part(document.body, '.p-paginator-last').focus();
      await userEvent.keyboard(' ');
      expect(host.first()).toBe(110);
    });

    it.each([['{Enter}'], [' '], ['{ArrowDown}']])(
      'the rows-per-page select opens with %j, the arrows move, Enter picks, Escape closes',
      async (key) => {
        const { element, host } = await render('light', (initial) => {
          initial.rowsPerPageOptions.set([10, 20, 50]);
        });
        watchSelect(element);
        const combobox = part(element, SELECT);
        combobox.focus();

        await userEvent.keyboard(key);
        await overlayOpen();
        expect(combobox.getAttribute('aria-expanded')).toBe('true');

        await userEvent.keyboard('{Escape}');
        await expect.poll(() => combobox.getAttribute('aria-expanded')).toBe('false');
        await expect.poll(() => document.querySelector('[role="listbox"]')).toBeNull();
        expect(document.activeElement).toBe(combobox);

        await userEvent.keyboard('{ArrowDown}');
        await overlayOpen();
        await userEvent.keyboard('{ArrowDown}');
        await userEvent.keyboard('{Enter}');

        await expect.poll(() => host.rows()).toBe(20);
        await closeSelect(element);
      },
    );
  });
});
