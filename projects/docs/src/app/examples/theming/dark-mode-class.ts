import type { ApplicationConfig } from '@angular/core';
import { provideWeeljack } from 'weeljack-ng';

export const appConfig: ApplicationConfig = {
  providers: [provideWeeljack({ darkMode: 'class' })],
};

/** Dark while `.wj-dark` is on `<html>`; the app decides when. */
export function setDark(document: Document, dark: boolean): void {
  document.documentElement.classList.toggle('wj-dark', dark);
}
