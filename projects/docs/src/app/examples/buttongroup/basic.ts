import { Component } from '@angular/core';
import { WjButton } from 'weeljack-ng/button';
import { WjButtonGroup } from 'weeljack-ng/buttongroup';

@Component({
  selector: 'docs-buttongroup-basic-example',
  imports: [WjButtonGroup, WjButton],
  template: `
    <div class="row">
      <!-- Name every group. Outlined secondary buttons keep the seams between buttons visible. -->
      <wj-buttongroup ariaLabel="Date navigation">
        <wj-button label="Previous" severity="secondary" variant="outlined" />
        <wj-button label="Today" severity="secondary" variant="outlined" />
        <wj-button label="Next" severity="secondary" variant="outlined" />
      </wj-buttongroup>
    </div>
  `,
  styles: `
    .row {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 16px;
    }
  `,
})
export class ButtonGroupBasicExample {}
