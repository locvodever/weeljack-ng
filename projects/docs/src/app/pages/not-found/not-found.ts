import { Component, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { notWrappedFor, plannedFor } from '../../catalog/catalog';
import { DocsText } from '../../text/text';

@Component({
  selector: 'docs-not-found-page',
  imports: [RouterLink, DocsText],
  templateUrl: './not-found.html',
  styleUrl: './not-found.css',
})
export class NotFoundPage {
  /** A not-found URL can be any depth, so links resolve against the root route, not this one. */
  protected readonly root = inject(Router).routerState.root;

  /** The unmatched URL's segments: the catch-all route holds every segment it swallowed. */
  private readonly segments = inject(ActivatedRoute).snapshot.url.map((segment) => segment.path);

  /** The `<slug>` of a `components/<slug>` URL, else `null` (FR-12). */
  protected readonly slug =
    this.segments.length === 2 && this.segments[0] === 'components'
      ? (this.segments[1] ?? null)
      : null;

  /** Set when the slug is a 03 target that is not shipped yet. */
  protected readonly planned = this.slug === null ? undefined : plannedFor(this.slug);

  /** Set when the slug is an Optimus entry WeeljackNg does not wrap. */
  protected readonly notWrapped = this.slug === null ? undefined : notWrappedFor(this.slug);
}
