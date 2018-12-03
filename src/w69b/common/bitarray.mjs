// javascript (closure) port (c) 2013 Manuel Braun (mb@w69b.com)
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

goog.declareModuleId('es6.w69b.common.BitArray');

const IllegalArgumentException = goog.require('java.lang.IllegalArgumentException');
const Integer = goog.require('java.lang.Integer');
const { assert } = goog.require('goog.asserts');

/**
 * @param {number} size
 * @return {Int32Array}
 */
function makeArray(size) {
  return new Int32Array((size + 31) >> 5);
}

/**
 * A simple, fast array of bits, represented compactly by an array of ints
 * internally.
 * @author Sean Owen
 */
export class BitArray {
  /**
   * @param {number=} opt_size size, defaults to 0.
   */
  constructor(opt_size) {
    /**
     * @private
     * @type {number}
     */
    this.size_ = opt_size || 0;
    /**
     * @type {Int32Array} bits.
     * @private
     */
    this.bits_ = opt_size ? makeArray(this.size_) : new Int32Array(1);
  }

  /**
   * @return {number}
   */
  getSize() {
    return this.size_;
  }

  /**
   * @return {number}
   */
  getSizeInBytes() {
    return (this.size_ + 7) >> 3;
  }

  /**
   * @param {number} size
   * @private
   */
  ensureCapacity(size) {
    if (size > this.bits_.length << 5) {
      const newBits = makeArray(size);
      newBits.set(this.bits_, 0);
      this.bits_ = newBits;
    }
  }

  /**
   * @param {number} i bit to get.
   * @return {boolean} true iff bit i is set.
   */
  get(i) {
    return (this.bits_[i >> 5] & (1 << (i & 0x1F))) !== 0;
  }

  /**
   * Sets bit i.
   * @param {number} i bit to set.
   */
  set(i) {
    this.bits_[i >> 5] |= 1 << (i & 0x1F);
  }

  /**
   * Flips bit i.
   *
   * @param {number} i bit to set.
   */
  flip(i) {
    this.bits_[i >> 5] ^= 1 << (i & 0x1F);
  }

  /**
   * @param {number} from first bit to check.
   * @return {number} index of first bit that is set, starting from the given
   * index, or size if none are set at or beyond this given index.
   * @see #getNextUnset(int)
   */
  getNextSet(from) {
    const bits = this.bits_;
    const size = this.size_;
    if (from >= size) {
      return size;
    }
    let bitsOffset = from >> 5;
    let currentBits = bits[bitsOffset];
    // mask off lesser bits first
    currentBits &= ~((1 << (from & 0x1F)) - 1);
    while (currentBits === 0) {
      if (++bitsOffset === bits.length) {
        return size;
      }
      currentBits = bits[bitsOffset];
    }
    const result = (bitsOffset << 5) + Integer.numberOfTrailingZeros(currentBits);
    return result > size ? size : result;
  }

  /**
   * @see #getNextSet(int)
   * @param {number} from
   * @return {number}
   */
  getNextUnset(from) {
    const bits = this.bits_;
    const size = this.size_;
    if (from >= size) {
      return size;
    }
    let bitsOffset = from >> 5;
    let currentBits = ~bits[bitsOffset];
    // mask off lesser bits first
    currentBits &= ~((1 << (from & 0x1F)) - 1);
    while (currentBits === 0) {
      if (++bitsOffset === bits.length) {
        return size;
      }
      currentBits = ~bits[bitsOffset];
    }
    const result = (bitsOffset << 5) + Integer.numberOfTrailingZeros(currentBits);
    return result > size ? size : result;
  }

  /**
   * Sets a block of 32 bits, starting at bit i.
   *
   * @param {number} i first bit to set.
   * @param {number} newBits the new value of the next 32 bits. Note again that
   * the least-significant bit corresponds to bit i, the next-least-significant
   * to i+1, and so on.
   */
  setBulk(i, newBits) {
    this.bits_[i >> 5] = newBits;
  }

  /**
   * Sets a range of bits.
   *
   * @param {number} start start of range, inclusive.
   * @param {number} end end of range, exclusive.
   */
  setRange(start, end) {
    assert(Number.isInteger(start));
    assert(Number.isInteger(end));

    if (end < start || start < 0 || end > this.size_) {
      throw new IllegalArgumentException();
    }
    if (end === start) {
      return;
    }
    // will be easier to treat this as the last actually set bit -- inclusive
    end--;
    const firstInt = start >> 5;
    const lastInt = end >> 5;
    for (let i = firstInt; i <= lastInt; i++) {
      const firstBit = i > firstInt ? 0 : start & 0x1F;
      const lastBit = i < lastInt ? 31 : end & 0x1F;
      let mask;
      if (firstBit === 0 && lastBit === 31) {
        mask = -1;
      } else {
        mask = 0;
        for (let j = firstBit; j <= lastBit; j++) {
          mask |= 1 << j;
        }
      }
      this.bits_[i] |= mask;
    }
  }

