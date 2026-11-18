import { Component } from '@angular/core';
import type { WjMenuItem } from 'weeljack-ng';
import { WjMenubar } from 'weeljack-ng/menubar';

@Component({
  selector: 'docs-menubar-router-links-example',
  imports: [WjMenubar],
  template: `<wj-menubar [model]="items" ariaLabel="Documentation" />`,
})
export class MenubarRouterLinksExample {
  /** `routerLink` takes the same array as Angular's `routerLink` directive. */
  protected readonly items: WjMenuItem[] = [
    { label: 'Home', routerLink: '/' },
    {
      label: 'Components',
      items: [
        { label: 'Button', routerLink: ['/components', 'button'] },
        { label: 'Menu', routerLink: ['/components', 'menu'] },
        { label: 'Menubar', routerLink: ['/components', 'menubar'] },
        { label: 'Table', routerLink: ['/components', 'table'] },
      ],
    },
  ];
}
