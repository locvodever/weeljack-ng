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
import { InputText } from '@openng/optimus-ui/inputtext';
import { _checkWeeljackSetup, _registerWithField } from 'weeljack-ng/private';

/**
 * A text input over Optimus's `pInputText`: the native `input` element, 44 px tall by default,
 * with the invalid, disabled and focus looks of the default look. It adds no value accessor, so
 * `ngModel`, `FormControl` and `[formField]` bind to the native one. `id`, `type`, `name`,
 * `placeholder`, `disabled`, `required` and `aria-*` stay native attributes.
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
  selector: 'input[wjInputText]',
  // Optimus's `pInputTextPT` cannot be aliased to `pt` (NG2018): the base class already has a
  // public `pt`. That inherited input is read before `pInputTextPT`, so it is exposed as is.
  hostDirectives: [{ directive: InputText, inputs: ['pSize: size', 'pt'] }],
  host: {
    // The host directive's own `invalid` input is not reachable from here, so its class is set
    // directly. The spec asserts the invalid border colour, so an Optimus rename fails there.
    '[class.p-invalid]': 'field.invalid()',
    '[attr.aria-invalid]': 'field.invalid() ? "true" : null',
  },
})
export class WjInputText {
  /**
   * Shows the invalid look and `aria-invalid`. Inside a `wj-field` the field's error state is
   * shown instead, so a `[formField]` input does not turn red before it is touched.
   */
  readonly invalid = input(false, { transform: booleanAttribute });

  private readonly staticAttribute = (name: string): string | undefined =>
    inject(new HostAttributeToken(name), { optional: true }) ?? undefined;

  protected readonly field: ReturnType<typeof _registerWithField> = _registerWithField({
    entry: 'inputtext',
    id: signal(this.staticAttribute('id')),
    describedBy: signal(this.staticAttribute('aria-describedby')),
    labelledBy: signal(undefined),
    invalid: this.invalid,
    labelable: true,
    inline: false,
  });

  constructor() {
    _checkWeeljackSetup('input[wjInputText]');

    if (this.field.inField) {
      const element = inject<ElementRef<HTMLInputElement>>(ElementRef).nativeElement;
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
