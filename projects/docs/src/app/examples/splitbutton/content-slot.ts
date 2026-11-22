import { Component, signal } from '@angular/core';
import type { WjMenuItem } from 'weeljack-ng';
import { WjIcon, wjIconSave } from 'weeljack-ng/icon';
import { WjSplitButton, WjSplitButtonContentSlot } from 'weeljack-ng/splitbutton';

@Component({
  selector: 'docs-splitbutton-content-slot-example',
  imports: [WjSplitButton, WjSplitButtonContentSlot, WjIcon],
  template: `
    <div class="column">
      <wj-splitbutton label="Save" [model]="items" (buttonClick)="status.set('Last action: Save')">
        <ng-template wjSplitButtonContent>
          <wj-icon [icon]="save" />
          <span>Save</span>
        </ng-template>
      </wj-splitbutton>
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
export class SplitButtonContentSlotExample {
  protected readonly save = wjIconSave;
  protected readonly status = signal('No action yet');
  protected readonly items: WjMenuItem[] = [
    { label: 'Save as draft' },
    { label: 'Save and close' },
  ];
}
