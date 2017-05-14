// javascript (closure) port (c) 2017 David Sanders (dsanders11@ucsbalum.com)
/*
 * Copyright (C) 2010 ZXing authors
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

goog.provide('w69b.oned.EANManufacturerOrgSupport');
goog.require('w69b.Integer');


goog.scope(function() {
  const Integer = w69b.Integer;

  /**
   * Records EAN prefix to GS1 Member Organization, where the member organization
   * correlates strongly with a country. This is an imperfect means of identifying
   * a country of origin by EAN-13 barcode value. See
   * <a href="http://en.wikipedia.org/wiki/List_of_GS1_country_codes">
   * http://en.wikipedia.org/wiki/List_of_GS1_country_codes</a>.
   * @constructor
   * @final
   */
  w69b.oned.EANManufacturerOrgSupport = function() {
    this.ranges_ = [];
    this.countryIdentifiers_ = [];
  };
  const EANManufacturerOrgSupport = w69b.oned.EANManufacturerOrgSupport;
  const pro = EANManufacturerOrgSupport.prototype;

  /**
   * @param {string} productCode
   * @return {?string}
   */
  pro.lookupCountryIdentifier = function(productCode) {
    this.initIfNeeded_();
    var prefix = Integer.parseInt(productCode.substring(0, 3));
    var max = this.ranges_.length;
    for (let i = 0; i < max; i++) {
      let range = this.ranges_[i];
      let start = range[0];
      if (prefix < start) {
        return null;
      }
      let end = range.length === 1 ? start : range[1];
      if (prefix <= end) {
        return this.countryIdentifiers_[i];
      }
    }
    return null;
  };

  /**
   * @param {!Int32Array} range
   * @param {string} id
   */
  pro.add_ = function(range, id) {
    this.ranges_.push(range);
    this.countryIdentifiers_.push(id);
  };

  pro.initIfNeeded_ = function() {
    if (this.ranges_.length !== 0) {
      return;
    }
    this.add_(Int32Array.of(0,19),    "US/CA");
    this.add_(Int32Array.of(30,39),   "US");
    this.add_(Int32Array.of(60,139),  "US/CA");
    this.add_(Int32Array.of(300,379), "FR");
    this.add_(Int32Array.of(380),     "BG");
    this.add_(Int32Array.of(383),     "SI");
    this.add_(Int32Array.of(385),     "HR");
    this.add_(Int32Array.of(387),     "BA");
    this.add_(Int32Array.of(400,440), "DE");
    this.add_(Int32Array.of(450,459), "JP");
    this.add_(Int32Array.of(460,469), "RU");
    this.add_(Int32Array.of(471),     "TW");
    this.add_(Int32Array.of(474),     "EE");
    this.add_(Int32Array.of(475),     "LV");
    this.add_(Int32Array.of(476),     "AZ");
    this.add_(Int32Array.of(477),     "LT");
    this.add_(Int32Array.of(478),     "UZ");
    this.add_(Int32Array.of(479),     "LK");
    this.add_(Int32Array.of(480),     "PH");
    this.add_(Int32Array.of(481),     "BY");
    this.add_(Int32Array.of(482),     "UA");
    this.add_(Int32Array.of(484),     "MD");
    this.add_(Int32Array.of(485),     "AM");
    this.add_(Int32Array.of(486),     "GE");
    this.add_(Int32Array.of(487),     "KZ");
    this.add_(Int32Array.of(489),     "HK");
    this.add_(Int32Array.of(490,499), "JP");
    this.add_(Int32Array.of(500,509), "GB");
    this.add_(Int32Array.of(520),     "GR");
    this.add_(Int32Array.of(528),     "LB");
    this.add_(Int32Array.of(529),     "CY");
    this.add_(Int32Array.of(531),     "MK");
    this.add_(Int32Array.of(535),     "MT");
    this.add_(Int32Array.of(539),     "IE");
    this.add_(Int32Array.of(540,549), "BE/LU");
    this.add_(Int32Array.of(560),     "PT");
    this.add_(Int32Array.of(569),     "IS");
    this.add_(Int32Array.of(570,579), "DK");
    this.add_(Int32Array.of(590),     "PL");
    this.add_(Int32Array.of(594),     "RO");
    this.add_(Int32Array.of(599),     "HU");
    this.add_(Int32Array.of(600,601), "ZA");
    this.add_(Int32Array.of(603),     "GH");
    this.add_(Int32Array.of(608),     "BH");
    this.add_(Int32Array.of(609),     "MU");
    this.add_(Int32Array.of(611),     "MA");
    this.add_(Int32Array.of(613),     "DZ");
    this.add_(Int32Array.of(616),     "KE");
    this.add_(Int32Array.of(618),     "CI");
    this.add_(Int32Array.of(619),     "TN");
    this.add_(Int32Array.of(621),     "SY");
    this.add_(Int32Array.of(622),     "EG");
    this.add_(Int32Array.of(624),     "LY");
    this.add_(Int32Array.of(625),     "JO");
    this.add_(Int32Array.of(626),     "IR");
    this.add_(Int32Array.of(627),     "KW");
    this.add_(Int32Array.of(628),     "SA");
    this.add_(Int32Array.of(629),     "AE");
    this.add_(Int32Array.of(640,649), "FI");
    this.add_(Int32Array.of(690,695), "CN");
    this.add_(Int32Array.of(700,709), "NO");
    this.add_(Int32Array.of(729),     "IL");
    this.add_(Int32Array.of(730,739), "SE");
    this.add_(Int32Array.of(740),     "GT");
    this.add_(Int32Array.of(741),     "SV");
    this.add_(Int32Array.of(742),     "HN");
    this.add_(Int32Array.of(743),     "NI");
    this.add_(Int32Array.of(744),     "CR");
    this.add_(Int32Array.of(745),     "PA");
    this.add_(Int32Array.of(746),     "DO");
    this.add_(Int32Array.of(750),     "MX");
    this.add_(Int32Array.of(754,755), "CA");
    this.add_(Int32Array.of(759),     "VE");
    this.add_(Int32Array.of(760,769), "CH");
    this.add_(Int32Array.of(770),     "CO");
    this.add_(Int32Array.of(773),     "UY");
    this.add_(Int32Array.of(775),     "PE");
    this.add_(Int32Array.of(777),     "BO");
    this.add_(Int32Array.of(779),     "AR");
    this.add_(Int32Array.of(780),     "CL");
    this.add_(Int32Array.of(784),     "PY");
    this.add_(Int32Array.of(785),     "PE");
    this.add_(Int32Array.of(786),     "EC");
    this.add_(Int32Array.of(789,790), "BR");
    this.add_(Int32Array.of(800,839), "IT");
    this.add_(Int32Array.of(840,849), "ES");
    this.add_(Int32Array.of(850),     "CU");
    this.add_(Int32Array.of(858),     "SK");
    this.add_(Int32Array.of(859),     "CZ");
    this.add_(Int32Array.of(860),     "YU");
    this.add_(Int32Array.of(865),     "MN");
    this.add_(Int32Array.of(867),     "KP");
    this.add_(Int32Array.of(868,869), "TR");
    this.add_(Int32Array.of(870,879), "NL");
    this.add_(Int32Array.of(880),     "KR");
    this.add_(Int32Array.of(885),     "TH");
    this.add_(Int32Array.of(888),     "SG");
    this.add_(Int32Array.of(890),     "IN");
    this.add_(Int32Array.of(893),     "VN");
    this.add_(Int32Array.of(896),     "PK");
    this.add_(Int32Array.of(899),     "ID");
    this.add_(Int32Array.of(900,919), "AT");
    this.add_(Int32Array.of(930,939), "AU");
    this.add_(Int32Array.of(940,949), "AZ");
    this.add_(Int32Array.of(955),     "MY");
    this.add_(Int32Array.of(958),     "MO");
  };
});
