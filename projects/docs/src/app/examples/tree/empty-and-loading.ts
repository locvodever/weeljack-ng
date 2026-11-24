import { Component } from '@angular/core';
import type { WjTreeNode } from 'weeljack-ng';
import { WjTree, WjTreeEmptySlot } from 'weeljack-ng/tree';

@Component({
  selector: 'docs-tree-empty-and-loading-example',
  imports: [WjTree, WjTreeEmptySlot],
  template: `
    <wj-tree [value]="none" ariaLabel="Folders, empty">
      <ng-template wjTreeEmpty>No folders yet.</ng-template>
    </wj-tree>

    <div class="gap"></div>

    <wj-tree [value]="none" loading ariaLabel="Folders, loading" />
  `,
  styles: `
    :host {
      display: block;
      max-inline-size: 24rem;
    }

    .gap {
      block-size: 1.5rem;
    }
  `,
})
export class TreeEmptyAndLoadingExample {
  protected readonly none: WjTreeNode[] = [];
}
