import { OAuthError } from './oauth-error';

/**
 * Constructor.
 *
 * "The authorization server does not supported obtaining an
 * authorization code using this method."
 *
 * @see https://tools.ietf.org/html/rfc6749#section-4.1.2.1
 */

export class UnsupportedResponseTypeError extends OAuthError {
  constructor(message?: string | Error, properties?: any) {
    super(message, {
      code: 400,
      name: 'unsupported_response_type',
      ...properties,
    });
  }
}
