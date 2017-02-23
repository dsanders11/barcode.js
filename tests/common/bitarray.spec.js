// javascript (closure) port (c) 2013 Manuel Braun (mb@w69b.com)
/**
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

/**
 * @author Sean Owen
 * ported to js by Manuel Braun
 */


define(['chai'], function(chai) {
  var assert = chai.assert;
  var BitArray = w69b.common.BitArray;

  describe('BitArray', function() {
    it('testGetSet', function() {
      var array = new BitArray(33);
      for (var i = 0; i < 33; i++) {
        assert.isFalse(array.get(i));
        array.set(i);
        assert.isTrue(array.get(i));
      }
    });

    it('testGetNextSet1', function() {
      var array = new BitArray(32);
      var i;
      for (i = 0; i < array.getSize(); i++) {
        assert.equal(32, array.getNextSet(i), i);
      }
      array = new BitArray(33);
      for (i = 0; i < array.getSize(); i++) {
        assert.equal(33, array.getNextSet(i), i);
      }
    });

    it('testGetNextSet2', function() {
      var array = new BitArray(33);
      array.set(31);
      var i;
      for (i = 0; i < array.getSize(); i++) {
        assert.equal(i <= 31 ? 31 : 33, array.getNextSet(i), i);
      }
      array = new BitArray(33);
      array.set(32);
      for (i = 0; i < array.getSize(); i++) {
        assert.equal(32, array.getNextSet(i), i);
      }
    });

    it('testGetNextSet3', function() {
      var array = new BitArray(63);
      array.set(31);
      array.set(32);
      for (var i = 0; i < array.getSize(); i++) {
        var expected;
        if (i <= 31) {
          expected = 31;
        } else if (i == 32) {
          expected = 32;
        } else {
          expected = 63;
        }
        assert.equal(expected, array.getNextSet(i), i);
      }
    });

    it('testGetNextSet4', function() {
      var array = new BitArray(63);
      array.set(33);
      array.set(40);
      for (var i = 0; i < array.getSize(); i++) {
        var expected;
        if (i <= 33) {
          expected = 33;
        } else if (i <= 40) {
          expected = 40;
        } else {
          expected = 63;
        }
        assert.equal(expected, array.getNextSet(i), i);
      }
    });

    it('testGetNextSet5', function() {
      function nextInt(max) {
        return Math.round(Math.random() * max);
      }

      var i, j;
      for (i = 0; i < 10; i++) {
        var array = new BitArray(1 + nextInt(100));
        var numSet = nextInt(20);
        for (j = 0; j < numSet; j++) {
          array.set(nextInt(array.getSize()));
        }
        var numQueries = nextInt(20);
        for (j = 0; j < numQueries; j++) {
          var query = nextInt(array.getSize());
          var expected = query;
          while (expected < array.getSize() && !array.get(expected)) {
            expected++;
          }
          var actual = array.getNextSet(query);
          if (actual != expected) {
            array.getNextSet(query);
          }
          assert.equal(expected, actual);
        }
      }
    });

    it('testSetBulk', function() {
      var i;
      var array = new BitArray(64);
      array.setBulk(32, 0xFFFF0000);
      for (i = 0; i < 48; i++) {
        assert.isFalse(array.get(i));
      }
      for (i = 48; i < 64; i++) {
        assert.isTrue(array.get(i));
      }
    });

    it('testSetRange', function() {
      var array = new BitArray(64);
      array.setRange(28, 36);
      assert.isFalse(array.get(27));
      for (let i = 28; i < 36; i++) {
        assert.isTrue(array.get(i));
      }
      assert.isFalse(array.get(36));
    });

    it('testClear', function() {
      var array = new BitArray(32);
      var i;
      for (i = 0; i < 32; i++) {
        array.set(i);
      }
      array.clear();
      for (i = 0; i < 32; i++) {
        assert.isFalse(array.get(i));
      }
    });

    it('testFlip', function() {
      var array = new BitArray(32);
      assert.isFalse(array.get(5));
      array.flip(5);
      assert.isTrue(array.get(5));
      array.flip(5);
      assert.isFalse(array.get(5));
    });

    it('testGetArray', function() {
      var array = new BitArray(64);
      array.set(0);
      array.set(63);
      var ints = array.getBitArray();
      assert.equal(1, ints[0]);
      assert.equal(-2147483648, ints[1]);
    });

    it('testIsRange', function() {
      var array = new BitArray(64);
      assert.isTrue(array.isRange(0, 64, false));
      assert.isFalse(array.isRange(0, 64, true));
      array.set(32);
      assert.isTrue(array.isRange(32, 33, true));
      array.set(31);
      assert.isTrue(array.isRange(31, 33, true));
      array.set(34);
      assert.isFalse(array.isRange(31, 35, true));
      var i;
      for (i = 0; i < 31; i++) {
        array.set(i);
      }
      assert.isTrue(array.isRange(0, 33, true));
      for (i = 33; i < 64; i++) {
        array.set(i);
      }
      assert.isTrue(array.isRange(0, 64, true));
      assert.isFalse(array.isRange(0, 64, false));
    });

    it('reverseAlgorithmTest', function() {
      var oldBits = new Int32Array([128, 256, 512, 6453324, 50934953]);
      for (let size = 1; size < 160; size++) {
        var newBitsOriginal = reverseOriginal(oldBits, size);
        var newBitArray = new BitArray(size);
        newBitArray.bits_ = oldBits.slice();
        newBitArray.reverse();
        var newBitsNew = newBitArray.getBitArray();
        assert.isTrue(
          arraysAreEqual(newBitsOriginal, newBitsNew, (size >> 5) + 1));
      }
    });

    /**
     * @param {Int32Array} oldBits
     * @param {number} size
     * @return {Int32Array}
     */
    function reverseOriginal(oldBits, size) {
      var newBits = new Int32Array(oldBits.length);
      for (let i = 0; i < size; i++) {
        if (bitSet(oldBits, size - i - 1)) {
          newBits[i >> 5] |= 1 << (i & 0x1F);
        }
      }
      return newBits;
    }

    /**
     * @param {Int32Array} bits
     * @param {number} i
     * @return {boolean}
     */
    function bitSet(bits, i) {
      return (bits[i >> 5] & (1 << (i & 0x1F))) !== 0;
    }

    /**
     * @param {Int32Array} left
     * @param {Int32Array} right
     * @param {number} size
     * @return {boolean}
     */
    function arraysAreEqual(left, right, size) {
      for (let i = 0; i < size; i++) {
        if (left[i] !== right[i]) {
          return false;
        }
      }
      return true;
    }
  });
});
