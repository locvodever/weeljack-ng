import { Component } from '@angular/core';
import site from '../../generated/site.json';

/**
 * 14 Q3's table: the WeeljackNg line, the Angular range and the Optimus UI range. Every cell comes
 * from `site.json`, which `npm run generate` writes from the library manifest's peers, so the table
 * cannot drift from what npm resolves. Get started and Platform support both show it.
 */
@Component({
  selector: 'docs-compatibility-table',
  templateUrl: './compatibility-table.html',
  styleUrl: './compatibility-table.css',
})
export class CompatibilityTable {
  protected readonly releaseLine = site.releaseLine;
  protected readonly angular = site.peers['@angular/core'];
  protected readonly optimus = site.peers['@openng/optimus-ui'];
}
