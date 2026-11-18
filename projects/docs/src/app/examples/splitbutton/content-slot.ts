import { Component, signal } from '@angular/core';
import type { WjMenuItem } from 'weeljack-ng';
import { WjSplitButton, WjSplitButtonContentSlot } from 'weeljack-ng/splitbutton';

@Component({
  selector: 'docs-splitbutton-content-slot-example',
  imports: [WjSplitButton, WjSplitButtonContentSlot],
  template: `
    <div class="column">
      <wj-splitbutton label="Save" [model]="items" (buttonClick)="status.set('Last action: Save')">
        <ng-template wjSplitButtonContent>
          <svg
            aria-hidden="true"
            focusable="false"
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
          >
            <path d="M2.5 2.5h9l2 2v9h-11zM5 2.5v4h5v-4M5 13.5v-4h6v4" />
          </svg>
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
  protected readonly status = signal('No action yet');
  protected readonly items: WjMenuItem[] = [
    { label: 'Save as draft' },
    { label: 'Save and close' },
  ];
}
