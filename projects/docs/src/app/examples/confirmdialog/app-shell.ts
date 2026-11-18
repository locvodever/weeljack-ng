import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { WjConfirmDialog } from 'weeljack-ng/confirmdialog';

/**
 * The root component of an app: one `wj-confirmdialog` beside the router outlet. Render exactly
 * one, here, so a confirmation asked from any page has a host. Provide nothing else:
 * `WjConfirmationService` is root-provided. A feature component then asks with
 * `inject(WjConfirmationService).confirm({ header, message, accept })`.
 */
@Component({
  selector: 'docs-confirmdialog-app-shell-example',
  imports: [RouterOutlet, WjConfirmDialog],
  template: `
    <wj-confirmdialog />
    <router-outlet />
  `,
})
export class ConfirmDialogAppShellExample {}
