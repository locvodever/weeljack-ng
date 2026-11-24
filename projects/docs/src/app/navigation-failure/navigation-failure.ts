import { Injectable, signal } from '@angular/core';

/**
 * The URL of the last navigation that failed (a lazy chunk or a resolver rejected), or `null`.
 * `withNavigationErrorHandler` sets it, the shell's banner reads it, and the next successful
 * navigation clears it.
 */
@Injectable({ providedIn: 'root' })
export class NavigationFailure {
  readonly url = signal<string | null>(null);
}
