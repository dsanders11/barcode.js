goog.provide('w69b.ArrayList');


goog.scope(function() {
  /**
   * @constructor
   * @param {number=} opt_ignored
   * @template T
   */
  w69b.ArrayList = function(opt_ignored) {
    /** @type {!Array.<T>} */
    this.array_ = [];
  };
  const ArrayList = w69b.ArrayList;
  const pro = ArrayList.prototype;

  /**
   * @param {T} e
   */
  pro.add = function(e) {
    this.array_.push(e);
  };

  /**
   * @return {boolean}
   */
  pro.isEmpty = function() {
    return this.array_.length === 0;
  };

  /**
   * @param {!Array.<T>=} opt_a
   * @return {!Array.<T>}
   */
  pro.toArray = function(opt_a) {
    var length = this.array_.length;

    if (opt_a && opt_a.length >= length) {
      opt_a.splice(0, length, ...this.array_);

      if (opt_a.length > length) {
        opt_a[length] = null;
      }

      return opt_a;
    }

    return this.array_.slice();
  };
});
