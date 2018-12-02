goog.provide('w69b.InvalidCharsetException');
goog.require('goog.debug.Error');

goog.scope(function() {
  /**
   * @constructor
   * @param {string=} opt_msg message.
   * @extends {goog.debug.Error}
   */
  w69b.InvalidCharsetException = function(opt_msg) {
    w69b.InvalidCharsetException.base(this, 'constructor', opt_msg || 'InvalidCharset');
  };
  goog.inherits(w69b.InvalidCharsetException, goog.debug.Error);
});
