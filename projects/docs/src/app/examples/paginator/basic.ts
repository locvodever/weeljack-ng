import { Component, signal } from '@angular/core';
import { WjPaginator } from 'weeljack-ng/paginator';

@Component({
  selector: 'docs-paginator-basic-example',
  imports: [WjPaginator],
  template: `
    <wj-paginator [totalRecords]="120" [(first)]="first" ariaLabel="Results pages" />
    <p>Showing records {{ first() + 1 }}–{{ first() + 10 }} of 120.</p>
  `,
})
export class PaginatorBasicExample {
  protected readonly first = signal(0);
}
