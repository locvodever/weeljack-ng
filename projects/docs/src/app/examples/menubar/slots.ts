import { Component } from '@angular/core';
import type { WjMenuItem } from 'weeljack-ng';
import { WjButton } from 'weeljack-ng/button';
import { WjMenubar, WjMenubarEndSlot, WjMenubarStartSlot } from 'weeljack-ng/menubar';

@Component({
  selector: 'docs-menubar-slots-example',
  imports: [WjMenubar, WjMenubarStartSlot, WjMenubarEndSlot, WjButton],
  template: `
    <wj-menubar [model]="items" ariaLabel="Editor">
      <ng-template wjMenubarStart><span class="brand">Acme</span></ng-template>
      <ng-template wjMenubarEnd>
        <wj-button label="Sign in" size="small" severity="secondary" variant="outlined" />
      </ng-template>
    </wj-menubar>
  `,
  styles: `
    .brand {
      font-weight: 600;
    }
  `,
})
export class MenubarSlotsExample {
  protected readonly items: WjMenuItem[] = [
    {
      label: 'File',
      items: [{ label: 'New' }, { label: 'Open…' }, { label: 'Save' }],
    },
    {
      label: 'Edit',
      items: [
        { label: 'Undo' },
        { label: 'Redo' },
        { separator: true },
        { label: 'Cut' },
        { label: 'Copy' },
        { label: 'Paste' },
      ],
    },
    { label: 'View', items: [{ label: 'Zoom in' }, { label: 'Zoom out' }] },
    { label: 'Help', items: [{ label: 'About' }] },
  ];
}
