goog.provide('w69b.IllegalStateException');
goog.require('goog.debug.Error');

goog.scope(function() {
  /**
   * Signals that a method has been invoked at an illegal or inappropriate time.
   * @constructor
   * @param {string=} opt_msg message.
   * @extends {goog.debug.Error}
   */
  w69b.IllegalStateException = function(opt_msg) {
    goog.base(this, opt_msg);
  };
  goog.inherits(w69b.IllegalStateException, goog.debug.Error);
});