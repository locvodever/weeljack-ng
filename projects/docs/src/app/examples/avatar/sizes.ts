import { Component } from '@angular/core';
import { WjAvatar } from 'weeljack-ng/avatar';

@Component({
  selector: 'docs-avatar-sizes-example',
  imports: [WjAvatar],
  template: `
    <div class="row">
      <wj-avatar label="AL" ariaLabel="Ana Lima" />
      <wj-avatar label="AL" size="large" ariaLabel="Ana Lima" />
      <wj-avatar label="AL" size="xlarge" ariaLabel="Ana Lima" />
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
export class AvatarSizesExample {}
