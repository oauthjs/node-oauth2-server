const Request = require('../../lib/request');

module.exports = (request) => {
  const req = new Request({
    query: {},
    body: {},
    headers: {},
    method: 'GET',
    ...request
  });

  req.is = function (header) {
    return this.headers['content-type'] === header;
  };

  return req;
};
