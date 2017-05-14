goog.provide('w69b.exceptions.IllegalArgumentException');
goog.require('goog.debug.Error');

goog.scope(function() {
  /**
   * Thrown to indicate that a method has been passed an illegal or
   * inappropriate argument.
   * @constructor
   * @param {(goog.debug.Error|string)=} opt_throwable_or_msg cause or message.
   * @extends {goog.debug.Error}
   */
  w69b.exceptions.IllegalArgumentException = function(opt_throwable_or_msg) {
    var msg = opt_throwable_or_msg;

    if (opt_throwable_or_msg instanceof goog.debug.Error) {
      msg = opt_throwable_or_msg.toString();
    }

    goog.base(this, msg);
  };
  goog.inherits(w69b.exceptions.IllegalArgumentException, goog.debug.Error);
});
