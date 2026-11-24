import { Component } from '@angular/core';
import type { WjMenuItem } from 'weeljack-ng';
import { WjBreadcrumb } from 'weeljack-ng/breadcrumb';

@Component({
  selector: 'docs-breadcrumb-router-links-example',
  imports: [WjBreadcrumb],
  template: `<wj-breadcrumb [home]="home" [model]="items" />`,
})
export class BreadcrumbRouterLinksExample {
  /** `routerLink` takes the same path or commands array as Angular’s `routerLink` directive. */
  protected readonly home: WjMenuItem = { routerLink: '/' };

  protected readonly items: WjMenuItem[] = [
    { label: 'Menu', routerLink: ['/components', 'menu'] },
    { label: 'Breadcrumb' },
  ];
}
