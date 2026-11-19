import { Component, signal } from '@angular/core';
import { WjButton } from 'weeljack-ng/button';
import { WjField } from 'weeljack-ng/field';
import { WjInputText } from 'weeljack-ng/inputtext';
import { WjPopover } from 'weeljack-ng/popover';

@Component({
  selector: 'docs-popover-with-controls-example',
  imports: [WjButton, WjField, WjInputText, WjPopover],
  template: `
    <div class="row">
      <wj-button
        label="Rename"
        severity="secondary"
        variant="outlined"
        ariaHasPopup="dialog"
        [ariaExpanded]="open()"
        (click)="popover.toggle($event)"
      />
    </div>
    <p role="status" class="state">Name: {{ saved() }}</p>
    <wj-popover
      #popover
      ariaLabelledBy="rename-caption"
      (opened)="open.set(true)"
      (closed)="closed()"
    >
      <div class="content">
        <p id="rename-caption" class="caption">Rename item</p>
        <wj-field label="Name">
          <input wjInputText #name [value]="draft()" (input)="draft.set(name.value)" />
        </wj-field>
        <div class="actions">
          <wj-button label="Save" (click)="save(popover)" />
        </div>
      </div>
    </wj-popover>
  `,
  styles: `
    :host {
      display: grid;
      gap: 8px;
      justify-items: start;
    }

    .row {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .state {
      margin: 0;
      font-size: 0.875rem;
      color: var(--wj-text-muted-color);
    }

    .content {
      display: grid;
      gap: 8px;
      inline-size: min(18rem, 100vw - 4rem);
    }

    .caption {
      margin: 0;
      font-size: 0.875rem;
      font-weight: 600;
    }

    .actions {
      display: flex;
      justify-content: flex-end;
      margin-block-start: 4px;
    }
  `,
})
export class PopoverWithControlsExample {
  protected readonly open = signal(false);
  protected readonly saved = signal('Untitled');
  protected readonly draft = signal('Untitled');

  protected save(popover: WjPopover): void {
    this.saved.set(this.draft());
    // Focus goes back to the Rename button, and `closed` follows.
    popover.hide();
  }

  /** Escape, an outside click and Save all end here: an edit that was not saved is discarded. */
  protected closed(): void {
    this.open.set(false);
    this.draft.set(this.saved());
  }
}
