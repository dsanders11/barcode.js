// javascript (closure) port (c) 2017 David Sanders (dsanders11@ucsbalum.com)
/*
 * Copyright 2008 ZXing authors
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

goog.provide('w69b.oned.Code128Reader');
goog.require('w69b.BarcodeFormat');
goog.require('w69b.ChecksumException');
goog.require('w69b.DecodeHintType');
goog.require('w69b.FormatException');
goog.require('w69b.NotFoundException');
goog.require('w69b.Result');
goog.require('w69b.ResultPoint');
goog.require('w69b.common.BitArray');
goog.require('w69b.oned.OneDReader');


goog.scope(function() {
  var BarcodeFormat = w69b.BarcodeFormat;
  var ChecksumException = w69b.ChecksumException;
  var DecodeHintType = w69b.DecodeHintType;
  var FormatException = w69b.FormatException;
  var NotFoundException = w69b.NotFoundException;
  var Result = w69b.Result;
  var ResultPoint = w69b.ResultPoint;
  var BitArray = w69b.common.BitArray;
  var OneDReader = w69b.oned.OneDReader;

  /**
   * Decodes Code 128 barcodes.
   * @constructor
   * @extends {OneDReader}
   * @final
   */
  w69b.oned.Code128Reader = function() { };
  var Code128Reader = w69b.oned.Code128Reader;
  goog.inherits(Code128Reader, OneDReader);
  var pro = Code128Reader.prototype;

  /**
   * @const {!Array.<!Int32Array>}
   */
  Code128Reader.CODE_PATTERNS = [
    Int32Array.of(2, 1, 2, 2, 2, 2), // 0
    Int32Array.of(2, 2, 2, 1, 2, 2),
    Int32Array.of(2, 2, 2, 2, 2, 1),
    Int32Array.of(1, 2, 1, 2, 2, 3),
    Int32Array.of(1, 2, 1, 3, 2, 2),
    Int32Array.of(1, 3, 1, 2, 2, 2), // 5
    Int32Array.of(1, 2, 2, 2, 1, 3),
    Int32Array.of(1, 2, 2, 3, 1, 2),
    Int32Array.of(1, 3, 2, 2, 1, 2),
    Int32Array.of(2, 2, 1, 2, 1, 3),
    Int32Array.of(2, 2, 1, 3, 1, 2), // 10
    Int32Array.of(2, 3, 1, 2, 1, 2),
    Int32Array.of(1, 1, 2, 2, 3, 2),
    Int32Array.of(1, 2, 2, 1, 3, 2),
    Int32Array.of(1, 2, 2, 2, 3, 1),
    Int32Array.of(1, 1, 3, 2, 2, 2), // 15
    Int32Array.of(1, 2, 3, 1, 2, 2),
    Int32Array.of(1, 2, 3, 2, 2, 1),
    Int32Array.of(2, 2, 3, 2, 1, 1),
    Int32Array.of(2, 2, 1, 1, 3, 2),
    Int32Array.of(2, 2, 1, 2, 3, 1), // 20
    Int32Array.of(2, 1, 3, 2, 1, 2),
    Int32Array.of(2, 2, 3, 1, 1, 2),
    Int32Array.of(3, 1, 2, 1, 3, 1),
    Int32Array.of(3, 1, 1, 2, 2, 2),
    Int32Array.of(3, 2, 1, 1, 2, 2), // 25
    Int32Array.of(3, 2, 1, 2, 2, 1),
    Int32Array.of(3, 1, 2, 2, 1, 2),
    Int32Array.of(3, 2, 2, 1, 1, 2),
    Int32Array.of(3, 2, 2, 2, 1, 1),
    Int32Array.of(2, 1, 2, 1, 2, 3), // 30
    Int32Array.of(2, 1, 2, 3, 2, 1),
    Int32Array.of(2, 3, 2, 1, 2, 1),
    Int32Array.of(1, 1, 1, 3, 2, 3),
    Int32Array.of(1, 3, 1, 1, 2, 3),
    Int32Array.of(1, 3, 1, 3, 2, 1), // 35
    Int32Array.of(1, 1, 2, 3, 1, 3),
    Int32Array.of(1, 3, 2, 1, 1, 3),
    Int32Array.of(1, 3, 2, 3, 1, 1),
    Int32Array.of(2, 1, 1, 3, 1, 3),
    Int32Array.of(2, 3, 1, 1, 1, 3), // 40
    Int32Array.of(2, 3, 1, 3, 1, 1),
    Int32Array.of(1, 1, 2, 1, 3, 3),
    Int32Array.of(1, 1, 2, 3, 3, 1),
    Int32Array.of(1, 3, 2, 1, 3, 1),
    Int32Array.of(1, 1, 3, 1, 2, 3), // 45
    Int32Array.of(1, 1, 3, 3, 2, 1),
    Int32Array.of(1, 3, 3, 1, 2, 1),
    Int32Array.of(3, 1, 3, 1, 2, 1),
    Int32Array.of(2, 1, 1, 3, 3, 1),
    Int32Array.of(2, 3, 1, 1, 3, 1), // 50
    Int32Array.of(2, 1, 3, 1, 1, 3),
    Int32Array.of(2, 1, 3, 3, 1, 1),
    Int32Array.of(2, 1, 3, 1, 3, 1),
    Int32Array.of(3, 1, 1, 1, 2, 3),
    Int32Array.of(3, 1, 1, 3, 2, 1), // 55
    Int32Array.of(3, 3, 1, 1, 2, 1),
    Int32Array.of(3, 1, 2, 1, 1, 3),
    Int32Array.of(3, 1, 2, 3, 1, 1),
    Int32Array.of(3, 3, 2, 1, 1, 1),
    Int32Array.of(3, 1, 4, 1, 1, 1), // 60
    Int32Array.of(2, 2, 1, 4, 1, 1),
    Int32Array.of(4, 3, 1, 1, 1, 1),
    Int32Array.of(1, 1, 1, 2, 2, 4),
    Int32Array.of(1, 1, 1, 4, 2, 2),
    Int32Array.of(1, 2, 1, 1, 2, 4), // 65
    Int32Array.of(1, 2, 1, 4, 2, 1),
    Int32Array.of(1, 4, 1, 1, 2, 2),
    Int32Array.of(1, 4, 1, 2, 2, 1),
    Int32Array.of(1, 1, 2, 2, 1, 4),
    Int32Array.of(1, 1, 2, 4, 1, 2), // 70
    Int32Array.of(1, 2, 2, 1, 1, 4),
    Int32Array.of(1, 2, 2, 4, 1, 1),
    Int32Array.of(1, 4, 2, 1, 1, 2),
    Int32Array.of(1, 4, 2, 2, 1, 1),
    Int32Array.of(2, 4, 1, 2, 1, 1), // 75
    Int32Array.of(2, 2, 1, 1, 1, 4),
    Int32Array.of(4, 1, 3, 1, 1, 1),
    Int32Array.of(2, 4, 1, 1, 1, 2),
    Int32Array.of(1, 3, 4, 1, 1, 1),
    Int32Array.of(1, 1, 1, 2, 4, 2), // 80
    Int32Array.of(1, 2, 1, 1, 4, 2),
    Int32Array.of(1, 2, 1, 2, 4, 1),
    Int32Array.of(1, 1, 4, 2, 1, 2),
    Int32Array.of(1, 2, 4, 1, 1, 2),
    Int32Array.of(1, 2, 4, 2, 1, 1), // 85
    Int32Array.of(4, 1, 1, 2, 1, 2),
    Int32Array.of(4, 2, 1, 1, 1, 2),
    Int32Array.of(4, 2, 1, 2, 1, 1),
    Int32Array.of(2, 1, 2, 1, 4, 1),
    Int32Array.of(2, 1, 4, 1, 2, 1), // 90
    Int32Array.of(4, 1, 2, 1, 2, 1),
    Int32Array.of(1, 1, 1, 1, 4, 3),
    Int32Array.of(1, 1, 1, 3, 4, 1),
    Int32Array.of(1, 3, 1, 1, 4, 1),
    Int32Array.of(1, 1, 4, 1, 1, 3), // 95
    Int32Array.of(1, 1, 4, 3, 1, 1),
    Int32Array.of(4, 1, 1, 1, 1, 3),
    Int32Array.of(4, 1, 1, 3, 1, 1),
    Int32Array.of(1, 1, 3, 1, 4, 1),
    Int32Array.of(1, 1, 4, 1, 3, 1), // 100
    Int32Array.of(3, 1, 1, 1, 4, 1),
    Int32Array.of(4, 1, 1, 1, 3, 1),
    Int32Array.of(2, 1, 1, 4, 1, 2),
    Int32Array.of(2, 1, 1, 2, 1, 4),
    Int32Array.of(2, 1, 1, 2, 3, 2), // 105
    Int32Array.of(2, 3, 3, 1, 1, 1, 2)
  ];

  /** @const {number} */
  var MAX_AVG_VARIANCE = 0.25;
  /** @const {number} */
  var MAX_INDIVIDUAL_VARIANCE = 0.7;

  /** @const {number} */
  var CODE_SHIFT = 98;

  /** @const {number} */
  var CODE_CODE_C = 99;
  /** @const {number} */
  var CODE_CODE_B = 100;
  /** @const {number} */
  var CODE_CODE_A = 101;

  /** @const {number} */
  var CODE_FNC_1 = 102;
  /** @const {number} */
  var CODE_FNC_2 = 97;
  /** @const {number} */
  var CODE_FNC_3 = 96;
  /** @const {number} */
  var CODE_FNC_4_A = 101;
  /** @const {number} */
  var CODE_FNC_4_B = 100;

  /** @const {number} */
  var CODE_START_A = 103;
  /** @const {number} */
  var CODE_START_B = 104;
  /** @const {number} */
  var CODE_START_C = 105;
  /** @const {number} */
  var CODE_STOP = 106;

  /**
   * @override
   * @suppress {checkTypes}
   */
  pro.decodeRow = function(rowNumber, row, hints) {
    var convertFNC1 = hints !== null && !!hints[DecodeHintType.ASSUME_GS1];

    var startPatternInfo = Code128Reader.findStartPattern_(row);
    var startCode = startPatternInfo[2];

    var rawCodes = new Array(20);
    rawCodes.push(startCode);

    var codeSet;
    switch (startCode) {
      case CODE_START_A:
        codeSet = CODE_CODE_A;
        break;
      case CODE_START_B:
        codeSet = CODE_CODE_B;
        break;
      case CODE_START_C:
        codeSet = CODE_CODE_C;
        break;
      default:
        throw new FormatException();
    }

    var done = false;
    var isNextShifted = false;

    //StringBuilder result = new StringBuilder(20);
    var result = '';

    var lastStart = startPatternInfo[0];
    var nextStart = startPatternInfo[1];
    var counters = new Int32Array(6);

    var lastCode = 0;
    var code = 0;
    var checksumTotal = startCode;
    var multiplier = 0;
    var lastCharacterWasPrintable = true;
    var upperMode = false;
    var shiftUpperMode = false;

    while (!done) {
      let unshift = isNextShifted;
      isNextShifted = false;

      // Save off last code
      lastCode = code;

      // Decode another code from image
      code = Code128Reader.decodeCode_(row, counters, nextStart);

      rawCodes.push(code);

      // Remember whether the last code was printable or not (excluding CODE_STOP)
      if (code !== CODE_STOP) {
        lastCharacterWasPrintable = true;
      }

      // Add to checksum computation (if not CODE_STOP of course)
      if (code !== CODE_STOP) {
        multiplier++;
        checksumTotal += multiplier * code;
      }

      // Advance to where the next code will to start
      lastStart = nextStart;
      for (let counter of counters) {
        nextStart += counter;
      }

      // Take care of illegal start codes
      switch (code) {
        case CODE_START_A:
        case CODE_START_B:
        case CODE_START_C:
          throw new FormatException();
      }

      switch (codeSet) {
        case CODE_CODE_A:
          if (code < 64) {
            if (shiftUpperMode === upperMode) {
              result += String.fromCharCode(' '.charCodeAt(0) + code);
            } else {
              result += String.fromCharCode(' '.charCodeAt(0) + code + 128);
            }
            shiftUpperMode = false;
          } else if (code < 96) {
            if (shiftUpperMode === upperMode) {
              result += String.fromCharCode(code - 64);
            } else {
              result += String.fromCharCode(code + 64);
            }
            shiftUpperMode = false;
          } else {
            // Don't let CODE_STOP, which always appears, affect whether whether we think the last
            // code was printable or not.
            if (code !== CODE_STOP) {
              lastCharacterWasPrintable = false;
            }
            switch (code) {
              case CODE_FNC_1:
                if (convertFNC1) {
                  if (result.length === 0) {
                    // GS1 specification 5.4.3.7. and 5.4.6.4. If the first char after the start code
                    // is FNC1 then this is GS1-128. We add the symbology identifier.
                    result += "]C1";
                  } else {
                    // GS1 specification 5.4.7.5. Every subsequent FNC1 is returned as ASCII 29 (GS)
                    result += String.fromCharCode(29);
                  }
                }
                break;
              case CODE_FNC_2:
              case CODE_FNC_3:
                // do nothing?
                break;
              case CODE_FNC_4_A:
                if (!upperMode && shiftUpperMode) {
                  upperMode = true;
                  shiftUpperMode = false;
                } else if (upperMode && shiftUpperMode) {
                  upperMode = false;
                  shiftUpperMode = false;
                } else {
                  shiftUpperMode = true;
                }
                break;
              case CODE_SHIFT:
                isNextShifted = true;
                codeSet = CODE_CODE_B;
                break;
              case CODE_CODE_B:
                codeSet = CODE_CODE_B;
                break;
              case CODE_CODE_C:
                codeSet = CODE_CODE_C;
                break;
              case CODE_STOP:
                done = true;
                break;
            }
          }
          break;
        case CODE_CODE_B:
          if (code < 96) {
            if (shiftUpperMode === upperMode) {
              result += String.fromCharCode(' '.charCodeAt(0) + code);
            } else {
              result += String.fromCharCode(' '.charCodeAt(0) + code + 128);
            }
            shiftUpperMode = false;
          } else {
            if (code !== CODE_STOP) {
              lastCharacterWasPrintable = false;
            }
            switch (code) {
              case CODE_FNC_1:
                if (convertFNC1) {
                  if (result.length === 0) {
                    // GS1 specification 5.4.3.7. and 5.4.6.4. If the first char after the start code
                    // is FNC1 then this is GS1-128. We add the symbology identifier.
                    result += "]C1";
                  } else {
                    // GS1 specification 5.4.7.5. Every subsequent FNC1 is returned as ASCII 29 (GS)
                    result += String.fromCharCode(29);
                  }
                }
                break;
              case CODE_FNC_2:
              case CODE_FNC_3:
                // do nothing?
                break;
              case CODE_FNC_4_B:
                if (!upperMode && shiftUpperMode) {
                  upperMode = true;
                  shiftUpperMode = false;
                } else if (upperMode && shiftUpperMode) {
                  upperMode = false;
                  shiftUpperMode = false;
                } else {
                  shiftUpperMode = true;
                }
                break;
              case CODE_SHIFT:
                isNextShifted = true;
                codeSet = CODE_CODE_A;
                break;
              case CODE_CODE_A:
                codeSet = CODE_CODE_A;
                break;
              case CODE_CODE_C:
                codeSet = CODE_CODE_C;
                break;
              case CODE_STOP:
                done = true;
                break;
            }
          }
          break;
        case CODE_CODE_C:
          if (code < 100) {
            if (code < 10) {
              result += '0';
            }
            result += code;
          } else {
            if (code !== CODE_STOP) {
              lastCharacterWasPrintable = false;
            }
            switch (code) {
              case CODE_FNC_1:
                if (convertFNC1) {
                  if (result.length === 0) {
                    // GS1 specification 5.4.3.7. and 5.4.6.4. If the first char after the start code
                    // is FNC1 then this is GS1-128. We add the symbology identifier.
                    result += "]C1";
                  } else {
                    // GS1 specification 5.4.7.5. Every subsequent FNC1 is returned as ASCII 29 (GS)
                    result += String.fromCharCode(29);
                  }
                }
                break;
              case CODE_CODE_A:
                codeSet = CODE_CODE_A;
                break;
              case CODE_CODE_B:
                codeSet = CODE_CODE_B;
                break;
              case CODE_STOP:
                done = true;
                break;
            }
          }
          break;
      }

      // Unshift back to another code set if we were shifted
      if (unshift) {
        codeSet = codeSet === CODE_CODE_A ? CODE_CODE_B : CODE_CODE_A;
      }
    }

    var lastPatternSize = nextStart - lastStart;

    // Check for ample whitespace following pattern, but, to do this we first need to remember that
    // we fudged decoding CODE_STOP since it actually has 7 bars, not 6. There is a black bar left
    // to read off. Would be slightly better to properly read. Here we just skip it:
    nextStart = row.getNextUnset(nextStart);
    if (!row.isRange(nextStart,
                     Math.min(row.getSize(), nextStart + ((nextStart - lastStart) >> 1)),
                     false)) {
      throw new NotFoundException();
    }

    // Pull out from sum the value of the penultimate check code
    checksumTotal -= multiplier * lastCode;
    // lastCode is the checksum then:
    if (checksumTotal % 103 !== lastCode) {
      throw new ChecksumException();
    }

    // Need to pull out the check digits from string
    var resultLength = result.length;
    if (resultLength === 0) {
      // false positive
      throw new NotFoundException();
    }

    // Only bother if the result had at least one character, and if the checksum digit happened to
    // be a printable character. If it was just interpreted as a control code, nothing to remove.
    if (resultLength > 0 && lastCharacterWasPrintable) {
      if (codeSet === CODE_CODE_C) {
        //result.delete(resultLength - 2, resultLength);
        result = result.slice(0, -2);
      } else {
        //result.delete(resultLength - 1, resultLength);
        result = result.slice(0, -1);
      }
    }

    var left = (startPatternInfo[1] + startPatternInfo[0]) / 2.0;
    var right = lastStart + lastPatternSize / 2.0;

    var rawCodesSize = rawCodes.length;
    var rawBytes = new Int8Array(rawCodesSize);
    for (let i = 0; i < rawCodesSize; i++) {
      rawBytes[i] = rawCodes[i];
    }

    return new Result(
        result,
        rawBytes,
        [new ResultPoint(left, rowNumber), new ResultPoint(right, rowNumber)],
        BarcodeFormat.CODE_128);
  };

  /**
   * @param {BitArray} row
   * @param {!Int32Array} counters
   * @param {number} rowOffset
   * @return {number}
   * @throws {NotFoundException}
   * @private
   * @static
   */
  Code128Reader.decodeCode_ = function(row, counters, rowOffset) {
    OneDReader.recordPattern(row, rowOffset, counters);
    var bestVariance = MAX_AVG_VARIANCE; // worst variance we'll accept
    var bestMatch = -1;
    for (let d = 0; d < Code128Reader.CODE_PATTERNS.length; d++) {
      let pattern = Code128Reader.CODE_PATTERNS[d];
      let variance = OneDReader.patternMatchVariance(counters, pattern, MAX_INDIVIDUAL_VARIANCE);
      if (variance < bestVariance) {
        bestVariance = variance;
        bestMatch = d;
      }
    }
    // TODO We're overlooking the fact that the STOP pattern has 7 values, not 6.
    if (bestMatch >= 0) {
      return bestMatch;
    } else {
      throw new NotFoundException();
    }
  };

  /**
   * @param {BitArray} row
   * @return {!Int32Array}
   * @throws {NotFoundException}
   * @private
   * @static
   */
  Code128Reader.findStartPattern_ = function(row) {
    var width = row.getSize();
    var rowOffset = row.getNextSet(0);

    var counterPosition = 0;
    var counters = new Int32Array(6);
    var patternStart = rowOffset;
    var isWhite = false;
    var patternLength = counters.length;

    for (let i = rowOffset; i < width; i++) {
      if (row.get(i) ^ isWhite) {
        counters[counterPosition]++;
      } else {
        if (counterPosition === patternLength - 1) {
          let bestVariance = MAX_AVG_VARIANCE;
          let bestMatch = -1;
          for (let startCode = CODE_START_A; startCode <= CODE_START_C; startCode++) {
            let variance = OneDReader.patternMatchVariance(counters, Code128Reader.CODE_PATTERNS[startCode],
                MAX_INDIVIDUAL_VARIANCE);
            if (variance < bestVariance) {
              bestVariance = variance;
              bestMatch = startCode;
            }
          }
          // Look for whitespace before start pattern, >= 50% of width of start pattern
          if (bestMatch >= 0 &&
              row.isRange(Math.max(0, patternStart - ((i - patternStart) >> 1)), patternStart, false)) {
            return Int32Array.of(patternStart, i, bestMatch);
          }
          patternStart += counters[0] + counters[1];
          //System.arraycopy(counters, 2, counters, 0, patternLength - 2);
          counters.copyWithin(0, 2, patternLength);
          counters[patternLength - 2] = 0;
          counters[patternLength - 1] = 0;
          counterPosition--;
        } else {
          counterPosition++;
        }
        counters[counterPosition] = 1;
        isWhite = !isWhite;
      }
    }
    throw new NotFoundException();
  };
});
