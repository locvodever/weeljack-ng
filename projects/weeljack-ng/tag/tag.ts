import { Component, input } from '@angular/core';
import { Tag } from '@openng/optimus-ui/tag';
import { _checkWeeljackSetup } from 'weeljack-ng/private';
import type { WjTagPt, WjTagSeverity } from './tag-types';

/**
 * A short label that sorts content, over Optimus's `p-tag`, with an optional colour role. It is
 * display only: it takes no focus and adds no Tab stop. Content you project (an icon, say) renders
 * before the `value`; mark a decorative icon `aria-hidden`.
 *
 * Do not carry meaning by colour alone: the `value` should say what the colour means.
 */
@Component({
  selector: 'wj-tag',
  imports: [Tag],
  templateUrl: './tag.html',
  styleUrl: './tag.css',
})
export class WjTag {
  /** Text of the tag. Rendered as text, never as HTML. */
  readonly value = input<string>();
  /** Colour role. */
  readonly severity = input<WjTagSeverity>();
  /**
   * Pass-through for the tag's parts. Tracks Optimus: its part names and attributes follow the
   * installed `@openng/optimus-ui` minor and are outside this component's stable API; changes to
   * them ship only in the release that takes a new Optimus minor and are not breaking.
   */
  readonly pt = input<WjTagPt>();

  constructor() {
    _checkWeeljackSetup('wj-tag');
  }
}
