import { Component, signal } from '@angular/core';
import type { WjMenuItem, WjMenuItemCommandEvent } from 'weeljack-ng';
import { WjSpeedDial, WjSpeedDialItemSlot } from 'weeljack-ng/speeddial';

@Component({
  selector: 'docs-speeddial-basic-example',
  imports: [WjSpeedDial, WjSpeedDialItemSlot],
  template: `
    <div class="stage">
      <p class="status" role="status">{{ status() }}</p>
      <wj-speeddial class="dial" [model]="items">
        <ng-template wjSpeedDialItem let-item>
          <svg
            aria-hidden="true"
            focusable="false"
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path [attr.d]="icons.get(item)" />
          </svg>
        </ng-template>
      </wj-speeddial>
    </div>
  `,
  styles: `
    :host {
      display: block;
      inline-size: 100%;
    }

    .stage {
      position: relative;
      inline-size: 100%;
      block-size: 16rem;
      border: 1px solid var(--wj-content-border-color);
      border-radius: 12px;
      background: var(--wj-content-hover-background);
      color: var(--wj-text-color);
    }

    /* The closed actions keep their space, so the host is placed out of flow, at the toggle's corner. */
    .dial {
      position: absolute;
      inset-block-end: 16px;
      inset-inline-end: 16px;
    }

    .status {
      position: absolute;
      inset-block-start: 12px;
      inset-inline-start: 12px;
      margin: 0;
      font-size: 0.875rem;
      color: var(--wj-text-color);
    }
  `,
})
export class SpeedDialBasicExample {
  protected readonly status = signal('No action yet');

  /** `event.item` is your own item, the same reference as in `items`. */
  private readonly run = (event: WjMenuItemCommandEvent): void => {
    this.status.set(`Last action: ${event.item.label ?? ''}`);
  };

  private readonly edit: WjMenuItem = { label: 'Edit', command: this.run };
  private readonly share: WjMenuItem = { label: 'Share', command: this.run };
  private readonly download: WjMenuItem = { label: 'Download', command: this.run };
  private readonly copy: WjMenuItem = { label: 'Copy link', command: this.run };

  /** Every label is the action's name and is never drawn: each item needs one. */
  protected readonly items: WjMenuItem[] = [this.edit, this.share, this.download, this.copy];

  /** Icons by item: the slot hands back your own objects, so they are the keys. */
  protected readonly icons = new Map<WjMenuItem, string>([
    [this.edit, 'M2 14l1-4 8-8 3 3-8 8zM9 4l3 3'],
    [this.share, 'M8 10V2M5 5l3-3 3 3M3 9v5h10V9'],
    [this.download, 'M8 2v8M5 7l3 3 3-3M3 13h10'],
    [
      this.copy,
      'M6.5 9.5l3-3M5 8L3.5 9.5a2.1 2.1 0 0 0 3 3L8 11M8 5l1.5-1.5a2.1 2.1 0 0 1 3 3L11 8',
    ],
  ]);
}
