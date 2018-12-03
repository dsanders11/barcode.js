goog.module('java.lang.StringBuilder');
goog.module.declareLegacyNamespace();

const { assert } = goog.require('goog.asserts');

/**
 * Partial implementation of Java's StringBuilder class in JavaScript.
 */
class StringBuilder {
  constructor() {
    this.string_ = '';
  }

  /**
   * @param {number} newLength new length of the string
   */
  setLength(newLength) {
    if (this.string_.length > newLength) {
      this.string_ = this.string_.slice(0, newLength);
    } else {
      for (let i=this.string_.length; i < newLength; i++) {
        this.string_ += '\u0000';
      }
    }
  }

  /**
   * @param {(string|number)} value value to append
   * @return {!StringBuilder}
   */
  append(value) {
    this.string_ += value;
    return this;
  }

  /**
   * @param {string} str
   * @param {number} offset
   * @param {number} len
   * @return {!StringBuilder}
   */
  append2(str, offset, len) {
    this.string_ += str.slice(offset, offset + len);
    return this;
  }

  /**
   * @param {number} index
   * @param {string} str
   * @return {!StringBuilder}
   */
  insert(index, str) {
    this.string_ = this.string_.slice(0, index) + str + this.string_.slice(index);

    return this;
  }

  /**
   * @param {number} index
   * @return {string}
   */
  charAt(index) {
    return this.string_.charAt(index);
  }

  /**
   * @param {number} index
   * @return {number}
   */
  codePointAt(index) {
    return this.string_.codePointAt(index);
  }

  /**
   * @param {number} index
   * @return {!StringBuilder}
   */
  deleteCharAt(index) {
    this.string_ = this.string_.slice(0, index) + this.string_.slice(index + 1);

    return this;
  }

  /**
   * @return {number}
   */
  length() {
    return this.string_.length;
  }

  /**
   * @param {number} index
   * @param {string} char
   */
  setCharAt(index, char) {
    assert(char.length === 1);

    this.string_ = this.string_.slice(0, index) + char + this.string_.slice(index + 1);
  }

  /**
   * @override
   */
  toString() {
    return this.string_;
  }
}

exports = StringBuilder;
