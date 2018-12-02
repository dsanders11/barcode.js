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

goog.provide('w69b.qr.decoder.DataBlock');
goog.require('java.lang.IllegalArgumentException');
goog.require('w69b.qr.decoder.ErrorCorrectionLevel');
goog.require('w69b.qr.decoder.Version');


goog.scope(function() {
  const IllegalArgumentException = java.lang.IllegalArgumentException;
  const ErrorCorrectionLevel = w69b.qr.decoder.ErrorCorrectionLevel;
  const Version = w69b.qr.decoder.Version;

  /**
   * Encapsulates a block of data within a QR Code. QR Codes may split their data into
   * multiple blocks, each of which is a unit of data and error-correction codewords. Each
   * is represented by an instance of this class.
   *
   * @constructor
   * @param {number} numDataCodewords
   * @param {!Int8Array} codewords
   */
  w69b.qr.decoder.DataBlock = function(numDataCodewords, codewords) {
    /** @private */
    this.numDataCodewords = numDataCodewords;
    /** @private */
    this.codewords = codewords;
  };
  const DataBlock = w69b.qr.decoder.DataBlock;
  const pro = DataBlock.prototype;

  /**
   * When QR Codes use multiple data blocks, they are actually interleaved.
   * That is, the first byte of data block 1 to n is written, then the second
   * bytes, and so on. This method will separate the data into original blocks.
   *
   * @param {!Int8Array} rawCodewords bytes as read directly from the QR Code
   * @param {!Version} version version of the QR Code
   * @param {!ErrorCorrectionLevel} ecLevel error-correction level of the QR Code
   * @return {!Array.<!DataBlock>} containing original bytes, "de-interleaved" from
   *                               representation in the QR Code
   */
  DataBlock.getDataBlocks = function(rawCodewords, version, ecLevel) {
    if (rawCodewords.length !== version.totalCodewords) {
      throw new IllegalArgumentException();
    }

    // Figure out the number and size of data blocks used by this version and
    // error correction level
    const ecBlocks = version.getECBlocksForLevel(ecLevel);

    // First count the total number of data blocks
    let totalBlocks = 0;
    const ecBlockArray = ecBlocks.getECBlocks();
    for (let i = 0; i < ecBlockArray.length; i++) {
      totalBlocks += ecBlockArray[i].getCount();
    }

    // Now establish DataBlocks of the appropriate size and number of data
    // codewords
    /** @type {!Array.<!DataBlock>} */
    const result = new Array(totalBlocks);
    let numResultBlocks = 0;
    for (let j = 0; j < ecBlockArray.length; j++) {
      const ecBlock = ecBlockArray[j];
      for (let i = 0; i < ecBlock.getCount(); i++) {
        const numDataCodewords = ecBlock.getDataCodewords();
        const numBlockCodewords = ecBlocks.ecCodewordsPerBlock + numDataCodewords;
        result[numResultBlocks++] = new DataBlock(numDataCodewords,
          new Int8Array(numBlockCodewords));
      }
    }

    // All blocks have the same amount of data, except that the last n
    // (where n may be 0) have 1 more byte. Figure out where these start.
    const shorterBlocksTotalCodewords = result[0].codewords.length;
    let longerBlocksStartAt = result.length - 1;
    while (longerBlocksStartAt >= 0) {
      const numCodewords = result[longerBlocksStartAt].codewords.length;
      if (numCodewords === shorterBlocksTotalCodewords) {
        break;
      }
      longerBlocksStartAt--;
    }
    longerBlocksStartAt++;

    const shorterBlocksNumDataCodewords = shorterBlocksTotalCodewords -
      ecBlocks.ecCodewordsPerBlock;
    // The last elements of result may be 1 element longer;
    // first fill out as many elements as all of them have
    let rawCodewordsOffset = 0;
    for (let i = 0; i < shorterBlocksNumDataCodewords; i++) {
      for (let j = 0; j < numResultBlocks; j++) {
        result[j].codewords[i] = rawCodewords[rawCodewordsOffset++];
      }
    }
    // Fill out the last data block in the longer ones
    for (let j = longerBlocksStartAt; j < numResultBlocks; j++) {
      result[j].codewords[shorterBlocksNumDataCodewords] =
        rawCodewords[rawCodewordsOffset++];
    }
    // Now add in error correction blocks
    let max = result[0].codewords.length;
    for (let i = shorterBlocksNumDataCodewords; i < max; i++) {
      for (let j = 0; j < numResultBlocks; j++) {
        const iOffset = j < longerBlocksStartAt ? i : i + 1;
        result[j].codewords[iOffset] = rawCodewords[rawCodewordsOffset++];
      }
    }
    return result;
  };

  /**
   * @return {number}
   */
  pro.getNumDataCodewords = function() {
    return this.numDataCodewords;
  };

  /**
   * @return {!Int8Array}
   */
  pro.getCodewords = function() {
    return this.codewords;
  };
});
