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

goog.provide('w69b.oned.EAN8Writer');
goog.require('java.lang.Character');
goog.require('java.lang.IllegalArgumentException');
goog.require('w69b.BarcodeFormat');
goog.require('w69b.FormatException');
goog.require('w69b.oned.OneDimensionalCodeWriter');
goog.require('w69b.oned.UPCEANReader');
goog.require('w69b.oned.UPCEANWriter');


goog.scope(function() {
  const Character = java.lang.Character;
  const IllegalArgumentException = java.lang.IllegalArgumentException;
  const BarcodeFormat = w69b.BarcodeFormat;
  const FormatException = w69b.FormatException;
  const UPCEANReader = w69b.oned.UPCEANReader;
  const UPCEANWriter = w69b.oned.UPCEANWriter;
  const appendPattern = w69b.oned.OneDimensionalCodeWriter.appendPattern;

  /**
   * This object renders an EAN8 code as a {@link BitMatrix}.
   * @constructor
   * @extends {UPCEANWriter}
   * @final
   */
  w69b.oned.EAN8Writer = function() { };
  const EAN8Writer = w69b.oned.EAN8Writer;
  goog.inherits(EAN8Writer, UPCEANWriter);
  const pro = EAN8Writer.prototype;

  const CODE_WIDTH = 3 + // start guard
      (7 * 4) + // left bars
      5 + // middle guard
      (7 * 4) + // right bars
      3; // end guard

  /**
   * @override
   */
  pro.encode = function(contents, format, width, height, opt_hints) {
    if (format !== BarcodeFormat.EAN_8) {
      throw new IllegalArgumentException("Can only encode EAN_8, but got "
          + format);
    }

    return EAN8Writer.base(this, 'encode', contents, format, width, height, opt_hints);
  };

  /**
   * @override
   */
  pro.encodeBoolean = function(contents) {
    const length = contents.length;
    switch (length) {
      case 7:
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

    /** @type {!Array.<boolean>} */
    const result = new Array(CODE_WIDTH);
    let pos = 0;

    pos += appendPattern(result, pos, UPCEANReader.START_END_PATTERN, true);

    for (let i = 0; i <= 3; i++) {
      const digit = Character.digit(contents.charAt(i), 10);
      pos += appendPattern(result, pos, UPCEANReader.L_PATTERNS[digit], false);
    }

    pos += appendPattern(result, pos, UPCEANReader.MIDDLE_PATTERN, false);

    for (let i = 4; i <= 7; i++) {
      const digit = Character.digit(contents.charAt(i), 10);
      pos += appendPattern(result, pos, UPCEANReader.L_PATTERNS[digit], true);
    }
    appendPattern(result, pos, UPCEANReader.START_END_PATTERN, true);

    return result;
  };
});
