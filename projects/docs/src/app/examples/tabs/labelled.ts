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
  selector: 'docs-tabs-labelled-example',
  imports: [WjTabs, WjTabList, WjTab, WjTabPanels, WjTabPanel],
  template: `
    <span id="tabs-account-settings" class="caption">Account settings</span>
    <wj-tabs [(value)]="value">
      <wj-tablist ariaLabelledBy="tabs-account-settings">
        <wj-tab value="profile">Profile</wj-tab>
        <wj-tab value="password">Password</wj-tab>
        <wj-tab value="notifications">Notifications</wj-tab>
      </wj-tablist>
      <wj-tabpanels>
        <wj-tabpanel value="profile">Your name, photo and the address we write to.</wj-tabpanel>
        <wj-tabpanel value="password">Change the password you use to sign in.</wj-tabpanel>
        <wj-tabpanel value="notifications">Choose which updates reach your inbox.</wj-tabpanel>
      </wj-tabpanels>
    </wj-tabs>
  `,
  styles: `
    :host {
      display: block;
      max-inline-size: 40rem;
    }

    .caption {
      display: block;
      margin-block-end: 8px;
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--wj-text-color);
    }
  `,
})
export class TabsLabelledExample {
  protected readonly value = signal<WjTabsValue>('profile');
}
