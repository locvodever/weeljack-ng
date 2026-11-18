import { Component } from '@angular/core';
import type { WjMenuItem } from 'weeljack-ng';
import { WjBreadcrumb } from 'weeljack-ng/breadcrumb';

@Component({
  selector: 'docs-breadcrumb-basic-example',
  imports: [WjBreadcrumb],
  template: `<wj-breadcrumb [home]="home" [model]="items" />`,
})
export class BreadcrumbBasicExample {
  /** With no `label` the home link is a house glyph, named "Home". */
  protected readonly home: WjMenuItem = { url: '/' };

  /** The last item is the current page: it has no link. */
  protected readonly items: WjMenuItem[] = [
    { label: 'Menu', url: '/components/menu' },
    { label: 'Breadcrumb' },
  ];
}
