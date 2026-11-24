import { Component, signal } from '@angular/core';
import type { WjOption } from 'weeljack-ng';
import { WjSelectButton } from 'weeljack-ng/selectbutton';

@Component({
  selector: 'docs-selectbutton-basic-example',
  imports: [WjSelectButton],
  template: `
    <span id="basic-view">Calendar view</span>
    <wj-selectbutton ariaLabelledBy="basic-view" [options]="views" [(value)]="view" />
    <p class="state">Picked: {{ view() ?? 'nothing' }}</p>
  `,
  styles: `
    :host {
      display: grid;
      justify-items: start;
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
export class SelectButtonBasicExample {
  protected readonly views: WjOption<string>[] = [
    { label: 'Day', value: 'day' },
    { label: 'Week', value: 'week' },
    { label: 'Month', value: 'month' },
  ];
  protected readonly view = signal<string | null>(null);
}
