import { Component, signal } from '@angular/core';
import { WjAvatar } from 'weeljack-ng/avatar';
import { PORTRAIT_SAGE } from './sample-images';

@Component({
  selector: 'docs-avatar-image-example',
  imports: [WjAvatar],
  template: `
    <div class="row">
      <!-- Standing alone: named. Bind image only, and fall back to the initials on imageError. -->
      <wj-avatar
        [image]="failed() ? undefined : portrait"
        [label]="failed() ? 'AL' : undefined"
        ariaLabel="Ana Lima"
        (imageError)="failed.set(true)"
      />
      <!-- Beside the person's visible name: decorative, so it takes no name. -->
      <span class="person">
        <wj-avatar [image]="portrait" shape="circle" />
        <span>Ana Lima</span>
      </span>
    </div>
  `,
  styles: `
    .row {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 16px;
    }

    .person {
      display: inline-flex;
      align-items: center;
      gap: 8px;
    }
  `,
})
export class AvatarImageExample {
  protected readonly portrait = PORTRAIT_SAGE;
  protected readonly failed = signal(false);
}
