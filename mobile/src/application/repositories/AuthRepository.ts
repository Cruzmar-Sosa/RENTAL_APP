import { IAuthRepository, LoginCredentials, AuthTokens } from '@domain/repositories/IAuthRepository';
import { User, UserProps } from '@domain/entities/User';
import { IHttpClient } from '@platform/api';
import { ISecureStorage } from '@platform/storage';
import { Nullable } from '@core/types';
import { STORAGE_KEYS } from '@core/constants';
import { APP_URLS } from '@core/config';

interface ApiAuthResponse {
  user: UserProps;
  accessToken?: string;
  access_token?: string;
  refreshToken?: string;
  refresh_token?: string;
}

interface ApiRefreshResponse {
  accessToken?: string;
  access_token?: string;
  refreshToken?: string;
  refresh_token?: string;
}

export class AuthRepository implements IAuthRepository {
  constructor(
    private readonly httpClient: IHttpClient,
    private readonly secureStorage: ISecureStorage
  ) {}

  public async login(credentials: LoginCredentials): Promise<{ user: User; tokens: AuthTokens }> {
    const response = await this.httpClient.post<{ data: ApiAuthResponse } | ApiAuthResponse>(
      APP_URLS.auth.login,
      {
        email: credentials.email,
        password: credentials.pass,
      }
    );

    const payload = 'data' in response ? response.data : response;

    const accessToken = payload.access_token || payload.accessToken || '';
    const refreshToken = payload.refresh_token || payload.refreshToken || accessToken;

    const tokens: AuthTokens = {
      accessToken,
      refreshToken,
    };

    const user = new User(payload.user);

    await this.secureStorage.setItem(STORAGE_KEYS.SECURE.ACCESS_TOKEN, tokens.accessToken);
    await this.secureStorage.setItem(STORAGE_KEYS.SECURE.REFRESH_TOKEN, tokens.refreshToken);
    this.httpClient.setAuthorizationHeader(tokens.accessToken);

    return { user, tokens };
  }

  public async refreshToken(token: string): Promise<AuthTokens> {
    const response = await this.httpClient.post<{ data: ApiRefreshResponse } | ApiRefreshResponse>(
      APP_URLS.auth.refresh,
      { refreshToken: token }
    );

    const payload = 'data' in response ? response.data : response;

    const accessToken = payload.access_token || payload.accessToken || '';
    const refreshToken = payload.refresh_token || payload.refreshToken || accessToken;

    const tokens: AuthTokens = {
      accessToken,
      refreshToken,
    };

    await this.secureStorage.setItem(STORAGE_KEYS.SECURE.ACCESS_TOKEN, tokens.accessToken);
    await this.secureStorage.setItem(STORAGE_KEYS.SECURE.REFRESH_TOKEN, tokens.refreshToken);
    this.httpClient.setAuthorizationHeader(tokens.accessToken);

    return tokens;
  }

  public async logout(): Promise<void> {
    try {
      await this.httpClient.post(APP_URLS.auth.logout);
    } catch {
      // Ignore network failures on logout, proceed with local cleanup
    } finally {
      await this.secureStorage.deleteItem(STORAGE_KEYS.SECURE.ACCESS_TOKEN);
      await this.secureStorage.deleteItem(STORAGE_KEYS.SECURE.REFRESH_TOKEN);
      this.httpClient.clearAuthorizationHeader();
    }
  }

  public async getCurrentUser(): Promise<Nullable<User>> {
    const token = await this.secureStorage.getItem(STORAGE_KEYS.SECURE.ACCESS_TOKEN);
    if (!token) return null;

    this.httpClient.setAuthorizationHeader(token);

    try {
      const response = await this.httpClient.get<{ data: UserProps } | UserProps>(APP_URLS.auth.me);
      const props = 'data' in response ? response.data : response;
      return new User(props);
    } catch {
      return null;
    }
  }
}
