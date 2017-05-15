/**
 * @fileoverview
 * @suppress {duplicate}
 */

goog.provide('java.lang.Character');
goog.require('goog.asserts');


goog.scope(function() {
  /**
   * @constructor
   * @param {string} value
   */
  java.lang.Character = function(value) {
    this.value_ = value;
  };
  const Character = java.lang.Character;

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
