import type { InputSignal, ModelSignal, TemplateRef } from '@angular/core';
import type { GalleriaPassThrough } from '@openng/optimus-ui/types/galleria';
import {
  WjGalleria,
  WjGalleriaCaptionSlot,
  WjGalleriaItemSlot,
  type WjGalleriaCaptionContext,
  type WjGalleriaItemContext,
  type WjGalleriaPt,
} from 'weeljack-ng/galleria';

interface Photo {
  title: string;
}

/**
 * The seam's type-level spec (09 Q5): `WjGalleriaPt` is exactly the Optimus pass-through and the
 * slot contexts stay what Optimus hands its templates, so a drift in Optimus's types turns this
 * file red in `typecheck` (`ngc` over the spec project). The runtime assertions only keep the file
 * a spec.
 */
describe('WjGalleria types', () => {
  it('keeps WjGalleriaPt equal to the Optimus pass-through', () => {
    expectTypeOf<WjGalleriaPt>().toEqualTypeOf<GalleriaPassThrough>();

    const pt: WjGalleriaPt = { mask: { 'data-probe': 'mask' } };
    expect(pt).toBeDefined();
  });

  // `input.required` has no distinct type: a template that omits `ariaLabel` fails the
  // `strictTemplates` build (NG8008), which every host fixture here and in the docs examples
  // compiles. This spec pins what the signals read as.
  it('reads the inputs and the models as the API says', () => {
    expectTypeOf<WjGalleria['ariaLabel']>().toEqualTypeOf<InputSignal<string>>();
    expectTypeOf<WjGalleria['ariaLabelledBy']>().toEqualTypeOf<InputSignal<string | undefined>>();
    expectTypeOf<WjGalleria['activeIndex']>().toEqualTypeOf<ModelSignal<number>>();
    expectTypeOf<WjGalleria['visible']>().toEqualTypeOf<ModelSignal<boolean>>();
    expectTypeOf<WjGalleria<Photo>['value']>().toEqualTypeOf<InputSignal<Photo[]>>();
    expect(typeof WjGalleria).toBe('function');
  });

  it('has no autoplay, indicator, thumbnail or motion input: nothing moves on its own', () => {
    for (const dropped of [
      'autoPlay',
      'transitionInterval',
      'showIndicators',
      'showThumbnails',
      'showThumbnailNavigators',
      'thumbnailsPosition',
      'numVisible',
      'responsiveOptions',
      'motionOptions',
      'maskMotionOptions',
    ] as const) {
      expectTypeOf<WjGalleria>().not.toHaveProperty(dropped);
      expect(Object.keys(WjGalleria)).not.toContain(dropped);
    }
  });

  // The typing input is what makes `let-photo` a `Photo`: the host fixtures read `photo.title` under
  // `strictTemplates`, which fails when `T` is `unknown`. The guard and the template type are what
  // that inference rests on.
  it('types each slot by its items: the context is { $implicit: T } and the template follows it', () => {
    expectTypeOf<WjGalleriaItemContext<Photo>>().toEqualTypeOf<{ $implicit: Photo }>();
    expectTypeOf<WjGalleriaCaptionContext<Photo>>().toEqualTypeOf<{ $implicit: Photo }>();
    expectTypeOf<WjGalleriaItemContext>().toEqualTypeOf<{ $implicit: unknown }>();
    expectTypeOf<WjGalleriaItemSlot<Photo>['template']>().toEqualTypeOf<
      TemplateRef<WjGalleriaItemContext<Photo>>
    >();
    expectTypeOf<WjGalleriaCaptionSlot<Photo>['template']>().toEqualTypeOf<
      TemplateRef<WjGalleriaCaptionContext<Photo>>
    >();
    expectTypeOf<WjGalleriaItemSlot<Photo>['wjGalleriaItemOf']>().toEqualTypeOf<
      InputSignal<readonly Photo[] | null | undefined>
    >();
    expectTypeOf<WjGalleriaCaptionSlot<Photo>['wjGalleriaCaptionOf']>().toEqualTypeOf<
      InputSignal<readonly Photo[] | null | undefined>
    >();

    const narrowItem = (slot: WjGalleriaItemSlot<Photo>, context: unknown): void => {
      if (WjGalleriaItemSlot.ngTemplateContextGuard(slot, context)) {
        expectTypeOf(context).toEqualTypeOf<WjGalleriaItemContext<Photo>>();
      }
    };
    const narrowCaption = (slot: WjGalleriaCaptionSlot<Photo>, context: unknown): void => {
      if (WjGalleriaCaptionSlot.ngTemplateContextGuard(slot, context)) {
        expectTypeOf(context).toEqualTypeOf<WjGalleriaCaptionContext<Photo>>();
      }
    };
    expect(narrowItem).toBeTypeOf('function');
    expect(narrowCaption).toBeTypeOf('function');
    expect(WjGalleriaItemSlot).toHaveProperty('ngTemplateContextGuard');
    expect(WjGalleriaCaptionSlot).toHaveProperty('ngTemplateContextGuard');
  });
});
