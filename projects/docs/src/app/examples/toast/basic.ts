import { Component, inject } from '@angular/core';
import { WjButton } from 'weeljack-ng/button';
import { WjToast, WjToastService } from 'weeljack-ng/toast';

@Component({
  selector: 'docs-toast-basic-example',
  imports: [WjButton, WjToast],
  template: `
    <div class="row">
      <wj-button label="Success" (click)="success()" />
      <wj-button label="Info" (click)="info()" />
      <wj-button label="Warn" (click)="warn()" />
      <wj-button label="Error" (click)="error()" />
      <wj-button label="Clear" variant="text" (click)="clear()" />
    </div>
    <wj-toast />
  `,
  styles: `
    .row {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
  `,
})
export class ToastBasicExample {
  private readonly toast = inject(WjToastService);

  success(): void {
    this.toast.show({ severity: 'success', summary: 'Saved', detail: 'Your changes are saved.' });
  }

  info(): void {
    this.toast.show({ severity: 'info', summary: 'Update ready', detail: 'Reload to get it.' });
  }

  warn(): void {
    this.toast.show({ severity: 'warn', summary: 'Two fields are empty', detail: 'Fill them in.' });
  }

  error(): void {
    this.toast.show({
      severity: 'error',
      summary: 'Could not save',
      detail: 'Check your connection and try again.',
      life: 6000,
    });
  }

  clear(): void {
    this.toast.clear();
  }
}
