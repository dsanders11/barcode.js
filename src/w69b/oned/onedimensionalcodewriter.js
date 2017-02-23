// javascript (closure) port (c) 2017 David Sanders (dsanders11@ucsbalum.com)
/*
 * Copyright 2011 ZXing authors
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

goog.provide('w69b.oned.OneDimensionalCodeWriter');
goog.require('w69b.EncodeHintType');
goog.require('w69b.Writer');
goog.require('w69b.common.BitMatrix');
goog.require('w69b.exceptions.IllegalArgumentException');


goog.scope(function() {
  var EncodeHintType = w69b.EncodeHintType;
  var IllegalArgumentException = w69b.exceptions.IllegalArgumentException;
  var Writer = w69b.Writer;
  var BitMatrix = w69b.common.BitMatrix;

  /**
   * Encapsulates functionality and implementation that is common to
   * one-dimensional barcodes.
   * @constructor
   * @implements {Writer}
   * @abstract
   */
  w69b.oned.OneDimensionalCodeWriter = function() { };
  var OneDimensionalCodeWriter = w69b.oned.OneDimensionalCodeWriter;
  var pro = OneDimensionalCodeWriter.prototype;

  /**
   * @override
   */
  pro.encode = function(contents, format, width, height, opt_hints) {
    if (contents.length === 0) {
      throw new IllegalArgumentException("Found empty contents");
    }

    if (width < 0 || height < 0) {
      throw new IllegalArgumentException("Negative size is not allowed. Input: "
                                         + width + 'x' + height);
    }

    var sidesMargin = this.getDefaultMargin();
    if (opt_hints && !!opt_hints[EncodeHintType.MARGIN]) {
      sidesMargin = parseInt(opt_hints[EncodeHintType.MARGIN], 10);
    }

    var code = this.encodeBoolean(contents);
    return renderResult(code, width, height, sidesMargin);
  };

  /**
   * @param {Array.<boolean>} code
   * @param {number} width
   * @param {number} height
   * @param {number} sidesMargin
   * @return {BitMatrix} byte array of horizontal pixels (0 = white, 1 = black)
   * @private
   */
  function renderResult(code, width, height, sidesMargin) {
    var inputWidth = code.length;
    // Add quiet zone on both sides.
    var fullWidth = inputWidth + sidesMargin;
    var outputWidth = Math.max(width, fullWidth);
    var outputHeight = Math.max(1, height);

    var multiple = Math.floor(outputWidth / fullWidth);
    var leftPadding = (outputWidth - (inputWidth * multiple)) >> 1;

    var output = new BitMatrix(outputWidth, outputHeight);
    for (var inputX = 0, outputX = leftPadding; inputX < inputWidth; inputX++, outputX += multiple) {
      if (code[inputX]) {
        output.setRegion(outputX, 0, multiple, outputHeight);
      }
    }
    return output;
  }

  /**
   * @param {Array.<boolean>} target encode black/white pattern into this array
   * @param {number} pos position to start encoding at in {@code target}
   * @param {!Int32Array} pattern lengths of black/white runs to encode
   * @param {boolean} startColor starting color - false for white, true for black
   * @return {number} the number of elements added to target.
   * @protected
   * @suppress {checkTypes}
   */
  OneDimensionalCodeWriter.appendPattern = function(target, pos, pattern, startColor) {
    var color = startColor;
    var numAdded = 0;
    for (var len of pattern) {
      for (var j = 0; j < len; j++) {
        target[pos++] = color;
      }
      numAdded += len;
      color = !color; // flip color after each segment
    }
    return numAdded;
  };

  /**
   * @return {number}
   */
  pro.getDefaultMargin = function() {
    // CodaBar spec requires a side margin to be more than ten times wider than
    // arrow space. This seems like a decent idea for a default for all formats.
    return 10;
  };

  /**
   * Encode the contents to boolean array expression of one-dimensional barcode.
   * Start code and end code should be included in result, and side margins should
   * not be included.
   *
   * @param {string} contents barcode contents to encode
   * @return {Array.<boolean>} of horizontal pixels (false = white, true = black)
   * @abstract
   */
  OneDimensionalCodeWriter.prototype.encodeBoolean = function(contents) { };
});
