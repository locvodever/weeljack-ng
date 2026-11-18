import { DecimalPipe } from '@angular/common';
import { Component } from '@angular/core';
import type { WjTreeNode } from 'weeljack-ng';
import {
  WjTreeTable,
  WjTreeTableCellSlot,
  WjTreeTableColumn,
  WjTreeTableHeaderCellSlot,
} from 'weeljack-ng/treetable';

interface Entry {
  name: string;
  size: number;
  type: string;
}

@Component({
  selector: 'docs-treetable-custom-cells-example',
  imports: [
    WjTreeTable,
    WjTreeTableColumn,
    WjTreeTableCellSlot,
    WjTreeTableHeaderCellSlot,
    DecimalPipe,
  ],
  template: `
    <wj-treetable [value]="files" [expandedKeys]="open" ariaLabel="Files with sizes">
      <wj-treetable-column field="name" header="Name" />
      <wj-treetable-column field="size" header="Size">
        <ng-template wjTreeTableHeaderCell let-header>
          {{ header }} <span class="muted">KB</span>
        </ng-template>
        <ng-template wjTreeTableCell [wjTreeTableCellOf]="files" let-node>
          <span class="size">{{ node.data?.size | number }}</span>
        </ng-template>
      </wj-treetable-column>
      <wj-treetable-column field="type" header="Type" />
    </wj-treetable>
  `,
  styles: `
    :host {
      display: block;
    }

    .muted {
      color: var(--wj-text-muted-color);
      font-weight: normal;
    }

    .size {
      font-variant-numeric: tabular-nums;
    }
  `,
})
export class TreeTableCustomCellsExample {
  protected readonly files: WjTreeNode<Entry>[] = [
    {
      key: 'documents',
      data: { name: 'Documents', size: 220, type: 'Folder' },
      children: [
        { key: 'documents/report', data: { name: 'Report.pdf', size: 180, type: 'PDF' } },
        { key: 'documents/notes', data: { name: 'Notes.txt', size: 40, type: 'Text' } },
      ],
    },
    {
      key: 'pictures',
      data: { name: 'Pictures', size: 3400, type: 'Folder' },
      children: [
        { key: 'pictures/holiday', data: { name: 'Holiday.jpg', size: 2100, type: 'JPEG' } },
        { key: 'pictures/portrait', data: { name: 'Portrait.png', size: 1300, type: 'PNG' } },
      ],
    },
    {
      key: 'music',
      data: { name: 'Music', size: 9600, type: 'Folder' },
      children: [
        { key: 'music/song', data: { name: 'Song.mp3', size: 5200, type: 'MP3' } },
        { key: 'music/demo', data: { name: 'Demo.wav', size: 3100, type: 'WAV' } },
        { key: 'music/loop', data: { name: 'Loop.flac', size: 1300, type: 'FLAC' } },
      ],
    },
  ];

  protected readonly open: Record<string, boolean> = { documents: true, pictures: true };
}
