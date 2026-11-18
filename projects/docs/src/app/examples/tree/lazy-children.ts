import { Component, signal } from '@angular/core';
import type { WjTreeNode } from 'weeljack-ng';
import { WjTree } from 'weeljack-ng/tree';

interface Entry {
  size: number;
}

/** The three folders before anything is loaded: `leaf: false` shows a toggle with no children. */
function unloaded(): WjTreeNode<Entry>[] {
  return [
    { key: 'projects', label: 'Projects', leaf: false },
    { key: 'photos', label: 'Photos', leaf: false },
    { key: 'backups', label: 'Backups', leaf: false },
  ];
}

@Component({
  selector: 'docs-tree-lazy-children-example',
  imports: [WjTree],
  template: `
    <wj-tree
      [value]="folders()"
      [(expandedKeys)]="open"
      [loading]="loading()"
      (nodeExpand)="load($event)"
      ariaLabel="Folders, loaded when opened"
    />
  `,
  styles: `
    :host {
      display: block;
      max-inline-size: 24rem;
    }
  `,
})
export class TreeLazyChildrenExample {
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
        label: `File ${String(number)}`,
        data: { size: number * 12 },
      }));
      this.folders.update((list) =>
        list.map((node) => (node.key === key ? { ...node, children: files } : node)),
      );
      this.loading.set(false);
    }, 400);
  }
}
