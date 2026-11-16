import { Component } from '@angular/core';
import { WjField } from 'weeljack-ng/field';
import { WjSelect, type WjSelectOption } from 'weeljack-ng/select';

@Component({
  selector: 'docs-select-disabled-example',
  imports: [WjField, WjSelect],
  template: `
    <wj-field label="Plan" hint="Managed by your administrator.">
      <wj-select disabled value="team" [options]="plans" />
    </wj-field>
  `,
  styles: `
    :host {
      display: grid;
      inline-size: min(100%, 24rem);
    }
  `,
})
export class SelectDisabledExample {
  protected readonly plans: WjSelectOption<string>[] = [
    { label: 'Free', value: 'free' },
    { label: 'Team', value: 'team' },
  ];
}
