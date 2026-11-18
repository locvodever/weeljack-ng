import type { Step, StepPanel, Stepper } from '@openng/optimus-ui/stepper';
import type {
  StepListPassThrough,
  StepPanelPassThrough,
  StepPanelsPassThrough,
  StepPassThrough,
  StepperPassThrough,
} from '@openng/optimus-ui/types/stepper';
import type {
  WjStepListPt,
  WjStepPanelPt,
  WjStepPanelsPt,
  WjStepPt,
  WjStepperPt,
  WjStepperValue,
} from 'weeljack-ng/stepper';

/**
 * The seam's type-level spec (09 Q5): every input-direction `Wj*` type stays a subset of the
 * Optimus type it feeds, and every `Wj*Pt` is exactly the Optimus pass-through. The checks run in
 * `typecheck` (`ngc` over the spec project); a drift in Optimus's types turns this file red there.
 * The runtime assertion only keeps the file a spec.
 */
describe('WjStepper types', () => {
  it('keeps each input-direction type assignable to the Optimus type it feeds', () => {
    expectTypeOf<WjStepperValue>().toExtend<ReturnType<Stepper['value']>>();
    expectTypeOf<WjStepperValue>().toExtend<ReturnType<Step['value']>>();
    expectTypeOf<WjStepperValue>().toExtend<ReturnType<StepPanel['value']>>();
    expectTypeOf<WjStepperPt>().toEqualTypeOf<StepperPassThrough>();
    expectTypeOf<WjStepListPt>().toEqualTypeOf<StepListPassThrough>();
    expectTypeOf<WjStepPt>().toEqualTypeOf<StepPassThrough>();
    expectTypeOf<WjStepPanelsPt>().toEqualTypeOf<StepPanelsPassThrough>();
    expectTypeOf<WjStepPanelPt>().toEqualTypeOf<StepPanelPassThrough>();

    const value: ReturnType<Stepper['value']> = 1 satisfies WjStepperValue;
    expect(value).toBe(1);
  });
});
