import { Component } from '@angular/core';
import { WjField } from 'weeljack-ng/field';
import { WjRadioButton } from 'weeljack-ng/radiobutton';

@Component({
  selector: 'docs-radiobutton-disabled-example',
  imports: [WjField, WjRadioButton],
  template: `
    <wj-field label="Delivery speed" hint="Set by your administrator.">
      <div class="options">
        <label for="disabled-speed-standard">
          <wj-radiobutton
            inputId="disabled-speed-standard"
            name="disabled-speed"
            option="standard"
            value="express"
            disabled
          />
          Standard
        </label>
        <label for="disabled-speed-express">
          <wj-radiobutton
            inputId="disabled-speed-express"
            name="disabled-speed"
            option="express"
            value="express"
            disabled
          />
          Express
        </label>
      </div>
    </wj-field>
    <wj-field label="Pickup time" hint="Evening pickup is full today.">
      <div class="options">
        <label for="disabled-pickup-morning">
          <wj-radiobutton
            inputId="disabled-pickup-morning"
            name="disabled-pickup"
            option="morning"
          />
          Morning
        </label>
        <label for="disabled-pickup-afternoon">
          <wj-radiobutton
            inputId="disabled-pickup-afternoon"
            name="disabled-pickup"
            option="afternoon"
          />
          Afternoon
        </label>
        <label for="disabled-pickup-evening">
          <wj-radiobutton
            inputId="disabled-pickup-evening"
            name="disabled-pickup"
            option="evening"
            disabled
          />
          Evening
        </label>
      </div>
    </wj-field>
  `,
  styles: `
    :host {
      display: grid;
      gap: 16px;
      inline-size: min(100%, 24rem);
    }

    .options {
      display: grid;
      gap: 8px;
    }

    label {
      display: flex;
      align-items: start;
      gap: 8px;
      line-height: 24px;
    }
  `,
})
export class RadioButtonDisabledExample {}
