import type { InputSignal, TemplateRef } from '@angular/core';
import type { ImageComparePassThrough } from '@openng/optimus-ui/types/imagecompare';
import {
  WjImageCompare,
  WjImageCompareLeftSlot,
  WjImageCompareRightSlot,
  type WjImageComparePt,
} from 'weeljack-ng/imagecompare';

/**
 * The seam's type-level spec (09 Q5): `WjImageComparePt` is exactly the Optimus pass-through, so a
 * drift in Optimus's part names turns this file red in `typecheck` (`ngc` over the spec project).
 * The runtime assertions only keep the file a spec.
 */
describe('WjImageCompare types', () => {
  it('keeps WjImageComparePt equal to the Optimus pass-through', () => {
    expectTypeOf<WjImageComparePt>().toEqualTypeOf<ImageComparePassThrough>();

    const pt: WjImageComparePt = { slider: { 'data-probe': 'slider' } };
    expect(pt).toBeDefined();
  });

  // `input.required` has no distinct type: a template that omits `ariaLabel` fails the
  // `strictTemplates` build (NG8008), which every host fixture here and in the docs examples
  // compiles. This spec pins what the signals read as.
  it('reads ariaLabel as a string, and the optional ARIA ids as string or undefined', () => {
    expectTypeOf<WjImageCompare['ariaLabel']>().toEqualTypeOf<InputSignal<string>>();
    expectTypeOf<WjImageCompare['ariaLabelledBy']>().toEqualTypeOf<
      InputSignal<string | undefined>
    >();
    expectTypeOf<WjImageCompare['ariaDescribedBy']>().toEqualTypeOf<
      InputSignal<string | undefined>
    >();
    expect(typeof WjImageCompare).toBe('function');
  });

  // A `let-` on either slot fails the template type-check, because the guard narrows the context
  // to `void`: there is nothing to read. The guard's narrowed type is what that failure rests on.
  it('narrows the context of both slots to void, so a let- on a slot fails type-check', () => {
    // The predicate is on the second parameter, which `expectTypeOf(...).guards` cannot read.
    const narrowLeft = (slot: WjImageCompareLeftSlot, context: unknown): void => {
      if (WjImageCompareLeftSlot.ngTemplateContextGuard(slot, context)) {
        expectTypeOf(context).toBeVoid();
      }
    };
    const narrowRight = (slot: WjImageCompareRightSlot, context: unknown): void => {
      if (WjImageCompareRightSlot.ngTemplateContextGuard(slot, context)) {
        expectTypeOf(context).toBeVoid();
      }
    };
    expect([narrowLeft, narrowRight]).toHaveLength(2);
    expectTypeOf<WjImageCompareLeftSlot['template']>().toEqualTypeOf<TemplateRef<void>>();
    expectTypeOf<WjImageCompareRightSlot['template']>().toEqualTypeOf<TemplateRef<void>>();
    expect(WjImageCompareLeftSlot).toHaveProperty('ngTemplateContextGuard');
  });
});
