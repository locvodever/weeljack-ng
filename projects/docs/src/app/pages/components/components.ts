import { Component, computed, inject, signal, viewChild, type ElementRef } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CATALOG, chipOf, type CatalogRow } from '../../catalog/catalog';
import { DocsText } from '../../text/text';

/** Whether a row matches an already trimmed, lower-cased query: title, entry, selector or service. */
function matches(row: CatalogRow, query: string): boolean {
  return [
    row.title,
    row.entry,
    row.wjSelector,
    ...row.services.map((service) => service.name),
  ].some((field) => field?.toLowerCase().includes(query));
}

/**
 * `/components` (FR-10, ui-spec C): 03's wave groups in order, shipped rows linked, planned rows
 * muted, then the entries WeeljackNg does not wrap. Everything reads `catalog.json`. The filter
 * matches title, entry or selector on every input event, hides non-matching rows and empty groups,
 * and announces its count through a polite status that is empty at rest.
 */
@Component({
  selector: 'docs-components-page',
  imports: [RouterLink, DocsText],
  templateUrl: './components.html',
  styleUrl: './components.css',
})
export class ComponentsPage {
  /** Links are written relative to the root route, so the base href decides where they point. */
  protected readonly root = inject(Router).routerState.root;

  protected readonly query = signal('');

  private readonly filterInput = viewChild.required<ElementRef<HTMLInputElement>>('filterInput');

  /** The query as matched: trimmed and lower-cased. Empty shows every row. */
  private readonly needle = computed(() => this.query().trim().toLowerCase());

  protected readonly groups = computed(() => {
    const needle = this.needle();
    return CATALOG.groups
      .map((group) => ({
        ...group,
        rows: needle === '' ? group.rows : group.rows.filter((row) => matches(row, needle)),
      }))
      .filter((group) => group.rows.length > 0);
  });

  protected readonly notWrapped = computed(() => {
    const needle = this.needle();
    return needle === ''
      ? CATALOG.notWrapped
      : CATALOG.notWrapped.filter((row) =>
          [row.label, ...row.entries].some((field) => field.toLowerCase().includes(needle)),
        );
  });

  /** Every visible row, the not-wrapped ones included. */
  private readonly count = computed(
    () =>
      this.groups().reduce((sum, group) => sum + group.rows.length, 0) + this.notWrapped().length,
  );

  /** The polite status: empty at rest, a count while filtering, the no-match sentence otherwise. */
  protected readonly status = computed(() => {
    if (this.needle() === '') return '';
    const count = this.count();
    if (count === 0) return `No component matches '${this.query().trim()}'`;
    return count === 1 ? '1 match' : `${String(count)} matches`;
  });

  protected readonly noMatch = computed(() => this.needle() !== '' && this.count() === 0);

  /** The selector chip of a row, or a service-only entry's service name. */
  protected readonly chipOf = chipOf;

  protected onFilter(event: Event): void {
    if (event.target instanceof HTMLInputElement) this.query.set(event.target.value);
  }

  protected clear(): void {
    this.query.set('');
    this.filterInput().nativeElement.focus();
  }
}
