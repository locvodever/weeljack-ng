import { Component, signal } from '@angular/core';
import type { WjTreeNode } from 'weeljack-ng';
import { WjOrganizationChart } from 'weeljack-ng/organizationchart';

@Component({
  selector: 'docs-organizationchart-collapsible-example',
  imports: [WjOrganizationChart],
  template: `
    <div class="frame" role="region" aria-label="Studio teams, collapsible" tabindex="0">
      <wj-organizationchart
        [value]="studio"
        collapsible
        (nodeExpand)="log('expanded', $event)"
        (nodeCollapse)="log('collapsed', $event)"
      />
    </div>
    <p class="status">{{ status() }}</p>
  `,
  styles: `
    :host {
      display: block;
    }

    .frame {
      display: block;
      overflow-x: auto;
      padding: 4px;
    }

    .frame:focus-visible {
      outline: var(--wj-focus-ring-width, 2px) var(--wj-focus-ring-style, solid)
        var(--wj-focus-ring-color);
      outline-offset: var(--wj-focus-ring-offset, 2px);
    }

    .status {
      margin: 8px 0 0;
      font-size: 0.875rem;
      color: var(--wj-text-muted-color);
    }
  `,
})
export class OrganizationChartCollapsibleExample {
  /** Give nodes a `key`: a toggled branch then keeps its state when `value` is set again. */
  protected readonly studio: WjTreeNode[] = [
    {
      key: 'studio',
      label: 'Studio',
      expanded: true,
      children: [
        {
          key: 'design',
          label: 'Design',
          expanded: true,
          children: [
            { key: 'research', label: 'Research' },
            { key: 'visual', label: 'Visual' },
          ],
        },
        {
          key: 'engineering',
          label: 'Engineering',
          children: [
            { key: 'web', label: 'Web' },
            { key: 'mobile', label: 'Mobile' },
          ],
        },
      ],
    },
  ];

  protected readonly status = signal('Last change: none yet');

  /** `node` is the very object in `studio`: the chart never hands out a copy. */
  protected log(what: 'expanded' | 'collapsed', node: WjTreeNode): void {
    this.status.set(`Last change: ${what} ${node.label ?? ''}`);
  }
}
