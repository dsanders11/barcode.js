// javascript (closure) port (c) 2013 Manuel Braun (mb@w69b.com)
/*
 Ported to JavaScript by Lazar Laszlo 2011

 lazarsoft@gmail.com, www.lazarsoft.info

 */
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
goog.require('w69b.exceptions.IllegalArgumentException');
goog.require('w69b.qr.decoder.ErrorCorrectionLevel');
goog.require('w69b.qr.decoder.Version');


goog.scope(function() {
  var ErrorCorrectionLevel = w69b.qr.decoder.ErrorCorrectionLevel;
  var Version = w69b.qr.decoder.Version;

  /**
   * Encapsulates a block of data within a QR Code. QR Codes may split their data into
   * multiple blocks, each of which is a unit of data and error-correction codewords. Each
   * is represented by an instance of this class.
   *
   * @constructor
   * @param {number} numDataCodewords
   * @param {Int8Array} codewords
   */
  w69b.qr.decoder.DataBlock = function(numDataCodewords, codewords) {
    this.numDataCodewords = numDataCodewords;
    this.codewords = codewords;
  };
  var DataBlock = w69b.qr.decoder.DataBlock;

  /**
   * When QR Codes use multiple data blocks, they are actually interleaved.
   * That is, the first byte of data block 1 to n is written, then the second
   * bytes, and so on. This method will separate the data into original blocks.
   *
   * @param {Int8Array} rawCodewords bytes as read directly from the QR Code
   * @param {Version} version version of the QR Code
   * @param {ErrorCorrectionLevel} ecLevel error-correction level of the QR Code
   * @return {Array.<DataBlock>} containing original bytes, "de-interleaved" from
   *                             representation in the QR Code
   */
  DataBlock.getDataBlocks = function(rawCodewords, version, ecLevel) {
    if (rawCodewords.length !== version.totalCodewords) {
      throw new w69b.exceptions.IllegalArgumentException();
    }

    // Figure out the number and size of data blocks used by this version and
    // error correction level
    var ecBlocks = version.getECBlocksForLevel(ecLevel);

    // First count the total number of data blocks
    var totalBlocks = 0;
    var ecBlockArray = ecBlocks.getECBlocks();
    for (let i = 0; i < ecBlockArray.length; i++) {
      totalBlocks += ecBlockArray[i].getCount();
    }

    // Now establish DataBlocks of the appropriate size and number of data
    // codewords
    /** @type {Array.<DataBlock>} */
    var result = new Array(totalBlocks);
    var numResultBlocks = 0;
    for (let j = 0; j < ecBlockArray.length; j++) {
      let ecBlock = ecBlockArray[j];
      for (let i = 0; i < ecBlock.getCount(); i++) {
        let numDataCodewords = ecBlock.getDataCodewords();
        let numBlockCodewords = ecBlocks.ecCodewordsPerBlock + numDataCodewords;
        result[numResultBlocks++] = new DataBlock(numDataCodewords,
          new Int8Array(numBlockCodewords));
      }
    }

    // All blocks have the same amount of data, except that the last n
    // (where n may be 0) have 1 more byte. Figure out where these start.
    var shorterBlocksTotalCodewords = result[0].codewords.length;
    var longerBlocksStartAt = result.length - 1;
    while (longerBlocksStartAt >= 0) {
      let numCodewords = result[longerBlocksStartAt].codewords.length;
      if (numCodewords === shorterBlocksTotalCodewords) {
        break;
      }
      longerBlocksStartAt--;
    }
    longerBlocksStartAt++;

    var shorterBlocksNumDataCodewords = shorterBlocksTotalCodewords -
      ecBlocks.ecCodewordsPerBlock;
    // The last elements of result may be 1 element longer;
    // first fill out as many elements as all of them have
    var rawCodewordsOffset = 0;
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
    var max = result[0].codewords.length;
    for (let i = shorterBlocksNumDataCodewords; i < max; i++) {
      for (let j = 0; j < numResultBlocks; j++) {
        let iOffset = j < longerBlocksStartAt ? i : i + 1;
        result[j].codewords[iOffset] = rawCodewords[rawCodewordsOffset++];
      }
    }
    return result;
  };
});
