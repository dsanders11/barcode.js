// javascript (closure) port (c) 2013 Manuel Braun (mb@w69b.com)
// javascript port (c) 2011 Lazar Laszlo (lazarsoft@gmail.com)
/*
 * Copyright 2007 ZXing authors
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
goog.provide('w69b.qr.decoder.BitMatrixParser');
goog.require('w69b.FormatException');
goog.require('w69b.common.BitMatrix');
goog.require('w69b.qr.decoder.DataMask');
goog.require('w69b.qr.decoder.FormatInformation');
goog.require('w69b.qr.decoder.Version');

goog.scope(function() {
  const BitMatrix = w69b.common.BitMatrix;
  const FormatInformation = w69b.qr.decoder.FormatInformation;
  const Version = w69b.qr.decoder.Version;
  const DataMask = w69b.qr.decoder.DataMask;
  const FormatException = w69b.FormatException;

  /**
   * @param {!BitMatrix} bitMatrix matrix.
   * @constructor
   */
  w69b.qr.decoder.BitMatrixParser = function(bitMatrix) {
    var dimension = bitMatrix.getHeight();
    if (dimension < 21 || (dimension & 0x03) !== 1) {
      throw new FormatException();
    }
    this.bitMatrix = bitMatrix;
    /**
     * @type {?Version}
     */
    this.parsedVersion = null;
    /**
     * @type {?FormatInformation}
     */
    this.parsedFormatInfo = null;
    this.mirror_ = false;
  };
  const BitMatrixParser = w69b.qr.decoder.BitMatrixParser;
  const pro = BitMatrixParser.prototype;

  /**
   * @param {number} i
   * @param {number} j
   * @param {number} versionBits
   * @return {number}
   */
  pro.copyBit = function(i, j, versionBits) {
    var bit = this.mirror_ ? this.bitMatrix.get(j, i) : this.bitMatrix.get(i, j);
    return bit ? (versionBits << 1) | 0x1 : versionBits << 1;
  };

  /**
   * @return {!FormatInformation} format information.
   */
  pro.readFormatInformation = function() {
    if (this.parsedFormatInfo !== null) {
      return this.parsedFormatInfo;
    }

    // Read top-left format info bits
    var formatInfoBits = 0;
    for (let i = 0; i < 6; i++) {
      formatInfoBits = this.copyBit(i, 8, formatInfoBits);
    }
    // .. and skip a bit in the timing pattern ...
    formatInfoBits = this.copyBit(7, 8, formatInfoBits);
    formatInfoBits = this.copyBit(8, 8, formatInfoBits);
    formatInfoBits = this.copyBit(8, 7, formatInfoBits);
    // .. and skip a bit in the timing pattern ...
    for (let j = 5; j >= 0; j--) {
      formatInfoBits = this.copyBit(8, j, formatInfoBits);
    }

    this.parsedFormatInfo =
      FormatInformation.decodeFormatInformation(formatInfoBits);
    if (this.parsedFormatInfo !== null) {
      return this.parsedFormatInfo;
    }

    // Hmm, failed. Try the top-right/bottom-left pattern
    var dimension = this.bitMatrix.getHeight();
    formatInfoBits = 0;
    var iMin = dimension - 8;
    for (let i = dimension - 1; i >= iMin; i--) {
      formatInfoBits = this.copyBit(i, 8, formatInfoBits);
    }
    for (let j = dimension - 7; j < dimension; j++) {
      formatInfoBits = this.copyBit(8, j, formatInfoBits);
    }

    this.parsedFormatInfo =
      FormatInformation.decodeFormatInformation(formatInfoBits);
    if (this.parsedFormatInfo !== null) {
      return this.parsedFormatInfo;
    }
    throw new FormatException();
  };

  /**
   * @return {!Version} version.
   */
  pro.readVersion = function() {
    if (this.parsedVersion !== null) {
      return this.parsedVersion;
    }

    var dimension = this.bitMatrix.getHeight();

    var provisionalVersion = (dimension - 17) >> 2;
    if (provisionalVersion <= 6) {
      return Version.getVersionForNumber(provisionalVersion);
    }

    // Read top-right version info: 3 wide by 6 tall
    var versionBits = 0;
    var ijMin = dimension - 11;
    for (let j = 5; j >= 0; j--) {
      for (let i = dimension - 9; i >= ijMin; i--) {
        versionBits = this.copyBit(i, j, versionBits);
      }
    }

    this.parsedVersion = Version.decodeVersionInformation(versionBits);
    if (this.parsedVersion !== null &&
      this.parsedVersion.getDimensionForVersion() === dimension) {
      return this.parsedVersion;
    }

    // Hmm, failed. Try bottom left: 6 wide by 3 tall
    versionBits = 0;
    for (let i = 5; i >= 0; i--) {
      for (let j = dimension - 9; j >= ijMin; j--) {
        versionBits = this.copyBit(i, j, versionBits);
      }
    }

    this.parsedVersion = Version.decodeVersionInformation(versionBits);
    if (this.parsedVersion !== null &&
      this.parsedVersion.getDimensionForVersion() === dimension) {
      return this.parsedVersion;
    }
    throw new FormatException();
  };

  /**
   * @return {!Int8Array} bytes encoded within the QR Code
   */
  pro.readCodewords = function() {
    var formatInfo = this.readFormatInformation();
    var version = this.readVersion();

    // Get the data mask for the format used in this QR Code. This will exclude
    // some bits from reading as we wind through the bit matrix.
    var dataMask = DataMask.forReference(formatInfo.getDataMask());
    var dimension = this.bitMatrix.getHeight();
    dataMask.unmaskBitMatrix(this.bitMatrix, dimension);

    var functionPattern = version.buildFunctionPattern();

    var readingUp = true;
    var result = new Int8Array(version.totalCodewords);
    var resultOffset = 0;
    var currentByte = 0;
    var bitsRead = 0;
    // Read columns in pairs, from right to left
    for (let j = dimension - 1; j > 0; j -= 2) {
      if (j === 6) {
        // Skip whole column with vertical alignment pattern;
        // saves time and makes the other code proceed more cleanly
        j--;
      }
      // Read alternatingly from bottom to top then top to bottom
      for (let count = 0; count < dimension; count++) {
        let i = readingUp ? dimension - 1 - count : count;
        for (let col = 0; col < 2; col++) {
          // Ignore bits covered by the function pattern
          if (!functionPattern.get(j - col, i)) {
            // Read a bit
            bitsRead++;
            currentByte <<= 1;
            if (this.bitMatrix.get(j - col, i)) {
              currentByte |= 1;
            }
            // If we've made a whole byte, save it off
            if (bitsRead === 8) {
              result[resultOffset++] = currentByte;
              bitsRead = 0;
              currentByte = 0;
            }
          }
        }
      }
      readingUp ^= true; // readingUp = !readingUp; // switch directions
    }
    if (resultOffset !== version.totalCodewords) {
      throw new FormatException();
    }
    return result;
  };


  /**
   * Revert the mask removal done while reading the code words. The bit matrix
   * should revert to its original state.
   */
  pro.remask = function() {
    if (this.parsedFormatInfo === null) {
      return; // We have no format information, and have no data mask
    }
    var dataMask = DataMask.forReference(this.parsedFormatInfo.getDataMask());
    var dimension = this.bitMatrix.getHeight();
    dataMask.unmaskBitMatrix(this.bitMatrix, dimension);
  };

  /**
   * Prepare the parser for a mirrored operation.
   * This flag has effect only on the {@link #readFormatInformation()} and the
   * {@link #readVersion()}. Before proceeding with {@link #readCodewords()}
   * the {@link #mirror()} method should be called.
   *
   * @param {boolean} mirror Whether to read version and format information
   *                         mirrored.
   */
  pro.setMirror = function(mirror) {
    this.parsedVersion = null;
    this.parsedFormatInfo = null;
    this.mirror_ = mirror;
  };

  /** Mirror the bit matrix in order to attempt a second reading. */
  pro.mirror = function() {
    var bitMatrix = this.bitMatrix;
    for (let x = 0; x < bitMatrix.getWidth(); x++) {
      for (let y = x + 1; y < bitMatrix.getHeight(); y++) {
        if (bitMatrix.get(x, y) !== bitMatrix.get(y, x)) {
          bitMatrix.flip(y, x);
          bitMatrix.flip(x, y);
        }
      }
    }
  };
});
