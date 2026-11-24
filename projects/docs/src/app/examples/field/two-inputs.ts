import { Component } from '@angular/core';
import { WjField } from 'weeljack-ng/field';
import { WjInputText } from 'weeljack-ng/inputtext';

@Component({
  selector: 'docs-field-two-inputs-example',
  imports: [WjField, WjInputText],
  template: `
    <wj-field label="Full name" hint="As it appears on your card.">
      <div class="row">
        <div class="part">
          <label for="first-name">First name</label>
          <input wjInputText id="first-name" autocomplete="given-name" />
        </div>
        <div class="part">
          <label for="last-name">Last name</label>
          <input wjInputText id="last-name" autocomplete="family-name" />
        </div>
      </div>
    </wj-field>
  `,
  styles: `
    :host {
      display: block;
      inline-size: min(100%, 24rem);
    }

    .row {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
    }

    .part {
      display: grid;
      flex: 1 1 10rem;
      gap: 4px;
    }

    label {
      font-size: 0.875rem;
      font-weight: 600;
    }
  `,
})
export class FieldTwoInputsExample {}
