import { DestroyRef, InjectionToken, inject } from '@angular/core';
import { ConfirmationService } from '@openng/optimus-ui/api';
import { _warnOnce } from './dev-warnings';

/**
 * The one Optimus `ConfirmationService` of an application (W1-display 4.4, FR-19). Optimus
 * declares it `@Injectable()` with no `providedIn`, so a root token creates it: one per
 * application injector, which on the server means one per request. `WjConfirmationService`
 * writes to it, and `wj-confirmdialog` and `wj-confirmpopup` map Optimus's service class onto it
 * in their `providers`.
 *
 * @docs-private
 */
export const _WJ_CONFIRMATIONS = new InjectionToken<ConfirmationService>('WJ_CONFIRMATIONS', {
  providedIn: 'root',
  factory: () => new ConfirmationService(),
});

/**
 * The routing key of the confirm dialog. Optimus opens a confirmation only in the host whose `key`
 * matches, so a confirmation without a `target` opens here and never in the popup.
 *
 * @docs-private
 */
export const _CONFIRM_DIALOG_KEY = 'wj-confirmdialog';

/**
 * The routing key of the confirm popup: a confirmation with a `target` opens there only.
 *
 * @docs-private
 */
export const _CONFIRM_POPUP_KEY = 'wj-confirmpopup';

/** A second host of one kind is rendered, so each confirmation would open twice. */
const WJ0151 = 'WJ0151';

/** Hosts rendered per routing key, per service instance, so per application and per request. */
const hosts = new WeakMap<ConfirmationService, Map<string, number>>();

/**
 * How many hosts of the kind `key` names are rendered in the application that owns `service`.
 *
 * @docs-private
 */
export function _confirmationHosts(service: ConfirmationService, key: string): number {
  return hosts.get(service)?.get(key) ?? 0;
}

/**
 * A confirm host calls this from its constructor: it counts itself under `key` until destroyed,
 * and warns (`WJ0151`) when it is the second of its kind. Must run in an injection context.
 *
 * @docs-private
 */
export function _registerConfirmationHost(key: string, selector: string): void {
  const service = inject(_WJ_CONFIRMATIONS);
  const counts = hosts.get(service) ?? new Map<string, number>();
  hosts.set(service, counts);
  const count = _confirmationHosts(service, key) + 1;
  counts.set(key, count);
  inject(DestroyRef).onDestroy(() => {
    counts.set(key, _confirmationHosts(service, key) - 1);
  });
  if (count > 1) {
    _warnOnce(
      WJ0151,
      selector,
      `a second ${selector} is rendered, and every one opens each confirmation`,
      `Render one ${selector} at a time`,
    );
  }
}
