import { Component, input } from '@angular/core';

/**
 * The Weeljack mark: a shield split into two tones, holding the wj glyph (the j's tail runs back under
 * the w). Drawn for this project as hand-written SVG; the same mark is `public/favicon.svg`.
 *
 * Decorative: place it beside text that names the link. Its colours come from the active preset's
 * primary, active and contrast colours, so it follows the theme panel. The SVG has no ids, so no
 * `url(#…)` reference can break under the site's `<base href>`.
 */
@Component({
  selector: 'docs-logo',
  templateUrl: './logo.html',
  styleUrl: './logo.css',
})
export class DocsLogo {
  /** Rendered width and height, in CSS pixels. */
  readonly size = input(28);
}
