/**
 * One open dynamic dialog. `WjDialogService.open` returns it, and the component the dialog shows
 * gets the same instance from `inject(WjDynamicDialogRef)`. `R` is the result the component closes
 * with, `D` the `data` it was given.
 */
export class WjDynamicDialogRef<R = unknown, D = unknown> {
  /**
   * Settles once, after the dialog is gone and focus is back on the element that opened it, with
   * what `close(result)` was given. Escape, the close button and `close()` with nothing give
   * `undefined`.
   */
  readonly closed: Promise<R | undefined>;

  /** The `data` the dialog was opened with. */
  readonly data: D;

  private readonly dismiss: (result: R | undefined) => void;

  /** Made by `WjDialogService.open`; an app never constructs one. */
  constructor(data: D, closed: Promise<R | undefined>, dismiss: (result: R | undefined) => void) {
    this.data = data;
    this.closed = closed;
    this.dismiss = dismiss;
  }

  /** Closes the dialog. Only the first close of a dialog counts. */
  close(result?: R): void {
    this.dismiss(result);
  }
}
