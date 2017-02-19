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


define(['chai'], function(chai) {
  var assert = chai.assert;
  var BarcodeFormat = w69b.BarcodeFormat;
  var QRCodeWriter = w69b.qr.QRCodeWriter;

  describe('QRCodeWriter', function() {
    it('testQRCodeWriter', function() {
      // The QR should be multiplied up to fit, with extra padding if necessary
      var bigEnough = 256;
      var writer = new QRCodeWriter();
      var matrix = writer.encode("http://www.google.com/", BarcodeFormat.QR_CODE, bigEnough,
          bigEnough, null);
      assert.isNotNull(matrix);
      assert.equal(bigEnough, matrix.getWidth());
      assert.equal(bigEnough, matrix.getHeight());

      // The QR will not fit in this size, so the matrix should come back bigger
      var tooSmall = 20;
      matrix = writer.encode("http://www.google.com/", BarcodeFormat.QR_CODE, tooSmall,
          tooSmall, null);
      assert.isNotNull(matrix);
      assert.isTrue(tooSmall < matrix.getWidth());
      assert.isTrue(tooSmall < matrix.getHeight());

      // We should also be able to handle non-square requests by padding them
      var strangeWidth = 500;
      var strangeHeight = 100;
      matrix = writer.encode("http://www.google.com/", BarcodeFormat.QR_CODE, strangeWidth,
          strangeHeight, null);
      assert.isNotNull(matrix);
      assert.equal(strangeWidth, matrix.getWidth());
      assert.equal(strangeHeight, matrix.getHeight());
    });
  });
});
