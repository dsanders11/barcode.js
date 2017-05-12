goog.provide('w69b.StringBuilder');
goog.require('goog.asserts');


goog.scope(function() {
  /**
   * Partial implementation of Java's StringBuilder class in JavaScript.
   * @constructor
   */
  w69b.StringBuilder = function() {
    this.string_ = '';
  };
  var StringBuilder = w69b.StringBuilder;
  var pro = StringBuilder.prototype;

  /**
   * @param {number} newLength new length of the string
   */
  pro.setLength = function(newLength) {
    if (this.string_.length > newLength) {
      this.string_ = this.string_.slice(0, newLength);
    } else {
      for (let i=this.string_.length; i < newLength; i++) {
        this.string_ += '\u0000';
      }
    }
  };

  /**
   * @param {(string|number)} value value to append
   * @return {!StringBuilder}
   */
  pro.append = function(value) {
    this.string_ += value;
    return this;
  };

  /**
   * @param {string} str
   * @param {number} offset
   * @param {number} len
   * @return {!StringBuilder}
   */
  pro.append2 = function(str, offset, len) {
    this.string_ += str.slice(offset, offset + len);
    return this;
  };

  /**
   * @param {number} index
   * @param {string} str
   * @return {!StringBuilder}
   */
  pro.insert = function(index, str) {
    this.string_ = this.string_.slice(0, index) + str + this.string_.slice(index);

    return this;
  };

  /**
   * @param {number} index
   * @return {string}
   */
  pro.charAt = function(index) {
    return this.string_.charAt(index);
  };

  /**
   * @param {number} index
   * @return {number}
   */
  pro.codePointAt = function(index) {
    return this.string_.codePointAt(index);
  };

  /**
   * @param {number} index
   * @return {!StringBuilder}
   */
  pro.deleteCharAt = function(index) {
    this.string_ = this.string_.slice(0, index) + this.string_.slice(index + 1);

    return this;
  };

  /**
   * @return {number}
   */
  pro.length = function() {
    return this.string_.length;
  };

  /**
   * @param {number} index
   * @param {string} char
   */
  pro.setCharAt = function(index, char) {
    goog.asserts.assert(char.length === 1);

    this.string_ = this.string_.slice(0, index) + char + this.string_.slice(index + 1);
  };

  /**
   * @override
   */
  pro.toString = function() {
    return this.string_;
  };
});
