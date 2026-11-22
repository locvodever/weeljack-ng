import { Component, signal } from '@angular/core';
import type { WjMenuItem, WjMenuItemCommandEvent } from 'weeljack-ng';
import { WjIcon, wjIconFile, wjIconFolder, type WjIconDef } from 'weeljack-ng/icon';
import { WjPanelMenu, WjPanelMenuItemSlot } from 'weeljack-ng/panelmenu';

@Component({
  selector: 'docs-panelmenu-item-slot-example',
  imports: [WjPanelMenu, WjPanelMenuItemSlot, WjIcon],
  template: `
    <div class="column">
      <nav aria-label="Documentation">
        <wj-panelmenu [model]="items">
          <ng-template wjPanelMenuItem let-item>
            @let icon = icons.get(item);
            @if (icon) {
              <wj-icon [icon]="icon" />
            }
            <span>{{ item.label }}</span>
          </ng-template>
        </wj-panelmenu>
      </nav>
      <p class="status" role="status">{{ status() }}</p>
    </div>
  `,
  styles: `
    .column {
      max-inline-size: 18rem;
    }

    .status {
      margin: 8px 0 0;
      font-size: 0.875rem;
      color: var(--wj-text-muted-color);
    }
  `,
})
export class PanelmenuItemSlotExample {
  protected readonly status = signal('Nothing opened yet');

  private readonly open = (event: WjMenuItemCommandEvent): void => {
    this.status.set(`Opened: ${event.item.label ?? ''}`);
  };

  private readonly page = (label: string): WjMenuItem => ({ label, command: this.open });

  protected readonly items: WjMenuItem[] = [
    { label: 'Form', items: [this.page('Button'), this.page('Input text'), this.page('Select')] },
    { label: 'Data', items: [this.page('Table'), this.page('Paginator'), this.page('Data view')] },
    { label: 'Overlays', items: [this.page('Dialog'), this.page('Drawer'), this.page('Sheet')] },
  ];

  /** Icons by item: the slot hands back your own objects, so they are the keys. */
  protected readonly icons = new Map<WjMenuItem, WjIconDef>(
    this.items.flatMap((panel) => [
      [panel, wjIconFolder] as const,
      ...(panel.items ?? []).map((item) => [item, wjIconFile] as const),
    ]),
  );
}
