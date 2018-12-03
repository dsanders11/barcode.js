/**
 * @fileoverview
 * @suppress {duplicate}
 */
goog.module('java.lang.IllegalArgumentException');
goog.module.declareLegacyNamespace();

const GoogDebugError = goog.require('goog.debug.Error');

/**
 * Thrown to indicate that a method has been passed an illegal or inappropriate
 * argument.
 */
class IllegalArgumentException extends GoogDebugError {
  /**
   * @param {(!GoogDebugError|string)=} opt_throwable_or_msg cause or message.
   */
  constructor(opt_throwable_or_msg) {
    let msg = opt_throwable_or_msg;

    if (opt_throwable_or_msg instanceof GoogDebugError) {
      msg = opt_throwable_or_msg.toString();
    }

    super(msg);
  }
}

exports = IllegalArgumentException;
