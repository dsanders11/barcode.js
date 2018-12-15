// javascript (closure) port (c) 2017 David Sanders (dsanders11@ucsbalum.com)
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

goog.module('w69b.MultiFormatReader');
goog.module.declareLegacyNamespace();

const BarcodeFormat = goog.require('w69b.BarcodeFormat');
const DecodeHintType = goog.require('w69b.DecodeHintType');
const MultiFormatOneDReader = goog.require('w69b.oned.MultiFormatOneDReader');
const NotFoundException = goog.require('w69b.NotFoundException');
const QRCodeReader = goog.require('w69b.qr.QRCodeReader');
const Reader = goog.require('w69b.Reader');
const ReaderException = goog.require('w69b.ReaderException');

/**
 * MultiFormatReader is a convenience class and the main entry point into the
 * library for most uses. By default it attempts to decode all barcode
 * formats that the library supports. Optionally, you can provide a hints
 * object to request different behavior, for example only decoding QR codes.
 * @final
 */
class MultiFormatReader extends Reader {
  constructor() {
    super();

    /**
     * @private
     * @type {?Object<!DecodeHintType,*>}
     */
    this.hints_ = null;

    /**
     * @private
     * @type {?Array.<!Reader>}
     */
    this.readers_ = null;
  }

  /**
   * This version of decode honors the intent of Reader.decode(BinaryBitmap) in
   * that it passes null as a hint to the decoders. However, that makes it
   * inefficient to call repeatedly. Use setHints() followed by decodeWithState()
   * for continuous scan applications.
   *
   * Decode an image using the hints provided. Does not honor existing state.
   *
   * @override
   */
  decode(image, opt_hints) {
    this.setHints(opt_hints ? opt_hints : null);
    return this.decodeInternal_(image);
  }

  /**
   * Decode an image using the state set up by calling setHints() previously.
   * Continuous scan clients will get a <b>large</b> speed increase by using
   * this instead of decode().
   *
   * @param {!w69b.BinaryBitmap} image The pixel data to decode
   * @return {!w69b.Result} The contents of the image
   * @throws {!NotFoundException} Any errors which occurred
   */
  decodeWithState(image) {
    // Make sure to set up the default state so we don't crash
    if (this.readers_ === null) {
      this.setHints(null);
    }
    return this.decodeInternal_(image);
  }

  /**
   * This method adds state to the MultiFormatReader. By setting the hints once,
   * subsequent calls to decodeWithState(image) can reuse the same set of
   * readers without reallocating memory. This is important for performance in
   * continuous scan clients.
   *
   * @param {?Object<!DecodeHintType,*>} hints The set of hints to use for
   *                                           subsequent calls to decode(image)
   */
  setHints(hints) {
    this.hints_ = hints;

    const tryHarder = hints && !!hints[DecodeHintType.TRY_HARDER];
    const formats = hints && !!hints[DecodeHintType.POSSIBLE_FORMATS] ? hints[DecodeHintType.POSSIBLE_FORMATS] : null;
    /** @type {!Array.<!Reader>} */
    const readers = [];
    if (formats !== null) {
      const addOneDReader = Boolean(
          formats.includes(BarcodeFormat.UPC_A) ||
          formats.includes(BarcodeFormat.UPC_E) ||
          formats.includes(BarcodeFormat.EAN_13) ||
          formats.includes(BarcodeFormat.EAN_8) ||
          formats.includes(BarcodeFormat.CODABAR) ||
          formats.includes(BarcodeFormat.CODE_39) ||
          formats.includes(BarcodeFormat.CODE_93) ||
          formats.includes(BarcodeFormat.CODE_128) ||
          formats.includes(BarcodeFormat.ITF));

      // Put 1D readers upfront in "normal" mode
      if (addOneDReader && !tryHarder) {
        readers.push(new MultiFormatOneDReader(hints));
      }
      if (formats.includes(BarcodeFormat.QR_CODE)) {
        readers.push(new QRCodeReader());
      }
      // At end in "try harder" mode
      if (addOneDReader && tryHarder) {
        readers.push(new MultiFormatOneDReader(hints));
      }
    }
    if (readers.length === 0) {
      if (!tryHarder) {
        readers.push(new MultiFormatOneDReader(hints));
      }

      readers.push(new QRCodeReader());

      if (tryHarder) {
        readers.push(new MultiFormatOneDReader(hints));
      }
    }
    this.readers_ = readers;
  }

  /**
   * @override
   */
  reset() {
    if (this.readers_ !== null) {
      for (const reader of this.readers_) {
        reader.reset();
      }
    }
  }

  /**
   * @private
   * @param {!w69b.BinaryBitmap} image
   * @return {!w69b.Result}
   * @throws {!NotFoundException}
   */
  decodeInternal_(image) {
    if (this.readers_ !== null) {
      for (const reader of this.readers_) {
        try {
          return reader.decode(image, this.hints_ || undefined);
        } catch (err) {
          if (err instanceof ReaderException) {
            // continue
          } else {
            throw err;
          }
        }
      }
    }
    throw NotFoundException.getNotFoundInstance();
  }
}

exports = MultiFormatReader;
