/**
 * @fileoverview
 * @suppress {duplicate}
 */

goog.provide('java.lang.ArithmeticException');
goog.require('goog.debug.Error');

goog.scope(function() {
  /**
   * Thrown when an exceptional arithmetic condition has occurred. For example,
   * an integer "divide by zero" throws an instance of this class.
   * @constructor
   * @param {string=} opt_msg message.
   * @extends {goog.debug.Error}
   */
   java.lang.ArithmeticException = function(opt_msg) {
    java.lang.ArithmeticException.base(this, 'constructor', opt_msg);
  };
  goog.inherits(java.lang.ArithmeticException, goog.debug.Error);
});
