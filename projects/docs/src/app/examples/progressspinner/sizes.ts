import { Component } from '@angular/core';
import { WjProgressSpinner } from 'weeljack-ng/progressspinner';

@Component({
  selector: 'docs-progressspinner-sizes-example',
  imports: [WjProgressSpinner],
  template: `
    <div class="row">
      <wj-progressspinner ariaLabel="Loading" style="width: 2rem; height: 2rem" />
      <wj-progressspinner ariaLabel="Loading" style="width: 3rem; height: 3rem" />
      <wj-progressspinner ariaLabel="Loading" style="width: 4rem; height: 4rem" />
    </div>
  `,
  styles: `
    .row {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 16px;
    }
  `,
})
export class ProgressspinnerSizesExample {}
