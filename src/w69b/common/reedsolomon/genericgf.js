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

goog.provide('w69b.common.reedsolomon.GenericGF');
goog.require('w69b.Integer');
goog.require('w69b.common.reedsolomon.GenericGFPoly');
goog.require('w69b.exceptions.ArithmeticException');
goog.require('w69b.exceptions.IllegalArgumentException');


goog.scope(function() {
  var Integer = w69b.Integer;
  var GenericGFPoly = w69b.common.reedsolomon.GenericGFPoly;
  var ArithmeticException = w69b.exceptions.ArithmeticException;
  var IllegalArgumentException = w69b.exceptions.IllegalArgumentException;

  /**
   * This class contains utility methods for performing mathematical operations
   * over the Galois Fields. Operations use a given primitive polynomial in
   * calculations.
   *
   * Throughout this package, elements of the GF are represented as an
   * {@code int} for convenience and speed (but at the cost of memory).
   *
   * Create a representation of GF(size) using the given primitive polynomial.
   *
   * @constructor
   * @param {number} primitive irreducible polynomial whose coefficients are
   *                           represented by the bits of an int, where the
   *                           least-significant bit represents the constant
   *                           coefficient
   * @param {number} size the size of the field
   * @param {number} b the factor b in the generator polynomial can be 0- or
   *                   1-based (g(x) = (x+a^b)(x+a^(b+1))...(x+a^(b+2t-1))).
   *                   In most cases it should be 1, but for QR code it is 0.
   * @final
   */
  w69b.common.reedsolomon.GenericGF = function(primitive, size, b) {
    /** @const {number} */
    this.primitive_ = primitive;
    /** @const {number} */
    this.size_ = size;
    /** @const {number} */
    this.generatorBase_ = b;

    this.expTable_ = new Int32Array(size);
    this.logTable_ = new Int32Array(size);
    var x = 1;
    for (let i = 0; i < size; i++) {
      this.expTable_[i] = x;
      x *= 2; // we're assuming the generator alpha is 2
      if (x >= size) {
        x ^= primitive;
        x &= size - 1;
      }
    }
    for (let i = 0; i < size - 1; i++) {
      this.logTable_[this.expTable_[i]] = i;
    }
    // logTable[0] == 0 but this should never be used
    this.zero_ = new GenericGFPoly(this, new Int32Array(1));
    this.one_ = new GenericGFPoly(this, Int32Array.of(1));
  };
  var GenericGF = w69b.common.reedsolomon.GenericGF;
  var pro = GenericGF.prototype;

  /** @const {!GenericGF} */
  GenericGF.AZTEC_DATA_12 = new GenericGF(0x1069, 4096, 1); // x^12 + x^6 + x^5 + x^3 + 1
  /** @const {!GenericGF} */
  GenericGF.AZTEC_DATA_10 = new GenericGF(0x409, 1024, 1); // x^10 + x^3 + 1
  /** @const {!GenericGF} */
  GenericGF.AZTEC_DATA_6 = new GenericGF(0x43, 64, 1); // x^6 + x + 1
  /** @const {!GenericGF} */
  GenericGF.AZTEC_PARAM = new GenericGF(0x13, 16, 1); // x^4 + x + 1
  /** @const {!GenericGF} */
  GenericGF.QR_CODE_FIELD_256 = new GenericGF(0x011D, 256, 0); // x^8 + x^4 + x^3 + x^2 + 1
  /** @const {!GenericGF} */
  GenericGF.DATA_MATRIX_FIELD_256 = new GenericGF(0x012D, 256, 1); // x^8 + x^5 + x^3 + x^2 + 1
  /** @const {!GenericGF} */
  GenericGF.AZTEC_DATA_8 = GenericGF.DATA_MATRIX_FIELD_256;
  /** @const {!GenericGF} */
  GenericGF.MAXICODE_FIELD_64 = GenericGF.AZTEC_DATA_6;

  /**
   * @return {!GenericGFPoly}
   */
  pro.getZero = function() {
    return this.zero_;
  };

  /**
   * @return {!GenericGFPoly}
   */
  pro.getOne = function() {
    return this.one_;
  };

  /**
   * @param {number} degree
   * @param {number} coefficient
   * @return {!GenericGFPoly} the monomial representing coefficient * x^degree
   */
  pro.buildMonomial = function(degree, coefficient) {
    if (degree < 0) {
      throw new IllegalArgumentException();
    }
    if (coefficient === 0) {
      return this.zero_;
    }
    var coefficients = new Int32Array(degree + 1);
    coefficients[0] = coefficient;
    return new GenericGFPoly(this, coefficients);
  };

  /**
   * Implements both addition and subtraction -- they are the same in GF(size).
   *
   * @param {number} a
   * @param {number} b
   * @return {number} sum/difference of a and b
   */
  GenericGF.addOrSubtract = function(a, b) {
    return a ^ b;
  };

  /**
   * @param {number} a
   * @return {number} 2 to the power of a in GF(size)
   */
  pro.exp = function(a) {
    return this.expTable_[a];
  };

  /**
   * @param {number} a
   * @return {number} base 2 log of a in GF(size)
   */
  pro.log = function(a) {
    if (a === 0) {
      throw new IllegalArgumentException();
    }
    return this.logTable_[a];
  };

  /**
   * @param {number} a
   * @return {number} multiplicative inverse of a
   */
  pro.inverse = function(a) {
    if (a === 0) {
      throw new ArithmeticException();
    }
    return this.expTable_[this.size_ - this.logTable_[a] - 1];
  };

  /**
   * @param {number} a
   * @param {number} b
   * @return {number} product of a and b in GF(size)
   */
  pro.multiply = function(a, b) {
    if (a === 0 || b === 0) {
      return 0;
    }
    return this.expTable_[(this.logTable_[a] + this.logTable_[b]) % (this.size_ - 1)];
  };

  /**
   * @return {number}
   */
  pro.getSize = function() {
    return this.size_;
  };

  /**
   * @return {number}
   */
  pro.getGeneratorBase = function() {
    return this.generatorBase_;
  };

  /**
   * @override
   */
  pro.toString = function() {
    return "GF(0x" + Integer.toHexString(this.primitive_) + ',' + this.size_ + ')';
  };
});
