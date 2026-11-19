import { RatingBasicExample } from '../../../examples/rating/basic';
import { RatingDisabledExample } from '../../../examples/rating/disabled';
import { RatingInAFieldExample } from '../../../examples/rating/in-a-field';
import { RatingReadOnlyExample } from '../../../examples/rating/read-only';
import type { ComponentDoc, MappingRow } from '../component-doc';

const droppedAlways = 'Never exposed on any wrapper (ADR 0002).';

const dropped = (optimus: string, note: string): MappingRow => ({
  optimus,
  weeljack: 'None',
  status: 'dropped',
  note,
});

export const DOC: ComponentDoc = {
  entry: 'rating',
  title: 'Rating',
  purpose:
    'A star rating: a row of `stars` stars (five by default), each a visually hidden radio button. Bind `value` two-way, or use `ngModel`, a `FormControl` or `[formField]`: `value` is the number of stars picked, a `number`, and `null` while none is. A click on a star rates that many, and a click on the current star clears the rating. The row is a `radiogroup`: name it with `ariaLabelledBy` or `ariaLabel`, or put it in a `wj-field`, whose label names it and whose hint and error describe it. Use `wj-slider` for a value on a range and `wj-selectbutton` for a choice between named options.',
  examples: [
    {
      title: 'Basic',
      description:
        'A visible text names the group through `ariaLabelledBy`. The rating starts empty: every star is an outline, and the first star takes focus on Tab. A click on a star rates that many, and a click on the current star clears the rating, and so do Backspace and Delete on a focused star. Arrow keys move to and pick the next or previous star.',
      sourceKey: 'rating/basic',
      component: RatingBasicExample,
    },
    {
      title: 'In a field',
      description:
        'Inside a `wj-field` the label, hint and error come from the field. The label is a `span`, so the field names the group through `aria-labelledby`, and the group gets an id. A click on the label does not move focus, because the group is not focusable itself. The first field shows a hint; the second shows a static error, which sets `aria-invalid` and shows the message: the rating itself paints no invalid look.',
      sourceKey: 'rating/in-a-field',
      component: RatingInAFieldExample,
    },
    {
      title: 'Read-only',
      description:
        'A read-only rating shows its value and keeps its look. It stays focusable, and the arrow keys move focus between the stars but never change the value. It has no hover, and the cursor is `not-allowed`. Use it for a value the user reads, such as an average.',
      sourceKey: 'rating/read-only',
      component: RatingReadOnlyExample,
    },
    {
      title: 'Disabled',
      description:
        'A disabled rating leaves the Tab order and ignores every key and click. Optimus dims it to 0.6 opacity and the filled stars stay, so the held value still shows: this one holds 3.',
      sourceKey: 'rating/disabled',
      component: RatingDisabledExample,
    },
    {
      title: 'Testing with the harness',
      description:
        'Import `WjRatingHarness` from `weeljack-ng/rating/testing` to read the value, rate N stars with a click, clear the rating by clicking the current star, read the star count and the star labels, check the disabled, read-only, required and invalid states, read the group’s id and ARIA attributes, and move focus into the rating and away, without touching the DOM. Find a rating by its `value`.',
      sourceKey: 'rating/testing',
      component: null,
    },
  ],
  keyboard: [
    {
      key: 'Tab, Shift+Tab',
      effect:
        'Move focus into the row at the picked star, or at the first star while none is picked, and out of it. The stars share one tab stop. A disabled rating is skipped. Focus draws the family’s 2 px ring around the focused star, after a key press and not after a click.',
    },
    {
      key: 'Arrow Right, Arrow Down',
      effect:
        'Pick the next star, and wrap from the last star to the first, as native radio buttons do. A read-only rating moves focus only.',
    },
    {
      key: 'Arrow Left, Arrow Up',
      effect:
        'Pick the previous star, and wrap from the first star to the last. A read-only rating moves focus only.',
    },
    {
      key: 'Space',
      effect:
        'Picks the focused star while it is not the picked one. On the picked star it does nothing.',
    },
    {
      key: 'Backspace, Delete',
      effect:
        'Clears the rating, as a click on the picked star does: the value becomes `null`. A read-only rating ignores them, and so does a rating that has no star picked.',
    },
    {
      key: 'Any key, while disabled',
      effect: 'The stars are not in the Tab order and do not react.',
    },
  ],
  aria: [
    'The row is Optimus’s root, which Optimus gives no role, so the stars would read as loose radio buttons. The component routes `role="radiogroup"` and the group’s name to it through `pt`: the field’s label, `ariaLabelledBy` or `ariaLabel`, with `aria-describedby`, `aria-invalid`, `aria-required` while `required` and `aria-readonly` while `readonly`. A routed attribute wins over the same attribute in your `pt`. An `aria-*` attribute on the host is not forwarded and raises `WJ0003` in development.',
    'Each star is a native radio button with a visually hidden input and Optimus’s own label from the translation: “1 star”, “2 stars”, and so on (`vi`: “1 sao”, “2 sao”). Name the group for what is rated; a screen reader then says “Rate this recipe, radio group”, then “3 stars, radio button, checked, 3 of 5”.',
    'There is no `inputId`: no single element takes focus, and the group is not labelable. Inside a field the group gets a generated id, and the field’s label is a `span` that `aria-labelledby` points at. A consumer’s `ariaLabelledBy` wins over the field’s label.',
    'Inside a field, `aria-describedby` lists your own `ariaDescribedBy` ids first, then the hint, then the error, without duplicates. The group sets `aria-invalid="true"` exactly while the field shows an error, so the `invalid` input is not shown there.',
    'The group is touched, for `ngModel`, `FormControl` and `[formField]`, when focus leaves it: a `focusout` on the host whose `relatedTarget` is outside the host. Moving between the stars marks nothing. Optimus also marks the control touched on every pick, so a click on a star, or an arrow key that picks one, touches the control while focus is still inside.',
    'Keys work as native radio buttons do, with Optimus’s handlers on top, and Optimus gets two of them wrong. A key on a star makes the browser click its hidden radio, and that click reached the star’s own click handler as well as the radio’s `change`. Optimus had just marked the star as focused, and a pick of the focused star clears, so every arrow key (and Space) first cleared the rating, emitting `null`, and then picked the star again: the final value was right, but a form saw `null` in between. The component stops that click before it reaches Optimus, so each key picks once. Optimus also draws its focus ring from the same marker, which it records only while the rating is not read-only, so a read-only rating took focus with no ring: the component records it too. With `readonly` the click is also cancelled, so the radio does not stay checked on a star the value does not hold.',
    'Gap, fixed: no key cleared a rating. A click on the current star does, as Optimus designed it, but Space on the picked star does nothing, so a keyboard user could change a rating and never remove it. `wj-rating` now clears it on Backspace and Delete on a focused star, with the same result as the click (`null` in the model, `valueChange` and the form). Space and Enter on the picked star still do nothing.',
    'Gap: a click on a field’s label does not move focus. The group is not focusable, and `<label for>` cannot name a group of radios, so the label only names it. A click on the label does nothing.',
    'Gap, fixed: while a rating is invalid (`invalid`, or a field’s error), the stars that are not picked turn the invalid colour (4.83:1 on cards in light, 6.40:1 in dark) and the picked stars stay the primary, so the value still reads. Optimus 2.0.2 styles an invalid star through a token that no theme defines, so the preset’s `@layer wj` rule keys on `aria-invalid`. Still pair the rating with the field’s error text, which is how the Basic and In a field examples show it.',
    'Gap: in dark mode the filled and the outline star differ by 2.46:1 in colour (4.12:1 in light). The shape carries the value, a filled star against an outline star, so the rating does not rely on colour alone and meets WCAG 1.4.11; the off star against the page is 6.91:1 and the on star 16.97:1. If colour should carry it too, a dark off star in `surface.500` reads 3.67:1 on cards and 4.63:1 against the on star, a one-line change in the preset.',
    'Gap: `stars` is read when the rating is created. Optimus builds its row of stars once, so a later change to `stars` shows no new stars. Set it before the rating renders, or recreate the rating, for example with `@if`.',
    'The stars are 24 px, in 24 px hit boxes 4 px apart. The off star is `text.muted.color` and the on star the primary colour, 4.83:1 and 19.90:1 on cards in light, 6.91:1 and 16.97:1 in dark.',
    'The keyboard walk and the screen-reader pass (NVDA with Chrome) are recorded on this page before `0.2.0`.',
  ],
  stylingIntro:
    'Colours, radius and the focus ring come from the `--wj-*` variables that `provideWeeljack` emits. The preset’s `rating` token sets the star at `1.5rem`, so each star is a 24 px hit box; the off star is `text.muted.color` and the on star the primary colour, and hovering darkens the hovered star only. Everything else about the row is Aura’s. The host is an inline-flex box that sizes to its row of stars; inside a field it sits at the start. For anything else, `pt` reaches the parts of the Optimus rating underneath: `root` is the group, `option` is each star’s box, `onIcon` and `offIcon` are the filled and the outline star, and `hiddenOptionInput` is each star’s native radio. It tracks Optimus 2.0: part names and attributes follow the installed `@openng/optimus-ui` minor and are outside the stable API of `wj-rating`. Changes to them ship only in the release that takes a new Optimus minor, and are not breaking. `pt` attributes on `root` lose to `role`, `id`, `aria-label`, `aria-labelledby`, `aria-describedby`, `aria-invalid`, `aria-required` and `aria-readonly`, which the component routes there while they have a value. The function form of `pt` and a function per part both work.',
  parts: [
    {
      part: 'root',
      description:
        'The row: Optimus’s root element, which the component gives `role="radiogroup"`, the group’s name, its id inside a field, and the description, invalid, required and read-only attributes.',
    },
    { part: 'option', description: 'Each star’s box: the click target, with the focus ring.' },
    { part: 'onIcon', description: 'A filled star, one for each star up to the value.' },
    { part: 'offIcon', description: 'An outline star, one for each star past the value.' },
    {
      part: 'hiddenOptionInput',
      description:
        'Each star’s native radio button, visually hidden: where focus, the checked state and the star’s label live.',
    },
  ],
  optimusSelector: 'p-rating',
  mapping: [
    {
      optimus: 'CVA `modelValue`',
      weeljack: 'value',
      status: 'added',
      note: 'A `model<number | null>(null)`: the number of stars picked, two-way as `[(value)]`. `null` for none.',
    },
    {
      optimus: 'onRate',
      weeljack: 'valueChange',
      status: 'renamed',
      note: 'The model’s output. It fires once per pick, and also with `null` when a click on the current star clears the rating.',
    },
    {
      optimus: 'stars',
      weeljack: 'stars',
      status: 'kept',
      note: 'Default 5. Read when the rating is created.',
    },
    {
      optimus: 'readonly',
      weeljack: 'readonly',
      status: 'kept',
      note: 'Angular’s form-state name, and what `[formField]` pushes. Accepts a bare attribute. Routed as `aria-readonly` too.',
    },
    {
      optimus: 'disabled, required, invalid',
      weeljack: 'disabled, required, invalid',
      status: 'kept',
      note: 'Accept a bare attribute. A form can disable it too, and a field drives `invalid` inside. Required and invalid are routed as `aria-required` and `aria-invalid`.',
    },
    {
      optimus: 'None',
      weeljack: 'ariaLabel, ariaLabelledBy, ariaDescribedBy',
      status: 'added',
      note: 'Routed to the group (the `root` part). Inside a field `ariaLabelledBy` defaults to the field’s label and `ariaDescribedBy` merges with the field’s hint and error.',
    },
    {
      optimus: 'pt',
      weeljack: 'pt',
      status: 'kept',
      note: 'Typed `WjRatingPt`. Tracks Optimus.',
    },
    {
      optimus: 'onFocus, onBlur',
      weeljack: 'focusin, focusout',
      status: 'renamed',
      note: 'No `on` outputs. Listen to the native events on the host.',
    },
    dropped(
      'iconOnClass, iconOnStyle, iconOffClass, iconOffStyle',
      'Always: style inputs are never exposed, and neither are icons.',
    ),
    dropped('#onicon, #officon', 'Icon slots are never exposed.'),
    dropped(
      'name, autofocus',
      'By need: Optimus generates the radios’ shared name, and a rating takes no autofocus.',
    ),
    dropped('dt, unstyled, ptOptions, RatingModule', droppedAlways),
  ],
};
