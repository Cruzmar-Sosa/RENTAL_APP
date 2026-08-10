export interface RequestOptions {
  headers?: Record<string, string>;
  params?: Record<string, unknown>;
  timeout?: number;
}

export interface IHttpClient {
  get<T>(url: string, options?: RequestOptions): Promise<T>;
  post<T>(url: string, body?: unknown, options?: RequestOptions): Promise<T>;
  patch<T>(url: string, body?: unknown, options?: RequestOptions): Promise<T>;
  delete<T>(url: string, options?: RequestOptions): Promise<T>;
  setAuthorizationHeader(token: string): void;
  clearAuthorizationHeader(): void;
}
