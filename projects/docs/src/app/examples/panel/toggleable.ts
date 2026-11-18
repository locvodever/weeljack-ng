import { Component, signal } from '@angular/core';
import { WjPanel } from 'weeljack-ng/panel';

@Component({
  selector: 'docs-panel-toggleable-example',
  imports: [WjPanel],
  template: `
    <wj-panel header="Order summary" toggleable [(collapsed)]="collapsed">
      Three items, shipped together, arriving on Thursday.
    </wj-panel>
    <p class="state" role="status">{{ collapsed() ? 'Collapsed' : 'Open' }}</p>
  `,
  styles: `
    :host {
      display: block;
      max-inline-size: 40rem;
    }

    .state {
      margin: 8px 0 0;
      font-size: 0.875rem;
      color: var(--wj-text-muted-color);
    }
  `,
})
export class PanelToggleableExample {
  protected readonly collapsed = signal(false);
}
