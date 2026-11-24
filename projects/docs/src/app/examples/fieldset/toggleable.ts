import { Component, signal } from '@angular/core';
import { WjFieldset } from 'weeljack-ng/fieldset';

@Component({
  selector: 'docs-fieldset-toggleable-example',
  imports: [WjFieldset],
  template: `
    <wj-fieldset legend="Order notes" toggleable [(collapsed)]="collapsed">
      <p class="notes">Please ring the bell twice. Fragile items are packed on top.</p>
    </wj-fieldset>
    <p class="state" role="status">{{ collapsed() ? 'Collapsed' : 'Open' }}</p>
  `,
  styles: `
    :host {
      display: block;
      max-inline-size: 40rem;
    }

    .notes {
      margin: 0;
    }

    .state {
      margin: 8px 0 0;
      font-size: 0.875rem;
      color: var(--wj-text-muted-color);
    }
  `,
})
export class FieldsetToggleableExample {
  protected readonly collapsed = signal(false);
}
