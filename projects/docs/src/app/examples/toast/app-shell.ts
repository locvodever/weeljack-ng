import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { WjToast } from 'weeljack-ng/toast';

/**
 * The root component of an app: one `wj-toast` beside the router outlet. Render exactly one,
 * here, so a message shown from any page has a host. Provide nothing else: `WjToastService`
 * is root-provided.
 */
@Component({
  selector: 'docs-toast-app-shell-example',
  imports: [RouterOutlet, WjToast],
  template: `
    <wj-toast position="top-right" />
    <router-outlet />
  `,
})
export class ToastAppShellExample {}
