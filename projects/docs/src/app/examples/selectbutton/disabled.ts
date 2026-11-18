import { Component } from '@angular/core';
import type { WjOption } from 'weeljack-ng';
import { WjField } from 'weeljack-ng/field';
import { WjSelectButton } from 'weeljack-ng/selectbutton';

@Component({
  selector: 'docs-selectbutton-disabled-example',
  imports: [WjField, WjSelectButton],
  template: `
    <wj-field label="Calendar view" hint="Managed by your administrator.">
      <wj-selectbutton disabled value="week" [options]="views" />
    </wj-field>
    <wj-field label="Calendar view" hint="Day is shown but cannot be picked.">
      <wj-selectbutton [options]="withoutDay" />
    </wj-field>
  `,
  styles: `
    :host {
      display: grid;
      gap: 16px;
      inline-size: min(100%, 24rem);
    }
  `,
})
export class SelectButtonDisabledExample {
  protected readonly views: WjOption<string>[] = [
    { label: 'Day', value: 'day' },
    { label: 'Week', value: 'week' },
    { label: 'Month', value: 'month' },
  ];
  protected readonly withoutDay: WjOption<string>[] = [
    { label: 'Day', value: 'day', disabled: true },
    { label: 'Week', value: 'week' },
    { label: 'Month', value: 'month' },
  ];
}
