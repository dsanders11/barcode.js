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

goog.provide('w69b.common.reedsolomon.ReedSolomonDecoder');
goog.require('w69b.common.reedsolomon.GenericGF');
goog.require('w69b.common.reedsolomon.GenericGFPoly');
goog.require('w69b.common.reedsolomon.ReedSolomonException');
goog.require('w69b.exceptions.IllegalStateException');


/**
 * <p>Implements Reed-Solomon decoding, as the name implies.</p>
 *
 * <p>The algorithm will not be explained here, but the following references
 * were helpful
 * in creating this implementation:</p>
 *
 * <ul>
 * <li>Bruce Maggs.
 * <a href="http://www.cs.cmu.edu/afs/cs.cmu.edu/project/pscico-guyb/realworld
 * /www/rs_decode.ps">
 * "Decoding Reed-Solomon Codes"</a> (see discussion of Forney's Formula)</li>
 * <li>J.I. Hall. <a href="www.mth.msu.edu/~jhall/classes/codenotes/GRS.pdf">
 * "Chapter 5. Generalized Reed-Solomon Codes"</a>
 * (see discussion of Euclidean algorithm)</li>
 * </ul>
 *
 * <p>Much credit is due to William Rucklidge since portions of this code are
 * an indirect port of his C++ Reed-Solomon implementation.</p>
 *
 * @author Sean Owen
 * @author William Rucklidge
 * @author sanfordsquires
 */


