import { provideBrowserGlobalErrorListeners, type ApplicationConfig } from '@angular/core';
import { provideClientHydration } from '@angular/platform-browser';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideWeeljack } from 'weeljack-ng';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withComponentInputBinding()),
    provideClientHydration(),
    // `darkMode: 'class'`: the header toggle puts `.wj-dark` on <html> (05 Q7).
    provideWeeljack({ darkMode: 'class' }),
  ],
};
