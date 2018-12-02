// (c) 2017 David Sanders (dsanders11@ucsbalum.com)

goog.provide('w69b.common.NoOpBinarizer');
goog.require('w69b.Binarizer');
goog.require('w69b.LuminanceSource');
goog.require('w69b.common.BitArray');
goog.require('w69b.common.BitMatrix');


goog.scope(function() {
  const Binarizer = w69b.Binarizer;
  const LuminanceSource = w69b.LuminanceSource;
  const BitMatrix = w69b.common.BitMatrix;
  const BitArray = w69b.common.BitArray;

  /**
   * Binarizer implementation that simply passes through the LuminanceSource
   * data unchanged. Useful for when the LuminanceSource is already binary.
   *
   * @param {!LuminanceSource} source binary luminance source
   * @constructor
   * @extends {Binarizer}
   */
  w69b.common.NoOpBinarizer = function(source) {
    NoOpBinarizer.base(this, 'constructor', source);
  };
  const NoOpBinarizer = w69b.common.NoOpBinarizer;
  goog.inherits(NoOpBinarizer, Binarizer);
  const pro = NoOpBinarizer.prototype;

  /**
   * @override
   */
  pro.getBlackRow = function(y, row) {
    const source = this.getLuminanceSource();
    const width = source.getWidth();

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
    const source = this.getLuminanceSource();
    const width = source.getWidth();
    const height = source.getHeight();
    const matrix = new BitMatrix(width, height);

    const luminances = source.getMatrix();
    for (let y = 0; y < height; y++) {
      const offset = y * width;
      for (let x = 0; x < width; x++) {
        const pixel = luminances[offset + x] & 0xff;
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
