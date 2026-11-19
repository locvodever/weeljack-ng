import { NgTemplateOutlet } from '@angular/common';
import { Component, booleanAttribute, contentChild, input, model } from '@angular/core';
import { Tab, TabList, TabPanel, TabPanels, Tabs } from '@openng/optimus-ui/tabs';
import { _checkAriaOnHost, _checkWeeljackSetup } from 'weeljack-ng/private';
import type { WjTabsPt, WjTabsValue } from './tabs-types';
import { WjTabList } from './tablist/tablist';
import { WjTabPanels } from './tabpanels/tabpanels';

/**
 * Tabs over Optimus's `p-tabs`: one panel at a time, picked from a row of tabs. Declare a
 * `wj-tablist` of `wj-tab` children and a `wj-tabpanels` of `wj-tabpanel` children; a tab and its
 * panel share a `value`, and `value` here is the active one. Name the tab list with its `ariaLabel`
 * or `ariaLabelledBy`. Only `wj-tablist` and `wj-tabpanels` children render.
 */
@Component({
  selector: 'wj-tabs',
  imports: [Tabs, TabList, Tab, TabPanels, TabPanel, NgTemplateOutlet],
  templateUrl: './tabs.html',
  styleUrl: './tabs.css',
})
export class WjTabs {
  /** The value of the active tab. Keep it on a tab that exists, or no tab is reachable by Tab. */
  readonly value = model.required<WjTabsValue>();
  /** Activates a tab as soon as it takes focus, not only on Enter or Space. */
  readonly selectOnFocus = input(false, { transform: booleanAttribute });
  /**
   * Pass-through for the tabs' parts. Tracks Optimus: its part names and attributes follow the
   * installed `@openng/optimus-ui` minor and are outside this component's stable API; changes to
   * them ship only in the release that takes a new Optimus minor and are not breaking.
   */
  readonly pt = input<WjTabsPt>();

  /** The one `wj-tablist` child. */
  protected readonly list = contentChild(WjTabList);
  /** The one `wj-tabpanels` child. */
  protected readonly panels = contentChild(WjTabPanels);

  constructor() {
    _checkWeeljackSetup('wj-tabs');
    _checkAriaOnHost(
      'wj-tabs',
      'Remove it: name the tab list with the ariaLabel input of wj-tablist',
    );
  }
}
