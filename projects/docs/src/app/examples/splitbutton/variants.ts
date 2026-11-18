import { Component } from '@angular/core';
import type { WjMenuItem } from 'weeljack-ng';
import { WjSplitButton } from 'weeljack-ng/splitbutton';

@Component({
  selector: 'docs-splitbutton-variants-example',
  imports: [WjSplitButton],
  template: `
    <div class="row">
      <span class="lead">Filled</span>
      <wj-splitbutton label="Open" [model]="items" />
      <span class="lead">Outlined</span>
      <wj-splitbutton label="Open" variant="outlined" [model]="items" />
      <span class="lead">Text</span>
      <wj-splitbutton label="Open" variant="text" [model]="items" />
    </div>
    <div class="row">
      <span class="lead">Primary</span>
      <wj-splitbutton label="Open" [model]="items" />
      <span class="lead">Secondary</span>
      <wj-splitbutton label="Open" severity="secondary" [model]="items" />
      <span class="lead">Success</span>
      <wj-splitbutton label="Open" severity="success" [model]="items" />
      <span class="lead">Danger</span>
      <wj-splitbutton label="Open" severity="danger" [model]="items" />
    </div>
    <div class="row">
      <span class="lead">Small</span>
      <wj-splitbutton label="Open" size="small" [model]="items" />
      <span class="lead">Default</span>
      <wj-splitbutton label="Open" [model]="items" />
      <span class="lead">Large</span>
      <wj-splitbutton label="Open" size="large" [model]="items" />
    </div>
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .row {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 16px;
    }

    .lead {
      font-size: 0.875rem;
      color: var(--wj-text-muted-color);
    }
  `,
})
export class SplitButtonVariantsExample {
  protected readonly items: WjMenuItem[] = [
    { label: 'Edit' },
    { label: 'Duplicate' },
    { label: 'Archive' },
  ];
}
