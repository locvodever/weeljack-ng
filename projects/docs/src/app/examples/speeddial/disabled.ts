import { Component } from '@angular/core';
import type { WjMenuItem } from 'weeljack-ng';
import { WjSpeedDial, WjSpeedDialItemSlot } from 'weeljack-ng/speeddial';

@Component({
  selector: 'docs-speeddial-disabled-example',
  imports: [WjSpeedDial, WjSpeedDialItemSlot],
  template: `
    <div class="stage">
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

    .dial {
      position: absolute;
      inset-block-end: 16px;
      inset-inline-end: 16px;
    }
  `,
})
export class SpeedDialDisabledExample {
  private readonly edit: WjMenuItem = { label: 'Edit' };
  private readonly share: WjMenuItem = { label: 'Share' };
  /** A disabled action is dimmed and runs nothing, whatever `command` the item carries. */
  private readonly download: WjMenuItem = { label: 'Download', disabled: true };
  private readonly copy: WjMenuItem = { label: 'Copy link' };

  protected readonly items: WjMenuItem[] = [this.edit, this.share, this.download, this.copy];

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
