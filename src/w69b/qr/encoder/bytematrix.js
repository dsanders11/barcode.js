// javascript (closure) port (c) 2013 Manuel Braun (mb@w69b.com)
/*
 * Copyright 2008 ZXing authors
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

goog.provide('w69b.qr.encoder.ByteMatrix');

/**
 * A class which wraps a 2D array of bytes. The default usage is signed.
 * If you want to use it as a
 * unsigned container, it's up to you to do byteValue & 0xff at each location.
 *
 * JAVAPORT: The original code was a 2D array of ints, but since it only ever
 * gets assigned
 * -1, 0, and 1, I'm going to use less memory and go with bytes.
 *
 * @author dswitkin@google.com (Daniel Switkin)
 * @author mb@w69b.com (Manuel Braun) - ported to js.
 */
goog.scope(function() {

  /**
   * Row (y) first byte matrix.
   * @param {number} width width.
   * @param {number} height height.
   * @constructor
   */
  w69b.qr.encoder.ByteMatrix = function(width, height) {
    /**
     * @type {number}
     * @private
     */
    this.width_ = width;
    /**
     * @type {number}
     * @private
     */
    this.height_ = height;
    this.bytes_ = new Int8Array(width * height);
  };
  var pro = w69b.qr.encoder.ByteMatrix.prototype;

  /**
   * @return {Int8Array}
   */
  pro.getBytes = function() {
    return this.bytes_;
  };

  /**
   * @return {number}
   */
  pro.getHeight = function() {
    return this.height_;
  };

  /**
   * @return {number}
   */
  pro.getWidth = function() {
    return this.width_;
  };

  /**
   * @param {number} x
   * @param {number} y
   * @return {number}
   */
  pro.get = function(x, y) {
    return this.bytes_[this.width_ * y + x];
  };

  /**
   * @param {number} x
   * @param {number} y
   * @param {(number|boolean)} value
   */
  pro.set = function(x, y, value) {
    if (typeof value == 'boolean') {
      value = value ? 1 : 0;
    }

    this.bytes_[this.width_ * y + x] = value;
  };

  /**
   * @param {number} value
   */
  pro.clear = function(value) {
    for (let i = 0; i < this.bytes_.length; ++i) {
      this.bytes_[i] = value;
    }
  };

  /**
   * @override
   */
  pro.toString = function() {
    var result = [];
    for (let y = 0; y < this.height_; ++y) {
      for (let x = 0; x < this.width_; ++x) {
        switch (this.get(x, y)) {
          case 0:
            result.push(' 0');
            break;
          case 1:
            result.push(' 1');
            break;
          default:
            result.push('  ');
            break;
        }
      }
      result.push('\n');
    }
    return result.join('');
  };
});
