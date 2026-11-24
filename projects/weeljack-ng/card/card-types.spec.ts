import type { CardPassThrough } from '@openng/optimus-ui/card';
import {
  WjCardFooterSlot,
  WjCardHeaderSlot,
  WjCardSubtitleSlot,
  WjCardTitleSlot,
  type WjCardPt,
} from 'weeljack-ng/card';

/**
 * The seam's type-level spec (09 Q5): `WjCardPt` is exactly the Optimus pass-through, so a drift in
 * Optimus's part names turns this file red in `typecheck` (`ngc` over the spec project). The four
 * slots take no context: each guard narrows the template context to `object`, which has no `$implicit` or other key, so a
 * stray `let-` variable fails under `strictTemplates`, and no `Wj<Slot>Context` type is exported.
 * The runtime assertions only keep the file a spec.
 */
describe('WjCard types', () => {
  it('keeps WjCardPt equal to the Optimus pass-through', () => {
    expectTypeOf<WjCardPt>().toEqualTypeOf<CardPassThrough>();

    const pt: WjCardPt = { root: { 'data-probe': 'root' }, footer: () => ({ 'data-probe': 'f' }) };
    expect(pt).toBeDefined();
  });

  it('narrows every slot context to an object with no keys', () => {
    // A predicate's target is read by narrowing a value with it.
    type Empty = object;
    const narrow = (directive: unknown, context: unknown): void => {
      if (directive instanceof WjCardHeaderSlot) {
        if (WjCardHeaderSlot.ngTemplateContextGuard(directive, context)) {
          expectTypeOf(context).toEqualTypeOf<Empty>();
        }
      } else if (directive instanceof WjCardTitleSlot) {
        if (WjCardTitleSlot.ngTemplateContextGuard(directive, context)) {
          expectTypeOf(context).toEqualTypeOf<Empty>();
        }
      } else if (directive instanceof WjCardSubtitleSlot) {
        if (WjCardSubtitleSlot.ngTemplateContextGuard(directive, context)) {
          expectTypeOf(context).toEqualTypeOf<Empty>();
        }
      } else if (directive instanceof WjCardFooterSlot) {
        if (WjCardFooterSlot.ngTemplateContextGuard(directive, context)) {
          expectTypeOf(context).toEqualTypeOf<Empty>();
        }
      }
    };
    expectTypeOf<keyof Empty>().toEqualTypeOf<never>();

    expect(narrow).toBeTypeOf('function');
    expect(typeof WjCardFooterSlot.ngTemplateContextGuard).toBe('function');
  });

  it('has no input on a slot: none is bound to a data source', () => {
    expectTypeOf<keyof WjCardHeaderSlot>().toEqualTypeOf<'template'>();
    expectTypeOf<keyof WjCardTitleSlot>().toEqualTypeOf<'template'>();
    expectTypeOf<keyof WjCardSubtitleSlot>().toEqualTypeOf<'template'>();
    expectTypeOf<keyof WjCardFooterSlot>().toEqualTypeOf<'template'>();

    expect(true).toBe(true);
  });
});
