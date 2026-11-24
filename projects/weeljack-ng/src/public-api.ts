/*
 * Public API surface of the root entry `weeljack-ng`: `provideWeeljack`, its option type, the
 * brand colour and translation types, and the public types two or more entries share (the data
 * types of `data-types.ts`: column model and paging; the menu item and its command event of
 * `menu-item.ts`; the tree node and its selection mode of `tree-node.ts`; the choice-control option
 * of `option.ts`), and the shared confirmation service `WjConfirmationService` with its
 * `WjConfirmation` (`confirmation.ts`), which the confirm dialog and the confirm popup both serve.
 * The root never exports a component or re-exports another entry (01 Q2). The four `_`-prefixed
 * names of `theme-runtime.ts` are `@docs-private` and outside semver, like `weeljack-ng/private`'s;
 * they exist for `weeljack-ng/theme` only. `WjPreset` is the public, opaque type of a base preset
 * (ADR 0010): an app passes one from its own entry as `provideWeeljack({ preset })`. `_wjNoir` is
 * `_`-prefixed, `@docs-private` and outside semver, and exists for `weeljack-ng/preset-noir` only.
 */
export { type WjColorScale } from './brand';
export { WjConfirmationService, type WjConfirmation } from './confirmation';
export { _wjNoir } from './noir-on-zinc';
export type { WjPreset } from './preset';
export { provideWeeljack, type WjThemeOptions } from './provide-weeljack';
export {
  _WJ_THEME_OPTIONS,
  _wjThemePreset,
  _wjWarnBadColours,
  _wjWarnContrast,
} from './theme-runtime';
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
export type { WjOption } from './option';
export type { WjTreeNode, WjTreeSelectionMode } from './tree-node';
