import { RippleBasicExample } from '../../../examples/ripple/basic';
import { RippleDisabledExample } from '../../../examples/ripple/disabled';
import type { ComponentDoc, MappingRow } from '../component-doc';

const dropped = (optimus: string, note: string): MappingRow => ({
  optimus,
  weeljack: 'None',
  status: 'dropped',
  note,
});

export const DOC: ComponentDoc = {
  entry: 'ripple',
  title: 'Ripple',
  purpose:
    'An ink effect that spreads from the pointer when a reader presses an element. It adds no look of its own besides the ink, and no form control.',
  optimusSelector: '[pRipple]',
  examples: [
    {
      title: 'Basic',
      description:
        'Put `wjRipple` on any element a reader presses, here three tiles, "Photos", "Music" and "Files". It needs nothing but `provideWeeljack()`: Optimus’s global ripple switch stays off, so a `wj-button` and every other wrapper draw no ink. The host is clipped to its box (`overflow: hidden`, `position: relative`), so a child that pokes out of it is cut off. Its focus outline is not.',
      sourceKey: 'ripple/basic',
      component: RippleBasicExample,
    },
    {
      title: 'Turning the ink off',
      description:
        'Bind `wjRippleDisabled` to stop a press drawing ink, for example while the control the ink sits on is disabled. Turn the switch off and the tile draws no ink, but it still takes clicks and keeps its focus ring.',
      sourceKey: 'ripple/disabled',
      component: RippleDisabledExample,
    },
    {
      title: 'Testing with the harness',
      description:
        'Import `WjRippleHarness` from `weeljack-ng/ripple/testing`. `press()` presses the element at its centre with a mousedown and a mouseup, `hasInk()` is `true` while an ink shows, and `isDisabled()` reads `wjRippleDisabled`. Never select Optimus’s `.p-ink` class: it is outside the stable API.',
      sourceKey: 'ripple/testing',
      component: null,
    },
  ],
  keyboard: [
    {
      key: 'None',
      effect:
        '`wjRipple` adds no Tab stop and changes no key. The ink follows the pointer only: Enter and Space click the element as before and draw none.',
    },
  ],
  aria: [
    'The ink is a `span` that Optimus marks `aria-hidden="true"` and `role="presentation"`, so assistive technology never reads it. `wjRipple` adds no role, name, Tab stop or key behaviour, and no ARIA input. The element keeps the name and role it already has: put the directive on a native `button` or on an element with a role, never on a bare `div`.',
    '`wjRipple` adds no focus or pressed look: give the element its own, because under reduced motion there is no ink.',
    'The ink follows the pointer only, so a keyboard press draws none. The ink is decoration: nothing a reader needs to know depends on it.',
    'Under reduced motion no ink is drawn: when the reader asks for `prefers-reduced-motion: reduce`, a press shows nothing, and the element’s own hover, focus and active styles are unchanged.',
    'The element is clipped to its box. A child that pokes out of the host, such as a badge on its corner, is cut off. The host’s focus outline is drawn outside the box and is not clipped.',
    'The keyboard and screen-reader passes (NVDA with Chrome) are recorded here before W5d’s release.',
  ],
  stylingIntro:
    'There is no `pt`: Optimus’s ripple renders one unnamed ink element and defines no part for a pass-through to reach. The ink’s colour is the theme’s ripple token: `rgba(0, 0, 0, 0.1)` in the light scheme and `rgba(255, 255, 255, 0.3)` in the dark. The ink and its animation track Optimus 2.0 and are outside this directive’s stable API. `class` and `style` go on the element directly: it is your own.',
  parts: [],
  mapping: [
    {
      optimus: 'pRipple',
      weeljack: 'wjRipple',
      status: 'renamed',
      note: 'Draws its ink on its own host with Optimus’s global ripple switch off.',
    },
    {
      optimus: '—',
      weeljack: 'wjRippleDisabled',
      status: 'added',
      note: 'While `true`, a press draws no ink. It is not called `disabled`, which would capture a `<button>`’s own `disabled` binding.',
    },
    dropped(
      'Global ripple switch (provideOptimus)',
      'Stays off: `provideWeeljack` passes fixed values, and the ink is drawn per element instead.',
    ),
    dropped(
      'pt',
      'Optimus’s ripple has no parts and no pass-through type; it uses `pt` only for lifecycle hooks.',
    ),
    dropped('dt, unstyled, ptOptions', 'Never exposed on any wrapper (ADR 0002).'),
    dropped('RippleModule', 'Standalone.'),
  ],
};
