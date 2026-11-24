import { Component } from '@angular/core';
import { WjAvatar } from 'weeljack-ng/avatar';
import { WjAvatarGroup } from 'weeljack-ng/avatargroup';
import { PORTRAIT_CLAY, PORTRAIT_DUSK, PORTRAIT_PLUM, PORTRAIT_SAGE } from './sample-images';

@Component({
  selector: 'docs-avatargroup-basic-example',
  imports: [WjAvatarGroup, WjAvatar],
  template: `
    <div class="row">
      <!-- Name each avatar, show at most five, then end with a named "+N" label avatar. -->
      <wj-avatargroup>
        <wj-avatar [image]="ana" shape="circle" ariaLabel="Ana Lima" />
        <wj-avatar [image]="bao" shape="circle" ariaLabel="Bao Tran" />
        <wj-avatar [image]="cam" shape="circle" ariaLabel="Cam Ha" />
        <wj-avatar [image]="dev" shape="circle" ariaLabel="Dev Rao" />
        <wj-avatar label="+3" shape="circle" ariaLabel="3 more people" />
      </wj-avatargroup>
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
export class AvatarGroupBasicExample {
  protected readonly ana = PORTRAIT_SAGE;
  protected readonly bao = PORTRAIT_DUSK;
  protected readonly cam = PORTRAIT_CLAY;
  protected readonly dev = PORTRAIT_PLUM;
}
