/**
 * @fileoverview
 * @suppress {duplicate}
 */

goog.provide('java.lang.IllegalStateException');
goog.require('goog.debug.Error');

goog.scope(function() {
  /**
   * Signals that a method has been invoked at an illegal or inappropriate time.
   * @constructor
   * @param {string=} opt_msg message.
   * @extends {goog.debug.Error}
   */
  java.lang.IllegalStateException = function(opt_msg) {
    goog.base(this, opt_msg);
  };
  goog.inherits(java.lang.IllegalStateException, goog.debug.Error);
});
