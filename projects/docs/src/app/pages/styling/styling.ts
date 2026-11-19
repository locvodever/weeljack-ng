import { DOCUMENT } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import exampleSources from '../../../generated/examples.json';
import { CodeBlock } from '../../code-block/code-block';
import { StylingHostClassAndPtExample } from '../../examples/styling/host-class-and-pt';

const SOURCES: ReadonlyMap<string, string> = new Map(Object.entries(exampleSources));

/** The extracted source of `examples/styling/<stem>.ts`. */
function example(stem: string): string {
  const source = SOURCES.get(`styling/${stem}`);
  if (source === undefined) {
    throw new Error(`No extracted source for "styling/${stem}". Run npm run build:docs.`);
  }
  return source;
}

const HOST_CSS = `/* Unlayered, so it wins over every rule in @layer wj, with no ::ng-deep. */
.save-button {
  margin-inline-start: 16px;
}`;

const HOST_HTML = '<wj-button class="save-button" style="margin-block: 8px" label="Save" />';

/** `/guides/styling` (FR-15): host attributes, variables, the `pt` escape hatch, what is absent. */
@Component({
  selector: 'docs-styling-page',
  imports: [RouterLink, CodeBlock, StylingHostClassAndPtExample],
  templateUrl: './styling.html',
  styleUrl: './styling.css',
})
export class StylingPage {
  private readonly document = inject(DOCUMENT);

  /** Links are written relative to the root route, so the base href decides where they point. */
  protected readonly root = inject(Router).routerState.root;

  /** The in-page list, in the order of the sections below. */
  protected readonly sections = [
    { id: 'host-class-and-style', title: 'Host class and style' },
    { id: 'css-variables', title: 'CSS variables' },
    { id: 'the-pt-escape-hatch', title: 'The pt escape hatch' },
    { id: 'what-does-not-exist', title: 'What does not exist' },
    { id: 'example', title: 'Example' },
    { id: 'per-component', title: 'Per component' },
  ] as const;

  protected readonly hostCss = HOST_CSS;
  protected readonly hostHtml = HOST_HTML;
  protected readonly exampleSource = example('host-class-and-pt');

  /**
   * A bare `#id` would resolve against `<base href>`, and a same-document jump reaches the router
   * as a popstate that moves focus to the `h1`. So each link keeps a real relative `href` (it works
   * without script) and, on click, focuses the heading itself.
   */
  protected jump(event: Event, id: string): void {
    event.preventDefault();
    this.document.getElementById(id)?.focus();
  }
}
