import type { CanMatchFn, ResolveFn, Routes } from '@angular/router';
import { API_DOCUMENTS } from '../generated/api-documents';
import { COMPONENT_DOCS } from '../generated/component-docs';
import type { ComponentPageData } from './pages/component/component-doc';

const SITE = 'WeeljackNg';

/** `components/<entry>` matches only for an entry that has a page; any other URL is not-found. */
const hasComponentPage: CanMatchFn = (_route, segments) => {
  const entry = segments[1]?.path;
  return entry !== undefined && COMPONENT_DOCS.has(entry);
};

/** Runs the entry's loader from a generated registry, or fails with what to do. */
function load<T>(
  registry: ReadonlyMap<string, () => Promise<T>>,
  entry: string,
  fix: string,
): Promise<T> {
  const loader = registry.get(entry);
  if (loader === undefined) {
    return Promise.reject(new Error(`Nothing to load for "${entry}". ${fix}`));
  }
  return loader();
}

/** The page's content and generated API, each from its own lazy chunk. */
const componentPage: ResolveFn<ComponentPageData> = async (route) => {
  const entry = route.paramMap.get('entry') ?? '';
  const [doc, api] = await Promise.all([
    load(COMPONENT_DOCS, entry, 'Add pages/component/docs/<entry>.ts exporting DOC.'),
    load(API_DOCUMENTS, entry, 'Run npm run build:docs.'),
  ]);
  return { doc, api };
};

/** The title reads the same chunk the page resolver loads; the module loader dedupes the fetch. */
const componentTitle: ResolveFn<string> = async (route) => {
  const doc = await COMPONENT_DOCS.get(route.paramMap.get('entry') ?? '')?.();
  return `${doc?.title ?? 'Component'} · ${SITE}`;
};

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    title: SITE,
    loadComponent: () => import('./pages/home/home').then((m) => m.HomePage),
  },
  {
    path: 'components/:entry',
    canMatch: [hasComponentPage],
    title: componentTitle,
    resolve: { page: componentPage },
    loadComponent: () => import('./pages/component/component-page').then((m) => m.ComponentPage),
  },
  {
    path: 'guides/theming',
    title: `Theming · ${SITE}`,
    loadComponent: () => import('./pages/theming/theming').then((m) => m.ThemingPage),
  },
  {
    path: '**',
    title: `No page here · ${SITE}`,
    loadComponent: () => import('./pages/not-found/not-found').then((m) => m.NotFoundPage),
  },
];
