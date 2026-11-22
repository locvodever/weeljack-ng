import { DOCUMENT, Location } from '@angular/common';
import {
  Component,
  ElementRef,
  Injector,
  ViewContainerRef,
  afterNextRender,
  afterRenderEffect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import apiIndex from '../generated/api/index.json';
import { NavigationFailure } from './navigation-failure/navigation-failure';
import { DocsSidebar } from './sidebar/sidebar';
import { DocsNavState } from './sidebar/nav-state';

/** Class on `<html>` that `provideWeeljack({ darkMode: 'class' })` reads as "dark". */
const DARK_CLASS = 'wj-dark';

@Component({
  imports: [DocsSidebar, RouterLink, RouterOutlet],
  selector: 'docs-root',
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  private readonly document = inject(DOCUMENT);
  private readonly injector = inject(Injector);
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly failure = inject(NavigationFailure);
  private readonly navState = inject(DocsNavState);
  private readonly tocHost = viewChild.required('toc', { read: ViewContainerRef });
  private readonly reloadButton = viewChild<ElementRef<HTMLButtonElement>>('reload');

  protected readonly version = apiIndex.version;
  protected readonly failed = this.failure.url;
  protected readonly dark = signal(this.document.documentElement.classList.contains(DARK_CLASS));

  constructor() {
    // Every navigation, the first included (the server too), opens the sidebar groups holding the
    // page. After a navigation, focus lands on the new page's `h1`, so a keyboard user does not
    // restart at the header. The first navigation is the page load and keeps the browser's own focus.
    let pageLoad = true;
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe((event) => {
        this.navState.reveal(event.urlAfterRedirects);
        if (pageLoad) {
          pageLoad = false;
          return;
        }
        this.failure.url.set(null);
        afterNextRender(
          () => {
            this.document.querySelector<HTMLElement>('main h1')?.focus();
          },
          { injector: this.injector },
        );
      });

    // The "On this page" list is browser-only and lazy: a `@defer` block would add its runtime
    // (about 3.5 kB) to the initial bundle, a dynamic import adds none. Its column is reserved by
    // the grid, so nothing shifts when it mounts.
    afterNextRender(() => {
      void import('./toc/toc').then(({ DocsToc }) => {
        this.tocHost().createComponent(DocsToc);
      });
    });

    // A failed navigation leaves the address bar on the old page, so focus goes to the one
    // control that can fix it: it is scrolled into view even from a link low on a long page.
    afterRenderEffect(() => {
      this.reloadButton()?.nativeElement.focus();
    });
  }

  /**
   * Loads the page that failed, not the one on screen: a failed navigation never changes the
   * address bar, so `location.reload()` would only refetch the old page. The router's URL is
   * resolved against the base href (`prepareExternalUrl`) and loaded in full.
   */
  protected loadFailedPage(): void {
    const url = this.failure.url();
    if (url !== null) {
      this.document.defaultView?.location.assign(this.location.prepareExternalUrl(url));
    }
  }

  protected toggleDark(): void {
    const dark = !this.dark();
    this.document.documentElement.classList.toggle(DARK_CLASS, dark);
    this.dark.set(dark);
  }

  /**
   * `href="#main"` would resolve against `<base href="/weeljack-ng/">` and leave the page, so the
   * skip link moves focus itself.
   */
  protected skipToMain(event: Event): void {
    event.preventDefault();
    this.document.getElementById('main')?.focus();
  }
}
