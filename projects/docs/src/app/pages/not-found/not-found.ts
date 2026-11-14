import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'docs-not-found-page',
  imports: [RouterLink],
  templateUrl: './not-found.html',
  styleUrl: './not-found.css',
})
export class NotFoundPage {
  /** A not-found URL can be any depth, so links resolve against the root route, not this one. */
  protected readonly root = inject(Router).routerState.root;
}
