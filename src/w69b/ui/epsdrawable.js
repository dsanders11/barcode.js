// (c) 2013 Manuel Braun (mb@w69b.com)
goog.provide('w69b.ui.EpsDrawable');
goog.require('goog.asserts');
goog.require('w69b.ui.Drawable');

goog.scope(function() {
  /**
   * @constructor
   * @implements {w69b.ui.Drawable}
   * @export
   */
  w69b.ui.EpsDrawable = function() {
    this.buffer_ = [];
    this.bgColor_ = '1 1 1';
    this.fgColor_ = '0 0 0';
    this.prevColor_ = null;
    this.height_ = 0;
    this.width_ = 0;
  };
  const pro = w69b.ui.EpsDrawable.prototype;

  /**
   * Writes header to buffer.
   * @param {number} width width of svg.
   * @param {number} height height of svg.
   */
  pro.writeHeader = function(width, height) {
    this.buffer_.push('%!PS-Adobe-3.0 EPSF-3.0');
    this.buffer_.push('%%BoundingBox: 0 0 ' + width + ' ' + height);
    this.width_ = width;
    this.height_ = height;
  };

  /**
   * Draws rectangle to buffer.
   * @param {number} x
   * @param {number} y
   * @param {number} width
   * @param {number} height
   * @param {string} color
   * @private
   */
  pro.writeRect_ = function(x, y, width, height, color) {
    if (this.prevColor_ != color) {
      this.buffer_.push(color + ' setrgbcolor');
      this.prevColor_ = color;
    }
    // Project to eps coordinate system. (0, 0) is the bottom left corner.
    y = this.height_ - y;
    this.buffer_.push(x + ' ' + y + ' moveto');
    this.buffer_.push('0 ' + (-height) + ' rlineto ' + width +
      ' 0 rlineto 0 ' + height + ' rlineto closepath');
    this.buffer_.push('fill');
  };

  /**
   * @override
   */
  pro.fillBackground = function(width, height) {
    goog.asserts.assert(this.buffer_.length === 0);
    this.writeHeader(width, height);
    this.writeRect_(0, 0, width, height, this.bgColor_);
  };

  /**
   * @override
   */
  pro.fillBlack = function(x, y, width, height) {
    goog.asserts.assert(this.buffer_.length > 0);
    this.writeRect_(x, y, width, height, this.fgColor_);
  };

  /**
   * @override
   */
  pro.toString = function() {
    goog.asserts.assert(this.buffer_.length > 0);
    return this.buffer_.join('\n');
  };
});
