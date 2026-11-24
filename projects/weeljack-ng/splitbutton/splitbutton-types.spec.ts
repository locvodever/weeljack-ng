import type { SplitButton, SplitButtonPassThrough } from '@openng/optimus-ui/splitbutton';
import type {
  WjSplitButtonPt,
  WjSplitButtonSeverity,
  WjSplitButtonSize,
} from 'weeljack-ng/splitbutton';

/**
 * The seam's type-level spec (09 Q3, Q5): every input-direction `Wj*` type stays a subset of the
 * Optimus type it feeds. The checks run in `typecheck` (`ngc` over the spec project); a drift in
 * Optimus's types turns this file red there. The runtime assertion only keeps the file a spec.
 */
describe('WjSplitButton types', () => {
  it('keeps WjSplitButtonPt equal to Optimus’s pass-through', () => {
    expectTypeOf<WjSplitButtonPt>().toEqualTypeOf<SplitButtonPassThrough>();
    expect(true).toBe(true);
  });

  it('keeps severity and size a subset of what Optimus takes', () => {
    expectTypeOf<WjSplitButtonSeverity>().toExtend<SplitButton['severity']>();
    expectTypeOf<WjSplitButtonSize>().toExtend<SplitButton['size']>();

    const size: SplitButton['size'] = 'small' satisfies WjSplitButtonSize;
    expect(size).toBe('small');
  });
});
