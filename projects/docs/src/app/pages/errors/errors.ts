import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ERROR_ENTRIES, sentence } from './errors-data';

/** More selectors than this read as a count, so one row stays one line tall. */
const MAX_CHIPS = 3;

/** `/errors` (FR-20): the codes a dev warning can print, each linking to its page. */
@Component({
  selector: 'docs-errors-page',
  imports: [RouterLink],
  templateUrl: './errors.html',
  styleUrl: './errors.css',
})
export class ErrorsPage {
  /** Links are written relative to the root route, so the base href decides where they point. */
  protected readonly root = inject(Router).routerState.root;

  protected readonly rows = ERROR_ENTRIES.map((entry) => {
    let summary: string | null = null;
    if (entry.everyComponent) {
      summary = 'Every WeeljackNg component';
    } else if (entry.selectors.length > MAX_CHIPS) {
      summary = `${String(entry.selectors.length)} components`;
    }
    return {
      code: entry.code,
      summary,
      selectors: entry.selectors,
      what: sentence(entry.variants[0]?.what ?? ''),
    };
  });
}
