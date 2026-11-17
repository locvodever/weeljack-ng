import { Component } from '@angular/core';
import { WjMegaMenu, type WjMegaMenuItem } from 'weeljack-ng/megamenu';

@Component({
  selector: 'docs-megamenu-horizontal-example',
  imports: [WjMegaMenu],
  template: `<wj-megamenu [model]="items" ariaLabel="Documentation" />`,
})
export class MegamenuHorizontalExample {
  /**
   * A root item with `items` opens a panel. `items` is a list of columns, each column a list of
   * groups, and each group is a menu item whose `label` is its header and whose `items` are its
   * entries. `routerLink` takes the same array as Angular's `routerLink` directive.
   */
  protected readonly items: WjMegaMenuItem[] = [
    { label: 'Home', routerLink: '/' },
    {
      label: 'Components',
      items: [
        [
          {
            label: 'Form',
            items: [
              { label: 'Button', routerLink: ['/components', 'button'] },
              { label: 'Input text', routerLink: ['/components', 'inputtext'] },
              { label: 'Select', routerLink: ['/components', 'select'] },
              { label: 'Checkbox', routerLink: ['/components', 'checkbox'] },
            ],
          },
        ],
        [
          {
            label: 'Data',
            items: [
              { label: 'Table', routerLink: ['/components', 'table'] },
              { label: 'Paginator', routerLink: ['/components', 'paginator'] },
              { label: 'Data view', routerLink: ['/components', 'dataview'] },
            ],
          },
        ],
        [
          {
            label: 'Menus',
            items: [
              { label: 'Menu', routerLink: ['/components', 'menu'] },
              { label: 'Menubar', routerLink: ['/components', 'menubar'] },
              { label: 'Mega menu', routerLink: ['/components', 'megamenu'] },
              { label: 'Panel menu', routerLink: ['/components', 'panelmenu'] },
            ],
          },
        ],
      ],
    },
    {
      label: 'Overlays',
      items: [
        [
          {
            label: 'Overlays',
            items: [
              { label: 'Dialog', routerLink: ['/components', 'dialog'] },
              { label: 'Drawer', routerLink: ['/components', 'drawer'] },
              { label: 'Sheet', routerLink: ['/components', 'sheet'] },
              { label: 'Toast', routerLink: ['/components', 'toast'] },
            ],
          },
        ],
      ],
    },
  ];
}
