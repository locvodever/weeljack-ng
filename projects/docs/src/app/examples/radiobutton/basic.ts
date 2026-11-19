import { Component, signal } from '@angular/core';
import { WjField } from 'weeljack-ng/field';
import { WjRadioButton } from 'weeljack-ng/radiobutton';

@Component({
  selector: 'docs-radiobutton-basic-example',
  imports: [WjField, WjRadioButton],
  template: `
    <wj-field label="Delivery speed" hint="You can change this later.">
      <div class="options">
        <label for="basic-speed-standard">
          <wj-radiobutton
            inputId="basic-speed-standard"
            name="basic-speed"
            option="standard"
            [(value)]="speed"
          />
          Standard
        </label>
        <label for="basic-speed-express">
          <wj-radiobutton
            inputId="basic-speed-express"
            name="basic-speed"
            option="express"
            [(value)]="speed"
          />
          Express
        </label>
        <label for="basic-speed-pickup">
          <wj-radiobutton
            inputId="basic-speed-pickup"
            name="basic-speed"
            option="pickup"
            [(value)]="speed"
          />
          Pick up in store
        </label>
      </div>
    </wj-field>
    <p class="state">Picked: {{ speed() ?? 'nothing' }}</p>
  `,
  styles: `
    :host {
      display: grid;
      gap: 8px;
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

    .state {
      margin: 0;
      font-size: 0.875rem;
      color: var(--wj-text-muted-color);
    }
  `,
})
export class RadioButtonBasicExample {
  protected readonly speed = signal<string | null>('standard');
}
