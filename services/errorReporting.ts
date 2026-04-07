/**
 * Centralized error reporting service.
 * Wraps Sentry for structured error capture across the app.
 */

import * as Sentry from '@sentry/react-native';

type ErrorContext = {
  screen?: string;
  action?: string;
  userId?: string;
  debateId?: string;
  extra?: Record<string, any>;
};

/**
 * Capture an error with context.
 */
export function captureError(error: unknown, context?: ErrorContext): void {
  const err = error instanceof Error ? error : new Error(String(error));

  if (context) {
    Sentry.withScope((scope) => {
      if (context.screen) scope.setTag('screen', context.screen);
      if (context.action) scope.setTag('action', context.action);
      if (context.userId) scope.setUser({ id: context.userId });
      if (context.debateId) scope.setTag('debateId', context.debateId);
      if (context.extra) scope.setExtras(context.extra);
      Sentry.captureException(err);
    });
  } else {
    Sentry.captureException(err);
  }
}

/**
 * Capture a warning message (non-fatal).
 */
export function captureWarning(message: string, context?: ErrorContext): void {
  Sentry.withScope((scope) => {
    scope.setLevel('warning');
    if (context?.screen) scope.setTag('screen', context.screen);
    if (context?.action) scope.setTag('action', context.action);
    if (context?.extra) scope.setExtras(context.extra);
    Sentry.captureMessage(message);
  });
}

/**
 * Set the current user for all future error reports.
 */
export function setUser(userId: string, email?: string, pseudo?: string): void {
  Sentry.setUser({ id: userId, email, username: pseudo });
}

/**
 * Clear user on logout.
 */
export function clearUser(): void {
  Sentry.setUser(null);
}

/**
 * Add breadcrumb for debugging context.
 */
export function addBreadcrumb(category: string, message: string, data?: Record<string, any>): void {
  Sentry.addBreadcrumb({ category, message, data, level: 'info' });
}
