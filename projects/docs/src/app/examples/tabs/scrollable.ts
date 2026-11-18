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
  selector: 'docs-tabs-scrollable-example',
  imports: [WjTabs, WjTabList, WjTab, WjTabPanels, WjTabPanel],
  template: `
    <wj-tabs [(value)]="value" scrollable>
      <wj-tablist ariaLabel="Monthly reports">
        @for (month of months; track month) {
          <wj-tab [value]="month">{{ month }}</wj-tab>
        }
      </wj-tablist>
      <wj-tabpanels>
        @for (month of months; track month) {
          <wj-tabpanel [value]="month">{{ month }} report.</wj-tabpanel>
        }
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
export class TabsScrollableExample {
  protected readonly months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];
  protected readonly value = signal<WjTabsValue>('January');
}
