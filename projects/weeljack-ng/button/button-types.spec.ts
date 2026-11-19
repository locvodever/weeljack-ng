import type { Button, ButtonPassThrough, ButtonSeverity } from '@openng/optimus-ui/button';
import type {
  WjButtonAriaHasPopup,
  WjButtonPt,
  WjButtonSeverity,
  WjButtonSize,
  WjButtonType,
  WjButtonVariant,
} from 'weeljack-ng/button';

/**
 * The seam's type-level spec (09 Q5): every input-direction `Wj*` type stays a subset of the
 * Optimus type it feeds. The checks run in `typecheck` (`ngc` over the spec project); a drift in
 * Optimus's types turns this file red there. The runtime assertion only keeps the file a spec.
 */
describe('WjButton types', () => {
  it('keeps each input-direction type assignable to the Optimus type it feeds', () => {
    expectTypeOf<WjButtonSize>().toExtend<NonNullable<Button['size']>>();
    expectTypeOf<WjButtonVariant>().toExtend<NonNullable<Button['variant']>>();
    expectTypeOf<WjButtonSeverity>().toExtend<NonNullable<ButtonSeverity>>();
    expectTypeOf<WjButtonType>().toExtend<Button['type']>();
    expectTypeOf<WjButtonPt>().toEqualTypeOf<ButtonPassThrough>();
    expectTypeOf<WjButtonAriaHasPopup>().toEqualTypeOf<
      'menu' | 'listbox' | 'tree' | 'grid' | 'dialog'
    >();

    const size: Button['size'] = 'small' satisfies WjButtonSize;
    expect(size).toBe('small');
  });
});
