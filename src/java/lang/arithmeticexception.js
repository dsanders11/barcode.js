goog.module('java.lang.ArithmeticException');
goog.module.declareLegacyNamespace();

const GoogDebugError = goog.require('goog.debug.Error');

/**
 * Thrown when an exceptional arithmetic condition has occurred. For example,
 * an integer "divide by zero" throws an instance of this class.
 */
class ArithmeticException extends GoogDebugError {
  /**
   * @param {string=} opt_msg message.
   */
  constructor(opt_msg) {
    super(opt_msg);
  }
}

exports = ArithmeticException;
