import { Component } from '@angular/core';
import { WjIcon, wjIconHeart, wjIconMail, wjIconSearch, wjIconStar } from 'weeljack-ng/icon';

@Component({
  selector: 'docs-icon-basic-example',
  imports: [WjIcon],
  template: `
    <p>
      <wj-icon [icon]="search" /> Search <wj-icon [icon]="mail" /> Mail
      <wj-icon [icon]="star" /> Starred
    </p>
    <p class="large"><wj-icon [icon]="star" /> Two rem</p>
    <p class="accent"><wj-icon [icon]="heart" /> Coloured through <code>color</code></p>
  `,
  styles: `
    :host {
      display: grid;
      gap: 8px;
    }

    p {
      margin: 0;
    }

    .large {
      font-size: 2rem;
    }

    .accent {
      color: var(--wj-primary-color);
    }

    .accent code {
      background: none;
    }
  `,
})
export class IconBasicExample {
  protected readonly search = wjIconSearch;
  protected readonly mail = wjIconMail;
  protected readonly star = wjIconStar;
  protected readonly heart = wjIconHeart;
}
