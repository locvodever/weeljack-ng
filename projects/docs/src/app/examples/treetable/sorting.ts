import { Component, signal } from '@angular/core';
import type { WjSortOrder, WjTreeNode } from 'weeljack-ng';
import { WjTreeTable, WjTreeTableColumn } from 'weeljack-ng/treetable';

interface Entry {
  name: string;
  size: number;
  type: string;
}

@Component({
  selector: 'docs-treetable-sorting-example',
  imports: [WjTreeTable, WjTreeTableColumn],
  template: `
    <wj-treetable
      [value]="files"
      [(sortField)]="field"
      [(sortOrder)]="order"
      [expandedKeys]="open"
      ariaLabel="Files, sortable"
    >
      <wj-treetable-column field="name" header="Name" sortable />
      <wj-treetable-column field="size" header="Size (KB)" sortable />
      <wj-treetable-column field="type" header="Type" />
    </wj-treetable>
    <p class="state">Sorted by {{ field() }}, {{ order() === 1 ? 'ascending' : 'descending' }}</p>
  `,
  styles: `
    :host {
      display: block;
    }

    .state {
      margin: 0.5rem 0 0;
      color: var(--wj-text-muted-color);
      font-size: 0.875rem;
    }
  `,
})
export class TreeTableSortingExample {
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

  protected readonly open: Record<string, boolean> = { documents: true, music: true };
  /** Sorting starts on Name, ascending: the models are two-way, so a click on a header updates them. */
  protected readonly field = signal<string | undefined>('name');
  protected readonly order = signal<WjSortOrder>(1);
}
