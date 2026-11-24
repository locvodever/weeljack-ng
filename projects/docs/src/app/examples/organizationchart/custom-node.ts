import { Component } from '@angular/core';
import type { WjTreeNode } from 'weeljack-ng';
import { WjOrganizationChart, WjOrganizationChartNodeSlot } from 'weeljack-ng/organizationchart';

interface Lead {
  title: string;
}

@Component({
  selector: 'docs-organizationchart-custom-node-example',
  imports: [WjOrganizationChart, WjOrganizationChartNodeSlot],
  template: `
    <div class="frame" role="region" aria-label="Studio leads" tabindex="0">
      <wj-organizationchart [value]="leads" collapsible>
        <ng-template wjOrganizationChartNode [wjOrganizationChartNodeOf]="leads" let-node>
          <span class="person">
            <strong class="name">{{ node.label }}</strong>
            <span class="title">{{ node.data?.title }}</span>
          </span>
        </ng-template>
      </wj-organizationchart>
    </div>
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

    .person {
      display: grid;
      gap: 4px;
      justify-items: center;
    }

    .name {
      font-size: 1rem;
      font-weight: 600;
      color: var(--wj-text-color);
    }

    .title {
      font-size: 0.875rem;
      color: var(--wj-text-muted-color);
    }
  `,
})
export class OrganizationChartCustomNodeExample {
  protected readonly leads: WjTreeNode<Lead>[] = [
    {
      key: 'ada',
      label: 'Ada Park',
      data: { title: 'Director' },
      expanded: true,
      children: [
        { key: 'ben', label: 'Ben Ortiz', data: { title: 'Design lead' } },
        { key: 'chloe', label: 'Chloe Ng', data: { title: 'Engineering lead' } },
        { key: 'dev', label: 'Dev Rao', data: { title: 'Product lead' } },
      ],
    },
  ];
}
