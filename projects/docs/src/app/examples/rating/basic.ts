import { Component, signal } from '@angular/core';
import { WjRating } from 'weeljack-ng/rating';

@Component({
  selector: 'docs-rating-basic-example',
  imports: [WjRating],
  template: `
    <span id="basic-recipe">Rate this recipe</span>
    <wj-rating ariaLabelledBy="basic-recipe" [(value)]="rating" />
    <p class="state">Rating: {{ rating() ?? 'none' }}</p>
  `,
  styles: `
    :host {
      display: grid;
      justify-items: start;
      gap: 8px;
      inline-size: min(100%, 24rem);
    }

    .state {
      margin: 0;
      font-size: 0.875rem;
      color: var(--wj-text-muted-color);
    }
  `,
})
export class RatingBasicExample {
  protected readonly rating = signal<number | null>(null);
}
