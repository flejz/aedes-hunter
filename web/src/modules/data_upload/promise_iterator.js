// [avidotto]
'use strict';

/**
 * @constructor
 * Promise Iterator
 * Iterate and expect a promise on each next execution
 *
 * ex:
 *  new PromiseIterator ([1,2], function (current) {
 *    return new Promise(function (resolve, reject) {
 *      // make http request...
 *      // .then(resolve)
 *    })
 *  });
 *
 * @return Promise
 * -- fulfilled after all iterations
 */
function PromiseIterator (queue, onNext) {

  if (Object.prototype.toString.call(queue) !== '[object Array]')
    throw Error('Invalid Parameters. queue must be an Array');
  if (typeof onNext !== 'function')
    throw Error('Invalid Parameters. onNext must be a function');

  let
    results = [];

  return new Promise (function (resolve, reject) {

    function resolveNext_ (res) {
      // store response
      results.push(res);
      if (queue.length) {
        move();
      } else {
        // resolve iterator promise
        resolve({
          result: 'success',
          results: results,
          errors: []
        });
      }
    }

    function reject_ (errors) {
      let
        // force array type
        e = Object.prototype.toString.call(errors) !== '[object Array]'
            ? [ errors ]
            : errors;

      reject({
        result: 'fail',
        partialResults: results,
        errors: e
      });
    }

    function move () {
      onNext(queue.shift())
          .then(resolveNext_).catch(reject_);
    }
    // start iteration
    move();
  });
}

// Export constructor
module.exports = PromiseIterator;
