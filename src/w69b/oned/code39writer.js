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

goog.provide('w69b.oned.Code39Writer');
goog.require('java.lang.IllegalArgumentException');
goog.require('w69b.BarcodeFormat');
goog.require('w69b.oned.Code39Reader');
goog.require('w69b.oned.OneDimensionalCodeWriter');


goog.scope(function() {
  const IllegalArgumentException = java.lang.IllegalArgumentException;
  const BarcodeFormat = w69b.BarcodeFormat;
  const Code39Reader = w69b.oned.Code39Reader;
  const OneDimensionalCodeWriter = w69b.oned.OneDimensionalCodeWriter;

  /**
   * This object renders a CODE39 code as a {@link BitMatrix}.
   * @constructor
   * @extends {OneDimensionalCodeWriter}
   * @final
   */
  w69b.oned.Code39Writer = function() { };
  const Code39Writer = w69b.oned.Code39Writer;
  goog.inherits(Code39Writer, OneDimensionalCodeWriter);
  const pro = Code39Writer.prototype;

  /**
   * @override
   */
  pro.encode = function(contents, format, width, height, opt_hints) {
    if (format !== BarcodeFormat.CODE_39) {
      throw new IllegalArgumentException("Can only encode CODE_39, but got " + format);
    }

    return goog.base(this, 'encode', contents, format, width, height, opt_hints);
  };

  /**
   * @override
   */
  pro.encodeBoolean = function(contents) {
    const length = contents.length;
    if (length > 80) {
      throw new IllegalArgumentException(
        "Requested contents should be less than 80 digits long, but got " + length);
    }

    const widths = new Int32Array(9);
    let codeWidth = 24 + 1 + length;
    for (let i = 0; i < length; i++) {
      const indexInString = Code39Reader.ALPHABET_STRING.indexOf(contents.charAt(i));
      if (indexInString < 0) {
        throw new IllegalArgumentException("Bad contents: " + contents);
      }
      toIntArray(Code39Reader.CHARACTER_ENCODINGS[indexInString], widths);
      for (const width of widths) {
        codeWidth += width;
      }
    }
    /** @type {!Array.<boolean>} */
    const result = new Array(codeWidth);
    toIntArray(Code39Reader.ASTERISK_ENCODING, widths);
    let pos = OneDimensionalCodeWriter.appendPattern(result, 0, widths, true);
    const narrowWhite = Int32Array.of(1);
    pos += OneDimensionalCodeWriter.appendPattern(result, pos, narrowWhite, false);
    //append next character to byte matrix
    for (let i = 0; i < length; i++) {
      const indexInString = Code39Reader.ALPHABET_STRING.indexOf(contents.charAt(i));
      toIntArray(Code39Reader.CHARACTER_ENCODINGS[indexInString], widths);
      pos += OneDimensionalCodeWriter.appendPattern(result, pos, widths, true);
      pos += OneDimensionalCodeWriter.appendPattern(result, pos, narrowWhite, false);
    }
    toIntArray(Code39Reader.ASTERISK_ENCODING, widths);
    OneDimensionalCodeWriter.appendPattern(result, pos, widths, true);
    return result;
  };

  /**
   * @param {number} a
   * @param {!Int32Array} toReturn
   * @private
   */
  function toIntArray(a, toReturn) {
    for (let i = 0; i < 9; i++) {
      const temp = a & (1 << (8 - i));
      toReturn[i] = temp === 0 ? 1 : 2;
    }
  }
});
