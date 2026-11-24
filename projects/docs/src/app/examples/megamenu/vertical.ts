import { Component } from '@angular/core';
import { WjMegaMenu, type WjMegaMenuItem } from 'weeljack-ng/megamenu';

@Component({
  selector: 'docs-megamenu-vertical-example',
  imports: [WjMegaMenu],
  template: `
    <div class="column">
      <wj-megamenu [model]="items" orientation="vertical" ariaLabel="Documentation" />
    </div>
  `,
  styles: `
    .column {
      max-inline-size: 16rem;
    }
  `,
})
export class MegamenuVerticalExample {
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
