import { Component, signal } from '@angular/core';
import type { WjMenuItem, WjMenuItemCommandEvent } from 'weeljack-ng';
import {
  WjIcon,
  wjIconDownload,
  wjIconLink,
  wjIconPencil,
  wjIconShare2,
  type WjIconDef,
} from 'weeljack-ng/icon';
import { WjSpeedDial, WjSpeedDialItemSlot } from 'weeljack-ng/speeddial';

@Component({
  selector: 'docs-speeddial-basic-example',
  imports: [WjSpeedDial, WjSpeedDialItemSlot, WjIcon],
  template: `
    <div class="stage">
      <p class="status" role="status">{{ status() }}</p>
      <wj-speeddial class="dial" [model]="items">
        <ng-template wjSpeedDialItem let-item>
          @let icon = icons.get(item);
          @if (icon) {
            <wj-icon class="glyph" [icon]="icon" />
          }
        </ng-template>
      </wj-speeddial>
    </div>
  `,
  styles: `
    .glyph {
      font-size: 1rem;
    }

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
  protected readonly icons = new Map<WjMenuItem, WjIconDef>([
    [this.edit, wjIconPencil],
    [this.share, wjIconShare2],
    [this.download, wjIconDownload],
    [this.copy, wjIconLink],
  ]);
}
