import { Component } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import type { WjOption } from 'weeljack-ng';
import { WjField } from 'weeljack-ng/field';
import { WjListbox } from 'weeljack-ng/listbox';

@Component({
  selector: 'docs-listbox-reactive-form-example',
  imports: [ReactiveFormsModule, WjField, WjListbox],
  template: `
    <wj-field label="Email notifications">
      <wj-listbox [formControl]="frequency" [options]="frequencies" />
    </wj-field>
    <p class="state">Form value: {{ frequency.value ?? 'none' }}</p>
  `,
  styles: `
    :host {
      display: grid;
      gap: 8px;
      inline-size: min(100%, 24rem);
    }

    .state {
      margin: 0;
      font-size: 0.875rem;
      color: var(--wj-text-muted-color);
    }
  `,
})
export class ListboxReactiveFormExample {
  protected readonly frequencies: WjOption<string>[] = [
    { label: 'Instantly', value: 'instantly' },
    { label: 'Every hour', value: 'hourly' },
    { label: 'Once a day', value: 'daily' },
    { label: 'Once a week', value: 'weekly' },
    { label: 'Never', value: 'never' },
  ];
  protected readonly frequency = new FormControl<string | null>('weekly');
}
