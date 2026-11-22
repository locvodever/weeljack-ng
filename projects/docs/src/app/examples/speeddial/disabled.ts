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
import { WjSpeedDial, WjSpeedDialItemSlot } from 'weeljack-ng/speeddial';

@Component({
  selector: 'docs-speeddial-disabled-example',
  imports: [WjSpeedDial, WjSpeedDialItemSlot, WjIcon],
  template: `
    <div class="stage">
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

  protected readonly icons = new Map<WjMenuItem, WjIconDef>([
    [this.edit, wjIconPencil],
    [this.share, wjIconShare2],
    [this.download, wjIconDownload],
    [this.copy, wjIconLink],
  ]);
}
