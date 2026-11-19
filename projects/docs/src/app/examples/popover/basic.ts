import { Component, computed, signal } from '@angular/core';
import { WjButton, type WjButtonPt } from 'weeljack-ng/button';
import { WjPopover } from 'weeljack-ng/popover';

@Component({
  selector: 'docs-popover-basic-example',
  imports: [WjButton, WjPopover],
  template: `
    <div class="row">
      <wj-button
        label="Shipping details"
        severity="secondary"
        variant="outlined"
        [pt]="triggerPt()"
        (click)="popover.toggle($event)"
      />
    </div>
    <wj-popover
      #popover
      ariaLabel="Shipping details"
      (opened)="open.set(true)"
      (closed)="open.set(false)"
    >
      <p class="details">
        Orders placed before 2 pm ship the same day. Delivery takes two to four working days.
      </p>
    </wj-popover>
  `,
  styles: `
    .row {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .details {
      margin: 0;
      max-inline-size: min(20rem, 100vw - 4rem);
    }
  `,
})
export class PopoverBasicExample {
  protected readonly open = signal(false);

  /** `wj-button` has no ARIA inputs for a popup trigger yet: set them on its button through `pt`. */
  protected readonly triggerPt = computed<WjButtonPt>(() => ({
    root: { 'aria-haspopup': 'dialog', 'aria-expanded': String(this.open()) },
  }));
}
