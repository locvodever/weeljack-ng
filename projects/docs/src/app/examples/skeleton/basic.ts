import { Component } from '@angular/core';
import { WjSkeleton } from 'weeljack-ng/skeleton';

@Component({
  selector: 'docs-skeleton-basic-example',
  imports: [WjSkeleton],
  template: `
    <div class="column">
      <wj-skeleton />
      <wj-skeleton width="60%" />
    </div>
  `,
  styles: `
    .column {
      display: flex;
      flex-direction: column;
      gap: 8px;
      max-width: 24rem;
    }
  `,
})
export class SkeletonBasicExample {}
