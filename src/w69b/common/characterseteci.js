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

goog.scope(function() {
  const FormatException = w69b.FormatException;

  /**
   * @param {!Int32Array} values
   * @param {...string} opt_otherEncodingNames
   * @constructor
   */
  w69b.common.CharacterSetECI = function(values, ...opt_otherEncodingNames) {
    this.values = values;
    this.otherEncodingNames = opt_otherEncodingNames;
  };
  const CharacterSetECI = w69b.common.CharacterSetECI;
  const pro = CharacterSetECI.prototype;

  /** @type {string} */
  pro.name = '';

  /** @enum {!CharacterSetECI} */
  w69b.common.CharacterSetECIEnum = {
    Cp437: new CharacterSetECI(Int32Array.of(0, 2), 'CP437'),
    ISO8859_1: new CharacterSetECI(Int32Array.of(1, 3), 'ISO-8859-1'),
    ISO8859_2: new CharacterSetECI(Int32Array.of(4), 'ISO-8859-2'),
    ISO8859_3: new CharacterSetECI(Int32Array.of(5), 'ISO-8859-3'),
    ISO8859_4: new CharacterSetECI(Int32Array.of(6), 'ISO-8859-4'),
    ISO8859_5: new CharacterSetECI(Int32Array.of(7), 'ISO-8859-5'),
    ISO8859_6: new CharacterSetECI(Int32Array.of(8), 'ISO-8859-6'),
    ISO8859_7: new CharacterSetECI(Int32Array.of(9), 'ISO-8859-7'),
    ISO8859_8: new CharacterSetECI(Int32Array.of(10), 'ISO-8859-8'),
    ISO8859_9: new CharacterSetECI(Int32Array.of(11), 'ISO-8859-9'),
    ISO8859_10: new CharacterSetECI(Int32Array.of(12), 'ISO-8859-10'),
    ISO8859_11: new CharacterSetECI(Int32Array.of(13), 'ISO-8859-11'),
    ISO8859_13: new CharacterSetECI(Int32Array.of(15), 'ISO-8859-13'),
    ISO8859_14: new CharacterSetECI(Int32Array.of(16), 'ISO-8859-14'),
    ISO8859_15: new CharacterSetECI(Int32Array.of(17), 'ISO-8859-15'),
    ISO8859_16: new CharacterSetECI(Int32Array.of(18), 'ISO-8859-16'),
    SJIS: new CharacterSetECI(Int32Array.of(20), 'Shift_JIS'),
    Cp1250: new CharacterSetECI(Int32Array.of(21), 'windows-1250'),
    Cp1251: new CharacterSetECI(Int32Array.of(22), 'windows-1251'),
    Cp1252: new CharacterSetECI(Int32Array.of(23), 'windows-1252'),
    Cp1256: new CharacterSetECI(Int32Array.of(24), 'windows-1256'),
    UnicodeBigUnmarked: new CharacterSetECI(Int32Array.of(25), 'UTF-16BE', 'UnicodeBig'),
    UTF8: new CharacterSetECI(Int32Array.of(26), 'UTF-8'),
    ASCII: new CharacterSetECI(Int32Array.of(27, 170), 'US-ASCII'),
    Big5: new CharacterSetECI(Int32Array.of(28)),
    GB18030: new CharacterSetECI(Int32Array.of(29), 'GB2312', 'EUC_CN', 'GBK'),
    EUC_KR: new CharacterSetECI(Int32Array.of(30), 'EUC-KR')
  };
  const CharacterSetECIEnum = w69b.common.CharacterSetECIEnum;

  /** @type {!Object<string, !CharacterSetECI>} */
  CharacterSetECI.namesToEnum_ = {};

  /** @type {!Object<number, !CharacterSetECI>} */
  CharacterSetECI.valuesToEnum_ = {};

  (function() {
    for (let eci in CharacterSetECIEnum) {
      /** @type {!CharacterSetECI} */
      let enumValue = CharacterSetECIEnum[eci];
      enumValue.name = eci.toString();

      CharacterSetECI.namesToEnum_[eci] = enumValue;

      for (let name of enumValue.otherEncodingNames) {
        CharacterSetECI.namesToEnum_[name] = enumValue;
      }

      for (let value of enumValue.values) {
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
   * @return {!CharacterSetECI} representing ECI of given value, or null if it
   *                            is legal but unsupported
   * @throws {!FormatException} if ECI value is invalid
   */
  CharacterSetECI.getCharacterSetECIByValue = function(value) {
    if (value < 0 || value >= 900) {
      throw new FormatException("Invalid ECI value");
    }
    return CharacterSetECI.valuesToEnum_[value];
  };

  /**
   * @param {string} name character set ECI encoding name
   * @return {!CharacterSetECI} representing ECI for character encoding, or null
   *                            if it is legal but unsupported
   */
  CharacterSetECI.getCharacterSetECIByName = function(name) {
    return CharacterSetECI.namesToEnum_[name];
  };
});
