import { Component } from '@angular/core';
import { WjAvatar } from 'weeljack-ng/avatar';
import { WjIcon, wjIconUser } from 'weeljack-ng/icon';

@Component({
  selector: 'docs-avatar-projected-icon-example',
  imports: [WjAvatar, WjIcon],
  template: `
    <wj-avatar shape="circle" ariaLabel="Guest">
      <wj-icon [icon]="user" />
    </wj-avatar>
  `,
})
export class AvatarProjectedIconExample {
  protected readonly user = wjIconUser;
}
