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

goog.provide('w69b.common.CharacterSetECI');
goog.require('w69b.FormatException');
goog.require('goog.object');

goog.scope(function() {
  var FormatException = w69b.FormatException;

  /**
   * @param {Array.<number>} values
   * @param {...string} opt_otherEncodingNames
   * @constructor
   */
  w69b.common.CharacterSetECI = function(values, ...opt_otherEncodingNames) {
    this.values = values;
    this.otherEncodingNames = opt_otherEncodingNames;
  };
  var CharacterSetECI = w69b.common.CharacterSetECI;
  var pro = CharacterSetECI.prototype;

  /** @enum {CharacterSetECI} */
  w69b.common.CharacterSetECIEnum = {
    Cp437: new CharacterSetECI([0, 2], 'CP437'),
    ISO8859_1: new CharacterSetECI([1, 3], 'ISO-8859-1'),
    ISO8859_2: new CharacterSetECI([4], 'ISO-8859-2'),
    ISO8859_3: new CharacterSetECI([5], 'ISO-8859-3'),
    ISO8859_4: new CharacterSetECI([6], 'ISO-8859-4'),
    ISO8859_5: new CharacterSetECI([7], 'ISO-8859-5'),
    ISO8859_6: new CharacterSetECI([8], 'ISO-8859-6'),
    ISO8859_7: new CharacterSetECI([9], 'ISO-8859-7'),
    ISO8859_8: new CharacterSetECI([10], 'ISO-8859-8'),
    ISO8859_9: new CharacterSetECI([11], 'ISO-8859-9'),
    ISO8859_10: new CharacterSetECI([12], 'ISO-8859-10'),
    ISO8859_11: new CharacterSetECI([13], 'ISO-8859-11'),
    ISO8859_13: new CharacterSetECI([15], 'ISO-8859-13'),
    ISO8859_14: new CharacterSetECI([16], 'ISO-8859-14'),
    ISO8859_15: new CharacterSetECI([17], 'ISO-8859-15'),
    ISO8859_16: new CharacterSetECI([18], 'ISO-8859-16'),
    SJIS: new CharacterSetECI([20], 'Shift_JIS'),
    Cp1250: new CharacterSetECI([21], 'windows-1250'),
    Cp1251: new CharacterSetECI([22], 'windows-1251'),
    Cp1252: new CharacterSetECI([23], 'windows-1252'),
    Cp1256: new CharacterSetECI([24], 'windows-1256'),
    UnicodeBigUnmarked: new CharacterSetECI([25], 'UTF-16BE', 'UnicodeBig'),
    UTF8: new CharacterSetECI([26], 'UTF-8'),
    ASCII: new CharacterSetECI([27, 170], 'US-ASCII'),
    Big5: new CharacterSetECI([28]),
    GB18030: new CharacterSetECI([29], 'GB2312', 'EUC_CN', 'GBK'),
    EUC_KR: new CharacterSetECI([30], 'EUC-KR')
  };
  var CharacterSetECIEnum = w69b.common.CharacterSetECIEnum;

  /** @type {Object<string, CharacterSetECI>} */
  CharacterSetECI.namesToEnum_ = {};

  /** @type {Object<number, CharacterSetECI>} */
  CharacterSetECI.valuesToEnum_ = {};

  (function() {
    for (var eci in CharacterSetECIEnum) {
      var enumValue = CharacterSetECIEnum[eci];
      enumValue.name = eci;

      CharacterSetECI.namesToEnum_[eci] = enumValue;

      for (var name of enumValue.otherEncodingNames) {
        CharacterSetECI.namesToEnum_[name] = enumValue;
      }

      for (var value of enumValue.values) {
        CharacterSetECI.valuesToEnum_[value] = enumValue;
      }
    }
  })();

  /**
   * @return {number} eci value
   */
  pro.getValue = function() {
    return this.values[0];
  };

  /**
   * @param {number} value character set ECI value
   * @return {CharacterSetECI} representing ECI of given value, or null if it
   *                           is legal but unsupported
   * @throws {FormatException} if ECI value is invalid
   */
  CharacterSetECI.getCharacterSetECIByValue = function(value) {
    if (value < 0 || value >= 900) {
      throw new FormatException("Invalid ECI value");
    }
    return CharacterSetECI.valuesToEnum_[value];
  };

  /**
   * @param {string} name character set ECI encoding name
   * @return {CharacterSetECI} representing ECI for character encoding, or null
   *                           if it is legal but unsupported
   */
  CharacterSetECI.getCharacterSetECIByName = function(name) {
    return CharacterSetECI.namesToEnum_[name];
  };
});
