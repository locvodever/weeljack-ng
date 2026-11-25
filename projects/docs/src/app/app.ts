import { DOCUMENT, Location } from '@angular/common';
import {
  Component,
  ComponentRef,
  DestroyRef,
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
import { DocsLogo } from './logo/logo';
import { NavigationFailure } from './navigation-failure/navigation-failure';
import type { DocsNavDrawer } from './nav-drawer/nav-drawer';
import { DocsShellData } from './sidebar/nav-data';
import { DocsSidebar } from './sidebar/sidebar';
import { DocsNavState } from './sidebar/nav-state';
import type { DocsThemePopover } from './theme-panel/theme-popover';
import { THEME_STORAGE_KEY } from './theme-panel/theme-storage-key';

/** Class on `<html>` that `provideWeeljack({ darkMode: 'class' })` reads as "dark". */
const DARK_CLASS = 'wj-dark';

/** From this width the sidebar is a column of the page; below it, a drawer opened from "Menu". */
const WIDE = '(min-width: 960px)';

@Component({
  imports: [DocsLogo, DocsSidebar, RouterLink, RouterOutlet],
  selector: 'docs-root',
  templateUrl: './app.html',
  styleUrls: ['./app.css', './app-bar.css'],
})
export class App {
  private readonly document = inject(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);
  private readonly injector = inject(Injector);
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly failure = inject(NavigationFailure);
  private readonly navState = inject(DocsNavState);
  private readonly tocHost = viewChild.required('toc', { read: ViewContainerRef });
  private readonly drawerHost = viewChild.required('drawer', { read: ViewContainerRef });
  private readonly themeHost = viewChild.required('themePopover', { read: ViewContainerRef });
  private readonly reloadButton = viewChild<ElementRef<HTMLButtonElement>>('reload');

  protected readonly version = inject(DocsShellData).version;
  protected readonly failed = this.failure.url;
  protected readonly dark = signal(this.document.documentElement.classList.contains(DARK_CLASS));
  protected readonly menuOpen = signal(false);
  protected readonly themeOpen = signal(false);

  /** The drawer's chunk, requested at most once. */
  private drawerChunk: Promise<typeof import('./nav-drawer/nav-drawer')> | null = null;
  private drawer: ComponentRef<DocsNavDrawer> | null = null;
  /** The theme popover, created on the first Theme click. */
  private themePopover: Promise<DocsThemePopover> | null = null;
  /** True from the moment the drawer opens until it has closed (its leave motion included). */
  private drawerBusy = false;
  /** A navigation ended while the drawer was open or closing: the `h1` takes focus once it is gone. */
  private focusHeadingAfterClose = false;

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
        if (this.drawerBusy) {
          // `wj-drawer` returns focus to Menu after its leave motion: focusing the `h1` now would
          // lose to it, so it waits for `closed`.
          this.focusHeadingAfterClose = true;
        } else {
          this.focusHeading();
        }
      });

    // The "On this page" list is browser-only and lazy: a `@defer` block would add its runtime
    // (about 3.5 kB) to the initial bundle, a dynamic import adds none. Its column is reserved by
    // the grid, so nothing shifts when it mounts.
    afterNextRender(() => {
      void import('./toc/toc').then(({ DocsToc }) => {
        this.tocHost().createComponent(DocsToc);
      });
    });

    // A remembered palette applies after load. With none stored, the theme chunk never loads.
    afterNextRender(() => {
      try {
        if (this.document.defaultView?.localStorage.getItem(THEME_STORAGE_KEY) === null) {
          return;
        }
      } catch {
        return;
      }
      void import('./theme-panel/theme-choice').then(({ DocsThemeChoice }) => {
        this.injector.get(DocsThemeChoice).restore();
      });
    });

    // Narrow screens only: request the drawer's chunk ahead of the first Menu click, and close an
    // open drawer when the viewport grows to the sidebar's width.
    afterNextRender(() => {
      const wide = this.document.defaultView?.matchMedia(WIDE);
      if (wide === undefined) {
        return;
      }
      if (!wide.matches) {
        void this.loadDrawerChunk();
      }
      const onChange = (event: MediaQueryListEvent): void => {
        if (event.matches) {
          this.setMenu(false);
        }
      };
      wide.addEventListener('change', onChange);
      this.destroyRef.onDestroy(() => {
        wide.removeEventListener('change', onChange);
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

  /** Opens the drawer, loading it first when this is the first time. */
  protected openMenu(): void {
    void this.mountDrawer().then(() => {
      this.drawerBusy = true;
      this.setMenu(true);
    });
  }

  private setMenu(open: boolean): void {
    this.menuOpen.set(open);
    // Not `setInput`: it skips a value equal to the last one it set, so a drawer the user closed
    // inside would never reopen.
    this.drawer?.instance.visible.set(open);
  }

  private drawerClosed(): void {
    this.drawerBusy = false;
    if (this.focusHeadingAfterClose) {
      this.focusHeadingAfterClose = false;
      this.focusHeading();
    }
  }

  private loadDrawerChunk(): Promise<typeof import('./nav-drawer/nav-drawer')> {
    this.drawerChunk ??= import('./nav-drawer/nav-drawer');
    return this.drawerChunk;
  }

  private async mountDrawer(): Promise<void> {
    const { DocsNavDrawer } = await this.loadDrawerChunk();
    if (this.drawer !== null) {
      return;
    }
    const drawer = this.drawerHost().createComponent(DocsNavDrawer);
    drawer.instance.visible.subscribe((visible) => {
      this.menuOpen.set(visible);
    });
    drawer.instance.closed.subscribe(() => {
      this.drawerClosed();
    });
    this.drawer = drawer;
  }

  private focusHeading(): void {
    afterNextRender(
      () => {
        this.document.querySelector<HTMLElement>('main h1')?.focus();
      },
      { injector: this.injector },
    );
  }

  /** Opens the theme popover beside `button`, or closes it; the first click loads its chunk. */
  protected toggleTheme(event: Event, button: HTMLElement): void {
    this.themePopover ??= import('./theme-panel/theme-popover').then(({ DocsThemePopover }) => {
      const { instance } = this.themeHost().createComponent(DocsThemePopover);
      instance.opened.subscribe(() => {
        this.themeOpen.set(true);
      });
      instance.closed.subscribe(() => {
        this.themeOpen.set(false);
      });
      return instance;
    });
    // `event.currentTarget` is gone after the await, so the target is passed explicitly.
    void this.themePopover.then((popover) => {
      popover.toggle(event, button);
    });
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
