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

goog.provide('w69b.BarcodeFormat');


/**
 * Enumerates barcode formats known to this package. Please keep alphabetized.
 * @enum {number}
 */
w69b.BarcodeFormat = {
  CODABAR: 0,
  CODE_39: 1,
  CODE_93: 2,
  CODE_128: 3,
  EAN_8: 4,
  EAN_13: 5,
  ITF: 6,
  QR_CODE: 7,
  UPC_A: 8,
  UPC_E: 9,
  UPC_EAN_EXTENSION: 10
};

goog.exportSymbol('w69b.BarcodeFormat.CODABAR', w69b.BarcodeFormat.CODABAR);
goog.exportSymbol('w69b.BarcodeFormat.CODE_39', w69b.BarcodeFormat.CODE_39);
goog.exportSymbol('w69b.BarcodeFormat.CODE_93', w69b.BarcodeFormat.CODE_93);
goog.exportSymbol('w69b.BarcodeFormat.CODE_128', w69b.BarcodeFormat.CODE_128);
goog.exportSymbol('w69b.BarcodeFormat.EAN_8', w69b.BarcodeFormat.EAN_8);
goog.exportSymbol('w69b.BarcodeFormat.EAN_13', w69b.BarcodeFormat.EAN_13);
goog.exportSymbol('w69b.BarcodeFormat.ITF', w69b.BarcodeFormat.ITF);
goog.exportSymbol('w69b.BarcodeFormat.QR_CODE', w69b.BarcodeFormat.QR_CODE);
goog.exportSymbol('w69b.BarcodeFormat.UPC_A', w69b.BarcodeFormat.UPC_A);
goog.exportSymbol('w69b.BarcodeFormat.UPC_E', w69b.BarcodeFormat.UPC_E);
goog.exportSymbol('w69b.BarcodeFormat.UPC_EAN_EXTENSION', w69b.BarcodeFormat.UPC_EAN_EXTENSION);
