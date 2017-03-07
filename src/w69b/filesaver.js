// (c) 2013 Manuel Braun (mb@w69b.com)
goog.provide('w69b.FileSaver');
goog.require('goog.Disposable');

goog.scope(function() {
  /**
   * @param {!Blob} blob to save.
   * @param {string} name filename.
   * @constructor
   * @extends {goog.Disposable}
   */
  w69b.FileSaver = function(blob, name) {
    // First try a.download, then web filesystem, then object URLs
    this.blob = blob;
    this.name = name;
    this.objectUrl_ = null;
  };
  var FileSaver = w69b.FileSaver;
  goog.inherits(FileSaver, goog.Disposable);
  var pro = w69b.FileSaver.prototype;

  /**
   * @param {!Blob} blob to save.
   * @param {string} name filename.
   * @export
   */
  FileSaver.saveAs = function(blob, name) {
    /** @type {function(*, string=): boolean} */
    var saveBlob = navigator['msSaveBlob'];
    if (saveBlob) {
      saveBlob.call(navigator, blob, name);
    } else {
      let saver = new FileSaver(blob, name);
      saver.save();
      window.setTimeout(function() {
        saver.dispose();
      }, 1000);
    }
  };

  /**
   * @return {boolean} weather saveAs is supported.
  */
  FileSaver.checkSupport_ = function() {
    if (!self.document) return false;
    var a = document.createElement('a');
    /** @type {function(*, string=): boolean} */
    var saveBlob = navigator['msSaveBlob'];
    return Boolean(saveBlob || ('download' in a));
  };
  FileSaver.SUPPORTED_ = FileSaver.checkSupport_();

  /**
   * @return {boolean} weather saveAs is supported.
   * @export
  */
  FileSaver.isSupported = function() {
    return FileSaver.SUPPORTED_;
  };

  /**
   * Simulate mouse click on node.
   * @param {Element} node
   * @return {boolean} false if event was cancelled
   */
  FileSaver.click = function(node) {
    var event = /** @type {MouseEvent} */ (document.createEvent('MouseEvents'));
    event.initMouseEvent('click', true, true, window,
      0, 0, 0, 0, 0, false, false, false, false, 0, null);
    return node.dispatchEvent(event); // false if event was cancelled
  };

  /**
   * Creates link and fires clickevent on it.
   * @return {boolean} false if save was cancelled
   */
  pro.save = function() {
    var a = document.createElement('a');
    if (!('download' in a))
      return false;

    if (!this.objectUrl_)
      this.objectUrl_ = window.URL.createObjectURL(this.blob);
    a.href = this.objectUrl_;
    a['download'] = this.name;
    return FileSaver.click(a);
  };

  /**
   * @override
   */
  pro.disposeInternal = function() {
    if (this.objectUrl_)
      window.URL.revokeObjectURL(this.objectUrl_);
  };
});
