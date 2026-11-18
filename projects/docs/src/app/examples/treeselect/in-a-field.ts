import { Component } from '@angular/core';
import type { WjTreeNode } from 'weeljack-ng';
import { WjField } from 'weeljack-ng/field';
import { WjTreeSelect } from 'weeljack-ng/treeselect';

@Component({
  selector: 'docs-treeselect-in-a-field-example',
  imports: [WjField, WjTreeSelect],
  template: `
    <wj-field label="Department" hint="Where the request is sent.">
      <wj-treeselect placeholder="Select a department" [options]="departments" />
    </wj-field>
    <wj-field label="Cost centre" error="Choose a cost centre.">
      <wj-treeselect placeholder="Select a cost centre" [options]="departments" />
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
export class TreeSelectInAFieldExample {
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
