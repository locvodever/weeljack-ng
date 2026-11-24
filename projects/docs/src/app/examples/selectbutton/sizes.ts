import { Component } from '@angular/core';
import type { WjOption } from 'weeljack-ng';
import { WjField } from 'weeljack-ng/field';
import { WjSelectButton } from 'weeljack-ng/selectbutton';

@Component({
  selector: 'docs-selectbutton-sizes-example',
  imports: [WjField, WjSelectButton],
  template: `
    <wj-field label="Small">
      <wj-selectbutton size="small" value="week" [options]="views" />
    </wj-field>
    <wj-field label="Default">
      <wj-selectbutton value="week" [options]="views" />
    </wj-field>
    <wj-field label="Large">
      <wj-selectbutton size="large" value="week" [options]="views" />
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
export class SelectButtonSizesExample {
  protected readonly views: WjOption<string>[] = [
    { label: 'Day', value: 'day' },
    { label: 'Week', value: 'week' },
    { label: 'Month', value: 'month' },
  ];
}
