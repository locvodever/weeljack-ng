import type { InputSignal, ModelSignal, TemplateRef } from '@angular/core';
import type { Carousel } from '@openng/optimus-ui/carousel';
import type {
  CarouselPassThrough,
  CarouselResponsiveOptions,
} from '@openng/optimus-ui/types/carousel';
import {
  WjCarousel,
  WjCarouselItemSlot,
  type WjCarouselItemContext,
  type WjCarouselPt,
  type WjCarouselResponsiveOption,
} from 'weeljack-ng/carousel';

interface Product {
  name: string;
}

/**
 * The seam's type-level spec (09 Q5): `WjCarouselPt` is exactly the Optimus pass-through and the
 * input-direction types stay a subset of what Optimus takes, so a drift in Optimus's types turns
 * this file red in `typecheck` (`ngc` over the spec project). The runtime assertions only keep the
 * file a spec.
 */
describe('WjCarousel types', () => {
  it('keeps WjCarouselPt equal to the Optimus pass-through', () => {
    expectTypeOf<WjCarouselPt>().toEqualTypeOf<CarouselPassThrough>();

    const pt: WjCarouselPt = { itemList: { 'data-probe': 'list' } };
    expect(pt).toBeDefined();
  });

  it('keeps the responsive option assignable to the Optimus type it feeds', () => {
    expectTypeOf<WjCarouselResponsiveOption>().toExtend<CarouselResponsiveOptions>();
    expectTypeOf<CarouselResponsiveOptions>().toExtend<WjCarouselResponsiveOption>();
    expectTypeOf<Carousel['responsiveOptions']>().toEqualTypeOf<
      CarouselResponsiveOptions[] | undefined
    >();

    const option: CarouselResponsiveOptions = {
      breakpoint: '1024px',
      numVisible: 2,
      numScroll: 2,
    } satisfies WjCarouselResponsiveOption;
    expect(option.numVisible).toBe(2);
  });

  // `input.required` has no distinct type: a template that omits `ariaLabel` fails the
  // `strictTemplates` build (NG8008), which every host fixture here and in the docs examples
  // compiles. This spec pins what the signals read as.
  it('reads the inputs, the page model and the item type as the API says', () => {
    expectTypeOf<WjCarousel['ariaLabel']>().toEqualTypeOf<InputSignal<string>>();
    expectTypeOf<WjCarousel['ariaLabelledBy']>().toEqualTypeOf<InputSignal<string | undefined>>();
    expectTypeOf<WjCarousel['page']>().toEqualTypeOf<ModelSignal<number>>();
    expectTypeOf<WjCarousel['numVisible']>().toEqualTypeOf<InputSignal<number>>();
    expectTypeOf<WjCarousel['numScroll']>().toEqualTypeOf<InputSignal<number>>();
    expectTypeOf<WjCarousel<Product>['value']>().toEqualTypeOf<InputSignal<Product[]>>();
    expectTypeOf<WjCarousel['responsiveOptions']>().toEqualTypeOf<
      InputSignal<WjCarouselResponsiveOption[] | undefined>
    >();
    expect(typeof WjCarousel).toBe('function');
  });

  it('has no autoplay input: nothing moves on its own', () => {
    expectTypeOf<WjCarousel>().not.toHaveProperty('autoplayInterval');
    expect(Object.keys(WjCarousel)).not.toContain('autoplayInterval');
  });

  // The typing input is what makes `let-product` a `Product`: the host fixtures read `item.name`
  // under `strictTemplates`, which fails when `T` is `unknown`. The guard and the template type
  // are what that inference rests on.
  it('types the slot by its items: the context is { $implicit: T } and the template follows it', () => {
    expectTypeOf<WjCarouselItemContext<Product>>().toEqualTypeOf<{ $implicit: Product }>();
    expectTypeOf<WjCarouselItemContext>().toEqualTypeOf<{ $implicit: unknown }>();
    expectTypeOf<WjCarouselItemSlot<Product>['template']>().toEqualTypeOf<
      TemplateRef<WjCarouselItemContext<Product>>
    >();
    expectTypeOf<WjCarouselItemSlot<Product>['wjCarouselItemOf']>().toEqualTypeOf<
      InputSignal<readonly Product[] | null | undefined>
    >();

    const narrow = (slot: WjCarouselItemSlot<Product>, context: unknown): void => {
      if (WjCarouselItemSlot.ngTemplateContextGuard(slot, context)) {
        expectTypeOf(context).toEqualTypeOf<WjCarouselItemContext<Product>>();
      }
    };
    expect(narrow).toBeTypeOf('function');
    expect(WjCarouselItemSlot).toHaveProperty('ngTemplateContextGuard');
  });
});
