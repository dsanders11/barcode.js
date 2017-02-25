// javascript (closure) port (c) 2017 David Sanders (dsanders11@ucsbalum.com)
/*
 * Copyright 2010 ZXing authors
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

goog.provide('w69b.oned.ITFWriter');
goog.require('w69b.BarcodeFormat');
goog.require('w69b.exceptions.IllegalArgumentException');
goog.require('w69b.oned.ITFReader');
goog.require('w69b.oned.OneDimensionalCodeWriter');


goog.scope(function() {
  var BarcodeFormat = w69b.BarcodeFormat;
  var IllegalArgumentException = w69b.exceptions.IllegalArgumentException;
  var ITFReader = w69b.oned.ITFReader;
  var OneDimensionalCodeWriter = w69b.oned.OneDimensionalCodeWriter;

  /**
   * This object renders a ITF code as a {@link BitMatrix}.
   * @constructor
   * @extends {OneDimensionalCodeWriter}
   * @final
   */
  w69b.oned.ITFWriter = function() { };
  var ITFWriter = w69b.oned.ITFWriter;
  goog.inherits(ITFWriter, OneDimensionalCodeWriter);
  var pro = ITFWriter.prototype;

  /** @const {!Int32Array} */
  var START_PATTERN = Int32Array.of(1, 1, 1, 1);

  /** @const {!Int32Array} */
  var END_PATTERN = Int32Array.of(3, 1, 1);

  /**
   * @override
   */
  pro.encode = function(contents, format, width, height, opt_hints) {
    if (format != BarcodeFormat.ITF) {
      throw new IllegalArgumentException("Can only encode ITF, but got " + format);
    }

    return goog.base(this, 'encode', contents, format, width, height, opt_hints);
  };

  /**
   * @override
   */
  pro.encodeBoolean = function(contents) {
    var length = contents.length;
    if (length % 2 != 0) {
      throw new IllegalArgumentException("The length of the input should be even");
    }
    if (length > 80) {
      throw new IllegalArgumentException(
          "Requested contents should be less than 80 digits long, but got " + length);
    }
    /** @type {!Array.<boolean>} */
    var result = new Array(9 + 9 * length);
    var pos = OneDimensionalCodeWriter.appendPattern(result, 0, START_PATTERN, true);
    for (let i = 0; i < length; i += 2) {
      let one = parseInt(contents.charAt(i), 10);
      let two = parseInt(contents.charAt(i + 1), 10);
      let encoding = new Int32Array(10);
      for (let j = 0; j < 5; j++) {
        encoding[2 * j] = ITFReader.PATTERNS[one][j];
        encoding[2 * j + 1] = ITFReader.PATTERNS[two][j];
      }
      pos += OneDimensionalCodeWriter.appendPattern(result, pos, encoding, true);
    }
    OneDimensionalCodeWriter.appendPattern(result, pos, END_PATTERN, true);

    return result;
  };
});
