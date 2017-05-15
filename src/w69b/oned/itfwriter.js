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
goog.require('java.lang.IllegalArgumentException');
goog.require('java.lang.Integer');
goog.require('w69b.BarcodeFormat');
goog.require('w69b.oned.ITFReader');
goog.require('w69b.oned.OneDimensionalCodeWriter');


goog.scope(function() {
  const IllegalArgumentException = java.lang.IllegalArgumentException;
  const Integer = java.lang.Integer;
  const BarcodeFormat = w69b.BarcodeFormat;
  const ITFReader = w69b.oned.ITFReader;
  const OneDimensionalCodeWriter = w69b.oned.OneDimensionalCodeWriter;

  /**
   * This object renders a ITF code as a {@link BitMatrix}.
   * @constructor
   * @extends {OneDimensionalCodeWriter}
   * @final
   */
  w69b.oned.ITFWriter = function() { };
  const ITFWriter = w69b.oned.ITFWriter;
  goog.inherits(ITFWriter, OneDimensionalCodeWriter);
  const pro = ITFWriter.prototype;

  const START_PATTERN = Int32Array.of(1, 1, 1, 1);
  const END_PATTERN = Int32Array.of(3, 1, 1);

  /**
   * @override
   */
  pro.encode = function(contents, format, width, height, opt_hints) {
    if (format !== BarcodeFormat.ITF) {
      throw new IllegalArgumentException("Can only encode ITF, but got " + format);
    }

    return goog.base(this, 'encode', contents, format, width, height, opt_hints);
  };

  /**
   * @override
   */
  pro.encodeBoolean = function(contents) {
    var length = contents.length;
    if (length % 2 !== 0) {
      throw new IllegalArgumentException("The length of the input should be even");
    }
    if (length > 80) {
      throw new IllegalArgumentException(
          "Requested contents should be less than 80 digits long, but got " + length);
    }
    /** @type {!Array.<!boolean>} */
    var result = new Array(9 + 9 * length);
    var pos = OneDimensionalCodeWriter.appendPattern(result, 0, START_PATTERN, true);
    for (let i = 0; i < length; i += 2) {
      let one = Integer.parseInt(contents.charAt(i));
      let two = Integer.parseInt(contents.charAt(i + 1));
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
