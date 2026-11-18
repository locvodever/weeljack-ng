import { Component, booleanAttribute, contentChild, input } from '@angular/core';
import { _checkAriaOnHost, _checkWeeljackSetup } from 'weeljack-ng/private';
import { WjAccordionContent } from '../accordion-content/accordion-content';
import { WjAccordionHeader } from '../accordion-header/accordion-header';
import type { WjAccordionPanelPt, WjAccordionPanelValue } from '../accordion-types';

/**
 * One panel of a `wj-accordion`: a `wj-accordion-header` and a `wj-accordion-content`. A panel
 * with no header draws an unnamed toggle, so give every panel one. A part renders nothing itself:
 * the accordion reads its inputs and draws the panel.
 */
@Component({
  selector: 'wj-accordion-panel',
  template:
    '<ng-content select="wj-accordion-header" /><ng-content select="wj-accordion-content" />',
  host: { hidden: '' },
})
export class WjAccordionPanel {
  /** Identifies the panel, and is what the accordion's `value` holds. Unique within the accordion. */
  readonly value = input.required<WjAccordionPanelValue>();
  /** Makes the panel inert: it cannot open, takes no focus and is skipped by the arrow keys. */
  readonly disabled = input(false, { transform: booleanAttribute });
  /**
   * Pass-through for the panel's parts. Tracks Optimus: its part names and attributes follow the
   * installed `@openng/optimus-ui` minor and are outside this component's stable API; changes to
   * them ship only in the release that takes a new Optimus minor and are not breaking.
   */
  readonly pt = input<WjAccordionPanelPt>();
  /** The panel's header part, if any. @docs-private */
  readonly header = contentChild(WjAccordionHeader);
  /** The panel's content part, if any. @docs-private */
  readonly body = contentChild(WjAccordionContent);

  constructor() {
    _checkWeeljackSetup('wj-accordion-panel');
    _checkAriaOnHost('wj-accordion-panel', 'Remove it: the panel is named by its header');
  }
}
