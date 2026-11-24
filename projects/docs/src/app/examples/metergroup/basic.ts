import { Component } from '@angular/core';
import { WjMeterGroup, type WjMeterItem } from 'weeljack-ng/metergroup';

@Component({
  selector: 'docs-metergroup-basic-example',
  imports: [WjMeterGroup],
  template: `
    <span id="storage-caption" class="caption">Storage</span>
    <wj-metergroup [value]="items" ariaLabelledBy="storage-caption" />
  `,
  styles: `
    /* One colour per position. Each passes 3:1 against the track and its neighbours, in both
       schemes; the app switches its own the way it switches schemes (here, the docs' dark class). */
    :host {
      --segment-1: var(--wj-sky-600);
      --segment-2: var(--wj-green-950);
      --segment-3: var(--wj-purple-500);

      display: grid;
      gap: 8px;
      max-inline-size: 40rem;
    }

    :host-context(.wj-dark) {
      --segment-1: var(--wj-sky-50);
      --segment-2: var(--wj-green-600);
      --segment-3: var(--wj-purple-50);
    }

    .caption {
      color: var(--wj-text-color);
      font-size: 0.875rem;
      font-weight: 600;
    }
  `,
})
export class MetergroupBasicExample {
  protected readonly items: WjMeterItem[] = [
    { label: 'Apps', value: 16, color: 'var(--segment-1)' },
    { label: 'Messages', value: 8, color: 'var(--segment-2)' },
    { label: 'Media', value: 24, color: 'var(--segment-3)' },
  ];
}
