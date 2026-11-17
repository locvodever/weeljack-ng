import type { DrawerPassThrough } from '@openng/optimus-ui/drawer';

/**
 * Pass-through for `wj-drawer`'s parts. Tracks Optimus: its part names and attributes follow the
 * installed `@openng/optimus-ui` minor and are outside this component's stable API; changes to
 * them ship only in the release that takes a new Optimus minor and are not breaking.
 */
export type WjDrawerPt = DrawerPassThrough;

/** The edge a `wj-drawer` opens from: Optimus's positions without `'full'`. */
export type WjDrawerPosition = 'left' | 'right' | 'top' | 'bottom';
