import type { Confirmation } from '@openng/optimus-ui/api';
import type { WjConfirmation } from 'weeljack-ng';

/**
 * The seam's type-level spec (09 Q5): `WjConfirmation` stays a structural subset of Optimus's
 * `Confirmation`, so what it names can be handed on. The checks run in `typecheck`; a drift in
 * Optimus's types turns this file red there. The runtime assertion only keeps the file a spec.
 */
describe('WjConfirmation types', () => {
  it('stays assignable to the Optimus type it feeds', () => {
    expectTypeOf<WjConfirmation>().toExtend<Confirmation>();
    const confirmation: Confirmation = {
      message: 'Delete?',
      accept: () => undefined,
    } satisfies WjConfirmation;
    expect(confirmation.message).toBe('Delete?');
  });

  it('narrows the callbacks to no arguments and no result', () => {
    expectTypeOf<WjConfirmation['accept']>().toEqualTypeOf<(() => void) | undefined>();
    expectTypeOf<WjConfirmation['reject']>().toEqualTypeOf<(() => void) | undefined>();
    expectTypeOf<WjConfirmation['message']>().toEqualTypeOf<string>();
  });
});
