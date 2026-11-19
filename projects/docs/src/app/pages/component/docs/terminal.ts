import { TerminalBasicExample } from '../../../examples/terminal/basic';
import type { ComponentDoc, MappingRow } from '../component-doc';

const dropped = (optimus: string, note: string): MappingRow => ({
  optimus,
  weeljack: 'None',
  status: 'dropped',
  note,
});

export const DOC: ComponentDoc = {
  entry: 'terminal',
  title: 'Terminal',
  purpose:
    'A text command line: the reader types a command, and your code answers it through `WjTerminalService`.',
  examples: [
    {
      title: 'Basic',
      description:
        'The page’s one live `wj-terminal`. `commandEntered` emits each command and the handler answers it with `WjTerminalService.respond()`: `help`, `date`, or "Unknown command" for anything else. Provide nothing: the service is root-provided, and the host reads the same instance. Render one `wj-terminal` at a time.',
      sourceKey: 'terminal/basic',
      component: TerminalBasicExample,
    },
    {
      title: 'Async response',
      description:
        'Answer after an `await`: `wj-terminal` renders the answer without any other trigger and announces it once. Answers are not matched to commands. `respond()` fills the newest command, so if the reader enters a second command before the awaited answer to the first arrives, that answer shows under the second.',
      sourceKey: 'terminal/async-response',
      component: null,
    },
    {
      title: 'Testing',
      description:
        "Import `WjTerminalHarness` from `weeljack-ng/terminal/testing`. `enterCommand(text)` types the text and presses Enter, `getEntries()` returns each command with its response, and `getWelcomeMessage()`, `getPrompt()`, `getInputLabel()`, `focusInput()` and `isInputFocused()` describe the rest. To check what your code answered, spy on the service: `vi.spyOn(TestBed.inject(WjTerminalService), 'respond')`. It replaces spying on the Optimus `TerminalService`, and needs no provider.",
      sourceKey: 'terminal/testing',
      component: null,
    },
  ],
  keyboard: [
    { key: 'Tab, Shift+Tab', effect: 'Moves to the command input, and away from it.' },
    {
      key: 'Enter',
      effect: 'Runs the command: it is emitted, and the input is cleared and keeps focus.',
    },
    { key: 'Click anywhere in the terminal', effect: 'Focuses the input.' },
  ],
  aria: [
    'The command input is named by `ariaLabel`, `ariaLabelledBy` or else the translation (`wj.terminalCommand`, "Command" in English). Optimus gives the input no name. `ariaDescribedBy` is set on the input too. The input is Optimus’s focusable part, so `aria-*` on `wj-terminal` raises `WJ0003`.',
    'Rendering never moves focus: Optimus writes `autofocus` on the input, and `wj-terminal` removes it. The welcome message is not announced.',
    'Each response is announced politely, once. Optimus puts `aria-live="polite"` on each response, which a screen reader often skips when the answer is sent at once, so `wj-terminal` removes it and announces the response through the CDK `LiveAnnouncer`, whether you answer at once or after an `await`, and when the same text comes twice. The command you typed is not announced.',
    'The terminal draws the theme’s 2 px focus ring around its whole box while the input has focus. Optimus draws none.',
    'The input is 24 px tall, the minimum target size. Optimus’s line height made it about 18 px.',
    'Long text wraps, so an unbroken word never scrolls the terminal sideways.',
    'Render one `wj-terminal` at a time: every `wj-terminal` shares `WjTerminalService`, so a second one would show every response and fail in the one with no command. In development it raises `WJ0181`. A response sent when no command is waiting is dropped, with `WJ0180`.',
    'The command history is not a list: a screen reader reads it as text, in order.',
    'The terminal is set in a monospace stack (`ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace`), which its prompt and input inherit. Set `font-family` on `wj-terminal` to change it: your unlayered CSS beats the library’s.',
    'A response is one block of text: line breaks in it collapse to spaces. Write one sentence per answer.',
    'The log scrolls to the newest response at once, with no motion.',
    'The screen-reader pass (NVDA with Chrome) is recorded here before W5d’s release.',
  ],
  stylingIntro:
    'Colours, radius and spacing come from the `--wj-*` variables that `provideWeeljack` emits. For anything else, `pt` reaches the parts of the Optimus terminal underneath. It tracks Optimus 2.0: part names and attributes follow the installed `@openng/optimus-ui` minor and are outside the stable API of `wj-terminal`. Changes to them ship only in the release that takes a new Optimus minor, and are not breaking. `wj-terminal` sets the input’s name, description and `autofocus`, removes the response’s `aria-live`, and stamps `data-wj-*` hooks that the harness reads; your `pt` keeps every other attribute.',
  parts: [
    { part: 'host', description: 'The Optimus `p-terminal` element.' },
    { part: 'root', description: 'The same element, for a second set of attributes.' },
    { part: 'welcomeMessage', description: 'The welcome message above the commands.' },
    { part: 'commandList', description: 'The list of entered commands.' },
    { part: 'command', description: 'One entered command with its response.' },
    { part: 'promptLabel', description: 'The prompt text, before a command and before the input.' },
    { part: 'commandValue', description: 'The text of one entered command.' },
    { part: 'commandResponse', description: 'The response to one command.' },
    { part: 'prompt', description: 'The row with the prompt and the input.' },
    { part: 'promptValue', description: 'The command input.' },
  ],
  mapping: [
    {
      optimus: 'TerminalService (app-provided)',
      weeljack: 'WjTerminalService (root-provided)',
      status: 'renamed',
      note: 'The app provides nothing: inject `WjTerminalService` anywhere.',
    },
    {
      optimus: 'TerminalService.commandHandler (subscribe)',
      weeljack: 'commandEntered (output)',
      status: 'renamed',
      note: 'Emits the entered text. The name avoids the DOM `command` event.',
    },
    {
      optimus: 'TerminalService.sendResponse(response)',
      weeljack: 'WjTerminalService.respond(response)',
      status: 'renamed',
      note: 'Replaces the latest command’s response, as Optimus does. An empty string is ignored. Dropped, with `WJ0180`, when no command is waiting.',
    },
    dropped(
      'TerminalService.sendCommand, responseHandler',
      'Plumbing: Optimus’s terminal sends the command itself, and no RxJS type crosses the API.',
    ),
    {
      optimus: 'welcomeMessage',
      weeljack: 'welcomeMessage',
      status: 'kept',
      note: 'Rendered as text.',
    },
    {
      optimus: 'prompt',
      weeljack: 'prompt',
      status: 'kept',
      note: 'Rendered as text before each command and the input.',
    },
    dropped('response (input)', 'One route for answers: the service.'),
    {
      optimus: 'None',
      weeljack: 'ariaLabel, ariaLabelledBy, ariaDescribedBy',
      status: 'added',
      note: 'Set on the command input.',
    },
    {
      optimus: 'pt',
      weeljack: 'pt',
      status: 'kept',
      note: 'Typed `WjTerminalPt`. Tracks Optimus.',
    },
    dropped(
      'styleClass, dt, unstyled, ptOptions, TerminalModule',
      'Never exposed on any wrapper (ADR 0002).',
    ),
  ],
};
