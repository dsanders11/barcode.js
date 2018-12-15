// (c) 2013 Manuel Braun (mb@w69b.com)

import { CanvasDrawable } from '/w69b/ui/canvasdrawable.js';
import { EpsDrawable } from '/w69b/ui/epsdrawable.js';
import { SvgDrawable } from '/w69b/ui/svgdrawable.js';
import * as imgtools from '/w69b/imgtools.js';

const MultiFormatWriter = goog.require('w69b.MultiFormatWriter');

/**
 * Simple high-level interface to create barcodes.
 */

/**
 * @param {string} content to encode.
 * @param {!w69b.BarcodeFormat} format barcode format to encode as
 * @param {!HTMLCanvasElement} canvas canvas to draw on.
 * @param {!Object<!w69b.EncodeHintType,*>=} opt_hints optional encoding hints
 *                                                     such as margin or
 *                                                     error correction
 */
export function drawOnCanvas(content, format, canvas, opt_hints) {
  const bitMatrix = new MultiFormatWriter().encode(
    content, format, canvas.width, canvas.height, opt_hints);
  const drawable = new CanvasDrawable(canvas);
  imgtools.renderToDrawable(bitMatrix, drawable);
}

/**
 * @param {string} content to encode.
 * @param {!w69b.BarcodeFormat} format barcode format to encode as
 * @param {number} width width to use as svg width.
 * @param {number} height height to use as svg height.
 * @param {!Object<!w69b.EncodeHintType,*>=} opt_hints optional encoding hints
 *                                                     such as margin or
 *                                                     error correction
 * @return {string} svg source.
 */
export function drawAsSVG(content, format, width, height, opt_hints) {
  const bitMatrix = new MultiFormatWriter().encode(
    content, format, width, height, opt_hints);
  const drawable = new SvgDrawable();
  imgtools.renderToDrawable(bitMatrix, drawable);
  return drawable.toString();
}

/**
 * @param {string} content to encode.
 * @param {!w69b.BarcodeFormat} format barcode format to encode as
 * @param {number} width width to use as eps width.
 * @param {number} height height to use as eps height.
 * @param {!Object<!w69b.EncodeHintType,*>=} opt_hints optional encoding hints
 *                                                     such as margin or
 *                                                     error correction
 * @return {string} eps source.
 */
export function drawAsEPS(content, format, width, height, opt_hints) {
  const bitMatrix = new MultiFormatWriter().encode(
    content, format, width, height, opt_hints);
  const drawable = new EpsDrawable();
  imgtools.renderToDrawable(bitMatrix, drawable);
  return drawable.toString();
}

goog.exportSymbol('w69b.encoding.drawOnCanvas', drawOnCanvas);
goog.exportSymbol('w69b.encoding.drawAsSVG', drawAsSVG);
goog.exportSymbol('w69b.encoding.drawAsEPS', drawAsEPS);
