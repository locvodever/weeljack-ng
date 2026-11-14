import { Component, computed, input } from '@angular/core';

interface Part {
  text: string;
  code: boolean;
}

/**
 * Renders a string as text, with `backtick` spans as <code>. Always `{{ }}` interpolation, never
 * HTML, so a doc string cannot inject markup.
 */
@Component({
  selector: 'docs-text',
  template: `@for (part of parts(); track $index) {
    @if (part.code) {
      <code>{{ part.text }}</code>
    } @else {
      <ng-container>{{ part.text }}</ng-container>
    }
  }`,
})
export class DocsText {
  readonly value = input.required<string>();

  protected readonly parts = computed<Part[]>(() =>
    this.value()
      .split('`')
      .map((text, index) => ({ text, code: index % 2 === 1 }))
      .filter((part) => part.text !== ''),
  );
}
