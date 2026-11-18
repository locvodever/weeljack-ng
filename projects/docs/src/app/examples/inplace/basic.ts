import { Component, signal } from '@angular/core';
import { WjButton } from 'weeljack-ng/button';
import { WjInplace, WjInplaceContentSlot, WjInplaceDisplaySlot } from 'weeljack-ng/inplace';
import { WjInputText } from 'weeljack-ng/inputtext';

@Component({
  selector: 'docs-inplace-basic-example',
  imports: [WjInplace, WjInplaceDisplaySlot, WjInplaceContentSlot, WjInputText, WjButton],
  template: `
    <label class="caption" id="inplace-basic-label" for="inplace-basic-input">Display name</label>
    <wj-inplace ariaLabelledBy="inplace-basic-label inplace-basic-value">
      <ng-template wjInplaceDisplay>
        <span id="inplace-basic-value">
          @if (name()) {
            {{ name() }}
          } @else {
            <span class="muted">Add a display name</span>
          }
        </span>
      </ng-template>
      <ng-template wjInplaceContent let-close="close">
        <div class="editor">
          <input
            #field
            wjInputText
            id="inplace-basic-input"
            type="text"
            [value]="name()"
            (keydown.enter)="save(field.value); close()"
            (keydown.escape)="close()"
          />
          <wj-button label="Save" (click)="save(field.value); close()" />
        </div>
      </ng-template>
    </wj-inplace>
  `,
  styles: `
    :host {
      display: block;
      max-inline-size: 40rem;
    }

    .caption {
      display: block;
      margin-block-end: 8px;
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--wj-text-color);
    }

    .muted {
      color: var(--wj-text-muted-color);
    }

    .editor {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
  `,
})
export class InplaceBasicExample {
  protected readonly name = signal('Mara Ellis');

  protected save(value: string): void {
    this.name.set(value.trim());
  }
}
