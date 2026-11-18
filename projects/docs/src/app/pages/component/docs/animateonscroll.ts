import { AnimateOnScrollBasicExample } from '../../../examples/animateonscroll/basic';
import { AnimateOnScrollEnterAndLeaveExample } from '../../../examples/animateonscroll/enter-and-leave';
import type { ComponentDoc, MappingRow } from '../component-doc';

const kept = (name: string, note: string): MappingRow => ({
  optimus: name,
  weeljack: name,
  status: 'kept',
  note,
});

const dropped = (optimus: string, note: string): MappingRow => ({
  optimus,
  weeljack: 'None',
  status: 'dropped',
  note,
});

export const DOC: ComponentDoc = {
  entry: 'animateonscroll',
  title: 'Animate on scroll',
  purpose:
    'Runs your own CSS animation on an element as it scrolls into or out of view. It adds no look of its own, and no form control.',
  optimusSelector: '[pAnimateOnScroll]',
  examples: [
    {
      title: 'Basic',
      description:
        'Put `wjAnimateOnScroll` on an element and name the class that animates it in with `enterClass`. Until the element first enters the viewport by half its height it is held at `opacity: 0`, keeping its place and size. With `once` it stops observing after that first enter and stays revealed. The `docs-fade-in` class here is the example’s own keyframe animation. Scroll down to reveal the last cards.',
      sourceKey: 'animateonscroll/basic',
      component: AnimateOnScrollBasicExample,
    },
    {
      title: 'Enter and leave',
      description:
        'Add `leaveClass` and the element animates out as you scroll back up past its bottom edge, then in again on the way down. Both classes must run a CSS animation, not a transition: Optimus clears them on `animationend` and then watches the element again.',
      sourceKey: 'animateonscroll/enter-and-leave',
      component: AnimateOnScrollEnterAndLeaveExample,
    },
    {
      title: 'Testing with the harness',
      description:
        'Import `WjAnimateOnScrollHarness` from `weeljack-ng/animateonscroll/testing`. `isHidden()` is `true` while the element is held at `opacity: 0`, and `hasClass(name)` reads whether your enter or leave class is applied. Scroll the element into view with your own fixture, then poll until `isHidden()` is `false`.',
      sourceKey: 'animateonscroll/testing',
      component: null,
    },
  ],
  keyboard: [
    {
      key: 'None',
      effect:
        '`wjAnimateOnScroll` adds no Tab stop and changes no key. Tabbing to a link or control inside a held element scrolls it into view, which reveals it.',
    },
  ],
  aria: [
    'The directive adds no role, name, Tab stop or key behaviour, and no ARIA input. A held element stays in the accessibility tree at `opacity: 0`, so a screen reader still reads it, and it is still focusable.',
    'Under reduced motion nothing is hidden and nothing animates: when the reader asks for `prefers-reduced-motion: reduce`, every element is shown at once and stays fully opaque, and its own `animation` and `transition` are `none`. Your classes are still added and removed, so their end-state styles still apply.',
    'Keep animated elements shorter than the viewport, or lower `threshold`. With the default `threshold` of `0.5`, an element taller than twice the viewport can never be half visible, so it stays held. `0` behaves as `0.5`, so it does not help.',
    'Your classes must run CSS animations, not transitions. Optimus re-arms the observer on `animationend`, which a transition never fires.',
    'A held element keeps its place and size: only its opacity changes, so nothing shifts when it is revealed. Put motion in `opacity` and `transform` only.',
    'The keyboard and screen-reader passes (NVDA with Chrome) are recorded here before W5d’s release.',
  ],
  stylingIntro:
    'There is no `pt`: Optimus’s directive renders no part. The animation is your own class, named by `enterClass` and `leaveClass`, and the examples keep their keyframes and the rules that use them inside `@media (prefers-reduced-motion: no-preference)`. Optimus holds the element with an inline `opacity: 0`, and the directive adds the `p-animateonscroll` class to it, which the reduced-motion rule targets. That class and the hold track Optimus 2.0 and are outside this directive’s stable API. `class` and `style` go on the element directly: it is your own.',
  parts: [],
  mapping: [
    {
      optimus: '[pAnimateOnScroll]',
      weeljack: '[wjAnimateOnScroll]',
      status: 'renamed',
      note: 'The directive over Optimus’s, with all six of its inputs.',
    },
    kept(
      'enterClass',
      'The class that runs the enter animation. While it is set, the element is held at `opacity: 0` until it first enters.',
    ),
    kept('leaveClass', 'The class that runs the leave animation.'),
    kept('root', 'The `IntersectionObserver` root: a scroll container instead of the viewport.'),
    kept(
      'rootMargin',
      'CSS margin syntax. An invalid value makes `IntersectionObserver` throw a `SyntaxError`, which reaches your `ErrorHandler` unchanged.',
    ),
    kept('threshold', 'Read with `numberAttribute`, default `0.5`. `0` behaves as `0.5`.'),
    kept(
      'once',
      'Read with `booleanAttribute`. After the first enter, the element stops observing.',
    ),
    dropped('pt', 'Optimus’s directive has no parts; it uses `pt` only for lifecycle hooks.'),
    dropped('dt, unstyled, ptOptions', 'Never exposed on any wrapper (ADR 0002).'),
    dropped('AnimateOnScrollModule', 'Standalone.'),
  ],
};
