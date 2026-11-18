import { Component, computed, signal } from '@angular/core';
import type { WjTreeNode } from 'weeljack-ng';
import { WjTree } from 'weeljack-ng/tree';

interface Entry {
  items: number;
}

@Component({
  selector: 'docs-tree-single-and-multiple-example',
  imports: [WjTree],
  template: `
    <wj-tree
      [value]="folders"
      selectionMode="single"
      [(selection)]="one"
      [expandedKeys]="open"
      ariaLabel="Folders, one can be selected"
    />
    <p class="state">{{ oneState() }}</p>

    <wj-tree
      [value]="folders"
      selectionMode="multiple"
      [(selection)]="many"
      [expandedKeys]="open"
      ariaLabel="Folders, many can be selected"
    />
    <p class="state">{{ manyState() }}</p>
  `,
  styles: `
    :host {
      display: block;
      max-inline-size: 24rem;
    }

    .state {
      margin: 0.5rem 0 1.5rem;
      color: var(--wj-text-muted-color);
      font-size: 0.875rem;
    }

    .state:last-child {
      margin-block-end: 0;
    }
  `,
})
export class TreeSingleAndMultipleExample {
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
    {
      key: 'archive',
      label: 'Archive',
      data: { items: 1 },
      selectable: false,
      children: [{ key: 'archive/old', label: 'Old files', data: { items: 0 } }],
    },
  ];

  protected readonly open: Record<string, boolean> = { documents: true };
  protected readonly one = signal<WjTreeNode<Entry>[]>([]);
  protected readonly many = signal<WjTreeNode<Entry>[]>([]);

  protected readonly oneState = computed(() => state(this.one()));
  protected readonly manyState = computed(() => state(this.many()));
}

/** What the state line under a tree says: the labels selected, or that nothing is. */
function state(selected: WjTreeNode<Entry>[]): string {
  return selected.length === 0
    ? 'Nothing selected'
    : `Selected: ${selected.map((node) => node.label).join(', ')}`;
}
