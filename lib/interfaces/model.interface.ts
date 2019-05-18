import { AuthorizationCode, Client, RefreshToken, Token, User } from '.';
import { Request } from '../request';

export interface BaseModel {
  request: Request;
  /**
   * Invoked to generate a new access token.
   *
   */
  generateAccessToken?(
    client: Client,
    user: User,
    scope: string,
  ): Promise<string>;

  /**
   * Invoked to retrieve a client using a client id or a
   *  client id/client secret combination, depending on the grant type.
   *
   */
  getClient(clientId: string, clientSecret?: string): Promise<Client>;

  /**
   * Invoked to save an access token and optionally a refresh token, depending on the grant type.
   *
   */
  saveToken(token: Token, client: Client, user: User): Promise<Token>;
}

export interface RequestAuthenticationModel {
  /**
   * Invoked to retrieve an existing access token previously saved through Model#saveToken().
   *
   */
  getAccessToken(accessToken: string): Promise<Token>;

  /**
   * Invoked during request authentication to check if
   * the provided access token was authorized the requested scopes.
   *
   */
  verifyScope(token: Token, scope: string): Promise<boolean>;
}

export interface AuthorizationCodeModel
  extends BaseModel,
    RequestAuthenticationModel {
  /**
   * Invoked to generate a new refresh token.
   *
   */
  generateRefreshToken?(
    client: Client,
    user: User,
    scope: string,
  ): Promise<string>;

  /**
   * Invoked to generate a new authorization code.
   *
   */
  generateAuthorizationCode?(
    client: Client,
    user: User,
    scope: string,
  ): Promise<string>;

  /**
   * Invoked to retrieve an existing authorization
   * code previously saved through Model#saveAuthorizationCode().
   *
   */
  getAuthorizationCode(authorizationCode: string): Promise<AuthorizationCode>;

  /**
   * Invoked to save an authorization code.
   *
   */
  saveAuthorizationCode(
    code: AuthorizationCode,
    client: Client,
    user: User,
  ): Promise<AuthorizationCode>;

  /**
   * Invoked to revoke an authorization code.
   *
   */
  revokeAuthorizationCode(code: AuthorizationCode): Promise<boolean>;

  /**
   * Invoked to check if the requested scope is
   *  valid for a particular client/user combination.
   *
   */
  validateScope?(user: User, client: Client, scope: string): Promise<string>;
}

export interface PasswordModel extends BaseModel, RequestAuthenticationModel {
  /**
   * Invoked to generate a new refresh token.
   *
   */
  generateRefreshToken?(
    client: Client,
    user: User,
    scope: string,
  ): Promise<string>;

  /**
   * Invoked to retrieve a user using a
   *  username/password combination.
   *
   */
  getUser(username: string, password: string): Promise<User>;

  /**
   * Invoked to check if the requested scope
   * is valid for a particular client/user combination.
   *
   */
  validateScope?(user: User, client: Client, scope: string): Promise<string>;
}

export interface RefreshTokenModel
  extends BaseModel,
    RequestAuthenticationModel {
  /**
   * Invoked to generate a new refresh token.
   *
   */
  generateRefreshToken?(
    client: Client,
    user: User,
    scope: string,
  ): Promise<string>;

  /**
   * Invoked to retrieve an existing refresh token previously saved through Model#saveToken().
   *
   */
  getRefreshToken(refreshToken: string): Promise<RefreshToken>;

  /**
   * Invoked to revoke a refresh token.
   *
   */
  revokeToken(token: RefreshToken | Token): Promise<boolean>;
}

export interface ClientCredentialsModel
  extends BaseModel,
    RequestAuthenticationModel {
  /**
   * Invoked to retrieve the user associated with the specified client.
   *
   */
  getUserFromClient(client: Client): Promise<User>;

  /**
   * Invoked to check if the requested scope is valid for a particular client/user combination.
   *
   */
  validateScope?(user: User, client: Client, scope: string): Promise<string>;
}

export interface ExtensionModel extends BaseModel, RequestAuthenticationModel {}

export interface Model
  extends BaseModel,
    RequestAuthenticationModel,
    AuthorizationCodeModel,
    PasswordModel,
    RefreshTokenModel,
    ClientCredentialsModel {}
