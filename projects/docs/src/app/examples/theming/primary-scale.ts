import type { ApplicationConfig } from '@angular/core';
import { provideWeeljack, type WjColorScale } from 'weeljack-ng';

const teal: WjColorScale = {
  50: '#f3f8f8',
  100: '#c5dedc',
  200: '#98c4c1',
  300: '#6aaaa5',
  400: '#3d908a',
  500: '#0f766e',
  600: '#0d645e',
  700: '#0b534d',
  800: '#08413d',
  900: '#062f2c',
  950: '#041e1c',
};

export const appConfig: ApplicationConfig = {
  providers: [provideWeeljack({ primary: teal })],
};
