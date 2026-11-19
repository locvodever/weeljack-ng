import { Component, signal } from '@angular/core';
import { WjBlockUI } from 'weeljack-ng/blockui';
import { WjButton } from 'weeljack-ng/button';

@Component({
  selector: 'docs-blockui-page-example',
  imports: [WjBlockUI, WjButton],
  template: `
    <wj-button label="Save changes" (click)="save()" />
    <!-- With no target the whole page is blocked, and its scroll is locked. -->
    <wj-blockui [blocked]="saving()">
      <p class="message">Saving…</p>
    </wj-blockui>
  `,
  styles: `
    .message {
      margin: 0;
      padding: 8px 16px;
      background: var(--wj-content-background);
      border: 1px solid var(--wj-content-border-color);
      border-radius: 12px;
      color: var(--wj-text-color);
    }
  `,
})
export class BlockuiPageExample {
  protected readonly saving = signal(false);

  protected save(): void {
    if (this.saving()) {
      return;
    }
    this.saving.set(true);
    setTimeout(() => {
      this.saving.set(false);
    }, 1500);
  }
}
