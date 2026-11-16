import type { ToastMessageOptions } from '@openng/optimus-ui/api';
import type { Toast } from '@openng/optimus-ui/toast';
import type { ToastPassThrough, ToastPositionType } from '@openng/optimus-ui/types/toast';
import type {
  WjToastMessage,
  WjToastPosition,
  WjToastPt,
  WjToastSeverity,
} from 'weeljack-ng/toast';

/**
 * The seam's type-level spec (09 Q5): every input-direction `Wj*` type stays a subset of the
 * Optimus type it feeds. The checks run in `typecheck` (`ngc` over the spec project); a drift in
 * Optimus's types turns this file red there. The runtime assertion only keeps the file a spec.
 */
describe('WjToast types', () => {
  it('keeps each input-direction type assignable to the Optimus type it feeds', () => {
    expectTypeOf<WjToastMessage>().toExtend<ToastMessageOptions>();
    expectTypeOf<WjToastSeverity>().toExtend<NonNullable<ToastMessageOptions['severity']>>();
    expectTypeOf<WjToastPosition>().toEqualTypeOf<ToastPositionType>();
    expectTypeOf<WjToastPosition>().toEqualTypeOf<Toast['position']>();
    expectTypeOf<WjToastPt>().toEqualTypeOf<ToastPassThrough>();
    const message: ToastMessageOptions = {
      severity: 'warn',
      summary: 'a',
    } satisfies WjToastMessage;
    expect(message.severity).toBe('warn');
  });
});
