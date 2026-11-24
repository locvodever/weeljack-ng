import { Component } from '@angular/core';
import { WjButton } from 'weeljack-ng/button';
import {
  WjMegaMenu,
  WjMegaMenuEndSlot,
  WjMegaMenuStartSlot,
  type WjMegaMenuItem,
} from 'weeljack-ng/megamenu';

@Component({
  selector: 'docs-megamenu-slots-example',
  imports: [WjMegaMenu, WjMegaMenuStartSlot, WjMegaMenuEndSlot, WjButton],
  template: `
    <wj-megamenu [model]="items" ariaLabel="Documentation">
      <ng-template wjMegaMenuStart><span class="brand">Acme</span></ng-template>
      <ng-template wjMegaMenuEnd>
        <wj-button label="Sign in" size="small" severity="secondary" variant="outlined" />
      </ng-template>
    </wj-megamenu>
  `,
  styles: `
    .brand {
      font-weight: 600;
    }
  `,
})
export class MegamenuSlotsExample {
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
              { label: 'Select', routerLink: ['/components', 'select'] },
            ],
          },
        ],
        [
          {
            label: 'Menus',
            items: [
              { label: 'Menu', routerLink: ['/components', 'menu'] },
              { label: 'Menubar', routerLink: ['/components', 'menubar'] },
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
            ],
          },
        ],
      ],
    },
  ];
}
