goog.module('java.lang.IllegalStateException');
goog.module.declareLegacyNamespace();

const GoogDebugError = goog.require('goog.debug.Error');

/**
 * Signals that a method has been invoked at an illegal or inappropriate time.
 */
class IllegalStateException extends GoogDebugError {
  /**
   * @param {string=} opt_msg message.
   */
  constructor(opt_msg) {
    super(opt_msg);
  }
}

exports = IllegalStateException;
