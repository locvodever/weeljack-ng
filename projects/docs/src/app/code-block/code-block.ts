import { DOCUMENT } from '@angular/common';
import { Component, DestroyRef, inject, input, signal } from '@angular/core';

/** How long "Copied" stays announced after a copy. */
const COPIED_RESET_MS = 2000;

/** A code panel: scrolls inside itself, and its text can be copied. */
@Component({
  selector: 'docs-code-block',
  templateUrl: './code-block.html',
  styleUrl: './code-block.css',
})
export class CodeBlock {
  /** The text to show and copy. */
  readonly code = input.required<string>();
  /** What the text is, for the copy button's name. */
  readonly label = input.required<string>();

  protected readonly copied = signal(false);

  private readonly clipboard = inject(DOCUMENT).defaultView?.navigator.clipboard;
  private resetTimer: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      clearTimeout(this.resetTimer);
    });
  }

  protected copy(): void {
    this.clipboard?.writeText(this.code()).then(
      () => {
        this.copied.set(true);
        clearTimeout(this.resetTimer);
        this.resetTimer = setTimeout(() => {
          this.copied.set(false);
        }, COPIED_RESET_MS);
      },
      () => {
        this.copied.set(false);
      },
    );
  }
}
