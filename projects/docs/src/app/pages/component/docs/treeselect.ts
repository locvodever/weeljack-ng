import { TreeSelectBasicExample } from '../../../examples/treeselect/basic';
import { TreeSelectCheckboxExample } from '../../../examples/treeselect/checkbox';
import { TreeSelectDisabledExample } from '../../../examples/treeselect/disabled';
import { TreeSelectInAFieldExample } from '../../../examples/treeselect/in-a-field';
import { TreeSelectMultipleExample } from '../../../examples/treeselect/multiple';
import { TreeSelectReactiveAndSignalFormsExample } from '../../../examples/treeselect/reactive-and-signal-forms';
import { TreeSelectSizesExample } from '../../../examples/treeselect/sizes';
import type { ComponentDoc, MappingRow } from '../component-doc';

const droppedByNeed = 'Not exposed: WeeljackNg exposes by need, never a mirror.';
const droppedAlways = 'Never exposed on any wrapper (ADR 0002).';

const dropped = (optimus: string, note: string): MappingRow => ({
  optimus,
  weeljack: 'None',
  status: 'dropped',
  note,
});

export const DOC: ComponentDoc = {
  entry: 'treeselect',
  title: 'Tree select',
  purpose:
    "A form control that picks one or more nodes from a tree, in a drop-down panel, 44 px tall by default. Give `wj-treeselect` its `options`, nodes of `WjTreeNode` (imported `from 'weeljack-ng'`) with a `key` on each, and bind `[(value)]`, or use `ngModel`, a `FormControl` or `[formField]`. `value` is always an array of your own nodes, with at most one in `single` mode, and your nodes are never written: Optimus renders copies, and a value you set matches an option by identity, else by `key`. `selectionMode` takes `single`, `multiple` or `checkbox` (`WjTreeSelectionMode`, also `from 'weeljack-ng'`). Inside a field, the field’s label names the combobox together with the value it shows, and the field describes it and marks it invalid.",
  examples: [
    {
      title: 'Basic',
      description:
        'A department picker in a field, with a placeholder. A pick closes the panel and returns focus to the control; picking the picked node again drops it and leaves the panel open. The panel opens on the path to the picked node.',
      sourceKey: 'treeselect/basic',
      component: TreeSelectBasicExample,
    },
    {
      title: 'Multiple',
      description:
        'In `multiple` mode each node toggles on its own and the panel stays open. The control shows the picked labels, comma-separated, on one line; a long value is cut with an ellipsis, and its full text stays in the combobox’s name.',
      sourceKey: 'treeselect/multiple',
      component: TreeSelectMultipleExample,
    },
    {
      title: 'Checkbox',
      description:
        'Checking a department checks every team in it, and checking one team marks its department partly checked, with Optimus’s minus. `value` lists every checked node, parents included. Nothing is checked at rest here: a value set from code checks the nodes but draws no partial mark, and a write from a form drops the marks Optimus drew.',
      sourceKey: 'treeselect/checkbox',
      component: TreeSelectCheckboxExample,
    },
    {
      title: 'In a field',
      description:
        'Inside a `wj-field` the label, hint and error come from the field. The label is a `span` that names the combobox (an `aria-label` would otherwise win and name it after its value), and a click on it focuses the control. The first field shows a hint; the second shows a static error, so the invalid look is visible without interaction.',
      sourceKey: 'treeselect/in-a-field',
      component: TreeSelectInAFieldExample,
    },
    {
      title: 'Reactive and signal forms',
      description:
        'A required `FormControl` and a signal-forms field with `[formField]`, each with a state line. A form’s `null` reads as an empty array, and `Validators.required` rejects an empty array. Signal forms’ `required` does not, so the field adds `minLength(…, 1)`; and signal forms write an identity mark into the items of an array value, so they need nodes that are not frozen.',
      sourceKey: 'treeselect/reactive-and-signal-forms',
      component: TreeSelectReactiveAndSignalFormsExample,
    },
    {
      title: 'Disabled',
      description:
        'A disabled tree select leaves the Tab order, ignores every key and does not open. It keeps showing its value.',
      sourceKey: 'treeselect/disabled',
      component: TreeSelectDisabledExample,
    },
    {
      title: 'Sizes',
      description: '`small` is 36 px, the default is 44 px and `large` is 52 px tall.',
      sourceKey: 'treeselect/sizes',
      component: TreeSelectSizesExample,
    },
    {
      title: 'Testing with the harness',
      description:
        'Import `WjTreeSelectHarness` from `weeljack-ng/treeselect/testing` to open and close the panel, read the shown text and the nodes on screen, expand, pick or check a node by its text, and check the disabled, required and invalid states and the ARIA ids, without touching the DOM. The harness finds the panel through the combobox’s `aria-controls`, so it works wherever Optimus attaches it. `close()` clicks the control, as a user does; Optimus reads `KeyboardEvent.code` for Escape, which a harness’s key events do not set. `open()` resolves when the click is done: Optimus undoes a pick made while the panel is still opening, so a spec waits for the panel to finish opening before it picks.',
      sourceKey: 'treeselect/testing',
      component: null,
    },
  ],
  keyboard: [
    {
      key: 'Tab, Shift+Tab',
      effect:
        'Moves focus to the control and away from it. With the panel open, Tab and Shift+Tab cycle between the combobox and the tree, and never lose focus: leave with Escape or a single pick.',
    },
    {
      key: 'Enter, Space, ArrowDown',
      effect:
        'Opens the panel when it is closed, and Optimus moves focus to its first node, or to the picked node when that is below the first level.',
    },
    {
      key: 'ArrowDown, ArrowUp',
      effect: 'In the panel, moves to the next or the previous visible node.',
    },
    {
      key: 'Home, End',
      effect:
        'In the panel, moves focus to the first or the last node on screen: the children of a collapsed node are not there, so focus never lands in one. Nothing is picked or checked.',
    },
    {
      key: 'A character',
      effect:
        'In the panel, moves focus to the next node on screen whose label starts with it, ignoring case and wrapping past the end. Nothing is picked or checked. Ctrl, Alt or Meta plus a letter, a space and `*` do nothing.',
    },
    {
      key: 'ArrowRight',
      effect:
        'Expands a collapsed node, then moves focus to its first child. Optimus moves the focus a moment after the expansion.',
    },
    {
      key: 'ArrowLeft',
      effect: 'Collapses an expanded node; on a collapsed node it moves focus to its parent.',
    },
    {
      key: 'Enter, Space (on a node)',
      effect:
        'Picks the focused node, or drops it when it is picked; in `checkbox` mode, checks or unchecks it with its descendants. In `single` mode a pick closes the panel and returns focus to the control.',
    },
    {
      key: 'Escape',
      effect: 'Closes the panel without picking. Focus returns to the control.',
    },
    {
      key: 'Any key, while disabled',
      effect: 'The control is not in the Tab order and does not react.',
    },
  ],
  aria: [
    'The focusable element is Optimus’s visually hidden `input` with `role="combobox"`, not a native control. `inputId`, `ariaLabel`, `ariaLabelledBy` and `ariaDescribedBy` are set on it, not on `wj-treeselect`. An `aria-*` attribute on the host is not forwarded and raises `WJ0003` in development.',
    'Inside a `wj-field` the combobox reads “label, value”: its `aria-labelledby` lists the field’s label, then the shown value. Optimus would otherwise name it after its value alone, and an `aria-label` beats a `<label for>`, so the field’s label could never name it. An `ariaLabelledBy` you set wins over the field’s, and the shown value is added after it. With no field, set `ariaLabel`, or point `ariaLabelledBy` at a visible element: without either, Optimus names the combobox after the text it shows, which is not a name.',
    'Inside a field, `aria-describedby` lists your own `ariaDescribedBy` ids first, then the hint, then the error, without duplicates. `aria-invalid="true"` is set exactly while the field shows an error; outside a field it follows `invalid`. `required` sets `aria-required`, which Optimus leaves off.',
    'Fixed in the component, through `pt` and on the panel’s tree: the chevron, a second, English-only “treeselect trigger” button next to the combobox, is hidden from assistive tech; the toggle and the checkbox of every node in the panel are hidden too, since the treeitem already says what they do; the value text is marked disabled with the control, so its muted colour is not read as a contrast failure; and a node that can open says `aria-expanded="false"` while it is closed, where Optimus leaves the attribute off.',
    'A node in the panel is named from what it shows, not from its `label`. Optimus sets `aria-label` to the label, but an open node contains its children, so a name of only its own label does not contain the text on screen (WCAG 2.5.3, axe `label-content-name-mismatch`), and the component removes it. The cost is that a screen reader may read an open branch with its children.',
    'The panel’s tree fixes are written on the DOM after each render, for every level, because Optimus hands the nodes below the first level no `pt`. It runs in the browser only; a closed control prerenders no panel.',
    'Gap, fixed: inside the panel, a node’s set size was Optimus’s own child count rather than the number of its siblings, so a leaf read “1 of 0”. `wj-treeselect` now writes the number of siblings at every level, as `wj-tree` does.',
    'Gap, fixed: a partly checked node was announced as not checked, because Optimus draws the minus on the checkbox but leaves `aria-checked="false"` on the treeitem. `wj-treeselect` now writes `aria-checked="mixed"` on a node whose own checkbox is partly checked, and puts `"false"` back when the mark goes: Optimus writes nothing when a partly checked node is unchecked, and writes `"true"` itself when it becomes checked.',
    'Gap, fixed: Optimus ignores Home and End in the panel. `wj-treeselect` now moves focus to the first or the last node on screen, and hands the one Tab stop over as Optimus does (see the keyboard table). Nothing is picked.',
    'Gap, fixed: Optimus ignores a typed character in the panel. `wj-treeselect` now moves focus to the next node on screen whose label starts with it, wrapping, as `wj-tree` does. Nothing is picked.',
    'Gap: `*` is not handled in the panel.',
    'Gap: in `checkbox` mode, a value written from code (a form, `[(value)]`) checks the nodes but does not redraw the partial marks of their parents: Optimus resets them on every write. Marks drawn by a click stay until the next write.',
    'Gap: Tab inside the open panel cycles between the tree and the combobox, so Tab alone does not leave it. Escape does, and a single pick does. Focus is never lost.',
    'Gap: the English empty message reads “No available options”; set `translation: { emptyMessage }` in `provideWeeljack` to change it. Filtering, chips, a clear button, header and footer templates and a node template are not in this version.',
    'The panel opens inside the host. An ancestor that clips its overflow clips the panel too: give the field room, or do not clip. The panel is an overlay, so it is in the VoiceOver pass.',
    'The keyboard walk and the screen-reader pass (NVDA with Chrome, VoiceOver on iOS for the panel) are recorded on this page before `0.3.0`.',
  ],
  stylingIntro:
    'Colours, radius, height and the focus ring come from the `--wj-*` variables that `provideWeeljack` emits, and the chevron uses `--wj-text-muted-color`. The host is `inline-flex`, and the Optimus root inside it stretches to the host’s width, so size the control with `class` or `style` on `wj-treeselect`. A long value is cut off with an ellipsis; its full text stays in the combobox’s name. The panel is at least as wide as the control and scrolls past 400 px; the empty message is muted and padded by Optimus’s own `--wj-treeselect-empty-message-padding`, and a focused node on the highlight fill draws its ring in the highlight colour, inside the fill. For anything else, `pt` reaches the parts of the Optimus tree select underneath. It tracks Optimus 2.0: part names and attributes follow the installed `@openng/optimus-ui` minor and are outside the stable API of `wj-treeselect`. Changes to them ship only in the release that takes a new Optimus minor, and are not breaking. `aria-describedby`, `aria-invalid` and `aria-required` on the `hiddenInput` part, `id` and `aria-disabled` on the `label` part, and `aria-hidden` on the `dropdown` part are set by the component and win over a `pt` value of the same name. The attributes of the panel’s nodes are written on the DOM and win over `pt` too; `pt` on the tree’s parts below the first level reaches nothing.',
  parts: [
    { part: 'host', description: 'The Optimus `p-treeselect` element.' },
    { part: 'root', description: 'The Optimus root element, around the combobox and the chevron.' },
    { part: 'hiddenInputContainer', description: 'The visually hidden box around the combobox.' },
    {
      part: 'hiddenInput',
      description:
        'The combobox: the visually hidden `input` with `role="combobox"`, and the focusable element. Takes the routed `aria-describedby`, `aria-invalid` and `aria-required`.',
    },
    { part: 'labelContainer', description: 'The box around the shown value.' },
    {
      part: 'label',
      description:
        'The shown value: the picked labels or the placeholder. Takes the routed `id` (part of the combobox’s name) and `aria-disabled`.',
    },
    {
      part: 'dropdown',
      description: 'The chevron at the end of the control, hidden from assistive tech.',
    },
    { part: 'dropdownIcon', description: 'The chevron icon.' },
    { part: 'pcOverlay', description: 'The overlay that holds the panel, opened inside the host.' },
    { part: 'panel', description: 'The panel: the tree and its hidden focus elements.' },
    { part: 'treeContainer', description: 'The box that scrolls the tree past 400 px.' },
    { part: 'pcTree', description: 'The panel’s tree: its own parts, first level of nodes only.' },
  ],
  mapping: [
    {
      optimus: 'CVA `modelValue`',
      weeljack: 'value',
      status: 'added',
      note: 'A `model<WjTreeNode<T>[]>([])`: the picked nodes, your own objects, an array in every mode. A form’s `null` becomes `[]`.',
    },
    {
      optimus: 'options',
      weeljack: 'options',
      status: 'kept',
      note: 'A `WjTreeNode<T>[]`. Optimus gets copies, so your nodes are never written.',
    },
    {
      optimus: 'selectionMode',
      weeljack: 'selectionMode',
      status: 'kept',
      note: '`single` (the default), `multiple` or `checkbox` (`WjTreeSelectionMode`).',
    },
    {
      optimus: 'placeholder',
      weeljack: 'placeholder',
      status: 'kept',
      note: 'Rendered as text.',
    },
    {
      optimus: 'disabled, required, invalid',
      weeljack: 'disabled, required, invalid',
      status: 'kept',
      note: 'Accept a bare attribute. A form can disable it too, and a field drives `invalid` inside.',
    },
    dropped('name', droppedByNeed),
    {
      optimus: 'inputId, ariaLabel, ariaLabelledBy',
      weeljack: 'inputId, ariaLabel, ariaLabelledBy',
      status: 'kept',
      note: 'Set on the hidden input. `ariaLabelledBy` gains the shown value’s id.',
    },
    {
      optimus: 'None',
      weeljack: 'ariaDescribedBy',
      status: 'added',
      note: 'Set on the hidden input, merged with the field’s hint and error ids.',
    },
    {
      optimus: 'size',
      weeljack: 'size',
      status: 'kept',
      note: '`small` or `large`: 36 or 52 px against 44 px.',
    },
    dropped('variant, fluid', 'The host is the box: size it with CSS.'),
    dropped(
      'appendTo, overlayOptions, motionOptions',
      'The panel opens inside the host, and its motion is fixed with `safe: true`.',
    ),
    {
      optimus: 'onFocus, onBlur',
      weeljack: 'focusin, focusout',
      status: 'renamed',
      note: 'Listen to the native `focusin` and `focusout` on the host.',
    },
    dropped(
      'onNodeSelect, onNodeUnselect, onNodeExpand, onNodeCollapse, onShow, onHide',
      'The `value` model covers selection; the rest by need.',
    ),
    dropped('display', 'The picked labels show comma-separated, Optimus’s default.'),
    dropped('metaKeySelection', 'Stays `false`: a click toggles.'),
    dropped(
      'propagateSelectionUp, propagateSelectionDown',
      'Optimus’s default (both on) applies in `checkbox` mode.',
    ),
    dropped(
      'filter, filterBy, filterMode, filterPlaceholder, filterLocale, filterInputAutoFocus, resetFilterOnHide, onFilter',
      'Deferred.',
    ),
    dropped(
      'showClear, onClear, clearicon template',
      'Its clear icon is a pointer-only `svg`: deselect in the tree.',
    ),
    dropped(
      'emptyMessage',
      'Comes from the translation (`emptyMessage`), which `provideWeeljack` fills.',
    ),
    dropped('scrollHeight', 'Optimus’s 400 px.'),
    dropped('loading, loadingMode', droppedByNeed),
    dropped('virtualScroll, virtualScrollItemSize, virtualScrollOptions', droppedByNeed),
    dropped('tabindex, autofocus', droppedByNeed),
    dropped(
      'value, header, footer, empty templates; node templates passed to the inner tree',
      'By need; `wjTreeSelectNode` is the first candidate when a use appears.',
    ),
    dropped(
      'triggericon, dropdownicon, filtericon, closeicon, itemtogglericon, itemcheckboxicon, itemloadingicon templates',
      'Icon slots are not exposed (02 Q6).',
    ),
    dropped('show(), hide(), clear(), resetFilter()', droppedByNeed),
    {
      optimus: 'pt',
      weeljack: 'pt',
      status: 'kept',
      note: 'Typed `WjTreeSelectPt`. Tracks Optimus.',
    },
    dropped(
      'panelClass, panelStyle, panelStyleClass, containerStyle, containerStyleClass, labelStyle, labelStyleClass, dt, unstyled, ptOptions, TreeSelectModule, p-treeselect, p-tree-select',
      droppedAlways,
    ),
  ],
};
