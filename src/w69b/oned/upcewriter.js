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

goog.provide('w69b.oned.UPCEWriter');
goog.require('w69b.BarcodeFormat');
goog.require('w69b.Character');
goog.require('w69b.FormatException');
goog.require('w69b.Writer');
goog.require('w69b.exceptions.IllegalArgumentException');
goog.require('w69b.oned.EAN13Reader');
goog.require('w69b.oned.OneDimensionalCodeWriter');
goog.require('w69b.oned.UPCEANReader');
goog.require('w69b.oned.UPCEANWriter');
goog.require('w69b.oned.UPCEReader');


goog.scope(function() {
  const BarcodeFormat = w69b.BarcodeFormat;
  const Character = w69b.Character;
  const FormatException = w69b.FormatException;
  const Writer = w69b.Writer;
  const IllegalArgumentException = w69b.exceptions.IllegalArgumentException;
  const EAN13Reader = w69b.oned.EAN13Reader;
  const UPCEANReader = w69b.oned.UPCEANReader;
  const UPCEReader = w69b.oned.UPCEReader;
  const UPCEANWriter = w69b.oned.UPCEANWriter;
  const appendPattern = w69b.oned.OneDimensionalCodeWriter.appendPattern;

  /**
   * This object renders an UPC-E code as a {@link BitMatrix}.
   * @constructor
   * @extends {UPCEANWriter}
   * @final
   */
  w69b.oned.UPCEWriter = function() { };
  const UPCEWriter = w69b.oned.UPCEWriter;
  goog.inherits(UPCEWriter, UPCEANWriter);
  const pro = UPCEWriter.prototype;

  const CODE_WIDTH = 3 + // start guard
      (7 * 6) + // bars
      6; // end guard

  /**
   * @override
   */
  pro.encode = function(contents, format, width, height, opt_hints) {
    if (format !== BarcodeFormat.UPC_E) {
      throw new IllegalArgumentException("Can only encode UPC_E, but got " + format);
    }

    return goog.base(this, 'encode', contents, format, width, height, opt_hints);
  };

  /**
   * @override
   */
  pro.encodeBoolean = function(contents) {
    var length = contents.length;
    switch (length) {
      case 7:
        // No check digit present, calculate it and add it
        let check;
        try {
          check = UPCEANReader.getStandardUPCEANChecksum(UPCEReader.convertUPCEtoUPCA(contents));
        } catch (fe) {
          if (fe instanceof FormatException) {
            throw new IllegalArgumentException(fe);
          }

          throw fe;
        }
        contents += check;
        break;
      case 8:
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
            "Requested contents should be 8 digits long, but got " + length);
    }

    var firstDigit = Character.digit(contents.charAt(0), 10);
    if (firstDigit !== 0 && firstDigit !== 1) {
      throw new IllegalArgumentException("Number system must be 0 or 1");
    }

    var checkDigit = Character.digit(contents.charAt(7), 10);
    var parities = UPCEReader.NUMSYS_AND_CHECK_DIGIT_PATTERNS[firstDigit][checkDigit];
    /** @type {!Array.<!boolean>} */
    var result = new Array(CODE_WIDTH);
    var pos = 0;

    pos += appendPattern(result, pos, UPCEANReader.START_END_PATTERN, true);

    for (let i = 1; i <= 6; i++) {
      let digit = Character.digit(contents.charAt(i), 10);
      if ((parities >> (6 - i) & 1) === 1) {
        digit += 10;
      }
      pos += appendPattern(result, pos, UPCEANReader.L_AND_G_PATTERNS[digit], false);
    }

    appendPattern(result, pos, UPCEANReader.END_PATTERN, false);

    return result;
  };
});
