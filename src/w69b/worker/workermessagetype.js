// (c) 2013 Manuel Braun (mb@w69b.com)
goog.provide('w69b.worker.WorkerMessageType');

/**
 * Constants for worker message types.
 * @enum {string}
 */
w69b.worker.WorkerMessageType = {
  DECODED: 'success',
  NOTFOUND: 'notfound',
  PATTERN: 'pattern'
};

goog.exportSymbol('w69b.worker.WorkerMessageType.DECODED',
  w69b.worker.WorkerMessageType.DECODED);
goog.exportSymbol('w69b.worker.WorkerMessageType.NOTFOUND',
  w69b.worker.WorkerMessageType.NOTFOUND);
