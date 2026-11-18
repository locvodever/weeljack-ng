import { Component, computed, signal } from '@angular/core';
import type { WjTreeNode } from 'weeljack-ng';
import { WjField } from 'weeljack-ng/field';
import { WjTreeSelect } from 'weeljack-ng/treeselect';

@Component({
  selector: 'docs-treeselect-multiple-example',
  imports: [WjField, WjTreeSelect],
  template: `
    <div>
      <wj-field label="Teams">
        <wj-treeselect
          selectionMode="multiple"
          placeholder="Select teams"
          [options]="departments"
          [(value)]="picked"
        />
      </wj-field>
      <p class="state">{{ state() }}</p>
    </div>
  `,
  styles: `
    :host {
      display: grid;
      gap: 16px;
      inline-size: min(100%, 24rem);
    }

    .state {
      margin: 0.5rem 0 0;
      color: var(--wj-text-muted-color);
      font-size: 0.875rem;
    }
  `,
})
export class TreeSelectMultipleExample {
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
  protected readonly picked = signal<WjTreeNode[]>([]);
  protected readonly state = computed(
    () =>
      `Value: ${
        this.picked()
          .map((node) => node.label)
          .join(', ') || 'none'
      }`,
  );
}
