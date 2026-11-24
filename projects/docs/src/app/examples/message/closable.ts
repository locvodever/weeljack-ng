import { Component, ElementRef, Injector, afterNextRender, inject, signal } from '@angular/core';
import { WjButton } from 'weeljack-ng/button';
import { WjMessage } from 'weeljack-ng/message';

@Component({
  selector: 'docs-message-closable-example',
  imports: [WjButton, WjMessage],
  template: `
    @if (shown()) {
      <wj-message closable (closed)="hide()">
        <strong>Filters remembered.</strong> This list opens with the filters you used last.
      </wj-message>
    } @else {
      <wj-button
        id="message-show"
        label="Show the message"
        size="small"
        severity="secondary"
        variant="outlined"
        (click)="show()"
      />
    }
  `,
  styles: `
    :host {
      display: block;
      max-inline-size: 40rem;
    }
  `,
})
export class MessageClosableExample {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);

  protected readonly shown = signal(true);

  /** The close button goes with its message, so focus goes to the control that takes its place. */
  protected hide(): void {
    this.shown.set(false);
    this.focus('#message-show button');
  }

  /** Rendering the message again announces it politely, as a status. */
  protected show(): void {
    this.shown.set(true);
    this.focus('wj-message button');
  }

  /** Focus is the app's to move: `wj-message` never moves it. */
  private focus(selector: string): void {
    afterNextRender(
      () => {
        this.host.nativeElement.querySelector<HTMLElement>(selector)?.focus();
      },
      { injector: this.injector },
    );
  }
}
