import { OrderListBasicExample } from '../../../examples/orderlist/basic';
import { OrderListCustomItemsExample } from '../../../examples/orderlist/custom-items';
import { OrderListDragAndDropExample } from '../../../examples/orderlist/drag-and-drop';
import { OrderListFilterExample } from '../../../examples/orderlist/filter';
import type { ComponentDoc, MappingRow } from '../component-doc';

const droppedAlways = 'Never exposed on any wrapper (ADR 0002).';

const dropped = (optimus: string, note: string): MappingRow => ({
  optimus,
  weeljack: 'None',
  status: 'dropped',
  note,
});

export const DOC: ComponentDoc = {
  entry: 'orderlist',
  title: 'Order list',
  purpose:
    'A list whose order the user changes. Give `wj-orderlist` its `value` as `[(value)]`, select one or more items, and move them with the four buttons beside the list: up, to the top, down, to the bottom. Every move writes a new array to `value`: your array is never changed, because Optimus reorders the array it is given in place and the list works on a copy. `selection` is two-way too. Items show their `name` field, or the field `dataKey` names, or the content of a `wjOrderListItem` template. Name the list with `ariaLabel`, or point `ariaLabelledBy` at a visible heading. Below a viewport width of 960 px the buttons stack above the list.',
  examples: [
    {
      title: 'Basic',
      description:
        'Six tasks under the header “Priority”, in a 24rem column. Select an item, or several, by clicking or with Space and Enter, then use the buttons: they stay off until something is selected. The state line under the list reads the model: each move writes a new array to `[(value)]`, and the array the example started from is never changed. The list shows each task’s `name` field; `dataKey` names another one. The buttons’ names (“Move Up”, “Move Top”, “Move Down”, “Move Bottom”) come from the translation. `header` is plain text above the list, and it renders as text, never as HTML.',
      sourceKey: 'orderlist/basic',
      component: OrderListBasicExample,
    },
    {
      title: 'Custom items',
      description:
        'A `wjOrderListItem` template replaces the item’s text. `[wjOrderListItemOf]` types `let-task` from your items, and the context carries the item, its `index` and whether it is `selected`. Here the name (weight 600) sits over the owner in muted text, which follows the row’s own colour while the row is selected, so it stays readable on the highlight. An option is named by its content once it has a custom template. Give the template at creation: adding or removing it later is not picked up.',
      sourceKey: 'orderlist/custom-items',
      component: OrderListCustomItemsExample,
    },
    {
      title: 'Filter',
      description:
        'Set `filterBy` to the field to search and a filter input appears above the list, with `filterPlaceholder` and, for its accessible name, `ariaFilterLabel`. The list narrows as you type, and a move on a filtered list moves the item in the whole list. A filter that matches nothing shows “No results found”, or a `wjOrderListEmpty` template, whose context says `filtered`. Optimus gap: the filter input is not a stop in the Tab sequence in 2.0.2 (see Accessibility), so it takes focus by click only.',
      sourceKey: 'orderlist/filter',
      component: OrderListFilterExample,
    },
    {
      title: 'Drag and drop',
      description:
        'Set `dragdrop` and the items can be dragged to a new place. Dragging is an extra: the move buttons stay the keyboard path and the single-pointer path (WCAG 2.5.7, dragging movements), so nobody needs to drag. The drop writes a new array to `value`, like a button does. The drag preview that follows the pointer is Optimus’s own, and the list does not change it.',
      sourceKey: 'orderlist/drag-and-drop',
      component: OrderListDragAndDropExample,
    },
    {
      title: 'Testing with the harness',
      description:
        'Import `WjOrderListHarness` from `weeljack-ng/orderlist/testing` to drive a list without touching its DOM. `getItemTexts()` and `getSelectedItemTexts()` read it, `selectItem()` toggles an item by text or index, `moveUp()`, `moveTop()`, `moveDown()` and `moveBottom()` press the buttons, `filter()` types into the filter, and `isDisabled()` reads its state. Find a list by `with({ name })`, its accessible name.',
      sourceKey: 'orderlist/testing',
      component: null,
    },
  ],
  keyboard: [
    {
      key: 'Tab',
      effect:
        'Moves through the four move buttons, which come before the list in the page, but only while something is selected (they are disabled otherwise), then into the list. The list is one stop: arrow keys move inside it. Optimus gap: one more Tab stops on a hidden element after the list, then leaves.',
    },
    {
      key: 'ArrowDown, ArrowUp',
      effect: 'Moves focus to the next or previous item, without changing the selection.',
    },
    { key: 'Home, End', effect: 'Moves focus to the first or last item.' },
    {
      key: 'Space, Enter on an item',
      effect: 'Toggles the focused item: selects it, or unselects it when it was selected.',
    },
    {
      key: 'Enter, Space on a move button',
      effect:
        'Moves the selected items up, to the top, down or to the bottom, and writes the new order to `value`.',
    },
  ],
  aria: [
    'The list is a `listbox` that allows several selections, and each item an `option` with `aria-selected`. Name it: set `ariaLabel`, or point `ariaLabelledBy` at a visible heading. Both land on the listbox, not on the `wj-orderlist` host. `aria-*` written on the host is not forwarded and raises `WJ0003` in development. Optimus has no input for `ariaLabelledBy`, so the wrapper routes it through `pt`. Names render as attribute text, never as HTML.',
    'The move buttons are named by the translation (`aria.moveUp`, `aria.moveTop`, `aria.moveDown`, `aria.moveBottom`), so a changed `provideWeeljack({ translation })` renames them. There are no per-instance label inputs.',
    'An option is named by the item’s `name` field (or the `dataKey` field) as Optimus writes it. With a `wjOrderListItem` template the wrapper clears that name, so the option is named by its content, which is what axe’s label-in-name rule requires when the content is more than the field.',
    'Optimus does not pass `ariaFilterLabel` to the filter input, so the wrapper routes it through `pt`, and removes the input’s `aria-owns`, which names a list that does not exist while the list is empty.',
    'Dragging is an extra. The move buttons are the single-pointer path (WCAG 2.5.7) and the keyboard path, and they work with `dragdrop` off or on.',
    'Optimus gap: with `filterBy` set, Optimus 2.0.2’s Tab sequence never stops in the filter input: its hidden first stop sends focus straight to the list, and the list does not hand focus back. The input takes focus by click only. The page lists this rather than working around Optimus’s focus handling; a spec pins it.',
    'Optimus gap: the move buttons come before the list in the page, so with `controlsPosition="right"` they are drawn after the list but stay first in the Tab sequence.',
    'Optimus gap: a disabled list is dimmed with the preset’s `listbox.disabled.color`, which axe reports below 4.5:1. WCAG 1.4.3 exempts inactive components, and the spec pins that this is the only axe finding of the disabled state.',
    'Optimus gap: Optimus never draws its `header` input and never gives its listbox an `emptyMessage`. The wrapper writes `header` through the listbox’s header template, as text, and writes the translation’s `emptyMessage` for an empty list.',
    'Motion: the list adds no animation. Optimus’s colour transitions drop to 0 s under reduced motion; the drag preview that follows the pointer while dragging is Optimus’s own and the list does not change it, and the move buttons need no drag.',
    'The keyboard walk and the screen-reader pass are recorded on this page before `0.3.0`.',
  ],
  stylingIntro:
    'The host is a block, and the list adds no CSS of its own: the buttons, the listbox and the header are Optimus’s. The listbox scrolls past `scrollHeight` (14rem unless given); `stripedRows` alternates the fills; `controlsPosition` puts the buttons before or after the list. The wrapper turns on Optimus’s `responsive` mode with its default breakpoint, so below a viewport width of 960 px the buttons stack above the list, in a row. For anything else, `pt` reaches the parts of the Optimus order list underneath. It tracks Optimus 2.0: part names and attributes follow the installed `@openng/optimus-ui` minor and are outside the stable API of `wj-orderlist`. Changes to them ship only in the release that takes a new Optimus minor, and are not breaking.',
  parts: [
    { part: 'host', description: 'The Optimus `p-orderlist` element.' },
    { part: 'root', description: 'The root element of the Optimus order list.' },
    { part: 'controls', description: 'The container of the four move buttons.' },
    {
      part: 'pcMoveUpButton',
      description: 'The “Move up” button. Takes the pass-through of a button.',
    },
    {
      part: 'pcMoveTopButton',
      description: 'The “Move top” button. Takes the pass-through of a button.',
    },
    {
      part: 'pcMoveDownButton',
      description: 'The “Move down” button. Takes the pass-through of a button.',
    },
    {
      part: 'pcMoveBottomButton',
      description: 'The “Move bottom” button. Takes the pass-through of a button.',
    },
    {
      part: 'pcListbox',
      description:
        'The list: its header, filter, `list` and `option` parts. Takes the pass-through of a listbox.',
    },
  ],
  mapping: [
    {
      optimus: 'value',
      weeljack: 'value',
      status: 'kept',
      note: 'Now a two-way `model()`. Optimus reorders the array it is given in place, so the list works on a copy and writes a new array on every move.',
    },
    {
      optimus: 'onReorder',
      weeljack: 'valueChange',
      status: 'renamed',
      note: 'Folded into the model: bind `[(value)]`.',
    },
    {
      optimus: 'selection, selectionChange',
      weeljack: 'selection',
      status: 'kept',
      note: 'A two-way `model()`; the list gives Optimus a copy, which it sorts in place.',
    },
    dropped('onSelectionChange', 'The `selection` model covers it.'),
    {
      optimus:
        'header, filterBy, filterPlaceholder, ariaFilterLabel, dragdrop, controlsPosition, stripedRows, disabled, scrollHeight, dataKey, ariaLabel, ariaLabelledBy',
      weeljack: 'same',
      status: 'kept',
      note: '`header` is text above the list (Optimus never draws its own). `dataKey` is the field shown for an item without a template, as in Optimus; `name` when unset. `ariaLabelledBy` and `ariaFilterLabel` are routed through `pt`, as Optimus ignores them.',
    },
    {
      optimus: 'item, empty, emptyfilter templates',
      weeljack: 'wjOrderListItem, wjOrderListEmpty',
      status: 'renamed',
      note: 'Typed slots. `wjOrderListEmpty` serves both Optimus templates: its context, `WjOrderListEmptyContext`, says `filtered`. Without it the translation’s `emptyMessage` and `emptyFilterMessage` show. The item context is `WjOrderListItemContext`: `$implicit`, `index` and `selected`.',
    },
    dropped('header, filter templates', '`header` is a string; a custom filter is by need.'),
    dropped('onFilterEvent', 'By need.'),
    {
      optimus: 'onFocus, onBlur',
      weeljack: 'focusin, focusout',
      status: 'renamed',
      note: 'The native events on the host; no `on`-prefixed outputs.',
    },
    dropped(
      'filterMatchMode, filterLocale, metaKeySelection, trackBy, autoOptionFocus, responsive, breakpoint, tabindex',
      'By need: the filter matches “contains”, a click toggles an item, items are tracked by identity, and `responsive` is always on with its 960 px breakpoint.',
    ),
    dropped(
      'buttonProps, moveUpButtonProps, moveTopButtonProps, moveDownButtonProps, moveBottomButtonProps',
      'Style the buttons through `pt`.',
    ),
    dropped('styleClass, listStyle, dt, unstyled, ptOptions', droppedAlways),
    dropped('Move and filter icon templates', 'Icons are not exposed (02 Q6).'),
    { optimus: 'pt', weeljack: 'pt', status: 'kept', note: '`WjOrderListPt`.' },
  ],
};
