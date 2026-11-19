import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { WjButton } from 'weeljack-ng/button';
import { WjCheckbox } from 'weeljack-ng/checkbox';
import { WjSkeleton } from 'weeljack-ng/skeleton';
import { WjTag } from 'weeljack-ng/tag';
import { WjToggleSwitch } from 'weeljack-ng/toggleswitch';
import { CodeBlock } from '../../code-block/code-block';

/** `/`: the front door (FR-17). The strip renders five wave-1 components directly, like theming's panes. */
@Component({
  selector: 'docs-home-page',
  imports: [RouterLink, CodeBlock, WjButton, WjCheckbox, WjSkeleton, WjTag, WjToggleSwitch],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class HomePage {
  /** Links are written relative to the root route, so the base href decides where they point. */
  protected readonly root = inject(Router).routerState.root;

  protected readonly subscribed = signal(false);
  protected readonly enabled = signal(false);
}
