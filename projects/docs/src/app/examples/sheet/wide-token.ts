import { Injectable, inject, signal, type Provider } from '@angular/core';
import { WJ_SHEET_WIDE } from 'weeljack-ng/sheet';

/** Your app's own breakpoint signal: whatever decides "wide" for the rest of your layout. */
@Injectable({ providedIn: 'root' })
export class BreakpointService {
  readonly wide = signal(true);
}

/**
 * In the application config: every `wj-sheet` follows your breakpoint, not the default
 * `(min-width: 768px)`. Set it once; there is no per-sheet input.
 */
export const appProviders: Provider[] = [
  { provide: WJ_SHEET_WIDE, useFactory: () => inject(BreakpointService).wide },
];

/**
 * In a spec: pin the mode. `signal(false)` is drawer mode, `signal(true)` is dialog mode, and the
 * signal can be set while a sheet is open to see the mode change.
 */
export const specProviders: Provider[] = [{ provide: WJ_SHEET_WIDE, useValue: signal(false) }];
