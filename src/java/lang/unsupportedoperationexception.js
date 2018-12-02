/**
 * @fileoverview
 * @suppress {duplicate}
 */

goog.provide('java.lang.UnsupportedOperationException');
goog.require('goog.debug.Error');

goog.scope(function() {
  /**
   * Thrown to indicate that the requested operation is not supported.
   * @constructor
   * @param {string=} opt_msg message.
   * @extends {goog.debug.Error}
   */
  java.lang.UnsupportedOperationException = function(opt_msg) {
    java.lang.UnsupportedOperationException.base(this, 'constructor', opt_msg);
  };
  goog.inherits(java.lang.UnsupportedOperationException, goog.debug.Error);
});
