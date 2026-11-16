import { Component } from '@angular/core';
import { WjField } from 'weeljack-ng/field';

@Component({
  selector: 'docs-field-group-error-example',
  imports: [WjField],
  template: `
    <wj-field label="Delivery speed" error="Choose a delivery speed.">
      <div class="options">
        <label><input type="radio" name="speed-error" value="standard" /> Standard</label>
        <label><input type="radio" name="speed-error" value="express" /> Express</label>
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
export class FieldGroupErrorExample {}
