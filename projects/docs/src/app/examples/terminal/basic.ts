import { Component, inject } from '@angular/core';
import { WjTerminal, WjTerminalService } from 'weeljack-ng/terminal';

/** The page's one live `wj-terminal`: the answers are synchronous, one sentence each. */
@Component({
  selector: 'docs-terminal-basic-example',
  imports: [WjTerminal],
  template: `
    <wj-terminal
      prompt="$"
      welcomeMessage="Type help and press Enter."
      (commandEntered)="answer($event)"
    />
  `,
  styles: `
    :host {
      display: block;
      inline-size: min(100%, 40rem);
    }
  `,
})
export class TerminalBasicExample {
  private readonly terminal = inject(WjTerminalService);
  private readonly date = new Intl.DateTimeFormat('en', { dateStyle: 'long' });

  answer(command: string): void {
    switch (command.trim().toLowerCase()) {
      case 'help':
        this.terminal.respond('Commands: date, help.');
        break;
      case 'date':
        this.terminal.respond(this.date.format(new Date()));
        break;
      default:
        this.terminal.respond('Unknown command');
    }
  }
}
