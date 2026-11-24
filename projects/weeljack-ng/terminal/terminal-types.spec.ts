import type { TerminalPassThrough } from '@openng/optimus-ui/types/terminal';
import type { WjTerminalPt } from 'weeljack-ng/terminal';

/**
 * The seam's type-level spec (09 Q5): every `Wj*` type stays tied to the Optimus type it feeds. The
 * checks run in `typecheck`; a drift in Optimus's types turns this file red there. The runtime
 * assertion only keeps the file a spec.
 */
describe('WjTerminal types', () => {
  it('keeps WjTerminalPt equal to the Optimus pass-through', () => {
    expectTypeOf<WjTerminalPt>().toEqualTypeOf<TerminalPassThrough>();
    const pt: TerminalPassThrough = { promptValue: { 'data-x': 'y' } } satisfies WjTerminalPt;
    expect(pt).toBeTruthy();
  });
});
