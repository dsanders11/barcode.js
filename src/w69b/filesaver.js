// (c) 2013 Manuel Braun (mb@w69b.com)

const Disposable = goog.require('goog.Disposable');

export class FileSaver extends Disposable {
  /**
   * @param {!Blob} blob to save.
   * @param {string} name filename.
   */
  constructor(blob, name) {
    super();

    // First try a.download, then web filesystem, then object URLs
    this.blob = blob;
    this.name = name;
    this.objectUrl_ = null;
  }

  /**
   * @param {!Blob} blob to save.
   * @param {string} name filename.
   */
  static saveAs(blob, name) {
    /** @type {function(*, string=): boolean} */
    const saveBlob = navigator['msSaveBlob'];
    if (saveBlob) {
      saveBlob.call(navigator, blob, name);
    } else {
      let saver = new FileSaver(blob, name);
      saver.save();
      window.setTimeout(function() {
        saver.dispose();
      }, 1000);
    }
  }

  /**
   * @return {boolean} whether saveAs is supported.
  */
  static isSupported() {
    if (!self.document) return false;
    const a = document.createElement('a');
    /** @type {?function(*, string=): boolean} */
    const saveBlob = navigator['msSaveBlob'];
    return Boolean(saveBlob || ('download' in a));
  }

  /**
   * Simulate mouse click on node.
   * @param {!Element} node
   * @return {boolean} false if event was cancelled
   */
  static click(node) {
    const event = /** @type {!MouseEvent} */ (document.createEvent('MouseEvents'));
    event.initMouseEvent('click', true, true, window,
      0, 0, 0, 0, 0, false, false, false, false, 0, null);
    return node.dispatchEvent(event); // false if event was cancelled
  }

  /**
   * Creates link and fires clickevent on it.
   * @return {boolean} false if save was cancelled
   */
  save() {
    const a = document.createElement('a');
    if (!('download' in a))
      return false;

    if (!this.objectUrl_)
      this.objectUrl_ = window.URL.createObjectURL(this.blob);
    a.href = this.objectUrl_;
    a['download'] = this.name;
    return FileSaver.click(a);
  }

  /**
   * @override
   */
  disposeInternal() {
    if (this.objectUrl_) {
      URL.revokeObjectURL(this.objectUrl_);
    }
  }
}

goog.exportSymbol('w69b.FileSaver', FileSaver);
goog.exportSymbol('w69b.FileSaver.isSupported', FileSaver.isSupported);
goog.exportSymbol('w69b.FileSaver.saveAs', FileSaver.saveAs);
