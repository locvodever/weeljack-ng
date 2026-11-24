import { ComponentHarness, TestKey } from '@angular/cdk/testing';

/** One command the reader entered and the response it got. `response` is empty until answered. */
export interface WjTerminalEntry {
  command: string;
  response: string;
}

/** Test harness for `wj-terminal`. Describes the log and the input as a reader meets them. */
export class WjTerminalHarness extends ComponentHarness {
  static hostSelector = 'wj-terminal';

  private readonly input = this.locatorFor('input');
  private readonly welcome = this.locatorForOptional('[data-wj-welcome]');
  private readonly prompt = this.locatorFor('[data-wj-prompt]');
  private readonly commands = this.locatorForAll('[data-wj-command-value]');
  private readonly responses = this.locatorForAll('[data-wj-response]');

  /** The welcome message, or `''` when there is none. */
  async getWelcomeMessage(): Promise<string> {
    return (await (await this.welcome())?.text()) ?? '';
  }

  /** The prompt text. */
  async getPrompt(): Promise<string> {
    return (await (await this.prompt()).text()).trim();
  }

  /** Types `text` into the input, then presses Enter. */
  async enterCommand(text: string): Promise<void> {
    const input = await this.input();
    if (text) {
      await input.sendKeys(text);
    }
    await input.sendKeys(TestKey.ENTER);
  }

  /** The commands entered, in order, each with its response. */
  async getEntries(): Promise<WjTerminalEntry[]> {
    const [commands, responses] = await Promise.all([this.commands(), this.responses()]);
    return Promise.all(
      commands.map(async (command, index) => ({
        command: (await command.text()).trim(),
        response: (await responses[index]?.text())?.trim() ?? '',
      })),
    );
  }

  /** The accessible name of the command input: its `aria-label`, or the text of its labelledby. */
  async getInputLabel(): Promise<string> {
    const input = await this.input();
    const labelledBy = await input.getAttribute('aria-labelledby');
    if (labelledBy) {
      const names = await Promise.all(
        labelledBy.split(/\s+/).map(async (id) => {
          const target = await this.documentRootLocatorFactory().locatorForOptional(`#${id}`)();
          return (await target?.text()) ?? '';
        }),
      );
      return names.join(' ').trim();
    }
    return (await input.getAttribute('aria-label')) ?? '';
  }

  /** Moves focus to the command input. */
  async focusInput(): Promise<void> {
    await (await this.input()).focus();
  }

  /** Whether the command input has focus. */
  async isInputFocused(): Promise<boolean> {
    return (await this.input()).isFocused();
  }
}
