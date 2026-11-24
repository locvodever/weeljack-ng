import { Component } from '@angular/core';
import { WjScrollPanel } from 'weeljack-ng/scrollpanel';

@Component({
  selector: 'docs-scrollpanel-both-example',
  imports: [WjScrollPanel],
  template: `
    <wj-scrollpanel ariaLabel="Monthly figures">
      <div class="figures">
        <table>
          <thead>
            <tr>
              <th scope="col">Region</th>
              @for (month of months; track month) {
                <th scope="col">{{ month }}</th>
              }
            </tr>
          </thead>
          <tbody>
            @for (region of regions; track region; let row = $index) {
              <tr>
                <th scope="row">{{ region }}</th>
                @for (month of months; track month; let column = $index) {
                  <td>{{ figure(row, column) }}</td>
                }
              </tr>
            }
          </tbody>
        </table>
      </div>
    </wj-scrollpanel>
  `,
  styles: `
    :host {
      display: block;
      max-inline-size: 40rem;
    }

    wj-scrollpanel {
      block-size: 15rem;
    }

    .figures {
      padding: 16px;
      padding-inline-end: 24px;
      padding-block-end: 24px;
    }

    table {
      min-inline-size: 60rem;
      border-collapse: collapse;
    }

    th,
    td {
      padding: 8px 12px;
      text-align: end;
      white-space: nowrap;
    }

    th:first-child {
      text-align: start;
    }
  `,
})
export class ScrollpanelBothExample {
  protected readonly months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  protected readonly regions = [
    'Harbor',
    'Hillside',
    'Lakeside',
    'Old town',
    'Riverside',
    'Uptown',
    'Westfield',
    'Eastgate',
    'Northpoint',
    'Southbank',
    'Midtown',
    'Parkview',
  ];

  /** A made-up figure for the table. */
  protected figure(row: number, column: number): number {
    return 100 + ((row * 37 + column * 19) % 90);
  }
}
