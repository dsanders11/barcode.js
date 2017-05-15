// javascript (closure) port (c) 2013 Manuel Braun (mb@w69b.com)
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

goog.provide('w69b.qr.encoder.Encoder');
goog.require('java.lang.Integer');
goog.require('w69b.EncodeHintType');
goog.require('w69b.WriterException');
goog.require('w69b.common.BitArray');
goog.require('w69b.common.CharacterSetECI');
goog.require('w69b.common.reedsolomon.GenericGF');
goog.require('w69b.common.reedsolomon.ReedSolomonEncoder');
goog.require('w69b.common.stringutils');
goog.require('w69b.qr.decoder.ErrorCorrectionLevel');
goog.require('w69b.qr.decoder.Mode');
goog.require('w69b.qr.decoder.ModeEnum');
goog.require('w69b.qr.decoder.Version');
goog.require('w69b.qr.encoder.BlockPair');
goog.require('w69b.qr.encoder.ByteMatrix');
goog.require('w69b.qr.encoder.MaskUtil');
goog.require('w69b.qr.encoder.MatrixUtil');
goog.require('w69b.qr.encoder.QRCode');

goog.scope(function() {
  const Integer = java.lang.Integer;
  const ErrorCorrectionLevel = w69b.qr.decoder.ErrorCorrectionLevel;
  const BitArray = w69b.common.BitArray;
  const ByteMatrix = w69b.qr.encoder.ByteMatrix;
  const MatrixUtil = w69b.qr.encoder.MatrixUtil;
  const Version = w69b.qr.decoder.Version;
  const WriterException = w69b.WriterException;
  const BlockPair = w69b.qr.encoder.BlockPair;
  const QRCode = w69b.qr.encoder.QRCode;
  const MaskUtil = w69b.qr.encoder.MaskUtil;
  const Mode = w69b.qr.decoder.Mode;
  const ModeEnum = w69b.qr.decoder.ModeEnum;
  const EncodeHintType = w69b.EncodeHintType;
  const CharacterSetECI = w69b.common.CharacterSetECI;
  const GenericGF = w69b.common.reedsolomon.GenericGF;
  const ReedSolomonEncoder = w69b.common.reedsolomon.ReedSolomonEncoder;
  const stringutils = w69b.common.stringutils;


  /**
   * @author satorux@google.com (Satoru Takabayashi) - creator
   * @author dswitkin@google.com (Daniel Switkin) - ported from C+
   * @author mb@w69b.com (Manuel Braun) - ported to js
   */
  const _ = w69b.qr.encoder.Encoder;

  /**
   * The original table is defined in the table 5 of JISX0510:2004 (p.19).
   */
  const ALPHANUMERIC_TABLE = Int32Array.of(
    // 0x00-0x0f
    -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
    // 0x10-0x1f
    -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
    // 0x20-0x2f
    36, -1, -1, -1, 37, 38, -1, -1, -1, -1, 39, 40, -1, 41, 42, 43,
    // 0x30-0x3f
    0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 44, -1, -1, -1, -1, -1,
    // 0x40-0x4f
    -1, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24,
    // 0x50-0x5f
    25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, -1, -1, -1, -1, -1
  );

  const DEFAULT_BYTE_MODE_ENCODING = 'UTF-8';

  /**
   * The mask penalty calculation is complicated.  See Table 21 of
   * JISX0510:2004 (p.45) for details.  Basically it applies four rules and
   * summate all penalties.
   * @param {ByteMatrix} matrix matrix to calculate on
   * @return {number} mask penalty
   */
  _.calculateMaskPenalty = function(matrix) {
    return MaskUtil.applyMaskPenaltyRule1(matrix) +
      MaskUtil.applyMaskPenaltyRule2(matrix) +
      MaskUtil.applyMaskPenaltyRule3(matrix) +
      MaskUtil.applyMaskPenaltyRule4(matrix);
  };

  /**
   * Encode "bytes" with the error correction level "ecLevel". The encoding
   * mode will be chosen internally by chooseMode(). On success, store the
   * result in "qrCode".
   *
   * We recommend you to use QRCode.EC_LEVEL_L (the lowest level) for
   * "getECLevel" since our primary use is to show QR code on desktop screens.
   * We don't need very strong error correction for this purpose.
   *
   * Note that there is no way to encode bytes in MODE_KANJI. We might want to
   * add EncodeWithMode() with which clients can specify the encoding mode. For
   * now, we don't need the functionality.
   *
   * @param {string} content string.
   * @param {ErrorCorrectionLevel} ecLevel error correction level.
   * @param {Object=} opt_hints encoding hints.
   * @return {QRCode} representing the encoded QR code
   */
  _.encode = function(content, ecLevel, opt_hints) {
    // Determine what character encoding has been specified by the caller, if
    // any
    var encoding = opt_hints ? opt_hints[EncodeHintType.CHARACTER_SET] : null;
    var forceECI = opt_hints ? opt_hints[EncodeHintType.FORCE_ADD_ECI] : false;
    if (encoding === null) {
      encoding = DEFAULT_BYTE_MODE_ENCODING;
    }

    // Pick an encoding mode appropriate for the content. Note that this will
    // not attempt to use multiple modes / segments even if that were more
    // efficient. Twould be nice.
    var mode = _.chooseMode(content, encoding);

    // This will store the header information, like mode and
    // length, as well as "header" segments like an ECI segment.
    var headerBits = new BitArray();

    // Append ECI segment if applicable
    // Disabled in compat mode as some scanners seem to have problems with it.
    if (forceECI ||
      (mode === ModeEnum.BYTE && DEFAULT_BYTE_MODE_ENCODING !== encoding)) {
      let eci = CharacterSetECI.getCharacterSetECIByName(encoding);
      if (eci) {
        _.appendECI(eci, headerBits);
      }
    }

    // (With ECI in place,) Write the mode marker
    _.appendModeInfo(mode, headerBits);

    // Collect data within the main segment, separately, to count its size if
    // needed. Don't add it to main payload yet.
    var dataBits = new BitArray();
    _.appendBytes(content, mode, dataBits, encoding);

    // Hard part: need to know version to know how many bits length takes. But
    // need to know how many bits it takes to know version. First we take a
    // guess at version by assuming version will be the minimum, 1:

    var provisionalBitsNeeded = headerBits.getSize() +
      mode.getCharacterCountBits(Version.getVersionForNumber(1)) +
      dataBits.getSize();
    var provisionalVersion = _.chooseVersion(provisionalBitsNeeded, ecLevel);

    // Use that guess to calculate the right version. I am still not sure this
    // works in 100% of cases.

    var bitsNeeded = headerBits.getSize() +
      mode.getCharacterCountBits(provisionalVersion) +
      dataBits.getSize();
    var version = _.chooseVersion(bitsNeeded, ecLevel);

    var headerAndDataBits = new BitArray();
    headerAndDataBits.appendBitArray(headerBits);
    // Find "length" of main segment and write it
    var numLetters =
      (mode === ModeEnum.BYTE ? dataBits.getSizeInBytes() : content.length);
    _.appendLengthInfo(numLetters, version, mode, headerAndDataBits);
    // Put data together into the overall payload
    headerAndDataBits.appendBitArray(dataBits);

    var ecBlocks = version.getECBlocksForLevel(ecLevel);
    var numDataBytes = version.getTotalCodewords() -
      ecBlocks.getTotalECCodewords();

    // Terminate the bits properly.
    _.terminateBits(numDataBytes, headerAndDataBits);

    // Interleave data bits with error correction code.
    var finalBits = _.interleaveWithECBytes(headerAndDataBits,
      version.getTotalCodewords(),
      numDataBytes,
      ecBlocks.getNumBlocks());

    var qrCode = new QRCode();

    qrCode.setECLevel(ecLevel);
    qrCode.setMode(mode);
    qrCode.setVersion(version);

    //  Choose the mask pattern and set to "qrCode".
    var dimension = version.getDimensionForVersion();
    var matrix = new ByteMatrix(dimension, dimension);
    var maskPattern = _.chooseMaskPattern(finalBits, ecLevel, version, matrix);
    qrCode.setMaskPattern(maskPattern);

    // Build the matrix and set it to "qrCode".
    MatrixUtil.buildMatrix(finalBits, ecLevel, version, maskPattern, matrix);
    qrCode.setMatrix(matrix);

    return qrCode;
  };

  /**
   * @param {number} code ascii code.
   * @return {number} the code point of the table used in alphanumeric mode or
   *  -1 if there is no corresponding code in the table.
   */
  _.getAlphanumericCode = function(code) {
    code = Number(code);
    if (code < ALPHANUMERIC_TABLE.length) {
      return ALPHANUMERIC_TABLE[code];
    }
    return -1;
  };


  /**
   * Choose the best mode by examining the content. Note that 'encoding' is
   * used as a hint;
   * if it is Shift_JIS, and the input is only double-byte Kanji, then we
   * return {@link Mode#KANJI}.
   * @param {string} content to encode.
   * @param {string=} opt_encoding optional encoding.
   * @return {Mode} best mode
   */
  _.chooseMode = function(content, opt_encoding) {
    if ('Shift_JIS' === opt_encoding) {
      // Choose Kanji mode if all input are double-byte characters
      return _.isOnlyDoubleByteKanji(content) ? ModeEnum.KANJI : ModeEnum.BYTE;
    }
    var hasNumeric = false;
    var hasAlphanumeric = false;
    var zeroChar = '0'.charCodeAt(0);
    var nineChar = '9'.charCodeAt(0);
    for (let i = 0; i < content.length; ++i) {
      let c = content.charCodeAt(i);
      if (c >= zeroChar && c <= nineChar) {
        hasNumeric = true;
      } else if (_.getAlphanumericCode(c) !== -1) {
        hasAlphanumeric = true;
      } else {
        return ModeEnum.BYTE;
      }
    }
    if (hasAlphanumeric) {
      return ModeEnum.ALPHANUMERIC;
    }
    if (hasNumeric) {
      return ModeEnum.NUMERIC;
    }
    return ModeEnum.BYTE;
  };

  /**
   * @param {string} content
   * @return {boolean}
   */
  _.isOnlyDoubleByteKanji = function(content) {
    var bytes = [];
    try {
      bytes = stringutils.stringToBytes(content, 'Shift_JIS');
    } catch (uee) {
      return false;
    }
    var length = bytes.length;
    if (length % 2 !== 0) {
      return false;
    }
    for (let i = 0; i < length; i += 2) {
      let byte1 = bytes[i] & 0xFF;
      if ((byte1 < 0x81 || byte1 > 0x9F) && (byte1 < 0xE0 || byte1 > 0xEB)) {
        return false;
      }
    }
    return true;
  };

  /**
   * @param {BitArray} bits
   * @param {ErrorCorrectionLevel} ecLevel
   * @param {Version} version
   * @param {ByteMatrix} matrix
   * @return {number}
   */
  _.chooseMaskPattern = function(bits, ecLevel, version, matrix) {

    var minPenalty = Integer.MAX_VALUE;  // Lower penalty is better.
    var bestMaskPattern = -1;
    // We try all mask patterns to choose the best one.
    for (let maskPattern = 0; maskPattern < QRCode.NUM_MASK_PATTERNS;
         maskPattern++) {
      MatrixUtil.buildMatrix(bits, ecLevel, version, maskPattern, matrix);
      let penalty = _.calculateMaskPenalty(matrix);
      if (penalty < minPenalty) {
        minPenalty = penalty;
        bestMaskPattern = maskPattern;
      }
    }
    return bestMaskPattern;
  };

  /**
   * @param {number} numInputBits
   * @param {ErrorCorrectionLevel} ecLevel
   * @return {Version}
   */
  _.chooseVersion = function(numInputBits, ecLevel) {
    // In the following comments, we use numbers of Version 7-H.
    for (let versionNum = 1; versionNum <= 40; versionNum++) {
      let version = Version.getVersionForNumber(versionNum);
      // numBytes = 196
      let numBytes = version.getTotalCodewords();
      // getNumECBytes = 130
      let ecBlocks = version.getECBlocksForLevel(ecLevel);
      let numEcBytes = ecBlocks.getTotalECCodewords();
      // getNumDataBytes = 196 - 130 = 66
      let numDataBytes = numBytes - numEcBytes;
      let totalInputBytes = (numInputBits + 7) >> 3;
      if (numDataBytes >= totalInputBytes) {
        return version;
      }
    }
    throw new WriterException('Data too big');
  };

  /**
   * Terminate bits as described in 8.4.8 and 8.4.9 of JISX0510:2004 (p.24).
   * @param {number} numDataBytes
   * @param {BitArray} bits
   */
  _.terminateBits = function(numDataBytes, bits) {
    var capacity = numDataBytes << 3;
    if (bits.getSize() > capacity) {
      throw new WriterException('data bits cannot fit in the QR Code' +
        bits.getSize() + ' > ' + capacity);
    }
    for (let i = 0; i < 4 && bits.getSize() < capacity; ++i) {
      bits.appendBit(false);
    }
    // Append termination bits. See 8.4.8 of JISX0510:2004 (p.24) for details.
    // If the last byte isn't 8-bit aligned, we'll add padding bits.
    var numBitsInLastByte = bits.getSize() & 0x07;
    if (numBitsInLastByte > 0) {
      for (let i = numBitsInLastByte; i < 8; i++) {
        bits.appendBit(false);
      }
    }
    // If we have more space, we'll fill the space with padding patterns
    // defined in 8.4.9 (p.24).
    var numPaddingBytes = numDataBytes - bits.getSizeInBytes();
    for (let i = 0; i < numPaddingBytes; ++i) {
      bits.appendBits((i & 0x01) === 0 ? 0xEC : 0x11, 8);
    }
    if (bits.getSize() !== capacity) {
      throw new WriterException('Bits size does not equal capacity');
    }
  };

  /**
   * Get number of data bytes and number of error correction bytes for block
   * id "blockID". Store the result in "numDataBytesInBlock", and
   * "numECBytesInBlock". See table 12 in 8.5.1 of JISX0510:2004 (p.30)
   *
   * @param {number} numTotalBytes
   * @param {number} numDataBytes
   * @param {number} numRSBlocks
   * @param {number} blockID
   * @param {Int32Array} numDataBytesInBlock
   * @param {Int32Array} numECBytesInBlock
   */
  _.getNumDataBytesAndNumECBytesForBlockID = function(numTotalBytes,
                                                      numDataBytes,
                                                      numRSBlocks, blockID,
                                                      numDataBytesInBlock,
                                                      numECBytesInBlock) {
    if (blockID >= numRSBlocks) {
      throw new WriterException('Block ID too large');
    }
    // numRsBlocksInGroup2 = 196 % 5 = 1
    var numRsBlocksInGroup2 = numTotalBytes % numRSBlocks;
    // numRsBlocksInGroup1 = 5 - 1 = 4
    var numRsBlocksInGroup1 = numRSBlocks - numRsBlocksInGroup2;
    // numTotalBytesInGroup1 = 196 / 5 = 39
    var numTotalBytesInGroup1 = Math.floor(numTotalBytes / numRSBlocks);
    // numTotalBytesInGroup2 = 39 + 1 = 40
    var numTotalBytesInGroup2 = numTotalBytesInGroup1 + 1;
    // numDataBytesInGroup1 = 66 / 5 = 13
    var numDataBytesInGroup1 = Math.floor(numDataBytes / numRSBlocks);
    // numDataBytesInGroup2 = 13 + 1 = 14
    var numDataBytesInGroup2 = numDataBytesInGroup1 + 1;
    // numEcBytesInGroup1 = 39 - 13 = 26
    var numEcBytesInGroup1 = numTotalBytesInGroup1 - numDataBytesInGroup1;
    // numEcBytesInGroup2 = 40 - 14 = 26
    var numEcBytesInGroup2 = numTotalBytesInGroup2 - numDataBytesInGroup2;
    // Sanity checks.
    // 26 = 26
    if (numEcBytesInGroup1 !== numEcBytesInGroup2) {
      throw new WriterException('EC bytes mismatch');
    }
    // 5 = 4 + 1.
    if (numRSBlocks !== numRsBlocksInGroup1 + numRsBlocksInGroup2) {
      throw new WriterException('RS blocks mismatch');
    }
    // 196 = (13 + 26) * 4 + (14 + 26) * 1
    if (numTotalBytes !==
      ((numDataBytesInGroup1 + numEcBytesInGroup1) *
        numRsBlocksInGroup1) +
        ((numDataBytesInGroup2 + numEcBytesInGroup2) *
          numRsBlocksInGroup2)) {
      throw new WriterException('Total bytes mismatch');
    }

    if (blockID < numRsBlocksInGroup1) {
      numDataBytesInBlock[0] = numDataBytesInGroup1;
      numECBytesInBlock[0] = numEcBytesInGroup1;
    } else {
      numDataBytesInBlock[0] = numDataBytesInGroup2;
      numECBytesInBlock[0] = numEcBytesInGroup2;
    }
  };

  /**
   * Interleave "bits" with corresponding error correction bytes. On success,
   * store the result in "result". The interleave rule is complicated. See 8.6
   * of JISX0510:2004 (p.37) for details.
   * @param {BitArray} bits
   * @param {number} numTotalBytes
   * @param {number} numDataBytes
   * @param {number} numRSBlocks
   * @return {BitArray}
   * @throws {WriterException}
   */
  _.interleaveWithECBytes = function(bits, numTotalBytes, numDataBytes,
                                     numRSBlocks) {

    // "bits" must have "getNumDataBytes" bytes of data.
    if (bits.getSizeInBytes() !== numDataBytes) {
      throw new WriterException('Number of bits and data bytes does not match');
    }

    // Step 1.  Divide data bytes into blocks and generate error correction
    // bytes for them. We'll store the divided data bytes blocks and error
    // correction bytes blocks into "blocks".
    var dataBytesOffset = 0;
    var maxNumDataBytes = 0;
    var maxNumEcBytes = 0;

    // Since, we know the number of reedsolomon blocks, we can initialize the
    // vector with the number.
    var blocks = [];

    for (let i = 0; i < numRSBlocks; ++i) {
      let numDataBytesInBlock = new Int32Array(1);
      let numEcBytesInBlock = new Int32Array(1);
      _.getNumDataBytesAndNumECBytesForBlockID(
        numTotalBytes, numDataBytes, numRSBlocks, i,
        numDataBytesInBlock, numEcBytesInBlock);

      let size = numDataBytesInBlock[0];
      let dataBytes = new Int8Array(size);
      bits.toBytes(8 * dataBytesOffset, dataBytes, 0, size);
      let ecBytes = _.generateECBytes(dataBytes, numEcBytesInBlock[0]);
      blocks.push(new BlockPair(dataBytes, ecBytes));

      maxNumDataBytes = Math.max(maxNumDataBytes, size);
      maxNumEcBytes = Math.max(maxNumEcBytes, ecBytes.length);
      dataBytesOffset += numDataBytesInBlock[0];
    }
    if (numDataBytes !== dataBytesOffset) {
      throw new WriterException('Data bytes does not match offset');
    }

    var result = new BitArray();

    // First, place data blocks.
    for (let i = 0; i < maxNumDataBytes; ++i) {
      blocks.forEach(
        /** @param {BlockPair} block */
        function(block) {
          var dataBytes = block.getDataBytes();
          if (i < dataBytes.length) {
            result.appendBits(dataBytes[i], 8);
          }
        }
      );
    }
    // Then, place error correction blocks.
    for (let i = 0; i < maxNumEcBytes; ++i) {
      blocks.forEach(
        /** @param {BlockPair} block */
        function(block) {
          var ecBytes = block.getErrorCorrectionBytes();
          if (i < ecBytes.length) {
            result.appendBits(ecBytes[i], 8);
          }
        }
      );
    }
    if (numTotalBytes !== result.getSizeInBytes()) {  // Should be same.
      throw new WriterException('Interleaving error: ' + numTotalBytes +
        ' and ' + result.getSizeInBytes() + ' differ.');
    }

    return result;
  };

  /**
   * @param {Int8Array} dataBytes bytes.
   * @param {number} numEcBytesInBlock num.
   * @return {Int8Array} bytes.
   */
  _.generateECBytes = function(dataBytes, numEcBytesInBlock) {
    var numDataBytes = dataBytes.length;
    var toEncode = new Int32Array(numDataBytes + numEcBytesInBlock);
    for (let i = 0; i < numDataBytes; i++) {
      toEncode[i] = dataBytes[i] & 0xFF;
    }
    new ReedSolomonEncoder(GenericGF.QR_CODE_FIELD_256).encode(toEncode,
      numEcBytesInBlock);

    var ecBytes = new Int8Array(numEcBytesInBlock);
    for (let i = 0; i < numEcBytesInBlock; i++) {
      ecBytes[i] = toEncode[numDataBytes + i];
    }
    return ecBytes;
  };

  /**
   * Append mode info. On success, store the result in "bits".
   * @param {Mode} mode
   * @param {BitArray} bits
   */
  _.appendModeInfo = function(mode, bits) {
    bits.appendBits(mode.getBits(), 4);
  };

  /**
   * Append length info. On success, store the result in "bits".
   * @param {number} numLetters
   * @param {Version} version
   * @param {Mode} mode
   * @param {BitArray} bits
   * @throws {WriterException}
   */
  _.appendLengthInfo = function(numLetters, version, mode, bits) {
    var numBits = mode.getCharacterCountBits(version);
    if (numLetters >= (1 << numBits)) {
      throw new WriterException(numLetters + ' is bigger than ' +
        ((1 << numBits) - 1));
    }
    bits.appendBits(numLetters, numBits);
  };

  /**
   * Append "bytes" in "mode" mode (encoding) into "bits".
   * On success, store the result in "bits".
   * @param {string} content
   * @param {Mode} mode
   * @param {BitArray} bits
   * @param {string} encoding
   * @throws {WriterException}
   */
  _.appendBytes = function(content, mode, bits, encoding) {
    switch (mode) {
      case ModeEnum.NUMERIC:
        _.appendNumericBytes(content, bits);
        break;
      case ModeEnum.ALPHANUMERIC:
        _.appendAlphanumericBytes(content, bits);
        break;
      case ModeEnum.BYTE:
        _.append8BitBytes(content, bits, encoding);
        break;
      case ModeEnum.KANJI:
        _.appendKanjiBytes(content, bits);
        break;
      default:
        throw new WriterException('Invalid mode: ' + mode);
    }
  };

  /**
   * @param {string} content
   * @param {BitArray} bits
   */
  _.appendNumericBytes = function(content, bits) {
    var length = content.length;
    var i = 0;
    var codeZero = '0'.charCodeAt(0);
    while (i < length) {
      let num1 = content.charCodeAt(i) - codeZero;
      if (i + 2 < length) {
        // Encode three numeric letters in ten bits.
        let num2 = content.charCodeAt(i + 1) - codeZero;
        let num3 = content.charCodeAt(i + 2) - codeZero;
        bits.appendBits(num1 * 100 + num2 * 10 + num3, 10);
        i += 3;
      } else if (i + 1 < length) {
        // Encode two numeric letters in seven bits.
        let num2 = content.charCodeAt(i + 1) - codeZero;
        bits.appendBits(num1 * 10 + num2, 7);
        i += 2;
      } else {
        // Encode one numeric letter in four bits.
        bits.appendBits(num1, 4);
        i++;
      }
    }
  };

  /**
   * @param {string} content
   * @param {BitArray} bits
   */
  _.appendAlphanumericBytes = function(content, bits) {
    var length = content.length;
    var i = 0;
    while (i < length) {
      let code1 = _.getAlphanumericCode(content.charCodeAt(i));
      if (code1 === -1) {
        throw new WriterException();
      }
      if (i + 1 < length) {
        let code2 = _.getAlphanumericCode(content.charCodeAt(i + 1));
        if (code2 === -1) {
          throw new WriterException();
        }
        // Encode two alphanumeric letters in 11 bits.
        bits.appendBits(code1 * 45 + code2, 11);
        i += 2;
      } else {
        // Encode one alphanumeric letter in six bits.
        bits.appendBits(code1, 6);
        i++;
      }
    }
  };

  /**
   * @param {string} content
   * @param {BitArray} bits
   * @param {string} encoding
   */
  _.append8BitBytes = function(content, bits, encoding) {
    var bytes;
    try {
      bytes = stringutils.stringToBytes(content, encoding);
    } catch (uee) {
      throw new WriterException(uee);
    }
    bytes.forEach(function(b) {
      bits.appendBits(b, 8);
    });
  };

  /**
   * @param {string} content
   * @param {BitArray} bits
   */
  _.appendKanjiBytes = function(content, bits) {
    var bytes;
    try {
      bytes = stringutils.stringToBytes(content, 'Shift_JIS');
    } catch (uee) {
      throw new WriterException(uee);
    }
    var length = bytes.length;
    for (let i = 0; i < length; i += 2) {
      let byte1 = bytes[i] & 0xFF;
      let byte2 = bytes[i + 1] & 0xFF;
      let code = (byte1 << 8) | byte2;
      let subtracted = -1;
      if (code >= 0x8140 && code <= 0x9ffc) {
        subtracted = code - 0x8140;
      } else if (code >= 0xe040 && code <= 0xebbf) {
        subtracted = code - 0xc140;
      }
      if (subtracted === -1) {
        throw new WriterException('Invalid byte sequence');
      }
      let encoded = ((subtracted >> 8) * 0xc0) + (subtracted & 0xff);
      bits.appendBits(encoded, 13);
    }
  };

  /**
   * @param {CharacterSetECI} eci
   * @param {BitArray} bits
   */
  _.appendECI = function(eci, bits) {
    bits.appendBits(ModeEnum.ECI.getBits(), 4);
    // This is correct for values up to 127, which is all we need now.
    bits.appendBits(eci.getValue(), 8);
  };
});
