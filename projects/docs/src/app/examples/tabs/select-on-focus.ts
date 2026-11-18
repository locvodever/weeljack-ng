import { Component, signal } from '@angular/core';
import {
  WjTab,
  WjTabList,
  WjTabPanel,
  WjTabPanels,
  WjTabs,
  type WjTabsValue,
} from 'weeljack-ng/tabs';

@Component({
  selector: 'docs-tabs-select-on-focus-example',
  imports: [WjTabs, WjTabList, WjTab, WjTabPanels, WjTabPanel],
  template: `
    <wj-tabs [(value)]="value" selectOnFocus>
      <wj-tablist ariaLabel="Product details">
        <wj-tab value="overview">Overview</wj-tab>
        <wj-tab value="specifications">Specifications</wj-tab>
        <wj-tab value="reviews">Reviews</wj-tab>
      </wj-tablist>
      <wj-tabpanels>
        <wj-tabpanel value="overview">
          A compact desk lamp with a weighted base and a dimmable warm light.
        </wj-tabpanel>
        <wj-tabpanel value="specifications">
          Height 42 cm, 6 W LED, a 1.8 m cable and a brushed aluminium finish.
        </wj-tabpanel>
        <wj-tabpanel value="reviews">
          Buyers rate it 4.6 out of 5, and most mention how steady the base is.
        </wj-tabpanel>
      </wj-tabpanels>
    </wj-tabs>
  `,
  styles: `
    :host {
      display: block;
      max-inline-size: 40rem;
    }
  `,
})
export class TabsSelectOnFocusExample {
  protected readonly value = signal<WjTabsValue>('overview');
}
