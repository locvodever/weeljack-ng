import { Component, signal } from '@angular/core';
import { WjButton } from 'weeljack-ng/button';
import {
  WjToolbar,
  WjToolbarCenterSlot,
  WjToolbarEndSlot,
  WjToolbarStartSlot,
} from 'weeljack-ng/toolbar';

@Component({
  selector: 'docs-toolbar-sections-example',
  imports: [WjToolbar, WjToolbarStartSlot, WjToolbarCenterSlot, WjToolbarEndSlot, WjButton],
  template: `
    <wj-toolbar ariaLabel="Document">
      <ng-template wjToolbarStart>
        <wj-button
          label="New"
          size="small"
          severity="secondary"
          variant="text"
          (click)="last.set('New')"
        />
        <wj-button
          label="Open"
          size="small"
          severity="secondary"
          variant="text"
          (click)="last.set('Open')"
        />
      </ng-template>
      <ng-template wjToolbarCenter>
        <wj-button
          label="Undo"
          size="small"
          severity="secondary"
          variant="text"
          (click)="last.set('Undo')"
        />
        <wj-button
          label="Redo"
          size="small"
          severity="secondary"
          variant="text"
          (click)="last.set('Redo')"
        />
      </ng-template>
      <ng-template wjToolbarEnd>
        <wj-button
          label="Share"
          size="small"
          severity="secondary"
          variant="outlined"
          (click)="last.set('Share')"
        />
        <wj-button label="Save" size="small" (click)="last.set('Save')" />
      </ng-template>
    </wj-toolbar>
    <p class="state" role="status">{{ last() ? 'Last action: ' + last() : 'No action yet' }}</p>
  `,
  styles: `
    :host {
      display: block;
    }

    .state {
      margin: 8px 0 0;
      font-size: 0.875rem;
      color: var(--wj-text-muted-color);
    }
  `,
})
export class ToolbarSectionsExample {
  protected readonly last = signal<string | undefined>(undefined);
}
