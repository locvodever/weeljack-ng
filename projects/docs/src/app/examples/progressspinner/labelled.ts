import { Component } from '@angular/core';
import { WjProgressSpinner } from 'weeljack-ng/progressspinner';

@Component({
  selector: 'docs-progressspinner-labelled-example',
  imports: [WjProgressSpinner],
  template: `
    <div class="row">
      <wj-progressspinner ariaLabelledBy="orders-label" style="width: 2rem; height: 2rem" />
      <span id="orders-label">Loading orders…</span>
    </div>
  `,
  styles: `
    .row {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }
  `,
})
export class ProgressspinnerLabelledExample {}
