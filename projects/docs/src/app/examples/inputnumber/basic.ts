import { Component, signal } from '@angular/core';
import { WjInputNumber } from 'weeljack-ng/inputnumber';

@Component({
  selector: 'docs-inputnumber-basic-example',
  imports: [WjInputNumber],
  template: `
    <label for="basic-quantity">Quantity</label>
    <wj-inputnumber inputId="basic-quantity" [(value)]="quantity" />
    <p class="state">Quantity: {{ quantity() ?? 'none' }}</p>
  `,
  styles: `
    :host {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 8px;
    }

    .state {
      flex-basis: 100%;
      margin: 0;
      font-size: 0.875rem;
      color: var(--wj-text-muted-color);
    }
  `,
})
export class InputNumberBasicExample {
  protected readonly quantity = signal<number | null>(1);
}
