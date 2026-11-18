import { NgTemplateOutlet } from '@angular/common';
import { Component, contentChild, effect, input, viewChild } from '@angular/core';
import { Card } from '@openng/optimus-ui/card';
import { _checkWeeljackSetup } from 'weeljack-ng/private';
import {
  WjCardFooterSlot,
  WjCardHeaderSlot,
  WjCardSubtitleSlot,
  WjCardTitleSlot,
} from './card-slots';
import type { WjCardPt } from './card-types';

/**
 * A container for one subject, over Optimus's `p-card`: an optional header region, a title and
 * subtitle, your content and a footer for actions. Give the title and subtitle as `header` and
 * `subheader` text, or fill the `wjCardTitle` and `wjCardSubtitle` slots, which win over the text.
 * `wjCardHeader` (above the body, for media) and `wjCardFooter` (actions) are slots too. A part
 * exists only while its text or slot is given, and a slot can appear or go after the card is
 * created. The card is not interactive and is no Tab stop.
 */
@Component({
  selector: 'wj-card',
  imports: [Card, NgTemplateOutlet],
  templateUrl: './card.html',
  styleUrl: './card.css',
})
export class WjCard {
  /** Text of the title part. Rendered as text, never as HTML. The `wjCardTitle` slot wins. */
  readonly header = input<string>();
  /** Text of the subtitle part. Rendered as text, never as HTML. The `wjCardSubtitle` slot wins. */
  readonly subheader = input<string>();
  /**
   * Pass-through for the card's parts. Tracks Optimus: its part names and attributes follow the
   * installed `@openng/optimus-ui` minor and are outside this component's stable API; changes to
   * them ship only in the release that takes a new Optimus minor and are not breaking.
   */
  readonly pt = input<WjCardPt>();

  protected readonly headerSlot = contentChild(WjCardHeaderSlot);
  protected readonly titleSlot = contentChild(WjCardTitleSlot);
  protected readonly subtitleSlot = contentChild(WjCardSubtitleSlot);
  protected readonly footerSlot = contentChild(WjCardFooterSlot);

  private readonly inner = viewChild(Card);

  constructor() {
    _checkWeeljackSetup('wj-card');

    // Optimus reads each bridged template from a content query, and its OnPush view does not
    // notice one that appears or goes after creation: nudge it.
    effect(() => {
      this.headerSlot();
      this.titleSlot();
      this.subtitleSlot();
      this.footerSlot();
      this.inner()?.cd.markForCheck();
    });
  }
}
