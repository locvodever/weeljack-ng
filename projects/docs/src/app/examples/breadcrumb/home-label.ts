import { Component } from '@angular/core';
import type { WjMenuItem } from 'weeljack-ng';
import { WjBreadcrumb } from 'weeljack-ng/breadcrumb';

@Component({
  selector: 'docs-breadcrumb-home-label-example',
  imports: [WjBreadcrumb],
  template: `<wj-breadcrumb [home]="home" [model]="items" />`,
})
export class BreadcrumbHomeLabelExample {
  /** A `label` shows beside the glyph and names the link, so no `homeAriaLabel` is needed. */
  protected readonly home: WjMenuItem = { label: 'Home', url: '/' };

  protected readonly items: WjMenuItem[] = [
    { label: 'Menu', url: '/components/menu' },
    { label: 'Breadcrumb' },
  ];
}
