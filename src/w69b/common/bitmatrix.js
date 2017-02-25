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
goog.require('w69b.common.BitArray');
goog.require('w69b.exceptions.IllegalArgumentException');

goog.scope(function() {
  var IllegalArgumentException = w69b.exceptions.IllegalArgumentException;
  var BitArray = w69b.common.BitArray;

  /**
   * @param {number} width width.
   * @param {number=} opt_height height defaults to width.
   * @param {number=} opt_rowSize
   * @param {Int32Array=} opt_bits
   * @constructor
   */
  w69b.common.BitMatrix = function(width, opt_height, opt_rowSize, opt_bits) {
    var height = goog.isDef(opt_height) ? opt_height : width;
    if (width < 1 || height < 1) {
      throw new IllegalArgumentException("Both dimensions must be greater than 0");
    }
    this.width = width;
    this.height = height;
    if (opt_rowSize) {
      this.rowSize = opt_rowSize;
    } else {
      var rowSize = width >> 5;
      if ((width & 0x1f) !== 0) {
        rowSize++;
      }
      this.rowSize = rowSize;
    }
    this.bits = opt_bits ? opt_bits : new Int32Array(rowSize * height);
  };

  var BitMatrix = w69b.common.BitMatrix;
  var pro = BitMatrix.prototype;

  /**
   * @param {number} x x pos.
   * @param {number} y y pos.
   * @return {boolean} bit at given position.
   */
  pro.get = function(x, y) {
    goog.asserts.assert(Number.isInteger(x));
    goog.asserts.assert(Number.isInteger(y));

    var offset = y * this.rowSize + (x >> 5);
    return ((this.bits[offset] >> (x & 0x1f)) & 1) !== 0;
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
   * Unsets bit at given position.
   * @param {number} x x pos.
   * @param {number} y y pos.
   */
  pro.unset = function(x, y) {
    goog.asserts.assert(Number.isInteger(x));
    goog.asserts.assert(Number.isInteger(y));

    var offset = y * this.rowSize + (x >> 5);
    this.bits[offset] &= ~(1 << (x & 0x1f));
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
   * Exclusive-or (XOR): Flip the bit in this {@code BitMatrix} if the
   * corresponding mask bit is set.
   *
   * @param {BitMatrix} mask XOR mask
   */
  pro.xor = function(mask) {
    if (this.width !== mask.getWidth() || this.height !== mask.getHeight()
        || this.rowSize !== mask.getRowSize()) {
      throw new IllegalArgumentException("input matrix dimensions do not match");
    }
    var rowArray = new BitArray((this.width >> 5) + 1);
    for (let y = 0; y < this.height; y++) {
      let offset = y * this.rowSize;
      let row = mask.getRow(y, rowArray).getBitArray();
      for (let x = 0; x < this.rowSize; x++) {
        this.bits[offset + x] ^= row[x];
      }
    }
  };

  /**
   * Clears all bits (sets to false).
   */
  pro.clear = function() {
    this.bits.fill(0);
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
    for (let y = top; y < bottom; y++) {
      var offset = y * this.rowSize;
      for (let x = left; x < right; x++) {
        this.bits[offset + (x >> 5)] |= 1 << (x & 0x1f);
      }
    }
  };

  /**
   * A fast method to retrieve one row of data from the matrix as a BitArray.
   *
   * @param {number} y The row to retrieve
   * @param {BitArray} row An optional caller-allocated BitArray, will be
   *                       allocated if null or too small
   * @return {!BitArray} The resulting BitArray - this reference should always
   *                     be used even when passing your own row
   */
  pro.getRow = function(y, row) {
    if (row === null || row.getSize() < this.width) {
      row = new BitArray(this.width);
    } else {
      row.clear();
    }
    var offset = y * this.rowSize;
    for (let x = 0; x < this.rowSize; x++) {
      row.setBulk(x * 32, this.bits[offset + x]);
    }
    return row;
  };

  /**
   * @param {number} y row to set
   * @param {BitArray} row {@link BitArray} to copy from
   * @suppress {checkTypes}
   */
  pro.setRow = function(y, row) {
    this.bits.set(row.getBitArray().slice(0, this.rowSize), y * this.rowSize);
  };

  /**
   * Modifies this {@code BitMatrix} to represent the same but rotated 180 degrees
   */
  pro.rotate180 = function() {
    var width = this.getWidth();
    var height = this.getHeight();
    var topRow = new BitArray(width);
    var bottomRow = new BitArray(width);
    for (let i = 0; i < (height + 1) >> 1; i++) {
      topRow = this.getRow(i, topRow);
      bottomRow = this.getRow(height - 1 - i, bottomRow);
      topRow.reverse();
      bottomRow.reverse();
      this.setRow(i, bottomRow);
      this.setRow(height - 1 - i, topRow);
    }
  };

  /**
   * This is useful in detecting the enclosing rectangle of a 'pure' barcode.
   *
   * @return {Int32Array} {@code left,top,width,height} enclosing rectangle of all 1 bits, or null if it is all white
   */
  pro.getEnclosingRectangle = function() {
    var left = this.width;
    var top = this.height;
    var right = -1;
    var bottom = -1;

    for (let y = 0; y < this.height; y++) {
      for (let x32 = 0; x32 < this.rowSize; x32++) {
        let theBits = this.bits[y * this.rowSize + x32];
        if (theBits !== 0) {
          if (y < top) {
            top = y;
          }
          if (y > bottom) {
            bottom = y;
          }
          if (x32 * 32 < left) {
            let bit = 0;
            while ((theBits << (31 - bit)) === 0) {
              bit++;
            }
            if ((x32 * 32 + bit) < left) {
              left = x32 * 32 + bit;
            }
          }
          if (x32 * 32 + 31 > right) {
            let bit = 31;
            while ((theBits >> bit) === 0) {
              bit--;
            }
            if ((x32 * 32 + bit) > right) {
              right = x32 * 32 + bit;
            }
          }
        }
      }
    }

    if (right < left || bottom < top) {
      return null;
    }

    return Int32Array.of(left, top, right - left + 1, bottom - top + 1);
  };

  /**
   * This is useful in detecting a corner of a 'pure' barcode.
   *
   * @return {?Int32Array} coordinate of top-left-most 1 bit, or null if it is all white
   */
  pro.getTopLeftOnBit = function() {
    var bitsOffset = 0;
    while (bitsOffset < this.bits.length && this.bits[bitsOffset] === 0) {
      bitsOffset++;
    }
    if (bitsOffset === this.bits.length) {
      return null;
    }
    var y = Math.floor(bitsOffset / this.rowSize);
    var x = (bitsOffset % this.rowSize) * 32;

    var theBits = this.bits[bitsOffset];
    var bit = 0;
    while ((theBits << (31 - bit)) === 0) {
      bit++;
    }
    x += bit;
    return Int32Array.of(x, y);
  };

  /**
   * @return {?Int32Array} coordinate of bottom-right-most 1 bit, or null if it is all white
   */
  pro.getBottomRightOnBit = function() {
    var bitsOffset = this.bits.length - 1;
    while (bitsOffset >= 0 && this.bits[bitsOffset] === 0) {
      bitsOffset--;
    }
    if (bitsOffset < 0) {
      return null;
    }

    var y = Math.floor(bitsOffset / this.rowSize);
    var x = (bitsOffset % this.rowSize) * 32;

    var theBits = this.bits[bitsOffset];
    var bit = 31;
    while ((theBits >>> bit) === 0) {
      bit--;
    }
    x += bit;

    return Int32Array.of(x, y);
  };

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
   * @return {number} The row size of the matrix
   */
  pro.getRowSize = function() {
    return this.rowSize;
  };

  /**
   * @override
   */
  pro.toString = function() {
    var result = [];
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        result.push(this.get(x, y) ? 'X ' : '  ');
      }
      result.push('\n');
    }
    return result.join('');
  };

  /**
   * @return {!BitMatrix} cloned matrix
   * @suppress {checkTypes}
   */
  pro.clone = function() {
    return new BitMatrix(this.width, this.height, this.rowSize, this.bits.slice());
  };
});
