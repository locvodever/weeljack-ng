import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import changelogJson from '../../../generated/changelog.json';

/** One piece of a changelog line, as `scripts/extract-changelog.mjs` writes it. */
export interface ChangelogToken {
  /** `text`, `code`, `strong`, `link` (http(s) only) or `component` (a shipped `wj-<entry>`). */
  type: string;
  text: string;
  /** Set on a `link`. */
  href: string | null;
  /** Set on a `component`: the slug of its page. */
  entry: string | null;
}

export interface ChangelogSection {
  /** Verbatim from the file ("Features", "Bug Fixes", "⚠ BREAKING CHANGES"). */
  title: string;
  items: ChangelogToken[][];
}

export interface ChangelogRelease {
  version: string;
  date: string | null;
  url: string | null;
  sections: ChangelogSection[];
  /** Lines the parser did not recognise, shown as plain paragraphs. */
  notes: string[];
}

const RELEASES: readonly ChangelogRelease[] = changelogJson.releases;

/** `/changelog` (FR-23): every release, newest first, rendered from tokens, never from HTML. */
@Component({
  selector: 'docs-changelog-page',
  imports: [RouterLink],
  templateUrl: './changelog.html',
  styleUrl: './changelog.css',
})
export class ChangelogPage {
  /** Links are written relative to the root route, so the base href decides where they point. */
  protected readonly root = inject(Router).routerState.root;

  protected readonly releases = RELEASES.map((release) => ({
    ...release,
    id: `release-${release.version}`,
  }));
}
