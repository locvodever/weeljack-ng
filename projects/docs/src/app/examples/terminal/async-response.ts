import { Component, inject } from '@angular/core';
import { WjTerminal, WjTerminalService } from 'weeljack-ng/terminal';

/** An app's own lookup: any promise will do, such as a request to your backend. */
const lookUp = (name: string): Promise<string> => Promise.resolve(`${name} is in the directory.`);

/** Source only: the answer is sent after an `await`, which is still announced once. */
@Component({
  selector: 'docs-terminal-async-response-example',
  imports: [WjTerminal],
  template: `<wj-terminal prompt=">" (commandEntered)="answer($event)" />`,
})
export class TerminalAsyncResponseExample {
  private readonly terminal = inject(WjTerminalService);

  async answer(command: string): Promise<void> {
    const reply = await lookUp(command);
    // Answers are not matched to commands: `respond()` fills the newest command, so a slow answer
    // to an earlier command appears under a later one if the reader has entered it meanwhile.
    this.terminal.respond(reply);
  }
}
