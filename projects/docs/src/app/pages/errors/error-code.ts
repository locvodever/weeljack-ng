import { Component, computed, inject, input } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CodeBlock } from '../../code-block/code-block';
import { ERROR_ENTRIES, sentence, type ErrorEntry } from './errors-data';

/** `/errors/WJ<NNNN>` (FR-20): the page a warning's "Find more at" address opens. */
@Component({
  selector: 'docs-error-code-page',
  imports: [RouterLink, CodeBlock],
  templateUrl: './error-code.html',
  styleUrl: './error-code.css',
})
export class ErrorCodePage {
  /** The `:code` route parameter (`withComponentInputBinding`); the route matches only a known one. */
  readonly code = input.required<string>();

  /** Links are written relative to the root route, so the base href decides where they point. */
  protected readonly root = inject(Router).routerState.root;

  protected readonly entry = computed<ErrorEntry>(() => {
    const entry = ERROR_ENTRIES.find((item) => item.code === this.code());
    if (entry === undefined) {
      throw new Error(`No error code "${this.code()}". Run npm run generate.`);
    }
    return entry;
  });

  /** Each distinct "what is wrong" sentence once, in variant order. */
  protected readonly wrong = computed(() => [
    ...new Set(this.entry().variants.map((variant) => sentence(variant.what))),
  ]);

  /** Each distinct "what to do" sentence once; `WJ0003` shows its default here, the rest below. */
  protected readonly todo = computed(() => [
    ...new Set(this.entry().variants.map((variant) => sentence(variant.fix))),
  ]);

  /** A block names its sample selector only when the code has several wordings. */
  protected readonly blocks = computed(() => {
    const entry = this.entry();
    return entry.variants.map((variant) => ({
      message: variant.message,
      label:
        entry.variants.length > 1
          ? `${entry.code} message for ${variant.selector}`
          : `${entry.code} message`,
    }));
  });

  protected readonly components = computed(() =>
    (this.entry().components ?? []).map((item) => ({
      selector: item.selector,
      fix: sentence(item.fix),
    })),
  );

  protected readonly hasHole = computed(() =>
    this.entry().variants.some((variant) => variant.message.includes('…')),
  );
}
