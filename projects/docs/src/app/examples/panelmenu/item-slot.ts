import { Component, signal } from '@angular/core';
import type { WjMenuItem, WjMenuItemCommandEvent } from 'weeljack-ng';
import { WjPanelMenu, WjPanelMenuItemSlot } from 'weeljack-ng/panelmenu';

const FOLDER = 'M2 4h4l1 1h7v8H2z';
const PAGE = 'M4 2h5l3 3v9H4zM9 2v3h3';

@Component({
  selector: 'docs-panelmenu-item-slot-example',
  imports: [WjPanelMenu, WjPanelMenuItemSlot],
  template: `
    <div class="column">
      <nav aria-label="Documentation">
        <wj-panelmenu [model]="items">
          <ng-template wjPanelMenuItem let-item>
            <svg
              aria-hidden="true"
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
            >
              <path [attr.d]="icons.get(item)" />
            </svg>
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
  protected readonly icons = new Map<WjMenuItem, string>(
    this.items.flatMap((panel) => [
      [panel, FOLDER] as const,
      ...(panel.items ?? []).map((item) => [item, PAGE] as const),
    ]),
  );
}
