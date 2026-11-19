import {
  Component,
  ErrorHandler,
  OnInit,
  ViewContainerRef,
  inject,
  input,
  signal,
  type ComponentRef,
  type Type,
} from '@angular/core';

/**
 * A live example's place inside a `.live docs-live` box (FR-26). It creates the example next to
 * its own host, so the example's host stays a direct child of the box and the global
 * `.docs-live > *` row still reaches it, and runs the example's first change detection inside
 * `try`. When that throws the example is destroyed and the box shows "This example failed to
 * render"; the error still reaches `ErrorHandler` (21 Q8). Errors after the first render are not
 * caught here.
 */
@Component({
  selector: 'docs-example-frame',
  host: { style: 'display: contents' },
  styleUrl: './example-frame.css',
  template: `
    @if (failed()) {
      <p class="failed">This example failed to render</p>
    }
  `,
})
export class ExampleFrame implements OnInit {
  /** The example component to render. */
  readonly component = input.required<Type<unknown>>();

  protected readonly failed = signal(false);

  private readonly container = inject(ViewContainerRef);
  private readonly errorHandler = inject(ErrorHandler);

  ngOnInit(): void {
    let ref: ComponentRef<unknown> | undefined;
    try {
      ref = this.container.createComponent(this.component());
      ref.changeDetectorRef.detectChanges();
    } catch (error) {
      ref?.destroy();
      this.failed.set(true);
      this.errorHandler.handleError(error);
    }
  }
}
