import type { InputSignal } from '@angular/core';
import type { Image, ImagePassThrough } from '@openng/optimus-ui/image';
import { WjImage, type WjImageLoading, type WjImagePt } from 'weeljack-ng/image';

/**
 * The seam's type-level spec (09 Q5): every input-direction `Wj*` type stays a subset of the
 * Optimus type it feeds. The checks run in `typecheck` (`ngc` over the spec project); a drift in
 * Optimus's types turns this file red there. The runtime assertion only keeps the file a spec.
 */
describe('WjImage types', () => {
  it('keeps each input-direction type assignable to the Optimus type it feeds', () => {
    expectTypeOf<WjImageLoading>().toExtend<NonNullable<Image['loading']>>();
    expectTypeOf<WjImagePt>().toEqualTypeOf<ImagePassThrough>();

    const loading: Image['loading'] = 'lazy' satisfies WjImageLoading;
    expect(loading).toBe('lazy');
  });

  it('takes URLs as plain strings: no SafeUrl crosses the wrapper', () => {
    expectTypeOf<WjImage['src']>().toEqualTypeOf<InputSignal<string>>();
    expectTypeOf<WjImage['srcSet']>().toEqualTypeOf<InputSignal<string | undefined>>();
    expectTypeOf<WjImage['previewImageSrc']>().toEqualTypeOf<InputSignal<string | undefined>>();
  });

  // `input.required` has no distinct type: a template that omits `src` or `alt` fails the
  // `strictTemplates` build (NG8008), which every host fixture here and in the docs examples
  // compiles. This spec pins what the signals read as: a `string`, never `undefined`.
  it('reads src and alt as a string, not undefined', () => {
    expectTypeOf<WjImage['alt']>().toEqualTypeOf<InputSignal<string>>();
    expectTypeOf<ReturnType<WjImage['src']>>().toEqualTypeOf<string>();
    expectTypeOf<ReturnType<WjImage['alt']>>().toEqualTypeOf<string>();
  });
});
