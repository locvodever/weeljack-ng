import { Component } from '@angular/core';
import { WjAvatar } from 'weeljack-ng/avatar';

@Component({
  selector: 'docs-avatar-label-example',
  imports: [WjAvatar],
  template: `
    <div class="row">
      <wj-avatar label="AL" ariaLabel="Ana Lima" />
      <wj-avatar label="BT" ariaLabel="Bao Tran" />
      <wj-avatar label="CH" ariaLabel="Cam Ha" />
    </div>
  `,
  styles: `
    .row {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 16px;
    }
  `,
})
export class AvatarLabelExample {}
