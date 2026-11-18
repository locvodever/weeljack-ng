import { Component, signal } from '@angular/core';
import type { WjTreeNode } from 'weeljack-ng';
import { WjTree } from 'weeljack-ng/tree';

interface Entry {
  items: number;
}

@Component({
  selector: 'docs-tree-basic-example',
  imports: [WjTree],
  template: `<wj-tree [value]="folders" [(expandedKeys)]="open" ariaLabel="Files" />`,
  styles: `
    :host {
      display: block;
      max-inline-size: 24rem;
    }
  `,
})
export class TreeBasicExample {
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
        { key: 'documents/invoices', label: 'Invoices', data: { items: 0 } },
      ],
    },
    {
      key: 'pictures',
      label: 'Pictures',
      data: { items: 1 },
      children: [{ key: 'pictures/holidays', label: 'Holidays', data: { items: 0 } }],
    },
    { key: 'music', label: 'Music', data: { items: 0 } },
    { key: 'archive', label: 'Archive', data: { items: 0 } },
  ];

  /** Which nodes are open, by key: Documents starts open, and a toggle writes a new map. */
  protected readonly open = signal<Record<string, boolean>>({ documents: true });
}