  /**
   * Clears all bits (sets to false).
   */
  clear() {
    this.bits_.fill(0);
  }

  /**
   * Efficient method to check if a range of bits is set, or not set.
   *
   * @param {number} start start of range, inclusive.
   * @param {number} end end of range, exclusive.
   * @param {boolean} value if true, checks that bits in range are set,
   * otherwise checks that they are not set.
   * @return {boolean} true iff all bits are set or not set in range, according
   * to value argument.
   */
  isRange(start, end, value) {
    assert(Number.isInteger(start));
    assert(Number.isInteger(end));

    if (end < start || start < 0 || end > this.size_) {
      throw new IllegalArgumentException();
    }
    if (end === start) {
      return true; // empty range matches
    }
    // will be easier to treat this as the last actually set bit -- inclusive
    end--;
    const firstInt = start >> 5;
    const lastInt = end >> 5;
    for (let i = firstInt; i <= lastInt; i++) {
      const firstBit = i > firstInt ? 0 : start & 0x1F;
      const lastBit = i < lastInt ? 31 : end & 0x1F;
      let mask;
      if (firstBit === 0 && lastBit === 31) {
        mask = -1;
      } else {
        mask = 0;
        for (let j = firstBit; j <= lastBit; j++) {
          mask |= 1 << j;
        }
      }

      // Return false if we're looking for 1s and the masked bits[i] isn't all
      // 1s (that is, equals the mask, or we're looking for 0s and the masked
      // portion is not all 0s
      if ((this.bits_[i] & mask) !== (value ? mask : 0)) {
        return false;
      }
    }
    return true;
  }

  /**
   * @param {boolean} bit
   */
  appendBit(bit) {
    this.ensureCapacity(this.size_ + 1);
    if (bit) {
      this.bits_[this.size_ >> 5] |= 1 << (this.size_ & 0x1F);
    }
    this.size_++;
  }

  /**
   * Appends the least-significant this.bits_, from value, in order from
   * most-significant to least-significant. For example, appending 6 this.bits_
   * from 0x000001E will append the this.bits_ 0, 1, 1, 1, 1, 0 in that order.
   * @param {number} value int containing bits to append
   * @param {number} numBits bits from value to append
   */
  appendBits(value, numBits) {
    assert(Number.isInteger(value));
    assert(Number.isInteger(numBits));

    if (numBits < 0 || numBits > 32) {
      throw new IllegalArgumentException("Num bits must be between 0 and 32");
    }
    this.ensureCapacity(this.size_ + numBits);
    for (let numBitsLeft = numBits; numBitsLeft > 0; numBitsLeft--) {
      this.appendBit(((value >> (numBitsLeft - 1)) & 0x01) === 1);
    }
  }

  /**
   * @param {BitArray} other other.
   */
  appendBitArray(other) {
    const otherSize = other.size_;
    this.ensureCapacity(this.size_ + otherSize);
    for (let i = 0; i < otherSize; i++) {
      this.appendBit(other.get(i));
    }
  }

  /**
   * @param {BitArray} other other.
   */
  xor(other) {
    if (this.size_ !== other.size_) {
      throw new IllegalArgumentException("Sizes don't match");
    }
    for (let i = 0; i < this.bits_.length; i++) {
      // The last byte could be incomplete (i.e. not have 8 this.bits_ in
      // it) but there is no problem since 0 XOR 0 == 0.
      this.bits_[i] ^= other.bits_[i];
    }
  }

  /**
   *
   * @param {number} bitOffset first bit to start writing.
   * @param {Int8Array} array array to write into. Bytes are written
   * most-significant byte first. This is the opposite of the internal
   * representation, which is exposed by {@link #getBitArray()}.
   * @param {number} offset position in array to start writing.
   * @param {number} numBytes how many bytes to write.
   */
  toBytes(bitOffset, array, offset, numBytes) {
    for (let i = 0; i < numBytes; i++) {
      let theByte = 0;
      for (let j = 0; j < 8; j++) {
        if (this.get(bitOffset)) {
          theByte |= 1 << (7 - j);
        }
        bitOffset++;
      }
      array[offset + i] = theByte;
    }
  }

  /**
   * @return {Int32Array} array of vars. The first element holds the first 32
   * bits, and the least significant bit is bit 0.
   */
  getBitArray() {
    return this.bits_;
  }

  /**
   * Reverses all bits in the array.
   */
  reverse() {
    const newBits = new Int32Array(this.bits_.length);
    const size = this.size_;
    for (let i = 0; i < size; i++) {
      if (this.get(size - i - 1)) {
        newBits[i >> 5] |= 1 << (i & 0x1F);
      }
    }
    this.bits_ = newBits;
  }

  /**
   * @override
   */
  toString() {
    const result = [];
    for (let i = 0; i < this.size_; i++) {
      if ((i & 0x07) === 0) {
        result.push(' ');
      }
      result.push(this.get(i) ? 'X' : '.');
    }
    return result.join('');
  }
}
