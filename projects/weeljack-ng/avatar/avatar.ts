import { Component, ViewEncapsulation, computed, input, output } from '@angular/core';
import { Avatar } from '@openng/optimus-ui/avatar';
import { _checkAriaOnHost, _checkWeeljackSetup, _mergePartAttributes } from 'weeljack-ng/private';
import type { WjAvatarPt, WjAvatarShape, WjAvatarSize } from './avatar-types';

/**
 * A person or thing shown as initials, a photo or your own icon, over Optimus's `p-avatar`. It is
 * display only: it takes no focus and adds no Tab stop. Optimus shows `label` in preference to
 * `image`, so bind one of them, never both.
 *
 * An avatar beside its person's visible name is decorative. An avatar standing alone sets
 * `ariaLabel`, or `ariaLabelledBy` pointing at the name: it then reads as one image with that name.
 * Content you project (an icon, say) renders before the label or image; mark it `aria-hidden`.
 */
@Component({
  selector: 'wj-avatar',
  imports: [Avatar],
  templateUrl: './avatar.html',
  styleUrl: './avatar.css',
  // The stylesheet styles Optimus's own elements, which an emulated scope cannot reach.
  encapsulation: ViewEncapsulation.None,
  // The size hook for `wj-avatargroup`'s overlap rules (internal, not API).
  host: { '[attr.data-wj-size]': 'size()', '[attr.data-wj-shape]': 'shape()' },
})
export class WjAvatar {
  /** Initials, one or two letters. Rendered as text, never as HTML. */
  readonly label = input<string>();
  /** URL of the photo. A plain string, only ever set as the `src` of the photo's `img`. */
  readonly image = input<string>();
  /** `large` (48 px) or `xlarge` (64 px); unset is 32 px. */
  readonly size = input<WjAvatarSize>();
  /** `square` (rounded) or `circle`. */
  readonly shape = input<WjAvatarShape>('square');
  /** Names an avatar that stands alone. It then reads as one image with this name. */
  readonly ariaLabel = input<string>();
  /** Id of the element that names an avatar that stands alone. */
  readonly ariaLabelledBy = input<string>();
  /** Emits when the photo fails to load. */
  readonly imageError = output<Event>();
  /**
   * Pass-through for the avatar's parts. Tracks Optimus: its part names and attributes follow the
   * installed `@openng/optimus-ui` minor and are outside this component's stable API; changes to
   * them ship only in the release that takes a new Optimus minor and are not breaking.
   */
  readonly pt = input<WjAvatarPt>();

  /**
   * `pt` forwarded as given, plus two routed attributes. Optimus renders the photo with no `alt`
   * and puts the name on a role-less element: the photo always gets `alt=""` (it never reads its
   * URL), and a named avatar becomes one `role="img"`.
   */
  protected readonly partAttributes = computed<WjAvatarPt>(() =>
    _mergePartAttributes(_mergePartAttributes(this.pt(), 'image', { alt: '' }), 'root', {
      role: this.ariaLabel() || this.ariaLabelledBy() ? 'img' : undefined,
    }),
  );

  constructor() {
    _checkWeeljackSetup('wj-avatar');
    _checkAriaOnHost(
      'wj-avatar',
      'Use the ariaLabel or ariaLabelledBy input to name an avatar that stands alone',
    );
  }
}
