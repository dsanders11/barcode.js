// (c) 2017 David Sanders (dsanders11@ucsbalum.com)

goog.module('w69b.common.NoOpBinarizer');
goog.module.declareLegacyNamespace();

const Binarizer = goog.require('w69b.Binarizer');
const BitArray = goog.require('w69b.common.BitArray');
const BitMatrix = goog.require('w69b.common.BitMatrix');
const LuminanceSource = goog.require('w69b.LuminanceSource');

/**
 * Binarizer implementation that simply passes through the LuminanceSource
 * data unchanged. Useful for when the LuminanceSource is already binary.
 */
class NoOpBinarizer extends Binarizer {
  /**
   * @param {!LuminanceSource} source binary luminance source
   */
  constructor(source) {
    super(source);
  }

  /**
   * @override
   */
  getBlackRow(y, row) {
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
  }

  /**
   * @override
   */
  getBlackMatrix() {
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
  }

  /**
   * @override
   */
  createBinarizer(source) {
    return new NoOpBinarizer(source);
  }
}

exports = NoOpBinarizer;
