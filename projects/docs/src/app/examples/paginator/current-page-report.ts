import { Component } from '@angular/core';
import { WjPaginator } from 'weeljack-ng/paginator';

@Component({
  selector: 'docs-paginator-current-page-report-example',
  imports: [WjPaginator],
  template: `
    <wj-paginator
      [totalRecords]="120"
      showCurrentPageReport
      currentPageReportTemplate="{first}–{last} of {totalRecords}"
      ariaLabel="Results pages, with a report"
    />
  `,
})
export class PaginatorCurrentPageReportExample {}
