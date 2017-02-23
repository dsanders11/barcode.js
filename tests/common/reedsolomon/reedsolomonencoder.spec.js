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

goog.require('goog.array');
goog.require('w69b.common.reedsolomon.GF256');
goog.require('w69b.common.reedsolomon.ReedSolomonEncoder');
goog.require('w69b.common.reedsolomon.ReedSolomonDecoder');


define(['chai', '../../corrupt.spec.js'], function(chai, corrupt) {
  var assert = chai.assert;
  describe('ReedSomonEncoder test', function() {
    var ReedSolomonEncoder = w69b.common.reedsolomon.ReedSolomonEncoder;
    var ReedSolomonDecoder = w69b.common.reedsolomon.ReedSolomonDecoder;
    var GF256 = w69b.common.reedsolomon.GF256;

    function doTestQRCodeEncoding(dataBytes, expectedECBytes) {
      var toEncode = dataBytes.concat.apply(dataBytes,
        new Array(expectedECBytes));

      new ReedSolomonEncoder(GF256.QR_CODE_FIELD).encode(toEncode,
        expectedECBytes.length);
      assert.deepEqual(dataBytes, toEncode.slice(0, dataBytes.length));
      assert.deepEqual(expectedECBytes, toEncode.slice(dataBytes.length));
    }

    it('testISO18004Example', function() {
      var dataBytes = [
        0x10, 0x20, 0x0C, 0x56, 0x61, 0x80, 0xEC, 0x11,
        0xEC, 0x11, 0xEC, 0x11, 0xEC, 0x11, 0xEC, 0x11];
      var expectedECBytes = [
        0xA5, 0x24, 0xD4, 0xC1, 0xED, 0x36, 0xC7, 0x87,
        0x2C, 0x55];
      doTestQRCodeEncoding(dataBytes, expectedECBytes);
    });

    it('testQRCodeVersusDecoder', function() {
      var encoder = new ReedSolomonEncoder(GF256.QR_CODE_FIELD);
      var decoder = new ReedSolomonDecoder(GF256.QR_CODE_FIELD);
      for (var i = 0; i < 100; i++) {
        var size = 2 + i;
        var toEncode = new Array(size);
        var ecBytes = 1 + Math.round(Math.random() * (2 * (1 + size / 8)) - 0.5);
        ecBytes = Math.min(ecBytes, size - 1);
        var dataBytes = size - ecBytes;
        for (var j = 0; j < dataBytes; j++) {
          toEncode[j] = Math.round(Math.random() * 255);
        }
        var original = toEncode.slice(0, dataBytes);
        encoder.encode(toEncode, ecBytes);
        corrupt(toEncode, Math.floor(ecBytes / 2));
        decoder.decode(toEncode, ecBytes);
        assert.deepEqual(original, toEncode.slice(0, dataBytes));
      }
    });
  });
});
