// javascript (closure) port (c) 2013 Manuel Braun (mb@w69b.com)
// javascript port (c) 2011 Lazar Laszlo (lazarsoft@gmail.com)
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

goog.provide('w69b.qr.decoder.DataMask');
goog.require('w69b.common.BitMatrix');
goog.require('w69b.qr.decoder.URShift');

goog.scope(function() {
  const BitMatrix = w69b.common.BitMatrix;
  const URShift = w69b.qr.decoder.URShift;

  const _ = w69b.qr.decoder.DataMask;

  /** @interface */
  _.DataMaskInterface = function() { };

  /**
   * Implementations of this method reverse the data masking process applied to a QR Code and
   * make its bits ready to read.
   * @param {BitMatrix} bits representation of QR Code bits
   * @param {number} dimension dimension of QR Code, represented by bits, being unmasked
   */
  _.DataMaskInterface.prototype.unmaskBitMatrix = function(bits, dimension) { };

  /**
   * @param {number} i idx.
   * @param {number} j idx.
   * @return {boolean} if position is masked.
   */
  _.DataMaskInterface.prototype.isMasked = function(i, j) { };


  /**
   * @param {number} reference mask number.
   * @return {!_.DataMaskInterface} data mask.
   */
  _.forReference = function(reference) {
    if (reference < 0 || reference > 7) {
      throw new Error();
    }
    return _.DATA_MASKS_[reference];
  };

  /**
   * @constructor
   * @implements {_.DataMaskInterface}
   */
  _.DataMask000 = function() { };

  /**
   * @override
   */
  _.DataMask000.prototype.unmaskBitMatrix = function(bits, dimension) {
    for (let i = 0; i < dimension; i++) {
      for (let j = 0; j < dimension; j++) {
        if (this.isMasked(i, j)) {
          bits.flip(j, i);
        }
      }
    }
  };

  /**
   * @override
   */
  _.DataMask000.prototype.isMasked = function(i, j) {
    return ((i + j) & 0x01) === 0;
  };

  /**
   * @constructor
   * @implements {_.DataMaskInterface}
   */
  _.DataMask001 = function() { };

  /**
   * @override
   */
  _.DataMask001.prototype.unmaskBitMatrix = function(bits, dimension) {
    for (let i = 0; i < dimension; i++) {
      for (let j = 0; j < dimension; j++) {
        if (this.isMasked(i, j)) {
          bits.flip(j, i);
        }
      }
    }
  };

  /**
   * @override
   */
  _.DataMask001.prototype.isMasked = function(i, j) {
    return (i & 0x01) === 0;
  };

  /**
   * @constructor
   * @implements {_.DataMaskInterface}
   */
  _.DataMask010 = function() { };

  /**
   * @override
   */
  _.DataMask010.prototype.unmaskBitMatrix = function(bits, dimension) {
    for (let i = 0; i < dimension; i++) {
      for (let j = 0; j < dimension; j++) {
        if (this.isMasked(i, j)) {
          bits.flip(j, i);
        }
      }
    }
  };

  /**
   * @override
   */
  _.DataMask010.prototype.isMasked = function(i, j) {
    return j % 3 === 0;
  };

  /**
   * @constructor
   * @implements {_.DataMaskInterface}
   */
  _.DataMask011 = function() { };

  /**
   * @override
   */
  _.DataMask011.prototype.unmaskBitMatrix = function(bits, dimension) {
    for (let i = 0; i < dimension; i++) {
      for (let j = 0; j < dimension; j++) {
        if (this.isMasked(i, j)) {
          bits.flip(j, i);
        }
      }
    }
  };

  /**
   * @override
   */
  _.DataMask011.prototype.isMasked = function(i, j) {
    return (i + j) % 3 === 0;
  };

  /**
   * @constructor
   * @implements {_.DataMaskInterface}
   */
  _.DataMask100 = function() { };

  /**
   * @override
   */
  _.DataMask100.prototype.unmaskBitMatrix = function(bits, dimension) {
    for (let i = 0; i < dimension; i++) {
      for (let j = 0; j < dimension; j++) {
        if (this.isMasked(i, j)) {
          bits.flip(j, i);
        }
      }
    }
  };

  /**
   * @override
   */
  _.DataMask100.prototype.isMasked = function(i, j) {
    return (((URShift(i, 1)) + (j / 3)) & 0x01) === 0;
  };

  /**
   * @constructor
   * @implements {_.DataMaskInterface}
   */
  _.DataMask101 = function() { };

  /**
   * @override
   */
  _.DataMask101.prototype.unmaskBitMatrix = function(bits, dimension) {
    for (let i = 0; i < dimension; i++) {
      for (let j = 0; j < dimension; j++) {
        if (this.isMasked(i, j)) {
          bits.flip(j, i);
        }
      }
    }
  };

  /**
   * @override
   */
  _.DataMask101.prototype.isMasked = function(i, j) {
    return (i * j) % 6 === 0;
  };

  /**
   * @constructor
   * @implements {_.DataMaskInterface}
   */
  _.DataMask110 = function() { };

  /**
   * @override
   */
  _.DataMask110.prototype.unmaskBitMatrix = function(bits, dimension) {
    for (let i = 0; i < dimension; i++) {
      for (let j = 0; j < dimension; j++) {
        if (this.isMasked(i, j)) {
          bits.flip(j, i);
        }
      }
    }
  };

  /**
   * @override
   */
  _.DataMask110.prototype.isMasked = function(i, j) {
    var temp = i * j;
    return ((temp + (temp % 3)) & 0x01) === 0;
  };

  /**
   * @constructor
   * @implements {_.DataMaskInterface}
   */
  _.DataMask111 = function() { };

  /**
   * @override
   */
  _.DataMask111.prototype.unmaskBitMatrix = function(bits, dimension) {
    for (let i = 0; i < dimension; i++) {
      for (let j = 0; j < dimension; j++) {
        if (this.isMasked(i, j)) {
          bits.flip(j, i);
        }
      }
    }
  };

  /**
   * @override
   */
  _.DataMask111.prototype.isMasked = function(i, j) {
    return ((i + j + ((i * j) % 3)) & 0x01) === 0;
  };

  /**
   * @type {Array.<!_.DataMaskInterface>}
   * @private
   */
  _.DATA_MASKS_ = new Array(new _.DataMask000(), new _.DataMask001(),
    new _.DataMask010(), new _.DataMask011(), new _.DataMask100(),
    new _.DataMask101(),
    new _.DataMask110(), new _.DataMask111());
});
