import { ComponentHarness, type TestElement } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';

/** How a `wj-fileupload` shows: a bordered box with a queue, or a single button. */
export type WjFileUploadHarnessMode = 'advanced' | 'basic';

/**
 * Test harness for `wj-fileupload`. Describes the uploader as a user meets it: choose files, see
 * the queue and the messages, press Upload or Cancel, remove one file. It never opens the
 * operating system's file dialog, and it sends nothing.
 */
export class WjFileUploadHarness extends ComponentHarness {
  static hostSelector = 'wj-fileupload';

  private readonly fileInput = this.locatorFor('input[type="file"]');
  private readonly header = this.locatorForOptional('[data-pc-section="header"]');
  private readonly headerButtons = this.locatorForAll('[data-pc-section="header"] button');
  private readonly chooseButton = this.locatorFor(
    '[data-pc-section="header"] button, [data-pc-section="basiccontent"] button',
  );
  private readonly fileNames = this.locatorForAll('[data-pc-section="filename"]');
  private readonly alerts = this.locatorForAll('[role="alert"]');
  private readonly removeButtons = this.locatorForAll('[data-pc-section="fileactions"] button');

  /** Chooses `files` as the user would: through the hidden file input, as a change event. */
  async chooseFiles(files: readonly File[]): Promise<void> {
    const transfer = new DataTransfer();
    for (const file of files) {
      transfer.items.add(file);
    }
    const input = TestbedHarnessEnvironment.getNativeElement(await this.fileInput());
    if (!(input instanceof HTMLInputElement)) {
      throw new Error('wj-fileupload: the file input is missing');
    }
    input.files = transfer.files;
    input.dispatchEvent(new Event('change', { bubbles: true }));
    await this.forceStabilize();
  }

  /** The names of the queued files, in order. */
  async getFileNames(): Promise<string[]> {
    return Promise.all((await this.fileNames()).map(async (name) => (await name.text()).trim()));
  }

  /** The validation messages, one per rejected file or breached limit. */
  async getMessages(): Promise<string[]> {
    return Promise.all((await this.alerts()).map(async (alert) => (await alert.text()).trim()));
  }

  /** Presses Upload. Only `advanced` mode without `auto` has the button. */
  async pressUpload(): Promise<void> {
    await (await this.headerButton(1, 'Upload')).click();
  }

  /** Presses Cancel, which empties the queue. Only `advanced` mode without `auto` has it. */
  async pressCancel(): Promise<void> {
    await (await this.headerButton(2, 'Cancel')).click();
  }

  /** Removes the queued file at `index`, with its Remove button. */
  async removeFile(index: number): Promise<void> {
    const button = (await this.removeButtons())[index];
    if (button === undefined) {
      throw new Error(`wj-fileupload: there is no file at index ${String(index)}`);
    }
    await button.click();
  }

  /** Whether the Choose button is disabled: the component is `disabled`, or its limit is reached. */
  async isDisabled(): Promise<boolean> {
    return (await this.chooseButton()).getProperty<boolean>('disabled');
  }

  /** Whether the component shows as the `advanced` box or the `basic` button. */
  async getMode(): Promise<WjFileUploadHarnessMode> {
    return (await this.header()) === null ? 'basic' : 'advanced';
  }

  private async headerButton(index: number, name: string): Promise<TestElement> {
    const button = (await this.headerButtons())[index];
    if (button === undefined) {
      throw new Error(`wj-fileupload: there is no ${name} button (basic mode, or \`auto\`)`);
    }
    return button;
  }
}
