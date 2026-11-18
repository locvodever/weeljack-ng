import { Component, computed, signal } from '@angular/core';
import type { WjTreeNode } from 'weeljack-ng';
import { WjTreeTable, WjTreeTableColumn } from 'weeljack-ng/treetable';

interface Entry {
  name: string;
  size: number;
  type: string;
}

@Component({
  selector: 'docs-treetable-checkbox-selection-example',
  imports: [WjTreeTable, WjTreeTableColumn],
  template: `
    <wj-treetable
      [value]="files"
      selectionMode="checkbox"
      [(selection)]="checked"
      [expandedKeys]="open"
      ariaLabel="Files, checkable"
    >
      <wj-treetable-column field="name" header="Name" />
      <wj-treetable-column field="size" header="Size (KB)" />
      <wj-treetable-column field="type" header="Type" />
    </wj-treetable>
    <p class="state">{{ state() }}</p>
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
export class TreeTableCheckboxSelectionExample {
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
      ],
    },
  ];

  protected readonly open: Record<string, boolean> = { documents: true, pictures: true };
  /** Nothing is checked at rest: a selection set from code draws no partial mark on a parent. */
  protected readonly checked = signal<WjTreeNode<Entry>[]>([]);

  protected readonly state = computed(() => {
    const names = this.checked().map((node) => node.data?.name ?? '');
    return names.length > 0 ? `Checked: ${names.join(', ')}` : 'Checked: none';
  });
}
