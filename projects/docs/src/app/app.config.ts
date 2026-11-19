import { inject, provideBrowserGlobalErrorListeners, type ApplicationConfig } from '@angular/core';
import { provideClientHydration } from '@angular/platform-browser';
import {
  provideRouter,
  withComponentInputBinding,
  withNavigationErrorHandler,
} from '@angular/router';
import { provideWeeljack } from 'weeljack-ng';
import { routes } from './app.routes';
import { NavigationFailure } from './navigation-failure/navigation-failure';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(
      routes,
      withComponentInputBinding(),
      // The shell shows the banner (FR-25). Returning nothing keeps the router's default: the error
      // is still rethrown to the global listeners (21 Q8).
      withNavigationErrorHandler((error) => {
        inject(NavigationFailure).url.set(error.url);
      }),
    ),
    provideClientHydration(),
    // `darkMode: 'class'`: the header toggle puts `.wj-dark` on <html> (05 Q7).
    provideWeeljack({ darkMode: 'class' }),
  ],
};
