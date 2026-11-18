import type { MeterGroupPassThrough } from '@openng/optimus-ui/types/metergroup';

/**
 * One segment of a `wj-metergroup`: its legend text, its share as a percentage from 0 to 100, and
 * its colour (any CSS colour, for example `var(--my-segment-1)`). Without a `color` the segment is
 * transparent.
 */
// eslint-disable-next-line @typescript-eslint/consistent-type-definitions -- the generated API lists type aliases only (W1-display 9.2)
export type WjMeterItem = {
  label: string;
  value: number;
  color: string;
};

/** Where the legend sits: `end` below the bar, `start` above it. */
export type WjMeterGroupLabelPosition = 'start' | 'end';

/**
 * Pass-through for `wj-metergroup`'s parts. Tracks Optimus: its part names and attributes
 * follow the installed `@openng/optimus-ui` minor and are outside this component's stable API;
 * changes to them ship only in the release that takes a new Optimus minor and are not breaking.
 */
export type WjMeterGroupPt = MeterGroupPassThrough;
