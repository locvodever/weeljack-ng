import { Component } from '@angular/core';
import type { WjTreeNode } from 'weeljack-ng';
import { WjTreeTable, WjTreeTableColumn } from 'weeljack-ng/treetable';

interface Entry {
  name: string;
  size: number;
  type: string;
}

/** 23 generated folders with two files each, so the last page is short. */
function generateFolders(count: number): WjTreeNode<Entry>[] {
  return Array.from({ length: count }, (_unused, index) => {
    const key = `folder-${String(index + 1)}`;
    const name = `Folder ${String(index + 1)}`;
    return {
      key,
      data: { name, size: 100 * (index + 1), type: 'Folder' },
      children: [
        { key: `${key}/notes`, data: { name: `${name} notes`, size: 40, type: 'Text' } },
        { key: `${key}/report`, data: { name: `${name} report`, size: 60, type: 'PDF' } },
      ],
    };
  });
}

@Component({
  selector: 'docs-treetable-paging-example',
  imports: [WjTreeTable, WjTreeTableColumn],
  template: `
    <wj-treetable
      [value]="folders"
      paginator
      [rows]="5"
      [rowsPerPageOptions]="[5, 10, 20]"
      ariaLabel="Folders, paged"
    >
      <wj-treetable-column field="name" header="Name" />
      <wj-treetable-column field="size" header="Size (KB)" />
      <wj-treetable-column field="type" header="Type" />
    </wj-treetable>
  `,
  styles: `
    :host {
      display: block;
    }
  `,
})
export class TreeTablePagingExample {
  protected readonly folders = generateFolders(23);
}
