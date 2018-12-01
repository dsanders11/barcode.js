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

goog.provide('w69b.oned.EAN13Writer');
goog.require('java.lang.Character');
goog.require('java.lang.IllegalArgumentException');
goog.require('w69b.BarcodeFormat');
goog.require('w69b.FormatException');
goog.require('w69b.oned.EAN13Reader');
goog.require('w69b.oned.OneDimensionalCodeWriter');
goog.require('w69b.oned.UPCEANReader');
goog.require('w69b.oned.UPCEANWriter');


goog.scope(function() {
  const Character = java.lang.Character;
  const IllegalArgumentException = java.lang.IllegalArgumentException;
  const BarcodeFormat = w69b.BarcodeFormat;
  const FormatException = w69b.FormatException;
  const EAN13Reader = w69b.oned.EAN13Reader;
  const UPCEANReader = w69b.oned.UPCEANReader;
  const UPCEANWriter = w69b.oned.UPCEANWriter;
  const appendPattern = w69b.oned.OneDimensionalCodeWriter.appendPattern;

  /**
   * This object renders an EAN13 code as a {@link BitMatrix}.
   * @constructor
   * @extends {UPCEANWriter}
   * @final
   */
  w69b.oned.EAN13Writer = function() { };
  const EAN13Writer = w69b.oned.EAN13Writer;
  goog.inherits(EAN13Writer, UPCEANWriter);
  const pro = EAN13Writer.prototype;

  const CODE_WIDTH = 3 + // start guard
      (7 * 6) + // left bars
      5 + // middle guard
      (7 * 6) + // right bars
      3; // end guard

  /**
   * @override
   */
  pro.encode = function(contents, format, width, height, opt_hints) {
    if (format !== BarcodeFormat.EAN_13) {
      throw new IllegalArgumentException("Can only encode EAN_13, but got " + format);
    }

    return goog.base(this, 'encode', contents, format, width, height, opt_hints);
  };

  /**
   * @override
   */
  pro.encodeBoolean = function(contents) {
    var length = contents.length;
    switch (length) {
      case 12:
        // No check digit present, calculate it and add it
        let check;
        try {
          check = UPCEANReader.getStandardUPCEANChecksum(contents);
        } catch (fe) {
          if (fe instanceof FormatException) {
            throw new IllegalArgumentException(fe);
          }

          throw fe;
        }
        contents += check;
        break;
      case 13:
        try {
          if (!UPCEANReader.checkStandardUPCEANChecksum(contents)) {
            throw new IllegalArgumentException("Contents do not pass checksum");
          }
        } catch (ignored) {
          if (ignored instanceof FormatException) {
            throw new IllegalArgumentException("Illegal contents");
          }

          throw ignored;
        }
        break;
      default:
        throw new IllegalArgumentException(
            "Requested contents should be 12 or 13 digits long, but got " + length);
    }


    const firstDigit = Character.digit(contents.charAt(0), 10);
    let parities = EAN13Reader.FIRST_DIGIT_ENCODINGS[firstDigit];
    /** @type {!Array.<boolean>} */
    const result = new Array(CODE_WIDTH);
    let pos = 0;

    pos += appendPattern(result, pos, UPCEANReader.START_END_PATTERN, true);

    // See EAN13Reader for a description of how the first digit & left bars are encoded
    for (let i = 1; i <= 6; i++) {
      let digit = Character.digit(contents.charAt(i), 10);
      if ((parities >> (6 - i) & 1) === 1) {
        digit += 10;
      }
      pos += appendPattern(result, pos, UPCEANReader.L_AND_G_PATTERNS[digit], false);
    }

    pos += appendPattern(result, pos, UPCEANReader.MIDDLE_PATTERN, false);

    for (let i = 7; i <= 12; i++) {
      const digit = Character.digit(contents.charAt(i), 10);
      pos += appendPattern(result, pos, UPCEANReader.L_PATTERNS[digit], true);
    }
    appendPattern(result, pos, UPCEANReader.START_END_PATTERN, true);

    return result;
  };
});
