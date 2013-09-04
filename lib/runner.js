

module.exports = runner;

/**
 * Run through the sequence of functions
 *
 * @param  {Function} next
 * @public
 */
function runner (fns, context, next) {
  var len = fns.length;

  (function run(pos) {
    if (pos < len) {
      fns[pos].call(context, function (err) {
        if (err) return next(err);
        run(++pos);
      });
    }
  })(0);
};
