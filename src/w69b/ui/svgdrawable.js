// javascript (closure) port (c) 2013 Manuel Braun (mb@w69b.com)

const { assert } = goog.require('goog.asserts');

import { Drawable } from './drawable.js';

export class SvgDrawable extends Drawable {
  constructor() {
    super();

    this.buffer_ = [];
    this.bgStyle_ = 'white';
    this.fgStyle_ = 'black';
  }

  /**
   * Writes header to buffer.
   * @param {number} width width of svg.
   * @param {number} height height of svg.
   */
  writeHeader(width, height) {
    this.buffer_.push('<?xml version="1.0" encoding="UTF-8"?>');
    this.buffer_.push('<svg version="1.1" baseProfile="tiny" ' +
      'xmlns="http://www.w3.org/2000/svg" ' +
      'width="' + width + '" height="' + height + '"' + '>');
  }

  /**
   * Draws rectangle to buffer.
   * @param {number} x
   * @param {number} y
   * @param {number} width
   * @param {number} height
   * @param {string} color
   * @private
   */
  writeRect_(x, y, width, height, color) {
    this.buffer_.push(
      '<rect shape-rendering="optimizeSpeed" ' +
        ' x="' + x + '" y="' + y + '" width="' +
        width + '" height="' + height + '" fill="' + color + '" />');
  }

  /**
   * @override
   */
  fillBackground(width, height) {
    assert(this.buffer_.length === 0);
    this.writeHeader(width, height);
    this.writeRect_(0, 0, width, height, this.bgStyle_);
  }

  /**
   * @override
   */
  fillBlack(x, y, width, height) {
    assert(this.buffer_.length > 0);
    this.writeRect_(x, y, width, height, this.fgStyle_);
  }

  /**
   * @override
   */
  toString() {
    assert(this.buffer_.length > 0);
    return this.buffer_.join('\n') + '</svg>';
  }
}

goog.exportSymbol('w69b.ui.SvgDrawable', SvgDrawable);
