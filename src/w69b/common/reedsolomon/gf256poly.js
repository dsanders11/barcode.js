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

goog.provide('w69b.common.reedsolomon.GF256Poly');
goog.provide('w69b.common.reedsolomon.WrongFieldError');
goog.require('goog.asserts');
goog.require('goog.debug.Error');

/**
 * <p>Represents a polynomial whose coefficients are elements of a GF.
 * Instances of this class are immutable.</p>
 *
 * <p>Much credit is due to William Rucklidge since portions of this code
 * are an indirect port of his C++ Reed-Solomon implementation.</p>
 *
 * @author Sean Owen
 */

goog.scope(function() {
  /**
   * GF256Polys do not have same GF256 field.
   * @constructor
   * @param {string=} opt_msg Additional message.
   * @extends {goog.debug.Error}
   */
  w69b.common.reedsolomon.WrongFieldError = function(opt_msg) {
    goog.base(this, opt_msg);
  };
  goog.inherits(w69b.common.reedsolomon.WrongFieldError, goog.debug.Error);
  var WrongFieldError = w69b.common.reedsolomon.WrongFieldError;


  /**
   * @constructor
   * @param {!w69b.common.reedsolomon.GF256} field field.
   * @param {Int32Array} coefficients coefficients.
   */
  w69b.common.reedsolomon.GF256Poly = function(field, coefficients) {
    goog.asserts.assert(coefficients !== null && coefficients.length !== 0);
    this.field = field;
    var coefficientsLength = coefficients.length;
    if (coefficientsLength > 1 && coefficients[0] === 0) {
      // Leading term must be non-zero for anything except the constant
      // polynomial "0"
      let firstNonZero = 1;
      while (firstNonZero < coefficientsLength && coefficients[firstNonZero] === 0) {
        firstNonZero++;
      }
      if (firstNonZero === coefficientsLength) {
        this.coefficients = field.zero.coefficients;
      } else {
        this.coefficients = new Int32Array(coefficientsLength - firstNonZero);
        for (let ci = 0; ci < this.coefficients.length; ci++) {
          this.coefficients[ci] = coefficients[firstNonZero + ci];
        }
      }
    } else {
      this.coefficients = coefficients;
    }
  };
  var GF256Poly = w69b.common.reedsolomon.GF256Poly;
  var pro = GF256Poly.prototype;

  /** @type {Int32Array} */
  pro.coefficients;

  /**
   * Calculates a ^ b.
   * @param {number} a number.
   * @param {number} b number.
   * @return {number} result.
   */
  GF256Poly.addOrSubtractScalar = function(a, b) {
    return a ^ b;
  };

  /**
   * @return {boolean}
   */
  pro.isZero = function() {
    return this.coefficients[0] === 0;
  };

  /**
   * @return {number} degree of this polynomial
   */
  pro.getDegree = function() {
    return this.coefficients.length - 1;
  };

  /**
   * @param {number} degree
   * @return {number} coefficient of x^degree term in this polynomial
   */
  pro.getCoefficient = function(degree) {
    return this.coefficients[this.coefficients.length - 1 - degree];
  };

  /**
   * @param {number} a
   * @return {number} evaluation of this polynomial at a given point
   */
  pro.evaluateAt = function(a) {
    if (a === 0) {
      // Just return the x^0 coefficient
      return this.getCoefficient(0);
    }
    var size = this.coefficients.length;
    if (a === 1) {
      // Just the sum of the coefficients
      let result = 0;
      for (let i = 0; i < size; i++) {
        result = GF256Poly.addOrSubtractScalar(result, this.coefficients[i]);
      }
      return result;
    }
    var result2 = this.coefficients[0];
    for (let i = 1; i < size; i++) {
      result2 = GF256Poly.addOrSubtractScalar(this.field.multiply(a, result2),
        this.coefficients[i]);
    }
    return result2;
  };

  /**
   * Add or substract other  poly.
   * @param {!w69b.common.reedsolomon.GF256Poly} other other poly.
   * @return {!w69b.common.reedsolomon.GF256Poly} result.
   */
  pro.addOrSubtract = function(other) {
    if (this.field !== other.field) {
      throw new WrongFieldError();
    }
    if (this.isZero()) {
      return other;
    }
    if (other.isZero()) {
      return this;
    }

    var smallerCoefficients = this.coefficients;
    var largerCoefficients = other.coefficients;
    if (smallerCoefficients.length > largerCoefficients.length) {
      let temp = smallerCoefficients;
      smallerCoefficients = largerCoefficients;
      largerCoefficients = temp;
    }
    var sumDiff = new Int32Array(largerCoefficients.length);
    var lengthDiff = largerCoefficients.length - smallerCoefficients.length;
    // Copy high-order terms only found in higher-degree polynomial's
    // coefficients
    for (let ci = 0; ci < lengthDiff; ci++)sumDiff[ci] =
      largerCoefficients[ci];

    for (let i = lengthDiff; i < largerCoefficients.length; i++) {
      sumDiff[i] = GF256Poly.addOrSubtractScalar(
        smallerCoefficients[i - lengthDiff],
        largerCoefficients[i]);
    }

    return new GF256Poly(this.field, sumDiff);
  };

  /**
   * Multiply with other poly.
   * @param {!w69b.common.reedsolomon.GF256Poly} other other poly.
   * @return {!w69b.common.reedsolomon.GF256Poly} result.
   */
  pro.multiply1 = function(other) {
    if (this.field !== other.field) {
      throw new WrongFieldError();
    }
    if (this.isZero() || other.isZero()) {
      return this.field.zero;
    }
    var aCoefficients = this.coefficients;
    var aLength = aCoefficients.length;
    var bCoefficients = other.coefficients;
    var bLength = bCoefficients.length;
    var product = new Int32Array(aLength + bLength - 1);
    for (let i = 0; i < aLength; i++) {
      let aCoeff = aCoefficients[i];
      for (let j = 0; j < bLength; j++) {
        product[i + j] = GF256Poly.addOrSubtractScalar(product[i + j],
          this.field.multiply(aCoeff, bCoefficients[j]));
      }
    }
    return new GF256Poly(this.field, product);
  };

  /**
   * Multiply with scalar.
   * @param {number} scalar other poly.
   * @return {w69b.common.reedsolomon.GF256Poly} result.
   */
  pro.multiply2 = function(scalar) {
    if (scalar === 0) {
      return this.field.zero;
    }
    if (scalar === 1) {
      return this;
    }
    var size = this.coefficients.length;
    var product = new Int32Array(size);
    for (let i = 0; i < size; i++) {
      product[i] = this.field.multiply(this.coefficients[i], scalar);
    }
    return new GF256Poly(this.field, product);
  };

  /**
   * TODO.
   * @param {number} degree
   * @param {number} coefficient
   * @return {!w69b.common.reedsolomon.GF256Poly} result.
   */
  pro.multiplyByMonomial = function(degree, coefficient) {
    goog.asserts.assert(degree >= 0);
    if (coefficient === 0) {
      return this.field.zero;
    }
    var size = this.coefficients.length;
    var product = new Int32Array(size + degree);
    for (let i = 0; i < size; i++) {
      product[i] = this.field.multiply(this.coefficients[i], coefficient);
    }
    return new GF256Poly(this.field, product);
  };

  /**
   * Divide by other poly.
   * @param {!w69b.common.reedsolomon.GF256Poly} other other poly.
   * @return {Array.<w69b.common.reedsolomon.GF256Poly>} result (quotient, remainder).
   */
  pro.divide = function(other) {
    if (this.field !== other.field) {
      throw new WrongFieldError();
    }
    goog.asserts.assert(!other.isZero());

    var quotient = this.field.zero;
    var remainder = this;

    var denominatorLeadingTerm = other.getCoefficient(other.getDegree());
    var inverseDenominatorLeadingTerm = this.field.inverse(
      denominatorLeadingTerm);

    while (remainder.getDegree() >= other.getDegree() && !remainder.isZero()) {
      let degreeDifference = remainder.getDegree() - other.getDegree();
      let scale = this.field.multiply(
        remainder.getCoefficient(remainder.getDegree()),
        inverseDenominatorLeadingTerm);
      let term = other.multiplyByMonomial(degreeDifference, scale);
      let iterationQuotient = this.field.buildMonomial(degreeDifference,
        scale);
      quotient = quotient.addOrSubtract(iterationQuotient);
      remainder = remainder.addOrSubtract(term);
    }

    return new Array(quotient, remainder);
  };

  /**
   * @override
   */
  pro.toString = function() {
    var result = [];
    for (let degree = this.getDegree(); degree >= 0; degree--) {
      let coefficient = this.getCoefficient(degree);
      if (coefficient !== 0) {
        if (coefficient < 0) {
          result.push(' - ');
          coefficient = -coefficient;
        } else {
          if (result.length > 0) {
            result.push(' + ');
          }
        }
        if (degree === 0 || coefficient !== 1) {
          let alphaPower = this.field.log(coefficient);
          if (alphaPower === 0) {
            result.push('1');
          } else if (alphaPower === 1) {
            result.push('a');
          } else {
            result.push('a^');
            result.push(alphaPower);
          }
        }
        if (degree !== 0) {
          if (degree === 1) {
            result.push('x');
          } else {
            result.push('x^');
            result.push(degree);
          }
        }
      }
    }
    return result.join('');
  };
});
