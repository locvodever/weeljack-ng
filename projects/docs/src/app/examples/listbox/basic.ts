import { Component, signal } from '@angular/core';
import type { WjOption } from 'weeljack-ng';
import { WjListbox } from 'weeljack-ng/listbox';

@Component({
  selector: 'docs-listbox-basic-example',
  imports: [WjListbox],
  template: `
    <span id="basic-frequency">Email notifications</span>
    <wj-listbox ariaLabelledBy="basic-frequency" [options]="frequencies" [(value)]="frequency" />
    <p class="state">Picked: {{ label() }}</p>
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
export class ListboxBasicExample {
  protected readonly frequencies: WjOption<string>[] = [
    { label: 'Instantly', value: 'instantly' },
    { label: 'Every hour', value: 'hourly' },
    { label: 'Once a day', value: 'daily' },
    { label: 'Once a week', value: 'weekly' },
    { label: 'Never', value: 'never' },
  ];
  protected readonly frequency = signal<string | null>(null);

  protected label(): string {
    return (
      this.frequencies.find((option) => option.value === this.frequency())?.label ?? 'nothing yet'
    );
  }
}
