import type { FilterMetadata } from '@openng/optimus-ui/api';
import { FilterMatchMode } from '@openng/optimus-ui/api';
import type { PaginatorState } from '@openng/optimus-ui/paginator';
import type {
  ColumnFilter,
  FrozenColumn,
  Table,
  TableLazyLoadEvent,
  TablePageEvent,
} from '@openng/optimus-ui/table';
import type {
  WjColumnFilterType,
  WjFilterMatchMode,
  WjFilterMetadata,
  WjFilters,
  WjFrozenAlign,
  WjLazyLoadEvent,
  WjPageEvent,
  WjPaginatorPosition,
  WjSortOrder,
} from 'weeljack-ng';

/** Optimus's twenty match modes, from its own constants: a new one turns the spec red. */
type OptimusMatchMode = (typeof FilterMatchMode)[Exclude<
  keyof typeof FilterMatchMode,
  'prototype'
>];

/**
 * The seam's type-level spec (09 Q5) for the shared data types: every input-direction type stays
 * a subset of the Optimus type it feeds, and every output-direction type is something Optimus's
 * event narrows to. The checks run in `typecheck` (`ngc` over the spec project). The runtime
 * assertion only keeps the file a spec.
 */
describe('data types', () => {
  it('keeps each input-direction type assignable to the Optimus type it feeds', () => {
    expectTypeOf<WjSortOrder>().toExtend<Table['sortOrder']>();
    expectTypeOf<WjFilterMatchMode>().toExtend<NonNullable<FilterMetadata['matchMode']>>();
    expectTypeOf<WjFilterMetadata>().toExtend<FilterMetadata>();
    expectTypeOf<WjFilters>().toExtend<Table['filters']>();
    expectTypeOf<WjFrozenAlign>().toExtend<FrozenColumn['alignFrozen']>();
    expectTypeOf<WjColumnFilterType>().toExtend<ColumnFilter['type']>();
    expectTypeOf<WjPaginatorPosition>().toExtend<Table['paginatorPosition']>();

    const order: Table['sortOrder'] = -1 satisfies WjSortOrder;
    expect(order).toBe(-1);
  });

  it('lists exactly the match modes Optimus knows', () => {
    expectTypeOf<WjFilterMatchMode>().toEqualTypeOf<OptimusMatchMode>();
  });

  it('keeps each output-direction type something Optimus’s event converts to', () => {
    expectTypeOf<WjPageEvent>().toExtend<TablePageEvent>();
    expectTypeOf<WjPageEvent>().toExtend<Required<Pick<PaginatorState, 'first' | 'rows'>>>();
    expectTypeOf<WjLazyLoadEvent['first']>().toEqualTypeOf<
      NonNullable<TableLazyLoadEvent['first']>
    >();

    const event: WjPageEvent = { first: 10, rows: 5 };
    expect(event.first + event.rows).toBe(15);
  });
});
