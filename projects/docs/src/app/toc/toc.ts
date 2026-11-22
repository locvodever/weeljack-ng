import { DOCUMENT, Location } from '@angular/common';
import { Component, DestroyRef, Injector, afterNextRender, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';

interface TocEntry {
  readonly id: string;
  readonly text: string;
  readonly level: 2 | 3;
}

/** Headings inside a live example belong to the example, not to the page. */
const LIVE_EXAMPLE = '.docs-live, docs-example-frame';

/** A heading is "current" once its top edge has passed this share of the viewport height. */
const CURRENT_LINE = 0.3;

/**
 * The "On this page" list: the `h2`/`h3` of the page in `main`, read in the browser after render
 * (the server renders nothing, and so does the first client render). It is mounted from a
 * `@defer` block in the shell, so it stays out of the initial bundle.
 */
@Component({
  selector: 'docs-toc',
  templateUrl: './toc.html',
  styleUrl: './toc.css',
})
export class DocsToc {
  private readonly document = inject(DOCUMENT);
  private readonly injector = inject(Injector);
  private readonly location = inject(Location);
  private readonly router = inject(Router);

  protected readonly entries = signal<readonly TocEntry[]>([]);
  protected readonly active = signal<string | null>(null);
  /** The page's external URL without a fragment: the part every link shares. */
  private readonly pageUrl = signal('');

  private headings: readonly HTMLElement[] = [];
  private intersection: IntersectionObserver | null = null;
  private mutation: MutationObserver | null = null;
  private frame = 0;
  private updateFrame = 0;
  private stopScrolling: (() => void) | null = null;

  constructor() {
    afterNextRender(() => {
      this.scan();
      // The observers only see a heading cross the line while it is on screen: an instant jump
      // (Home, End, a reload that restores the scroll) crosses none, so scrolling also recomputes.
      const view = this.document.defaultView;
      const onScroll = (): void => {
        this.scheduleUpdate();
      };
      view?.addEventListener('scroll', onScroll, { passive: true });
      this.stopScrolling = () => {
        view?.removeEventListener('scroll', onScroll);
      };
    });
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => {
        afterNextRender(
          () => {
            this.scan();
          },
          { injector: this.injector },
        );
      });
    inject(DestroyRef).onDestroy(() => {
      this.disconnect();
      this.stopScrolling?.();
      this.document.defaultView?.cancelAnimationFrame(this.frame);
      this.document.defaultView?.cancelAnimationFrame(this.updateFrame);
    });
  }

  protected hrefFor(id: string): string {
    return `${this.pageUrl()}#${id}`;
  }

  /**
   * Jumps in place. Not a router navigation: that would fire the shell's focus-to-`h1` step. The
   * address bar's fragment is replaced by hand, and keeps the router's history state.
   */
  protected jump(event: Event, id: string): void {
    event.preventDefault();
    const heading = this.document.getElementById(id);
    if (heading === null) {
      return;
    }
    heading.scrollIntoView({ block: 'start' });
    if (!heading.hasAttribute('tabindex')) {
      heading.setAttribute('tabindex', '-1');
    }
    heading.focus({ preventScroll: true });
    const history = this.document.defaultView?.history;
    history?.replaceState(history.state, '', this.hrefFor(id));
    this.active.set(id);
  }

  /** Reads `main`'s headings, then (re)creates the two observers. Browser only. */
  private scan(): void {
    this.disconnect();
    const view = this.document.defaultView;
    const main = this.document.querySelector('main');
    if (view === null || main === null) {
      return;
    }
    this.pageUrl.set(this.location.prepareExternalUrl(this.router.url.split('#')[0] ?? ''));

    const headings = Array.from(main.querySelectorAll<HTMLElement>('h2, h3')).filter(
      (heading) => heading.closest(LIVE_EXAMPLE) === null && heading.textContent !== '',
    );
    const entries: TocEntry[] = headings.map((heading) => {
      if (heading.id === '') {
        heading.id = this.freeId(heading.textContent);
      }
      return {
        id: heading.id,
        text: heading.textContent.trim(),
        level: heading.tagName === 'H3' ? 3 : 2,
      };
    });
    this.headings = headings;
    if (!sameEntries(this.entries(), entries)) {
      this.entries.set(entries);
    }

    // A rescan's own writes are attributes (`id`, `tabindex`), which this observer ignores.
    this.mutation = new MutationObserver(() => {
      this.scheduleScan();
    });
    this.mutation.observe(main, { childList: true, subtree: true });

    // The band is the top 30% of the viewport: a heading crossing its bottom edge is the change.
    this.intersection = new IntersectionObserver(
      () => {
        this.updateActive();
      },
      { rootMargin: `0px 0px -${String((1 - CURRENT_LINE) * 100)}% 0px` },
    );
    for (const heading of headings) {
      this.intersection.observe(heading);
    }
    this.updateActive();
  }

  /** At most one rescan per animation frame, however many mutations arrive. */
  private scheduleScan(): void {
    const view = this.document.defaultView;
    if (this.frame !== 0 || view === null) {
      return;
    }
    this.frame = view.requestAnimationFrame(() => {
      this.frame = 0;
      this.scan();
    });
  }

  private scheduleUpdate(): void {
    const view = this.document.defaultView;
    if (this.updateFrame !== 0 || view === null) {
      return;
    }
    this.updateFrame = view.requestAnimationFrame(() => {
      this.updateFrame = 0;
      this.updateActive();
    });
  }

  /** The last heading whose top is at or above the line, else the first. */
  private updateActive(): void {
    const line = (this.document.defaultView?.innerHeight ?? 0) * CURRENT_LINE;
    let current = this.headings[0]?.id ?? null;
    for (const heading of this.headings) {
      if (heading.getBoundingClientRect().top > line) {
        break;
      }
      current = heading.id;
    }
    this.active.set(current);
  }

  private disconnect(): void {
    this.intersection?.disconnect();
    this.mutation?.disconnect();
    this.intersection = null;
    this.mutation = null;
  }

  /** A slug of the text, de-duplicated with `-2`, `-3`, … against every id on the page. */
  private freeId(text: string): string {
    const slug =
      text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') || 'section';
    let id = slug;
    for (let n = 2; this.document.getElementById(id) !== null; n += 1) {
      id = `${slug}-${String(n)}`;
    }
    return id;
  }
}

function sameEntries(a: readonly TocEntry[], b: readonly TocEntry[]): boolean {
  return (
    a.length === b.length &&
    a.every((entry, i) => {
      const other = b[i];
      return other?.id === entry.id && other.text === entry.text && other.level === entry.level;
    })
  );
}
