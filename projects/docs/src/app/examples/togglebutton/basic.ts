import { Component, signal } from '@angular/core';
import { WjToggleButton } from 'weeljack-ng/togglebutton';

@Component({
  selector: 'docs-togglebutton-basic-example',
  imports: [WjToggleButton],
  template: `
    <span id="basic-receipt">Email me a receipt</span>
    <wj-togglebutton ariaLabelledBy="basic-receipt" [(checked)]="receipt" />
    <p class="state">Checked: {{ receipt() }}</p>
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
export class ToggleButtonBasicExample {
  protected readonly receipt = signal(false);
}
