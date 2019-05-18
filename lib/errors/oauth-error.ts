import { defaults, isEmpty } from 'lodash';
import * as statuses from 'statuses';

export class OAuthError extends Error {
  code: any;
  status: any;
  statusCode: any;
  constructor(messageOrError: string | Error, properties?: any) {
    super();
    let message =
      messageOrError instanceof Error ? messageOrError.message : messageOrError;
    const error = messageOrError instanceof Error ? messageOrError : undefined;
    let props: any = {};
    if (!isEmpty(properties)) {
      props = properties;
    }

    defaults(props, { code: 500 });

    if (error) {
      props.inner = error;
    }
    if (isEmpty(message)) {
      message = statuses[props.code];
    }
    this.code = this.status = this.statusCode = props.code;
    this.message = message;
    for (const key in props) {
      if (key !== 'code') {
        this[key] = props[key];
      }
    }
    Error.captureStackTrace(this, OAuthError);
  }
}
