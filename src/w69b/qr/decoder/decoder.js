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

goog.provide('w69b.qr.decoder.Decoder');
goog.require('w69b.ChecksumException');
goog.require('w69b.DecodeHintType');
goog.require('w69b.FormatException');
goog.require('w69b.common.DecoderResult');
goog.require('w69b.common.reedsolomon.GF256');
goog.require('w69b.common.reedsolomon.ReedSolomonDecoder');
goog.require('w69b.common.reedsolomon.ReedSolomonException');
goog.require('w69b.qr.decoder.BitMatrixParser');
goog.require('w69b.qr.decoder.DataBlock');
goog.require('w69b.qr.decoder.DecodedBitStreamParser');
goog.require('w69b.qr.decoder.QRCodeDecoderMetaData');


goog.scope(function() {
  var ChecksumException = w69b.ChecksumException;
  var DecodeHintType = w69b.DecodeHintType;
  var FormatException = w69b.FormatException;
  var DecoderResult = w69b.common.DecoderResult;
  var GF256 = w69b.common.reedsolomon.GF256;
  var ReedSolomonException = w69b.common.reedsolomon.ReedSolomonException;
  var BitMatrixParser = w69b.qr.decoder.BitMatrixParser;
  var DataBlock = w69b.qr.decoder.DataBlock;
  var DecodedBitStreamParser = w69b.qr.decoder.DecodedBitStreamParser;
  var QRCodeDecoderMetaData = w69b.qr.decoder.QRCodeDecoderMetaData;

  /**
   * The main class which implements QR Code decoding -- as opposed to locating
   * and extracting the QR Code from an image.
   * @constructor
   * @final
   */
  w69b.qr.decoder.Decoder = function() {
    this.rsDecoder_ = new w69b.common.reedsolomon.ReedSolomonDecoder(GF256.QR_CODE_FIELD);
  };
  var Decoder = w69b.qr.decoder.Decoder;
  var pro = Decoder.prototype;

  /**
   * Given data and error-correction codewords received, possibly corrupted by errors, attempts to
   * correct the errors in-place using Reed-Solomon error correction.
   *
   * @param {!Int8Array} codewordBytes data and error correction codewords
   * @param {number} numDataCodewords number of codewords that are data bytes
   * @private
   */
  pro.correctErrors_ = function(codewordBytes, numDataCodewords) {
    var numCodewords = codewordBytes.length;
    // First read into an array of ints
    var codewordsInts = new Int32Array(numCodewords);
    for (let i = 0; i < numCodewords; i++) {
      codewordsInts[i] = codewordBytes[i] & 0xFF;
    }
    try {
      this.rsDecoder_.decode(
        codewordsInts, codewordBytes.length - numDataCodewords);
    } catch (err) {
      if (err instanceof ReedSolomonException) {
        throw new ChecksumException();
      }
      throw err;
    }
    // Copy back into array of bytes -- only need to worry about the bytes that
    // were data We don't care about errors in the error-correction codewords
    for (let i = 0; i < numDataCodewords; i++) {
      codewordBytes[i] = codewordsInts[i];
    }
  };

  /**
   * @param {!w69b.common.BitMatrix} bits booleans representing white/black QR Code modules
   * @param {Object<DecodeHintType,*>=} opt_hints decoding hints that should be used to influence decoding
   * @return {!DecoderResult} text and bytes encoded within the QR Code
   * @throws {FormatException}
   * @throws {ChecksumException}
   */
  pro.decode = function(bits, opt_hints) {
    // Construct a parser and read version, error-correction level
    var parser = new BitMatrixParser(bits);
    var fe = null;
    var ce = null;
    try {
      return this.decodeParser_(parser, opt_hints ? opt_hints : null);
    } catch (err) {
      if (err instanceof FormatException) {
        fe = err;
      }
      if (err instanceof ChecksumException) {
        ce = err;
      }
    }

    try {
      // Revert the bit matrix
      parser.remask();

      // Will be attempting a mirrored reading of the version and format info.
      parser.setMirror(true);

      // Preemptively read the version.
      parser.readVersion();

      // Preemptively read the format information.
      parser.readFormatInformation();

      /*
       * Since we're here, this means we have successfully detected some kind
       * of version and format information when mirrored. This is a good sign,
       * that the QR code may be mirrored, and we should try once more with a
       * mirrored content.
       */
      // Prepare for a mirrored reading.
      parser.mirror();

      var result = this.decodeParser_(parser, opt_hints ? opt_hints : null);

      // Success! Notify the caller that the code was mirrored.
      result.setOther(new QRCodeDecoderMetaData(true));

      return result;
    } catch (err) {
      if (err instanceof FormatException || err instanceof ChecksumException) {
        // Throw the exception from the original reading
        if (fe != null) {
          throw fe;
        }
        if (ce != null) {
          throw ce;
        }
      }
      throw err;
    }
  };

  /**
   * @param {!BitMatrixParser} parser
   * @param {Object<DecodeHintType,*>} hints
   * @return {!DecoderResult}
   * @throws {FormatException}
   * @throws {ChecksumException}
   * @private
   * @suppress {checkTypes}
   */
  pro.decodeParser_ = function(parser, hints) {
    var version = parser.readVersion();
    var ecLevel = parser.readFormatInformation().getErrorCorrectionLevel();

    // Read codewords
    var codewords = parser.readCodewords();
    // Separate into data blocks
    var dataBlocks = DataBlock.getDataBlocks(codewords, version, ecLevel);

    // Count total number of data bytes
    var totalBytes = 0;
    for (let dataBlock of dataBlocks) {
      totalBytes += dataBlock.getNumDataCodewords();
    }
    var resultBytes = new Int8Array(totalBytes);
    var resultOffset = 0;

    // Error-correct and copy data blocks together into a stream of bytes
    for (let dataBlock of dataBlocks) {
      let codewordBytes = dataBlock.getCodewords();
      let numDataCodewords = dataBlock.getNumDataCodewords();
      this.correctErrors_(codewordBytes, numDataCodewords);
      for (let i = 0; i < numDataCodewords; i++) {
        resultBytes[resultOffset++] = codewordBytes[i];
      }
    }

    // Decode the contents of that stream of bytes
    return DecodedBitStreamParser.decode(
      resultBytes, version, ecLevel, hints ? hints : undefined);
  }
});
