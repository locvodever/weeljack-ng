import { NgTemplateOutlet } from '@angular/common';
import { Component, booleanAttribute, contentChildren, input, model } from '@angular/core';
import {
  Accordion,
  AccordionContent,
  AccordionHeader,
  AccordionPanel,
} from '@openng/optimus-ui/accordion';
import { _OVERLAY_MOTION, _checkAriaOnHost, _checkWeeljackSetup } from 'weeljack-ng/private';
import type { WjAccordionPt, WjAccordionValue } from './accordion-types';
import { WjAccordionPanel } from './accordion-panel/accordion-panel';

/**
 * An accordion over Optimus's `p-accordion`: panels whose content expands and collapses under a
 * header. Declare each panel as a `wj-accordion-panel` child with a `wj-accordion-header` and a
 * `wj-accordion-content` inside it; the accordion draws them in the order declared and follows an
 * `@if` or `@for` around them. Only `wj-accordion-panel` children render. One panel is open at a
 * time unless `multiple` is set. The `value` model reports every toggle, by click or by key.
 */
@Component({
  selector: 'wj-accordion',
  imports: [Accordion, AccordionPanel, AccordionHeader, AccordionContent, NgTemplateOutlet],
  templateUrl: './accordion.html',
  styleUrl: './accordion.css',
})
export class WjAccordion {
  /**
   * The value of the open panel, or an array of values with `multiple`. `undefined` means every
   * panel is collapsed.
   */
  readonly value = model<WjAccordionValue>();
  /** Lets several panels be open at once. `value` is then an array. */
  readonly multiple = input(false, { transform: booleanAttribute });
  /**
   * Pass-through for the accordion's parts. Tracks Optimus: its part names and attributes follow
   * the installed `@openng/optimus-ui` minor and are outside this component's stable API; changes
   * to them ship only in the release that takes a new Optimus minor and are not breaking.
   */
  readonly pt = input<WjAccordionPt>();

  /** The `wj-accordion-panel` children, in declaration order. */
  protected readonly panels = contentChildren(WjAccordionPanel);
  /** `safe` makes the expand and collapse skip their motion under reduced motion (22 Q6). */
  protected readonly motion = _OVERLAY_MOTION;

  constructor() {
    _checkWeeljackSetup('wj-accordion');
    _checkAriaOnHost('wj-accordion', 'Remove it: the headers and panels name themselves');
  }
}
