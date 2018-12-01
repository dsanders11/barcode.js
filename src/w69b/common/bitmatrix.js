// javascript (closure) port (c) 2013 Manuel Braun (mb@w69b.com)
// javascript port (c) 2011 Lazar Laszlo (lazarsoft@gmail.com)
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
goog.require('java.lang.IllegalArgumentException');
goog.require('w69b.common.BitArray');

goog.scope(function() {
  const IllegalArgumentException = java.lang.IllegalArgumentException;
  const BitArray = w69b.common.BitArray;

  /**
   * @param {number} width width.
   * @param {number=} opt_height height defaults to width.
   * @param {number=} opt_rowSize
   * @param {!Int32Array=} opt_bits
   * @constructor
   */
  w69b.common.BitMatrix = function(width, opt_height, opt_rowSize, opt_bits) {
    const height = goog.isDef(opt_height) ? opt_height : width;
    if (width < 1 || height < 1) {
      throw new IllegalArgumentException("Both dimensions must be greater than 0");
    }
    this.width = width;
    this.height = height;
    if (opt_rowSize) {
      this.rowSize = opt_rowSize;
    } else {
      let rowSize = width >> 5;
      if ((width & 0x1f) !== 0) {
        rowSize++;
      }
      this.rowSize = rowSize;
    }
    this.bits = opt_bits ? opt_bits : new Int32Array(this.rowSize * height);
  };

  const BitMatrix = w69b.common.BitMatrix;
  const pro = BitMatrix.prototype;

  /**
   * @param {string} stringRepresentation
   * @param {string} setString
   * @param {string} unsetString
   * @return {!BitMatrix}
   */
  BitMatrix.parse = function(stringRepresentation, setString, unsetString) {
    if (stringRepresentation === null) {
      throw new IllegalArgumentException();
    }

    /** @type {!Array.<boolean>} */
    const bits = new Array(stringRepresentation.length);
    let bitsPos = 0;
    let rowStartPos = 0;
    let rowLength = -1;
    let nRows = 0;
    let pos = 0;
    while (pos < stringRepresentation.length) {
      if (stringRepresentation.charAt(pos) === '\n' ||
          stringRepresentation.charAt(pos) === '\r') {
        if (bitsPos > rowStartPos) {
          if (rowLength === -1) {
            rowLength = bitsPos - rowStartPos;
          } else if (bitsPos - rowStartPos !== rowLength) {
            throw new IllegalArgumentException("row lengths do not match");
          }
          rowStartPos = bitsPos;
          nRows++;
        }
        pos++;
      } else if (stringRepresentation.substring(pos, pos + setString.length) === setString) {
        pos += setString.length;
        bits[bitsPos] = true;
        bitsPos++;
      } else if (stringRepresentation.substring(pos, pos + unsetString.length) === unsetString) {
        pos += unsetString.length;
        bits[bitsPos] = false;
        bitsPos++;
      } else {
        throw new IllegalArgumentException(
            "illegal character encountered: " + stringRepresentation.substring(pos));
      }
    }

    // no EOL at end?
    if (bitsPos > rowStartPos) {
      if (rowLength === -1) {
        rowLength = bitsPos - rowStartPos;
      } else if (bitsPos - rowStartPos !== rowLength) {
        throw new IllegalArgumentException("row lengths do not match");
      }
      nRows++;
    }

    const matrix = new BitMatrix(rowLength, nRows);
    for (let i = 0; i < bitsPos; i++) {
      if (bits[i]) {
        matrix.set(i % rowLength, Math.floor(i / rowLength));
      }
    }
    return matrix;
  };

  /**
   * @param {number} x x pos.
   * @param {number} y y pos.
   * @return {boolean} bit at given position.
   */
  pro.get = function(x, y) {
    goog.asserts.assert(Number.isInteger(x));
    goog.asserts.assert(Number.isInteger(y));

    const offset = y * this.rowSize + (x >> 5);
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

    const offset = y * this.rowSize + (x >> 5);
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

    const offset = y * this.rowSize + (x >> 5);
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

    const offset = y * this.rowSize + (x >> 5);
    this.bits[offset] ^= 1 << (x & 0x1f);
  };

  /**
   * Exclusive-or (XOR): Flip the bit in this {@code BitMatrix} if the
   * corresponding mask bit is set.
   *
   * @param {!BitMatrix} mask XOR mask
   */
  pro.xor = function(mask) {
    if (this.width !== mask.getWidth() || this.height !== mask.getHeight()
        || this.rowSize !== mask.getRowSize()) {
      throw new IllegalArgumentException("input matrix dimensions do not match");
    }
    const rowArray = new BitArray((this.width >> 5) + 1);
    for (let y = 0; y < this.height; y++) {
      const offset = y * this.rowSize;
      const row = mask.getRow(y, rowArray).getBitArray();
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
   * @throws {!IllegalArgumentException}
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
    const right = left + width;
    const bottom = top + height;
    if (bottom > this.height || right > this.width) {
      throw new IllegalArgumentException("The region must fit inside the matrix");
    }
    for (let y = top; y < bottom; y++) {
      const offset = y * this.rowSize;
      for (let x = left; x < right; x++) {
        this.bits[offset + (x >> 5)] |= 1 << (x & 0x1f);
      }
    }
  };

  /**
   * A fast method to retrieve one row of data from the matrix as a BitArray.
   *
   * @param {number} y The row to retrieve
   * @param {!BitArray} row An optional caller-allocated BitArray, will be
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
    const offset = y * this.rowSize;
    for (let x = 0; x < this.rowSize; x++) {
      row.setBulk(x * 32, this.bits[offset + x]);
    }
    return row;
  };

  /**
   * @param {number} y row to set
   * @param {!BitArray} row {@link BitArray} to copy from
   */
  pro.setRow = function(y, row) {
    this.bits.set(row.getBitArray().slice(0, this.rowSize), y * this.rowSize);
  };

  /**
   * Modifies this {@code BitMatrix} to represent the same but rotated 180 degrees
   */
  pro.rotate180 = function() {
    const width = this.getWidth();
    const height = this.getHeight();
    let topRow = new BitArray(width);
    let bottomRow = new BitArray(width);
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
   * @return {?Int32Array} {@code left,top,width,height} enclosing rectangle of all 1 bits, or null if it is all white
   */
  pro.getEnclosingRectangle = function() {
    let left = this.width;
    let top = this.height;
    let right = -1;
    let bottom = -1;

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
    let bitsOffset = 0;
    while (bitsOffset < this.bits.length && this.bits[bitsOffset] === 0) {
      bitsOffset++;
    }
    if (bitsOffset === this.bits.length) {
      return null;
    }
    const y = Math.floor(bitsOffset / this.rowSize);
    let x = (bitsOffset % this.rowSize) * 32;

    const theBits = this.bits[bitsOffset];
    let bit = 0;
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
    let bitsOffset = this.bits.length - 1;
    while (bitsOffset >= 0 && this.bits[bitsOffset] === 0) {
      bitsOffset--;
    }
    if (bitsOffset < 0) {
      return null;
    }

    const y = Math.floor(bitsOffset / this.rowSize);
    let x = (bitsOffset % this.rowSize) * 32;

    const theBits = this.bits[bitsOffset];
    let bit = 31;
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
   * @param {string=} setString representation of a set bit
   * @param {string=} unsetString representation of an unset bit
   * @return {string} representation of entire matrix utilizing given strings
   */
  pro.toString = function(setString = 'X ', unsetString = '  ') {
    const result = [];
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        result.push(this.get(x, y) ? setString : unsetString);
      }
      result.push('\n');
    }
    return result.join('');
  };

  /**
   * @return {!BitMatrix} cloned matrix
   */
  pro.clone = function() {
    return new BitMatrix(this.width, this.height, this.rowSize, this.bits.slice());
  };
});
