/**
 * @fileoverview
 * @suppress {duplicate}
 */

goog.module('java.util.ArrayList');
goog.module.declareLegacyNamespace();

/**
 * @implements {Iterable<!T>}
 * @template T
 */
class ArrayList {
  /**
   * @param {number=} opt_ignored
   */
  constructor(opt_ignored) {
    /** @type {!Array.<!T>} */
    this.array_ = [];
  }

  /**
   * @param {!T} e
   */
  add(e) {
    this.array_.push(e);
  }

  /**
   * @return {boolean}
   */
  isEmpty() {
    return this.array_.length === 0;
  }

  /**
   * @param {!Array.<!T>=} opt_a
   * @return {!Array.<!T>}
   */
  toArray(opt_a) {
    const length = this.array_.length;

    if (opt_a && opt_a.length >= length) {
      opt_a.splice(0, length, ...this.array_);

      if (opt_a.length > length) {
        opt_a[length] = null;
      }

      return opt_a;
    }

    return this.array_.slice();
  }

  [Symbol.iterator]() {
    const array = this.array_;
    let nextIndex = 0;

    return {
      next: function() {
        return nextIndex < array.length ?
          {value: array[nextIndex++], done: false} :
          {done: true};
      }
    };
  }
}

exports = ArrayList;
