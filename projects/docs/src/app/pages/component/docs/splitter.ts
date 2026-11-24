import { SplitterHorizontalExample } from '../../../examples/splitter/horizontal';
import { SplitterSavingExample } from '../../../examples/splitter/saving';
import { SplitterSizesExample } from '../../../examples/splitter/sizes';
import { SplitterVerticalExample } from '../../../examples/splitter/vertical';
import type { ComponentDoc, MappingRow } from '../component-doc';

const droppedAlways = 'Never exposed on any wrapper (ADR 0002).';

const dropped = (optimus: string, note: string): MappingRow => ({
  optimus,
  weeljack: 'None',
  status: 'dropped',
  note,
});

export const DOC: ComponentDoc = {
  entry: 'splitter',
  title: 'Splitter',
  purpose: 'Two or more panels the user resizes with the pointer or the keyboard.',
  examples: [
    {
      title: 'Horizontal',
      description:
        'Declare each panel as a `wj-splitter-panel` child, and import both classes (`WjSplitter` and `WjSplitterPanel`). Horizontal puts the panels side by side, with a gutter between each pair. `size` is a panel’s initial share in percent: Files starts at 30 % and Editor, which has none, takes the rest. Name the separator with `ariaLabel` or `ariaLabelledBy`, after the panel it resizes. A panel clips what does not fit, so put a `wj-scrollpanel` inside one that must scroll, and pad the content at least 16 px: a control at a panel’s edge sits under the gutter’s 24 px hit box. Without a drag: tap the handle, then tap in either panel to put the line there.',
      sourceKey: 'splitter/horizontal',
      component: SplitterHorizontalExample,
    },
    {
      title: 'Vertical',
      description:
        'With `orientation="vertical"` the panels stack and the gutter runs along the width. A vertical splitter needs a height, because its panels’ percentages are shares of it: this one is `20rem` tall. Give the host a `height` or `block-size`; it reaches the splitter’s root.',
      sourceKey: 'splitter/vertical',
      component: SplitterVerticalExample,
    },
    {
      title: 'Sizes and minimums',
      description:
        '`size` and `minSize` are percentages. Sidebar starts at 25 % and never shrinks below 15 %, and Content never below 50 %. Panels with no `size` share what the others leave, equally. Optimus checks `minSize` for the first two panels whichever gutter moves, so minimums hold for a splitter of two panels only.',
      sourceKey: 'splitter/sizes',
      component: SplitterSizesExample,
    },
    {
      title: 'Saving sizes',
      description:
        '`resizeEnd` emits `{ sizes: number[] }` once a resize is over, whether by pointer or by key: one percentage per panel, in order. It is silent for a key-up that moved nothing, such as Tab arriving on a gutter. The sizes are not whole numbers and, with the gutters, add up to a little under 100; this example rounds them for display. An app stores them and binds `size` on each panel the next time it renders the splitter. Optimus reads the panels once and applies sizes in the browser only, so a splitter with `size` set shows equal panels in the prerendered page and jumps to its sizes when the app boots.',
      sourceKey: 'splitter/saving',
      component: SplitterSavingExample,
    },
    {
      title: 'Testing with the harness',
      description:
        'Import `WjSplitterHarness` and `WjSplitterPanelHarness` from `weeljack-ng/splitter/testing`. `getOrientation()` says which way the panels run, `getPanels()` returns each panel as a container harness (`getSize()` is its box, and `getHarness` reaches what you put inside), and `getPanelSizes()` returns each panel’s share of the panels’ length, in percent, measured from the boxes. A gutter is named by its position, 0 being the one after the first panel: `getGutterCount()`, `getGutterValue(index)`, `getGutterLabel(index)` and the other ARIA getters, `focusGutter(index)` and `isGutterFocused(index)`. To resize, hold an arrow key with `userEvent` from `vitest/browser` until the splitter reports a resize, then release it: Optimus acts 40 ms after the press and reports on key-up, so poll a harness value rather than sleeping. Nothing here names an Optimus class.',
      sourceKey: 'splitter/testing',
      component: null,
    },
  ],
  keyboard: [
    {
      key: 'Tab, Shift+Tab',
      effect:
        'Moves focus to each gutter in order, between the panels’ own controls. A gutter is one Tab stop.',
    },
    {
      key: 'ArrowRight, ArrowLeft',
      effect:
        'On a horizontal splitter, ArrowRight grows the first panel of the pair by `step` px and ArrowLeft shrinks it. ArrowUp and ArrowDown do nothing.',
    },
    {
      key: 'ArrowDown, ArrowUp',
      effect:
        'On a vertical splitter, ArrowDown grows the first panel of the pair by `step` px and ArrowUp shrinks it. ArrowLeft and ArrowRight do nothing.',
    },
    {
      key: 'Home, End, Enter',
      effect: 'Not supported (Optimus 2.0.2).',
    },
  ],
  aria: [
    'Name the separator with `ariaLabel` or `ariaLabelledBy`, after the panel it resizes (“Resize the file list”). `ariaDescribedBy` describes it. The name, the description, the value and its range go to the gutter’s focusable handle, which `wj-splitter` makes its one `separator`. Setting an `aria-*` attribute on the `wj-splitter` host logs the dev-mode warning `WJ0003` and is not forwarded.',
    'Gap, fixed: Optimus draws two nested elements per gutter, an outer `div` with `role="separator"` that nobody can focus and an inner handle that takes focus and carries `aria-valuenow`, but no role and no name. `wj-splitter` takes the role off the outer gutter and puts `role="separator"`, `aria-valuemin="0"`, `aria-valuemax="100"` and the name on the handle (the value is the next fix). A routed removal: the outer gutter’s `role` is cleared through `pt`.',
    'Gap, fixed: Optimus sets `aria-orientation` to the layout, so a splitter with panels side by side calls its separator horizontal. A separator is oriented along its own line: the one between side-by-side panels is `vertical`, and between stacked panels `horizontal`. `wj-splitter` routes the right value.',
    'Gap, fixed: Optimus lays out a 4 px gutter with a 4 px handle, far under 24 × 24 px, and draws the line in `--wj-content-border-color`, about 1.3:1 against white. The handle grows to a 24 px square centred on the line and the line takes `--wj-surface-500`, at least 3:1 in both schemes. The gutter itself stays 4 px, so Optimus’s panel sizes still add up. See Styling.',
    'Gap, fixed: Optimus writes `aria-valuenow` only in the browser, so a prerendered separator had no value, and it reports a size it refused when a move would cross a `minSize`. `wj-splitter` routes the value itself: the first panel’s share in percent, set at render and after every resize.',
    'Gap, listed: with three or more panels every gutter shares one name and one value. Optimus’s `pt` options take no gutter index, so the value, the first panel’s share, is the same on every gutter; it is exact for two panels. `aria-controls` cannot name a per-gutter panel either.',
    'Gap, listed: `minSize` holds for two panels only. Optimus checks the first two minimums whichever gutter moves.',
    'Gap, listed: Home, End and Enter are not handled. The window splitter pattern marks them optional.',
    'Gap, listed: a key press shorter than 40 ms moves nothing, because Optimus acts on a key through a timer that its key-up cancels. An ordinary press is longer.',
    'Gap, fixed: resizing with the pointer needed a drag, with no single-pointer alternative (WCAG 2.5.7 Dragging Movements). Tap the handle, then tap where the line should go: the handle shows the focus ring and the panels a crosshair while it waits, and the next tap inside one of its two neighbouring panels places the line there. Escape, a second tap on the handle or a tap anywhere else cancels, and a tap that would break a `minSize` moves nothing and cancels. `resizeEnd` fires once for the placement, and also for the tap on the handle, with the sizes unchanged, as a pointer press always has.',
    'Gap, listed: tap to place does not follow right-to-left pages. The line lands on the side opposite the tap, as Optimus’s arrow keys do; a drag follows the page direction.',
    'Gap, listed: Optimus applies panel sizes only in the browser, so a prerendered splitter shows equal panels until the app boots.',
    'Gap, listed: the panel set is read once, at first render. If panels are added or removed afterwards, `wj-splitter` warns once in dev mode (`WJ0120`) and changes nothing: render a new `wj-splitter` to change its panels, for example inside `@if`.',
    'Gap, listed: the object form of `pt` requires a `panel` key, because Optimus types it as required. Pass `panel: undefined` when you set only the gutter, or use the function form.',
    'Tap to place is for the pointer and announces nothing: its armed state is the focus ring on the handle and a crosshair on the panels. Keyboard users have the arrow keys.',
    'The separators are named in every documented state: horizontal with two panels, vertical with two panels, three panels, and after a keyboard resize, in the light and the dark scheme. No axe rule is tolerated on this page.',
    'The keyboard walk and the screen-reader pass (NVDA with Chrome) are recorded on this page before `1.0.0`.',
  ],
  stylingIntro:
    'Colours, radius and spacing come from the `--wj-*` variables that `provideWeeljack` emits. The host is a block, so its width is yours, and a height you set on it reaches the splitter’s root, which fills it; with none, a horizontal splitter is as tall as its tallest panel. The root keeps Optimus’s 1 px edge and its radius, and each panel clips its content. The gutter is 4 px, as Optimus’s panel sizes subtract it, and `wj-splitter` sets its colour to `--wj-surface-500` through Optimus’s `--wj-splitter-gutter-background` on the host. The focusable handle in the middle of each gutter is a transparent 24 × 24 px square centred on the line, so it overlaps each panel by 10 px while the gutter keeps its 4 px of layout; its focus ring draws a circle around the line, and no grip is drawn. While a handle is armed for tap to place it draws the same `--wj-focus-ring-*` outline (without the keyboard ring’s offset) and the host takes `cursor: crosshair`; nothing animates. Where `wj-splitter` routes its own attributes onto a part (the handle’s `role`, `aria-orientation`, `aria-valuemin`, `aria-valuemax`, `aria-valuenow` and the three ARIA names, and the outer gutter’s `role`, which it clears), the routed value wins over the same attribute in your `pt`, except that a `role` you set on the gutter is kept; every other key you set is kept. `pt` reaches the parts of the Optimus splitter underneath. It tracks Optimus 2.0: part names and attributes follow the installed `@openng/optimus-ui` minor and are outside the stable API of `wj-splitter`. Changes to them ship only in the release that takes a new Optimus minor, and are not breaking.',
  parts: [
    { part: 'root', description: 'The `p-splitter` element: the flex box that holds the parts.' },
    {
      part: 'panel',
      description: 'One panel, a clipping box around a `wj-splitter-panel`’s content.',
    },
    {
      part: 'gutter',
      description:
        'The 4 px strip between two panels, which takes the pointer. Its `role` is cleared: the handle is the separator.',
    },
    {
      part: 'gutterHandle',
      description:
        'The focusable handle in the middle of the gutter: the separator, with its `role`, value, range, orientation and names. Its hit box is 24 × 24 px.',
    },
  ],
  mapping: [
    {
      optimus: 'layout',
      weeljack: 'orientation',
      status: 'renamed',
      note: '`horizontal` or `vertical`, default `horizontal`.',
    },
    {
      optimus: 'step',
      weeljack: 'step',
      status: 'kept',
      note: 'Pixels per arrow key.',
    },
    {
      optimus: 'panelSizes',
      weeljack: 'size on each wj-splitter-panel',
      status: 'renamed',
      note: 'Initial share in percent. Unset panels share the rest equally.',
    },
    {
      optimus: 'minSizes',
      weeljack: 'minSize on each wj-splitter-panel',
      status: 'renamed',
      note: 'Percent. Holds for two panels only.',
    },
    {
      optimus: 'onResizeEnd',
      weeljack: 'resizeEnd',
      status: 'renamed',
      note: 'Narrowed to `{ sizes: number[] }`, with no `originalEvent`. Emitted only after a resize started, never on a bare key-up.',
    },
    dropped('onResizeStart', 'Dropped by need.'),
    {
      optimus: '#panel templates, pTemplate="panel"',
      weeljack: 'wj-splitter-panel children',
      status: 'renamed',
      note: 'One `wj-splitter-panel` per panel.',
    },
    dropped('gutterSize', 'The default look fixes the gutter: 4 px line, 24 px hit box.'),
    dropped(
      'stateStorage, stateKey',
      'Dropped by need. An app stores the sizes from `resizeEnd` and binds `size`.',
    ),
    {
      optimus: '—',
      weeljack: 'ariaLabel, ariaLabelledBy, ariaDescribedBy',
      status: 'added',
      note: 'Routed to every gutter’s separator.',
    },
    {
      optimus: 'pt',
      weeljack: 'pt',
      status: 'kept',
      note: 'Typed `WjSplitterPt`. Tracks Optimus.',
    },
    dropped(
      'panelStyle, panelStyleClass, styleClass; dt, unstyled, ptOptions, SplitterModule',
      droppedAlways,
    ),
  ],
};
