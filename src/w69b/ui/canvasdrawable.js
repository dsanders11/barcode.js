// (c) 2013 Manuel Braun (mb@w69b.com)

import { Drawable } from './drawable.js';

export class CanvasDrawable extends Drawable {
  /**
   * @param {!HTMLCanvasElement} canvas to draw on.
   */
  constructor(canvas) {
    super();

    this.canvas_ = canvas;
    this.context_ = /** @type {!CanvasRenderingContext2D} */ (canvas.getContext('2d'));
    this.bgStyle_ = 'rgb(255, 255, 255)';
    this.fgStyle_ = 'rgb(0, 0, 0)';
  }

  /**
   * @override
   */
  fillBackground(width, height) {
    this.canvas_.width = width;
    this.canvas_.height = height;
    this.context_.fillStyle = this.bgStyle_;
    this.context_.fillRect(0, 0, width, height);
  };

  /**
   * @override
   */
  fillBlack(x, y, width, height) {
    this.context_.fillStyle = this.fgStyle_;
    this.context_.fillRect(x, y, width, height);
  }
}

goog.exportSymbol('w69b.ui.CanvasDrawable', CanvasDrawable);
