import {
  Component,
  DOCUMENT,
  Injector,
  computed,
  contentChild,
  effect,
  inject,
  input,
  runInInjectionContext,
  signal,
} from '@angular/core';
import { FORM_FIELD } from '@angular/forms/signals';
import {
  _checkWeeljackSetup,
  _warnOnce,
  _wjId,
  _WJ_FIELD_CONTEXT,
  type _WjFieldContext,
  type _WjFieldControl,
} from 'weeljack-ng/private';

/** A signal-forms error carries no `message`, so the field can show the invalid state only. */
const WJ0020 = 'WJ0020';

/**
 * A label, a hint and an error around one form control. It names the control, describes it and
 * marks it invalid: the control reads all of that from the field it sits in, so nothing is wired
 * by hand. Project a WeeljackNg form control as the content, or several as a group; a native
 * control or a custom one is a group of zero and gets no wiring, so name it yourself.
 *
 * Size the field, not the control: a control with no width of its own fills the field's width.
 * `label`, `hint` and `error` are rendered as text, never as HTML.
 */
@Component({
  selector: 'wj-field',
  templateUrl: './field.html',
  styleUrl: './field.css',
  providers: [{ provide: _WJ_FIELD_CONTEXT, useExisting: WjField }],
  host: {
    '[attr.role]': 'group() ? "group" : null',
    '[attr.aria-labelledby]': 'group() ? labelId : null',
    '[attr.aria-describedby]': 'group() ? groupDescribedBy() : null',
    '(click)': 'focusControl($event)',
  },
})
export class WjField implements _WjFieldContext {
  /** The visible name of the control, or of the group of controls. Rendered as text. */
  readonly label = input.required<string>();
  /** A short instruction shown under the label. An empty string shows none. Rendered as text. */
  readonly hint = input<string>();
  /**
   * The error message. While it is not empty the field is invalid and the message is announced.
   * Leave it empty to let a signal-forms `[formField]` inside the field supply the error once the
   * field is touched.
   */
  readonly error = input<string>();

  /** @docs-private */
  readonly labelId = _wjId('field-label');
  protected readonly hintElementId = _wjId('field-hint');
  protected readonly errorElementId = _wjId('field-error');

  private readonly controls = signal<readonly _WjFieldControl[]>([]);
  private readonly formField = contentChild(FORM_FIELD);
  private readonly document = inject(DOCUMENT);

  /** The first signal-forms error, once the field is touched (`submit()` touches every field). */
  private readonly formError = computed(() => {
    const state = this.formField()?.state();
    return state?.touched() === true ? state.errors()[0] : undefined;
  });

  protected readonly errorText = computed(() => {
    const own = this.error();
    return own !== undefined && own !== '' ? own : (this.formError()?.message ?? '');
  });
  /** @docs-private */
  readonly invalid = computed(() => this.errorText() !== '' || this.formError() !== undefined);
  /** @docs-private */
  readonly hintId = computed(() => (this.hint() ? this.hintElementId : undefined));
  /** @docs-private */
  readonly errorId = computed(() => (this.errorText() ? this.errorElementId : undefined));

  /** The one registered control, or `undefined` for a group (none, or several). */
  private readonly single = computed(() => {
    const [only, ...rest] = this.controls();
    return rest.length === 0 ? only : undefined;
  });
  protected readonly group = computed(() => this.single() === undefined);
  protected readonly inline = computed(() => this.single()?.inline === true);
  /** The id `<label for>` points at, when the one control can be labelled that way. */
  protected readonly labelFor = computed(() => {
    const only = this.single();
    return only?.labelable === true ? only.id() : undefined;
  });
  protected readonly groupDescribedBy = computed(
    () => [this.hintId(), this.errorId()].filter(Boolean).join(' ') || null,
  );

  constructor() {
    _checkWeeljackSetup('wj-field');
    const injector = inject(Injector);
    effect(() => {
      if (this.invalid() && !this.errorText()) {
        runInInjectionContext(injector, () => {
          _warnOnce(
            WJ0020,
            'wj-field',
            'a signal-forms error has no message, so the field is invalid but shows no text',
            'Give the validator a message, or set the error input',
          );
        });
      }
    });
  }

  /** @docs-private */
  register(control: _WjFieldControl): () => void {
    this.controls.update((all) => [...all, control]);
    return () => {
      this.controls.update((all) => all.filter((other) => other !== control));
    };
  }

  /** A click on a label `<label for>` cannot serve (a span) moves focus to the one control. */
  protected focusControl(event: Event): void {
    const only = this.single();
    if (only?.labelable === false && event.target instanceof Element) {
      if (event.target.id === this.labelId) {
        this.document.getElementById(only.id())?.focus();
      }
    }
  }
}
