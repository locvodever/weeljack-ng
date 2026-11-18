import type {
  TabListPassThrough,
  TabPanelPassThrough,
  TabPanelsPassThrough,
  TabPassThrough,
  TabsPassThrough,
} from '@openng/optimus-ui/types/tabs';

/** The value of one `wj-tab` and its `wj-tabpanel`, and what the `wj-tabs` `value` holds. Unique. */
export type WjTabsValue = string | number;

/**
 * Pass-through for `wj-tabs`'s parts. Tracks Optimus: its part names and attributes follow the
 * installed `@openng/optimus-ui` minor and are outside this component's stable API; changes to
 * them ship only in the release that takes a new Optimus minor and are not breaking.
 */
export type WjTabsPt = TabsPassThrough;

/**
 * Pass-through for `wj-tablist`'s parts. Tracks Optimus: its part names and attributes follow the
 * installed `@openng/optimus-ui` minor and are outside this component's stable API; changes to
 * them ship only in the release that takes a new Optimus minor and are not breaking.
 */
export type WjTabListPt = TabListPassThrough;

/**
 * Pass-through for `wj-tab`'s parts. Tracks Optimus: its part names and attributes follow the
 * installed `@openng/optimus-ui` minor and are outside this component's stable API; changes to
 * them ship only in the release that takes a new Optimus minor and are not breaking.
 */
export type WjTabPt = TabPassThrough;

/**
 * Pass-through for `wj-tabpanels`'s parts. Tracks Optimus: its part names and attributes follow the
 * installed `@openng/optimus-ui` minor and are outside this component's stable API; changes to
 * them ship only in the release that takes a new Optimus minor and are not breaking.
 */
export type WjTabPanelsPt = TabPanelsPassThrough;

/**
 * Pass-through for `wj-tabpanel`'s parts. Tracks Optimus: its part names and attributes follow the
 * installed `@openng/optimus-ui` minor and are outside this component's stable API; changes to
 * them ship only in the release that takes a new Optimus minor and are not breaking.
 */
export type WjTabPanelPt = TabPanelPassThrough;
