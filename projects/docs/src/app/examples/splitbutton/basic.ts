import { Component, signal } from '@angular/core';
import type { WjMenuItem, WjMenuItemCommandEvent } from 'weeljack-ng';
import { WjSplitButton } from 'weeljack-ng/splitbutton';

@Component({
  selector: 'docs-splitbutton-basic-example',
  imports: [WjSplitButton],
  template: `
    <div class="column">
      <wj-splitbutton label="Save" [model]="items" (buttonClick)="report('Save')" />
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
export class SplitButtonBasicExample {
  protected readonly status = signal('No action yet');

  protected report(action: string): void {
    this.status.set(`Last action: ${action}`);
  }

  /** `event.item` is your own item, the same reference as in `items`. */
  private readonly run = (event: WjMenuItemCommandEvent): void => {
    this.report(event.item.label ?? '');
  };

  protected readonly items: WjMenuItem[] = [
    { label: 'Save as draft', command: this.run },
    { label: 'Save and close', command: this.run },
    { separator: true },
    { label: 'Save as template…', command: this.run },
  ];
}
