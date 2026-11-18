import { Component } from '@angular/core';
import { WjAvatar } from 'weeljack-ng/avatar';

@Component({
  selector: 'docs-avatar-projected-icon-example',
  imports: [WjAvatar],
  template: `
    <wj-avatar shape="circle" ariaLabel="Guest">
      <svg
        width="1em"
        height="1em"
        viewBox="0 0 16 16"
        fill="currentColor"
        aria-hidden="true"
        focusable="false"
      >
        <circle cx="8" cy="5" r="3" />
        <path d="M2 15a6 6 0 0 1 12 0z" />
      </svg>
    </wj-avatar>
  `,
})
export class AvatarProjectedIconExample {}
