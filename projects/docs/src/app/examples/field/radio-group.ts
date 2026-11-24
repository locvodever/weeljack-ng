import { Component } from '@angular/core';
import { WjField } from 'weeljack-ng/field';

@Component({
  selector: 'docs-field-radio-group-example',
  imports: [WjField],
  template: `
    <wj-field label="Delivery speed" hint="You can change this later.">
      <div class="options">
        <label><input type="radio" name="speed" value="standard" checked /> Standard</label>
        <label><input type="radio" name="speed" value="express" /> Express</label>
        <label><input type="radio" name="speed" value="pickup" /> Pick up in store</label>
      </div>
    </wj-field>
  `,
  styles: `
    :host {
      display: block;
      inline-size: min(100%, 24rem);
    }

    .options {
      display: grid;
      gap: 8px;
    }

    label {
      display: flex;
      align-items: center;
      gap: 8px;
      min-block-size: 24px;
    }
  `,
})
export class FieldRadioGroupExample {}
