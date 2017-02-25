goog.provide('w69b.exceptions.ArithmeticException');
goog.require('goog.debug.Error');

goog.scope(function() {
  /**
   * Thrown when an exceptional arithmetic condition has occurred. For example,
   * an integer "divide by zero" throws an instance of this class.
   * @constructor
   * @param {string=} opt_msg message.
   * @extends {goog.debug.Error}
   */
  w69b.exceptions.ArithmeticException = function(opt_msg) {
    goog.base(this, opt_msg);
  };
  goog.inherits(w69b.exceptions.ArithmeticException, goog.debug.Error);
});
