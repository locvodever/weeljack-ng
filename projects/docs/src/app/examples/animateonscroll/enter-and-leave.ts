import { Component } from '@angular/core';
import { WjAnimateOnScroll } from 'weeljack-ng/animateonscroll';

@Component({
  selector: 'docs-animateonscroll-enter-and-leave-example',
  imports: [WjAnimateOnScroll],
  template: `
    @for (plant of plants; track plant.title) {
      <div class="card" wjAnimateOnScroll enterClass="docs-fade-in" leaveClass="docs-fade-out">
        <div class="title">{{ plant.title }}</div>
        <div class="line">{{ plant.line }}</div>
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

      .docs-fade-out {
        animation: docs-fade-out 250ms ease-in;
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

      @keyframes docs-fade-out {
        from {
          opacity: 1;
        }
        to {
          opacity: 0;
        }
      }
    }
  `,
})
export class AnimateOnScrollEnterAndLeaveExample {
  protected readonly plants = [
    { title: 'Fern', line: 'Keep the soil moist.' },
    { title: 'Cactus', line: 'Water once a month.' },
    { title: 'Basil', line: 'Give it six hours of sun.' },
    { title: 'Orchid', line: 'Water once a week.' },
  ];
}
