goog.module('w69b.InvalidCharsetException');
goog.module.declareLegacyNamespace();

const GoogDebugError = goog.require('goog.debug.Error');

class InvalidCharsetException extends GoogDebugError {
  /**
   * @param {string=} opt_msg message.
   */
  constructor(opt_msg) {
    super(opt_msg || 'InvalidCharset');
  }
}

exports = InvalidCharsetException;
