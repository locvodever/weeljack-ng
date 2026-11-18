import { Component, signal } from '@angular/core';
import { WjBlockUI } from 'weeljack-ng/blockui';
import { WjButton } from 'weeljack-ng/button';

type Status = 'Not saved yet' | 'Saving…' | 'Saved';

@Component({
  selector: 'docs-blockui-card-example',
  imports: [WjBlockUI, WjButton],
  template: `
    <section #card class="card" aria-labelledby="blockui-card-title">
      <div class="body">
        <p id="blockui-card-title" class="caption">Profile</p>
        <p>Name: Alex Kim</p>
        <p>Email: alex&#64;example.com</p>
        <wj-button label="Edit" severity="secondary" variant="outlined" />
      </div>
      <wj-blockui [blocked]="saving()" [target]="card">
        <p class="message">Saving…</p>
      </wj-blockui>
    </section>
    <div class="row">
      <wj-button label="Save" (click)="save()" />
      <p role="status" class="status">{{ status() }}</p>
    </div>
  `,
  styles: `
    :host {
      display: grid;
      gap: 16px;
      justify-items: start;
    }

    .card {
      box-sizing: border-box;
      inline-size: 100%;
      max-inline-size: 24rem;
      padding: 16px;
      border: 1px solid var(--wj-content-border-color);
      border-radius: 12px;
      color: var(--wj-text-color);
    }

    .body {
      display: grid;
      gap: 8px;
      justify-items: start;
    }

    .body p {
      margin: 0;
    }

    .caption {
      font-size: 0.875rem;
      font-weight: 600;
    }

    .row {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 8px;
    }

    .status {
      margin: 0;
      font-size: 0.875rem;
      color: var(--wj-text-muted-color);
    }

    /* The message sits on a card: text straight on the mask is too faint in light mode. */
    .message {
      padding: 8px 16px;
      background: var(--wj-content-background);
      border: 1px solid var(--wj-content-border-color);
      border-radius: 12px;
      color: var(--wj-text-color);
    }
  `,
})
export class BlockuiCardExample {
  protected readonly saving = signal(false);
  protected readonly status = signal<Status>('Not saved yet');

  /** Save stays enabled, so its focus is never lost: a press while saving is ignored. */
  protected save(): void {
    if (this.saving()) {
      return;
    }
    this.saving.set(true);
    this.status.set('Saving…');
    setTimeout(() => {
      this.saving.set(false);
      this.status.set('Saved');
    }, 1500);
  }
}
