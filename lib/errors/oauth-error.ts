import * as statuses from 'statuses';

export class OAuthError extends Error {
  code: any;
  status: any;
  statusCode: any;
  constructor(messageOrError: string | Error, properties: any = {}) {
    super();
    let message =
      messageOrError instanceof Error ? messageOrError.message : messageOrError;
    const error = messageOrError instanceof Error ? messageOrError : undefined;
    let props: any = {};
    props = properties;
    props.code = props.code || 500; // default code 500

    if (error) {
      props.inner = error;
    }
    if (!message) {
      message = statuses[props.code as keyof typeof statuses] as any;
    }
    this.code = this.status = this.statusCode = props.code;
    this.message = message;

    const ignoreAttr = ['code', 'message'];
    Object.keys(props)
      .filter(key => !ignoreAttr.includes(key))
      .forEach(key => {
       (this as any)[key] = props[key]
      });

    Error.captureStackTrace(this, OAuthError);
  }
}
