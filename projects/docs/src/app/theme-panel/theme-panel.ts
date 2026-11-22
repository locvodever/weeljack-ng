import { Component, ElementRef, inject, input } from '@angular/core';
import { WjButton } from 'weeljack-ng/button';
import { CodeBlock } from '../code-block/code-block';
import { DocsThemeChoice } from './theme-choice';

/** Noir's chip: its light primary, drawn the same in both schemes. */
const NOIR = { swatch: '#09090b', check: '#ffffff' };
/** Zinc's chip: Aura's zinc 500. */
const ZINC = { swatch: '#71717a', check: '#ffffff' };

/**
 * The theme panel: a Primary and a Surface row of radio swatches, the `provideWeeljack` call for
 * the choice, and Reset. It sits in a popover from 720 px and in the Menu drawer below that.
 */
@Component({
  selector: 'docs-theme-panel',
  imports: [CodeBlock, WjButton],
  templateUrl: './theme-panel.html',
  styleUrl: './theme-panel.css',
})
export class DocsThemePanel {
  /** Prefixes the heading id and the radio names, so a second copy never repeats them. */
  readonly idPrefix = input.required<string>();

  protected readonly choice = inject(DocsThemeChoice);
  protected readonly noir = NOIR;
  protected readonly zinc = ZINC;
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  /** Moves focus to the checked Primary swatch. */
  focusPrimary(): void {
    this.host.nativeElement
      .querySelector<HTMLInputElement>('input[name$="-primary"]:checked')
      ?.focus();
  }
}
