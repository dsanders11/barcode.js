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

goog.provide('w69b.ImageDataLuminanceSource');
goog.require('goog.asserts');
goog.require('java.lang.IllegalArgumentException');
goog.require('w69b.LuminanceSource');


goog.scope(function() {
  const IllegalArgumentException = java.lang.IllegalArgumentException;
  const LuminanceSource = w69b.LuminanceSource;

  /**
   * Implementation of LuminanceSource for interacting with ImageData from a
   * canvas. Based on RGBLuminanceSource in ZXing.
   *
   * @constructor
   * @param {(ImageData|Int8Array)} image
   * @param {number=} opt_left
   * @param {number=} opt_top
   * @param {number=} opt_width
   * @param {number=} opt_height
   * @extends {LuminanceSource}
   * @final
   */
  w69b.ImageDataLuminanceSource = function(
      image, opt_left, opt_top, opt_width, opt_height) {
    var sourceWidth = image.width;
    var sourceHeight = image.height;
    var left = opt_left ? opt_left : 0;
    var top = opt_top ? opt_top: 0;
    var width = opt_width ? opt_width : image.width;
    var height = opt_height ? opt_height : image.height;

    goog.base(this, width, height);

    if (left + width > sourceWidth || top + height > sourceHeight) {
      throw new IllegalArgumentException(
        "Crop rectangle does not fit within image data.");
    }

    if (image instanceof ImageData) {
      // IMPORTANT NOTE - We get an automatic conversion from unsigned to
      // signed here because ImageData.data is a Uint8ClampedArray (unsigned)
      // and row is an Int8Array (signed) and simply assigning converts it
      this.luminances_ = new Int8Array(sourceWidth*sourceHeight);

      // ImageData may have already been made grayscale using WebGL
      if (image.grayscale_) {
        // Move the RGBA data to a single-byte representation
        let data = image.data;
        let luminances = this.luminances_;
        for (let i = 0, dlength = data.length; i < dlength; i += 4) {
          luminances[i/4] = data[i];
        }
      } else {
        let data = image.data;
        let luminances = this.luminances_;
        for (let i = 0, dlength = data.length; i < dlength; i += 4) {
          // Average RGB data to convert to greyscale, favoring green channel
          // NOTE - This entirely disregards the alpha channel
          luminances[i/4] = (data[i] + 2*data[i + 1] + data[i + 2]) / 4;
        }
      }
    } else {
      this.luminances_ = image;

      // Delete the hack we used to pass along the data dimensions
      delete image.width;
      delete image.height;
    }

    this.dataWidth_ = sourceWidth;
    this.dataHeight_ = sourceHeight;
    this.left_ = left;
    this.top_ = top;
  };
  const ImageDataLuminanceSource = w69b.ImageDataLuminanceSource;
  goog.inherits(ImageDataLuminanceSource, LuminanceSource);
  const pro = ImageDataLuminanceSource.prototype;

  /**
   * @override
   */
  pro.getRow = function(y, row) {
    goog.asserts.assert(Number.isInteger(y));

    if (y < 0 || y >= this.getHeight()) {
      throw new IllegalArgumentException(
        "Requested row is outside the image: " + y);
    }

    var width = this.getWidth();
    var offset = (y + this.top_) * this.dataWidth_ + this.left_;
    var slice = this.luminances_.slice(offset, offset + width);

    if (row === null || row.length < width) {
      // We've already created our new array with the slice operation, so
      // just return it now instead of creating a duplicate yet again
      return slice;
    }

    // Fill the existing array passed in with the sliced values
    row.set(slice);

    return row;
  };

  /**
   * @override
   */
  pro.getMatrix = function() {
    var width = this.getWidth();
    var height = this.getHeight();

    // If the caller asks for the entire underlying image, save the copy and
    // give them the original data. The docs specifically warn that
    // result.length must be ignored.
    if (width === this.dataWidth_ && height === this.dataHeight_) {
      return this.luminances_;
    }

    var area = width * height;
    var matrix = new Int8Array(area);
    var inputOffset = this.top_ * this.dataWidth_ + this.left_;

    // If the width matches the full width of the underlying data,
    // perform a single copy.
    if (width === this.dataWidth_) {
      matrix.set(this.luminances_.slice(inputOffset, inputOffset + area));
      return matrix;
    }

    // Otherwise copy one cropped row at a time.
    for (let y = 0; y < height; y++) {
      let outputOffset = y * width;
      let slice = this.luminances_.slice(inputOffset, inputOffset + width);
      matrix.set(slice, outputOffset);
      inputOffset += this.dataWidth_;
    }

    return matrix;
  };

  /**
   * @override
   */
  pro.isCropSupported = function() {
    return true;
  };

  /**
   * @override
   */
  pro.crop = function(left, top, width, height) {
    goog.asserts.assert(Number.isInteger(left));
    goog.asserts.assert(Number.isInteger(top));
    goog.asserts.assert(Number.isInteger(width));
    goog.asserts.assert(Number.isInteger(height));

    var luminances = this.luminances_;
    luminances.width = this.dataWidth_;
    luminances.height = this.dataWidth_;

    return new ImageDataLuminanceSource(
      luminances, this.left_ + left, this.top_ + top, width, height);
  };

  /**
   * @override
   */
  pro.isRotateSupported = function() {
    return false;  // TODO - Return true if ever implemented
  };

  /**
   * @override
   */
  pro.rotateCounterClockwise = function() {
    // TODO - Implement - Can't use a canvas because this needs to be able to
    // run on a Web worker which doesn't have access to a canvas context
    return goog.base(this, 'rotateCounterClockwise');
  };

  /**
   * @override
   */
  pro.rotateCounterClockwise45 = function() {
    // TODO - Implement - Can't use a canvas because this needs to be able to
    // run on a Web worker which doesn't have access to a canvas context
    return goog.base(this, 'rotateCounterClockwise45');
  };
});
