import { Component } from '@angular/core';
import { WjAvatar } from 'weeljack-ng/avatar';
import { PORTRAIT_DUSK } from './sample-images';

@Component({
  selector: 'docs-avatar-shapes-example',
  imports: [WjAvatar],
  template: `
    <div class="row">
      <wj-avatar [image]="portrait" size="large" ariaLabel="Ana Lima" />
      <wj-avatar [image]="portrait" size="large" shape="circle" ariaLabel="Ana Lima" />
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
export class AvatarShapesExample {
  protected readonly portrait = PORTRAIT_DUSK;
}
