import { Component, signal } from '@angular/core';
import type { WjTreeNode } from 'weeljack-ng';
import { WjTreeTable, WjTreeTableColumn } from 'weeljack-ng/treetable';

interface Entry {
  name: string;
  size: number;
  type: string;
}

/** The three folders before anything is loaded: `leaf: false` shows a toggle with no children. */
function unloaded(): WjTreeNode<Entry>[] {
  return [
    { key: 'projects', data: { name: 'Projects', size: 0, type: 'Folder' }, leaf: false },
    { key: 'photos', data: { name: 'Photos', size: 0, type: 'Folder' }, leaf: false },
    { key: 'backups', data: { name: 'Backups', size: 0, type: 'Folder' }, leaf: false },
  ];
}

@Component({
  selector: 'docs-treetable-lazy-children-example',
  imports: [WjTreeTable, WjTreeTableColumn],
  template: `
    <wj-treetable
      [value]="folders()"
      [(expandedKeys)]="open"
      [loading]="loading()"
      (nodeExpand)="load($event)"
      ariaLabel="Folders, loaded when opened"
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
export class TreeTableLazyChildrenExample {
  protected readonly folders = signal<WjTreeNode<Entry>[]>(unloaded());
  protected readonly open = signal<Record<string, boolean>>({});
  protected readonly loading = signal(false);

  /** Answers a folder opening: its three files arrive after about 400 ms, in a new `value`. */
  protected load(folder: WjTreeNode<Entry>): void {
    const { key } = folder;
    if (key === undefined || folder.children?.length) {
      return;
    }
    this.loading.set(true);
    setTimeout(() => {
      const files: WjTreeNode<Entry>[] = [1, 2, 3].map((number) => ({
        key: `${key}/file-${String(number)}`,
        data: { name: `File ${String(number)}`, size: number * 12, type: 'Text' },
      }));
      this.folders.update((list) =>
        list.map((node) => (node.key === key ? { ...node, children: files } : node)),
      );
      this.loading.set(false);
    }, 400);
  }
}
