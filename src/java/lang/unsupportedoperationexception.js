goog.module('java.lang.UnsupportedOperationException');
goog.module.declareLegacyNamespace();

const GoogDebugError = goog.require('goog.debug.Error');

/**
 * Thrown to indicate that the requested operation is not supported.
 */
class UnsupportedOperationException extends GoogDebugError {
  /**
   * @param {string=} opt_msg message.
   */
  constructor(opt_msg) {
    super(opt_msg);
  }
}

exports = UnsupportedOperationException;
