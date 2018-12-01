// javascript (closure) port (c) 2017 David Sanders (dsanders11@ucsbalum.com)
/*
 * Copyright 2009 ZXing authors
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

goog.provide('w69b.BinaryBitmap');
goog.require('java.lang.IllegalArgumentException');
goog.require('w69b.Binarizer');
goog.require('w69b.NotFoundException');
goog.require('w69b.common.BitArray');
goog.require('w69b.common.BitMatrix');


goog.scope(function() {
  const IllegalArgumentException = java.lang.IllegalArgumentException;
  const NotFoundException = w69b.NotFoundException;
  const BitArray = w69b.common.BitArray;
  const BitMatrix = w69b.common.BitMatrix;

  /**
   * This class is the core bitmap class used by ZXing to represent 1 bit data.
   * Reader objects accept a BinaryBitmap and attempt to decode it.
   *
   * @constructor
   * @param {!w69b.Binarizer} binarizer
   * @final
   */
  w69b.BinaryBitmap = function(binarizer) {
    if (binarizer === null) {
      throw new IllegalArgumentException('Binarizer must be non-null.');
    }
    this.binarizer = binarizer;

    /**
     * @type {?BitMatrix}
     * @private
     */
    this.matrix = null;
  };
  const BinaryBitmap = w69b.BinaryBitmap;
  const pro = w69b.BinaryBitmap.prototype;

  /**
   * @return {number} width the width of the bitmap
   */
  pro.getWidth = function() {
    return this.binarizer.getWidth();
  };

  /**
   * @return {number} height the height of the bitmap
   */
  pro.getHeight = function() {
    return this.binarizer.getHeight();
  };

  /**
   * Converts one row of luminance data to 1 bit data. May actually do the
   * conversion, or return cached data. Callers should assume this method is
   * expensive and call it as seldom as possible. This method is intended for
   * decoding 1D barcodes and may choose to apply sharpening.
   *
   * @param {number} y The row to fetch, which must be in [0, bitmap height)
   * @param {!BitArray=} opt_row An optional preallocated array. If null or too
   *                             small, it will be ignored. If used, the
   *                             Binarizer will call BitArray.clear(). Always use
   *                             the returned object.
   * @return {!BitArray} The array of bits for this row (true means black).
   * @throws {!NotFoundException} if row can't be binarized
   */
  pro.getBlackRow = function(y, opt_row) {
    return this.binarizer.getBlackRow(y, opt_row);
  };

  /**
   * Converts a 2D array of luminance data to 1 bit. As above, assume this
   * method is expensive and do not call it repeatedly. This method is intended
   * for decoding 2D barcodes and may or may not apply sharpening. Therefore, a
   * row from this matrix may not be identical to one fetched using
   * getBlackRow(), so don't mix and match between them.
   *
   * @return {!BitMatrix} The 2D array of bits for the image (true means black).
   * @throws {!NotFoundException} if image can't be binarized to make a matrix
   */
  pro.getBlackMatrix = function() {
    // The matrix is created on demand the first time it is requested, then
    // cached. There are two reasons for this:
    // 1. This work will never be done if the caller only installs 1D Reader
    //    objects, or if a 1D Reader finds a barcode before the 2D Readers run.
    // 2. This work will only be done once even if the caller installs multiple
    //    2D Readers.
    if (this.matrix === null) {
      this.matrix = this.binarizer.getBlackMatrix();
    }
    return this.matrix;
  };

  /**
   * @return {boolean} Whether this bitmap can be cropped.
   */
  pro.isCropSupported = function() {
    return this.binarizer.getLuminanceSource().isCropSupported();
  };

  /**
   * Returns a new object with cropped image data. Implementations may keep a
   * reference to the original data rather than a copy. Only callable if
   * isCropSupported() is true.
   *
   * @param {number} left The left coordinate, which must be in [0,getWidth())
   * @param {number} top The top coordinate, which must be in [0,getHeight())
   * @param {number} width The width of the rectangle to crop.
   * @param {number} height The height of the rectangle to crop.
   * @return {!BinaryBitmap} A cropped version of this object.
   */
  pro.crop = function(left, top, width, height) {
    var newSource = this.binarizer.getLuminanceSource().crop(left, top, width, height);
    return new BinaryBitmap(this.binarizer.createBinarizer(newSource));
  };

  /**
   * @return {boolean} Whether this bitmap supports counter-clockwise rotation.
   */
  pro.isRotateSupported = function() {
    return this.binarizer.getLuminanceSource().isRotateSupported();
  };

  /**
   * Returns a new object with rotated image data by 90 degrees counterclockwise.
   * Only callable if {@link #isRotateSupported()} is true.
   *
   * @return {!BinaryBitmap} A rotated version of this object.
   */
  pro.rotateCounterClockwise = function() {
    var newSource = this.binarizer.getLuminanceSource().rotateCounterClockwise();
    return new BinaryBitmap(this.binarizer.createBinarizer(newSource));
  };

  /**
   * Returns a new object with rotated image data by 45 degrees counterclockwise.
   * Only callable if {@link #isRotateSupported()} is true.
   *
   * @return {!BinaryBitmap} A rotated version of this object.
   */
  pro.rotateCounterClockwise45 = function() {
    var newSource = this.binarizer.getLuminanceSource().rotateCounterClockwise45();
    return new BinaryBitmap(this.binarizer.createBinarizer(newSource));
  };

  /**
   * @override
   */
  pro.toString = function() {
    try {
      return this.getBlackMatrix().toString();
    } catch (err) {
      if (err instanceof NotFoundException) {
        return '';
      }
      throw err;
    }
  };
});
