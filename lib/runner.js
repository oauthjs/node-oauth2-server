

module.exports = runner;

/**
 * Run through the sequence of functions
 *
 * @param  {Function} next
 * @public
 */
function runner (fns, context, next) {
  var last = fns.length - 1;

  (function run(pos) {
    fns[pos].call(context, function (err, res) {
      if (err || pos === last) return next(err, res);
      run(++pos);
    });
  })(0);
}
