import { Component } from '@angular/core';
import { WjButton } from 'weeljack-ng/button';
import { WjToolbar, WjToolbarEndSlot, WjToolbarStartSlot } from 'weeljack-ng/toolbar';

@Component({
  selector: 'docs-toolbar-labelled-example',
  imports: [WjToolbar, WjToolbarStartSlot, WjToolbarEndSlot, WjButton],
  template: `
    <span id="toolbar-table-actions" class="caption">Table actions</span>
    <wj-toolbar ariaLabelledBy="toolbar-table-actions">
      <ng-template wjToolbarStart>
        <wj-button label="Add row" size="small" severity="secondary" variant="text" />
        <wj-button label="Add column" size="small" severity="secondary" variant="text" />
      </ng-template>
      <ng-template wjToolbarEnd>
        <wj-button label="Export" size="small" severity="secondary" variant="outlined" />
      </ng-template>
    </wj-toolbar>
  `,
  styles: `
    :host {
      display: block;
    }

    .caption {
      display: block;
      margin-block-end: 8px;
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--wj-text-color);
    }
  `,
})
export class ToolbarLabelledExample {}
