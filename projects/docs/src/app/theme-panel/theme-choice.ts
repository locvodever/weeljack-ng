import { DOCUMENT } from '@angular/common';
import { Injectable, computed, inject, signal } from '@angular/core';
import { WjTheme } from 'weeljack-ng/theme';
import { PRESET_LOADERS } from '../../generated/preset-loaders';
import palettes from '../../generated/theme-palettes.json';
import { THEME_STORAGE_KEY } from './theme-storage-key';

/** Which row of the panel a choice belongs to. */
export type ThemeKind = 'primary' | 'surface' | 'preset';

/** A palette or preset name, or `null` for the default (Noir, zinc). */
type Choice = string | null;

/** The generated preset row that is the docs bootstrap's own preset, so it loads nothing. */
const NOIR = 'noir';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * The docs reader's theme choice: the preset and the palette names of the two colour rows, applied
 * through `WjTheme`, remembered in `localStorage` and shown as the `provideWeeljack` call that
 * reproduces them. Only names are stored, and a stored name is used only when the generated list
 * has it. A preset is loaded on demand (`import()`), so none is in the docs' initial bundle.
 */
@Injectable({ providedIn: 'root' })
export class DocsThemeChoice {
  private readonly theme = inject(WjTheme);
  private readonly storage = inject(DOCUMENT).defaultView?.localStorage;

  readonly presets = PRESET_LOADERS;
  readonly primaries = palettes.primaries;
  readonly surfaces = palettes.surfaces;
  readonly preset = signal<Choice>(null);
  readonly primary = signal<Choice>(null);
  readonly surface = signal<Choice>(null);

  /** The preset really in effect: `preset` runs ahead of it while a chunk loads. */
  private applied: Choice = null;
  /** Counts preset choices, so a load of an older choice that resolves late is dropped. */
  private presetToken = 0;

  /** The generated row of the chosen preset, `undefined` for Noir. */
  readonly presetRow = computed(() => this.presets.find((row) => row.name === this.preset()));
  /** The generated row of the chosen primary, `undefined` for Noir. */
  readonly primaryRow = computed(() => this.primaries.find((row) => row.name === this.primary()));
  /** The generated row of the chosen surface, `undefined` for zinc. */
  readonly surfaceRow = computed(() => this.surfaces.find((row) => row.name === this.surface()));

  /**
   * The `provideWeeljack` call for the choice, with only the non-default keys, one per line so the
   * short lines fit the popover: `preset` first, then `primary`, then `surface`, each with a
   * trailing comma. A hex `primary` gets a `// <name> <step>` comment above it, saying where the
   * hex came from; a `'{name}'` primary needs none. A non-Noir preset puts its import line and a
   * blank line above the call. `provideWeeljack()` when all three rows are the default.
   */
  readonly snippet = computed(() => {
    const preset = this.presetRow();
    const primary = this.primaryRow();
    const surface = this.surfaceRow();
    const lines: string[] = [];
    if (preset !== undefined) {
      lines.push(`  preset: ${preset.exportName},`);
    }
    if (primary !== undefined) {
      if (primary.value.startsWith('#')) {
        lines.push(`  // ${primary.name} ${String(primary.step)}`);
      }
      lines.push(`  primary: '${primary.value}',`);
    }
    if (surface !== undefined) {
      lines.push(`  surface: '${surface.value}',`);
    }
    if (lines.length === 0) {
      return 'provideWeeljack()';
    }
    const call = `provideWeeljack({\n${lines.join('\n')}\n})`;
    return preset === undefined
      ? call
      : `import { ${preset.exportName} } from '${preset.entry}';\n\n${call}`;
  });

  /**
   * Applies one row's choice (`null` is the default) and remembers it. A preset is remembered once
   * it is loaded and applied: until then its radio is checked and the site keeps its look.
   */
  select(kind: ThemeKind, name: Choice): void {
    if (kind === 'preset') {
      if (!this.choosePreset(name)) {
        this.save();
      }
      return;
    }
    this.apply(kind, name);
    this.save();
  }

  /** Back to Noir on zinc, and forgets the choice. */
  reset(): void {
    this.theme.reset();
    this.presetToken++;
    this.applied = null;
    this.preset.set(null);
    this.primary.set(null);
    this.surface.set(null);
    this.save();
  }

  /**
   * Applies the remembered choice. A name the generated list lacks is ignored. A remembered preset
   * applies when its chunk has loaded, and the choice is saved back then.
   */
  restore(): void {
    let stored: unknown;
    try {
      const text = this.storage?.getItem(THEME_STORAGE_KEY);
      stored = text === null || text === undefined ? undefined : JSON.parse(text);
    } catch {
      return;
    }
    let pending = false;
    if (isRecord(stored)) {
      this.apply('primary', this.known(this.primaries, stored['primary']));
      this.apply('surface', this.known(this.surfaces, stored['surface']));
      pending = this.choosePreset(this.known(this.presets, stored['preset']));
    }
    if (!pending) {
      this.save();
    }
  }

  private known(rows: readonly { name: string }[], name: unknown): Choice {
    return typeof name === 'string' && rows.some((row) => row.name === name) ? name : null;
  }

  /**
   * Checks the preset's radio at once and applies the preset when its loader resolves. The last
   * choice wins, and a rejected load leaves the preset in effect, the radio showing it and nothing
   * stored. Noir loads nothing. Returns whether a load is pending, in which case the choice is
   * saved once it applies.
   */
  private choosePreset(name: Choice): boolean {
    const token = ++this.presetToken;
    const row = this.presets.find((item) => item.name === name && item.name !== NOIR);
    this.preset.set(row?.name ?? null);
    if (row === undefined) {
      this.theme.setPreset();
      this.applied = null;
      return false;
    }
    void row.load().then(
      (value) => {
        if (token === this.presetToken) {
          this.theme.setPreset(value);
          this.applied = row.name;
          this.save();
        }
      },
      () => {
        if (token === this.presetToken) {
          this.preset.set(this.applied);
        }
      },
    );
    return true;
  }

  private apply(kind: 'primary' | 'surface', name: Choice): void {
    if (kind === 'primary') {
      this.primary.set(name);
      this.theme.setPrimary(this.primaryRow()?.value);
    } else {
      this.surface.set(name);
      this.theme.setSurface(this.surfaceRow()?.value);
    }
  }

  /**
   * Stores the names, or removes the key when all three are the default. The preset stored is the
   * one in effect. Storage errors are ignored.
   */
  private save(): void {
    const preset = this.applied;
    const primary = this.primary();
    const surface = this.surface();
    try {
      if (primary === null && surface === null && preset === null) {
        this.storage?.removeItem(THEME_STORAGE_KEY);
      } else {
        this.storage?.setItem(THEME_STORAGE_KEY, JSON.stringify({ primary, surface, preset }));
      }
    } catch {
      // Storage is disabled or full: the choice still applies, it is just not remembered.
    }
  }
}
