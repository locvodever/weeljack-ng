import type {
  Scroller,
  ScrollerItemOptions,
  ScrollerLazyLoadEvent,
  VirtualScrollerPassThrough,
} from '@openng/optimus-ui/scroller';
import type {
  WjScroller,
  WjScrollerItemContext,
  WjScrollerLoaderContext,
  WjScrollerOrientation,
  WjScrollerPt,
  WjScrollerRange,
} from 'weeljack-ng/scroller';

/**
 * The seam's type-level spec (09 Q5): every input-direction `Wj*` type stays a subset of the
 * Optimus type it feeds, every output-direction type stays assignable from what Optimus emits, and
 * `WjScrollerPt` is Optimus's own pass-through type. The checks run in `typecheck` (`ngc` over the
 * spec project); a drift in Optimus's types turns this file red there. The runtime assertion only
 * keeps the file a spec.
 */
describe('WjScroller types', () => {
  it('keeps each input-direction type assignable to the Optimus type it feeds', () => {
    expectTypeOf<WjScrollerPt>().toEqualTypeOf<VirtualScrollerPassThrough>();
    expectTypeOf<WjScrollerOrientation>().toExtend<Scroller['orientation']>();
    expectTypeOf<ReturnType<WjScroller['itemSize']>>().toExtend<Scroller['itemSize']>();
    expectTypeOf<ReturnType<WjScroller['items']>>().toExtend<Scroller['items'] | undefined>();
    expectTypeOf<ReturnType<WjScroller['scrollHeight']>>().toExtend<Scroller['scrollHeight']>();

    const orientation: Scroller['orientation'] = 'horizontal' satisfies WjScrollerOrientation;
    expect(orientation).toBe('horizontal');
  });

  it('keeps each output-direction type a narrowing of what Optimus emits', () => {
    expectTypeOf<ScrollerLazyLoadEvent>().toExtend<WjScrollerRange>();
    expectTypeOf<WjScrollerRange>().toExtend<ScrollerLazyLoadEvent>();
    expectTypeOf<Omit<WjScrollerItemContext, '$implicit'>>().toExtend<
      Required<ScrollerItemOptions>
    >();
    expectTypeOf<Required<ScrollerItemOptions>>().toExtend<
      Omit<WjScrollerItemContext, '$implicit'>
    >();
    expectTypeOf<WjScrollerLoaderContext>().toExtend<
      Pick<Required<ScrollerItemOptions>, 'index'>
    >();

    const range: ScrollerLazyLoadEvent = { first: 0, last: 9 } satisfies WjScrollerRange;
    expect(range.last).toBe(9);
  });

  it('types a slot context from the items bound to its typing input', () => {
    interface Row {
      id: number;
    }
    expectTypeOf<WjScrollerItemContext<Row>['$implicit']>().toEqualTypeOf<Row>();
    expectTypeOf<WjScrollerItemContext['$implicit']>().toEqualTypeOf<unknown>();
    expect(true).toBe(true);
  });
});
