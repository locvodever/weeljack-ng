import type { InplacePassThrough } from '@openng/optimus-ui/types/inplace';
import {
  WjInplaceContentSlot,
  WjInplaceDisplaySlot,
  type WjInplaceContentContext,
  type WjInplacePt,
} from 'weeljack-ng/inplace';

/**
 * The seam's type-level spec (09 Q5): `WjInplacePt` is exactly the Optimus pass-through, so a
 * drift in Optimus's part names turns this file red in `typecheck` (`ngc` over the spec project).
 * The display slot takes no context: its guard narrows to `object`, which has no `$implicit` or
 * other key, so a stray `let-` variable fails under `strictTemplates`. The content slot's context
 * is `{ close }`, a type alias. The runtime assertions only keep the file a spec.
 */
describe('WjInplace types', () => {
  it('keeps WjInplacePt equal to the Optimus pass-through', () => {
    expectTypeOf<WjInplacePt>().toEqualTypeOf<InplacePassThrough>();

    const pt: WjInplacePt = {
      display: { 'data-probe': 'display' },
      pcButton: { root: () => ({ 'data-probe': 'close' }) },
    };
    expect(pt).toBeDefined();
  });

  it('types the content context as { close: () => void }', () => {
    expectTypeOf<WjInplaceContentContext>().toEqualTypeOf<{ close: () => void }>();
    expectTypeOf<WjInplaceContentContext['close']>().toEqualTypeOf<() => void>();

    const narrow = (directive: unknown, context: unknown): void => {
      if (
        directive instanceof WjInplaceContentSlot &&
        WjInplaceContentSlot.ngTemplateContextGuard(directive, context)
      ) {
        expectTypeOf(context).toEqualTypeOf<WjInplaceContentContext>();
      }
    };

    expect(narrow).toBeTypeOf('function');
    expect(typeof WjInplaceContentSlot.ngTemplateContextGuard).toBe('function');
  });

  it('narrows the display slot context to an object with no keys', () => {
    // A predicate's target is read by narrowing a value with it.
    type Empty = object;
    const narrow = (directive: unknown, context: unknown): void => {
      if (
        directive instanceof WjInplaceDisplaySlot &&
        WjInplaceDisplaySlot.ngTemplateContextGuard(directive, context)
      ) {
        expectTypeOf(context).toEqualTypeOf<Empty>();
      }
    };
    expectTypeOf<keyof Empty>().toEqualTypeOf<never>();

    expect(narrow).toBeTypeOf('function');
    expect(typeof WjInplaceDisplaySlot.ngTemplateContextGuard).toBe('function');
  });
});
