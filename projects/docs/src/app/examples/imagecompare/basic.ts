import { Component } from '@angular/core';
import {
  WjImageCompare,
  WjImageCompareLeftSlot,
  WjImageCompareRightSlot,
} from 'weeljack-ng/imagecompare';
import { SCENE_SUMMER, SCENE_WINTER } from './sample-images';

@Component({
  selector: 'docs-imagecompare-basic-example',
  imports: [WjImageCompare, WjImageCompareLeftSlot, WjImageCompareRightSlot],
  template: `
    <!-- Both slots are required, and each takes one element. The right image shows left of the handle. -->
    <wj-imagecompare ariaLabel="Before and after">
      <ng-template wjImageCompareLeft>
        <img [src]="winter" alt="A white hill under a pale sun in winter" />
      </ng-template>
      <ng-template wjImageCompareRight>
        <img [src]="summer" alt="The same hill, green, under a yellow sun in summer" />
      </ng-template>
    </wj-imagecompare>
  `,
  styles: `
    :host {
      display: block;
      max-inline-size: 40rem;
    }

    img {
      object-fit: cover;
    }
  `,
})
export class ImageCompareBasicExample {
  protected readonly winter = SCENE_WINTER;
  protected readonly summer = SCENE_SUMMER;
}
