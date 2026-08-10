import axios, { AxiosInstance, AxiosError, AxiosRequestConfig } from 'axios';
import { IHttpClient, RequestOptions } from './IHttpClient';
import { environmentConfig, CORE_CONSTANTS } from '@core/config';
import { AppError, ErrorCode } from '@core/errors';

export class HttpClient implements IHttpClient {
  private readonly client: AxiosInstance;

  constructor(baseURL: string = environmentConfig.apiUrl) {
    this.client = axios.create({
      baseURL,
      timeout: CORE_CONSTANTS.HTTP_TIMEOUT_MS,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private buildAxiosConfig(options?: RequestOptions): AxiosRequestConfig {
    if (!options) return {};
    const config: AxiosRequestConfig = {};
    if (options.headers) config.headers = options.headers;
    if (options.params) config.params = options.params;
    if (options.timeout !== undefined) config.timeout = options.timeout;
    return config;
  }

  private setupInterceptors(): void {
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response) {
          const status = error.response.status;
          const data = error.response.data as { message?: string; code?: string } | undefined;
          const message = data?.message || error.message || 'HTTP Request failed';

          let errorCode = ErrorCode.SERVER_ERROR;
          if (status === 401) errorCode = ErrorCode.UNAUTHORIZED;
          else if (status === 403) errorCode = ErrorCode.FORBIDDEN;
          else if (status === 404) errorCode = ErrorCode.NOT_FOUND;

          return Promise.reject(new AppError(message, errorCode, status, { data }));
        }

        if (error.code === 'ECONNABORTED') {
          return Promise.reject(
            new AppError('Request timed out', ErrorCode.TIMEOUT, undefined, { originalCode: error.code })
          );
        }

        return Promise.reject(
          new AppError('Network connection failure', ErrorCode.NETWORK_ERROR, undefined, {
            originalError: error.message,
          })
        );
      }
    );
  }

  public async get<T>(url: string, options?: RequestOptions): Promise<T> {
    const response = await this.client.get<T>(url, this.buildAxiosConfig(options));
    return response.data;
  }

  public async post<T>(url: string, body?: unknown, options?: RequestOptions): Promise<T> {
    const response = await this.client.post<T>(url, body, this.buildAxiosConfig(options));
    return response.data;
  }

  public async patch<T>(url: string, body?: unknown, options?: RequestOptions): Promise<T> {
    const response = await this.client.patch<T>(url, body, this.buildAxiosConfig(options));
    return response.data;
  }

  public async delete<T>(url: string, options?: RequestOptions): Promise<T> {
    const response = await this.client.delete<T>(url, this.buildAxiosConfig(options));
    return response.data;
  }

  public setAuthorizationHeader(token: string): void {
    this.client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  public clearAuthorizationHeader(): void {
    delete this.client.defaults.headers.common['Authorization'];
  }
}
