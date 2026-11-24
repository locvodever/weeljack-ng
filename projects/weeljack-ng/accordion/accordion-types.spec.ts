import type {
  Accordion,
  AccordionContentPassThrough,
  AccordionHeaderPassThrough,
  AccordionPanel,
  AccordionPanelPassThrough,
  AccordionPassThrough,
} from '@openng/optimus-ui/accordion';
import type {
  WjAccordionContentPt,
  WjAccordionHeaderPt,
  WjAccordionPanelPt,
  WjAccordionPanelValue,
  WjAccordionPt,
  WjAccordionValue,
} from 'weeljack-ng/accordion';

/**
 * The seam's type-level spec (09 Q5): every input-direction `Wj*` type stays a subset of the
 * Optimus type it feeds, and every `Wj*Pt` is exactly the Optimus pass-through. The checks run in
 * `typecheck` (`ngc` over the spec project); a drift in Optimus's types turns this file red there.
 * The runtime assertion only keeps the file a spec.
 */
describe('WjAccordion types', () => {
  it('keeps each input-direction type assignable to the Optimus type it feeds', () => {
    expectTypeOf<WjAccordionValue>().toExtend<ReturnType<Accordion['value']>>();
    expectTypeOf<WjAccordionPanelValue>().toExtend<ReturnType<AccordionPanel['value']>>();
    expectTypeOf<WjAccordionPt>().toEqualTypeOf<AccordionPassThrough>();
    expectTypeOf<WjAccordionPanelPt>().toEqualTypeOf<AccordionPanelPassThrough>();
    expectTypeOf<WjAccordionHeaderPt>().toEqualTypeOf<AccordionHeaderPassThrough>();
    expectTypeOf<WjAccordionContentPt>().toEqualTypeOf<AccordionContentPassThrough>();

    const value: ReturnType<Accordion['value']> = ['a', 'b'] satisfies WjAccordionValue;
    expect(value).toEqual(['a', 'b']);
  });

  it('keeps an array of values assignable, which (string | number)[] would not be', () => {
    expectTypeOf<(string | number)[]>().not.toExtend<WjAccordionValue>();
    expectTypeOf<string[]>().toExtend<WjAccordionValue>();
    expectTypeOf<number[]>().toExtend<WjAccordionValue>();
    expect(true).toBe(true);
  });
});
