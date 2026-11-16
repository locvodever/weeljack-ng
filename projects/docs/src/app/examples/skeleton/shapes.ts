import { Component } from '@angular/core';
import { WjSkeleton } from 'weeljack-ng/skeleton';

@Component({
  selector: 'docs-skeleton-shapes-example',
  imports: [WjSkeleton],
  template: `
    <div class="row">
      <wj-skeleton size="48px" shape="circle" />
      <wj-skeleton width="8rem" height="3rem" />
    </div>
  `,
  styles: `
    .row {
      display: flex;
      align-items: center;
      gap: 16px;
    }
  `,
})
export class SkeletonShapesExample {}
