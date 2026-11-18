import { ComponentHarness } from '@angular/cdk/testing';

/** The spinner's accessible name and description ids, each `null` when absent. */
export interface WjProgressSpinnerAria {
  label: string | null;
  labelledBy: string | null;
  describedBy: string | null;
}

/** Test harness for `wj-progressspinner`. Describes the spinner as a user meets it, not how it is built. */
export class WjProgressSpinnerHarness extends ComponentHarness {
  static hostSelector = 'wj-progressspinner';

  private readonly bar = this.locatorFor('[role="progressbar"]');

  /** The name and description attributes on the `progressbar` element, `null` where absent. */
  async getAriaAttributes(): Promise<WjProgressSpinnerAria> {
    const bar = await this.bar();
    return {
      label: await bar.getAttribute('aria-label'),
      labelledBy: await bar.getAttribute('aria-labelledby'),
      describedBy: await bar.getAttribute('aria-describedby'),
    };
  }

  /** Whether the spinner reports itself busy (`aria-busy="true"`). */
  async isBusy(): Promise<boolean> {
    return (await (await this.bar()).getAttribute('aria-busy')) === 'true';
  }
}