goog.scope(function() {
  const GenericGF = w69b.common.reedsolomon.GenericGF;
  const GenericGFPoly = w69b.common.reedsolomon.GenericGFPoly;
  const ReedSolomonException = w69b.common.reedsolomon.ReedSolomonException;
  const IllegalStateException = w69b.exceptions.IllegalStateException;
  /**
   * @constructor
   * @param {!GenericGF} field field.
   */
  w69b.common.reedsolomon.ReedSolomonDecoder = function(field) {
    this.field_ = field;
  };
  const ReedSolomonDecoder = w69b.common.reedsolomon.ReedSolomonDecoder;
  const pro = ReedSolomonDecoder.prototype;

  /**
   * Decodes given set of received codewords, which include both data and
   * error-correction codewords.
   * Really, this means it uses Reed-Solomon to detect and correct  errors,
   * in-place, in the input.
   *
   * @param {!Int32Array} received data and error-correction codewords.
   * @param {number} twoS number of error-correction codewords available.
   * @throws {ReedSolomonException}
   */
  pro.decode = function(received, twoS) {
    var poly = new GenericGFPoly(this.field_, received);
    var syndromeCoefficients = new Int32Array(twoS);
    var noError = true;
    for (let i = 0; i < twoS; i++) {
      let eval = poly.evaluateAt(this.field_.exp(i + this.field_.getGeneratorBase()));
      syndromeCoefficients[syndromeCoefficients.length - 1 - i] = eval;
      if (eval !== 0) {
        noError = false;
      }
    }
    if (noError) {
      return;
    }
    var syndrome = new GenericGFPoly(this.field_, syndromeCoefficients);
    var sigmaOmega = this.runEuclideanAlgorithm(this.field_.buildMonomial(twoS,
      1), syndrome, twoS);
    var sigma = sigmaOmega[0];
    var omega = sigmaOmega[1];
    var errorLocations = this.findErrorLocations(sigma);
    var errorMagnitudes = this.findErrorMagnitudes(omega, errorLocations);
    for (let i = 0; i < errorLocations.length; i++) {
      let position = received.length - 1 - this.field_.log(errorLocations[i]);
      if (position < 0) {
        throw new ReedSolomonException('Bad error location');
      }
      received[position] = GenericGF.addOrSubtract(received[position], errorMagnitudes[i]);
    }
  };

  /**
   * @param {!GenericGFPoly} a
   * @param {!GenericGFPoly} b
   * @param {number} R
   * @return {!Array.<!GenericGFPoly>}
   * @throws {ReedSolomonException}
   */
  pro.runEuclideanAlgorithm = function(a, b, R) {
    // Assume a's degree is >= b's
    if (a.getDegree() < b.getDegree()) {
      let temp = a;
      a = b;
      b = temp;
    }

    var rLast = a;
    var r = b;
    var tLast = this.field_.getZero();
    var t = this.field_.getOne();

    // Run Euclidean algorithm until r's degree is less than R/2
    while (r.getDegree() >= R >> 1) {
      let rLastLast = rLast;
      let tLastLast = tLast;
      rLast = r;
      tLast = t;

      // Divide rLastLast by rLast, with quotient in q and remainder in r
      if (rLast.isZero()) {
        // Oops, Euclidean algorithm already terminated?
        throw new ReedSolomonException('r_{i-1} was zero');
      }
      r = rLastLast;
      let q = this.field_.getZero();
      let denominatorLeadingTerm = rLast.getCoefficient(rLast.getDegree());
      let dltInverse = this.field_.inverse(denominatorLeadingTerm);
      while (r.getDegree() >= rLast.getDegree() && !r.isZero()) {
        let degreeDiff = r.getDegree() - rLast.getDegree();
        let scale = this.field_.multiply(r.getCoefficient(r.getDegree()), dltInverse);
        q = q.addOrSubtract(this.field_.buildMonomial(degreeDiff, scale));
        r = r.addOrSubtract(rLast.multiplyByMonomial(degreeDiff, scale));
      }

      t = q.multiply1(tLast).addOrSubtract(tLastLast);

      if (r.getDegree() >= rLast.getDegree()) {
        throw new IllegalStateException('Division algorithm failed to reduce polynomial?');
      }
    }

    var sigmaTildeAtZero = t.getCoefficient(0);
    if (sigmaTildeAtZero === 0) {
      throw new ReedSolomonException('sigmaTilde(0) was zero');
    }

    var inverse = this.field_.inverse(sigmaTildeAtZero);
    var sigma = t.multiply2(inverse);
    var omega = r.multiply2(inverse);
    return [sigma, omega];
  };

  /**
   * @param {!GenericGFPoly} errorLocator
   * @return {!Int32Array}
   * @throws {ReedSolomonException}
   */
  pro.findErrorLocations = function(errorLocator) {
    // This is a direct application of Chien's search
    var numErrors = errorLocator.getDegree();
    if (numErrors === 1) { // shortcut
      return Int32Array.of(errorLocator.getCoefficient(1));
    }
    var result = new Int32Array(numErrors);
    var e = 0;
    for (let i = 1; i < this.field_.getSize() && e < numErrors; i++) {
      if (errorLocator.evaluateAt(i) === 0) {
        result[e] = this.field_.inverse(i);
        e++;
      }
    }
    if (e !== numErrors) {
      throw new ReedSolomonException('locator degree does not match ' +
        'number of roots');
    }
    return result;
  };

  /**
   * @param {!GenericGFPoly} errorEvaluator
   * @param {!Int32Array} errorLocations
   * @return {!Int32Array}
   */
  pro.findErrorMagnitudes = function(errorEvaluator, errorLocations) {
    var field = this.field_;

    // This is directly applying Forney's Formula
    var s = errorLocations.length;
    var result = new Int32Array(s);
    for (let i = 0; i < s; i++) {
      let xiInverse = field.inverse(errorLocations[i]);
      let denominator = 1;
      for (let j = 0; j < s; j++) {
        if (i !== j) {
          //denominator = field.multiply(denominator,
          //    GenericGF.addOrSubtract(1, field.multiply(errorLocations[j], xiInverse)));
          // Above should work but fails on some Apple and Linux JDKs due to a Hotspot bug.
          // Below is a funny-looking workaround from Steven Parkes
          let term = field.multiply(errorLocations[j], xiInverse);
          let termPlus1 = (term & 0x1) === 0 ? term | 1 : term & ~1;
          denominator = field.multiply(denominator, termPlus1);
        }
      }
      result[i] = field.multiply(errorEvaluator.evaluateAt(xiInverse),
          field.inverse(denominator));
      if (field.getGeneratorBase() !== 0) {
        result[i] = field.multiply(result[i], xiInverse);
      }
    }
    return result;
  };
});
