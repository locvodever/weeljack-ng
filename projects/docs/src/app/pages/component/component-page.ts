import { NgComponentOutlet } from '@angular/common';
import { Component, computed, input } from '@angular/core';
import { COMPONENT_DOCS } from '../../../generated/component-docs';
import exampleSources from '../../../generated/examples.json';
import { API_DOCUMENTS } from '../../../generated/api-documents';
import type { ApiClass, ApiMember } from '../../api/api-types';
import { CodeBlock } from '../../code-block/code-block';
import { DocsText } from '../../text/text';

const SOURCES: ReadonlyMap<string, string> = new Map(Object.entries(exampleSources));

interface MemberSection {
  title: string;
  rows: ApiMember[];
}

interface ClassApi {
  api: ApiClass;
  sections: MemberSection[];
}

/** `/components/<entry>` in the fixed order of 07 Q3: content from `COMPONENT_DOCS` + generated API. */
@Component({
  selector: 'docs-component-page',
  imports: [NgComponentOutlet, CodeBlock, DocsText],
  templateUrl: './component-page.html',
  styleUrl: './component-page.css',
})
export class ComponentPage {
  /** The `:entry` route parameter. */
  readonly entry = input.required<string>();

  protected readonly doc = computed(() => {
    const doc = COMPONENT_DOCS.get(this.entry());
    if (doc === undefined) {
      throw new Error(`No docs page content for "${this.entry()}".`);
    }
    return doc;
  });

  protected readonly api = computed(() => {
    const api = API_DOCUMENTS.get(this.entry());
    if (api === undefined) {
      throw new Error(`No generated API for "${this.entry()}". Run npm run build:docs.`);
    }
    return api;
  });

  protected readonly importLine = computed(() => {
    const api = this.api();
    return `import { ${api.classes.map((item) => item.name).join(', ')} } from '${api.importPath}';`;
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

  protected readonly components = computed<ClassApi[]>(() =>
    this.api()
      .classes.filter((item) => item.kind === 'component')
      .map((api) => ({
        api,
        sections: [
          { title: 'Inputs', rows: api.inputs },
          { title: 'Outputs', rows: api.outputs },
          { title: 'Two-way models', rows: api.models },
        ],
      })),
  );

  /** Content slots are the typed `wj<Component><Slot>` directives an entry exports (02). */
  protected readonly slots = computed(() =>
    this.api().classes.filter((item) => item.kind === 'directive'),
  );
}
