import { Component, inject } from '@angular/core';
import { WjButton } from 'weeljack-ng/button';
import { wjAura } from 'weeljack-ng/preset-aura';
import { WjTheme } from 'weeljack-ng/theme';

@Component({
  selector: 'docs-preset-switcher',
  imports: [WjButton],
  template: `
    <wj-button label="Aura" (click)="theme.setPreset(wjAura)" />
    <wj-button
      label="Default preset"
      severity="secondary"
      variant="text"
      (click)="theme.setPreset()"
    />
  `,
})
export class PresetSwitcher {
  protected readonly theme = inject(WjTheme);
  protected readonly wjAura = wjAura;
}
