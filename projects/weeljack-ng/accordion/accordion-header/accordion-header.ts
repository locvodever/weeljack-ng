import { Component, TemplateRef, input, viewChild } from '@angular/core';
import { _checkAriaOnHost, _checkWeeljackSetup } from 'weeljack-ng/private';
import type { WjAccordionHeaderPt } from '../accordion-types';

// A part is a declaration (PRD FR-3): `<ng-content />` sits inside an `ng-template`, so the
// projected nodes move to the one place `wj-accordion` stamps the template. The host is projected
// into the accordion only so it reaches the prerendered HTML (check:ssr), and `hidden` keeps it
// out of the layout without a stylesheet.

/**
 * The header of a `wj-accordion-panel`: its content is the text on the toggle button. Keep it to
 * text and decorative icons (`aria-hidden="true"`): the header is itself a `role="button"`, so a
 * link or a button inside it is not reachable. A part renders nothing itself: the accordion reads
 * its `pt` and draws its content in the header it writes.
 */
@Component({
  selector: 'wj-accordion-header',
  template: '<ng-template><ng-content /></ng-template>',
  host: { hidden: '' },
})
export class WjAccordionHeader {
  /**
   * Pass-through for the header's parts. Tracks Optimus: its part names and attributes follow the
   * installed `@openng/optimus-ui` minor and are outside this component's stable API; changes to
   * them ship only in the release that takes a new Optimus minor and are not breaking.
   */
  readonly pt = input<WjAccordionHeaderPt>();
  /** The projected content, as a template the accordion stamps once. @docs-private */
  readonly content = viewChild.required<TemplateRef<unknown>>(TemplateRef);

  constructor() {
    _checkWeeljackSetup('wj-accordion-header');
    _checkAriaOnHost('wj-accordion-header', 'Remove it: the header is named by its own text');
  }
}
