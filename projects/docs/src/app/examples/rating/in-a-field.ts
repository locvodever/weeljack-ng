import { Component } from '@angular/core';
import { WjField } from 'weeljack-ng/field';
import { WjRating } from 'weeljack-ng/rating';

@Component({
  selector: 'docs-rating-in-a-field-example',
  imports: [WjField, WjRating],
  template: `
    <wj-field label="Delivery experience" hint="1 star is poor, 5 is great.">
      <wj-rating />
    </wj-field>
    <wj-field label="Product quality" error="Rate the product to continue.">
      <wj-rating />
    </wj-field>
  `,
  styles: `
    :host {
      display: grid;
      gap: 16px;
      inline-size: min(100%, 24rem);
    }
  `,
})
export class RatingInAFieldExample {}
