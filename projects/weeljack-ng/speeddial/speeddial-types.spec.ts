import type { SpeedDial } from '@openng/optimus-ui/speeddial';
import type { SpeedDialPassThrough } from '@openng/optimus-ui/types/speeddial';
import type { WjMenuItem } from 'weeljack-ng';
import type {
  WjSpeedDialDirection,
  WjSpeedDialItemContext,
  WjSpeedDialPt,
  WjSpeedDialType,
} from 'weeljack-ng/speeddial';

/**
 * The seam's type-level spec (09 Q5): `WjSpeedDialPt` stays Optimus's pass-through type and the
 * direction and type stay inside what Optimus accepts. The checks run in `typecheck` (`ngc` over
 * the spec project); a drift in Optimus's types turns this file red there. The runtime assertion
 * only keeps the file a spec.
 */
describe('WjSpeedDial types', () => {
  it('keeps WjSpeedDialPt equal to Optimus’s SpeedDialPassThrough', () => {
    expectTypeOf<WjSpeedDialPt>().toEqualTypeOf<SpeedDialPassThrough>();
    expect(true).toBe(true);
  });

  it('keeps WjSpeedDialDirection inside what Optimus’s direction accepts', () => {
    expectTypeOf<WjSpeedDialDirection>().toExtend<NonNullable<SpeedDial['direction']>>();
    expectTypeOf<WjSpeedDialDirection>().toEqualTypeOf<
      'up' | 'down' | 'left' | 'right' | 'up-left' | 'up-right' | 'down-left' | 'down-right'
    >();
    expect(true).toBe(true);
  });

  it('keeps WjSpeedDialType inside what Optimus’s type accepts', () => {
    expectTypeOf<WjSpeedDialType>().toExtend<NonNullable<SpeedDial['type']>>();
    expectTypeOf<WjSpeedDialType>().toEqualTypeOf<
      'linear' | 'circle' | 'semi-circle' | 'quarter-circle'
    >();
    expect(true).toBe(true);
  });

  it('gives the item slot the app’s own item type', () => {
    expectTypeOf<WjSpeedDialItemContext['$implicit']>().toEqualTypeOf<WjMenuItem>();
    expect(true).toBe(true);
  });
});
