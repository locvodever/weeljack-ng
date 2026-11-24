import { Component, signal } from '@angular/core';
import type { WjTreeNode } from 'weeljack-ng';
import { WjTreeTable, WjTreeTableColumn } from 'weeljack-ng/treetable';

interface Entry {
  name: string;
  size: number;
  type: string;
}

@Component({
  selector: 'docs-treetable-basic-example',
  imports: [WjTreeTable, WjTreeTableColumn],
  template: `
    <wj-treetable [value]="files" [(expandedKeys)]="open" ariaLabel="Files">
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
export class TreeTableBasicExample {
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

  /** Which rows are open, by key: Documents starts open, and a toggle writes a new map. */
  protected readonly open = signal<Record<string, boolean>>({ documents: true });
}
