import type { CanMatchFn, ResolveFn, Routes } from '@angular/router';
import { COMPONENT_DOCS } from '../generated/component-docs';

const SITE = 'WeeljackNg';

/** `components/<entry>` matches only for an entry that has a page; any other URL is not-found. */
const hasComponentPage: CanMatchFn = (_route, segments) => {
  const entry = segments[1]?.path;
  return entry !== undefined && COMPONENT_DOCS.has(entry);
};

const componentTitle: ResolveFn<string> = (route) =>
  `${COMPONENT_DOCS.get(route.paramMap.get('entry') ?? '')?.title ?? 'Component'} · ${SITE}`;

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
    loadComponent: () => import('./pages/component/component-page').then((m) => m.ComponentPage),
  },
  {
    path: '**',
    title: `No page here · ${SITE}`,
    loadComponent: () => import('./pages/not-found/not-found').then((m) => m.NotFoundPage),
  },
];
