import { Component, ViewEncapsulation, input } from '@angular/core';
import { AvatarGroup } from '@openng/optimus-ui/avatargroup';
import { _checkAriaOnHost, _checkWeeljackSetup } from 'weeljack-ng/private';
import type { WjAvatarGroupPt } from './avatargroup-types';

/**
 * A row of overlapping `wj-avatar`s, over Optimus's `p-avatargroup`. It is display only: it takes no
 * focus and adds no Tab stop, and it adds no role and no name. Name each avatar, show at most five,
 * then end with a named "+N" label avatar.
 *
 * Project `wj-avatar` elements. This entry does not import `weeljack-ng/avatar`: its stylesheet
 * restates Optimus's overlap rules for the avatars by element name.
 */
@Component({
  selector: 'wj-avatargroup',
  imports: [AvatarGroup],
  templateUrl: './avatargroup.html',
  styleUrl: './avatargroup.css',
  // The stylesheet styles the projected `wj-avatar` elements, which an emulated scope cannot reach.
  encapsulation: ViewEncapsulation.None,
})
export class WjAvatarGroup {
  /**
   * Pass-through for the group's parts. Tracks Optimus: its part names and attributes follow the
   * installed `@openng/optimus-ui` minor and are outside this component's stable API; changes to
   * them ship only in the release that takes a new Optimus minor and are not breaking.
   */
  readonly pt = input<WjAvatarGroupPt>();

  constructor() {
    _checkWeeljackSetup('wj-avatargroup');
    _checkAriaOnHost(
      'wj-avatargroup',
      'Remove it: the group adds no role and no name, so name each avatar instead',
    );
  }
}
