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
import { InputMaskDirective } from '@openng/optimus-ui/inputmask';
import { InputText } from '@openng/optimus-ui/inputtext';
import { _checkWeeljackSetup, _registerWithField } from 'weeljack-ng/private';

/**
 * A masked text input over Optimus's `pInputMask` and `pInputText`: the native `input` element,
 * styled like `wjInputText`, that shapes what is typed. The mask is the `wjInputMask` value: `9` is
 * a digit, `a` a letter, `*` either, `?` makes the rest optional, and anything else is a literal.
 * It adds no value accessor, so `ngModel`, `FormControl` and `[formField]` bind to the native one.
 * Optimus dispatches an `input` event after every masked change, so the form holds the masked
 * text, slot characters included while the mask is incomplete. A value the form writes is shown
 * as written, and is masked on the next input, focus or blur. `id`, `type`, `name`, `placeholder`,
 * `disabled`, `required` and `aria-*` stay native attributes.
 *
 * Inside a `wj-field` it is named by the field's label, described by its hint and error, and
 * invalid exactly while the field shows an error. There it adopts a static `id` or gets a
 * generated one, and merges a static `aria-describedby` ahead of the field's ids. Outside a field
 * it writes none of that.
 *
 * Outputs: `completed` emits once every required slot of the mask is filled, and `unmaskedChange`
 * emits the typed characters without literals or slot characters after every change.
 *
 * Never combine it with `wjInputText` on one element: both compose Optimus's `InputText`.
 *
 * `pt` is the pass-through for the part Optimus renders. It tracks Optimus: its part names and
 * attributes follow the installed `@openng/optimus-ui` minor and are outside this directive's
 * stable API; changes to them ship only in the release that takes a new Optimus minor and are not
 * breaking.
 */
@Directive({
  selector: 'input[wjInputMask]',
  // `pt` is the inherited input, as in `wjInputText` (an alias fails with NG2018). Optimus's two
  // outputs are exposed under their public names (`onComplete` is the alias of `onCompleteEvent`),
  // renamed to `completed` and `unmaskedChange`.
  hostDirectives: [
    { directive: InputText, inputs: ['pSize: size', 'pt'] },
    {
      directive: InputMaskDirective,
      inputs: ['pInputMask: wjInputMask', 'slotChar', 'autoClear'],
      // eslint-disable-next-line @angular-eslint/no-output-on-prefix -- Optimus's public names; the exposed names are completed and unmaskedChange
      outputs: ['onComplete: completed', 'onUnmaskedChange: unmaskedChange'],
    },
  ],
  host: {
    // A bound `[wjInputMask]` leaves no attribute in the DOM, and the harness (and a consumer's
    // CSS) finds the input by `input[wjInputMask]`. A static attribute in the template wins.
    wjInputMask: '',
    // The composed `InputText`'s own `invalid` input is not reachable from here, so its class is
    // set directly. The spec asserts the invalid border colour, so an Optimus rename fails there.
    '[class.p-invalid]': 'field.invalid()',
    '[attr.aria-invalid]': 'field.invalid() ? "true" : null',
  },
})
export class WjInputMask {
  /**
   * Shows the invalid look and `aria-invalid`. Inside a `wj-field` the field's error state is
   * shown instead, so a `[formField]` input does not turn red before it is touched.
   */
  readonly invalid = input(false, { transform: booleanAttribute });

  private readonly staticAttribute = (name: string): string | undefined =>
    inject(new HostAttributeToken(name), { optional: true }) ?? undefined;

  protected readonly field: ReturnType<typeof _registerWithField> = _registerWithField({
    entry: 'inputmask',
    id: signal(this.staticAttribute('id')),
    describedBy: signal(this.staticAttribute('aria-describedby')),
    labelledBy: signal(undefined),
    invalid: this.invalid,
    labelable: true,
    inline: false,
  });

  constructor() {
    _checkWeeljackSetup('input[wjInputMask]');

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
