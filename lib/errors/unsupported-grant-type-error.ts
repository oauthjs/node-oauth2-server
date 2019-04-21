import { OAuthError } from './oauth-error';

/**
 * Constructor.
 *
 * "The authorization grant type is not supported by the authorization server."
 *
 * @see https://tools.ietf.org/html/rfc6749#section-4.1.2.1
 */

export class UnsupportedGrantTypeError extends OAuthError {
  constructor(message?: string | Error, properties?: any) {
    super(message, {
      code: 400,
      name: 'unsupported_grant_type',
      ...properties,
    });
  }
}
