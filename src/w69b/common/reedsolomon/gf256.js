// javascript (closure) port (c) 2013 Manuel Braun (mb@w69b.com)
/*
 Ported to JavaScript by Lazar Laszlo 2011

 lazarsoft@gmail.com, www.lazarsoft.info

 */
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

goog.provide('w69b.common.reedsolomon.GF256');
goog.require('w69b.common.reedsolomon.GF256Poly');

goog.scope(function() {
  var GF256Poly = w69b.common.reedsolomon.GF256Poly;

  /**
   * @param {number} primitive number.
   * @constructor
   */
  w69b.common.reedsolomon.GF256 = function(primitive) {
    /** @type {Array.<number>} */
    this.expTable = new Array(256);
    /** @type {Array.<number>} */
    this.logTable = new Array(256);
    var x = 1;
    for (var i = 0; i < 256; i++) {
      this.expTable[i] = x;
      x <<= 1; // x = x * 2; we're assuming the generator alpha is 2
      if (x >= 0x100) {
        x ^= primitive;
      }
    }
    for (var i = 0; i < 255; i++) {
      this.logTable[this.expTable[i]] = i;
    }
    // logTable[0] == 0 but this should never be used
    var at0 = new Array(1);
    at0[0] = 0;
    this.zero = new GF256Poly(this, new Array(at0));
    var at1 = new Array(1);
    at1[0] = 1;
    this.one = new GF256Poly(this, new Array(at1));
  };
  var GF256 = w69b.common.reedsolomon.GF256;
  var pro = GF256.prototype;

  /** @type {!GF256Poly} */
  pro.zero;

  /** @type {!GF256Poly} */
  pro.one;

  /**
   * @param {number} degree
   * @param {number} coefficient
   * @return {!GF256Poly} poly.
   */
  pro.buildMonomial = function(degree, coefficient) {
    if (degree < 0) {
      throw Error();
    }
    if (coefficient == 0) {
      return this.zero;
    }
    var coefficients = new Array(degree + 1);
    for (var i = 0; i < coefficients.length; i++)coefficients[i] = 0;
    coefficients[0] = coefficient;
    return new GF256Poly(this, coefficients);
  };

  /**
   * @param {number} a
   * @return {number} 2 to the power of a
   */
  pro.exp = function(a) {
    return this.expTable[a];
  };

  /**
   * @param {number} a
   * @return {number} base 2 log of a
   */
  pro.log = function(a) {
    if (a == 0) {
      throw Error();
    }
    return this.logTable[a];
  };

  /**
   * @param {number} a
   * @return {number} multiplicative inverse of a
   */
  pro.inverse = function(a) {
    if (a == 0) {
      throw Error();
    }
    return this.expTable[255 - this.logTable[a]];
  };

  /**
   * @param {number} a
   * @param {number} b
   * @return {number} product of a and b
   */
  pro.multiply = function(a, b) {
    if (a == 0 || b == 0) {
      return 0;
    }
    if (a == 1) {
      return b;
    }
    if (b == 1) {
      return a;
    }
    return this.expTable[(this.logTable[a] + this.logTable[b]) % 255];
  };

  GF256.QR_CODE_FIELD = new GF256(0x011D);
  GF256.DATA_MATRIX_FIELD = new GF256(0x012D);
});
