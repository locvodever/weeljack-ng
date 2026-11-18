import type {
  AccordionContentPassThrough,
  AccordionHeaderPassThrough,
  AccordionPanelPassThrough,
  AccordionPassThrough,
} from '@openng/optimus-ui/accordion';

/** The value of one `wj-accordion-panel`. It must be unique within its `wj-accordion`. */
export type WjAccordionPanelValue = string | number;

/**
 * The open panel of a `wj-accordion`: one panel's value, or an array of values with `multiple`.
 * `undefined` means every panel is collapsed.
 */
export type WjAccordionValue = string | number | string[] | number[];

/**
 * Pass-through for `wj-accordion`'s parts. Tracks Optimus: its part names and attributes follow the
 * installed `@openng/optimus-ui` minor and are outside this component's stable API; changes to
 * them ship only in the release that takes a new Optimus minor and are not breaking.
 */
export type WjAccordionPt = AccordionPassThrough;

/**
 * Pass-through for `wj-accordion-panel`'s parts. Tracks Optimus: its part names and attributes
 * follow the installed `@openng/optimus-ui` minor and are outside this component's stable API;
 * changes to them ship only in the release that takes a new Optimus minor and are not breaking.
 */
export type WjAccordionPanelPt = AccordionPanelPassThrough;

/**
 * Pass-through for `wj-accordion-header`'s parts. Tracks Optimus: its part names and attributes
 * follow the installed `@openng/optimus-ui` minor and are outside this component's stable API;
 * changes to them ship only in the release that takes a new Optimus minor and are not breaking.
 */
export type WjAccordionHeaderPt = AccordionHeaderPassThrough;

/**
 * Pass-through for `wj-accordion-content`'s parts. Tracks Optimus: its part names and attributes
 * follow the installed `@openng/optimus-ui` minor and are outside this component's stable API;
 * changes to them ship only in the release that takes a new Optimus minor and are not breaking.
 */
export type WjAccordionContentPt = AccordionContentPassThrough;
