import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { WjConfirmDialog } from 'weeljack-ng/confirmdialog';
import { WjConfirmPopup } from 'weeljack-ng/confirmpopup';

/**
 * The root component of an app: one `wj-confirmdialog` and one `wj-confirmpopup` beside the router
 * outlet. Render exactly one of each, here, so a confirmation asked from any page has a host: the
 * dialog opens a confirmation without a `target`, the popup one with a `target`. Provide nothing else:
 * `WjConfirmationService` is root-provided. A feature component then asks with
 * `inject(WjConfirmationService).confirm({ header, message, accept })`.
 */
@Component({
  selector: 'docs-confirmdialog-app-shell-example',
  imports: [RouterOutlet, WjConfirmDialog, WjConfirmPopup],
  template: `
    <wj-confirmdialog />
    <wj-confirmpopup />
    <router-outlet />
  `,
})
export class ConfirmDialogAppShellExample {}
