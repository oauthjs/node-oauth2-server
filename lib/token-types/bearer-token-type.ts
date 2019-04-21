import { InvalidArgumentError } from '../errors';
import { hasOwnProperty } from '../utils/fn';

export class BearerTokenType {
  accessToken: string;
  accessTokenLifetime: number;
  refreshToken: string;
  scope: string;
  customAttributes: any;
  constructor(
    accessToken: string,
    accessTokenLifetime: number,
    refreshToken: string,
    scope: string,
    customAttributes: any,
  ) {
    if (!accessToken) {
      throw new InvalidArgumentError('Missing parameter: `accessToken`');
    }

    this.accessToken = accessToken;
    this.accessTokenLifetime = accessTokenLifetime;
    this.refreshToken = refreshToken;
    this.scope = scope;

    if (customAttributes) {
      this.customAttributes = customAttributes;
    }
  }

  /**
   * Retrieve the value representation.
   */

  valueOf() {
    const object: any = {
      access_token: this.accessToken,
      token_type: 'Bearer',
    };

    if (this.accessTokenLifetime) {
      object.expires_in = this.accessTokenLifetime;
    }

    if (this.refreshToken) {
      object.refresh_token = this.refreshToken;
    }

    if (this.scope) {
      object.scope = this.scope;
    }

    for (const key in this.customAttributes) {
      if (hasOwnProperty(this.customAttributes, key)) {
        object[key] = this.customAttributes[key];
      }
    }

    return object;
  }
}
