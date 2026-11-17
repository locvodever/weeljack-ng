import type { PanelMenuPassThrough } from '@openng/optimus-ui/panelmenu';
import type { WjMenuItem } from 'weeljack-ng';

/**
 * Pass-through for `wj-panelmenu`'s parts. Tracks Optimus: its part names and attributes follow
 * the installed `@openng/optimus-ui` minor and are outside this component's stable API; changes to
 * them ship only in the release that takes a new Optimus minor and are not breaking.
 */
export type WjPanelMenuPt = PanelMenuPassThrough;

/** What a `wjPanelMenuItem` template sees for each panel header and nested item. */
export interface WjPanelMenuItemContext {
  /** Your own item object: the same reference you put in `model`. */
  $implicit: WjMenuItem;
}
