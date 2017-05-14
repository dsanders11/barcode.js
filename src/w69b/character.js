goog.provide('w69b.Character');
goog.require('goog.asserts');


goog.scope(function() {
  /**
   * @constructor
   * @param {string} value
   */
  w69b.Character = function(value) {
    this.value_ = value;
  };
  var Character = w69b.Character;

  /** @const {number} */
  Character.MAX_RADIX = 36;
  /** @const {number} */
  Character.MIN_RADIX = 2;

  /**
   * @param {string} ch
   * @param {number} radix
   * @return {number}
   */
  Character.digit = function(ch, radix) {
    goog.asserts.assert(ch.length === 1);

    return parseInt(ch, radix);
  };
});
