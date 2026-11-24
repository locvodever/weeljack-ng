import { Component } from '@angular/core';
import { WjAnimateOnScroll } from 'weeljack-ng/animateonscroll';

@Component({
  selector: 'docs-animateonscroll-basic-example',
  imports: [WjAnimateOnScroll],
  template: `
    @for (step of steps; track step.title) {
      <div class="card" wjAnimateOnScroll enterClass="docs-fade-in" once>
        <div class="title">{{ step.title }}</div>
        <div class="line">{{ step.line }}</div>
      </div>
    }
  `,
  styles: `
    :host {
      display: grid;
      gap: 16px;
      inline-size: min(100%, 24rem);
    }

    .card {
      border: 1px solid var(--wj-content-border-color);
      border-radius: 12px;
      padding: 16px;
      background: var(--wj-content-background);
    }

    .title {
      color: var(--wj-text-color);
      font-size: 1rem;
      font-weight: 600;
    }

    .line {
      margin-block-start: 4px;
      color: var(--wj-text-muted-color);
      font-size: 0.875rem;
    }

    @media (prefers-reduced-motion: no-preference) {
      .docs-fade-in {
        animation: docs-fade-in 400ms ease-out;
      }

      @keyframes docs-fade-in {
        from {
          opacity: 0;
          transform: translateY(1rem);
        }
        to {
          opacity: 1;
          transform: none;
        }
      }
    }
  `,
})
export class AnimateOnScrollBasicExample {
  protected readonly steps = [
    { title: 'Create a project', line: 'Give it a name and a short description.' },
    { title: 'Invite your team', line: 'Add the people who will work on it.' },
    { title: 'Add your first task', line: 'Write down the next thing to do.' },
    { title: 'Set a due date', line: 'Pick the day it should be done.' },
    { title: 'Share an update', line: 'Let everyone know how it is going.' },
    { title: 'Review your week', line: 'Look back at what got done.' },
  ];
}
