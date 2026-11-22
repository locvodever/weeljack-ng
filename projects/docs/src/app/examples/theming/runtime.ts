import { Component, inject } from '@angular/core';
import { WjButton } from 'weeljack-ng/button';
import { WjTheme } from 'weeljack-ng/theme';

@Component({
  selector: 'docs-brand-switcher',
  imports: [WjButton],
  template: `
    <wj-button label="Teal" (click)="theme.setPrimary('#0f766e')" />
    <wj-button label="Slate surface" variant="outlined" (click)="theme.setSurface('{slate}')" />
    <wj-button label="Reset" severity="secondary" variant="text" (click)="theme.reset()" />
  `,
})
export class BrandSwitcher {
  protected readonly theme = inject(WjTheme);
}
