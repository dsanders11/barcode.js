// (c) 2013 Manuel Braun (mb@w69b.com)
goog.require('w69b.decoding');

define(['chai', 'tests/testhelper'], function(chai, testhelper) {
  var expect = chai.expect;
  var baseUrl = '../';
  // Expected number of detections with native binarizer.
  var expectedDetections = {
    'qrcode-1': 19,
    'qrcode-2': 29,
    'qrcode-3': 38,
    'qrcode-4': 35,
    'qrcode-5': 19,
    'qrcode-6': 15
  };
  // Expected number of detections with WebGl binarizer, slightly worse in some cases, slightly
  // better in others.
  var expectedDetectionsGl = {
    'qrcode-1': 14,
    'qrcode-2': 27,
    'qrcode-3': 39,
    'qrcode-4': 37,
    'qrcode-5': 19,
    'qrcode-6': 15
  };
  // If != null, run only specified suites (for debugging).
  var onlySuites = null;
  // ['qrcode-1', 'qrcode-3', 'qrcode-4', 'qrcode-5', 'qrcode-6'];
  /**
   * @constructor
   */
  var SuiteInfo = function(suite, name, successes) {
    this.successCnt = 0;
    this.fatalCnt = 0;
    this.name = name;
    this.expectedSuccesses = successes;
    this.suite = suite;
    this.failures = [];
  };

  SuiteInfo.prototype.checkExpectations = function() {
    if (this.successCnt < this.expectedSuccesses) {
      // Print some debug help messages.
      window.console.log('');
      window.console.log('---');
      window.console.log('BLACKBOX RESULT: ' + this.successCnt +
        ' of ' + this.suite.length + ' tests succeded,' +
        ' fatal failures: ' + this.fatalCnt);
      window.console.log('Failures:');
      this.failures.forEach(function(lines) {
        lines.forEach(function(line) {
          window.console.log(line);
        });
      });
      window.console.log('---');
    }
    expect(this.successCnt).to.be.at.least(this.expectedSuccesses,
      'too many failures');
  };

  SuiteInfo.prototype.runAll = function(decoder) {
    var promise = goog.Promise.resolve();
    var self = this;
    this.suite.forEach(function(item) {
      promise = promise.then(function() {
        return self.run(item, decoder);
      });
    });
    return promise;
  };

  SuiteInfo.prototype.run = function(item, decoder) {
    var self = this;
    var url = item['image'];
    var expectedFileName = item['expected'];

    var promise = new Promise(function(resolve, reject) {
      var oReq = new XMLHttpRequest();
      oReq.onload = function() {
        var expected = oReq.responseText;

        testhelper.loadImage(url).then(function(img) {
          return decoder.decode(img);
        }).then(function(result) {
          if (result.text == expected) {
            self.successCnt++;
          } else {
            self.failures.push(
              ['Test with url: ' + url + ' failed:',
                'expected: ' + expected,
                'actual: ' + result.text]);
          }

          resolve();
        }, function(error) {
          self.fatalCnt++;
          self.failures.push(
            ['Test with url: ' + url + ' failed with: ' + error]);
          resolve();
        });
      };
      oReq.open("GET", expectedFileName);
      oReq.send();
    });

    return promise;
  };


  function generateTest(suiteInfo, opt) {
    return function(done) {
      testhelper.setupWorkerUrls();
      var decoder = new w69b.decoding.Decoder(opt);
      suiteInfo.runAll(decoder).then(function() {
        suiteInfo.checkExpectations();
        decoder.dispose();
        done();
      });
    }
  }


  testhelper.ALL_DECODE_OPTIONS.forEach(function(opt) {
    var expectedSet = opt.webgl ? expectedDetectionsGl : expectedDetections;

    describe('Blackbox Detection ' + JSON.stringify(opt), function() {
      // Sequential testing, so use a larger timeout.
      this.timeout(10000);

      var suitesToRun = onlySuites === null ? Object.keys(expectedSet) : onlySuites;
      var suites = {};
      var extensions = ['.gif', '.png', '.jpg'];

      for (var suiteName of suitesToRun) {
        var suite = [];
        var blackboxDataPattern = new RegExp('/base/test_data/blackbox/' + suiteName + '/.*\.txt');

        for (var file in window.__karma__.files) {
          var match = blackboxDataPattern.exec(file);
          if (match) {
            var fileName = file.slice(0, -4);

            for (var i = 0; i < extensions.length; i++) {
              var imageFile = fileName + extensions[i];
              if (imageFile in window.__karma__.files) {
                suite.push({expected: file, image: imageFile});
              }
            }
          }
        }

        suites[suiteName] = suite;
      }

      for (var suiteName in suites) {
        var suite = suites[suiteName];
        var suiteInfo = new SuiteInfo(suite, suiteName, expectedSet[suiteName]);
        // suite = [suite[23]];
        it('detects suite ' + suiteName, generateTest(suiteInfo, opt));
      }
    });
  });
});
