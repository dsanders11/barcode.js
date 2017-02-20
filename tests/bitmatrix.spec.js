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
  var BitArray = w69b.common.BitArray;
  var BitMatrix = w69b.common.BitMatrix;

  var BIT_MATRIX_POINTS = [ 1, 2, 2, 0, 3, 1 ];

  describe('BitMatrix', function() {
    it('testGetSet', function() {
      var matrix = new BitMatrix(33);
      assert.equal(33, matrix.getHeight());
      for (var y = 0; y < 33; y++) {
        for (var x = 0; x < 33; x++) {
          if (y * x % 3 == 0) {
            matrix.set(x, y);
          }
        }
      }
      for (var y = 0; y < 33; y++) {
        for (var x = 0; x < 33; x++) {
          assert.equal(y * x % 3 == 0, matrix.get(x, y));
        }
      }
    });

    it('testSetRegion', function() {
      var matrix = new BitMatrix(5);
      matrix.setRegion(1, 1, 3, 3);
      for (var y = 0; y < 5; y++) {
        for (var x = 0; x < 5; x++) {
          assert.equal(y >= 1 && y <= 3 && x >= 1 && x <= 3, matrix.get(x, y));
        }
      }
    });

    it('testOnBit', function() {
      var matrix = new BitMatrix(5);
      assert.isNull(matrix.getTopLeftOnBit());
      assert.isNull(matrix.getBottomRightOnBit());
      matrix.setRegion(1, 1, 1, 1);
      assert.deepEqual(new Int32Array([ 1, 1 ]), matrix.getTopLeftOnBit());
      assert.deepEqual(new Int32Array([ 1, 1 ]), matrix.getBottomRightOnBit());
      matrix.setRegion(1, 1, 3, 2);
      assert.deepEqual(new Int32Array([ 1, 1 ]), matrix.getTopLeftOnBit());
      assert.deepEqual(new Int32Array([ 3, 2 ]), matrix.getBottomRightOnBit());
      matrix.setRegion(0, 0, 5, 5);
      assert.deepEqual(new Int32Array([ 0, 0 ]), matrix.getTopLeftOnBit());
      assert.deepEqual(new Int32Array([ 4, 4 ]), matrix.getBottomRightOnBit());
    });

    it('testRectangularMatrix', function() {
      var matrix = new BitMatrix(75, 20);
      assert.equal(75, matrix.getWidth());
      assert.equal(20, matrix.getHeight());
      matrix.set(10, 0);
      matrix.set(11, 1);
      matrix.set(50, 2);
      matrix.set(51, 3);
      matrix.flip(74, 4);
      matrix.flip(0, 5);

      // Should all be on
      assert.isTrue(matrix.get(10, 0));
      assert.isTrue(matrix.get(11, 1));
      assert.isTrue(matrix.get(50, 2));
      assert.isTrue(matrix.get(51, 3));
      assert.isTrue(matrix.get(74, 4));
      assert.isTrue(matrix.get(0, 5));

      // Flip a couple back off
      matrix.flip(50, 2);
      matrix.flip(51, 3);
      assert.isFalse(matrix.get(50, 2));
      assert.isFalse(matrix.get(51, 3));
    });

    it('testRectangularSetRegion', function() {
      var matrix = new BitMatrix(320, 240);
      assert.equal(320, matrix.getWidth());
      assert.equal(240, matrix.getHeight());
      matrix.setRegion(105, 22, 80, 12);

      // Only bits in the region should be on
      for (var y = 0; y < 240; y++) {
        for (var x = 0; x < 320; x++) {
          assert.equal(y >= 22 && y < 34 && x >= 105 && x < 185, matrix.get(x, y));
        }
      }
    });

    it('testGetRow', function() {
      var matrix = new BitMatrix(102, 5);
      for (var x = 0; x < 102; x++) {
        if ((x & 0x03) == 0) {
          matrix.set(x, 2);
        }
      }

      // Should allocate
      var array = matrix.getRow(2, null);
      assert.equal(102, array.getSize());

      // Should reallocate
      var array2 = new BitArray(60);
      array2 = matrix.getRow(2, array2);
      assert.equal(102, array2.getSize());

      // Should use provided object, with original BitArray size
      var array3 = new BitArray(200);
      array3 = matrix.getRow(2, array3);
      assert.equal(200, array3.getSize());

      for (var x = 0; x < 102; x++) {
        var on = (x & 0x03) == 0;
        assert.equal(on, array.get(x));
        assert.equal(on, array2.get(x));
        assert.equal(on, array3.get(x));
      }
    });

    it('testUnset', function() {
      var emptyMatrix = new BitMatrix(3, 3);
      var matrix = emptyMatrix.clone();
      matrix.set(1, 1);
      assert.notDeepEqual(emptyMatrix, matrix);
      matrix.unset(1, 1);
      assert.deepEqual(emptyMatrix, matrix);
      matrix.unset(1, 1);
      assert.deepEqual(emptyMatrix, matrix);
    });
  });

  var _ = {};

  _.matrixToString = function(result) {
    assert.equal(1, result.getHeight());
    var str = "";
    for (var i = 0; i < result.getWidth(); i++) {
      str += result.get(i, 0) ? '1' : '0';
    }
    return str;
  };

  return _;
});
