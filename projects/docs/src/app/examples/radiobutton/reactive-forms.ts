import { Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { WjField } from 'weeljack-ng/field';
import { WjRadioButton } from 'weeljack-ng/radiobutton';

@Component({
  selector: 'docs-radiobutton-reactive-forms-example',
  imports: [ReactiveFormsModule, WjField, WjRadioButton],
  template: `
    <form [formGroup]="order">
      <wj-field label="Cup size">
        <div class="options">
          <label for="reactive-size-small">
            <wj-radiobutton
              inputId="reactive-size-small"
              name="reactive-size"
              option="small"
              formControlName="size"
            />
            Small
          </label>
          <label for="reactive-size-medium">
            <wj-radiobutton
              inputId="reactive-size-medium"
              name="reactive-size"
              option="medium"
              formControlName="size"
            />
            Medium
          </label>
          <label for="reactive-size-large">
            <wj-radiobutton
              inputId="reactive-size-large"
              name="reactive-size"
              option="large"
              formControlName="size"
            />
            Large
          </label>
        </div>
      </wj-field>
    </form>
    <p class="state">Form value: {{ order.controls.size.value ?? 'none' }}</p>
  `,
  styles: `
    :host {
      display: grid;
      gap: 8px;
      inline-size: min(100%, 24rem);
    }

    .options {
      display: grid;
      gap: 8px;
    }

    label {
      display: flex;
      align-items: start;
      gap: 8px;
      line-height: 24px;
    }

    .state {
      margin: 0;
      font-size: 0.875rem;
      color: var(--wj-text-muted-color);
    }
  `,
})
export class RadioButtonReactiveFormsExample {
  protected readonly order = new FormGroup({
    size: new FormControl<string | null>('medium'),
  });
}
