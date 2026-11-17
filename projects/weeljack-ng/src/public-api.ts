/*
 * Public API surface of the root entry `weeljack-ng`: `provideWeeljack`, its option type, the
 * brand colour and translation types, and the public types two or more entries share (the data
 * types of `data-types.ts`: column model and paging; the menu item and its command event of
 * `menu-item.ts`). The root never exports a component or re-exports another entry (01 Q2).
 */
export { type WjColorScale } from './brand';
export { provideWeeljack, type WjThemeOptions } from './provide-weeljack';
export { type WjOwnStrings, type WjTranslation } from './translation';
export type {
  WjColumnFilterType,
  WjFilterMatchMode,
  WjFilterMetadata,
  WjFilters,
  WjFrozenAlign,
  WjLazyLoadEvent,
  WjPageEvent,
  WjPaginatorPosition,
  WjSortOrder,
} from './data-types';
export type { WjMenuItem, WjMenuItemCommandEvent } from './menu-item';
