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

goog.module('w69b.ImageDataLuminanceSource');
goog.module.declareLegacyNamespace();

const IllegalArgumentException = goog.require('java.lang.IllegalArgumentException');
const LuminanceSource = goog.require('w69b.LuminanceSource');
const { assert } = goog.require('goog.asserts');

/**
 * Implementation of LuminanceSource for interacting with ImageData from a
 * canvas. Based on RGBLuminanceSource in ZXing.
 *
 * @final
 */
class ImageDataLuminanceSource extends LuminanceSource {
  /**
   * @param {!ImageData|!Int8Array} image
   * @param {?Int8Array=} opt_array
   * @param {number=} opt_left
   * @param {number=} opt_top
   * @param {number=} opt_width
   * @param {number=} opt_height
   */
  constructor(image, opt_array, opt_left, opt_top, opt_width, opt_height) {
    const sourceWidth = image.width;
    const sourceHeight = image.height;
    const left = opt_left ? opt_left : 0;
    const top = opt_top ? opt_top: 0;
    const width = opt_width ? opt_width : image.width;
    const height = opt_height ? opt_height : image.height;

    super(width, height);

    if (left + width > sourceWidth || top + height > sourceHeight) {
      throw new IllegalArgumentException(
        "Crop rectangle does not fit within image data.");
    }

    if (image instanceof ImageData) {
      // IMPORTANT NOTE - We get an automatic conversion from unsigned to
      // signed here because ImageData.data is a Uint8ClampedArray (unsigned)
      // and row is an Int8Array (signed) and simply assigning converts it
      if (!opt_array) {
        this.luminances_ = new Int8Array(sourceWidth*sourceHeight);
      } else {
        if (opt_array.length !== sourceWidth*sourceHeight) {
          throw new IllegalArgumentException("Provided array is wrong size.");
        }

        this.luminances_ = opt_array;
      }

      // ImageData may have already been made grayscale using WebGL
      if (image.grayscale_) {
        // Move the RGBA data to a single-byte representation
        const data = image.data;
        const luminances = this.luminances_;
        for (let i = 0, dlength = data.length; i < dlength; i += 4) {
          luminances[i/4] = data[i];
        }
      } else {
        const data = image.data;
        const luminances = this.luminances_;
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
  }

  /**
   * @override
   */
  getRow(y, row) {
    assert(Number.isInteger(y));

    if (y < 0 || y >= this.getHeight()) {
      throw new IllegalArgumentException(
        "Requested row is outside the image: " + y);
    }

    const width = this.getWidth();
    const offset = (y + this.top_) * this.dataWidth_ + this.left_;
    const slice = this.luminances_.slice(offset, offset + width);

    if (row === null || row.length < width) {
      // We've already created our new array with the slice operation, so
      // just return it now instead of creating a duplicate yet again
      return slice;
    }

    // Fill the existing array passed in with the sliced values
    row.set(slice);

    return row;
  }

  /**
   * @override
   */
  getMatrix() {
    const width = this.getWidth();
    const height = this.getHeight();

    // If the caller asks for the entire underlying image, save the copy and
    // give them the original data. The docs specifically warn that
    // result.length must be ignored.
    if (width === this.dataWidth_ && height === this.dataHeight_) {
      return this.luminances_;
    }

    const area = width * height;
    const matrix = new Int8Array(area);
    let inputOffset = this.top_ * this.dataWidth_ + this.left_;

    // If the width matches the full width of the underlying data,
    // perform a single copy.
    if (width === this.dataWidth_) {
      matrix.set(this.luminances_.slice(inputOffset, inputOffset + area));
      return matrix;
    }

    // Otherwise copy one cropped row at a time.
    for (let y = 0; y < height; y++) {
      const outputOffset = y * width;
      const slice = this.luminances_.slice(inputOffset, inputOffset + width);
      matrix.set(slice, outputOffset);
      inputOffset += this.dataWidth_;
    }

    return matrix;
  }

  /**
   * @override
   */
  isCropSupported() {
    return true;
  }

  /**
   * @override
   */
  crop(left, top, width, height) {
    assert(Number.isInteger(left));
    assert(Number.isInteger(top));
    assert(Number.isInteger(width));
    assert(Number.isInteger(height));

    const luminances = this.luminances_;
    luminances.width = this.dataWidth_;
    luminances.height = this.dataWidth_;

    return new ImageDataLuminanceSource(
      luminances, null, this.left_ + left, this.top_ + top, width, height);
  }

  /**
   * @override
   */
  isRotateSupported() {
    return false;  // TODO - Return true if ever implemented
  }

  /**
   * @override
   */
  rotateCounterClockwise() {
    // TODO - Implement - Can't use a canvas because this needs to be able to
    // run on a Web worker which doesn't have access to a canvas context
    return super.rotateCounterClockwise();
  }

  /**
   * @override
   */
  rotateCounterClockwise45() {
    // TODO - Implement - Can't use a canvas because this needs to be able to
    // run on a Web worker which doesn't have access to a canvas context
    return super.rotateCounterClockwise45();
  }
}

exports = ImageDataLuminanceSource;
