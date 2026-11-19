import { DOCUMENT } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import exampleSources from '../../../generated/examples.json';
import site from '../../../generated/site.json';
import { CodeBlock } from '../../code-block/code-block';
import { CompatibilityTable } from '../../compatibility-table/compatibility-table';
import { GettingStartedFirstComponentExample } from '../../examples/getting-started/first-component';

const SOURCES: ReadonlyMap<string, string> = new Map(Object.entries(exampleSources));

/** The extracted source of `examples/getting-started/<stem>.ts`. */
function example(stem: string): string {
  const source = SOURCES.get(`getting-started/${stem}`);
  if (source === undefined) {
    throw new Error(`No extracted source for "getting-started/${stem}". Run npm run build:docs.`);
  }
  return source;
}

const INSTALL = 'npm install weeljack-ng';

/** 09 Q7's pasteable rule. It is a string, so the docs app's own `@openng/*` ban never sees it. */
const LINT_CONFIG = `// eslint.config.js
export default [
  // ...your other config objects
  {
    files: ['**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@openng', '@openng/**'],
              message: "Import from 'weeljack-ng' instead: @openng/* is its internal dependency.",
            },
          ],
        },
      ],
    },
  },
];`;

/** The docs' address (20 owed); the README guard in `extract-catalog.mjs` keeps README on it too. */
const PAGES_URL = 'https://locvodever.github.io/weeljack-ng/';

/** `/getting-started` (FR-14): install, provide, a first component, a language, lint, compatibility. */
@Component({
  selector: 'docs-getting-started-page',
  imports: [RouterLink, CodeBlock, CompatibilityTable, GettingStartedFirstComponentExample],
  templateUrl: './getting-started.html',
  styleUrl: './getting-started.css',
})
export class GettingStartedPage {
  private readonly document = inject(DOCUMENT);

  /** Links are written relative to the root route, so the base href decides where they point. */
  protected readonly root = inject(Router).routerState.root;

  /** The in-page list, in the order of the sections below. */
  protected readonly sections = [
    { id: 'install', title: 'Install' },
    { id: 'provide', title: 'Provide' },
    { id: 'a-first-component', title: 'A first component' },
    { id: 'another-language', title: 'Another language' },
    { id: 'keep-optimus-out-of-your-imports', title: 'Keep Optimus out of your imports' },
    { id: 'compatibility', title: 'Compatibility' },
    { id: 'next-steps', title: 'Next steps' },
  ] as const;

  protected readonly install = INSTALL;
  protected readonly lintConfig = LINT_CONFIG;
  protected readonly pagesUrl = PAGES_URL;
  protected readonly peers = Object.entries(site.peers);

  protected readonly examples = {
    provide: example('provide'),
    firstComponent: example('first-component'),
    anotherLanguage: example('another-language'),
  } as const;

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
