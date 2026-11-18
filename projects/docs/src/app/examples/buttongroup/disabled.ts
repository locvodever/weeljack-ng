import { Component } from '@angular/core';
import { WjButton } from 'weeljack-ng/button';
import { WjButtonGroup } from 'weeljack-ng/buttongroup';

@Component({
  selector: 'docs-buttongroup-disabled-example',
  imports: [WjButtonGroup, WjButton],
  template: `
    <div class="row">
      <!-- A disabled button keeps its place in the join and leaves the Tab order. -->
      <wj-buttongroup ariaLabel="Clipboard">
        <wj-button label="Cut" severity="secondary" variant="outlined" />
        <wj-button label="Copy" severity="secondary" variant="outlined" />
        <wj-button label="Paste" severity="secondary" variant="outlined" disabled />
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
export class ButtonGroupDisabledExample {}
