import { NgComponentOutlet } from '@angular/common';
import {
  Component,
  DestroyRef,
  Injector,
  afterNextRender,
  inject,
  signal,
  type Type,
} from '@angular/core';
import { Dialog } from '@openng/optimus-ui/dialog';
import {
  DynamicDialog,
  DynamicDialogConfig,
  DynamicDialogRef,
} from '@openng/optimus-ui/dynamicdialog';
import { _focusIntoOverlay, _overlayEscapeGate, _overlayLifecycle } from 'weeljack-ng/private';
import { WjDynamicDialogRef } from './dynamicdialog-ref';

/**
 * What `WjDialogService` hands Optimus as the dialog's `data`: Optimus's per-dialog injector
 * carries only its own config and ref, so this component reads the app's component, the
 * `WjDynamicDialogRef` and the close rule from there.
 */
export interface WjDynamicDialogLoad {
  component: Type<unknown>;
  ref: object;
  closable: boolean;
  /** Called once the dialog is gone (also when it is destroyed without having been closed). */
  finish: () => void;
}

function isLoad(value: unknown): value is WjDynamicDialogLoad {
  return (
    typeof value === 'object' &&
    value !== null &&
    'component' in value &&
    typeof value.component === 'function' &&
    'ref' in value &&
    typeof value.ref === 'object' &&
    'closable' in value &&
    typeof value.closable === 'boolean' &&
    'finish' in value &&
    typeof value.finish === 'function'
  );
}

/**
 * The dynamic dialog binds the close button's `closeButtonProps` with no `autofocus: false`, and
 * `pt` cannot clear the `autofocus` it then writes (Optimus's `pAutoFocus` sets it again on every
 * check). The Dialog is the `instance` the parts' `pt` functions are called with, and the first of
 * them runs before the close button is bound, so the props `wj-dialog` binds are set on it from
 * there.
 */
export function wjKeepCloseButtonInert(context: unknown, props: Dialog['closeButtonProps']): void {
  const dialog: unknown = Reflect.get(Object(context), 'instance');
  if (dialog instanceof Dialog) {
    dialog.closeButtonProps = props;
  }
}

/**
 * The body of every dynamic dialog: renders the app's component inside Optimus's dialog, with an
 * injector that provides `WjDynamicDialogRef`, and owns what the app's component cannot: focus in
 * and back, the Escape stack, and settling `closed`. Internal: not exported from `public-api.ts`.
 *
 * The width cap is the viewport minus 1rem each side (WCAG 1.4.10) minus what the panel adds around
 * its body: Aura's padding (`--wj-overlay-modal-padding`, 20px) and 1px border on each side. No CSS
 * reaches the panel itself, which is in `document.body`, so the cap sits on this element; a header
 * longer than the content can still widen the panel up to the viewport.
 */
@Component({
  selector: 'wj-dynamicdialog-content',
  imports: [NgComponentOutlet],
  template: `<ng-container
    [ngComponentOutlet]="load.component"
    [ngComponentOutletInjector]="injector"
  />`,
  styles: `
    @layer wj {
      :host {
        display: block;
        min-inline-size: 0;
        max-inline-size: calc(100vw - 2rem - 2 * var(--wj-overlay-modal-padding, 20px) - 2px);
      }
    }
  `,
})
export class WjDynamicDialogContent {
  protected readonly load: WjDynamicDialogLoad;
  protected readonly injector: Injector;
  private readonly open = signal(true);

  constructor() {
    const data: unknown = inject(DynamicDialogConfig).data;
    if (!isLoad(data)) {
      throw new Error('WjDynamicDialogContent is opened by WjDialogService only.');
    }
    this.load = data;
    const parent = inject(Injector);
    this.injector = Injector.create({
      providers: [{ provide: WjDynamicDialogRef, useValue: data.ref }],
      parent,
    });

    // Every way of closing (the button, Escape, `ref.close`) ends in Optimus's `onClose`.
    const closing = inject(DynamicDialogRef).onClose.subscribe(() => {
      this.open.set(false);
    });
    _overlayEscapeGate(this.open, () => data.closable);
    const lifecycle = _overlayLifecycle(
      () => true,
      () => undefined,
    );

    // Optimus's `focusOnShow` is off: focus moves in as `wj-dialog` does, once the dialog entered.
    const dialog = inject(Dialog);
    const entered = dialog.onShow.subscribe(() => {
      _focusIntoOverlay(dialog.container(), [
        dialog.contentViewChild,
        dialog.footerViewChild,
        dialog.headerViewChild,
      ]);
    });

    // Optimus destroys this component from `onDialogHide`, when the Dialog has left, for every
    // cause. Focus goes back to the opener first, and the lifecycle puts back the scroll lock a
    // modal below still needs in the next render, which needs this component alive: so Optimus's
    // destroy waits for that render. `closed` settles from `onDestroy`.
    const optimus = inject(DynamicDialog);
    const hide = optimus.onDialogHide.bind(optimus);
    optimus.onDialogHide = (event: unknown) => {
      lifecycle.left();
      afterNextRender(
        () => {
          hide(event);
        },
        { injector: parent },
      );
    };

    inject(DestroyRef).onDestroy(() => {
      closing.unsubscribe();
      entered.unsubscribe();
      data.finish();
    });
  }
}
