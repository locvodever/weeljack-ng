import { Component, signal } from '@angular/core';
import type { WjMenuItem, WjMenuItemCommandEvent } from 'weeljack-ng';
import { WjContextMenu } from 'weeljack-ng/contextmenu';

@Component({
  selector: 'docs-contextmenu-target-example',
  imports: [WjContextMenu],
  template: `
    <div #region class="region" role="group" aria-label="report.pdf" tabindex="0">
      <span class="name">report.pdf</span>
      <span class="hint">Right-click, or focus and press Shift+F10</span>
    </div>
    <wj-contextmenu [target]="region" [model]="items" ariaLabel="report.pdf" />
    <p class="status" role="status">{{ status() }}</p>
  `,
  styles: `
    :host {
      display: block;
      max-inline-size: 24rem;
    }

    .region {
      display: grid;
      gap: 4px;
      padding: 24px;
      border: 1px dashed var(--wj-content-border-color);
      border-radius: 12px;
    }

    .region:focus-visible {
      outline: var(--wj-focus-ring-width, 2px) var(--wj-focus-ring-style, solid)
        var(--wj-focus-ring-color);
      outline-offset: var(--wj-focus-ring-offset, 2px);
    }

    .hint,
    .status {
      font-size: 0.875rem;
      color: var(--wj-text-muted-color);
    }

    .status {
      margin: 8px 0 0;
    }
  `,
})
export class ContextMenuTargetExample {
  protected readonly status = signal('No command yet');

  /** `event.item` is the very object in `items`: the same reference, not a copy. */
  private readonly run = (event: WjMenuItemCommandEvent): void => {
    this.status.set(`Last command: ${event.item.label ?? ''}`);
  };

  protected readonly items: WjMenuItem[] = [
    { label: 'Open', command: this.run },
    { label: 'Rename…', command: this.run },
    { label: 'Duplicate', command: this.run },
    {
      label: 'Share',
      items: [
        { label: 'Copy link', command: this.run },
        { label: 'Email…', command: this.run },
      ],
    },
    { separator: true },
    { label: 'Delete', command: this.run },
  ];
}
