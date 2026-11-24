import { Component } from '@angular/core';
import { WjButton } from 'weeljack-ng/button';
import { WjPanel, WjPanelFooterSlot, WjPanelHeaderSlot, WjPanelIconsSlot } from 'weeljack-ng/panel';

@Component({
  selector: 'docs-panel-slots-example',
  imports: [WjPanel, WjPanelHeaderSlot, WjPanelIconsSlot, WjPanelFooterSlot, WjButton],
  template: `
    <wj-panel header="Team" toggleable>
      <ng-template wjPanelHeader>
        <span class="muted">3 members</span>
      </ng-template>
      <ng-template wjPanelIcons>
        <wj-button label="Edit" size="small" severity="secondary" variant="text" />
      </ng-template>
      <ng-template wjPanelFooter>
        <span class="muted">Last updated 2 days ago.</span>
      </ng-template>
      Mara Ellis, Theo Park and Jun Okafor work on this board.
    </wj-panel>
  `,
  styles: `
    :host {
      display: block;
      max-inline-size: 40rem;
    }

    .muted {
      font-size: 0.875rem;
      color: var(--wj-text-muted-color);
    }
  `,
})
export class PanelSlotsExample {}
