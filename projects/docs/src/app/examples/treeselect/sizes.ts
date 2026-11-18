import { Component } from '@angular/core';
import type { WjTreeNode } from 'weeljack-ng';
import { WjField } from 'weeljack-ng/field';
import { WjTreeSelect } from 'weeljack-ng/treeselect';

@Component({
  selector: 'docs-treeselect-sizes-example',
  imports: [WjField, WjTreeSelect],
  template: `
    <wj-field label="Small">
      <wj-treeselect size="small" placeholder="Select a department" [options]="departments" />
    </wj-field>
    <wj-field label="Default">
      <wj-treeselect placeholder="Select a department" [options]="departments" />
    </wj-field>
    <wj-field label="Large">
      <wj-treeselect size="large" placeholder="Select a department" [options]="departments" />
    </wj-field>
  `,
  styles: `
    :host {
      display: grid;
      gap: 16px;
      inline-size: min(100%, 24rem);
    }
  `,
})
export class TreeSelectSizesExample {
  protected readonly departments: WjTreeNode[] = [
    {
      key: 'engineering',
      label: 'Engineering',
      children: [
        { key: 'engineering/platform', label: 'Platform' },
        { key: 'engineering/mobile', label: 'Mobile' },
        { key: 'engineering/data', label: 'Data' },
      ],
    },
    {
      key: 'design',
      label: 'Design',
      children: [
        { key: 'design/research', label: 'Research' },
        { key: 'design/visual', label: 'Visual' },
      ],
    },
    {
      key: 'operations',
      label: 'Operations',
      children: [
        { key: 'operations/finance', label: 'Finance' },
        { key: 'operations/people', label: 'People' },
      ],
    },
  ];
}
