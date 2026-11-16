import { Injectable, inject } from '@angular/core';
import { WjToastService } from 'weeljack-ng/toast';

/**
 * An app's own service with named methods over `WjToastService`: the app's wording and `life` live
 * here, and every caller stays one line. Say what happened in the `summary`, in words.
 */
@Injectable({ providedIn: 'root' })
export class AppToastService {
  private readonly toast = inject(WjToastService);

  error(detail: string): void {
    this.toast.show({ severity: 'error', summary: 'Something went wrong', detail, life: 6000 });
  }

  info(detail: string): void {
    this.toast.show({ severity: 'info', summary: 'For your information', detail, life: 6000 });
  }

  success(detail: string): void {
    this.toast.show({ severity: 'success', summary: 'Done', detail, life: 6000 });
  }
}
