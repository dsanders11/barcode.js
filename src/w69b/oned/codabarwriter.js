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

goog.provide('w69b.oned.CodaBarWriter');
goog.require('w69b.exceptions.IllegalArgumentException');
goog.require('w69b.oned.CodaBarReader');
goog.require('w69b.oned.OneDimensionalCodeWriter');


goog.scope(function() {
  const CodaBarReader = w69b.oned.CodaBarReader;
  const IllegalArgumentException = w69b.exceptions.IllegalArgumentException;
  const OneDimensionalCodeWriter = w69b.oned.OneDimensionalCodeWriter;

  /**
   * This class renders CodaBar as {@code boolean[]}.
   * @constructor
   * @extends {OneDimensionalCodeWriter}
   * @final
   */
  w69b.oned.CodaBarWriter = function() { };
  const CodaBarWriter = w69b.oned.CodaBarWriter;
  goog.inherits(CodaBarWriter, OneDimensionalCodeWriter);
  const pro = CodaBarWriter.prototype;

  /** @type {!Array.<string>} */
  const START_END_CHARS = ['A', 'B', 'C', 'D'];
  /** @type {!Array.<string>} */
  const ALT_START_END_CHARS = ['T', 'N', '*', 'E'];
  /** @type {!Array.<string>} */
  const CHARS_WHICH_ARE_TEN_LENGTH_EACH_AFTER_DECODED = ['/', ':', '+', '.'];
  const DEFAULT_GUARD = START_END_CHARS[0];

  /**
   * @override
   */
  pro.encodeBoolean = function(contents) {
    if (contents.length < 2) {
      // Can't have a start/end guard, so tentatively add default guards
      contents = DEFAULT_GUARD + contents + DEFAULT_GUARD;
    } else {
      // Verify input and calculate decoded length.
      let firstChar = contents.charAt(0).toUpperCase();
      let lastChar = contents.charAt(contents.length - 1).toUpperCase();
      let startsNormal = START_END_CHARS.includes(firstChar);
      let endsNormal = START_END_CHARS.includes(lastChar);
      let startsAlt = ALT_START_END_CHARS.includes(firstChar);
      let endsAlt = ALT_START_END_CHARS.includes(lastChar);
      if (startsNormal) {
        if (!endsNormal) {
          throw new IllegalArgumentException("Invalid start/end guards: " + contents);
        }
        // else already has valid start/end
      } else if (startsAlt) {
        if (!endsAlt) {
          throw new IllegalArgumentException("Invalid start/end guards: " + contents);
        }
        // else already has valid start/end
      } else {
        // Doesn't start with a guard
        if (endsNormal || endsAlt) {
          throw new IllegalArgumentException("Invalid start/end guards: " + contents);
        }
        // else doesn't end with guard either, so add a default
        contents = DEFAULT_GUARD + contents + DEFAULT_GUARD;
      }
    }

    // The start character and the end character are decoded to 10 length each.
    var resultLength = 20;
    for (let i = 1; i < contents.length - 1; i++) {
      if (isDigit(contents.charAt(i)) || contents.charAt(i) == '-' || contents.charAt(i) == '$') {
        resultLength += 9;
      } else if (CHARS_WHICH_ARE_TEN_LENGTH_EACH_AFTER_DECODED.includes(contents.charAt(i))) {
        resultLength += 10;
      } else {
        throw new IllegalArgumentException("Cannot encode : '" + contents.charAt(i) + '\'');
      }
    }
    // A blank is placed between each character.
    resultLength += contents.length - 1;

    /** @type {!Array.<boolean>} */
    var result = new Array(resultLength);
    var position = 0;
    for (let index = 0; index < contents.length; index++) {
      let c = contents.charAt(index).toUpperCase();
      if (index == 0 || index == contents.length - 1) {
        // The start/end chars are not in the CodaBarReader.ALPHABET.
        switch (c) {
          case 'T':
            c = 'A';
            break;
          case 'N':
            c = 'B';
            break;
          case '*':
            c = 'C';
            break;
          case 'E':
            c = 'D';
            break;
        }
      }
      let code = 0;
      for (let i = 0; i < CodaBarReader.ALPHABET.length; i++) {
        // Found any, because I checked above.
        if (c === CodaBarReader.ALPHABET[i]) {
          code = CodaBarReader.CHARACTER_ENCODINGS[i];
          break;
        }
      }
      let color = true;
      let counter = 0;
      let bit = 0;
      while (bit < 7) { // A character consists of 7 digit.
        result[position] = color;
        position++;
        if (((code >> (6 - bit)) & 1) == 0 || counter == 1) {
          color = !color; // Flip the color.
          bit++;
          counter = 0;
        } else {
          counter++;
        }
      }
      if (index < contents.length - 1) {
        result[position] = false;
        position++;
      }
    }
    return result;
  };

  /**
   * @param {string} char
   * @return {boolean}
   */
  function isDigit(char) {
    return ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'].includes(char);
  }
});
