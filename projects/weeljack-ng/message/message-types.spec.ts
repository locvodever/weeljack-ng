import type { Message } from '@openng/optimus-ui/message';
import type { MessagePassThrough } from '@openng/optimus-ui/types/message';
import type {
  WjMessagePt,
  WjMessageSeverity,
  WjMessageSize,
  WjMessageVariant,
} from 'weeljack-ng/message';

/**
 * The seam's type-level spec (09 Q5): every input-direction `Wj*` type stays a subset of the
 * Optimus type it feeds. The checks run in `typecheck` (`ngc` over the spec project); a drift in
 * Optimus's types turns this file red there. The runtime assertion only keeps the file a spec.
 */
describe('WjMessage types', () => {
  it('keeps each input-direction type assignable to the Optimus type it feeds', () => {
    expectTypeOf<WjMessageSeverity>().toExtend<NonNullable<Message['severity']>>();
    expectTypeOf<WjMessageSize>().toExtend<NonNullable<Message['size']>>();
    expectTypeOf<WjMessageVariant>().toExtend<NonNullable<Message['variant']>>();
    expectTypeOf<WjMessagePt>().toEqualTypeOf<MessagePassThrough>();

    const variant: Message['variant'] = 'simple' satisfies WjMessageVariant;
    expect(variant).toBe('simple');
  });
});
