import { DOCUMENT } from '@angular/common';
import { Component, inject } from '@angular/core';
import { WjButton } from 'weeljack-ng/button';
import exampleSources from '../../../generated/examples.json';
import theme from '../../../generated/theme.json';
import { CodeBlock } from '../../code-block/code-block';

const SOURCES: ReadonlyMap<string, string> = new Map(Object.entries(exampleSources));

/** The extracted source of `examples/theming/<stem>.ts`. */
function example(stem: string): string {
  const source = SOURCES.get(`theming/${stem}`);
  if (source === undefined) {
    throw new Error(`No extracted source for "theming/${stem}". Run npm run build:docs.`);
  }
  return source;
}

const OVERRIDE_CSS = `:root {
  --wj-primary-color: #0f766e;
}

.wj-dark {
  --wj-primary-color: #5eead4;
}

/* With darkMode: 'system', the dark values go inside the media query instead. */
@media (prefers-color-scheme: dark) {
  :root {
    --wj-primary-color: #5eead4;
  }
}`;

const LAYER_ORDER_CSS = '@layer base, wj, utilities;';

/** `/guides/theming` (FR-19 ... FR-22): content in the PRD's order, tables from `npm run generate`. */
@Component({
  selector: 'docs-theming-page',
  imports: [CodeBlock, WjButton],
  templateUrl: './theming.html',
  styleUrl: './theming.css',
})
export class ThemingPage {
  private readonly document = inject(DOCUMENT);

  /** The in-page list, in the order of the sections below. */
  protected readonly sections = [
    { id: 'options', title: 'Options' },
    { id: 'default-look', title: 'The default look' },
    { id: 'contrast', title: 'Contrast' },
    { id: 'css-variables', title: 'CSS variables' },
    { id: 'layers', title: 'Layers' },
    { id: 'language', title: 'Language' },
  ] as const;

  protected readonly contrast = [
    { key: 'light', title: 'Light scheme', rows: theme.contrast.light },
    { key: 'dark', title: 'Dark scheme', rows: theme.contrast.dark },
  ] as const;
  protected readonly primitive = theme.primitive;
  protected readonly semantic = theme.semantic;

  protected readonly examples = {
    primaryHex: example('primary-hex'),
    primaryScale: example('primary-scale'),
    surface: example('surface'),
    darkModeSystem: example('dark-mode-system'),
    darkModeClass: example('dark-mode-class'),
    translationVi: example('translation-vi'),
    translationPartial: example('translation-partial'),
    translationMerge: example('translation-merge'),
  } as const;
  protected readonly overrideCss = OVERRIDE_CSS;
  protected readonly layerOrderCss = LAYER_ORDER_CSS;

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
