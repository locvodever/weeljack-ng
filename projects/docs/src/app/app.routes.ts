import type { CanMatchFn, ResolveFn, Routes } from '@angular/router';
import type { ComponentPageData } from './pages/component/component-doc';

const SITE = 'WeeljackNg';

/** `components/<entry>` matches only for an entry that has a page; any other URL is not-found. */
const hasComponentPage: CanMatchFn = async (_route, segments) => {
  const entry = segments[1]?.path;
  if (entry === undefined) {
    return false;
  }
  const { COMPONENT_DOCS } = await import('../generated/component-docs');
  return COMPONENT_DOCS.has(entry);
};

/** `errors/<code>` matches only a code in the generated registry; any other URL is not-found. */
const hasErrorCode: CanMatchFn = async (_route, segments) => {
  const { default: registry } = await import('../generated/errors.json');
  return registry.codes.some((entry) => entry.code === segments[1]?.path);
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
  const [{ COMPONENT_DOCS }, { API_DOCUMENTS }] = await Promise.all([
    import('../generated/component-docs'),
    import('../generated/api-documents'),
  ]);
  const [doc, api] = await Promise.all([
    load(COMPONENT_DOCS, entry, 'Add pages/component/docs/<entry>.ts exporting DOC.'),
    load(API_DOCUMENTS, entry, 'Run npm run build:docs.'),
  ]);
  return { doc, api };
};

/** The title reads the same chunk the page resolver loads; the module loader dedupes the fetch. */
const componentTitle: ResolveFn<string> = async (route) => {
  const { COMPONENT_DOCS } = await import('../generated/component-docs');
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
    path: 'getting-started',
    title: `Get started · ${SITE}`,
    loadComponent: () =>
      import('./pages/getting-started/getting-started').then((m) => m.GettingStartedPage),
  },
  {
    path: 'components',
    pathMatch: 'full',
    title: `Components · ${SITE}`,
    loadComponent: () => import('./pages/components/components').then((m) => m.ComponentsPage),
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
    path: 'guides/styling',
    title: `Styling · ${SITE}`,
    loadComponent: () => import('./pages/styling/styling').then((m) => m.StylingPage),
  },
  {
    path: 'guides/from-optimus',
    title: `Coming from Optimus · ${SITE}`,
    loadComponent: () => import('./pages/from-optimus/from-optimus').then((m) => m.FromOptimusPage),
  },
  {
    path: 'platform-support',
    title: `Platform support · ${SITE}`,
    loadComponent: () =>
      import('./pages/platform-support/platform-support').then((m) => m.PlatformSupportPage),
  },
  {
    path: 'errors',
    pathMatch: 'full',
    title: `Errors and warnings · ${SITE}`,
    loadComponent: () => import('./pages/errors/errors').then((m) => m.ErrorsPage),
  },
  {
    path: 'errors/:code',
    canMatch: [hasErrorCode],
    title: (route) => `${route.paramMap.get('code') ?? 'Error'} · ${SITE}`,
    loadComponent: () => import('./pages/errors/error-code').then((m) => m.ErrorCodePage),
  },
  {
    path: 'changelog',
    title: `Changelog · ${SITE}`,
    loadComponent: () => import('./pages/changelog/changelog').then((m) => m.ChangelogPage),
  },
  {
    path: '**',
    title: `No page here · ${SITE}`,
    loadComponent: () => import('./pages/not-found/not-found').then((m) => m.NotFoundPage),
  },
];
