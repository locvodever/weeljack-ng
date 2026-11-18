import { Component, signal } from '@angular/core';
import type { WjMenuItem, WjMenuItemCommandEvent } from 'weeljack-ng';
import { WjSplitButton } from 'weeljack-ng/splitbutton';

@Component({
  selector: 'docs-splitbutton-nested-example',
  imports: [WjSplitButton],
  template: `
    <div class="column">
      <wj-splitbutton label="Export" [model]="items" (buttonClick)="report('PDF')" />
      <p class="status" role="status">{{ status() }}</p>
    </div>
  `,
  styles: `
    .status {
      margin: 8px 0 0;
      font-size: 0.875rem;
      color: var(--wj-text-muted-color);
    }
  `,
})
export class SplitButtonNestedExample {
  protected readonly status = signal('No action yet');

  protected report(action: string): void {
    this.status.set(`Last action: ${action}`);
  }

  private readonly run = (event: WjMenuItemCommandEvent): void => {
    this.report(event.item.label ?? '');
  };

  /** An item with `items` opens them as a submenu; only the leaves run commands. */
  protected readonly items: WjMenuItem[] = [
    { label: 'PDF', command: this.run },
    {
      label: 'Image',
      items: [
        { label: 'PNG', command: this.run },
        { label: 'JPEG', command: this.run },
        { label: 'SVG', command: this.run },
      ],
    },
    {
      label: 'Data',
      items: [
        { label: 'CSV', command: this.run },
        { label: 'JSON', command: this.run },
      ],
    },
  ];
}
