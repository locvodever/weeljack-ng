import { Component, DestroyRef, computed, inject, input, output, viewChild } from '@angular/core';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { Terminal, TerminalService } from '@openng/optimus-ui/terminal';
import {
  _checkAriaOnHost,
  _checkWeeljackSetup,
  _mergePartAttributes,
  _warnOnce,
  _wjStrings,
} from 'weeljack-ng/private';
import { WJ_TERMINAL, WJ_TERMINAL_STATE } from './terminal-service';
import type { WjTerminalPt } from './terminal-types';

/**
 * A text command line over Optimus's `p-terminal`: the reader types a command, `commandEntered`
 * emits it, and your code answers it with `WjTerminalService.respond()`. Render one `wj-terminal`
 * at a time and provide nothing: every host shares the root-provided service.
 *
 * The input is named by `ariaLabel`, `ariaLabelledBy` or else the translation's `wj.terminalCommand`,
 * and rendering never moves focus. Each response is announced politely, once.
 */
@Component({
  selector: 'wj-terminal',
  imports: [Terminal],
  styleUrl: './terminal.css',
  // prettier-ignore
  template: `<p-terminal [welcomeMessage]="welcomeMessage()" [prompt]="prompt()" [pt]="partAttributes()" />`,
  // The host connects to the service (W1-display 4.4): Optimus's terminal injects `TerminalService`,
  // and gets the instance `WjTerminalService` answers through.
  providers: [{ provide: TerminalService, useExisting: WJ_TERMINAL }],
})
export class WjTerminal {
  /** Text shown above the first command. Renders as text. */
  readonly welcomeMessage = input<string>();
  /** Text shown before each command and before the input. Renders as text. */
  readonly prompt = input<string>();
  /** Accessible name of the command input. Defaults to the translation's `wj.terminalCommand`. */
  readonly ariaLabel = input<string>();
  /** Id of the element that names the command input. Set on the input. */
  readonly ariaLabelledBy = input<string>();
  /** Id of the element that describes the command input. Set on the input. */
  readonly ariaDescribedBy = input<string>();
  /**
   * Pass-through for the terminal's parts. Tracks Optimus: its part names and attributes follow the
   * installed `@openng/optimus-ui` minor and are outside this component's stable API; changes to
   * them ship only in the release that takes a new Optimus minor and are not breaking.
   */
  readonly pt = input<WjTerminalPt>();
  /** Emits the text of each command the reader enters. Answer it with `WjTerminalService`. */
  readonly commandEntered = output<string>();

  private readonly terminal = viewChild.required(Terminal);
  private readonly name = _wjStrings()('terminalCommand');

  /**
   * `pt` forwarded as given, plus the attributes this wrapper sets: the input's name and
   * description, no `autofocus` on it, no `aria-live` on a response (it is announced instead), and
   * the `data-wj-*` hooks the harness reads. Optimus passes one `pt` to every part, so the parts
   * of each command are covered too.
   */
  protected readonly partAttributes = computed<WjTerminalPt>(() => {
    const input = _mergePartAttributes(this.pt(), 'promptValue', {
      'aria-label': this.ariaLabel() ?? this.name,
      'aria-labelledby': this.ariaLabelledBy(),
      'aria-describedby': this.ariaDescribedBy(),
      autofocus: null,
    });
    return _mergePartAttributes(
      _mergePartAttributes(
        _mergePartAttributes(
          _mergePartAttributes(
            _mergePartAttributes(input, 'welcomeMessage', { 'data-wj-welcome': '' }),
            'prompt',
            { 'data-wj-prompt': '' },
          ),
          'commandResponse',
          {
            'aria-live': null,
            'data-wj-response': '',
          },
        ),
        'command',
        { 'data-wj-command': '' },
      ),
      'commandValue',
      { 'data-wj-command-value': '' },
    );
  });

  constructor() {
    _checkWeeljackSetup('wj-terminal');
    _checkAriaOnHost('wj-terminal');

    const service = inject(WJ_TERMINAL);
    const state = inject(WJ_TERMINAL_STATE);
    const announcer = inject(LiveAnnouncer);

    // A second live host would show every response and throw in the one with no command (FR-40).
    if (state.hosts++ > 0) {
      _warnOnce(
        'WJ0181',
        'wj-terminal',
        'a second wj-terminal is rendered, and every wj-terminal shares WjTerminalService',
        'Render one wj-terminal at a time',
      );
    } else {
      state.waiting = false;
    }

    // `.subscribe` needs no `rxjs` import here, so the package gains no `rxjs` peer.
    const commands = service.commandHandler.subscribe((text) => {
      state.waiting = true;
      this.commandEntered.emit(text);
    });
    // Optimus writes a response into a plain field with no `markForCheck`, so mark it ourselves.
    const responses = service.responseHandler.subscribe((text) => {
      this.terminal().cd.markForCheck();
      void announcer.announce(text, 'polite');
    });
    inject(DestroyRef).onDestroy(() => {
      commands.unsubscribe();
      responses.unsubscribe();
      state.hosts--;
      state.waiting = false;
    });
  }
}
