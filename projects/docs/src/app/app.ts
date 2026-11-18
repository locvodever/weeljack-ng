import { DOCUMENT } from '@angular/common';
import { Component, Injector, afterNextRender, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter, skip } from 'rxjs';
import apiIndex from '../generated/api/index.json';

/** Class on `<html>` that `provideWeeljack({ darkMode: 'class' })` reads as "dark". */
const DARK_CLASS = 'wj-dark';

@Component({
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  selector: 'docs-root',
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  private readonly document = inject(DOCUMENT);
  private readonly injector = inject(Injector);
  private readonly router = inject(Router);

  protected readonly version = apiIndex.version;
  protected readonly dark = signal(this.document.documentElement.classList.contains(DARK_CLASS));

  constructor() {
    // After a navigation, focus lands on the new page's `h1`, so a keyboard user does not restart
    // at the header. The first navigation is the page load and keeps the browser's own focus.
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        skip(1),
        takeUntilDestroyed(),
      )
      .subscribe(() => {
        afterNextRender(
          () => {
            this.document.querySelector<HTMLElement>('main h1')?.focus();
          },
          { injector: this.injector },
        );
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
