import { Injectable, inject } from '@angular/core';

/** The per-application counter behind `_wjId`: a fresh one per root injector, so per SSR request. */
@Injectable({ providedIn: 'root' })
class IdCounter {
  private next = 0;

  take(): number {
    return this.next++;
  }
}

/**
 * A unique element id, `wj-<prefix>-<n>`, for ARIA references between a wrapper's own parts. The
 * counter is per application (one root injector), so it is deterministic per render and two
 * server requests never share it. The CDK's `_IdGenerator` was not used: it keeps a module-level
 * counter and inserts an `a` infix, so its ids differ between requests and from this shape. Must
 * run in an injection context.
 *
 * @docs-private
 */
export function _wjId(prefix: string): string {
  return `wj-${prefix}-${String(inject(IdCounter).take())}`;
}
