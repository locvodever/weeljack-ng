import { Component, computed, signal } from '@angular/core';
import type { WjTreeNode } from 'weeljack-ng';
import { WjTree } from 'weeljack-ng/tree';

interface Entry {
  items: number;
}

@Component({
  selector: 'docs-tree-checkbox-example',
  imports: [WjTree],
  template: `
    <wj-tree
      [value]="folders"
      selectionMode="checkbox"
      [(selection)]="checked"
      [expandedKeys]="open"
      ariaLabel="Folders, with checkboxes"
    />
    <p class="state">{{ state() }}</p>
  `,
  styles: `
    :host {
      display: block;
      max-inline-size: 24rem;
    }

    .state {
      margin: 0.5rem 0 0;
      color: var(--wj-text-muted-color);
      font-size: 0.875rem;
    }
  `,
})
export class TreeCheckboxExample {
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
  ];

  protected readonly open: Record<string, boolean> = { documents: true, 'documents/reports': true };
  protected readonly checked = signal<WjTreeNode<Entry>[]>([]);

  protected readonly state = computed(() => {
    const labels = this.checked().map((node) => node.label);
    return labels.length === 0 ? 'Checked: none' : `Checked: ${labels.join(', ')}`;
  });
}
