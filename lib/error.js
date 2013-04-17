
/**
 * Error
 *
 * @param {Number} code        Numeric error code
 * @param {String} error       Error descripton
 * @param {String} description Full error description
 */
module.exports = function (error, description, err) {

	switch (error) {
		case 'invalid_client':
		case 'invalid_grant':
		case 'invalid_request':
			this.code = 400;
			break;
		case 'server_error':
			this.code = 503;
			break;
		default:
			this.code = 500;
	}

	this.error = error;
	this.error_description = description || error;
	this.stack = (err && err.stack) || err;
};