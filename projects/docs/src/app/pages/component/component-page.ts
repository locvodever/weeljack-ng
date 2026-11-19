import { Component, computed, inject, input } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import exampleSources from '../../../generated/examples.json';
import type { ApiClass, ApiMember } from '../../api/api-types';
import { CATALOG } from '../../catalog/catalog';
import { CodeBlock } from '../../code-block/code-block';
import { ExampleFrame } from '../../example-frame/example-frame';
import { DocsText } from '../../text/text';
import type { ComponentPageData } from './component-doc';

const SOURCES: ReadonlyMap<string, string> = new Map(Object.entries(exampleSources));

interface MemberSection {
  title: string;
  rows: ApiMember[];
}

interface ClassApi {
  api: ApiClass;
  sections: MemberSection[];
}

/** The shipped entries by wave group, for the sidebar. A group with nothing shipped is left out. */
const SIDEBAR = CATALOG.groups
  .map((group) => ({
    id: group.id,
    label: group.label,
    rows: group.rows.filter((row) => row.status === 'shipped'),
  }))
  .filter((group) => group.rows.length > 0);

const isSlot = (item: ApiClass): boolean =>
  item.kind === 'directive' && item.selector.startsWith('ng-template[');

/**
 * `/components/<entry>` in the fixed order of 07 Q3: content from `COMPONENT_DOCS` + generated
 * API, both resolved by the route (`page`) so neither sits in the initial bundle.
 */
@Component({
  selector: 'docs-component-page',
  imports: [RouterLink, CodeBlock, DocsText, ExampleFrame],
  templateUrl: './component-page.html',
  styleUrl: './component-page.css',
})
export class ComponentPage {
  /** Sidebar links are written relative to the root route, so the base href decides where they point. */
  protected readonly root = inject(Router).routerState.root;

  protected readonly sidebar = SIDEBAR;

  /** The `:entry` route parameter. */
  readonly entry = input.required<string>();

  /** The route's resolved content and API for `entry`. */
  readonly page = input.required<ComponentPageData>();

  protected readonly doc = computed(() => this.page().doc);

  protected readonly api = computed(() => this.page().api);

  protected readonly importLine = computed(() => {
    const api = this.api();
    // An entry with no component (the dynamic dialog) imports its services.
    const names = (api.classes.length > 0 ? api.classes : api.services).map((item) => item.name);
    return `import { ${names.join(', ')} } from '${api.importPath}';`;
  });

  protected readonly examples = computed(() =>
    this.doc().examples.map((example) => {
      const source = SOURCES.get(example.sourceKey);
      if (source === undefined) {
        throw new Error(`No extracted source for "${example.sourceKey}". Run npm run build:docs.`);
      }
      return { ...example, source };
    }),
  );

  /**
   * Components and wrapper directives (`input[wjInputText]`): each gets Inputs, Outputs and
   * Two-way models tables. A slot directive is told apart by its `ng-template[...]` selector.
   */
  protected readonly components = computed<ClassApi[]>(() =>
    this.api()
      .classes.filter((item) => !isSlot(item))
      .map((api) => ({
        api,
        sections: [
          { title: 'Inputs', rows: api.inputs },
          { title: 'Outputs', rows: api.outputs },
          { title: 'Two-way models', rows: api.models },
        ],
      })),
  );

  /** Content slots are the typed `wj<Component><Slot>` directives an entry exports (02 Q6). */
  protected readonly slots = computed(() => this.api().classes.filter(isSlot));

  /** The mapping sentence's selectors: the page's own, and Optimus's (`optimusSelector`). */
  protected readonly selectors = computed(() => ({
    // An entry with no component (the dynamic dialog) names its first service instead.
    weeljack:
      this.components()[0]?.api.selector ?? this.api().services[0]?.name ?? `wj-${this.entry()}`,
    optimus: this.doc().optimusSelector ?? `p-${this.entry()}`,
  }));
}
