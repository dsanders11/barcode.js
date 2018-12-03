goog.module('java.lang.Character');
goog.module.declareLegacyNamespace();

const { assert } = goog.require('goog.asserts');

class Character {
  /**
   * @param {string} value
   */
  constructor(value) {
    this.value_ = value;
  }

  /**
   * @param {string} ch
   * @param {number} radix
   * @return {number}
   */
  static digit(ch, radix) {
    assert(ch.length === 1);

    return parseInt(ch, radix);
  }
}

/** @const {number} */
Character.MAX_RADIX = 36;
/** @const {number} */
Character.MIN_RADIX = 2;

exports = Character;
