import { Component } from '@angular/core';
import { WjField } from 'weeljack-ng/field';
import { WjRating } from 'weeljack-ng/rating';

@Component({
  selector: 'docs-rating-read-only-example',
  imports: [WjField, WjRating],
  template: `
    <wj-field label="Average rating" hint="From 128 reviews.">
      <wj-rating readonly [value]="4" />
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
export class RatingReadOnlyExample {}
