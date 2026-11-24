import { Component, signal } from '@angular/core';
import { WjPaginator } from 'weeljack-ng/paginator';

@Component({
  selector: 'docs-paginator-rows-per-page-example',
  imports: [WjPaginator],
  template: `
    <wj-paginator
      [totalRecords]="120"
      [(first)]="first"
      [(rows)]="rows"
      [rowsPerPageOptions]="[10, 20, 50]"
      ariaLabel="Results pages, with page sizes"
    />
    <p>{{ rows() }} records a page, starting at record {{ first() + 1 }}.</p>
  `,
})
export class PaginatorRowsPerPageExample {
  protected readonly first = signal(0);
  protected readonly rows = signal(10);
}
