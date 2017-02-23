goog.provide('w69b.exceptions.IllegalArgumentException');
goog.require('goog.debug.Error');

goog.scope(function() {
  /**
   * Thrown to indicate that a method has been passed an illegal or
   * inappropriate argument.
   * @constructor
   * @param {string=} opt_msg message.
   * @extends {goog.debug.Error}
   */
  w69b.exceptions.IllegalArgumentException = function(opt_msg) {
    goog.base(this, opt_msg);
  };
  goog.inherits(w69b.exceptions.IllegalArgumentException, goog.debug.Error);
});
