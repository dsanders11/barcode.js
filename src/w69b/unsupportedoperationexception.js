goog.provide('w69b.UnsupportedOperationException');
goog.require('goog.debug.Error');

goog.scope(function() {
  /**
   * Thrown to indicate that the requested operation is not supported.
   * @constructor
   * @param {string=} opt_msg message.
   * @extends {goog.debug.Error}
   */
  w69b.UnsupportedOperationException = function(opt_msg) {
    goog.base(this, opt_msg);
  };
  goog.inherits(w69b.UnsupportedOperationException, goog.debug.Error);
});
