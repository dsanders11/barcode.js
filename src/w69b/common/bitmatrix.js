// javascript (closure) port (c) 2013 Manuel Braun (mb@w69b.com)
/*
 Ported to JavaScript by Lazar Laszlo 2011

 lazarsoft@gmail.com, www.lazarsoft.info

 */
/*
 * Copyright 2007 ZXing authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

goog.provide('w69b.common.BitMatrix');
goog.require('goog.asserts');
goog.require('w69b.IllegalArgumentException');
goog.require('w69b.img.BitMatrixLike');

goog.scope(function() {
  var IllegalArgumentException = w69b.IllegalArgumentException;

  /**
   * @param {number} width width.
   * @param {number=} opt_height height defaults to width.
   * @constructor
   * @implements {w69b.img.BitMatrixLike}
   */
  w69b.common.BitMatrix = function(width, opt_height) {
    var height = goog.isDef(opt_height) ? opt_height : width;
    if (width < 1 || height < 1) {
      throw new IllegalArgumentException("Both dimensions must be greater than 0");
    }
    this.width = width;
    this.height = height;
    var rowSize = width >> 5;
    if ((width & 0x1f) != 0) {
      rowSize++;
    }
    this.rowSize = rowSize;
    this.bits = new Uint32Array(rowSize * height);
  };

  var BitMatrix = w69b.common.BitMatrix;
  var pro = BitMatrix.prototype;

  /**
   * @return {number} The width of the matrix.
   */
  pro.getWidth = function() {
    return this.width;
  };

  /**
   * @return {number} The height of the matrix.
   */
  pro.getHeight = function() {
    return this.height;
  };

  /**
   * @param {number} x x pos.
   * @param {number} y y pos.
   * @return {boolean} bit at given position.
   */
  pro.get = function(x, y) {
    goog.asserts.assert(Number.isInteger(x));
    goog.asserts.assert(Number.isInteger(y));

    var offset = y * this.rowSize + (x >> 5);
    return ((this.bits[offset] >> (x & 0x1f)) & 1) != 0;
  };

  /**
   * Set bit at given position.
   * @param {number} x x pos.
   * @param {number} y y pos.
   */
  pro.set = function(x, y) {
    goog.asserts.assert(Number.isInteger(x));
    goog.asserts.assert(Number.isInteger(y));

    var offset = y * this.rowSize + (x >> 5);
    this.bits[offset] |= 1 << (x & 0x1f);
  };

  /**
   * Flip bit at given position.
   * @param {number} x x pos.
   * @param {number} y y pos.
   */
  pro.flip = function(x, y) {
    goog.asserts.assert(Number.isInteger(x));
    goog.asserts.assert(Number.isInteger(y));

    var offset = y * this.rowSize + (x >> 5);
    this.bits[offset] ^= 1 << (x & 0x1f);
  };

  /**
   * Clear matrix.
   */
  pro.clear = function() {
    var max = this.bits.length;
    for (var i = 0; i < max; i++) {
      this.bits[i] = 0;
    }
  };

  /**
   * Set bits in given rectangle.
   * @param {number} left left pos.
   * @param {number} top top pos.
   * @param {number} width width.
   * @param {number} height height.
   * @throws {IllegalArgumentException}
   */
  pro.setRegion = function(left, top, width, height) {
    goog.asserts.assert(Number.isInteger(left));
    goog.asserts.assert(Number.isInteger(top));
    goog.asserts.assert(Number.isInteger(width));
    goog.asserts.assert(Number.isInteger(height));

    if (top < 0 || left < 0) {
      throw new IllegalArgumentException("Left and top must be nonnegative");
    }
    if (height < 1 || width < 1) {
      throw new IllegalArgumentException("Height and width must be at least 1");
    }
    var right = left + width;
    var bottom = top + height;
    if (bottom > this.height || right > this.width) {
      throw new IllegalArgumentException("The region must fit inside the matrix");
    }
    for (var y = top; y < bottom; y++) {
      var offset = y * this.rowSize;
      for (var x = left; x < right; x++) {
        this.bits[offset + (x >> 5)] |= 1 << (x & 0x1f);
      }
    }
  };

  /**
   * @return {string} matrix as string.
   */
  pro.toString = function() {
    var result = [];
    for (var y = 0; y < this.height; y++) {
      for (var x = 0; x < this.width; x++) {
        result.push(this.get(x, y) ? 'X ' : '  ');
      }
      result.push('\n');
    }
    return result.join('');
  };
});
