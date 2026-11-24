import { DOCUMENT } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import site from '../../../generated/site.json';
import { CodeBlock } from '../../code-block/code-block';
import { CompatibilityTable } from '../../compatibility-table/compatibility-table';

/** 21 Q8's message shape; the section that shows it links the errors index. */
const MESSAGE_SHAPE =
  'WJ<NNNN>: <wj-selector>: <what is wrong>. <what to do>. Find more at <docs>/errors/WJ<NNNN>';

const SKIP_HYDRATION = '<wj-button ngSkipHydration label="Save" />';

/** `/platform-support` (FR-16, 21 Q1-Q8): what WeeljackNg claims to run on, and what it does not. */
@Component({
  selector: 'docs-platform-support-page',
  imports: [RouterLink, CodeBlock, CompatibilityTable],
  templateUrl: './platform-support.html',
  styleUrl: './platform-support.css',
})
export class PlatformSupportPage {
  private readonly document = inject(DOCUMENT);

  /** Links are written relative to the root route, so the base href decides where they point. */
  protected readonly root = inject(Router).routerState.root;

  /** The in-page list, in the order of the sections below. */
  protected readonly sections = [
    { id: 'angular-and-optimus', title: 'Angular and Optimus' },
    { id: 'change-detection', title: 'Change detection' },
    { id: 'server-rendering', title: 'Server rendering' },
    { id: 'browsers', title: 'Browsers' },
    { id: 'size', title: 'Size' },
    { id: 'errors-and-warnings', title: 'Errors and warnings' },
  ] as const;

  protected readonly angular = site.peers['@angular/core'];
  protected readonly messageShape = MESSAGE_SHAPE;
  protected readonly skipHydration = SKIP_HYDRATION;

  /**
   * A bare `#id` would resolve against `<base href>`, and a same-document jump reaches the router
   * as a popstate that moves focus to the `h1`. So each link keeps a real relative `href` (it works
   * without script) and, on click, focuses the heading itself.
   */
  protected jump(event: Event, id: string): void {
    event.preventDefault();
    this.document.getElementById(id)?.focus();
  }
}
