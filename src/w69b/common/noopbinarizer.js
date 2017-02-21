// (c) 2017 David Sanders (dsanders11@ucsbalum.com)

goog.provide('w69b.common.NoOpBinarizer');
goog.require('w69b.Binarizer');
goog.require('w69b.LuminanceSource');
goog.require('w69b.common.BitArray');
goog.require('w69b.common.BitMatrix');


goog.scope(function() {
  var Binarizer = w69b.Binarizer;
  var LuminanceSource = w69b.LuminanceSource;
  var BitMatrix = w69b.common.BitMatrix;
  var BitArray = w69b.common.BitArray;

  /**
   * Binarizer implementation that simply passes through the LuminanceSource
   * data unchanged. Useful for when the LuminanceSource is already binary.
   *
   * @param {LuminanceSource} source binary luminance source
   * @constructor
   * @extends {Binarizer}
   */
  w69b.common.NoOpBinarizer = function(source) {
    goog.base(this, source);
  };
  var NoOpBinarizer = w69b.common.NoOpBinarizer;
  goog.inherits(NoOpBinarizer, Binarizer);
  var pro = NoOpBinarizer.prototype;

  /**
   * @override
   * @suppress {checkTypes}
   */
  pro.getBlackRow = function(y, row) {
    var source = this.getLuminanceSource();
    var width = source.getWidth();

    if (row === null || row.getSize() < width) {
      row = new BitArray(width);
    } else {
      row.clear();
    }

    source.getRow(y, null).forEach(function(value, idx) {
      if (value & 0xff) {
        row.set(idx);
      }
    });

    return row;
  };

  /**
   * @override
   */
  pro.getBlackMatrix = function() {
    var source = this.getLuminanceSource();
    var width = source.getWidth();
    var height = source.getHeight();
    var matrix = new BitMatrix(width, height);

    var luminances = source.getMatrix();
    for (let y = 0; y < height; y++) {
      let offset = y * width;
      for (let x = 0; x < width; x++) {
        let pixel = luminances[offset + x] & 0xff;
        if (pixel) {
          matrix.set(x, y);
        }
      }
    }

    return matrix;
  };

  /**
   * @override
   */
  pro.createBinarizer = function(source) {
    return new NoOpBinarizer(source);
  };
});
