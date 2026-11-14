import { RenderMode, type ServerRoute } from '@angular/ssr';
import { COMPONENT_DOCS } from './pages/component/component-docs';
import apiIndex from '../generated/api/index.json';

/**
 * Every route prerenders (FR-23); none uses `RenderMode.Client`. Component pages are listed from
 * the generated API index, so a shipped entry always gets a page. An index entry with no page
 * content fails the build instead of prerendering an empty page.
 */
export const serverRoutes: ServerRoute[] = [
  {
    path: 'components/:entry',
    renderMode: RenderMode.Prerender,
    getPrerenderParams: () => {
      const missing = apiIndex.entries.filter((entry) => !COMPONENT_DOCS.has(entry));
      if (missing.length > 0) {
        return Promise.reject(
          new Error(`No docs page content for: ${missing.join(', ')}. Add it to COMPONENT_DOCS.`),
        );
      }
      return Promise.resolve(apiIndex.entries.map((entry) => ({ entry })));
    },
  },
  { path: '**', renderMode: RenderMode.Prerender },
];
