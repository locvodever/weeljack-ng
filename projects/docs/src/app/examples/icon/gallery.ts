import { Component, computed, signal } from '@angular/core';
import { WjIcon, type WjIconDef } from 'weeljack-ng/icon';
import * as set from 'weeljack-ng/icon';
import { WjInputText } from 'weeljack-ng/inputtext';

/** One tile of the gallery: the Lucide-style name, the export name and the import line to copy. */
interface IconTile {
  readonly name: string;
  readonly exportName: string;
  readonly icon: WjIconDef;
  readonly importLine: string;
}

const isIconDef = (value: unknown): value is WjIconDef =>
  typeof value === 'object' && value !== null && 'nodes' in value && 'name' in value;

/** Every `wjIcon*` export that is an icon (not the `wjIconDef` function), sorted by name. */
const TILES: readonly IconTile[] = Object.entries(set)
  .flatMap(([exportName, value]): IconTile[] =>
    exportName.startsWith('wjIcon') && isIconDef(value)
      ? [
          {
            name: value.name,
            exportName,
            icon: value,
            importLine: `import { ${exportName} } from 'weeljack-ng/icon';`,
          },
        ]
      : [],
  )
  .sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));

@Component({
  selector: 'docs-icon-gallery-example',
  imports: [WjIcon, WjInputText],
  template: `
    <div class="search">
      <label for="icon-gallery-search">Search icons</label>
      <input
        wjInputText
        id="icon-gallery-search"
        type="search"
        autocomplete="off"
        #search
        [value]="term()"
        (input)="term.set(search.value)"
      />
      <p class="muted">{{ count() }}</p>
      <p class="muted" id="icon-gallery-hint">Choose an icon to copy its import line.</p>
    </div>

    @if (matches().length === 0) {
      <p class="muted">No icon matches “{{ term() }}”.</p>
    } @else {
      <div class="grid" role="group" aria-describedby="icon-gallery-hint" aria-label="Icons">
        @for (tile of matches(); track tile.exportName) {
          <button type="button" (click)="copy(tile)">
            <wj-icon class="glyph" [icon]="tile.icon" />
            <span class="name">{{ tile.name }}</span>
          </button>
        }
      </div>
    }

    <p class="status" role="status">
      @let result = status();
      @if (result) {
        {{ result.lead }} <span class="code">{{ result.line }}</span>
      }
    </p>
  `,
  styles: `
    :host {
      display: grid;
      gap: 16px;
    }

    .search {
      display: grid;
      gap: 4px;
    }

    label {
      font-size: 0.875rem;
      font-weight: 600;
      line-height: 1.5;
    }

    p {
      margin: 0;
    }

    .muted {
      color: var(--wj-text-muted-color);
      font-size: 0.875rem;
      line-height: 1.5;
    }

    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(6.5rem, 1fr));
      gap: 8px;
    }

    button {
      display: grid;
      justify-items: center;
      align-content: center;
      gap: 8px;
      min-inline-size: 44px;
      min-block-size: 44px;
      padding: 12px 8px;
      border: 1px solid var(--wj-content-border-color);
      border-radius: 8px;
      background: transparent;
      color: var(--wj-text-color);
      font: inherit;
      cursor: pointer;
    }

    button:hover {
      background: var(--wj-content-hover-background);
    }

    button:focus-visible {
      outline: var(--wj-focus-ring-width) var(--wj-focus-ring-style) var(--wj-focus-ring-color);
      outline-offset: var(--wj-focus-ring-offset);
    }

    .glyph {
      font-size: 1.5rem;
    }

    .name {
      font-size: 0.75rem;
      line-height: 1.5;
      overflow-wrap: anywhere;
      text-align: center;
    }

    .code {
      font-family: ui-monospace, monospace;
      font-size: 0.875rem;
    }

    .status {
      color: var(--wj-text-color);
      font-size: 0.875rem;
      line-height: 1.5;
      min-block-size: 1.5em;
    }
  `,
})
export class IconGalleryExample {
  protected readonly term = signal('');
  protected readonly status = signal<{ lead: string; line: string } | null>(null);

  protected readonly matches = computed(() => {
    const needle = this.term().trim().toLowerCase();
    return needle === ''
      ? TILES
      : TILES.filter(
          (tile) =>
            tile.name.toLowerCase().includes(needle) ||
            tile.exportName.toLowerCase().includes(needle),
        );
  });

  protected readonly count = computed(() => {
    const shown = this.matches().length;
    return shown === TILES.length
      ? `${String(TILES.length)} icons`
      : `${String(shown)} of ${String(TILES.length)} icons`;
  });

  protected async copy(tile: IconTile): Promise<void> {
    try {
      await navigator.clipboard.writeText(tile.importLine);
      this.status.set({ lead: 'Copied:', line: tile.importLine });
    } catch {
      this.status.set({ lead: "Couldn't copy. The import line is:", line: tile.importLine });
    }
  }
}
