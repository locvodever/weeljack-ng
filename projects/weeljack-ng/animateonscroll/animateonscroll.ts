import { Directive } from '@angular/core';
import { AnimateOnScroll } from '@openng/optimus-ui/animateonscroll';
import { _checkWeeljackSetup } from 'weeljack-ng/private';

/**
 * Holds an element invisible until it scrolls into view, then adds the app's own CSS classes: an
 * enter class as it enters the viewport and a leave class as it leaves past the bottom edge (a
 * reader scrolling back up), over Optimus's `pAnimateOnScroll`.
 *
 * The animation is the app's class, and it must be a CSS animation, not a transition: Optimus
 * clears both classes on `animationend`. The inputs are Optimus's own, with its transforms:
 * `threshold` is read with `numberAttribute` and `once` with `booleanAttribute`. `threshold`
 * defaults to `0.5` and `0` behaves as `0.5`, so an element taller than twice its viewport is
 * never half visible and stays held: keep animated elements shorter than the viewport, or lower
 * `threshold`. The inputs are read once, when the element first renders.
 *
 * While `enterClass` is set the element is `opacity: 0` until it first enters, keeping its place
 * and size, and it stays in the accessibility tree. Tabbing to a link inside it scrolls it into
 * view, which reveals it. Under `prefers-reduced-motion: reduce` nothing is held and nothing
 * animates: the element is fully opaque, and the app's classes still land. An invalid
 * `rootMargin` throws a `SyntaxError` that reaches the application's `ErrorHandler` unchanged.
 *
 * It adds no role, name, Tab stop or key behaviour, and it has no `pt`: Optimus's directive
 * renders no part.
 */
@Directive({
  selector: '[wjAnimateOnScroll]',
  hostDirectives: [
    {
      directive: AnimateOnScroll,
      inputs: ['enterClass', 'leaveClass', 'root', 'rootMargin', 'threshold', 'once'],
    },
  ],
})
export class WjAnimateOnScroll {
  constructor() {
    _checkWeeljackSetup('[wjAnimateOnScroll]');
  }
}
