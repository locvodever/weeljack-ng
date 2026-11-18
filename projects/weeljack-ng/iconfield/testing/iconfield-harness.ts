import { ContentContainerComponentHarness } from '@angular/cdk/testing';

/**
 * Test harness for `wj-iconfield`. Reach the text input inside it with the inherited `getHarness`,
 * for example `iconField.getHarness(WjInputTextHarness)`. An icon's side follows its place: one
 * before the input is leading, one after it is trailing.
 */
export class WjIconFieldHarness extends ContentContainerComponentHarness {
  static hostSelector = 'wj-iconfield';

  private readonly leading = this.locatorForOptional('p-iconfield > wj-inputicon:first-child');
  private readonly trailing = this.locatorForOptional('p-iconfield > wj-inputicon:last-child');

  /** Whether a `wj-inputicon` is the first thing in the icon field, before the input. */
  async hasLeadingIcon(): Promise<boolean> {
    return (await this.leading()) !== null;
  }

  /** Whether a `wj-inputicon` is the last thing in the icon field, after the input. */
  async hasTrailingIcon(): Promise<boolean> {
    return (await this.trailing()) !== null;
  }
}
