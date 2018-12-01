// javascript (closure) port (c) 2017 David Sanders (dsanders11@ucsbalum.com)
/*
 * Copyright 2015 ZXing authors
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

goog.provide('w69b.oned.Code93Writer');
goog.require('java.lang.IllegalArgumentException');
goog.require('w69b.BarcodeFormat');
goog.require('w69b.oned.Code93Reader');
goog.require('w69b.oned.OneDimensionalCodeWriter');


goog.scope(function() {
  const IllegalArgumentException = java.lang.IllegalArgumentException;
  const BarcodeFormat = w69b.BarcodeFormat;
  const Code93Reader = w69b.oned.Code93Reader;
  const OneDimensionalCodeWriter = w69b.oned.OneDimensionalCodeWriter;

  /**
   * This object renders a CODE93 code as a BitMatrix
   * @constructor
   * @extends {OneDimensionalCodeWriter}
   * @final
   */
  w69b.oned.Code93Writer = function() { };
  const Code93Writer = w69b.oned.Code93Writer;
  goog.inherits(Code93Writer, OneDimensionalCodeWriter);
  const pro = Code93Writer.prototype;

  /**
   * @override
   */
  pro.encode = function(contents, format, width, height, opt_hints) {
    if (format !== BarcodeFormat.CODE_93) {
      throw new IllegalArgumentException("Can only encode CODE_93, but got " + format);
    }

    return goog.base(this, 'encode', contents, format, width, height, opt_hints);
  };

  /**
   * @override
   */
  pro.encodeBoolean = function(contents) {
    var length = contents.length;
    if (length > 80) {
      throw new IllegalArgumentException(
        "Requested contents should be less than 80 digits long, but got " + length);
    }
    //each character is encoded by 9 of 0/1's
    var widths = new Int32Array(9);

    //length of code + 2 start/stop characters + 2 checksums, each of 9 bits, plus a termination bar
    var codeWidth = (contents.length + 2 + 2) * 9 + 1;

    //start character (*)
    toIntArray(Code93Reader.CHARACTER_ENCODINGS[47], widths);

    /** @type {!Array.<boolean>} */
    var result = new Array(codeWidth);
    var pos = Code93Writer.appendPattern(result, 0, widths);

    for (let i = 0; i < length; i++) {
      let indexInString = Code93Reader.ALPHABET_STRING.indexOf(contents.charAt(i));
      toIntArray(Code93Reader.CHARACTER_ENCODINGS[indexInString], widths);
      pos += Code93Writer.appendPattern(result, pos, widths);
    }

    //add two checksums
    var check1 = Code93Writer.computeChecksumIndex_(contents, 20);
    toIntArray(Code93Reader.CHARACTER_ENCODINGS[check1], widths);
    pos += Code93Writer.appendPattern(result, pos, widths);

    //append the contents to reflect the first checksum added
    contents += Code93Reader.ALPHABET_STRING.charAt(check1);

    var check2 = Code93Writer.computeChecksumIndex_(contents, 15);
    toIntArray(Code93Reader.CHARACTER_ENCODINGS[check2], widths);
    pos += Code93Writer.appendPattern(result, pos, widths);

    //end character (*)
    toIntArray(Code93Reader.CHARACTER_ENCODINGS[47], widths);
    pos += Code93Writer.appendPattern(result, pos, widths);

    //termination bar (single black bar)
    result[pos] = true;

    return result;
  };

  /**
   * @param {number} a
   * @param {!Int32Array} toReturn
   * @private
   */
  function toIntArray(a, toReturn) {
    for (let i = 0; i < 9; i++) {
      let temp = a & (1 << (8 - i));
      toReturn[i] = temp === 0 ? 0 : 1;
    }
  }

  /**
   * @param {!Array.<boolean>} target output to append to
   * @param {number} pos start position
   * @param {!Int32Array} pattern pattern to append
   * @return {number}
   * @private
   */
  Code93Writer.appendPattern = function(target, pos, pattern) {
    for (let bit of pattern) {
      target[pos++] = bit !== 0;
    }
    return 9;
  };

  /**
   * @param {string} contents
   * @param {number} maxWeight
   * @return {number}
   * @private
   */
  Code93Writer.computeChecksumIndex_ = function(contents, maxWeight) {
    var weight = 1;
    var total = 0;

    for (let i = contents.length - 1; i >= 0; i--) {
      let indexInString = Code93Reader.ALPHABET_STRING.indexOf(contents.charAt(i));
      total += indexInString * weight;
      if (++weight > maxWeight) {
        weight = 1;
      }
    }
    return total % 47;
  };
});
