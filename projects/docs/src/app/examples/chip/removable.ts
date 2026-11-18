import { Component, ElementRef, Injector, afterNextRender, inject, signal } from '@angular/core';
import { WjButton } from 'weeljack-ng/button';
import { WjChip } from 'weeljack-ng/chip';

const ALL = ['In stock', 'On sale', 'Free delivery', 'New'];

@Component({
  selector: 'docs-chip-removable-example',
  imports: [WjChip, WjButton],
  template: `
    <ul class="chips" aria-label="Filters">
      @for (filter of filters(); track filter; let index = $index) {
        <li>
          <wj-chip [label]="filter" removable (removed)="remove(index)" />
        </li>
      }
    </ul>
    <p class="status" role="status">Removed: {{ removedText() }}</p>
    <wj-button
      class="reset"
      label="Reset filters"
      size="small"
      severity="secondary"
      variant="outlined"
      (click)="reset()"
    />
  `,
  styles: `
    .chips {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin: 0;
      padding: 0;
      list-style: none;
    }

    .status {
      margin: 8px 0 0;
      font-size: 0.875rem;
      color: var(--wj-text-muted-color);
    }

    .reset {
      margin-top: 16px;
    }
  `,
})
export class ChipRemovableExample {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly injector = inject(Injector);

  protected readonly filters = signal(ALL);
  protected readonly removedFilters = signal<string[]>([]);

  protected removedText(): string {
    return this.removedFilters().join(', ') || 'none';
  }

  /** The chip never hides itself: drop it from the list, then move focus to a chip that is left. */
  protected remove(index: number): void {
    const filter = this.filters()[index];
    if (filter === undefined) {
      return;
    }
    this.filters.update((list) => list.filter((_, position) => position !== index));
    this.removedFilters.update((list) => [...list, filter]);

    // Wait for the removed chip to leave the DOM, then focus the next chip's remove button, else
    // the previous one's, else the button that brings the chips back.
    afterNextRender(
      () => {
        const buttons = this.host.querySelectorAll<HTMLElement>('wj-chip button');
        const target = buttons[index] ?? buttons[index - 1];
        (target ?? this.host.querySelector<HTMLElement>('.reset button'))?.focus();
      },
      { injector: this.injector },
    );
  }

  protected reset(): void {
    this.filters.set(ALL);
    this.removedFilters.set([]);
  }
}
