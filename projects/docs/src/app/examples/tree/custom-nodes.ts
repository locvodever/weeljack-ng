import { Component } from '@angular/core';
import type { WjTreeNode } from 'weeljack-ng';
import { WjIcon, wjIconFile, wjIconFolder } from 'weeljack-ng/icon';
import { WjTree, WjTreeNodeSlot } from 'weeljack-ng/tree';

interface Entry {
  items: number;
}

@Component({
  selector: 'docs-tree-custom-nodes-example',
  imports: [WjTree, WjTreeNodeSlot, WjIcon],
  template: `
    <wj-tree [value]="folders" [expandedKeys]="open" ariaLabel="Files, with a glyph and a count">
      <ng-template wjTreeNode [wjTreeNodeOf]="folders" let-node>
        <span class="row">
          @if (node.children) {
            <wj-icon [icon]="folder" />
          } @else {
            <wj-icon [icon]="file" />
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

    .count {
      color: var(--wj-text-muted-color);
      font-size: 0.875rem;
    }
  `,
})
export class TreeCustomNodesExample {
  protected readonly folder = wjIconFolder;
  protected readonly file = wjIconFile;

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
