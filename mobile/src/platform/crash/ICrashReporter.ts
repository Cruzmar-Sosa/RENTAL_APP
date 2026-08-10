export interface ICrashReporter {
  captureError(error: unknown, context?: Record<string, unknown>): void;
  setUser(id: string, email?: string): void;
  addBreadcrumb(message: string, category?: string): void;
}
