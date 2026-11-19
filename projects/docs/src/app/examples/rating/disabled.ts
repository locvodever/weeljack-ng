import { Component } from '@angular/core';
import { WjRating } from 'weeljack-ng/rating';

@Component({
  selector: 'docs-rating-disabled-example',
  imports: [WjRating],
  template: `
    <span id="disabled-recipe">Rate this recipe</span>
    <wj-rating ariaLabelledBy="disabled-recipe" disabled [value]="3" />
  `,
  styles: `
    :host {
      display: grid;
      justify-items: start;
      gap: 8px;
      inline-size: min(100%, 24rem);
    }
  `,
})
export class RatingDisabledExample {}
