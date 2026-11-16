import { Injectable, InjectionToken, inject } from '@angular/core';
import { MessageService } from '@openng/optimus-ui/api';
import type { WjToastMessage } from './toast-types';

/**
 * The one Optimus `MessageService` of an application (W1-display 4.4, FR-21). Optimus declares it
 * `@Injectable()` with no `providedIn`, so an internal root token creates it: one per application
 * injector, which on the server means one per request. Internal: not exported from `public-api.ts`.
 *
 * @docs-private
 */
export const WJ_TOAST_MESSAGES = new InjectionToken<MessageService>('WJ_TOAST_MESSAGES', {
  providedIn: 'root',
  factory: () => new MessageService(),
});

/**
 * Shows messages in the application's `wj-toast`. Root-provided: inject it anywhere, provide
 * nothing. This is the root-provided `Wj*` service pattern (W1-display 4.4) that every
 * service-driven wrapper follows:
 *
 * - **Where it lives:** in its component's entry, beside the component and its `Wj*` types.
 * - **One Optimus instance:** it injects an internal root token that holds the Optimus service, and
 *   never exposes that instance or extends its class.
 * - **How the host connects:** `wj-toast` maps Optimus's service class to that same token in its own
 *   `providers`, so the Optimus toast it renders listens to what this service writes to. Render
 *   one `wj-toast` in your app shell; a message shown while none is rendered is not queued.
 * - **SSR:** no module-level state and no browser global, so each server request has its own
 *   instance.
 *
 * In a spec, replace the Optimus service spy with `vi.spyOn(TestBed.inject(WjToastService), 'show')`.
 */
@Injectable({ providedIn: 'root' })
export class WjToastService {
  private readonly messages = inject(WJ_TOAST_MESSAGES);

  /**
   * Shows a message in every rendered `wj-toast`. Only `severity`, `summary`, `detail` and `life`
   * are used: any other key of a wider object is dropped. `summary` and `detail` render as text.
   */
  show(message: WjToastMessage): void {
    const { severity, summary, detail, life } = message;
    // Optional keys are left out rather than set to `undefined` (`exactOptionalPropertyTypes`).
    this.messages.add({
      ...(severity === undefined ? {} : { severity }),
      ...(summary === undefined ? {} : { summary }),
      ...(detail === undefined ? {} : { detail }),
      ...(life === undefined ? {} : { life }),
    });
  }

  /** Closes every open message. */
  clear(): void {
    this.messages.clear();
  }
}
