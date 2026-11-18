import { KeyFilterInAFieldExample } from '../../../examples/keyfilter/in-a-field';
import { KeyFilterNamedPatternsExample } from '../../../examples/keyfilter/named-patterns';
import { KeyFilterRegularExpressionExample } from '../../../examples/keyfilter/regular-expression';
import type { ComponentDoc, MappingRow } from '../component-doc';

const dropped = (optimus: string, note: string): MappingRow => ({
  optimus,
  weeljack: 'None',
  status: 'dropped',
  note,
});

export const DOC: ComponentDoc = {
  entry: 'keyfilter',
  title: 'Key filter',
  purpose:
    'An attribute for a native text input that blocks the characters it should not hold, such as letters in a quantity. It adds no look and no form control of its own, so it works on a plain input and beside the text input or the input mask.',
  optimusSelector: 'input[pKeyFilter]',
  examples: [
    {
      title: 'Named patterns',
      description:
        'Write `wjKeyFilter` with a pattern name: `pint` for digits, `money` for digits, a decimal point, commas and spaces, `alpha` for letters and the underscore. A blocked key gives no feedback, so each label says what the input accepts.',
      sourceKey: 'keyfilter/named-patterns',
      component: KeyFilterNamedPatternsExample,
    },
    {
      title: 'A regular expression',
      description:
        'Bind a `RegExp` for any other rule. Anchor it over the whole text, as in `/^[A-Za-z0-9-]*$/`: Optimus tests the text with the new key appended, so an unanchored `/[a-z]/` lets every key through once the input holds one letter. A quantifier such as `{0,4}` makes a paste count as one whole text.',
      sourceKey: 'keyfilter/regular-expression',
      component: KeyFilterRegularExpressionExample,
    },
    {
      title: 'In a field',
      description:
        'Inside a `wj-field` the field still names, describes and validates the input. Put the allowed characters in the hint, since the filter says nothing when it blocks a key.',
      sourceKey: 'keyfilter/in-a-field',
      component: KeyFilterInAFieldExample,
    },
    {
      title: 'Testing with the harness',
      description:
        'Import `WjKeyFilterHarness` from `weeljack-ng/keyfilter/testing` to type or paste text the way a user does and read what the input kept. `typeText` offers each key to the filter and adds the character only when it let it through, which CDK’s `sendKeys` cannot do.',
      sourceKey: 'keyfilter/testing',
      component: null,
    },
  ],
  keyboard: [
    {
      key: 'A character key',
      effect: 'Types the character when it passes the pattern. A character that fails is blocked.',
    },
    {
      key: 'Paste',
      effect:
        'Pastes the text when every character passes. One failing character blocks the whole paste. A `RegExp` with a `{n}` quantifier is tested against the whole pasted text instead.',
    },
    {
      key: 'Backspace, Delete, arrows, Home, End',
      effect: 'Always work: they edit or move through the text.',
    },
    {
      key: 'Enter, Tab, Escape',
      effect: 'Always pass, so a form still submits and focus still moves.',
    },
  ],
  aria: [
    '`wjKeyFilter` has no ARIA input and adds no attribute besides `wjKeyFilter`. The input keeps its own label, `id` and `aria-*`, and inside a `wj-field` it is named and described by the field.',
    'A blocked key gives no feedback: nothing flashes and nothing is announced. State the allowed characters in the label or hint, such as "Digits only".',
    'The filter shapes what is typed; it does not judge what is held. Pair it with your own validator, because a value the form writes, text dropped in or filled by the browser is not filtered on desktop.',
    'On `wjInputMask` the mask writes the keys it accepts itself, and a key filter cannot veto them. The mask’s own pattern decides there; use the filter on `wjInputText` or a native input.',
    'On Android, Optimus checks the text after it changes instead of blocking the key: it puts back the last valid text and WeeljackNg then sends an `input` event, so `ngModel`, `FormControl` and `[formField]` read the restored text.',
    'The screen-reader pass (NVDA with Chrome) is recorded on this page before the release that carries this entry.',
  ],
  stylingIntro:
    'There is no styling: `wjKeyFilter` adds no part, class, colour or motion, and no `pt`, because Optimus’s key filter renders nothing for a pass-through to reach. The input looks as it would without it, so style it through `wjInputText` or your own CSS.',
  parts: [],
  mapping: [
    {
      optimus: 'pKeyFilter (pattern)',
      weeljack: 'wjKeyFilter',
      status: 'renamed',
      note: 'A `RegExp` or a `WjKeyFilterPattern` name; a selector-named input, as Optimus’s is. Never evaluated text.',
    },
    {
      optimus: 'KeyFilterPattern (type)',
      weeljack: 'WjKeyFilterPattern',
      status: 'renamed',
      note: '`pint`, `int`, `pnum`, `money`, `num`, `hex`, `email`, `alpha` or `alphanum`.',
    },
    dropped(
      'pValidateOnly',
      'By need. Its validator serves `ngModel` and reactive forms only, never `[formField]`.',
    ),
    dropped(
      'ngModelChange (output)',
      'Not exposed: the directive keeps every form API in sync itself.',
    ),
    dropped('KEYFILTER_VALIDATOR, validate()', 'Internal; inactive without `pValidateOnly`.'),
    dropped('KeyFilterModule', 'Standalone.'),
  ],
};
