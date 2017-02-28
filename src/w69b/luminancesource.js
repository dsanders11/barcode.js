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

goog.provide('w69b.LuminanceSource');
goog.require('w69b.exceptions.UnsupportedOperationException');


goog.scope(function() {
  var UnsupportedOperationException = w69b.exceptions.UnsupportedOperationException;

  /**
   * The purpose of this class hierarchy is to abstract different bitmap
   * implementations across platforms into a standard interface for requesting
   * greyscale luminance values. The interface only provides immutable methods;
   * therefore crop and rotation create copies. This is to ensure that one
   * Reader does not modify the original luminance source and leave it in an
   * unknown state for other Readers in the chain.
   *
   * @constructor
   * @param {number} width
   * @param {number} height
   * @abstract
   */
  w69b.LuminanceSource = function(width, height) {
    /**
     * @private
     * @const {number}
     */
    this.width_ = width;

    /**
     * @private
     * @const {number}
     */
    this.height_ = height;
  };
  var LuminanceSource = w69b.LuminanceSource;

  /**
   * Fetches one row of luminance data from the underlying platform's bitmap.
   * Values range from 0 (black) to 255 (white). Because Java does not have an
   * unsigned byte type, callers will have to bitwise and with 0xff for each
   * value. It is preferable for implementations of this method to only fetch
   * this row rather than the whole image, since no 2D Readers may be installed
   * and getMatrix() may never be called.
   *
   * @param {number} y The row to fetch, which must be in [0,getHeight())
   * @param {?Int8Array} row An optional preallocated array. If null or too
   *                         small, it will be ignored. Always use the returned
   *                         object, and ignore the length of the array.
   * @return {Int8Array} An array containing the luminance data.
   * @abstract
   */
  LuminanceSource.prototype.getRow = function(y, row) { };

  /**
   * Fetches luminance data for the underlying bitmap. Values should be fetched
   * using: {@code int luminance = array[y * width + x] & 0xff}
   *
   * @return {Int8Array} A row-major 2D array of luminance values. Do not use
   *                     result.length as it may be larger than width * height
   *                     bytes on some platforms. Do not modify the contents of
   *                     the result.
   * @abstract
   */
  LuminanceSource.prototype.getMatrix = function() { };

  /**
   * @return {number} The width of the bitmap.
   * @final
   */
  LuminanceSource.prototype.getWidth = function() {
    return this.width_;
  };

  /**
   * @return {number} The height of the bitmap.
   * @final
   */
  LuminanceSource.prototype.getHeight = function() {
    return this.height_;
  };

  /**
   * @return {boolean} Whether this subclass supports cropping.
   */
  LuminanceSource.prototype.isCropSupported = function() {
    return false;
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
   * @return {LuminanceSource} A cropped version of this object.
   */
  LuminanceSource.prototype.crop = function(left, top, width, height) {
    throw new UnsupportedOperationException(
      "This luminance source does not support cropping.");
  };

  /**
   * @return {boolean} Whether this subclass supports counter-clockwise rotation
   */
  LuminanceSource.prototype.isRotateSupported = function() {
    return false;
  };

  /**
   * Returns a new object with rotated image data by 90 degrees
   * counterclockwise. Only callable if {@link #isRotateSupported()} is true.
   *
   * @return {LuminanceSource} A rotated version of this object.
   */
  LuminanceSource.prototype.rotateCounterClockwise = function() {
    throw new UnsupportedOperationException(
      "This luminance source does not support rotation by 90 degrees.");
  };

  /**
   * Returns a new object with rotated image data by 45 degrees
   * counterclockwise. Only callable if {@link #isRotateSupported()} is true.
   *
   * @return {LuminanceSource} A rotated version of this object.
   */
  LuminanceSource.prototype.rotateCounterClockwise45 = function() {
    throw new UnsupportedOperationException(
      "This luminance source does not support rotation by 45 degrees.");
  };

  /**
   * @override
   * @final
   */
  LuminanceSource.prototype.toString = function() {
    var row = new Int8Array(this.width_);
    var result = '';
    for (let y = 0; y < this.height_; y++) {
      row = this.getRow(y, row);
      for (let x = 0; x < this.width_; x++) {
        let luminance = row[x] & 0xFF;
        let c;
        if (luminance < 0x40) {
          c = '#';
        } else if (luminance < 0x80) {
          c = '+';
        } else if (luminance < 0xC0) {
          c = '.';
        } else {
          c = ' ';
        }
        result += c;
      }
      result += '\n';
    }
    return result;
  };
});
