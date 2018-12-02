/**
 * @fileoverview
 * @suppress {duplicate}
 */

goog.provide('java.lang.IllegalArgumentException');
goog.require('goog.debug.Error');

goog.scope(function() {
  /**
   * Thrown to indicate that a method has been passed an illegal or
   * inappropriate argument.
   * @constructor
   * @param {(!goog.debug.Error|string)=} opt_throwable_or_msg cause or message.
   * @extends {goog.debug.Error}
   */
  java.lang.IllegalArgumentException = function(opt_throwable_or_msg) {
    let msg = opt_throwable_or_msg;

    if (opt_throwable_or_msg instanceof goog.debug.Error) {
      msg = opt_throwable_or_msg.toString();
    }

    java.lang.IllegalArgumentException.base(this, 'constructor', msg);
  };
  goog.inherits(java.lang.IllegalArgumentException, goog.debug.Error);
});
