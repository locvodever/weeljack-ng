import {
  Directive,
  ElementRef,
  HostAttributeToken,
  booleanAttribute,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { NgControl } from '@angular/forms';
import { Textarea } from '@openng/optimus-ui/textarea';
import { _checkWeeljackSetup, _registerWithField } from 'weeljack-ng/private';

/**
 * A multi-line text input over Optimus's `pTextarea`: the native `textarea` element with the
 * invalid, disabled and focus looks of the default look. Set its height with `rows`. It adds no
 * value accessor, so `ngModel`, `FormControl` and `[formField]` bind to the native one. `id`,
 * `name`, `rows`, `placeholder`, `disabled`, `required` and `aria-*` stay native attributes.
 *
 * Inside a `wj-field` it is named by the field's label, described by its hint and error, and
 * invalid exactly while the field shows an error. There it adopts a static `id` or gets a
 * generated one, and merges a static `aria-describedby` ahead of the field's ids. Outside a field
 * it writes none of that.
 *
 * `pt` is the pass-through for the part Optimus renders. It tracks Optimus: its part names and
 * attributes follow the installed `@openng/optimus-ui` minor and are outside this directive's
 * stable API; changes to them ship only in the release that takes a new Optimus minor and are not
 * breaking.
 */
@Directive({
  selector: 'textarea[wjTextarea]',
  // Optimus's `pTextareaPT` cannot be aliased to `pt` (NG2018): the base class already has a
  // public `pt`. That inherited input is read before `pTextareaPT`, so it is exposed as is.
  hostDirectives: [{ directive: Textarea, inputs: ['pSize: size', 'pt'] }],
  host: {
    // The host directive's own `invalid` input is not reachable from here, so its class is set
    // directly. The spec asserts the invalid border colour, so an Optimus rename fails there.
    '[class.p-invalid]': 'field.invalid()',
    '[attr.aria-invalid]': 'field.invalid() ? "true" : null',
  },
})
export class WjTextarea {
  /**
   * Shows the invalid look and `aria-invalid`. Inside a `wj-field` the field's error state is
   * shown instead, so a `[formField]` textarea does not turn red before it is touched.
   */
  readonly invalid = input(false, { transform: booleanAttribute });

  private readonly staticAttribute = (name: string): string | undefined =>
    inject(new HostAttributeToken(name), { optional: true }) ?? undefined;

  protected readonly field: ReturnType<typeof _registerWithField> = _registerWithField({
    entry: 'textarea',
    id: signal(this.staticAttribute('id')),
    describedBy: signal(this.staticAttribute('aria-describedby')),
    labelledBy: signal(undefined),
    invalid: this.invalid,
    labelable: true,
    inline: false,
  });

  constructor() {
    _checkWeeljackSetup('textarea[wjTextarea]');

    // Optimus's Textarea subscribes to `ngControl.valueChanges` in ngOnInit, and the control that
    // `[formField]` provides has none, so it throws. Give that control an empty stream: Optimus
    // re-reads the value on every view check anyway. `ngModel` and `FormControl` already have one.
    const control = inject(NgControl, { optional: true, self: true });
    if (control && !('valueChanges' in control && control.valueChanges)) {
      Object.defineProperty(control, 'valueChanges', {
        value: { subscribe: () => ({ unsubscribe: () => undefined }) },
      });
    }

    if (this.field.inField) {
      const element = inject<ElementRef<HTMLTextAreaElement>>(ElementRef).nativeElement;
      const write = (name: string, value: string | undefined): void => {
        if (value === undefined) {
          element.removeAttribute(name);
        } else {
          element.setAttribute(name, value);
        }
      };
      effect(() => {
        write('id', this.field.id());
        write('aria-describedby', this.field.describedBy());
      });
    }
  }
}
