import { Component } from '@angular/core';
import { WjSkeleton } from 'weeljack-ng/skeleton';

@Component({
  selector: 'docs-skeleton-card-example',
  imports: [WjSkeleton],
  template: `
    <div class="card" aria-busy="true">
      <div class="header">
        <wj-skeleton size="48px" shape="circle" />
        <div class="lines">
          <wj-skeleton />
          <wj-skeleton width="60%" />
        </div>
      </div>
      <wj-skeleton height="8rem" borderRadius="12px" />
    </div>
  `,
  styles: `
    .card {
      display: flex;
      flex-direction: column;
      gap: 16px;
      box-sizing: border-box;
      max-width: 24rem;
      padding: 16px;
    }

    .header {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .lines {
      display: flex;
      flex: 1;
      flex-direction: column;
      gap: 8px;
    }
  `,
})
export class SkeletonCardExample {}
