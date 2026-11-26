import { DOCUMENT } from '@angular/common';
import {
  ApplicationRef,
  Injectable,
  InjectionToken,
  Injector,
  inject,
  type Type,
} from '@angular/core';
import { DialogService } from '@openng/optimus-ui/dynamicdialog';
import {
  _OVERLAY_CLOSE_BUTTON,
  _OVERLAY_MOTION,
  _checkWeeljackSetup,
  _mergePartAttributes,
  _overlayCloseLabel,
  _overlayLifecycle,
} from 'weeljack-ng/private';
import { WjDynamicDialogContent, wjKeepCloseButtonInert } from './dynamicdialog-content';
import { WjDynamicDialogRef } from './dynamicdialog-ref';
import type { WjDynamicDialogConfig, WjDynamicDialogPt } from './dynamicdialog-types';

/**
 * The one Optimus `DialogService` of an application (W1-display 4.4). Optimus declares it
 * `@Injectable()` with no `providedIn`, so an internal root token builds it from the same three
 * things Optimus injects: one per application injector, which on the server means one per
 * request. Internal: not exported from `public-api.ts`.
 *
 * @docs-private
 */
export const WJ_DIALOGS = new InjectionToken<DialogService>('WJ_DIALOGS', {
  providedIn: 'root',
  factory: () => new DialogService(inject(ApplicationRef), inject(Injector), inject(DOCUMENT)),
});

/**
 * The consumer's `pt` plus what the dynamic dialog sets: the `data-wj-dynamicdialog` hook the
 * harness finds, and `safe` motion on the dialog and its mask (Optimus's Dialog reads both from
 * `pt`). Optimus hands this `pt` straight to its Dialog, which resolves the function form itself.
 */
function partAttributes(pt: WjDynamicDialogPt | undefined): WjDynamicDialogPt {
  let merged = _mergePartAttributes(pt, 'root', { 'data-wj-dynamicdialog': '' });
  merged = _mergePartAttributes(merged, 'motion', _OVERLAY_MOTION);
  const result = _mergePartAttributes(merged, 'maskMotion', _OVERLAY_MOTION);
  return (context) => {
    wjKeepCloseButtonInert(context, _OVERLAY_CLOSE_BUTTON);
    return result(context);
  };
}

/**
 * Opens your own component in a modal dialog from code, as
 * `inject(WjDialogService).open(Component, { header, data })`. Root-provided: inject it anywhere,
 * provide nothing. The component closes its dialog through `inject(WjDynamicDialogRef)`.
 *
 * The dialog is named by its `header`; focus moves in when it opens and returns to the element
 * that opened it before `closed` settles; Escape and the close button close it, never the
 * backdrop. It is as wide as the component, never draggable, resizable or maximizable.
 *
 * The component is created from the application's root injector, not from the caller's component
 * tree: a service provided only in the caller's tree is not found there. The service follows the
 * root-provided `Wj*` service pattern: an internal root token holds the one Optimus service.
 */
@Injectable({ providedIn: 'root' })
export class WjDialogService {
  private readonly dialogs = inject(WJ_DIALOGS);
  private readonly closeLabel = _overlayCloseLabel();
  private readonly shown = new Map<Type<unknown>, object>();

  constructor() {
    _checkWeeljackSetup('WjDialogService');
    // The Safari opener fallback listens for presses from the first lifecycle on. No overlay
    // exists before the first `open`, which a press has already started, so the listener is
    // installed here, as soon as the service is injected. The lifecycle itself is never used.
    _overlayLifecycle(
      () => false,
      () => undefined,
    );
  }

  /**
   * Opens `component` in a dialog and returns its ref. `R` is the result the component closes
   * with, `D` the type of `config.data`. When `component` is already open, no second dialog opens:
   * the open one's ref is returned and `config` is ignored.
   */
  open<R = unknown, D = unknown>(
    component: Type<unknown>,
    config: WjDynamicDialogConfig<D>,
  ): WjDynamicDialogRef<R, D> {
    const shown = this.shown.get(component);
    if (shown !== undefined) {
      return shown as WjDynamicDialogRef<R, D>;
    }

    let settle: (result: R | undefined) => void = () => undefined;
    const closed = new Promise<R | undefined>((resolve) => {
      settle = resolve;
    });
    let result: R | undefined;
    let decided = false;
    // Only the first close counts: a close from the app, then Escape while it leaves. A dialog
    // that is closing is no longer "already open", so the same component can open anew.
    const decide = (value: R | undefined): void => {
      if (!decided) {
        decided = true;
        result = value;
      }
      this.release(component, ref);
    };

    // `data` is only absent when the app gave none; the ref promises `D` to a component that reads it.
    const ref = new WjDynamicDialogRef<R, D>(config.data as D, closed, (value) => {
      decide(value);
      dialog?.close(value);
    });
    const closable = config.closable ?? true;
    // Optimus's own duplicate check sees one component type, so it is switched off (`duplicate`);
    // `shown` is the check by the app's component. `open` returns `null` only for a duplicate.
    // eslint-disable-next-line @typescript-eslint/no-unsafe-class-instance-assignment -- Optimus's DynamicDialogConfig is an options bag (optional fields only, no constructor logic or private state), and `open` takes a literal
    const dialog = this.dialogs.open(WjDynamicDialogContent, {
      header: config.header,
      closable,
      duplicate: true,
      draggable: false,
      resizable: false,
      focusOnShow: false,
      closeAriaLabel: this.closeLabel,
      pt: partAttributes(config.pt),
      data: {
        component,
        ref,
        closable,
        finish: () => {
          this.release(component, ref);
          settle(result);
        },
      },
    });
    dialog?.onClose.subscribe(() => {
      decide(undefined);
    });
    this.shown.set(component, ref);
    return ref;
  }

  private release(component: Type<unknown>, ref: object): void {
    if (this.shown.get(component) === ref) {
      this.shown.delete(component);
    }
  }
}
