import type { Splitter } from '@openng/optimus-ui/splitter';
import type { SplitterPassThrough } from '@openng/optimus-ui/types/splitter';
import type {
  WjSplitterOrientation,
  WjSplitterPt,
  WjSplitterResizeEvent,
} from 'weeljack-ng/splitter';

/**
 * The seam's type-level spec (09 Q5): `WjSplitterPt` is exactly the Optimus pass-through, and
 * `WjSplitterOrientation` stays assignable to the `layout` input it feeds, so a drift in Optimus
 * turns this file red in `typecheck` (`ngc` over the spec project). `resizeEnd` carries numbers
 * only, where Optimus's own event also carries strings and the browser event. The runtime
 * assertions only keep the file a spec.
 */
describe('WjSplitter types', () => {
  it('keeps WjSplitterPt equal to the Optimus pass-through', () => {
    expectTypeOf<WjSplitterPt>().toEqualTypeOf<SplitterPassThrough>();

    const pt: WjSplitterPt = {
      root: { 'data-probe': 'root' },
      panel: () => ({ 'data-probe': 'panel' }),
      gutter: { 'data-probe': 'gutter' },
      gutterHandle: () => ({ 'data-probe': 'handle' }),
    };
    expect(pt).toBeDefined();
  });

  it('keeps WjSplitterOrientation assignable to the Optimus layout input', () => {
    expectTypeOf<WjSplitterOrientation>().toExtend<NonNullable<Splitter['layout']>>();
    expectTypeOf<WjSplitterOrientation>().toEqualTypeOf<'horizontal' | 'vertical'>();

    const orientation: WjSplitterOrientation = 'vertical';
    expect(orientation).toBe('vertical');
  });

  it('types the resize event as one number per panel', () => {
    expectTypeOf<WjSplitterResizeEvent>().toEqualTypeOf<{ sizes: number[] }>();
    expectTypeOf<WjSplitterResizeEvent['sizes']>().toEqualTypeOf<number[]>();

    const event: WjSplitterResizeEvent = { sizes: [30, 70] };
    expect(event.sizes).toHaveLength(2);
  });
});
