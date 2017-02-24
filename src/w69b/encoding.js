// (c) 2013 Manuel Braun (mb@w69b.com)
goog.provide('w69b.encoding');
goog.require('w69b.BarcodeFormat');
goog.require('w69b.EncodeHintType');
goog.require('w69b.MultiFormatWriter');
goog.require('w69b.common.BitMatrix');
goog.require('w69b.ui.CanvasDrawable');
goog.require('w69b.ui.Drawable');
goog.require('w69b.ui.EpsDrawable');
goog.require('w69b.ui.SvgDrawable');

/**
 * Simple high-level interface to create barcodes.
 */
goog.scope(function() {
  var SvgDrawable = w69b.ui.SvgDrawable;
  var EpsDrawable = w69b.ui.EpsDrawable;

  /** @type {Object} */
  var _ = w69b.encoding;

  /**
   * @param {w69b.common.BitMatrix} matrix the matrix to render
   * @param {w69b.ui.Drawable} drawable the drawable to render onto
   */
  function render_(matrix, drawable) {
    var width = matrix.getWidth();
    var height = matrix.getHeight();
    drawable.fillBackground(width, height);
    for (let x=0; x < width; x++) {
      for (let y=0; y < height; y++) {
        if (matrix.get(x, y) === true) {
          drawable.fillBlack(x, y, 1, 1);
        }
      }
    }
  }

  /**
   * @param {string} content to encode.
   * @param {w69b.BarcodeFormat} format barcode format to encode as
   * @param {HTMLCanvasElement} canvas canvas to draw on.
   * @param {Object<w69b.EncodeHintType,*>=} opt_hints optional encoding hints
   *                                                   such as margin or
   *                                                   error correction
   */
  _.drawOnCanvas = function(content, format, canvas, opt_hints) {
    var bitMatrix = new w69b.MultiFormatWriter().encode(
      content, format, canvas.width, canvas.height, opt_hints);
    var drawable = new w69b.ui.CanvasDrawable(canvas);
    render_(bitMatrix, drawable);
  };

  /**
   * @param {string} content to encode.
   * @param {w69b.BarcodeFormat} format barcode format to encode as
   * @param {number} width width to use as svg width.
   * @param {number} height height to use as svg height.
   * @param {Object<w69b.EncodeHintType,*>=} opt_hints optional encoding hints
   *                                                   such as margin or
   *                                                   error correction
   * @return {string} svg source.
   */
  _.drawAsSVG = function(content, format, width, height, opt_hints) {
    var bitMatrix = new w69b.MultiFormatWriter().encode(
      content, format, width, height, opt_hints);
    var drawable = new SvgDrawable();
    render_(bitMatrix, drawable);
    return drawable.toString();
  };

  /**
   * @param {string} content to encode.
   * @param {w69b.BarcodeFormat} format barcode format to encode as
   * @param {number} width width to use as eps width.
   * @param {number} height height to use as eps height.
   * @param {Object<w69b.EncodeHintType,*>=} opt_hints optional encoding hints
   *                                                   such as margin or
   *                                                   error correction
   * @return {string} eps source.
   */
  _.drawAsEPS = function(content, format, width, height, opt_hints) {
    var bitMatrix = new w69b.MultiFormatWriter().encode(
      content, format, width, height, opt_hints);
    var drawable = new EpsDrawable();
    render_(bitMatrix, drawable);
    return drawable.toString();
  };

  goog.exportSymbol('w69b.encoding.drawOnCanvas', _.drawOnCanvas);
  goog.exportSymbol('w69b.encoding.drawAsSVG', _.drawAsSVG);
  goog.exportSymbol('w69b.encoding.drawAsEPS', _.drawAsEPS);
});
