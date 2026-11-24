import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { WjButton } from 'weeljack-ng/button';
import { WjField } from 'weeljack-ng/field';
import { WjInputText } from 'weeljack-ng/inputtext';
import { WjSheet } from 'weeljack-ng/sheet';

@Component({
  selector: 'docs-sheet-basic-example',
  imports: [FormsModule, WjButton, WjField, WjInputText, WjSheet],
  template: `
    <div class="row">
      <wj-button label="Rename" (click)="visible.set(true)" />
    </div>
    <!-- ngSkipHydration: the server renders drawer mode, and a wide browser switches to dialog
         mode, so this host is rendered again in the browser. -->
    <wj-sheet ngSkipHydration [(visible)]="visible" header="Rename item">
      <wj-field label="Name">
        <input wjInputText autocomplete="off" [(ngModel)]="name" />
      </wj-field>
      <wj-button
        wjSheetFooter
        label="Cancel"
        severity="secondary"
        variant="outlined"
        (click)="visible.set(false)"
      />
      <wj-button wjSheetFooter label="Save" (click)="visible.set(false)" />
    </wj-sheet>
  `,
  styles: `
    .row {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
  `,
})
export class SheetBasicExample {
  protected readonly visible = signal(false);
  protected readonly name = signal('Quarterly report');
}
