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

goog.provide('w69b.oned.MultiFormatOneDReader');
goog.require('w69b.ArrayList');
goog.require('w69b.BarcodeFormat');
goog.require('w69b.DecodeHintType');
goog.require('w69b.NotFoundException');
goog.require('w69b.ReaderException');
goog.require('w69b.oned.CodaBarReader');
goog.require('w69b.oned.Code128Reader');
goog.require('w69b.oned.Code39Reader');
goog.require('w69b.oned.Code93Reader');
goog.require('w69b.oned.ITFReader');
goog.require('w69b.oned.MultiFormatUPCEANReader');
goog.require('w69b.oned.OneDReader');


goog.scope(function() {
  var ArrayList = w69b.ArrayList;
  var BarcodeFormat = w69b.BarcodeFormat;
  var DecodeHintType = w69b.DecodeHintType;
  var NotFoundException = w69b.NotFoundException;
  var ReaderException = w69b.ReaderException;
  var CodaBarReader = w69b.oned.CodaBarReader;
  var Code128Reader = w69b.oned.Code128Reader;
  var Code39Reader = w69b.oned.Code39Reader;
  var Code93Reader = w69b.oned.Code93Reader;
  var ITFReader =w69b.oned.ITFReader;
  var MultiFormatUPCEANReader = w69b.oned.MultiFormatUPCEANReader;
  var OneDReader = w69b.oned.OneDReader;

  /**
   * @constructor
   * @param {?Object<DecodeHintType,*>} hints
   * @extends {OneDReader}
   * @final
   */
  w69b.oned.MultiFormatOneDReader = function(hints) {
    /** @type {Array.<BarcodeFormat>} */
    var possibleFormats = hints && !!hints[DecodeHintType.POSSIBLE_FORMATS] ? hints[DecodeHintType.POSSIBLE_FORMATS] : null;
    var useCode39CheckDigit = Boolean(hints !== null && hints[DecodeHintType.ASSUME_CODE_39_CHECK_DIGIT]);
    /** @type {!ArrayList<OneDReader>} */
    var readers = new ArrayList();

    if (possibleFormats !== null) {
      if (possibleFormats.includes(BarcodeFormat.EAN_13) ||
          possibleFormats.includes(BarcodeFormat.UPC_A) ||
          possibleFormats.includes(BarcodeFormat.EAN_8) ||
          possibleFormats.includes(BarcodeFormat.UPC_E)) {
        readers.add(new MultiFormatUPCEANReader(hints));
      }
      if (possibleFormats.includes(BarcodeFormat.CODE_39)) {
        readers.add(new Code39Reader(useCode39CheckDigit));
      }
      if (possibleFormats.includes(BarcodeFormat.CODE_93)) {
        readers.add(new Code93Reader());
      }
      if (possibleFormats.includes(BarcodeFormat.CODE_128)) {
        readers.add(new Code128Reader());
      }
      if (possibleFormats.includes(BarcodeFormat.ITF)) {
        readers.add(new ITFReader());
      }
      if (possibleFormats.includes(BarcodeFormat.CODABAR)) {
         readers.add(new CodaBarReader());
      }
    }
    if (readers.isEmpty()) {
      readers.add(new MultiFormatUPCEANReader(hints));
      readers.add(new Code39Reader());
      readers.add(new CodaBarReader());
      readers.add(new Code93Reader());
      readers.add(new Code128Reader());
      readers.add(new ITFReader());
    }

    /**
     * @private
     * @type {!Array.<OneDReader>}
     */
    this.readers_ = readers.toArray();
  };
  var MultiFormatOneDReader = w69b.oned.MultiFormatOneDReader;
  goog.inherits(MultiFormatOneDReader, OneDReader);
  var pro = MultiFormatOneDReader.prototype;

  /**
   * @override
   */
  pro.decodeRow = function(rowNumber, row, hints) {
    for (let reader of this.readers_) {
      try {
        return reader.decodeRow(rowNumber, row, hints);
      } catch (err) {
        if (err instanceof ReaderException) {
          // continue
        } else {
          throw err;
        }
      }
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
