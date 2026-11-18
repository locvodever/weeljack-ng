import { Component } from '@angular/core';
import type { WjTreeNode } from 'weeljack-ng';
import {
  WjTreeTable,
  WjTreeTableCaptionSlot,
  WjTreeTableColumn,
  WjTreeTableEmptySlot,
  WjTreeTableSummarySlot,
} from 'weeljack-ng/treetable';

interface Entry {
  name: string;
  size: number;
  type: string;
}

@Component({
  selector: 'docs-treetable-empty-loading-caption-summary-example',
  imports: [
    WjTreeTable,
    WjTreeTableColumn,
    WjTreeTableEmptySlot,
    WjTreeTableCaptionSlot,
    WjTreeTableSummarySlot,
  ],
  template: `
    <wj-treetable [value]="none" ariaLabel="Files, empty">
      <wj-treetable-column field="name" header="Name" />
      <wj-treetable-column field="size" header="Size (KB)" />
      <wj-treetable-column field="type" header="Type" />
      <ng-template wjTreeTableEmpty>No files yet.</ng-template>
    </wj-treetable>

    <div class="gap"></div>

    <wj-treetable [value]="files" [expandedKeys]="open" loading ariaLabel="Files, loading">
      <wj-treetable-column field="name" header="Name" />
      <wj-treetable-column field="size" header="Size (KB)" />
      <wj-treetable-column field="type" header="Type" />
    </wj-treetable>

    <div class="gap"></div>

    <wj-treetable [value]="files" [expandedKeys]="open" ariaLabelledBy="project-files-title">
      <wj-treetable-column field="name" header="Name" />
      <wj-treetable-column field="size" header="Size (KB)" />
      <wj-treetable-column field="type" header="Type" />
      <ng-template wjTreeTableCaption>
        <div class="caption">
          <span id="project-files-title" class="title">Project files</span>
          <span class="count">{{ files.length }} folders</span>
        </div>
      </ng-template>
      <ng-template wjTreeTableSummary>Sizes are in kilobytes.</ng-template>
    </wj-treetable>
  `,
  styles: `
    :host {
      display: block;
    }

    .gap {
      block-size: 1.5rem;
    }

    .caption {
      display: flex;
      flex-wrap: wrap;
      align-items: baseline;
      justify-content: space-between;
      gap: 8px;
    }

    .title {
      font-weight: 600;
    }

    .count {
      font-size: 0.875rem;
      color: var(--wj-text-muted-color);
    }
  `,
})
export class TreeTableEmptyLoadingCaptionSummaryExample {
  protected readonly none: WjTreeNode<Entry>[] = [];

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
  ];

  protected readonly open: Record<string, boolean> = { documents: true };
}
