import { Component } from '@angular/core';
import { WjAvatar, type WjAvatarSize } from 'weeljack-ng/avatar';
import { WjAvatarGroup } from 'weeljack-ng/avatargroup';
import { PORTRAIT_CLAY, PORTRAIT_DUSK, PORTRAIT_PLUM, PORTRAIT_SAGE } from './sample-images';

@Component({
  selector: 'docs-avatargroup-sizes-example',
  imports: [WjAvatarGroup, WjAvatar],
  template: `
    <div class="rows">
      <!-- Give every avatar in a group the same size: the overlap is 12, 16 or 24 px. -->
      @for (size of sizes; track $index) {
        <wj-avatargroup>
          @for (person of people; track person.name) {
            <wj-avatar
              [image]="person.image"
              [size]="size"
              shape="circle"
              [ariaLabel]="person.name"
            />
          }
          <wj-avatar label="+3" [size]="size" shape="circle" ariaLabel="3 more people" />
        </wj-avatargroup>
      }
    </div>
  `,
  styles: `
    .rows {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
  `,
})
export class AvatarGroupSizesExample {
  protected readonly sizes: (WjAvatarSize | undefined)[] = [undefined, 'large', 'xlarge'];
  protected readonly people = [
    { name: 'Ana Lima', image: PORTRAIT_SAGE },
    { name: 'Bao Tran', image: PORTRAIT_DUSK },
    { name: 'Cam Ha', image: PORTRAIT_CLAY },
    { name: 'Dev Rao', image: PORTRAIT_PLUM },
  ];
}
