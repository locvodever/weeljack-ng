import { Component } from '@angular/core';
import type { WjTreeNode } from 'weeljack-ng';
import { WjTree, WjTreeNodeSlot } from 'weeljack-ng/tree';

interface Entry {
  items: number;
}

@Component({
  selector: 'docs-tree-custom-nodes-example',
  imports: [WjTree, WjTreeNodeSlot],
  template: `
    <wj-tree [value]="folders" [expandedKeys]="open" ariaLabel="Files, with a glyph and a count">
      <ng-template wjTreeNode [wjTreeNodeOf]="folders" let-node>
        <span class="row">
          @if (node.children) {
            <svg class="glyph" viewBox="0 0 16 16" aria-hidden="true">
              <path
                d="M1.75 4.25a1 1 0 0 1 1-1h3l1.5 1.5h6a1 1 0 0 1 1 1v6.5a1 1 0 0 1-1 1h-10.5a1 1 0 0 1-1-1z"
              />
            </svg>
          } @else {
            <svg class="glyph" viewBox="0 0 16 16" aria-hidden="true">
              <path d="M4 1.75h5l3.25 3.25v9.25H4zM9 1.75V5h3.25" />
            </svg>
          }
          <span>{{ node.label }}</span>
          @if (node.children) {
            <small class="count">{{ node.data?.items }} items</small>
          }
        </span>
      </ng-template>
    </wj-tree>
  `,
  styles: `
    :host {
      display: block;
      max-inline-size: 24rem;
    }

    .row {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
    }

    .glyph {
      inline-size: 1rem;
      block-size: 1rem;
      flex: none;
      fill: none;
      stroke: currentColor;
      stroke-width: 1.5;
      stroke-linejoin: round;
    }

    .count {
      color: var(--wj-text-muted-color);
      font-size: 0.875rem;
    }
  `,
})
export class TreeCustomNodesExample {
  protected readonly folders: WjTreeNode<Entry>[] = [
    {
      key: 'documents',
      label: 'Documents',
      data: { items: 2 },
      children: [
        {
          key: 'documents/reports',
          label: 'Reports',
          data: { items: 2 },
          children: [
            { key: 'documents/reports/q1', label: 'Q1 report', data: { items: 0 } },
            { key: 'documents/reports/q2', label: 'Q2 report', data: { items: 0 } },
          ],
        },
        { key: 'documents/invoices', label: 'Invoices', data: { items: 0 }, children: [] },
      ],
    },
    {
      key: 'pictures',
      label: 'Pictures',
      data: { items: 1 },
      children: [{ key: 'pictures/holidays', label: 'Holidays', data: { items: 0 } }],
    },
    { key: 'music', label: 'Music', data: { items: 0 }, children: [] },
    { key: 'archive', label: 'Archive', data: { items: 0 }, children: [] },
  ];

  protected readonly open: Record<string, boolean> = { documents: true, 'documents/reports': true };
}
