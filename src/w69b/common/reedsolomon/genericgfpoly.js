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

goog.provide('w69b.common.reedsolomon.GenericGFPoly');
goog.require('java.lang.IllegalArgumentException');
goog.require('java.lang.StringBuilder');


goog.scope(function() {
  const IllegalArgumentException = java.lang.IllegalArgumentException;
  const StringBuilder = java.lang.StringBuilder;

  /**
   * Represents a polynomial whose coefficients are elements of a GF.
   * Instances of this class are immutable.
   *
   * Much credit is due to William Rucklidge since portions of this code are an
   * indirect port of his C++ Reed-Solomon implementation.
   *
   * @constructor
   * @param {!w69b.common.reedsolomon.GenericGF} field the {@link GenericGF}
   *                                                   instance representing the
   *                                                   field to use to perform
   *                                                   computations
   * @param {!Int32Array} coefficients coefficients as ints representing
   *                                   elements of GF(size), arranged from most
   *                                   significant (highest-power term)
   *                                   coefficient to least significant
   * @throws {IllegalArgumentException} if argument is null or empty, or if
   *                                    leading coefficient is 0 and this is
   *                                    not a constant polynomial (that is, it
   *                                    is not the monomial "0")
   * @final
   */
  w69b.common.reedsolomon.GenericGFPoly = function(field, coefficients) {
    if (coefficients.length === 0) {
      throw new IllegalArgumentException();
    }
    this.field_ = field;
    var coefficientsLength = coefficients.length;
    if (coefficientsLength > 1 && coefficients[0] === 0) {
      // Leading term must be non-zero for anything except the constant polynomial "0"
      let firstNonZero = 1;
      while (firstNonZero < coefficientsLength && coefficients[firstNonZero] === 0) {
        firstNonZero++;
      }
      if (firstNonZero === coefficientsLength) {
        this.coefficients_ = new Int32Array(1);
      } else {
        this.coefficients_ = new Int32Array(coefficientsLength - firstNonZero);
        this.coefficients_.set(coefficients.slice(firstNonZero, firstNonZero + this.coefficients_.length));
      }
    } else {
      this.coefficients_ = coefficients;
    }
  };
  const GenericGFPoly = w69b.common.reedsolomon.GenericGFPoly;
  const pro = GenericGFPoly.prototype;

  /**
   * @return {!Int32Array}
   */
  pro.getCoefficients = function() {
    return this.coefficients_;
  };

  /**
   * @return {number} degree of this polynomial
   */
  pro.getDegree = function() {
    return this.coefficients_.length - 1;
  };

  /**
   * @return {boolean} true iff this polynomial is the monomial "0"
   */
  pro.isZero = function() {
    return this.coefficients_[0] === 0;
  };

  /**
   * @param {number} degree
   * @return {number} coefficient of x^degree term in this polynomial
   */
  pro.getCoefficient = function(degree) {
    return this.coefficients_[this.coefficients_.length - 1 - degree];
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
    if (a === 1) {
      // Just the sum of the coefficients
      let result = 0;
      for (let coefficient of this.coefficients_) {
        result = w69b.common.reedsolomon.GenericGF.addOrSubtract(result, coefficient);
      }
      return result;
    }
    var result = this.coefficients_[0];
    var size = this.coefficients_.length;
    for (let i = 1; i < size; i++) {
      result = w69b.common.reedsolomon.GenericGF.addOrSubtract(
        this.field_.multiply(a, result), this.coefficients_[i]);
    }
    return result;
  };

  /**
   * @param {!GenericGFPoly} other
   * @return {!GenericGFPoly}
   */
  pro.addOrSubtract = function(other) {
    if (this.field_ !== other.field_) {
      throw new IllegalArgumentException("GenericGFPolys do not have same GenericGF field");
    }
    if (this.isZero()) {
      return other;
    }
    if (other.isZero()) {
      return this;
    }

    var smallerCoefficients = this.coefficients_;
    var largerCoefficients = other.coefficients_;
    if (smallerCoefficients.length > largerCoefficients.length) {
      let temp = smallerCoefficients;
      smallerCoefficients = largerCoefficients;
      largerCoefficients = temp;
    }
    var sumDiff = new Int32Array(largerCoefficients.length);
    var lengthDiff = largerCoefficients.length - smallerCoefficients.length;
    // Copy high-order terms only found in higher-degree polynomial's coefficients
    sumDiff.set(largerCoefficients.slice(0, lengthDiff));

    for (let i = lengthDiff; i < largerCoefficients.length; i++) {
      sumDiff[i] = w69b.common.reedsolomon.GenericGF.addOrSubtract(
        smallerCoefficients[i - lengthDiff], largerCoefficients[i]);
    }

    return new GenericGFPoly(this.field_, sumDiff);
  };

  /**
   * @param {!GenericGFPoly} other
   * @return {!GenericGFPoly}
   */
  pro.multiply1 = function(other) {
    if (this.field_ !== other.field_) {
      throw new IllegalArgumentException("GenericGFPolys do not have same GenericGF field");
    }
    if (this.isZero() || other.isZero()) {
      return this.field_.getZero();
    }
    var aCoefficients = this.coefficients_;
    var aLength = aCoefficients.length;
    var bCoefficients = other.coefficients_;
    var bLength = bCoefficients.length;
    var product = new Int32Array(aLength + bLength - 1);
    for (let i = 0; i < aLength; i++) {
      let aCoeff = aCoefficients[i];
      for (let j = 0; j < bLength; j++) {
        product[i + j] = w69b.common.reedsolomon.GenericGF.addOrSubtract(
          product[i + j], this.field_.multiply(aCoeff, bCoefficients[j]));
      }
    }
    return new GenericGFPoly(this.field_, product);
  };

  /**
   * @param {number} scalar
   * @return {!GenericGFPoly}
   */
  pro.multiply2 = function(scalar) {
    if (scalar === 0) {
      return this.field_.getZero();
    }
    if (scalar === 1) {
      return this;
    }
    var size = this.coefficients_.length;
    var product = new Int32Array(size);
    for (let i = 0; i < size; i++) {
      product[i] = this.field_.multiply(this.coefficients_[i], scalar);
    }
    return new GenericGFPoly(this.field_, product);
  };

  /**
   * @param {number} degree
   * @param {number} coefficient
   * @return {!GenericGFPoly}
   */
  pro.multiplyByMonomial = function(degree, coefficient) {
    if (degree < 0) {
      throw new IllegalArgumentException();
    }
    if (coefficient === 0) {
      return this.field_.getZero();
    }
    var size = this.coefficients_.length;
    var product = new Int32Array(size + degree);
    for (let i = 0; i < size; i++) {
      product[i] = this.field_.multiply(this.coefficients_[i], coefficient);
    }
    return new GenericGFPoly(this.field_, product);
  };

  /**
   * @param {!GenericGFPoly} other
   * @return {!Array.<!GenericGFPoly>}
   */
  pro.divide = function(other) {
    if (this.field_ !== other.field_) {
      throw new IllegalArgumentException("GenericGFPolys do not have same GenericGF field");
    }
    if (other.isZero()) {
      throw new IllegalArgumentException("Divide by 0");
    }

    var quotient = this.field_.getZero();
    var remainder = this;

    var denominatorLeadingTerm = other.getCoefficient(other.getDegree());
    var inverseDenominatorLeadingTerm = this.field_.inverse(denominatorLeadingTerm);

    while (remainder.getDegree() >= other.getDegree() && !remainder.isZero()) {
      let degreeDifference = remainder.getDegree() - other.getDegree();
      let scale = this.field_.multiply(remainder.getCoefficient(remainder.getDegree()), inverseDenominatorLeadingTerm);
      let term = other.multiplyByMonomial(degreeDifference, scale);
      let iterationQuotient = this.field_.buildMonomial(degreeDifference, scale);
      quotient = quotient.addOrSubtract(iterationQuotient);
      remainder = remainder.addOrSubtract(term);
    }

    return [quotient, remainder];
  };

  /**
   * @override
   */
  pro.toString = function() {
    var result = new StringBuilder();
    for (let degree = this.getDegree(); degree >= 0; degree--) {
      let coefficient = this.getCoefficient(degree);
      if (coefficient !== 0) {
        if (coefficient < 0) {
          result.append(" - ");
          coefficient = -coefficient;
        } else {
          if (result.length() > 0) {
            result.append(" + ");
          }
        }
        if (degree === 0 || coefficient !== 1) {
          let alphaPower = this.field_.log(coefficient);
          if (alphaPower === 0) {
            result.append('1');
          } else if (alphaPower === 1) {
            result.append('a');
          } else {
            result.append("a^");
            result.append(alphaPower);
          }
        }
        if (degree !== 0) {
          if (degree === 1) {
            result.append('x');
          } else {
            result.append("x^");
            result.append(degree);
          }
        }
      }
    }
    return result.toString();
  };
});
