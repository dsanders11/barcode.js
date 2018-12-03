// javascript (closure) port (c) 2013 Manuel Braun (mb@w69b.com)
/*
 * Copyright 2008 ZXing authors
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

goog.module('w69b.common.reedsolomon.ReedSolomonEncoder');
goog.module.declareLegacyNamespace();

const GenericGF = goog.require('w69b.common.reedsolomon.GenericGF');
const GenericGFPoly = goog.require('w69b.common.reedsolomon.GenericGFPoly');
const IllegalArgumentException = goog.require('java.lang.IllegalArgumentException');

/**
 * Implements Reed-Solomon enbcoding, as the name implies.
 */
class ReedSolomonEncoder {
  /**
   * @param {!GenericGF} field to use.
   */
  constructor(field) {
    /**
     * @private
     * @type {!GenericGF}
     */
    this.field_ = field;
    /**
     * @private
     * @type {!Array.<!GenericGFPoly>}
     */
    this.cachedGenerators_ = [new GenericGFPoly(field, Int32Array.of(1))];
  }

  /**
   * @param {number} degree degree.
   * @return {!GenericGFPoly} generator.
   */
  buildGenerator_(degree) {
    const field = this.field_;
    const cachedGenerators = this.cachedGenerators_;
    if (degree >= cachedGenerators.length) {
      let lastGenerator = cachedGenerators[cachedGenerators.length - 1];
      for (let d = cachedGenerators.length; d <= degree; d++) {
        const nextGenerator = lastGenerator.multiply1(
            new GenericGFPoly(field, Int32Array.of(1, field.exp(d - 1 + field.getGeneratorBase()))));
        cachedGenerators.push(nextGenerator);
        lastGenerator = nextGenerator;
      }
    }
    return cachedGenerators[degree];
  }

  /**
   * @param {!Int32Array} toEncode data to encode, including pre-allocated
   * space for ecc bytes.
   * @param {number} ecBytes number of ec bytes.
   */
  encode(toEncode, ecBytes) {
    if (ecBytes === 0) {
      throw new IllegalArgumentException('No error correction bytes');
    }
    const dataBytes = toEncode.length - ecBytes;
    if (dataBytes <= 0) {
      throw new IllegalArgumentException('No data bytes provided');
    }
    const generator = this.buildGenerator_(ecBytes);
    const infoCoefficients = toEncode.slice(0, dataBytes);
    let info = new GenericGFPoly(this.field_, infoCoefficients);
    info = info.multiplyByMonomial(ecBytes, 1);
    const remainder = info.divide(generator)[1];
    const coefficients = remainder.getCoefficients();
    const numZeroCoefficients = ecBytes - coefficients.length;
    for (let i = 0; i < numZeroCoefficients; i++) {
      toEncode[dataBytes + i] = 0;
    }
    toEncode.set(coefficients, dataBytes + numZeroCoefficients);
  }
}

exports = ReedSolomonEncoder;
