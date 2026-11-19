import {
  Component,
  ElementRef,
  booleanAttribute,
  computed,
  inject,
  input,
  model,
  viewChild,
} from '@angular/core';
import { NG_VALUE_ACCESSOR, type ControlValueAccessor } from '@angular/forms';
import { Rating } from '@openng/optimus-ui/rating';
import {
  _bridgeAccessor,
  type _AccessorHost,
  _mergePartAttributes,
  _registerWithField,
  _touchedOnLeave,
} from 'weeljack-ng/private';
import type { WjRatingPt } from './rating-types';

/**
 * A star rating over Optimus's `p-rating`: a row of `stars` stars, each a visually hidden radio
 * button. A click on a star rates that many; a click on the current star, or Backspace or Delete on
 * a focused star, clears the rating. Bind
 * `[(value)]`, or use `ngModel`, a `FormControl` or `[formField]`: it is its own value accessor,
 * and `value` is the number of stars picked (`null` while none is).
 *
 * The row is a `radiogroup`. Name it with `ariaLabelledBy` (the id of a visible text) or
 * `ariaLabel`; inside a `wj-field` the field's label names it, and the field describes it and marks
 * it invalid. The group is not focusable itself, so a click on the field's label does not move
 * focus. The row is touched when focus leaves it, not when focus moves between stars. Optimus
 * paints no invalid look on a rating.
 */
@Component({
  selector: 'wj-rating',
  imports: [Rating],
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: WjRating, multi: true }],
  host: { '(focusout)': 'leave($event)' },
  templateUrl: './rating.html',
  styleUrl: './rating.css',
})
export class WjRating implements ControlValueAccessor {
  /** The number of stars picked, `null` while none is. Two-way: `[(value)]`. */
  readonly value = model<number | null>(null);
  /** How many stars the row has. Read when the rating is created. */
  readonly stars = input(5);
  /** Keeps the look and the focus, and never changes the value. A form can set it too. */
  readonly readonly = input(false, { transform: booleanAttribute });
  /** Makes the rating inert. A form can disable it too. */
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Marks the group `aria-required`. */
  readonly required = input(false, { transform: booleanAttribute });
  /**
   * Sets `aria-invalid` on the group. Inside a `wj-field` the field's error state is shown instead.
   */
  readonly invalid = input(false, { transform: booleanAttribute });
  /** Accessible name when there is no visible label. Set on the group. */
  readonly ariaLabel = input<string>();
  /**
   * Id of the element that names the group. Set on the group. Inside a `wj-field` it defaults to
   * the field's label; a value set here wins.
   */
  readonly ariaLabelledBy = input<string>();
  /** Id of the element that describes the group. Set on the group. */
  readonly ariaDescribedBy = input<string>();
  /**
   * Pass-through for the rating's parts. Tracks Optimus: its part names and attributes follow the
   * installed `@openng/optimus-ui` minor and are outside this component's stable API; changes to
   * them ship only in the release that takes a new Optimus minor and are not breaking.
   */
  readonly pt = input<WjRatingPt>();

  private readonly inner = viewChild(Rating);
  protected readonly isDisabled = _bridgeAccessor(
    this,
    'wj-rating',
    this.value,
    this.inner,
    this.disabled,
  );
  protected readonly field: ReturnType<typeof _registerWithField> = _registerWithField({
    entry: 'rating',
    // No single element takes focus, so no `inputId` and no `<label for>`: the stars are the radios.
    id: () => undefined,
    describedBy: this.ariaDescribedBy,
    labelledBy: this.ariaLabelledBy,
    invalid: this.invalid,
    labelable: false,
  });

  /**
   * `pt` forwarded as given, plus what this wrapper routes onto Optimus's root, which binds
   * none of it: the group's role, its id (inside a field), its name, its description,
   * `aria-invalid`, and `aria-required` and `aria-readonly` while they hold.
   */
  protected readonly partAttributes = computed<WjRatingPt>(() =>
    _mergePartAttributes(this.pt(), 'root', {
      role: 'radiogroup',
      id: this.field.id(),
      'aria-label': this.ariaLabel(),
      'aria-labelledby': this.field.labelledBy(),
      'aria-describedby': this.field.describedBy(),
      'aria-invalid': this.field.invalid() ? 'true' : undefined,
      'aria-required': this.required() ? 'true' : undefined,
      'aria-readonly': this.readonly() ? 'true' : undefined,
    }),
  );

  /** Touched on blur: focus has left the host, rather than moved between its stars. */
  protected readonly leave = _touchedOnLeave(this.inner);

  constructor() {
    const host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    /** The 1-based star a hidden radio belongs to, as Optimus counts them. */
    const starOf = (radio: HTMLInputElement): number =>
      [...host.querySelectorAll('input')].indexOf(radio) + 1;
    // Two listeners on Optimus's hidden radios, both fixing what Optimus's own handlers get wrong
    // for a keyboard (FR-28). The click one is capture phase, so it runs before Optimus's click
    // handler on the star's box. A key on a star makes the browser click its hidden radio, and that
    // click bubbles into the box's `(click)`, a second pick on top of the radio's own `change`.
    // Optimus's focus handler has just set the focused star to this one, and a pick of the focused
    // star clears, so the box's click cleared the rating (an emitted `null`) before `change` picked
    // the star again. The click is stopped here, and the focused star reset so the `change` picks
    // once; on the picked star no `change` follows, so the reset is skipped and the click does
    // nothing. With `readonly` the click is cancelled, which puts the radio's checked state back.
    host.addEventListener(
      'click',
      (event) => {
        const radio = event.target;
        const rating = this.inner();
        if (rating && radio instanceof HTMLInputElement) {
          event.stopPropagation();
          if (this.readonly()) {
            event.preventDefault();
          } else if (rating.value !== starOf(radio)) {
            rating.focusedOptionIndex.set(-1);
          }
        }
      },
      true,
    );
    // Optimus draws its focus ring from the focused star, which its focus handler records only
    // while the rating is not read-only: a read-only rating took focus with no ring. Optimus's
    // blur handler clears it again.
    host.addEventListener('focusin', (event) => {
      const radio = event.target;
      if (this.readonly() && radio instanceof HTMLInputElement) {
        this.inner()?.focusedOptionIndex.set(starOf(radio));
      }
    });
    // Backspace and Delete on a star clear the rating, as a click on the current star does. Optimus
    // binds no key for it. Its pick of the current value emits `null` and resets the focused star,
    // which is put back so the ring stays on the star that has focus.
    host.addEventListener('keydown', (event) => {
      const radio = event.target;
      const rating = this.inner();
      if (
        rating &&
        radio instanceof HTMLInputElement &&
        (event.key === 'Backspace' || event.key === 'Delete') &&
        !this.readonly() &&
        !this.isDisabled() &&
        rating.value
      ) {
        event.preventDefault();
        rating.onOptionSelect(event, rating.value);
        rating.focusedOptionIndex.set(starOf(radio));
      }
    });
  }

  declare registerOnChange: _AccessorHost<number | null>['registerOnChange'];
  declare registerOnTouched: _AccessorHost<number | null>['registerOnTouched'];
  declare setDisabledState: _AccessorHost<number | null>['setDisabledState'];

  writeValue(value: number | null): void {
    this.value.set(value ?? null);
  }
}
