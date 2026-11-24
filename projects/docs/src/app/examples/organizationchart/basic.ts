import { Component } from '@angular/core';
import type { WjTreeNode } from 'weeljack-ng';
import { WjOrganizationChart } from 'weeljack-ng/organizationchart';

@Component({
  selector: 'docs-organizationchart-basic-example',
  imports: [WjOrganizationChart],
  template: `
    <div class="frame" role="region" aria-label="Studio teams" tabindex="0">
      <wj-organizationchart [value]="studio" />
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
  `,
})
export class OrganizationChartBasicExample {
  /** One root: Optimus draws only the first node. Every branch is `expanded`, so all of it shows. */
  protected readonly studio: WjTreeNode[] = [
    {
      label: 'Studio',
      expanded: true,
      children: [
        {
          label: 'Design',
          expanded: true,
          children: [{ label: 'Research' }, { label: 'Visual' }],
        },
        {
          label: 'Engineering',
          expanded: true,
          children: [{ label: 'Web' }, { label: 'Mobile' }],
        },
      ],
    },
  ];
}
