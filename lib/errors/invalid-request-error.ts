import { OAuthError } from './oauth-error';

/**
 * Constructor.
 *
 * "The request is missing a required parameter, includes an invalid parameter value,
 * includes a parameter more than once, or is otherwise malformed."
 *
 * @see https://tools.ietf.org/html/rfc6749#section-4.2.2.1
 */

export class InvalidRequestError extends OAuthError {
  constructor(message?: string | Error, properties?: any) {
    super(message, { code: 400, name: 'invalid_request', ...properties });
  }
}
