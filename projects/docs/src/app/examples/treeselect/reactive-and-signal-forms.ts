import { Component, computed, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators, type AbstractControl } from '@angular/forms';
import { FormField, form, minLength, required } from '@angular/forms/signals';
import type { WjTreeNode } from 'weeljack-ng';
import { WjField } from 'weeljack-ng/field';
import { WjTreeSelect } from 'weeljack-ng/treeselect';

@Component({
  selector: 'docs-treeselect-reactive-and-signal-forms-example',
  imports: [FormField, ReactiveFormsModule, WjField, WjTreeSelect],
  template: `
    <div>
      <wj-field label="Department" [error]="departmentError()">
        <wj-treeselect
          placeholder="Select a department"
          [options]="departments"
          [formControl]="department"
        />
      </wj-field>
      <p class="state">{{ departmentState() }}</p>
    </div>
    <div>
      <wj-field label="Teams">
        <wj-treeselect
          selectionMode="multiple"
          placeholder="Select teams"
          [options]="teams"
          [formField]="request.teams"
        />
      </wj-field>
      <p class="state">{{ teamsState() }}</p>
    </div>
  `,
  styles: `
    :host {
      display: grid;
      gap: 16px;
      inline-size: min(100%, 24rem);
    }

    .state {
      margin: 0.5rem 0 0;
      color: var(--wj-text-muted-color);
      font-size: 0.875rem;
    }
  `,
})
export class TreeSelectReactiveAndSignalFormsExample {
  protected readonly departments: WjTreeNode[] = [
    {
      key: 'engineering',
      label: 'Engineering',
      children: [
        { key: 'engineering/platform', label: 'Platform' },
        { key: 'engineering/mobile', label: 'Mobile' },
        { key: 'engineering/data', label: 'Data' },
      ],
    },
    {
      key: 'design',
      label: 'Design',
      children: [
        { key: 'design/research', label: 'Research' },
        { key: 'design/visual', label: 'Visual' },
      ],
    },
    {
      key: 'operations',
      label: 'Operations',
      children: [
        { key: 'operations/finance', label: 'Finance' },
        { key: 'operations/people', label: 'People' },
      ],
    },
  ];
  /** Signal forms write an identity mark into the items of an array value: these are not frozen. */
  protected readonly teams: WjTreeNode[] = structuredClone(this.departments);
  /** A required control: a `null` reset reads as an empty array, which `required` rejects. */
  protected readonly department = new FormControl<WjTreeNode[] | null>(
    null,
    (control: AbstractControl) => Validators.required(control),
  );
  private readonly value = signal<{ teams: WjTreeNode[] }>({ teams: [] });
  /** `minLength` does for an array what `Validators.required` does: signal forms' `required` does not. */
  protected readonly request = form(this.value, (path) => {
    required(path.teams);
    minLength(path.teams, 1, { message: 'Choose a team.' });
  });

  protected readonly departmentState = computed(
    () => `Value: ${this.department.value?.[0]?.label ?? 'none'}`,
  );
  protected readonly teamsState = computed(
    () =>
      `Value: ${
        this.value()
          .teams.map((node) => node.label)
          .join(', ') || 'none'
      }`,
  );

  /** Empty until the control is touched, so the page loads clean. */
  protected departmentError(): string {
    return this.department.touched && this.department.invalid ? 'Choose a department.' : '';
  }
}
