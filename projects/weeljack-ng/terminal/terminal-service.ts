import { Injectable, InjectionToken, Injector, inject, runInInjectionContext } from '@angular/core';
import { TerminalService } from '@openng/optimus-ui/terminal';
import { _warnOnce } from 'weeljack-ng/private';

/**
 * The one Optimus `TerminalService` of an application (W1-display 4.4, FR-37). Optimus declares it
 * `@Injectable()` with no `providedIn`, so an internal root token creates it: one per application
 * injector, which on the server means one per request. Internal: not exported from `public-api.ts`.
 *
 * @docs-private
 */
export const WJ_TERMINAL = new InjectionToken<TerminalService>('WJ_TERMINAL', {
  providedIn: 'root',
  factory: () => new TerminalService(),
});

/**
 * What `respond()` and the hosts must agree on (FR-40): whether a command is waiting for its
 * response, and how many `wj-terminal` hosts are live. Internal, and per application like the token
 * above.
 *
 * @docs-private
 */
export const WJ_TERMINAL_STATE = new InjectionToken<{ waiting: boolean; hosts: number }>(
  'WJ_TERMINAL_STATE',
  { providedIn: 'root', factory: () => ({ waiting: false, hosts: 0 }) },
);

/**
 * Answers the command a reader entered in the application's `wj-terminal`. Root-provided: inject
 * it anywhere, provide nothing. This follows the root-provided `Wj*` service pattern (W1-display
 * 4.4, see `WjToastService`): it injects an internal root token that holds the Optimus service,
 * never exposes that instance, and `wj-terminal` maps Optimus's service class to the same token in
 * its own `providers`. Render one `wj-terminal` at a time: every one shares this service.
 *
 * In a spec, replace the service with `vi.spyOn(TestBed.inject(WjTerminalService), 'respond')`.
 */
@Injectable({ providedIn: 'root' })
export class WjTerminalService {
  private readonly terminal = inject(WJ_TERMINAL);
  private readonly state = inject(WJ_TERMINAL_STATE);
  private readonly injector = inject(Injector);

  /**
   * Answers the latest command, replacing its response, and announces the text politely once. Call
   * it from `commandEntered`, synchronously or after an `await`. Dropped, with a dev-mode warning
   * (`WJ0180`), when no command has been entered yet. An empty string is ignored. Renders as text.
   */
  respond(text: string): void {
    if (!text) {
      return;
    }
    if (this.state.waiting) {
      this.terminal.sendResponse(text);
    } else {
      // `respond()` runs anywhere, an `await` included, and `_warnOnce` needs an injection context.
      runInInjectionContext(this.injector, () => {
        _warnOnce(
          'WJ0180',
          'wj-terminal',
          'respond() was called with no command waiting for a response, so it was dropped',
          'Call respond() after the reader enters a command (commandEntered)',
        );
      });
    }
  }
}
