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



define(['chai'], function(chai) {
  var assert = chai.assert;
  var ImageDataLuminanceSource = w69b.ImageDataLuminanceSource;

  var RAW_DATA = new Uint8ClampedArray([
    0x00, 0x00, 0x00, 0x00,  0x7F, 0x7F, 0x7F, 0x00,  0xFF, 0xFF, 0xFF, 0x00,
    0xFF, 0x00, 0x00, 0x00,  0x00, 0xFF, 0x00, 0x00,  0x00, 0x00, 0xFF, 0x00,
    0x00, 0x00, 0xFF, 0x00,  0x00, 0xFF, 0x00, 0x00,  0xFF, 0x00, 0x00, 0x00]);
  var SOURCE = new ImageDataLuminanceSource(new ImageData(RAW_DATA, 3, 3));

  describe('ImageDataLuminanceSource', function() {
    it('testCrop', function() {
      assert.isTrue(SOURCE.isCropSupported());
      var cropped = SOURCE.crop(1, 1, 1, 1);
      assert.equal(1, cropped.getHeight());
      assert.equal(1, cropped.getWidth());
      assert.deepEqual(new Int8Array([0x7F]), cropped.getRow(0, null));
    });

    it('testMatrix', function() {
      var expected = new Int8Array([
        0x00, 0x7F, 0xFF, 0x3F, 0x7F, 0x3F, 0x3F, 0x7F, 0x3F]);
      assert.deepEqual(expected, SOURCE.getMatrix());
      var cropped = SOURCE.crop(0, 1, 3, 2);
      expected = new Int8Array([0x3F, 0x7F, 0x3F, 0x3F, 0x7F, 0x3F])
      assert.deepEqual(expected, cropped.getMatrix());
      cropped = SOURCE.crop(1, 1, 2, 2);
      expected = new Int8Array([0x7F, 0x3F, 0x7F, 0x3F])
      assert.deepEqual(expected, cropped.getMatrix());
    });

    it('testGetRow', function() {
      var expected = new Int8Array([0x3F, 0x7F, 0x3F]);
      assert.deepEqual(expected, SOURCE.getRow(2, new Int8Array(3)));
    });

    it('testToString', function() {
      assert.equal("#+ \n#+#\n#+#\n", SOURCE.toString());
    });
  });
});
