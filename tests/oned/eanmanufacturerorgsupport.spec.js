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

goog.require('w69b.oned.EANManufacturerOrgSupport');


define(['chai'], function(chai) {
  var assert = chai.assert;
  var EANManufacturerOrgSupport = w69b.oned.EANManufacturerOrgSupport;

  describe('EANManufacturerOrgSupport', function() {
    it('testLookup', function() {
      var support = new EANManufacturerOrgSupport();
      assert.isNull(support.lookupCountryIdentifier("472000"));
      assert.equal("US/CA", support.lookupCountryIdentifier("000000"));
      assert.equal("MO", support.lookupCountryIdentifier("958000"));
      assert.equal("GB", support.lookupCountryIdentifier("500000"));
      assert.equal("GB", support.lookupCountryIdentifier("509000"));
    });
  });
});
