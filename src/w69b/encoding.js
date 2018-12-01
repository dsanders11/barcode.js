// (c) 2013 Manuel Braun (mb@w69b.com)
goog.provide('w69b.encoding');
goog.require('w69b.BarcodeFormat');
goog.require('w69b.EncodeHintType');
goog.require('w69b.MultiFormatWriter');
goog.require('w69b.imgtools');
goog.require('w69b.ui.CanvasDrawable');
goog.require('w69b.ui.EpsDrawable');
goog.require('w69b.ui.SvgDrawable');

/**
 * Simple high-level interface to create barcodes.
 */
goog.scope(function() {
  const SvgDrawable = w69b.ui.SvgDrawable;
  const EpsDrawable = w69b.ui.EpsDrawable;

  /**
   * @param {string} content to encode.
   * @param {!w69b.BarcodeFormat} format barcode format to encode as
   * @param {!HTMLCanvasElement} canvas canvas to draw on.
   * @param {!Object<!w69b.EncodeHintType,*>=} opt_hints optional encoding hints
   *                                                     such as margin or
   *                                                     error correction
   * @export
   */
  w69b.encoding.drawOnCanvas = function(content, format, canvas, opt_hints) {
    var bitMatrix = new w69b.MultiFormatWriter().encode(
      content, format, canvas.width, canvas.height, opt_hints);
    var drawable = new w69b.ui.CanvasDrawable(canvas);
    w69b.imgtools.renderToDrawable(bitMatrix, drawable);
  };

  /**
   * @param {string} content to encode.
   * @param {!w69b.BarcodeFormat} format barcode format to encode as
   * @param {number} width width to use as svg width.
   * @param {number} height height to use as svg height.
   * @param {!Object<!w69b.EncodeHintType,*>=} opt_hints optional encoding hints
   *                                                     such as margin or
   *                                                     error correction
   * @return {string} svg source.
   * @export
   */
  w69b.encoding.drawAsSVG = function(content, format, width, height, opt_hints) {
    var bitMatrix = new w69b.MultiFormatWriter().encode(
      content, format, width, height, opt_hints);
    var drawable = new SvgDrawable();
    w69b.imgtools.renderToDrawable(bitMatrix, drawable);
    return drawable.toString();
  };

  /**
   * @param {string} content to encode.
   * @param {!w69b.BarcodeFormat} format barcode format to encode as
   * @param {number} width width to use as eps width.
   * @param {number} height height to use as eps height.
   * @param {!Object<!w69b.EncodeHintType,*>=} opt_hints optional encoding hints
   *                                                     such as margin or
   *                                                     error correction
   * @return {string} eps source.
   * @export
   */
  w69b.encoding.drawAsEPS = function(content, format, width, height, opt_hints) {
    var bitMatrix = new w69b.MultiFormatWriter().encode(
      content, format, width, height, opt_hints);
    var drawable = new EpsDrawable();
    w69b.imgtools.renderToDrawable(bitMatrix, drawable);
    return drawable.toString();
  };
});
