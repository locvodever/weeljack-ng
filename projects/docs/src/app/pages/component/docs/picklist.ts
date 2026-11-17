import { PickListBasicExample } from '../../../examples/picklist/basic';
import { PickListCustomItemsExample } from '../../../examples/picklist/custom-items';
import type { ComponentDoc, MappingRow } from '../component-doc';

const droppedAlways = 'Never exposed on any wrapper (ADR 0002).';
const droppedForSize =
  'Dropped: size (21), can return as an additive minor, once the entry has room in its 2.50 KB.';

const dropped = (optimus: string, note: string): MappingRow => ({
  optimus,
  weeljack: 'None',
  status: 'dropped',
  note,
});

export const DOC: ComponentDoc = {
  entry: 'picklist',
  title: 'Pick list',
  purpose:
    'Two lists and the buttons that move items from one to the other. Give `wj-picklist` its `source` and `target` as `[(source)]` and `[(target)]`, select one or more items in a list, and move them with the buttons between the lists: the selected items, or every item. Four more buttons beside each list move the selected items up, to the top, down and to the bottom of that list. Every move writes new arrays: your arrays are never changed, because Optimus moves items by splicing the arrays it is given and the pick list works on copies. Items show their `name` field, or the field `dataKey` names, or the content of a `wjPickListItem` template. Name the lists with `sourceAriaLabel` and `targetAriaLabel`. Below a viewport width of 960 px the lists stack, with the transfer buttons between them turned to a row. There is no filter in this release.',
  examples: [
    {
      title: 'Basic',
      description:
        'Available columns on the left, visible columns on the right, each list named by its header (`sourceAriaLabel` and `targetAriaLabel` carry the same words, so a screen reader hears the header). Select an item, or several, by clicking or with Space and Enter, then use the buttons between the lists: “Move to Target” and “Move to Source” stay off until that list has a selection, and the “all” buttons move everything. The state line under the lists reads the model: each move writes new arrays to `[(source)]` and `[(target)]`, and the arrays the example started from are never changed. The button names (“Move to Target”, “Move All to Source”, “Move Up”, “Move Bottom” and the rest) come from the translation. The headers are plain text and render as text, never as HTML. `dragdrop` adds dragging an item within a list, or to the other list, as an extra; the buttons stay the keyboard and the single-pointer path.',
      sourceKey: 'picklist/basic',
      component: PickListBasicExample,
    },
    {
      title: 'Custom items',
      description:
        'A `wjPickListItem` template replaces the item’s text in both lists. `[wjPickListItemOf]` types `let-column` from your items, and the context carries the item, its `index`, whether it is `selected` and whether it is `disabled`. Here the column name (weight 600) sits over its field name in muted text, which follows the row’s own colour while the row is selected, so it stays readable on the highlight. An option is named by its content once it has a custom template. When a list is empty, a `wjPickListEmpty` template replaces the translation’s `emptyMessage`; its context says which `list` is empty.',
      sourceKey: 'picklist/custom-items',
      component: PickListCustomItemsExample,
    },
    {
      title: 'Testing with the harness',
      description:
        'Import `WjPickListHarness` from `weeljack-ng/picklist/testing` to drive a pick list without touching its DOM. `getSourceItemTexts()` and `getTargetItemTexts()` read the lists, `selectSourceItem()` and `selectTargetItem()` toggle an item by text or index, `moveToTarget()`, `moveAllToTarget()`, `moveToSource()` and `moveAllToSource()` press the transfer buttons, `filterSource()` and `filterTarget()` type into a filter input (this release renders none, so they throw), and `isDisabled()` reads the state. An item with a custom template is found by a RegExp over its text.',
      sourceKey: 'picklist/testing',
      component: null,
    },
  ],
  keyboard: [
    {
      key: 'Tab',
      effect:
        'Moves through the page in this order: the four reorder buttons of the source list, the source list, the four transfer buttons, the target list, the four reorder buttons of the target list, then on. A button is a stop only while it is enabled: the two “all” buttons always are, the other transfer buttons and the reorder buttons only while their list has a selection. Each list is one stop: arrow keys move inside it. There is no extra hidden stop after the lists.',
    },
    {
      key: 'ArrowDown, ArrowUp',
      effect:
        'In a list, moves focus to the next or previous item, without changing the selection.',
    },
    { key: 'Home, End', effect: 'In a list, moves focus to the first or last item.' },
    {
      key: 'Space, Enter on an item',
      effect:
        'Toggles the focused item of that list: selects it, or unselects it when it was selected.',
    },
    {
      key: 'Enter, Space on a transfer button',
      effect:
        'Moves the selected items, or every item, to the other list, and writes the new arrays to `source` and `target`.',
    },
    {
      key: 'Enter, Space on a reorder button',
      effect:
        'Moves the selected items of that list up, to the top, down or to the bottom, and writes the new order to its model.',
    },
  ],
  aria: [
    'Each list is a `listbox` that allows several selections, and each item an `option` with `aria-selected`. Name them: set `sourceAriaLabel` and `targetAriaLabel`. Both land on their listbox, not on the `wj-picklist` host. `aria-*` written on the host is not forwarded and raises `WJ0003` in development. Names render as attribute text, never as HTML.',
    'The buttons are named by the translation (`aria.moveToTarget`, `aria.moveAllToTarget`, `aria.moveToSource`, `aria.moveAllToSource`, `aria.moveUp`, `aria.moveTop`, `aria.moveDown`, `aria.moveBottom`), so a changed `provideWeeljack({ translation })` renames them. There are no per-instance label inputs.',
    'Optimus gap, fixed in the wrapper: Optimus 2.0.2 names its “Move Bottom” buttons from `aria.moveDown`, so both read “Move Down” and repeat the button before them. The wrapper routes `aria.moveBottom` to both through `pt`.',
    'An option is named by the item’s `name` field (or the `dataKey` field) as Optimus writes it. With a `wjPickListItem` template the wrapper clears that name, so the option is named by its content, which is what axe’s label-in-name rule requires when the content is more than the field.',
    'Optimus gap, fixed in the wrapper: Optimus never gives an empty list a message, so an empty list is blank. The wrapper writes the translation’s `emptyMessage` into each empty list, or your `wjPickListEmpty` template.',
    'Optimus gap, fixed in the wrapper: Optimus never writes its own `source` and `target` models, it only splices the arrays it was given and announces the move. The wrapper writes new arrays to its own models on every move; a spec pins that your arrays keep their reference, order and freeze.',
    'Optimus gap: a disabled list is dimmed with the preset’s `listbox.disabled.color`, which axe reports below 4.5:1. WCAG 1.4.3 exempts inactive components, and the spec pins that this is the only axe finding of the disabled state.',
    'Not a gap here, unlike the order list: the Tab sequence has no stray hidden stop after the lists, and a `wjPickListItem` or `wjPickListEmpty` template added or removed after creation is picked up. Specs pin both.',
    'Dragging is an extra. The buttons are the single-pointer path (WCAG 2.5.7) and the keyboard path, and they work with `dragdrop` off or on.',
    'Motion: the pick list adds no animation. Optimus’s colour transitions drop to 0 s under reduced motion; the drag preview that follows the pointer while dragging is Optimus’s own and the pick list does not change it.',
    'The keyboard walk and the screen-reader pass are recorded on this page before `0.3.0`.',
  ],
  stylingIntro:
    'The host is a block, and the pick list adds no CSS of its own: the buttons, the two listboxes and the headers are Optimus’s. Each list scrolls past `scrollHeight` (14rem unless given); `stripedRows` alternates the fills. The wrapper turns on Optimus’s `responsive` mode with its default breakpoint, so below a viewport width of 960 px the source list sits above the target list, with the transfer buttons between them in a row. For anything else, `pt` reaches the parts of the Optimus pick list underneath. It tracks Optimus 2.0: part names and attributes follow the installed `@openng/optimus-ui` minor and are outside the stable API of `wj-picklist`. Changes to them ship only in the release that takes a new Optimus minor, and are not breaking.',
  parts: [
    { part: 'root', description: 'The root element of the Optimus pick list.' },
    {
      part: 'sourceControls',
      description: 'The container of the source list’s four reorder buttons.',
    },
    { part: 'sourceListContainer', description: 'The container of the source list.' },
    { part: 'transferControls', description: 'The container of the four transfer buttons.' },
    { part: 'targetListContainer', description: 'The container of the target list.' },
    {
      part: 'targetControls',
      description: 'The container of the target list’s four reorder buttons.',
    },
    {
      part: 'pcSourceMoveUpButton, pcSourceMoveTopButton, pcSourceMoveDownButton, pcSourceMoveBottomButton',
      description: 'The source list’s reorder buttons. Each takes the pass-through of a button.',
    },
    {
      part: 'pcMoveToTargetButton, pcMoveAllToTargetButton, pcMoveToSourceButton, pcMoveAllToSourceButton',
      description: 'The transfer buttons. Each takes the pass-through of a button.',
    },
    {
      part: 'pcTargetMoveUpButton, pcTargetMoveTopButton, pcTargetMoveDownButton, pcTargetMoveBottomButton',
      description: 'The target list’s reorder buttons. Each takes the pass-through of a button.',
    },
    {
      part: 'pcListbox',
      description:
        'Both lists: their header, `list` and `option` parts. Takes the pass-through of a listbox, and applies to the source and the target alike.',
    },
  ],
  mapping: [
    {
      optimus: 'source, target',
      weeljack: 'source, target',
      status: 'kept',
      note: 'Two-way `model()`s. Optimus splices the arrays it is given and never writes its own models, so the pick list works on copies and writes new arrays on every move.',
    },
    {
      optimus:
        'sourceHeader, targetHeader, dataKey, sourceAriaLabel, targetAriaLabel, dragdrop, stripedRows, disabled, scrollHeight',
      weeljack: 'same',
      status: 'kept',
      note: 'The headers are text above each list. `dataKey` is the field shown for an item without a template, as in Optimus; `name` when unset.',
    },
    dropped('filterBy', droppedForSize),
    dropped('showSourceFilter, showTargetFilter', droppedForSize),
    dropped('sourceFilterPlaceholder, targetFilterPlaceholder', droppedForSize),
    dropped('ariaSourceFilterLabel, ariaTargetFilterLabel', droppedForSize),
    dropped(
      'showSourceControls, showTargetControls',
      `${droppedForSize} Both groups of reorder buttons are always shown.`,
    ),
    dropped(
      'rightButtonAriaLabel, leftButtonAriaLabel, allRightButtonAriaLabel, allLeftButtonAriaLabel, upButtonAriaLabel, downButtonAriaLabel, topButtonAriaLabel, bottomButtonAriaLabel',
      'Labels come from the translation (`aria.*`, 22 Q8).',
    ),
    {
      optimus:
        'onMoveToTarget, onMoveAllToTarget, onMoveToSource, onMoveAllToSource, onSourceReorder, onTargetReorder',
      weeljack: 'sourceChange, targetChange',
      status: 'renamed',
      note: 'Folded into the models: bind `[(source)]` and `[(target)]`. A transfer writes both, a reorder only its own list.',
    },
    dropped('onSourceSelect, onTargetSelect, onSourceFilter, onTargetFilter', 'By need.'),
    {
      optimus: 'onFocus, onBlur',
      weeljack: 'focusin, focusout',
      status: 'renamed',
      note: 'The native events on the host; no `on`-prefixed outputs.',
    },
    {
      optimus: 'item, emptymessagesource, emptymessagetarget templates',
      weeljack: 'wjPickListItem, wjPickListEmpty',
      status: 'renamed',
      note: 'Typed slots. `wjPickListItem` serves both lists; its context, `WjPickListItemContext`, is `$implicit`, `index`, `selected` and `disabled`. `wjPickListEmpty` serves both lists; its context, `WjPickListEmptyContext`, says which `list`. Without it the translation’s `emptyMessage` shows. The templates for a filter that matches nothing go with the filters.',
    },
    dropped(
      'sourceHeader, targetHeader, sourceFilter, targetFilter templates',
      '`sourceHeader` and `targetHeader` are strings.',
    ),
    dropped(
      'filterMatchMode, filterLocale, metaKeySelection, keepSelection, trackBy, sourceTrackBy, targetTrackBy, sourceOptionDisabled, targetOptionDisabled, autoOptionFocus, responsive, breakpoint, tabindex, hostName',
      'By need: a click toggles an item, identity is by reference, and `responsive` is always on with its 960 px breakpoint.',
    ),
    dropped(
      'buttonProps, moveUpButtonProps, moveTopButtonProps, moveDownButtonProps, moveBottomButtonProps, moveToTargetProps, moveAllToTargetProps, moveToSourceProps, moveAllToSourceProps',
      'Style the buttons through `pt`.',
    ),
    dropped('style, styleClass, sourceStyle, targetStyle, dt, unstyled, ptOptions', droppedAlways),
    dropped('Move, transfer and filter icon templates', 'Icons are not exposed (02 Q6).'),
    { optimus: 'pt', weeljack: 'pt', status: 'kept', note: '`WjPickListPt`.' },
  ],
};
