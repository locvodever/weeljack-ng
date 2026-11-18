import { NgTemplateOutlet } from '@angular/common';
import { Component, computed, contentChild, effect, input, viewChild } from '@angular/core';
import { Toolbar } from '@openng/optimus-ui/toolbar';
import { _checkAriaOnHost, _checkWeeljackSetup, _mergePartAttributes } from 'weeljack-ng/private';
import { WjToolbarCenterSlot, WjToolbarEndSlot, WjToolbarStartSlot } from './toolbar-slots';
import type { WjToolbarPt } from './toolbar-types';

/**
 * A row of controls grouped at the start, center and end, over Optimus's `p-toolbar`
 * (`role="toolbar"`). Default content comes first; the slots `wjToolbarStart`, `wjToolbarCenter`
 * and `wjToolbarEnd` follow, and a section exists only while its slot is filled. Name the toolbar
 * with `ariaLabel` or `ariaLabelledBy` when a page has more than one. Every control keeps its own
 * Tab stop: there is no roving tabindex and no arrow-key movement.
 */
@Component({
  selector: 'wj-toolbar',
  imports: [Toolbar, NgTemplateOutlet],
  templateUrl: './toolbar.html',
  styleUrl: './toolbar.css',
})
export class WjToolbar {
  /** Accessible name of the toolbar, written on its `role="toolbar"` element. */
  readonly ariaLabel = input<string>();
  /** Id of the element that names the toolbar, written on its `role="toolbar"` element. */
  readonly ariaLabelledBy = input<string>();
  /**
   * Pass-through for the toolbar's parts. Tracks Optimus: its part names and attributes follow the
   * installed `@openng/optimus-ui` minor and are outside this component's stable API; changes to
   * them ship only in the release that takes a new Optimus minor and are not breaking.
   */
  readonly pt = input<WjToolbarPt>();

  protected readonly startSlot = contentChild(WjToolbarStartSlot);
  protected readonly centerSlot = contentChild(WjToolbarCenterSlot);
  protected readonly endSlot = contentChild(WjToolbarEndSlot);

  private readonly inner = viewChild(Toolbar);

  /** `pt` forwarded as given, plus `aria-label` routed onto the toolbar root (Optimus has no input). */
  protected readonly partAttributes = computed<WjToolbarPt>(() =>
    _mergePartAttributes(this.pt(), 'root', { 'aria-label': this.ariaLabel() }),
  );

  constructor() {
    _checkWeeljackSetup('wj-toolbar');
    _checkAriaOnHost('wj-toolbar', 'Use the ariaLabel or ariaLabelledBy input to name the toolbar');

    // Optimus reads each bridged template from a content query into a plain property, and its
    // OnPush view may not notice a slot that appears or goes after creation: nudge it.
    effect(() => {
      this.startSlot();
      this.centerSlot();
      this.endSlot();
      this.inner()?.cd.markForCheck();
    });
  }
}
