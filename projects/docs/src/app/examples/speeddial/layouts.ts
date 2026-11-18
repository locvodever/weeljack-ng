import { Component } from '@angular/core';
import type { WjMenuItem } from 'weeljack-ng';
import {
  WjSpeedDial,
  WjSpeedDialItemSlot,
  type WjSpeedDialDirection,
  type WjSpeedDialType,
} from 'weeljack-ng/speeddial';

interface Layout {
  caption: string;
  type: WjSpeedDialType;
  direction: WjSpeedDialDirection;
  /** Where the host is anchored: the corner the actions grow away from. */
  anchor: string;
  name: string;
}

@Component({
  selector: 'docs-speeddial-layouts-example',
  imports: [WjSpeedDial, WjSpeedDialItemSlot],
  template: `
    @for (layout of layouts; track layout.caption) {
      <div class="stage">
        <p class="caption">{{ layout.caption }}</p>
        <wj-speeddial
          [class]="'dial ' + layout.anchor"
          [model]="items"
          [type]="layout.type"
          [direction]="layout.direction"
          [ariaLabel]="layout.name"
        >
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
    }
  `,
  styles: `
    :host {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(16rem, 1fr));
      gap: 16px;
      inline-size: 100%;
    }

    .stage {
      position: relative;
      block-size: 16rem;
      border: 1px solid var(--wj-content-border-color);
      border-radius: 12px;
      background: var(--wj-content-hover-background);
      color: var(--wj-text-color);
    }

    .caption {
      position: absolute;
      inset-block-start: 12px;
      inset-inline-start: 12px;
      margin: 0;
      font-size: 0.875rem;
      color: var(--wj-text-color);
    }

    /* Out of flow, 16 px from the edges, at the end the actions grow away from. */
    .dial {
      position: absolute;
      inline-size: fit-content;
      block-size: fit-content;
    }

    .bottom {
      inset-block-end: 16px;
      inset-inline: 0;
      margin-inline: auto;
    }

    .top {
      inset-block-start: 16px;
      inset-inline: 0;
      margin-inline: auto;
    }

    .end {
      inset-inline-end: 16px;
      inset-block: 0;
      margin-block: auto;
    }

    .start {
      inset-inline-start: 16px;
      inset-block: 0;
      margin-block: auto;
    }

    .centre {
      inset: 0;
      margin: auto;
    }

    .corner {
      inset-block-end: 16px;
      inset-inline-end: 16px;
    }
  `,
})
export class SpeedDialLayoutsExample {
  private readonly edit: WjMenuItem = { label: 'Edit' };
  private readonly share: WjMenuItem = { label: 'Share' };
  private readonly download: WjMenuItem = { label: 'Download' };
  private readonly copy: WjMenuItem = { label: 'Copy link' };

  protected readonly items: WjMenuItem[] = [this.edit, this.share, this.download, this.copy];

  /** Each dial on a page needs a name of its own: the layout tells them apart. */
  protected readonly layouts: Layout[] = [
    { caption: 'Up', type: 'linear', direction: 'up', anchor: 'bottom', name: 'Actions (up)' },
    { caption: 'Down', type: 'linear', direction: 'down', anchor: 'top', name: 'Actions (down)' },
    { caption: 'Left', type: 'linear', direction: 'left', anchor: 'end', name: 'Actions (left)' },
    {
      caption: 'Right',
      type: 'linear',
      direction: 'right',
      anchor: 'start',
      name: 'Actions (right)',
    },
    {
      caption: 'Circle',
      type: 'circle',
      direction: 'up',
      anchor: 'centre',
      name: 'Actions (circle)',
    },
    {
      caption: 'Semi-circle',
      type: 'semi-circle',
      direction: 'up',
      anchor: 'bottom',
      name: 'Actions (semi-circle)',
    },
    {
      caption: 'Quarter circle',
      type: 'quarter-circle',
      direction: 'up-left',
      anchor: 'corner',
      name: 'Actions (quarter circle)',
    },
  ];

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
