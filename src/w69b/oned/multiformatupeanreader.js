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

goog.provide('w69b.oned.MultiFormatUPCEANReader');
goog.require('java.util.ArrayList');
goog.require('w69b.BarcodeFormat');
goog.require('w69b.DecodeHintType');
goog.require('w69b.NotFoundException');
goog.require('w69b.ReaderException');
goog.require('w69b.Result');
goog.require('w69b.oned.EAN13Reader');
goog.require('w69b.oned.EAN8Reader');
goog.require('w69b.oned.OneDReader');
goog.require('w69b.oned.UPCAReader');
goog.require('w69b.oned.UPCEANReader');
goog.require('w69b.oned.UPCEReader');


goog.scope(function() {
  const ArrayList = java.util.ArrayList;
  const BarcodeFormat = w69b.BarcodeFormat;
  const DecodeHintType = w69b.DecodeHintType;
  const NotFoundException = w69b.NotFoundException;
  const ReaderException = w69b.ReaderException;
  const Result = w69b.Result;
  const EAN13Reader = w69b.oned.EAN13Reader;
  const EAN8Reader = w69b.oned.EAN8Reader;
  const OneDReader = w69b.oned.OneDReader;
  const UPCAReader = w69b.oned.UPCAReader;
  const UPCEANReader = w69b.oned.UPCEANReader;
  const UPCEReader = w69b.oned.UPCEReader;

  /**
   * @constructor
   * @param {?Object<!DecodeHintType,*>} hints
   * @extends {OneDReader}
   * @final
   */
  w69b.oned.MultiFormatUPCEANReader = function(hints) {
    var possibleFormats = /** @type {?Array.<!BarcodeFormat>} */ (hints && !!hints[DecodeHintType.POSSIBLE_FORMATS] ? hints[DecodeHintType.POSSIBLE_FORMATS] : null);
    /** @type {!ArrayList<!OneDReader>} */
    var readers = new ArrayList();

    if (possibleFormats !== null) {
      if (possibleFormats.includes(BarcodeFormat.EAN_13)) {
        readers.add(new EAN13Reader());
      } else if (possibleFormats.includes(BarcodeFormat.UPC_A)) {
        readers.add(new UPCAReader());
      }
      if (possibleFormats.includes(BarcodeFormat.EAN_8)) {
        readers.add(new EAN8Reader());
      }
      if (possibleFormats.includes(BarcodeFormat.UPC_E)) {
        readers.add(new UPCEReader());
      }
    }
    if (readers.isEmpty()) {
      readers.add(new EAN13Reader());
      // UPC-A is covered by EAN-13
      readers.add(new EAN8Reader());
      readers.add(new UPCEReader());
    }

    /**
     * @private
     * @type {!Array.<!OneDReader>}
     */
    this.readers_ = readers.toArray();
  };
  const MultiFormatUPCEANReader = w69b.oned.MultiFormatUPCEANReader;
  goog.inherits(MultiFormatUPCEANReader, OneDReader);
  const pro = MultiFormatUPCEANReader.prototype;

  /**
   * @override
   */
  pro.decodeRow = function(rowNumber, row, hints) {
    // Compute this location once and reuse it on multiple implementations
    var startGuardPattern = UPCEANReader.findStartGuardPattern(row);
    for (let reader of this.readers_) {
      let result;
      try {
        result = reader.decodeRow2(rowNumber, row, startGuardPattern, hints);
      } catch (err) {
        if (err instanceof ReaderException) {
          continue;
        } else {
          throw err;
        }
      }
      // Special case: a 12-digit code encoded in UPC-A is identical to a "0"
      // followed by those 12 digits encoded as EAN-13. Each will recognize such a code,
      // UPC-A as a 12-digit string and EAN-13 as a 13-digit string starting with "0".
      // Individually these are correct and their readers will both read such a code
      // and correctly call it EAN-13, or UPC-A, respectively.
      //
      // In this case, if we've been looking for both types, we'd like to call it
      // a UPC-A code. But for efficiency we only run the EAN-13 decoder to also read
      // UPC-A. So we special case it here, and convert an EAN-13 result to a UPC-A
      // result if appropriate.
      //
      // But, don't return UPC-A if UPC-A was not a requested format!
      let ean13MayBeUPCA =
          result.getBarcodeFormat() === BarcodeFormat.EAN_13 &&
              result.getText().charAt(0) === '0';
      let possibleFormats = /** @type {?Array.<!BarcodeFormat>} */ (hints && !!hints[DecodeHintType.POSSIBLE_FORMATS] ? hints[DecodeHintType.POSSIBLE_FORMATS] : null);
      let canReturnUPCA = possibleFormats === null || possibleFormats.includes(BarcodeFormat.UPC_A);

      if (ean13MayBeUPCA && canReturnUPCA) {
        // Transfer the metdata across
        let resultUPCA = new Result(result.getText().substring(1),
                                    result.getRawBytes(),
                                    result.getResultPoints(),
                                    BarcodeFormat.UPC_A);
        resultUPCA.putAllMetadata(result.getResultMetadata());
        return resultUPCA;
      }
      return result;
    }

    throw new NotFoundException();
  };

  /**
   * @override
   */
  pro.reset = function() {
    for (let reader of this.readers_) {
      reader.reset();
    }
  };
});
