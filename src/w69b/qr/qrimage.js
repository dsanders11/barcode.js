// (c) 2013 Manuel Braun (mb@w69b.com)
goog.provide('w69b.qr.QRImage');
goog.require('w69b.LuminanceSource');


goog.scope(function() {
  var LuminanceSource = w69b.LuminanceSource;

  /** @typedef {(Uint8ClampedArray|Uint8Array)} */
  w69b.qr.ImageData;
  /**
   * Image data container with width/height.
   * @param {number} width image width in pixels.
   * @param {number} height image height in pixels.
   * @param {w69b.qr.ImageData} data data array.
   * @constructor
   * @extends {LuminanceSource}
   */
  w69b.qr.QRImage = function(width, height, data) {
    goog.base(this, width, height)

    this.data = data;
  };
  var QRImage = w69b.qr.QRImage;
  goog.inherits(QRImage, LuminanceSource);
  var pro = QRImage.prototype;

  /**
   * Get value at given position.
   * @param {number} x x pos (col).
   * @param {number} y y pos (row).
   * @return {number} value.
   */
  pro.get = function(x, y) {
    return this.data[y * this.getWidth() + x];
  };

  /**
   * @override
   */
  pro.getMatrix = function() {
    return this.data;
  };

  /**
   * @override
   */
  pro.getRow = function(y, opt_row) {
    var row;
    if (opt_row == null || opt_row.length < this.getWidth())
      row = new Uint8Array(this.getWidth());
    else
      row = opt_row;
    var offset = y * this.getWidth();
    for (var x = 0; x < this.getWidth(); ++x)
      row[x] = this.data[offset + x];
    return row;
  };

  /**
   * Get index in data for given position.
   * @param {number} x x pos (col).
   * @param {number} y y pos (row).
   * @return {number} index in data.
   */
  pro.getIndex = function(x, y) {
    return this.getWidth() * y + x;
  };

  /**
   * Set value at given position.
   * @param {number} x x pos (col).
   * @param {number} y y pos (row).
   * @param {number} value value to set.
   */
  pro.setValue = function(x, y, value) {
    this.data[y * this.getWidth() + x] = value;
  };

  /**
   * Construct Image with new empty buffer.
   * @param {number} width image width.
   * @param {number} height image height.
   * @return {w69b.qr.QRImage} image with given size and a new, empty buffer.
   */
  QRImage.newEmpty = function(width, height) {
    return new QRImage(width, height,
      new Uint8Array(new ArrayBuffer(width * height)));
  };
});
