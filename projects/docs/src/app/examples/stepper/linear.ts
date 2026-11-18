import {
  Component,
  DOCUMENT,
  ElementRef,
  Injector,
  afterNextRender,
  inject,
  signal,
} from '@angular/core';
import { WjButton } from 'weeljack-ng/button';
import {
  WjStep,
  WjStepList,
  WjStepPanel,
  WjStepPanels,
  WjStepper,
  type WjStepperValue,
} from 'weeljack-ng/stepper';

@Component({
  selector: 'docs-stepper-linear-example',
  imports: [WjStepper, WjStepList, WjStep, WjStepPanels, WjStepPanel, WjButton],
  template: `
    <wj-stepper [(value)]="value" linear>
      <wj-step-list>
        <wj-step [value]="1">Details</wj-step>
        <wj-step [value]="2">Preferences</wj-step>
        <wj-step [value]="3">Confirm</wj-step>
      </wj-step-list>
      <wj-step-panels>
        <wj-step-panel [value]="1">
          <h4 id="stepper-linear-1" tabindex="-1">Details</h4>
          <p>Tell us who the order is for.</p>
          <div class="actions">
            <wj-button class="end" label="Next" size="small" (click)="go(2)" />
          </div>
        </wj-step-panel>
        <wj-step-panel [value]="2">
          <h4 id="stepper-linear-2" tabindex="-1">Preferences</h4>
          <p>Choose how we should reach you about it.</p>
          <div class="actions">
            <wj-button
              label="Back"
              size="small"
              severity="secondary"
              variant="outlined"
              (click)="go(1)"
            />
            <wj-button class="end" label="Next" size="small" (click)="go(3)" />
          </div>
        </wj-step-panel>
        <wj-step-panel [value]="3">
          <h4 id="stepper-linear-3" tabindex="-1">Confirm</h4>
          <p>Check the order, then confirm it.</p>
          <div class="actions">
            <wj-button
              label="Back"
              size="small"
              severity="secondary"
              variant="outlined"
              (click)="go(2)"
            />
            <wj-button class="end" label="Confirm" size="small" (click)="confirmed.set(true)" />
          </div>
        </wj-step-panel>
      </wj-step-panels>
    </wj-stepper>
    <p class="state" role="status">{{ confirmed() ? 'Confirmed.' : '' }}</p>
  `,
  styles: `
    :host {
      display: block;
      max-inline-size: 40rem;
    }

    h4 {
      margin: 0 0 8px;
      font-size: 1rem;
    }

    p {
      margin: 0;
    }

    .actions {
      display: flex;
      gap: 8px;
      margin-block-start: 16px;
    }

    .end {
      margin-inline-start: auto;
    }

    .state {
      margin: 8px 0 0;
      min-block-size: 1.25rem;
      font-size: 0.875rem;
      color: var(--wj-text-muted-color);
    }
  `,
})
export class StepperLinearExample {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly view = inject(DOCUMENT).defaultView;
  private readonly injector = inject(Injector);

  protected readonly value = signal<WjStepperValue>(1);
  protected readonly confirmed = signal(false);

  /**
   * Moves to a step and then to its heading. The panel that held the focused button hides on the
   * change, so focus would be lost; the heading tells a screen-reader user where they are. A panel
   * is shown a frame after it renders, and a hidden element cannot take focus, so wait two frames.
   */
  protected go(next: WjStepperValue): void {
    this.confirmed.set(false);
    this.value.set(next);
    afterNextRender(
      () => {
        const focus = (): void => {
          this.host.nativeElement
            .querySelector<HTMLElement>(`#stepper-linear-${String(next)}`)
            ?.focus();
        };
        this.view?.requestAnimationFrame(() => this.view?.requestAnimationFrame(focus));
      },
      { injector: this.injector },
    );
  }
}
