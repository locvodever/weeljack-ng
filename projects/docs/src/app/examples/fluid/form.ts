import { Component, signal } from '@angular/core';
import { WjButton } from 'weeljack-ng/button';
import { WjField } from 'weeljack-ng/field';
import { WjFluid } from 'weeljack-ng/fluid';
import { WjInputText } from 'weeljack-ng/inputtext';
import { WjSelect, type WjSelectOption } from 'weeljack-ng/select';

@Component({
  selector: 'docs-fluid-form-example',
  imports: [WjFluid, WjField, WjInputText, WjSelect, WjButton],
  template: `
    <wj-fluid>
      <wj-field label="Full name">
        <input wjInputText id="fluid-form-name" autocomplete="name" />
      </wj-field>
      <wj-field label="Plan">
        <wj-select placeholder="Choose a plan" [options]="plans" [(value)]="plan" />
      </wj-field>
      <wj-button label="Save" />
    </wj-fluid>
  `,
  styles: `
    :host {
      display: block;
      inline-size: min(100%, 24rem);
    }

    /* Spacing is the app's: the fluid adds no gap of its own. */
    wj-fluid > * + * {
      margin-block-start: 16px;
    }
  `,
})
export class FluidFormExample {
  protected readonly plans: WjSelectOption<string>[] = [
    { label: 'Free', value: 'free' },
    { label: 'Team', value: 'team' },
    { label: 'Business', value: 'business' },
  ];
  protected readonly plan = signal<string | null>(null);
}
