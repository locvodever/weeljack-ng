import { Component } from '@angular/core';
import type { WjMenuItem } from 'weeljack-ng';
import {
  WjIcon,
  wjIconDownload,
  wjIconLink,
  wjIconPencil,
  wjIconShare2,
  type WjIconDef,
} from 'weeljack-ng/icon';
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
  imports: [WjSpeedDial, WjSpeedDialItemSlot, WjIcon],
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
            @let icon = icons.get(item);
            @if (icon) {
              <wj-icon class="glyph" [icon]="icon" />
            }
          </ng-template>
        </wj-speeddial>
      </div>
    }
  `,
  styles: `
    .glyph {
      font-size: 1rem;
    }

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

  protected readonly icons = new Map<WjMenuItem, WjIconDef>([
    [this.edit, wjIconPencil],
    [this.share, wjIconShare2],
    [this.download, wjIconDownload],
    [this.copy, wjIconLink],
  ]);
}
