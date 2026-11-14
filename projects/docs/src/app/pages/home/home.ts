import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CodeBlock } from '../../code-block/code-block';

@Component({
  selector: 'docs-home-page',
  imports: [RouterLink, CodeBlock],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class HomePage {
  /** Links are written relative to the root route, so the base href decides where they point. */
  protected readonly root = inject(Router).routerState.root;
}
