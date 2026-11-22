import { DOCUMENT } from '@angular/common';
import { Injectable, computed, inject, signal } from '@angular/core';
import { WjTheme } from 'weeljack-ng/theme';
import palettes from '../../generated/theme-palettes.json';
import { THEME_STORAGE_KEY } from './theme-storage-key';

/** Which row of the panel a choice belongs to. */
export type ThemeKind = 'primary' | 'surface';

/** A palette name, or `null` for the default (Noir, zinc). */
type Choice = string | null;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * The docs reader's colour choice: the palette names of the two rows, applied through `WjTheme`,
 * remembered in `localStorage` and shown as the `provideWeeljack` call that reproduces them. Only
 * names are stored, and a stored name is used only when the generated list has it.
 */
@Injectable({ providedIn: 'root' })
export class DocsThemeChoice {
  private readonly theme = inject(WjTheme);
  private readonly storage = inject(DOCUMENT).defaultView?.localStorage;

  readonly primaries = palettes.primaries;
  readonly surfaces = palettes.surfaces;
  readonly primary = signal<Choice>(null);
  readonly surface = signal<Choice>(null);

  /** The generated row of the chosen primary, `undefined` for Noir. */
  readonly primaryRow = computed(() => this.primaries.find((row) => row.name === this.primary()));
  /** The generated row of the chosen surface, `undefined` for zinc. */
  readonly surfaceRow = computed(() => this.surfaces.find((row) => row.name === this.surface()));

  /**
   * The `provideWeeljack` call for the choice, with only the non-default keys, one per line so the
   * short lines fit the popover: a `// <name> <step>` comment above `primary` says where the hex
   * came from, then `primary`, then `surface`, each with a trailing comma. `provideWeeljack()` when
   * both rows are the default.
   */
  readonly snippet = computed(() => {
    const primary = this.primaryRow();
    const surface = this.surfaceRow();
    const lines: string[] = [];
    if (primary !== undefined) {
      lines.push(`  // ${primary.name} ${String(primary.step)}`, `  primary: '${primary.value}',`);
    }
    if (surface !== undefined) {
      lines.push(`  surface: '${surface.value}',`);
    }
    return lines.length === 0 ? 'provideWeeljack()' : `provideWeeljack({\n${lines.join('\n')}\n})`;
  });

  /** Applies one row's choice (`null` is the default) and remembers it. */
  select(kind: ThemeKind, name: Choice): void {
    this.apply(kind, name);
    this.save();
  }

  /** Back to Noir on zinc, and forgets the choice. */
  reset(): void {
    this.theme.reset();
    this.primary.set(null);
    this.surface.set(null);
    this.save();
  }

  /** Applies the remembered choice. A name the generated list lacks is ignored. */
  restore(): void {
    let stored: unknown;
    try {
      const text = this.storage?.getItem(THEME_STORAGE_KEY);
      stored = text === null || text === undefined ? undefined : JSON.parse(text);
    } catch {
      return;
    }
    if (isRecord(stored)) {
      this.apply('primary', this.known(this.primaries, stored['primary']));
      this.apply('surface', this.known(this.surfaces, stored['surface']));
    }
    this.save();
  }

  private known(rows: readonly { name: string }[], name: unknown): Choice {
    return typeof name === 'string' && rows.some((row) => row.name === name) ? name : null;
  }

  private apply(kind: ThemeKind, name: Choice): void {
    if (kind === 'primary') {
      this.primary.set(name);
      this.theme.setPrimary(this.primaryRow()?.value);
    } else {
      this.surface.set(name);
      this.theme.setSurface(this.surfaceRow()?.value);
    }
  }

  /** Stores the names, or removes the key when both are the default. Storage errors are ignored. */
  private save(): void {
    const primary = this.primary();
    const surface = this.surface();
    try {
      if (primary === null && surface === null) {
        this.storage?.removeItem(THEME_STORAGE_KEY);
      } else {
        this.storage?.setItem(THEME_STORAGE_KEY, JSON.stringify({ primary, surface }));
      }
    } catch {
      // Storage is disabled or full: the choice still applies, it is just not remembered.
    }
  }
}
