import { AvatarGroupBasicExample } from '../../../examples/avatargroup/basic';
import { AvatarGroupSizesExample } from '../../../examples/avatargroup/sizes';
import type { ComponentDoc, MappingRow } from '../component-doc';

const droppedAlways = 'Never exposed on any wrapper (ADR 0002).';

const dropped = (optimus: string, note: string): MappingRow => ({
  optimus,
  weeljack: 'None',
  status: 'dropped',
  note,
});

export const DOC: ComponentDoc = {
  entry: 'avatargroup',
  title: 'Avatar group',
  purpose: 'A row of overlapping avatars, such as the people on a team or in a thread.',
  examples: [
    {
      title: 'Basic group',
      description:
        'Project `wj-avatar` elements. Each avatar stands alone in the group, so each is named; the last is a "+N" label avatar that says how many people it stands for.',
      sourceKey: 'avatargroup/basic',
      component: AvatarGroupBasicExample,
    },
    {
      title: 'Sizes in a group',
      description:
        'Give every avatar in a group the same `size`. Each avatar after the first overlaps the one before by 12 px, 16 px for `large` and 24 px for `xlarge`; a pair of different sizes takes the 12 px default. Later avatars sit over earlier ones.',
      sourceKey: 'avatargroup/sizes',
      component: AvatarGroupSizesExample,
    },
    {
      title: 'Testing with the harness',
      description:
        'Import `WjAvatarGroupHarness` from `weeljack-ng/avatargroup/testing`. `getAvatars()` hands back the avatars as `WjAvatarHarness`es, narrowed by the same filters (`label`), and `getAvatarCount()` counts them.',
      sourceKey: 'avatargroup/testing',
      component: null,
    },
  ],
  keyboard: [{ key: 'Tab', effect: 'The group adds no Tab stop.' }],
  aria: [
    'The group adds no role and no name, and neither does Optimus. Name each avatar with `ariaLabel` or `ariaLabelledBy`: each then reads as one image with that name.',
    'Show at most five avatars, then a "+N" label avatar that is named too, for example "3 more people".',
    'An `aria-*` attribute on `wj-avatargroup` is not forwarded and raises `WJ0003` in development: name the avatars instead.',
    'The keyboard and screen-reader pass (NVDA with Chrome) is recorded on this page before this component’s long-tail release.',
  ],
  stylingIntro:
    'Colours, radius and focus ring come from the `--wj-*` variables that `provideWeeljack` emits. The host is `flex`, the display of the Optimus group, and adds no padding, border or background. Optimus’s overlap rules select sibling Optimus avatars, and each one now sits alone inside its `wj-avatar`, so the group restates them for `wj-avatar` children: the offset from `--wj-avatar-group-offset`, `--wj-avatar-lg-group-offset` and `--wj-avatar-xl-group-offset`. The 2 px ring in `--wj-avatar-group-border-color` that cuts each avatar out of the one beneath is Optimus’s own rule, which still reaches every avatar inside the group. Nothing wraps or squashes: past its container the stack overflows, unclipped, and with no avatars it renders nothing. For anything else, `pt` reaches the part of the Optimus group underneath. It tracks Optimus 2.0: part names and attributes follow the installed `@openng/optimus-ui` minor and are outside the stable API of `wj-avatargroup`. Changes to them ship only in the release that takes a new Optimus minor, and are not breaking.',
  parts: [
    {
      part: 'root',
      description: 'The Optimus `p-avatargroup` element that holds the projected avatars.',
    },
  ],
  mapping: [
    {
      optimus: 'pt',
      weeljack: 'pt',
      status: 'kept',
      note: 'Typed `WjAvatarGroupPt`. Tracks Optimus.',
    },
    {
      optimus: 'Projected content',
      weeljack: 'Projected content',
      status: 'kept',
      note: 'Project `wj-avatar` elements.',
    },
    dropped('styleClass, style', droppedAlways),
    dropped('dt, unstyled, ptOptions', droppedAlways),
    dropped('p-avatarGroup, p-avatar-group', 'Duplicate selectors: only `wj-avatargroup`.'),
  ],
};
